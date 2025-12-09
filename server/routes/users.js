import express from 'express';
import crypto from 'crypto';
import { query, get, run } from '../utils/database.js';

const router = express.Router();

// Helper function to hash passwords
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

// Helper function to verify passwords
function verifyPassword(password, storedHash) {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

// Helper function to generate session token
function generateSessionToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, fullName } = req.body;
    
    // Validation
    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Email, username, and password are required' });
    }
    
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }
    
    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }
    
    // Check if email already exists
    const existingEmail = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    // Check if username already exists
    const existingUsername = await get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }
    
    // Hash password
    const passwordHash = hashPassword(password);
    
    // Create user
    const result = await run(`
      INSERT INTO users (email, username, password_hash, full_name, joined_at, last_login)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `, [email, username, passwordHash, fullName || username]);
    
    const userId = result.lastID;
    
    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    await run(`
      INSERT INTO user_auth_sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `, [userId, sessionToken, expiresAt.toISOString()]);
    
    // Get user data
    const user = await get(`
      SELECT id, email, username, full_name, profile_image, is_pro, joined_at
      FROM users WHERE id = ?
    `, [userId]);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        profileImage: user.profile_image,
        isPro: user.is_pro === 1,
        joinedAt: user.joined_at
      },
      sessionToken
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Get user
    const user = await get('SELECT * FROM users WHERE email = ?', [email]);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Update last login
    await run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
    
    // Create session
    const sessionToken = generateSessionToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days
    
    // Clean up old sessions for this user
    await run('DELETE FROM user_auth_sessions WHERE user_id = ? AND expires_at < CURRENT_TIMESTAMP', [user.id]);
    
    await run(`
      INSERT INTO user_auth_sessions (user_id, session_token, expires_at)
      VALUES (?, ?, ?)
    `, [user.id, sessionToken, expiresAt.toISOString()]);
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        profileImage: user.profile_image,
        isPro: user.is_pro === 1,
        proExpiresAt: user.pro_expires_at,
        joinedAt: user.joined_at
      },
      sessionToken
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { sessionToken } = req.body;
    
    if (sessionToken) {
      await run('DELETE FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error logging out:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Get current user (from session token)
router.get('/me', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify session
    const session = await get(`
      SELECT user_id, expires_at FROM user_auth_sessions WHERE session_token = ?
    `, [sessionToken]);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Check if expired
    const expiresAt = new Date(session.expires_at);
    const now = new Date();
    if (expiresAt < now) {
      // Session expired - clean it up
      await run('DELETE FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
      return res.status(401).json({ error: 'Session expired' });
    }
    
    // Auto-extend session on activity (keeps users logged in as long as they're active)
    // If session expires in less than 7 days, extend it to 30 days from now
    const daysUntilExpiry = (expiresAt - now) / (1000 * 60 * 60 * 24);
    if (daysUntilExpiry < 7) {
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + 30);
      await run(
        'UPDATE user_auth_sessions SET expires_at = ? WHERE session_token = ?',
        [newExpiresAt.toISOString(), sessionToken]
      );
      console.log(`✅ Session extended for user ${session.user_id}, new expiry: ${newExpiresAt.toISOString()}`);
    }
    
    // Get user data
    const user = await get(`
      SELECT id, email, username, full_name, profile_image, cover_image, tagline, about_me, social_links, collecting_goals, is_pro, pro_expires_at, joined_at
      FROM users WHERE id = ?
    `, [session.user_id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Parse JSON fields
    let socialLinks = {};
    let collectingGoals = [];
    try {
      if (user.social_links) {
        socialLinks = typeof user.social_links === 'string' ? JSON.parse(user.social_links) : user.social_links;
      }
      if (user.collecting_goals) {
        collectingGoals = typeof user.collecting_goals === 'string' ? JSON.parse(user.collecting_goals) : user.collecting_goals;
      }
    } catch (e) {
      console.error('Error parsing user profile JSON fields:', e);
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        profileImage: user.profile_image,
        coverImage: user.cover_image,
        tagline: user.tagline,
        aboutMe: user.about_me,
        socialLinks: socialLinks,
        collectingGoals: collectingGoals,
        isPro: user.is_pro === 1,
        proExpiresAt: user.pro_expires_at,
        joinedAt: user.joined_at
      }
    });
  } catch (error) {
    console.error('Error getting user:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Update user profile
router.put('/profile', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Verify session
    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const { fullName, username, profileImage, coverImage, tagline, aboutMe, socialLinks, collectingGoals } = req.body;
    
    const updates = [];
    const values = [];
    
    if (fullName !== undefined) {
      updates.push('full_name = ?');
      values.push(fullName);
    }
    
    if (username !== undefined) {
      // Trim and validate username
      const trimmedUsername = username.trim();
      
      // Basic validation: username should not be empty and should be alphanumeric with underscores/hyphens
      if (!trimmedUsername || trimmedUsername.length === 0) {
        return res.status(400).json({ error: 'Username cannot be empty' });
      }
      
      if (trimmedUsername.length < 3) {
        return res.status(400).json({ error: 'Username must be at least 3 characters long' });
      }
      
      if (trimmedUsername.length > 50) {
        return res.status(400).json({ error: 'Username must be 50 characters or less' });
      }
      
      // Check for valid characters (alphanumeric, underscore, hyphen)
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        return res.status(400).json({ error: 'Username can only contain letters, numbers, underscores, and hyphens' });
      }
      
      // Check if username is already taken by another user (case-insensitive)
      const existingUser = await get(
        'SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?', 
        [trimmedUsername, session.user_id]
      );
      if (existingUser) {
        return res.status(400).json({ error: 'Username already taken. Please choose a different username.' });
      }
      
      updates.push('username = ?');
      values.push(trimmedUsername);
    }
    
    if (profileImage !== undefined) {
      updates.push('profile_image = ?');
      values.push(profileImage);
    }
    
    if (coverImage !== undefined) {
      updates.push('cover_image = ?');
      values.push(coverImage);
    }
    
    if (tagline !== undefined) {
      updates.push('tagline = ?');
      values.push(tagline);
    }
    
    if (aboutMe !== undefined) {
      updates.push('about_me = ?');
      values.push(aboutMe);
    }
    
    if (socialLinks !== undefined) {
      updates.push('social_links = ?');
      values.push(JSON.stringify(socialLinks));
    }
    
    if (collectingGoals !== undefined) {
      updates.push('collecting_goals = ?');
      values.push(JSON.stringify(collectingGoals));
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updates.push('updated_at = CURRENT_TIMESTAMP');
    values.push(session.user_id);
    
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    
    // Get updated user
    const user = await get(`
      SELECT id, email, username, full_name, profile_image, cover_image, tagline, about_me, social_links, collecting_goals, is_pro, pro_expires_at, joined_at
      FROM users WHERE id = ?
    `, [session.user_id]);
    
    // Parse JSON fields (use different variable names to avoid conflict with req.body destructuring)
    let parsedSocialLinks = {};
    let parsedCollectingGoals = [];
    try {
      if (user.social_links) {
        parsedSocialLinks = typeof user.social_links === 'string' ? JSON.parse(user.social_links) : user.social_links;
      }
      if (user.collecting_goals) {
        parsedCollectingGoals = typeof user.collecting_goals === 'string' ? JSON.parse(user.collecting_goals) : user.collecting_goals;
      }
    } catch (e) {
      console.error('Error parsing user profile JSON fields:', e);
    }
    
    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        fullName: user.full_name,
        profileImage: user.profile_image,
        coverImage: user.cover_image,
        tagline: user.tagline,
        aboutMe: user.about_me,
        socialLinks: parsedSocialLinks,
        collectingGoals: parsedCollectingGoals,
        isPro: user.is_pro === 1,
        proExpiresAt: user.pro_expires_at,
        joinedAt: user.joined_at
      }
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Get user stats (collection value, card count, etc.)
router.get('/stats', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    // Get collection stats
    const stats = await get(`
      SELECT 
        COUNT(DISTINCT uc.card_id) as total_cards,
        SUM(uc.quantity) as total_quantity,
        SUM(c.current_value * uc.quantity) as total_value
      FROM user_collections uc
      LEFT JOIN cards c ON uc.card_id = c.id
      WHERE uc.user_id = ?
    `, [session.user_id]);
    
    // Get wishlist count
    const wishlistCount = await get(`
      SELECT COUNT(*) as count FROM user_wishlists WHERE user_id = ?
    `, [session.user_id]);
    
    // Get follower/following counts
    const followerCount = await get(`
      SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?
    `, [session.user_id]);
    
    const followingCount = await get(`
      SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?
    `, [session.user_id]);
    
    res.json({
      success: true,
      stats: {
        totalCards: stats.total_cards || 0,
        totalQuantity: stats.total_quantity || 0,
        totalValue: stats.total_value || 0,
        wishlistCount: wishlistCount.count || 0,
        followers: followerCount.count || 0,
        following: followingCount.count || 0
      }
    });
  } catch (error) {
    console.error('Error getting user stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get user profile by username (public)
router.get('/profile/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Get user by username
    const user = await get(`
      SELECT id, username, full_name, profile_image, is_pro, joined_at
      FROM users WHERE username = ?
    `, [username]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if profile is public
    const settings = await get('SELECT is_public FROM user_profile_settings WHERE user_id = ?', [user.id]);
    if (settings && !settings.is_public) {
      return res.status(403).json({ error: 'Profile is private' });
    }
    
    // Get follower/following counts
    const followerCount = await get('SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?', [user.id]);
    const followingCount = await get('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?', [user.id]);
    
    // Get collection stats
    const collectionStats = await get(`
      SELECT 
        COUNT(DISTINCT card_id) as total_cards,
        SUM(quantity) as total_quantity,
        SUM(c.current_value * uc.quantity) as total_value
      FROM user_collections uc
      LEFT JOIN cards c ON uc.card_id = c.id
      WHERE uc.user_id = ?
    `, [user.id]);
    
    res.json({
      success: true,
      profile: {
        id: user.id,
        username: user.username,
        fullName: user.full_name,
        profileImage: user.profile_image,
        isPro: user.is_pro === 1,
        joinedAt: user.joined_at,
        followers: followerCount.count || 0,
        following: followingCount.count || 0,
        stats: {
          totalCards: collectionStats.total_cards || 0,
          totalQuantity: collectionStats.total_quantity || 0,
          totalValue: collectionStats.total_value || 0
        }
      }
    });
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Follow a user
router.post('/follow/:userId', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const { userId } = req.params;
    const followerId = session.user_id;
    const followingId = parseInt(userId);
    
    // Can't follow yourself
    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }
    
    // Check if user to follow exists
    const userToFollow = await get('SELECT id FROM users WHERE id = ?', [followingId]);
    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if already following
    const existing = await get('SELECT id FROM user_follows WHERE follower_id = ? AND following_id = ?', [followerId, followingId]);
    if (existing) {
      return res.status(400).json({ error: 'Already following this user' });
    }
    
    // Create follow relationship
    await run(`
      INSERT INTO user_follows (follower_id, following_id)
      VALUES (?, ?)
    `, [followerId, followingId]);
    
    // Create activity
    await run(`
      INSERT INTO user_activity (user_id, activity_type, metadata)
      VALUES (?, ?, ?)
    `, [followerId, 'follow', JSON.stringify({ followedUserId: followingId })]);
    
    // Get updated counts
    const followerCount = await get('SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?', [followingId]);
    const followingCount = await get('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?', [followerId]);
    
    res.json({
      success: true,
      followers: followerCount.count || 0,
      following: followingCount.count || 0
    });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/follow/:userId', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const { userId } = req.params;
    const followerId = session.user_id;
    const followingId = parseInt(userId);
    
    // Delete follow relationship
    const result = await run(`
      DELETE FROM user_follows 
      WHERE follower_id = ? AND following_id = ?
    `, [followerId, followingId]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Not following this user' });
    }
    
    // Get updated counts
    const followerCount = await get('SELECT COUNT(*) as count FROM user_follows WHERE following_id = ?', [followingId]);
    const followingCount = await get('SELECT COUNT(*) as count FROM user_follows WHERE follower_id = ?', [followerId]);
    
    res.json({
      success: true,
      followers: followerCount.count || 0,
      following: followingCount.count || 0
    });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get followers list
router.get('/followers', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const followers = await query(`
      SELECT 
        u.id, u.username, u.full_name, u.profile_image, u.is_pro,
        uf.created_at as followed_at
      FROM user_follows uf
      JOIN users u ON uf.follower_id = u.id
      WHERE uf.following_id = ?
      ORDER BY uf.created_at DESC
    `, [session.user_id]);
    
    res.json({
      success: true,
      followers: followers.map(f => ({
        id: f.id,
        username: f.username,
        fullName: f.full_name,
        profileImage: f.profile_image,
        isPro: f.is_pro === 1,
        followedAt: f.followed_at
      }))
    });
  } catch (error) {
    console.error('Error getting followers:', error);
    res.status(500).json({ error: 'Failed to get followers' });
  }
});

// Get following list
router.get('/following', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const following = await query(`
      SELECT 
        u.id, u.username, u.full_name, u.profile_image, u.is_pro,
        uf.created_at as followed_at
      FROM user_follows uf
      JOIN users u ON uf.following_id = u.id
      WHERE uf.follower_id = ?
      ORDER BY uf.created_at DESC
    `, [session.user_id]);
    
    res.json({
      success: true,
      following: following.map(f => ({
        id: f.id,
        username: f.username,
        fullName: f.full_name,
        profileImage: f.profile_image,
        isPro: f.is_pro === 1,
        followedAt: f.followed_at
      }))
    });
  } catch (error) {
    console.error('Error getting following:', error);
    res.status(500).json({ error: 'Failed to get following' });
  }
});

// Check if following a specific user
router.get('/following/:userId', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ?', [sessionToken]);
    if (!session) {
      return res.status(401).json({ error: 'Invalid session' });
    }
    
    const { userId } = req.params;
    
    const isFollowing = await get(`
      SELECT id FROM user_follows 
      WHERE follower_id = ? AND following_id = ?
    `, [session.user_id, userId]);
    
    res.json({
      success: true,
      isFollowing: !!isFollowing
    });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get user's pricing alerts
router.get('/pricing-alerts', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Session token required' });
    }

    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ? AND expires_at > datetime("now")', [sessionToken]);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const alerts = await query(`
      SELECT 
        id,
        card_id,
        card_name,
        set_name,
        rarity,
        card_number,
        image_url,
        alert_price,
        alert_type,
        notes,
        is_active,
        created_at
      FROM user_pricing_alerts 
      WHERE user_id = ? AND is_active = TRUE
      ORDER BY created_at DESC
    `, [session.user_id]);

    res.json({ success: true, alerts });
  } catch (error) {
    console.error('Error fetching pricing alerts:', error);
    res.status(500).json({ error: 'Failed to fetch pricing alerts' });
  }
});

// Create new pricing alert
router.post('/pricing-alerts', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Session token required' });
    }

    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ? AND expires_at > datetime("now")', [sessionToken]);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { cardId, cardName, setName, rarity, cardNumber, imageUrl, alertPrice, alertType, notes } = req.body;
    
    if (!cardId || !cardName || !alertPrice || !alertType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await run(`
      INSERT INTO user_pricing_alerts 
      (user_id, card_id, card_name, set_name, rarity, card_number, image_url, alert_price, alert_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [session.user_id, cardId, cardName, setName, rarity, cardNumber, imageUrl, alertPrice, alertType, notes]);

    res.json({ success: true, alertId: result.lastInsertRowid });
  } catch (error) {
    console.error('Error creating pricing alert:', error);
    res.status(500).json({ error: 'Failed to create pricing alert' });
  }
});

// Delete pricing alert
router.delete('/pricing-alerts/:alertId', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Session token required' });
    }

    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ? AND expires_at > datetime("now")', [sessionToken]);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const { alertId } = req.params;

    const result = await run(`
      DELETE FROM user_pricing_alerts 
      WHERE id = ? AND user_id = ?
    `, [alertId, session.user_id]);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Pricing alert not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting pricing alert:', error);
    res.status(500).json({ error: 'Failed to delete pricing alert' });
  }
});

// Get set progression (for logged in user)
router.get('/set-progression', async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({ error: 'Session token required' });
    }

    const session = await get('SELECT user_id FROM user_auth_sessions WHERE session_token = ? AND expires_at > datetime("now")', [sessionToken]);
    
    if (!session) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    // For now, return empty array since we need to implement localStorage-based progression
    // The frontend will handle this by calculating progression from localStorage data
    res.json({ success: true, sets: [] });
  } catch (error) {
    console.error('Error fetching set progression:', error);
    res.status(500).json({ error: 'Failed to fetch set progression' });
  }
});

export default router;
