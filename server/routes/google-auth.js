import express from 'express';
import { google } from 'googleapis';
import { query, get, run } from '../utils/database.js';
import crypto from 'crypto';

const router = express.Router();

// Helper function to generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Helper function to get Google OAuth credentials (called at request time, not module load time)
function getGoogleCredentials(req = null) {
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  // Build redirect URI dynamically based on request
  let GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;
  
  // Ignore ngrok URLs - they're no longer supported
  if (GOOGLE_REDIRECT_URI && (GOOGLE_REDIRECT_URI.includes('ngrok') || GOOGLE_REDIRECT_URI.includes('ngrok-free') || GOOGLE_REDIRECT_URI.includes('ngrok.io') || GOOGLE_REDIRECT_URI.includes('ngrok.app'))) {
    console.log(`⚠️ Ignoring ngrok GOOGLE_REDIRECT_URI: ${GOOGLE_REDIRECT_URI}`);
    GOOGLE_REDIRECT_URI = null;
  }
  
  // If redirect URI is set in env and not ngrok, use it (for production)
  if (GOOGLE_REDIRECT_URI) {
    // Use the configured redirect URI
    // No need to build from request
  } else if (req) {
    // If no redirect URI in env or it was ngrok, build it from request
    // This handles localhost and local network URLs
    const protocol = req.protocol || (req.get('x-forwarded-proto') || 'http');
    const host = req.get('host') || req.get('x-forwarded-host') || req.hostname || 'localhost:3001';
    GOOGLE_REDIRECT_URI = `${protocol}://${host}/api/auth/google/callback`;
    console.log(`🔐 Building redirect URI from request: ${GOOGLE_REDIRECT_URI}`);
  } else {
    // Fallback to localhost if no request available
    GOOGLE_REDIRECT_URI = 'http://localhost:3001/api/auth/google/callback';
  }
  
  // Check if credentials are valid (not placeholders)
  const isValidClientId = GOOGLE_CLIENT_ID && 
    GOOGLE_CLIENT_ID !== 'your_google_client_id_here' && 
    GOOGLE_CLIENT_ID.length > 10 &&
    !GOOGLE_CLIENT_ID.includes('your_') &&
    GOOGLE_CLIENT_ID.includes('.apps.googleusercontent.com'); // Valid Google client IDs contain this

  const isValidClientSecret = GOOGLE_CLIENT_SECRET && 
    GOOGLE_CLIENT_SECRET !== 'your_google_client_secret_here' && 
    GOOGLE_CLIENT_SECRET.length > 10 &&
    !GOOGLE_CLIENT_SECRET.includes('your_') &&
    (GOOGLE_CLIENT_SECRET.startsWith('GOCSPX-') || GOOGLE_CLIENT_SECRET.length > 20); // Valid Google secrets

  return {
    clientId: GOOGLE_CLIENT_ID,
    clientSecret: GOOGLE_CLIENT_SECRET,
    redirectUri: GOOGLE_REDIRECT_URI,
    isValid: isValidClientId && isValidClientSecret
  };
}

// Create OAuth client (will be recreated with valid credentials when needed)
let oauth2Client = null;

function getOAuth2Client(req = null) {
  // Always create a new client with request-specific redirect URI
  const creds = getGoogleCredentials(req);
  return new google.auth.OAuth2(
    creds.clientId,
    creds.clientSecret,
    creds.redirectUri
  );
}

// Get Google OAuth URL
router.get('/google', (req, res) => {
  const creds = getGoogleCredentials(req);
  
  // Check if credentials are configured and valid
  if (!creds.isValid) {
    return res.status(500).json({ 
      success: false, 
      error: 'Google OAuth not configured. Please edit server/.env and replace the placeholder values with your actual Google OAuth credentials from https://console.cloud.google.com/apis/credentials. Then restart the API server. See GOOGLE_OAUTH_SETUP.md for detailed instructions.' 
    });
  }
  
  // Log redirect URI for debugging
  console.log(`🔐 Google OAuth redirect URI: ${creds.redirectUri}`);
  
  // Create OAuth client with request-specific redirect URI
  const client = new google.auth.OAuth2(
    creds.clientId,
    creds.clientSecret,
    creds.redirectUri
  );
  
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile'
  ];
  
  const authUrl = client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
    state: req.query.state || 'login' // 'login' or 'signup'
  });
  
  res.json({ success: true, authUrl, redirectUri: creds.redirectUri });
});

// Handle Google OAuth callback
router.get('/google/callback', async (req, res) => {
  let creds = null;
  try {
    creds = getGoogleCredentials(req);
    
    console.log(`🔐 Google OAuth callback received. Redirect URI: ${creds.redirectUri}`);
    console.log(`🔐 Request host: ${req.get('host')}`);
    console.log(`🔐 Request protocol: ${req.protocol}`);
    console.log(`🔐 Request URL: ${req.url}`);
    console.log(`🔐 Full request: ${req.protocol}://${req.get('host')}${req.url}`);
    
    // Helper to get frontend URL (ignore ngrok and Google domains)
    const getFrontendUrl = () => {
      let url = process.env.FRONTEND_URL;
      if (url && (url.includes('ngrok') || url.includes('ngrok-free') || url.includes('ngrok.io') || url.includes('ngrok.app'))) {
        url = null;
      }
      if (!url) {
        const referer = req.get('referer');
        if (referer && !referer.includes('ngrok') && !referer.includes('google.com') && !referer.includes('accounts.google.com')) {
          const match = referer.match(/^(https?:\/\/[^\/]+)/);
          if (match) url = match[1];
        }
      }
      if (!url) {
        const origin = req.get('origin');
        if (origin && !origin.includes('ngrok') && !origin.includes('google.com') && !origin.includes('accounts.google.com')) {
          url = origin;
        }
      }
      return url || 'http://localhost:3000';
    };
    
    if (!creds.isValid) {
      const frontendUrl = getFrontendUrl();
      console.error('❌ Google OAuth credentials not valid');
      return res.redirect(`${frontendUrl}/login?error=oauth_not_configured`);
    }
    
    const { code, state } = req.query;
    
    if (!code) {
      const frontendUrl = getFrontendUrl();
      console.error('❌ No authorization code received');
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }
    
    console.log(`🔐 Attempting to exchange code for tokens with redirect URI: ${creds.redirectUri}`);
    
    // Create OAuth client with request-specific redirect URI
    const client = new google.auth.OAuth2(
      creds.clientId,
      creds.clientSecret,
      creds.redirectUri
    );
    
    // Exchange code for tokens
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);
    
    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: client });
    const { data } = await oauth2.userinfo.get();
    
    const googleId = data.id;
    const email = data.email;
    const fullName = data.name || '';
    const profileImage = data.picture || null;
    
    if (!email) {
      const frontendUrl = process.env.FRONTEND_URL;
      const finalUrl = (frontendUrl && !frontendUrl.includes('ngrok')) ? frontendUrl : 'http://localhost:3000';
      return res.redirect(`${finalUrl}/login?error=no_email`);
    }
    
    // Check if user exists
    let user = await get('SELECT * FROM users WHERE google_id = ? OR email = ?', [googleId, email]);
    
    if (user) {
      // User exists - update Google ID if not set
      if (!user.google_id) {
        await run(
          'UPDATE users SET google_id = ?, oauth_provider = ?, profile_image = COALESCE(?, profile_image), last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [googleId, 'google', profileImage, user.id]
        );
        user = await get('SELECT * FROM users WHERE id = ?', [user.id]);
      } else {
        // Update last login
        await run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      }
    } else {
      // New user - create account
      // Generate username from email
      const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
      let username = baseUsername;
      let counter = 1;
      
      // Ensure username is unique
      while (await get('SELECT id FROM users WHERE username = ?', [username])) {
        username = `${baseUsername}${counter}`;
        counter++;
      }
      
      // Create user
      const result = await run(`
        INSERT INTO users (email, username, google_id, oauth_provider, full_name, profile_image, joined_at, last_login)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `, [email, username, googleId, 'google', fullName, profileImage]);
      
      user = await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
    }
    
    // Create session - 30 day expiration for persistent login
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days - user stays logged in
    
    // Clean up any expired sessions for this user
    await run('DELETE FROM user_auth_sessions WHERE user_id = ? AND expires_at < CURRENT_TIMESTAMP', [user.id]);
    
    await run(`
      INSERT INTO user_auth_sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `, [user.id, sessionToken, expiresAt.toISOString()]);
    
    console.log(`✅ Session created for user ${user.id}, expires: ${expiresAt.toISOString()}`);
    
    // Redirect to frontend with session token
    // Try to detect frontend URL from referer or use env variable (ignore ngrok)
    let frontendUrl = process.env.FRONTEND_URL;
    
    // Ignore ngrok URLs - they're no longer supported
    if (frontendUrl && (frontendUrl.includes('ngrok') || frontendUrl.includes('ngrok-free') || frontendUrl.includes('ngrok.io') || frontendUrl.includes('ngrok.app'))) {
      console.log(`⚠️ Ignoring ngrok FRONTEND_URL: ${frontendUrl}`);
      frontendUrl = null;
    }
    
    if (!frontendUrl) {
      // Check referer, but ignore Google domains
      const referer = req.get('referer');
      if (referer && !referer.includes('ngrok') && !referer.includes('google.com') && !referer.includes('accounts.google.com')) {
        // Extract origin from referer (e.g., http://192.168.1.100:3000)
        const match = referer.match(/^(https?:\/\/[^\/]+)/);
        if (match) {
          frontendUrl = match[1];
        }
      }
      
      if (!frontendUrl) {
        // Check origin, but ignore Google domains
        const origin = req.get('origin');
        if (origin && !origin.includes('ngrok') && !origin.includes('google.com') && !origin.includes('accounts.google.com')) {
          frontendUrl = origin;
        }
      }
      
      if (!frontendUrl) {
        // Fallback: try to construct from request host (for same-origin requests)
        const protocol = req.protocol || 'http';
        const host = req.get('host') || req.hostname || 'localhost:3002';
        // Replace API port with frontend port
        const frontendHost = host.replace(':3002', ':3000').replace(':3001', ':3000').replace('localhost:3002', 'localhost:3000').replace('localhost:3001', 'localhost:3000');
        frontendUrl = `${protocol}://${frontendHost}`;
      }
    }
    
    // Final fallback to localhost
    if (!frontendUrl || frontendUrl.includes('ngrok') || frontendUrl.includes('google.com')) {
      frontendUrl = 'http://localhost:3000';
    }
    
    console.log(`✅ Redirecting to frontend: ${frontendUrl}/auth/google/success?token=${sessionToken.substring(0, 10)}...`);
    res.redirect(`${frontendUrl}/auth/google/success?token=${sessionToken}`);
    
  } catch (error) {
    console.error('❌ Google OAuth callback error:', error);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      redirectUri: creds?.redirectUri,
      requestHost: req.get('host'),
      requestProtocol: req.protocol,
      hasCode: !!req.query.code,
      hasState: !!req.query.state
    });
    
    // Try to get frontend URL for redirect
    let frontendUrl = process.env.FRONTEND_URL;
    // Ignore ngrok URLs
    if (frontendUrl && (frontendUrl.includes('ngrok') || frontendUrl.includes('ngrok-free') || frontendUrl.includes('ngrok.io') || frontendUrl.includes('ngrok.app'))) {
      frontendUrl = null;
    }
    if (!frontendUrl) {
      // Try to detect from request
      const referer = req.get('referer');
      if (referer && !referer.includes('ngrok') && !referer.includes('google.com')) {
        const match = referer.match(/^(https?:\/\/[^\/]+)/);
        if (match) {
          frontendUrl = match[1];
        }
      }
      if (!frontendUrl) {
        const origin = req.get('origin');
        if (origin && !origin.includes('ngrok') && !origin.includes('google.com')) {
          frontendUrl = origin;
        }
      }
      // Default to Vercel PWA if we can't detect
      if (!frontendUrl) {
        frontendUrl = 'https://cardstax.vercel.app';
      }
    }
    
    // Log the redirect URL we're using
    console.error(`❌ Redirecting to frontend: ${frontendUrl}/login?error=oauth_failed`);
    
    // Redirect with error details
    const errorMessage = error.message || 'Unknown error';
    res.redirect(`${frontendUrl}/login?error=oauth_failed&details=${encodeURIComponent(errorMessage)}`);
  }
});

// Verify Google token (for frontend to verify session)
router.post('/google/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }
    
    // Verify session token
    const session = await get(`
      SELECT u.*, s.expires_at
      FROM user_auth_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ? AND s.expires_at > CURRENT_TIMESTAMP
    `, [token]);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    
    res.json({
      success: true,
      user: {
        id: session.id,
        email: session.email,
        username: session.username,
        fullName: session.full_name,
        profileImage: session.profile_image,
        isPro: session.is_pro === 1,
        proExpiresAt: session.pro_expires_at,
        joinedAt: session.joined_at
      },
      sessionToken: token
    });
  } catch (error) {
    console.error('Google verify error:', error);
    res.status(500).json({ error: 'Failed to verify token' });
  }
});

export default router;

