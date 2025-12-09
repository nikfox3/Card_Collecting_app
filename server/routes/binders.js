// Binder Management API Routes
// Handles CRUD operations for Pokemon TCG digital binders

import express from 'express';
import { query, get } from '../utils/database.js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { isProMember, getUserBinderCount, getBinderPageCount } from '../utils/proMembership.js';

const router = express.Router();

// Helper function to extract dominant colors from an image
async function extractColorsFromImage(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Resize and extract raw pixels
    const image = sharp(buffer).resize(100, 100, { fit: 'inside' });
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Sample pixels and find most common colors
    const colorMap = new Map();
    const step = info.channels; // RGB = 3, RGBA = 4
    
    for (let i = 0; i < data.length; i += step * 10) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Quantize colors to reduce variations
      const quantized = [
        Math.floor(r / 32) * 32,
        Math.floor(g / 32) * 32,
        Math.floor(b / 32) * 32
      ];
      
      const key = quantized.join(',');
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
    
    // Sort by frequency and get top 3
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    return sortedColors.map(([key]) => key.split(',').map(Number));
  } catch (error) {
    console.error('Error extracting colors:', error);
    return null;
  }
}

// Helper function to get user ID from request
const getUserId = (req) => {
  return req.headers['user-id'] || 'default-user';
};

// Helper function to get binder with pages and cards
const getBinderWithPages = async (binderId) => {
  const binderSql = 'SELECT * FROM binders WHERE id = ?';
  const binderResults = await query(binderSql, [binderId]);
  
  if (binderResults.length === 0) {
    return null;
  }
  
  const binder = binderResults[0];
  const pocketCount = binder.pocket_config === '12-pocket' ? 12 : 9;
  
  // Get pages ordered by page_number
  const pagesSql = 'SELECT * FROM binder_pages WHERE binder_id = ? ORDER BY page_number';
  const pagesResults = await query(pagesSql, [binderId]);
  
  // Get all pockets with card info
  const pocketsSql = `
    SELECT bp.*, p.name, p.image_url, p.ext_rarity
    FROM binder_pockets bp
    LEFT JOIN products p ON bp.product_id = p.product_id
    WHERE bp.binder_id = ?
    ORDER BY bp.page_id, bp.pocket_position
  `;
  const pocketsResults = await query(pocketsSql, [binderId]);
  
  // Organize pockets by page
  const pocketsByPage = {};
  pocketsResults.forEach(pocket => {
    if (!pocketsByPage[pocket.page_id]) {
      pocketsByPage[pocket.page_id] = {};
    }
    pocketsByPage[pocket.page_id][pocket.pocket_position] = {
      id: pocket.id,
      product_id: pocket.product_id,
      pocket_position: pocket.pocket_position,
      notes: pocket.notes,
      added_at: pocket.added_at,
      updated_at: pocket.updated_at,
      card: {
        id: pocket.product_id,
        name: pocket.name,
        image_url: pocket.image_url,
        rarity: pocket.ext_rarity
      }
    };
  });
  
  // Build pages with their pockets
  binder.pages = pagesResults.map(page => {
    const pagePockets = [];
    const pocketsInPage = pocketsByPage[page.id] || {};
    
    // Initialize all pocket positions (empty if not filled)
    for (let i = 0; i < pocketCount; i++) {
      pagePockets.push(pocketsInPage[i] || null);
    }
    
    return {
      id: page.id,
      page_number: page.page_number,
      name: page.name,
      pockets: pagePockets
    };
  });
  
  return binder;
};

// GET /api/binders - Get all user's binders
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const sql = `
      SELECT 
        b.*,
        COUNT(DISTINCT bp.id) as page_count
      FROM binders b
      LEFT JOIN binder_pages bp ON b.id = bp.binder_id
      WHERE b.user_id = ?
      GROUP BY b.id
      ORDER BY b.updated_at DESC
    `;
    const binders = await query(sql, [userId]);
    
    // Get first card for each binder
    const bindersWithDetails = await Promise.all(binders.map(async (binder) => {
      const firstCardSql = `
        SELECT p.image_url 
        FROM binder_pockets bpck
        JOIN binder_pages bpg ON bpck.page_id = bpg.id
        JOIN products p ON bpck.product_id = p.product_id
        WHERE bpg.binder_id = ?
        ORDER BY bpg.page_number, bpck.pocket_position
        LIMIT 1
      `;
      const firstCardResult = await query(firstCardSql, [binder.id]);
      
      const firstCardImage = firstCardResult[0]?.image_url || null;
      let dominantColors = null;
      
      // Extract colors from first card image
      if (firstCardImage) {
        dominantColors = await extractColorsFromImage(firstCardImage);
      }
      
      return {
        ...binder,
        page_count: parseInt(binder.page_count) || 0,
        first_card_image: firstCardImage,
        dominant_colors: dominantColors
      };
    }));
    
    res.json({
      success: true,
      data: bindersWithDetails
    });
  } catch (error) {
    console.error('Error fetching binders:', error);
    res.status(500).json({ error: 'Failed to fetch binders' });
  }
});

// GET /api/binders/:id - Get specific binder with pages and cards
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    const binder = await getBinderWithPages(id);
    
    if (!binder) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    
    if (binder.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      success: true,
      data: binder
    });
  } catch (error) {
    console.error('Error fetching binder:', error);
    res.status(500).json({ error: 'Failed to fetch binder' });
  }
});

// POST /api/binders - Create new binder
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, pocket_config = '9-pocket', description = '' } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Binder name is required' });
    }
    
    if (!['9-pocket', '12-pocket'].includes(pocket_config)) {
      return res.status(400).json({ error: 'Invalid pocket configuration (must be 9-pocket or 12-pocket)' });
    }
    
    // Check pro membership and binder limit
    const isPro = await isProMember(userId);
    if (!isPro) {
      const binderCount = await getUserBinderCount(userId);
      if (binderCount >= 1) {
        return res.status(403).json({ 
          error: 'Binder limit reached',
          message: 'Free users are limited to 1 binder. Upgrade to Pro for unlimited binders!',
          limit: 1,
          current: binderCount,
          requiresPro: true
        });
      }
    }
    
    const binderId = uuidv4();
    const sql = `
      INSERT INTO binders (id, user_id, name, pocket_config, description)
      VALUES (?, ?, ?, ?, ?)
    `;
    
    await query(sql, [binderId, userId, name.trim(), pocket_config, description]);
    
    const newBinder = await getBinderWithPages(binderId);
    
    res.status(201).json({
      success: true,
      data: newBinder
    });
  } catch (error) {
    console.error('Error creating binder:', error);
    res.status(500).json({ error: 'Failed to create binder' });
  }
});

// PUT /api/binders/:id - Update binder
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { name, pocket_config, description } = req.body;
    
    // Check if binder exists and user owns it
    const checkSql = 'SELECT user_id FROM binders WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      if (name.trim().length === 0) {
        return res.status(400).json({ error: 'Binder name cannot be empty' });
      }
      updates.push('name = ?');
      params.push(name.trim());
    }
    
    if (pocket_config !== undefined) {
      if (!['9-pocket', '12-pocket'].includes(pocket_config)) {
        return res.status(400).json({ error: 'Invalid pocket configuration' });
      }
      updates.push('pocket_config = ?');
      params.push(pocket_config);
    }
    
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    const updateSql = `UPDATE binders SET ${updates.join(', ')} WHERE id = ?`;
    
    await query(updateSql, params);
    
    const updatedBinder = await getBinderWithPages(id);
    
    res.json({
      success: true,
      data: updatedBinder
    });
  } catch (error) {
    console.error('Error updating binder:', error);
    res.status(500).json({ error: 'Failed to update binder' });
  }
});

// DELETE /api/binders/:id - Delete binder
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    const checkSql = 'SELECT user_id FROM binders WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const deleteSql = 'DELETE FROM binders WHERE id = ?';
    await query(deleteSql, [id]);
    
    res.json({
      success: true,
      message: 'Binder deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting binder:', error);
    res.status(500).json({ error: 'Failed to delete binder' });
  }
});

// POST /api/binders/:id/pages - Create new page
router.post('/:id/pages', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { name } = req.body;
    
    // Check if binder exists and user owns it
    const checkSql = 'SELECT user_id FROM binders WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check pro membership and page limit
    const isPro = await isProMember(userId);
    if (!isPro) {
      const pageCount = await getBinderPageCount(id);
      if (pageCount >= 8) {
        return res.status(403).json({ 
          error: 'Page limit reached',
          message: 'Free users are limited to 8 pages per binder. Upgrade to Pro for unlimited pages!',
          limit: 8,
          current: pageCount,
          requiresPro: true
        });
      }
    }
    
    // Get the next page number
    const maxPageSql = 'SELECT MAX(page_number) as max_page FROM binder_pages WHERE binder_id = ?';
    const maxPageResults = await query(maxPageSql, [id]);
    const nextPageNumber = (maxPageResults[0].max_page || 0) + 1;
    
    const pageId = uuidv4();
    const sql = `
      INSERT INTO binder_pages (id, binder_id, page_number, name)
      VALUES (?, ?, ?, ?)
    `;
    
    await query(sql, [pageId, id, nextPageNumber, name || null]);
    
    const binder = await getBinderWithPages(id);
    
    res.status(201).json({
      success: true,
      data: binder
    });
  } catch (error) {
    console.error('Error creating page:', error);
    res.status(500).json({ error: 'Failed to create page' });
  }
});

// PUT /api/binders/:id/pages/:pageId - Update page
router.put('/:id/pages/:pageId', async (req, res) => {
  try {
    const { id, pageId } = req.params;
    const userId = getUserId(req);
    const { name, page_number } = req.body;
    
    // Check if binder exists and user owns it
    const checkSql = 'SELECT user_id FROM binders WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name);
    }
    
    if (page_number !== undefined) {
      updates.push('page_number = ?');
      params.push(page_number);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(pageId);
    const updateSql = `UPDATE binder_pages SET ${updates.join(', ')} WHERE id = ?`;
    
    await query(updateSql, params);
    
    const binder = await getBinderWithPages(id);
    
    res.json({
      success: true,
      data: binder
    });
  } catch (error) {
    console.error('Error updating page:', error);
    res.status(500).json({ error: 'Failed to update page' });
  }
});

// DELETE /api/binders/:id/pages/:pageId - Delete page
router.delete('/:id/pages/:pageId', async (req, res) => {
  try {
    const { id, pageId } = req.params;
    const userId = getUserId(req);
    
    // Check if binder exists and user owns it
    const checkSql = 'SELECT user_id FROM binders WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const deleteSql = 'DELETE FROM binder_pages WHERE id = ?';
    await query(deleteSql, [pageId]);
    
    const binder = await getBinderWithPages(id);
    
    res.json({
      success: true,
      data: binder
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: 'Failed to delete page' });
  }
});

// POST /api/binders/:id/pockets - Add or update card in pocket
router.post('/:id/pockets', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { page_id, product_id, pocket_position, notes } = req.body;
    
    if (!page_id || product_id === undefined || pocket_position === undefined) {
      return res.status(400).json({ error: 'page_id, product_id, and pocket_position are required' });
    }
    
    // Check if binder exists and user owns it
    const binderSql = 'SELECT * FROM binders WHERE id = ?';
    const binderResults = await query(binderSql, [id]);
    
    if (binderResults.length === 0) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    
    if (binderResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const binder = binderResults[0];
    const maxPockets = binder.pocket_config === '12-pocket' ? 12 : 9;
    
    if (pocket_position < 0 || pocket_position >= maxPockets) {
      return res.status(400).json({ error: `Invalid pocket position (must be 0-${maxPockets - 1})` });
    }
    
    // Check if card exists
    const cardSql = 'SELECT product_id FROM products WHERE product_id = ?';
    const cardResults = await query(cardSql, [product_id]);
    
    if (cardResults.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    // Check if page exists
    const pageSql = 'SELECT id FROM binder_pages WHERE id = ? AND binder_id = ?';
    const pageResults = await query(pageSql, [page_id, id]);
    
    if (pageResults.length === 0) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    // Check if pocket is already occupied
    const existingSql = 'SELECT id FROM binder_pockets WHERE binder_id = ? AND page_id = ? AND pocket_position = ?';
    const existingResults = await query(existingSql, [id, page_id, pocket_position]);
    
    if (existingResults.length > 0) {
      // Update existing pocket
      const updateSql = 'UPDATE binder_pockets SET product_id = ?, notes = ? WHERE id = ?';
      await query(updateSql, [product_id, notes || null, existingResults[0].id]);
    } else {
      // Insert new pocket
      const pocketId = uuidv4();
      const insertSql = `
        INSERT INTO binder_pockets (id, binder_id, page_id, product_id, pocket_position, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      await query(insertSql, [pocketId, id, page_id, product_id, pocket_position, notes || null]);
    }
    
    const updatedBinder = await getBinderWithPages(id);
    
    res.json({
      success: true,
      data: updatedBinder
    });
  } catch (error) {
    console.error('Error updating pocket:', error);
    res.status(500).json({ error: 'Failed to update pocket' });
  }
});

// DELETE /api/binders/:id/pockets/:pageId/:position - Remove card from pocket
router.delete('/:id/pockets/:pageId/:position', async (req, res) => {
  try {
    const { id, pageId, position } = req.params;
    const userId = getUserId(req);
    
    // Check if binder exists and user owns it
    const checkSql = 'SELECT user_id FROM binders WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Binder not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const deleteSql = 'DELETE FROM binder_pockets WHERE binder_id = ? AND page_id = ? AND pocket_position = ?';
    await query(deleteSql, [id, pageId, position]);
    
    const updatedBinder = await getBinderWithPages(id);
    
    res.json({
      success: true,
      data: updatedBinder
    });
  } catch (error) {
    console.error('Error removing card from pocket:', error);
    res.status(500).json({ error: 'Failed to remove card from pocket' });
  }
});

export default router;
