# Stripe Payment Integration Setup Guide

## Overview
This app now includes Stripe payment integration for Pro membership subscriptions. Pro members get:
- **Unlimited decks** (free users limited to 1 deck)
- **Unlimited binders** (free users limited to 1 binder)
- **Unlimited pages per binder** (free users limited to 8 pages)

## Environment Variables

The Stripe keys have been added to your `server/.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_51SRPeuJXTqEV7d47vCjxWDw1Exo2Ms3763dptEYMyjn8KMgrC92Kr83y6pLbK4PU8gmM6XrirdhbmKsJOQVOerVn00TGRoHon6
STRIPE_WEBHOOK_SECRET=whsec_1Iq5kVDobGbXWdlmPx06iGMgh5Poynxy
FRONTEND_URL=http://localhost:3000
```

**Note**: The publishable key (`pk_test_...`) is not needed in the backend since we're using Stripe Checkout (hosted payment page). If you need it in the frontend for future features, you can add it to a frontend `.env` file.

## Stripe Setup Steps

### 1. Create a Stripe Account
1. Go to https://stripe.com and create an account
2. Navigate to the Dashboard

### 2. Get Your API Keys
1. Go to **Developers** → **API keys**
2. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
3. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
4. Add the secret key to `server/.env` as `STRIPE_SECRET_KEY`

### 3. Set Up Webhooks (for Production)
1. Go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. Set endpoint URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the **Signing secret** and add to `server/.env` as `STRIPE_WEBHOOK_SECRET`

### 4. Test Mode
- Use test keys (`sk_test_...`) for development
- Use test card numbers from Stripe docs: https://stripe.com/docs/testing
- Example test card: `4242 4242 4242 4242` (any future expiry, any CVC)

## API Endpoints

### Create Checkout Session
```
POST /api/stripe/create-checkout-session
Headers:
  x-user-id: <user_id>
```

Returns:
```json
{
  "success": true,
  "sessionId": "cs_...",
  "url": "https://checkout.stripe.com/..."
}
```

### Get Subscription Status
```
GET /api/stripe/subscription-status
Headers:
  x-user-id: <user_id>
```

Returns:
```json
{
  "success": true,
  "isPro": true,
  "expiresAt": "2024-12-31T23:59:59.000Z"
}
```

### Webhook Handler
```
POST /api/stripe/webhook
Headers:
  stripe-signature: <signature>
```

## Pro Membership Limits

### Free Users
- **Decks**: 1 deck maximum
- **Binders**: 1 binder maximum
- **Pages**: 8 pages per binder maximum

### Pro Users ($9.99/month)
- **Decks**: Unlimited
- **Binders**: Unlimited
- **Pages**: Unlimited per binder

## Testing

1. **Test Deck Limit**:
   - Create a deck as a free user
   - Try to create a second deck → should show upgrade modal

2. **Test Binder Limit**:
   - Create a binder as a free user
   - Try to create a second binder → should show upgrade modal

3. **Test Page Limit**:
   - Create a binder as a free user
   - Add 8 pages
   - Try to add a 9th page → should show upgrade modal

4. **Test Payment Flow**:
   - Click "Upgrade to Pro" in the modal
   - Use test card: `4242 4242 4242 4242`
   - Complete checkout
   - Verify pro status is activated

## Database Schema

The `users` table includes:
- `is_pro` (BOOLEAN): Whether user has pro membership
- `pro_expires_at` (TIMESTAMP): When pro membership expires (null for lifetime)

## Notes

- The webhook handler automatically activates/deactivates pro membership based on subscription status
- Pro membership expires based on `pro_expires_at` date
- Users can cancel their subscription through Stripe's customer portal (can be added later)

