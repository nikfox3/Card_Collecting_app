import jwt from 'jsonwebtoken';
import { config } from '../config.js';

// Simple admin authentication middleware
export const requireAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.admin = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Generate JWT token
export const generateToken = () => {
  return jwt.sign(
    { admin: true, timestamp: Date.now() },
    config.jwtSecret,
    { expiresIn: '24h' }
  );
};

// Validate admin password
export const validatePassword = (password) => {
  return password === config.adminPassword;
};










