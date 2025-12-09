import express from 'express';
import { generateToken, validatePassword } from '../middleware/auth.js';

const router = express.Router();

// Login endpoint
router.post('/login', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    if (validatePassword(password)) {
      const token = generateToken();
      return res.json({
        success: true,
        token,
        message: 'Login successful'
      });
    } else {
      return res.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Verify token endpoint
router.get('/verify', (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ valid: false });
    }
    
    const token = authHeader.substring(7);
    
    try {
      jwt.verify(token, config.jwtSecret);
      return res.json({ valid: true });
    } catch {
      return res.json({ valid: false });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
});

// Logout endpoint (client-side only, just for consistency)
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

export default router;










