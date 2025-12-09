// Image serving routes
// Serves locally stored card images

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, get } from '../utils/database.js';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Serve card images by product ID
router.get('/cards/:productId', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    // Get card info from database
    const card = await get(`
      SELECT product_id, name, local_image_url, image_url
      FROM products
      WHERE product_id = ?
    `, [productId]);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    // Try local image first
    if (card.local_image_url) {
      const localPath = path.resolve(__dirname, '../../public', card.local_image_url);
      if (fs.existsSync(localPath)) {
        return res.sendFile(localPath);
      }
    }
    
    // Fallback to external URL (redirect)
    if (card.image_url) {
      return res.redirect(card.image_url);
    }
    
    res.status(404).json({ error: 'Image not found' });
  } catch (error) {
    console.error('Error serving image:', error);
    res.status(500).json({ error: 'Failed to serve image' });
  }
});

// Get image URL for a card (returns local if available, external otherwise)
router.get('/cards/:productId/url', async (req, res) => {
  try {
    const productId = req.params.productId;
    
    const card = await get(`
      SELECT product_id, local_image_url, image_url
      FROM products
      WHERE product_id = ?
    `, [productId]);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    if (card.local_image_url) {
      const localPath = path.resolve(__dirname, '../../public', card.local_image_url);
      if (fs.existsSync(localPath)) {
        return res.json({ 
          url: `${req.protocol}://${req.get('host')}${card.local_image_url}`,
          local: true 
        });
      }
    }
    
    if (card.image_url) {
      return res.json({ 
        url: card.image_url,
        local: false 
      });
    }
    
    res.status(404).json({ error: 'Image not found' });
  } catch (error) {
    console.error('Error getting image URL:', error);
    res.status(500).json({ error: 'Failed to get image URL' });
  }
});

// Batch get image URLs for multiple cards
router.post('/cards/batch-urls', async (req, res) => {
  try {
    const { productIds } = req.body;
    
    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: 'productIds array required' });
    }
    
    const placeholders = productIds.map(() => '?').join(',');
    const cards = await query(`
      SELECT product_id, local_image_url, image_url
      FROM products
      WHERE product_id IN (${placeholders})
    `, productIds);
    
    const imageUrls = {};
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    
    for (const card of cards) {
      if (card.local_image_url) {
        const localPath = path.resolve(__dirname, '../../public', card.local_image_url);
        if (fs.existsSync(localPath)) {
          imageUrls[card.product_id] = {
            url: `${baseUrl}${card.local_image_url}`,
            local: true
          };
          continue;
        }
      }
      
      if (card.image_url) {
        imageUrls[card.product_id] = {
          url: card.image_url,
          local: false
        };
      }
    }
    
    res.json({ imageUrls });
  } catch (error) {
    console.error('Error getting batch image URLs:', error);
    res.status(500).json({ error: 'Failed to get image URLs' });
  }
});

export default router;

