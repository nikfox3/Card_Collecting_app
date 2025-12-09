import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import express from 'express';

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });
import cors from 'cors';
import { config } from './config.js';
import { initializeAnalyticsTables } from './utils/database.js';

// Import routes
import authRoutes from './routes/auth.js';
import googleAuthRoutes from './routes/google-auth.js';
import adminRoutes from './routes/admin.js';
import analyticsRoutes from './routes/analytics.js';
import cardsRoutes from './routes/cards.js';
import usersRoutes from './routes/users.js';
import setsRoutes from './routes/sets-tcgcsv.js';
import pricingMonitorRoutes from './routes/pricing-monitor.js';
import decksRoutes from './routes/decks.js';
import bindersRoutes from './routes/binders.js';
import pokemonPriceTrackerRoutes from './routes/pokemon-price-tracker.js';
import communityRoutes from './routes/community.js';
import wishlistRoutes from './routes/wishlist.js';
import settingsRoutes from './routes/settings.js';
import helpRoutes from './routes/help.js';
import stripeRoutes from './routes/stripe.js';
import imageRoutes from './routes/images.js';
import marketplaceRoutes from './routes/marketplace.js';

const app = express();

// Middleware
// Allow connections from localhost, local network, and production domains
const allowedOrigins = [
  config.corsOrigin,
  'http://localhost:3000',
  'http://localhost:3002',
  'http://localhost:3003',
  'http://localhost:3004',
  'http://localhost:5173',
  'http://localhost:5174',
  // Allow Vercel deployments
  /^https:\/\/.*\.vercel\.app$/,
  /^https:\/\/.*\.vercel\.com$/,
  // Allow any local network IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x)
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
  /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:\d+$/
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ CORS: Allowing request with no origin');
      return callback(null, true);
    }
    
    console.log(`🔍 CORS check for origin: ${origin}`);
    
    // Check if origin matches any allowed pattern
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        const matches = origin === allowed;
        if (matches) console.log(`✅ CORS: Matched string pattern: ${allowed}`);
        return matches;
      } else if (allowed instanceof RegExp) {
        const matches = allowed.test(origin);
        if (matches) console.log(`✅ CORS: Matched regex pattern: ${allowed}`);
        return matches;
      }
      return false;
    });
    
    if (isAllowed) {
      console.log(`✅ CORS: Allowing origin: ${origin}`);
      callback(null, true);
    } else {
      console.log(`❌ CORS blocked origin: ${origin}`);
      console.log(`📋 Allowed origins:`, allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static images from public/images directory (if it exists)
try {
  app.use('/images', express.static(join(__dirname, '../public/images')));
} catch (err) {
  console.log('⚠️  Public images directory not found, skipping static image serving');
}

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cards', cardsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/sets', setsRoutes);
app.use('/api/pricing-monitor', pricingMonitorRoutes);
app.use('/api/decks', decksRoutes);
app.use('/api/binders', bindersRoutes);
app.use('/api/pokemon-price-tracker', pokemonPriceTrackerRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/help', helpRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    port: config.port,
    environment: config.nodeEnv
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Initialize database tables (with error handling)
try {
  initializeAnalyticsTables();
  console.log('✅ Database initialized successfully');
} catch (err) {
  console.error('⚠️  Database initialization error (non-fatal):', err.message);
  // Continue anyway - database might be created on first use
}

// Start server
const PORT = config.port || process.env.PORT || 3002;
const HOST = process.env.HOST || '0.0.0.0';

// Listen on all interfaces (0.0.0.0) to allow access from mobile devices on the same network
app.listen(PORT, HOST, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║  🎴 CardStax API Server                              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n🚀 Server running on http://${HOST}:${PORT}`);
  console.log(`📊 Environment: ${config.nodeEnv}`);
  console.log(`🗄️  Database: ${config.databasePath}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   • POST /api/auth/login - Admin login`);
  console.log(`   • POST /api/users/register - User registration`);
  console.log(`   • POST /api/users/login - User login`);
  console.log(`   • GET  /api/users/me - Get current user`);
  console.log(`   • GET  /api/admin/* - Admin routes (protected)`);
  console.log(`   • POST /api/analytics/track - Event tracking`);
  console.log(`   • GET  /api/cards/* - Card data (public)`);
  console.log(`   • GET  /api/sets/* - Set data (public)`);
  console.log(`   • GET  /api/pricing-monitor/* - Pricing monitoring (admin)`);
  console.log(`   • GET  /api/pokemon-price-tracker/* - Pokemon Price Tracker API`);
  console.log(`   • GET  /api/images/cards/:productId - Serve card images`);
  console.log(`   • GET  /api/decks/* - Deck management`);
  console.log(`   • GET  /api/binders/* - Binder management`);
  console.log(`   • GET  /api/community/* - Community posts and social features`);
  console.log(`   • GET  /api/wishlist/* - Wishlist management`);
  console.log(`   • GET  /api/settings/* - User settings and CSV import`);
  console.log(`   • GET  /api/help/* - Help center and support tickets`);
  console.log(`   • GET  /api/auth/google - Get Google OAuth URL`);
  console.log(`   • GET  /api/auth/google/callback - Google OAuth callback`);
  console.log(`   • POST /api/auth/google/verify - Verify Google OAuth token`);
  console.log(`   • GET  /health - Health check`);
  console.log(`\n✅ Server ready!\n`);
});

// Handle uncaught errors gracefully
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  // Don't exit - let Railway handle restarts
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let Railway handle restarts
});

export default app;
