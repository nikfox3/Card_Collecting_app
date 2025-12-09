import express from 'express';
import { query } from '../utils/database.js';

const router = express.Router();

// Helper function to get user ID from request
const getUserId = (req) => {
  return req.headers['user-id'] || 'default-user';
};

// Simple in-memory cache for sets API (5 minute TTL)
let setsCache = null;
let setsCacheTimestamp = null;
const SETS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get all sets with their card counts (collection progress calculated client-side for performance)
router.get('/', async (req, res) => {
  try {
    // Check cache first
    const now = Date.now();
    if (setsCache && setsCacheTimestamp && (now - setsCacheTimestamp) < SETS_CACHE_TTL) {
      return res.json({
        success: true,
        data: setsCache,
        cached: true
      });
    }

    // Get all sets with card counts in a single optimized query
    // Collection progress is calculated client-side from localStorage for better performance
    const sets = await query(`
      SELECT 
        g.group_id as id,
        g.group_id as group_id,
        g.name,
        g.published_on,
        g.published_on as release_date,
        g.abbreviation,
        g.language,
        COUNT(DISTINCT p.product_id) as cards_total
      FROM groups g
      LEFT JOIN products p ON g.group_id = p.group_id AND p.category_id = 3
      WHERE g.category_id = 3
      GROUP BY g.group_id, g.name, g.published_on, g.abbreviation, g.language
      ORDER BY 
        CASE WHEN g.published_on IS NULL THEN 1 ELSE 0 END,
        g.published_on DESC, 
        g.name ASC
    `);

    // Add collection progress fields (calculated client-side)
    const setsWithProgress = sets.map(set => ({
      ...set,
      language: set.language || null,
      cards_collected: 0, // Calculated client-side from localStorage
      cards_total: set.cards_total || 0,
      percentage: 0 // Calculated client-side
    }));

    // Update cache
    setsCache = setsWithProgress;
    setsCacheTimestamp = now;

    res.json({
      success: true,
      data: setsWithProgress
    });
  } catch (error) {
    console.error('Error fetching sets:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch sets' 
    });
  }
});

// Get a specific set by name or group_id
router.get('/:name', async (req, res) => {
  try {
    const setName = decodeURIComponent(req.params.name);
    
    // Optimize: Try group_id first if it's numeric (fastest lookup)
    let set = null;
    const numericId = parseInt(setName, 10);
    if (!isNaN(numericId)) {
      set = await query(`
        SELECT 
          g.group_id as id,
          g.group_id as group_id,
          g.name,
          g.clean_name,
          g.published_on as release_date,
          g.language
        FROM groups g
        WHERE g.group_id = ? AND g.category_id = 3
        LIMIT 1
      `, [numericId]);
    }
    
    // If not found by ID, try by name (optimized: check exact matches first)
    if (!set || set.length === 0) {
      set = await query(`
        SELECT 
          g.group_id as id,
          g.group_id as group_id,
          g.name,
          g.clean_name,
          g.published_on as release_date,
          g.language
        FROM groups g
        WHERE g.category_id = 3
          AND (
            g.name = ? 
            OR g.clean_name = ?
            OR CAST(g.group_id AS TEXT) = ?
          )
        ORDER BY 
          CASE 
            WHEN g.name = ? THEN 1
            WHEN g.clean_name = ? THEN 2
            WHEN CAST(g.group_id AS TEXT) = ? THEN 3
            ELSE 4
          END
        LIMIT 1
      `, [setName, setName, setName, setName, setName, setName]);
    }
    
    // If still not found, try partial match (slower, but as fallback)
    if (!set || set.length === 0) {
      set = await query(`
        SELECT 
          g.group_id as id,
          g.group_id as group_id,
          g.name,
          g.clean_name,
          g.published_on as release_date,
          g.language
        FROM groups g
        WHERE g.category_id = 3
          AND (g.name LIKE ? OR g.clean_name LIKE ?)
        LIMIT 1
      `, [`%${setName}%`, `%${setName}%`]);
    }

    // If found in groups, fetch cards from products table
    if (set && set.length > 0) {
      const groupId = set[0].id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100; // Default to 100 cards per page
      const offset = (page - 1) * limit;
      
      // First, get total count efficiently
      const countResult = await query(`
        SELECT COUNT(*) as total
        FROM products p
        WHERE p.group_id = ? AND p.category_id = 3
      `, [groupId]);
      const totalCards = countResult[0]?.total || 0;
      
      // Optimized query: Fetch only essential fields first, paginated
      // Use index-friendly WHERE and ORDER BY
      const cards = await query(`
        SELECT 
          p.product_id as id,
          p.product_id as productId,
          p.name,
          p.clean_name as cleanName,
          p.image_url as imageUrl,
          p.ext_number,
          p.ext_rarity,
          p.market_price as current_value,
          p.market_price,
          p.low_price,
          p.high_price,
          p.mid_price,
          p.sub_type_name,
          p.language
        FROM products p
        WHERE p.group_id = ? AND p.category_id = 3
        ORDER BY 
          CASE 
            WHEN p.ext_number GLOB '[0-9]*' THEN CAST(p.ext_number AS INTEGER)
            ELSE 999999
          END,
          p.name ASC
        LIMIT ? OFFSET ?
      `, [groupId, limit, offset]);

      return res.json({
        success: true,
        data: {
          ...set[0],
          cards: cards || [],
          cards_total: totalCards,
          page: page,
          limit: limit,
          total_pages: Math.ceil(totalCards / limit),
          has_more: offset + cards.length < totalCards
        }
      });
    }

    // If not found in groups, try sets table (for English sets)
    set = await query(`
      SELECT 
        s.id,
        s.name,
        s.series,
        s.release_date,
        s.printed_total,
        COUNT(c.id) as card_count
      FROM sets s
      LEFT JOIN cards c ON s.id = c.set_id
      WHERE s.name = ?
      GROUP BY s.id, s.name, s.series, s.release_date, s.printed_total
    `, [setName]);

    if (set.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Set not found'
      });
    }

    // For English sets, fetch cards from cards table
    const setId = set[0].id;
    const cards = await query(`
      SELECT 
        c.id,
        c.name,
        c.number,
        c.rarity,
        c.images,
        c.current_value,
        c.hp,
        c.types
      FROM cards c
      WHERE c.set_id = ?
      ORDER BY c.number, c.name
    `, [setId]);

    res.json({
      success: true,
      data: {
        ...set[0],
        cards: cards || [],
        cards_total: cards?.length || 0
      }
    });
  } catch (error) {
    console.error('Error fetching set:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch set' 
    });
  }
});

export default router;
