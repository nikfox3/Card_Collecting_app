import express from 'express';
import { query, run } from '../utils/database.js';

const router = express.Router();

// Helper function to get user ID from request
const getUserId = (req) => {
  return req.headers['user-id'] || 'default-user';
};

// Get all sets (groups) with card counts and collection progress
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    
    // Ensure set columns exist before querying
    try {
      const cols = await query(`PRAGMA table_info(groups)`);
      const colNames = new Set(cols.map(c => c.name));
      
      if (!colNames.has('clean_name')) {
        await run('ALTER TABLE groups ADD COLUMN clean_name VARCHAR(255)');
      }
      if (!colNames.has('logo_url')) {
        await run('ALTER TABLE groups ADD COLUMN logo_url TEXT');
      }
      if (!colNames.has('symbol_url')) {
        await run('ALTER TABLE groups ADD COLUMN symbol_url TEXT');
      }
    } catch (error) {
      console.warn('Warning: Could not ensure set columns:', error.message);
    }

    // Optimized query: Use subquery for card counts instead of JOIN + GROUP BY
    const sets = await query(`
      SELECT 
        g.group_id as id,
        g.name,
        COALESCE(g.clean_name, g.name) as clean_name,
        g.published_on,
        g.modified_on,
        g.logo_url,
        g.symbol_url,
        g.language,
        (
          SELECT COUNT(DISTINCT p.product_id)
          FROM products p
          WHERE p.group_id = g.group_id AND p.category_id = 3
        ) as total_cards
      FROM groups g
      WHERE g.category_id = 3
        -- Only include sets that have at least one card
        AND EXISTS (
          SELECT 1 
          FROM products p2 
          WHERE p2.group_id = g.group_id 
          AND p2.category_id = 3
          LIMIT 1
        )
      ORDER BY g.published_on DESC, g.name ASC
    `);
    
    // Format sets (no need for Promise.all since we're not doing async operations)
    const setsWithProgress = sets.map((set) => {
      // Note: Collection tracking is currently done via localStorage (userDatabase.js)
      // For now, return 0 for collected cards until a unified collection system is implemented
      const collectedCount = 0;
      const totalCards = set.total_cards || 0;
      const percentage = totalCards > 0 ? Math.round((collectedCount / totalCards) * 100) : 0;

      return {
        id: set.id,
        group_id: set.id,
        name: set.name,
        clean_name: set.clean_name || set.name,
        logo_url: set.logo_url || null,
        symbol_url: set.symbol_url || null,
        language: set.language || null, // Include language field
        abbreviation: null, // Not in database schema
        is_supplemental: false, // Not in database schema
        release_date: set.published_on,
        published_on: set.published_on,
        modified_on: set.modified_on,
        cards_total: totalCards,
        cards_collected: collectedCount,
        percentage: percentage
      };
    });
    
    res.json({ success: true, data: setsWithProgress });
  } catch (error) {
    console.error('Sets error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sets' });
  }
});

// Get specific set details
router.get('/:id', async (req, res) => {
  try {
    const setId = parseInt(req.params.id, 10);
    console.log('Fetching set details for ID:', setId);
    
    if (isNaN(setId)) {
      return res.status(400).json({ success: false, error: 'Invalid set ID' });
    }
    
    // Ensure set columns exist before querying
    try {
      const cols = await query(`PRAGMA table_info(groups)`);
      const colNames = new Set(cols.map(c => c.name));
      
      if (!colNames.has('clean_name')) {
        await run('ALTER TABLE groups ADD COLUMN clean_name VARCHAR(255)');
      }
      if (!colNames.has('logo_url')) {
        await run('ALTER TABLE groups ADD COLUMN logo_url TEXT');
      }
      if (!colNames.has('symbol_url')) {
        await run('ALTER TABLE groups ADD COLUMN symbol_url TEXT');
      }
    } catch (error) {
      console.warn('Warning: Could not ensure set columns:', error.message);
    }

    // First get the set info
    // Note: abbreviation and is_supplemental may not exist in all database versions
    const set = await query(`
      SELECT 
        g.group_id as id,
        g.name,
        COALESCE(g.clean_name, g.name) as clean_name,
        g.published_on,
        g.modified_on,
        g.logo_url,
        g.symbol_url
      FROM groups g
      WHERE g.group_id = ? AND g.category_id = 3
    `, [setId]);
    
    if (set.length === 0) {
      return res.status(404).json({ success: false, error: 'Set not found' });
    }
    
    const setData = set[0];
    
    // Get card count separately
    const cardCountResult = await query(`
      SELECT COUNT(*) as card_count
      FROM products p
      WHERE p.group_id = ? AND p.category_id = 3
    `, [setId]);
    const card_count = cardCountResult[0]?.card_count || 0;
    
    // Get cards in this set
    const cards = await query(`
      SELECT 
        p.product_id as id,
        p.name,
        p.clean_name,
        p.image_url,
        p.ext_number,
        p.ext_rarity,
        p.ext_card_type,
        p.ext_hp,
        p.ext_stage,
        p.market_price,
        p.low_price,
        p.high_price,
        p.sub_type_name
      FROM products p
      WHERE p.group_id = ? AND p.category_id = 3
      ORDER BY 
        CASE 
          WHEN p.ext_number IS NOT NULL AND p.ext_number != ''
            AND p.ext_number GLOB '[0-9]*'
            THEN CAST(p.ext_number AS INTEGER)
          ELSE 999999
        END,
        p.ext_number COLLATE NOCASE
    `, [setId]);
    
    const formattedSet = {
      id: setData.id,
      group_id: setData.id,
      name: setData.name,
      clean_name: setData.clean_name || setData.name,
      logo_url: setData.logo_url || null,
      symbol_url: setData.symbol_url || null,
      abbreviation: setData.abbreviation || null,
      is_supplemental: setData.is_supplemental === 1 || setData.is_supplemental === '1' || false,
      published_on: setData.published_on,
      modified_on: setData.modified_on,
      card_count: card_count,
      cards: cards.map(card => {
        // Remove trailing number pattern from clean_name (e.g., "Mega Venusaur ex 003" -> "Mega Venusaur ex")
        let cleanName = card.clean_name || card.name || '';
        // Remove trailing whitespace and number pattern (e.g., " 003", " 001", etc.)
        cleanName = cleanName.replace(/\s+\d+$/, '').trim();
        
        return {
        id: card.id,
        productId: card.id,
        name: card.name,
        cleanName: cleanName,
        imageUrl: card.image_url,
        ext_number: card.ext_number,
        ext_rarity: card.ext_rarity,
        ext_card_type: card.ext_card_type,
        ext_hp: card.ext_hp,
        ext_stage: card.ext_stage,
        current_value: card.market_price,
        market_price: card.market_price,
        low_price: card.low_price,
        high_price: card.high_price,
        sub_type_name: card.sub_type_name
        };
      })
    };
    
    console.log(`Successfully fetched set ${setId} with ${cards.length} cards`);
    res.json({ success: true, data: formattedSet });
  } catch (error) {
    console.error('Set details error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch set details',
      message: error.message 
    });
  }
});

export default router;







