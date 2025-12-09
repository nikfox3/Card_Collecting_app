import express from 'express';
import Stripe from 'stripe';
import { get, run, query } from '../utils/database.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Initialize Stripe only if API key is provided
let stripe = null;
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY.trim() !== '') {
  try {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
    });
    console.log('✅ Stripe initialized');
  } catch (error) {
    console.warn('⚠️  Stripe initialization failed:', error.message);
  }
} else {
  console.warn('⚠️  Stripe not configured - STRIPE_SECRET_KEY not set. Stripe features will be disabled.');
}

// Helper function to get user ID from request
const getUserId = (req) => {
  // Try to get from session token first
  const sessionToken = req.headers.authorization?.replace('Bearer ', '');
  if (sessionToken) {
    // In a real app, you'd verify the session token and get user ID
    // For now, we'll use the x-user-id header as fallback
  }
  return req.headers['x-user-id'] || req.headers['user-id'] || null;
};

// Create Stripe checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.' });
    }

    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get user info to verify they exist
    const user = await get('SELECT id, email FROM users WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Pokemon Card Collector Pro',
              description: 'Unlimited decks, unlimited binders, and all premium features',
            },
            unit_amount: 999, // $9.99 in cents
            recurring: {
              interval: 'month', // Monthly subscription
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${(process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('ngrok')) ? process.env.FRONTEND_URL : 'http://localhost:3000'}/pro/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${(process.env.FRONTEND_URL && !process.env.FRONTEND_URL.includes('ngrok')) ? process.env.FRONTEND_URL : 'http://localhost:3000'}/pro/cancel`,
      client_reference_id: userId,
      customer_email: user.email,
      metadata: {
        user_id: userId,
      },
    });

    res.json({ 
      success: true, 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler (for production)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  if (!stripe) {
    return res.status(503).json({ error: 'Stripe is not configured' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      await handleCheckoutCompleted(session);
      break;
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object;
      await handleSubscriptionUpdate(subscription);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object;
      await handleSubscriptionDeleted(deletedSubscription);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// Handle checkout completion
async function handleCheckoutCompleted(session) {
  try {
    const userId = session.client_reference_id || session.metadata?.user_id;
    if (!userId) {
      console.error('No user ID in checkout session');
      return;
    }

    // Activate pro membership
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1); // 1 month from now

    await run(
      'UPDATE users SET is_pro = 1, pro_expires_at = ? WHERE id = ?',
      [expiresAt.toISOString(), userId]
    );

    console.log(`✅ Pro membership activated for user ${userId}`);
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

// Handle subscription update
async function handleSubscriptionUpdate(subscription) {
  try {
    const userId = subscription.metadata?.user_id;
    if (!userId) {
      console.error('No user ID in subscription');
      return;
    }

    const expiresAt = new Date(subscription.current_period_end * 1000);

    await run(
      'UPDATE users SET is_pro = 1, pro_expires_at = ? WHERE id = ?',
      [expiresAt.toISOString(), userId]
    );

    console.log(`✅ Pro membership updated for user ${userId}, expires: ${expiresAt.toISOString()}`);
  } catch (error) {
    console.error('Error handling subscription update:', error);
  }
}

// Handle subscription deletion
async function handleSubscriptionDeleted(subscription) {
  try {
    const userId = subscription.metadata?.user_id;
    if (!userId) {
      console.error('No user ID in subscription');
      return;
    }

    await run(
      'UPDATE users SET is_pro = 0, pro_expires_at = NULL WHERE id = ?',
      [userId]
    );

    console.log(`✅ Pro membership deactivated for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

// Get user's subscription status
router.get('/subscription-status', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const user = await get(
      'SELECT is_pro, pro_expires_at FROM users WHERE id = ?',
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isPro = user.is_pro === 1 || user.is_pro === true;
    let isActive = false;
    let expiresAt = null;

    if (isPro && user.pro_expires_at) {
      const expirationDate = new Date(user.pro_expires_at);
      const now = new Date();
      isActive = expirationDate > now;
      expiresAt = user.pro_expires_at;
    } else if (isPro) {
      // No expiration date means lifetime pro (or handle based on your logic)
      isActive = true;
    }

    res.json({
      success: true,
      isPro: isActive,
      expiresAt: expiresAt,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

export default router;

