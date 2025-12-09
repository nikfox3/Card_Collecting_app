import express from 'express';
import { query, get, run } from '../utils/database.js';

const router = express.Router();

// Get user's wishlist
router.get('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { limit = 100, offset = 0 } = req.query;
    
    // Check if user_wishlists table exists
    try {
      // Get wishlist items with card details
      const wishlistItems = await query(`
        SELECT 
          w.id,
          w.card_id,
          w.priority,
          w.max_price,
          w.notes,
          w.added_at,
          p.name,
          p.clean_name,
          p.image_url,
          g.name as set_name,
          p.ext_number,
          p.ext_rarity,
          p.market_price,
          p.low_price,
          p.mid_price,
          p.high_price,
          p.artist,
          p.url
        FROM user_wishlists w
        LEFT JOIN products p ON w.card_id = CAST(p.product_id AS TEXT)
        LEFT JOIN groups g ON p.group_id = g.group_id
        WHERE w.user_id = ?
        ORDER BY 
          CASE w.priority
            WHEN 'High' THEN 1
            WHEN 'Medium' THEN 2
            WHEN 'Low' THEN 3
            ELSE 4
          END,
          w.added_at DESC
        LIMIT ? OFFSET ?
      `, [parseInt(userId), parseInt(limit), parseInt(offset)]);
      
      // Format the response
      const formattedItems = wishlistItems.map(item => ({
        id: item.id,
        cardId: item.card_id,
        priority: item.priority || 'Medium',
        maxPrice: item.max_price,
        notes: item.notes,
        addedAt: item.added_at,
        card: item.name ? {
          product_id: item.card_id,
          name: item.name,
          clean_name: item.clean_name,
          image_url: item.image_url,
          set_name: item.set_name,
          ext_number: item.ext_number,
          ext_rarity: item.ext_rarity,
          market_price: item.market_price,
          low_price: item.low_price,
          mid_price: item.mid_price,
          high_price: item.high_price,
          artist: item.artist,
          url: item.url
        } : null
      }));
      
      res.json({ success: true, data: formattedItems });
    } catch (dbError) {
      // If table doesn't exist or query fails, return empty array
      if (dbError.message.includes('no such table')) {
        console.warn('user_wishlists table does not exist, returning empty wishlist');
        return res.json({ success: true, data: [] });
      }
      throw dbError;
    }
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    // Return empty array instead of error to prevent app breakage
    res.json({ success: true, data: [] });
  }
});

// Add card to wishlist
router.post('/', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    console.log('🔍 [WISHLIST] POST request received:', {
      userId,
      body: req.body,
      headers: req.headers
    });
    
    if (!userId) {
      console.error('❌ [WISHLIST] No user ID provided');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { cardId, priority = 'Medium', maxPrice, notes } = req.body;
    console.log('🔍 [WISHLIST] Request body:', { cardId, priority, maxPrice, notes });
    
    if (!cardId) {
      console.error('❌ [WISHLIST] No card ID provided');
      return res.status(400).json({ error: 'Card ID is required' });
    }
    
    // Convert userId to integer for database consistency
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
      console.error('❌ [WISHLIST] Invalid user ID format:', userId);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }
    
    // Check if already in wishlist
    const existing = await get(
      'SELECT id FROM user_wishlists WHERE user_id = ? AND card_id = ?',
      [userIdInt, String(cardId)]
    );
    
    if (existing) {
      return res.status(400).json({ error: 'Card already in wishlist' });
    }
    
    // Check if card is in user's collection
    const inCollection = await get(
      'SELECT id FROM user_collections WHERE user_id = ? AND card_id = ?',
      [userIdInt, String(cardId)]
    );
    
    if (inCollection) {
      return res.status(400).json({ error: 'Card is already in your collection' });
    }
    
    // Add to wishlist
    const result = await run(
      `INSERT INTO user_wishlists (user_id, card_id, priority, max_price, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [userIdInt, String(cardId), priority, maxPrice || null, notes || null]
    );
    
    // Get the created wishlist item with card details
    const wishlistItem = await get(`
      SELECT 
        w.*,
        p.name,
        p.clean_name,
        p.image_url,
        g.name as set_name,
        p.ext_number,
        p.ext_rarity,
        p.market_price,
        p.low_price,
        p.mid_price,
        p.high_price,
        p.artist,
        p.url
      FROM user_wishlists w
      LEFT JOIN products p ON w.card_id = CAST(p.product_id AS TEXT)
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE w.id = ?
    `, [result.lastID]);
    
    const formattedItem = {
      id: wishlistItem.id,
      cardId: wishlistItem.card_id,
      priority: wishlistItem.priority || 'Medium',
      maxPrice: wishlistItem.max_price,
      notes: wishlistItem.notes,
      addedAt: wishlistItem.added_at,
      card: wishlistItem.name ? {
        product_id: wishlistItem.card_id,
        name: wishlistItem.name,
        clean_name: wishlistItem.clean_name,
        image_url: wishlistItem.image_url,
        set_name: wishlistItem.set_name,
        ext_number: wishlistItem.ext_number,
        ext_rarity: wishlistItem.ext_rarity,
        market_price: wishlistItem.market_price,
        low_price: wishlistItem.low_price,
        mid_price: wishlistItem.mid_price,
        high_price: wishlistItem.high_price,
        artist: wishlistItem.artist,
        url: wishlistItem.url
      } : null
    };
    
    res.status(201).json({ success: true, data: formattedItem });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      userId: req.headers['x-user-id'],
      cardId: req.body?.cardId,
      body: req.body
    });
    res.status(500).json({ 
      error: 'Failed to add to wishlist',
      details: error.message 
    });
  }
});

// Update wishlist item
router.put('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { priority, maxPrice, notes } = req.body;
    
    // Check if user owns this wishlist item
    const wishlistItem = await get(
      'SELECT id FROM user_wishlists WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!wishlistItem) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    
    // Update wishlist item
    await run(
      `UPDATE user_wishlists 
       SET priority = COALESCE(?, priority),
           max_price = ?,
           notes = ?
       WHERE id = ?`,
      [priority || null, maxPrice || null, notes || null, id]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating wishlist item:', error);
    res.status(500).json({ error: 'Failed to update wishlist item' });
  }
});

// Remove card from wishlist
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    // Check if user owns this wishlist item
    const wishlistItem = await get(
      'SELECT id FROM user_wishlists WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    
    if (!wishlistItem) {
      return res.status(404).json({ error: 'Wishlist item not found' });
    }
    
    await run('DELETE FROM user_wishlists WHERE id = ?', [id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Remove card from wishlist by card_id
router.delete('/card/:cardId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { cardId } = req.params;
    
    const result = await run(
      'DELETE FROM user_wishlists WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Card not in wishlist' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Check if card is in wishlist
router.get('/check/:cardId', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.json({ success: true, inWishlist: false });
    }
    
    const { cardId } = req.params;
    
    const wishlistItem = await get(
      'SELECT id FROM user_wishlists WHERE user_id = ? AND card_id = ?',
      [userId, cardId]
    );
    
    res.json({ success: true, inWishlist: !!wishlistItem });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

// Get wishlist count
router.get('/count', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.json({ success: true, count: 0 });
    }
    
    const result = await get(
      'SELECT COUNT(*) as count FROM user_wishlists WHERE user_id = ?',
      [userId]
    );
    
    res.json({ success: true, count: result?.count || 0 });
  } catch (error) {
    console.error('Error getting wishlist count:', error);
    res.status(500).json({ error: 'Failed to get wishlist count' });
  }
});

export default router;



