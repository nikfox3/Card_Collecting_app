import express from 'express';
import { query, get } from '../utils/database.js';

const router = express.Router();

// Public search endpoint (for main app)
router.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.q || '';
    const limit = parseInt(req.query.limit) || 100;
    
    if (!searchQuery) {
      return res.json({ success: true, data: [] });
    }
    
    const cards = await query(`
      SELECT 
        p.*,
        g.name as set_name
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.name LIKE ?
         OR p.ext_card_type LIKE ?
         OR g.name LIKE ?
         OR p.ext_number LIKE ?
      ORDER BY 
        CASE WHEN p.name LIKE ? THEN 1 ELSE 2 END,
        p.market_price DESC
      LIMIT ?
    `, [
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `%${searchQuery}%`,
      `${searchQuery}%`,
      limit
    ]);
    
    // Format cards for frontend compatibility
    const formattedCards = cards.map(card => ({
      id: card.product_id,
      productId: card.product_id,
      name: card.name,
      cleanName: card.clean_name,
      imageUrl: card.image_url,
      set_name: card.set_name,
      group_id: card.group_id,
      category_id: card.category_id,
      ext_number: card.ext_number,
      ext_rarity: card.ext_rarity,
      ext_card_type: card.ext_card_type,
      ext_hp: card.ext_hp,
      ext_stage: card.ext_stage,
      ext_card_text: card.ext_card_text,
      ext_attack1: card.ext_attack1,
      ext_attack2: card.ext_attack2,
      ext_weakness: card.ext_weakness,
      ext_resistance: card.ext_resistance,
      ext_retreat_cost: card.ext_retreat_cost,
      artist: card.artist,
      current_value: card.market_price,
      low_price: card.low_price,
      mid_price: card.mid_price,
      high_price: card.high_price,
      market_price: card.market_price,
      direct_low_price: card.direct_low_price,
      sub_type_name: card.sub_type_name,
      url: card.url,
      modified_on: card.modified_on,
      created_at: card.created_at,
      updated_at: card.updated_at
    }));
    
    res.json({ success: true, data: formattedCards });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ success: false, error: 'Failed to search cards' });
  }
});

// Get trending cards (focused on individual cards, newer sets, popular items)
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20; // Reduced from 50 to 20 for better focus
    
    // Get trending cards with improved filtering:
    // 1. Focus on individual cards (not sealed products)
    // 2. Prioritize newer sets (2020+)
    // 3. Filter out booster boxes, cases, and sealed products
    // 4. Order by market price but with better criteria
    const trendingCards = await query(`
      SELECT 
        p.*,
        g.name as set_name,
        g.published_on as release_date
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.market_price > 0
        AND p.market_price >= 5  -- Minimum price threshold to filter out very cheap items
        AND p.name NOT LIKE '%Booster Box%'
        AND p.name NOT LIKE '%Case%'
        AND p.name NOT LIKE '%Bundle%'
        AND p.name NOT LIKE '%Pack%'
        AND p.name NOT LIKE '%Elite Trainer Box%'
        AND p.name NOT LIKE '%Tin%'
        AND p.name NOT LIKE '%Collection%'
        AND p.name NOT LIKE '%Display%'
        AND p.name NOT LIKE '%Sleeved%'
        AND p.name NOT LIKE '%Blister%'
        AND p.name NOT LIKE '%Starter%'
        AND p.name NOT LIKE '%Theme Deck%'
        AND p.name NOT LIKE '%Battle Academy%'
        AND p.name NOT LIKE '%Trainer Kit%'
        AND p.name NOT LIKE '%Code Card%'
        AND p.name NOT LIKE '%Promo%'
        AND p.ext_card_type IS NOT NULL  -- Must have card type (individual cards)
        AND p.ext_card_type != ''
        AND (g.published_on IS NULL OR g.published_on >= '2020-01-01')  -- Focus on newer sets
      ORDER BY 
        p.market_price DESC,
        CASE 
          WHEN g.published_on >= '2024-01-01' THEN 1  -- Prioritize very recent sets
          WHEN g.published_on >= '2022-01-01' THEN 2  -- Then recent sets
          WHEN g.published_on >= '2020-01-01' THEN 3  -- Then newer sets
          ELSE 4  -- Older sets last
        END,
        p.name ASC
      LIMIT ?
    `, [limit]);
    
    const formattedCards = trendingCards.map(card => ({
      id: card.product_id,
      productId: card.product_id,
      name: card.name,
      cleanName: card.clean_name,
      imageUrl: card.image_url,
      set_name: card.set_name,
      current_value: card.market_price,
      market_price: card.market_price,
      ext_rarity: card.ext_rarity,
      ext_card_type: card.ext_card_type,
      sub_type_name: card.sub_type_name,
      artist: card.artist
    }));
    
    // If no historical data available, return actual cards (not sealed products) with high market prices
    if (formattedCards.length === 0) {
      const fallbackCards = await query(`
        SELECT
          p.product_id AS id,
          p.name,
          p.clean_name,
          p.image_url,
          g.name AS set_name,
          p.group_id,
          p.category_id,
          p.ext_number,
          p.ext_rarity,
          p.ext_card_type,
          p.ext_hp,
          p.ext_stage,
          p.ext_card_text,
          p.ext_attack1,
          p.ext_attack2,
          p.ext_weakness,
          p.ext_resistance,
          p.ext_retreat_cost,
          p.low_price,
          p.mid_price,
          p.high_price,
          p.market_price,
          p.direct_low_price,
          p.sub_type_name,
          p.artist,
          p.url,
          p.modified_on,
          p.created_at,
          p.updated_at
        FROM products p
        LEFT JOIN groups g ON p.group_id = g.group_id
        WHERE p.market_price IS NOT NULL 
          AND p.market_price > 0
          AND p.ext_number IS NOT NULL 
          AND p.ext_number != ''
          AND p.ext_card_type IS NOT NULL
          AND p.ext_card_type != ''
        ORDER BY p.market_price DESC
        LIMIT ?
      `, [limit]);
      
      const formattedFallbackCards = fallbackCards.map(card => ({
        id: card.id,
        productId: card.id,
        name: card.name,
        cleanName: card.clean_name,
        imageUrl: card.image_url,
        image_url: card.image_url, // Add this for frontend compatibility
        url: card.url,
        set_name: card.set_name,
        current_value: card.market_price,
        market_price: card.market_price,
        ext_rarity: card.ext_rarity,
        ext_card_type: card.ext_card_type,
        sub_type_name: card.sub_type_name,
        ext_number: card.ext_number,
        artist: card.artist
      }));
      
      res.json({ success: true, data: formattedFallbackCards });
    } else {
      res.json({ success: true, data: formattedCards });
    }
  } catch (error) {
    console.error('Trending cards error:', error);
    res.json({ success: true, data: [] }); // Return empty array on error
  }
});

// Get top movers (cards with highest current values)
router.get('/top-movers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const topMovers = await query(`
      SELECT 
        p.*,
        g.name as set_name
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.market_price IS NOT NULL 
        AND p.market_price > 0
      ORDER BY p.market_price DESC
      LIMIT ?
    `, [limit]);
    
    const formattedCards = topMovers.map(card => ({
      id: card.product_id,
      productId: card.product_id,
      name: card.name,
      cleanName: card.clean_name,
      imageUrl: card.image_url,
      set_name: card.set_name,
      current_value: card.market_price,
      market_price: card.market_price,
      ext_rarity: card.ext_rarity,
      ext_card_type: card.ext_card_type,
      sub_type_name: card.sub_type_name,
      artist: card.artist
    }));
    
    res.json({ success: true, data: formattedCards });
  } catch (error) {
    console.error('Top movers error:', error);
    res.json({ success: true, data: [] }); // Return empty array on error
  }
});

// Get price history for a specific card
router.get('/price-history/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    const timeRange = req.query.timeRange || 'All';
    const variant = req.query.variant || 'Normal';
    
    console.log(`=== PRICE HISTORY REQUEST ===`);
    console.log(`Card ID: ${cardId}`);
    console.log(`Time Range: ${timeRange}`);
    console.log(`Variant: ${variant}`);
    
    // Map frontend variant IDs to database variant names
    const variantMapping = {
      'normal': 'Normal',
      'holo': 'Holofoil',
      'reverseholo': 'Reverse Holofoil',
      '1stedition': '1st Edition',
      'shadowless': 'Shadowless',
      'radiant': 'Radiant',
      'unlimitedholofoil': 'Unlimited Holofoil',
      '1steditionholofoil': '1st Edition Holofoil'
    };
    
    const dbVariant = variantMapping[variant] || variant;
    console.log(`Received variant: "${variant}", mapped to: "${dbVariant}"`);
    
    // Calculate date range based on timeRange parameter
    let dateFilter = '';
    let params = [cardId];
    
    if (timeRange !== 'All') {
      const now = new Date();
      let startDate;
      
      switch (timeRange) {
        case '7D':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '1M':
          // Use 35 days instead of 30 to be more inclusive
          startDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
          break;
        case '3M':
          // Use 95 days instead of 90 to be more inclusive
          startDate = new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000);
          break;
        case '6M':
          // Use 185 days instead of 180 to be more inclusive
          startDate = new Date(now.getTime() - 185 * 24 * 60 * 60 * 1000);
          break;
        case '1Y':
          // Use 370 days instead of 365 to be more inclusive
          startDate = new Date(now.getTime() - 370 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        dateFilter = ' AND date >= ?';
        params.push(startDate.toISOString().split('T')[0]);
      }
    }
    
    console.log(`Querying price history for card ${cardId} with variant ${dbVariant}, dateFilter: ${dateFilter}, params:`, [...params, dbVariant]);
    
    const queryString = `
      SELECT 
        date,
        low_price,
        mid_price,
        high_price,
        market_price,
        direct_low_price,
        sub_type_name
      FROM price_history
      WHERE product_id = ?${dateFilter} AND sub_type_name = ?
      ORDER BY date DESC
      LIMIT 100
    `;
    const queryParams = [...params, dbVariant];
    
    console.log(`Executing query: ${queryString}`);
    console.log(`With params:`, queryParams);
    
    let priceHistory = await query(queryString, queryParams);
    
    console.log(`Found ${priceHistory.length} price history records for card ${cardId} variant ${dbVariant}`);
    
    if (priceHistory.length > 0) {
      console.log(`Sample record:`, priceHistory[0]);
    }
    
    // If no data found for requested variant, try to find the best matching variant
    if (priceHistory.length === 0) {
      console.log(`No data found for variant ${dbVariant}, trying to find best match for card ${cardId}`);
      
      // Get all available variants for this card (without date filter to see what's actually available)
      const availableVariants = await query(`
        SELECT DISTINCT sub_type_name 
        FROM price_history 
        WHERE product_id = ?
        ORDER BY sub_type_name
      `, [cardId]);
      
      console.log(`Available variants for card ${cardId}:`, availableVariants.map(v => v.sub_type_name));
      
      // Try to find the best matching variant based on the requested variant
      let bestMatch = null;
      
      // Map requested variant to possible database variants
      const variantMappings = {
        'Normal': ['Normal', 'Unlimited Holofoil'],
        'Holo': ['Holofoil', 'Unlimited Holofoil', '1st Edition Holofoil'],
        'Holofoil': ['Holofoil', 'Unlimited Holofoil', '1st Edition Holofoil'],
        '1st Edition': ['1st Edition', '1st Edition Holofoil'],
        'Reverse Holo': ['Reverse Holofoil'],
        'Shadowless': ['Shadowless'],
        'Radiant': ['Radiant']
      };
      
      const possibleMatches = variantMappings[dbVariant] || [dbVariant];
      
      for (const possibleMatch of possibleMatches) {
        const match = availableVariants.find(v => v.sub_type_name === possibleMatch);
        if (match) {
          bestMatch = match.sub_type_name;
          break;
        }
      }
      
      // If no specific match, use priority order
      if (!bestMatch) {
        const variantPriority = [
          'Normal',
          'Unlimited Holofoil', 
          'Holofoil',
          '1st Edition Holofoil',
          '1st Edition',
          'Reverse Holofoil',
          'Shadowless',
          'Radiant'
        ];
        
        for (const priority of variantPriority) {
          const match = availableVariants.find(v => v.sub_type_name === priority);
          if (match) {
            bestMatch = match.sub_type_name;
            break;
          }
        }
      }
      
      // If still no match, use the first available variant
      if (!bestMatch && availableVariants.length > 0) {
        bestMatch = availableVariants[0].sub_type_name;
      }
      
      if (bestMatch) {
        console.log(`Using best match variant: ${bestMatch} for card ${cardId} (requested: ${dbVariant})`);
        priceHistory = await query(`
          SELECT 
            date,
            low_price,
            mid_price,
            high_price,
            market_price,
            direct_low_price,
            sub_type_name
          FROM price_history
          WHERE product_id = ?${dateFilter} AND sub_type_name = ?
          ORDER BY date DESC
          LIMIT 100
        `, [...params, bestMatch]);
      }
    }
    
    // Group by date to avoid duplicate dates in chart
    const groupedData = {}
    priceHistory.forEach(record => {
      const date = record.date
      if (!groupedData[date]) {
        groupedData[date] = []
      }
      groupedData[date].push(record)
    })
    
    // Process grouped data - use first record for each date
    const processedData = Object.keys(groupedData).map(date => {
      const records = groupedData[date]
      // Use the first record
      const primaryRecord = records[0]
      return {
        date: date,
        low_price: primaryRecord.low_price,
        mid_price: primaryRecord.mid_price,
        high_price: primaryRecord.high_price,
        market_price: primaryRecord.market_price,
        direct_low_price: primaryRecord.direct_low_price,
        sub_type_name: primaryRecord.sub_type_name
      }
    }).sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort by date DESC
    
    res.json({ success: true, data: processedData });
  } catch (error) {
    console.error('Price history error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch price history' });
  }
});

// Get specific card details
router.get('/:id', async (req, res) => {
  try {
    const cardId = req.params.id;
    
    const card = await query(`
      SELECT 
        p.*,
        g.name as set_name,
        g.group_id
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.product_id = ?
    `, [cardId]);
    
    if (card.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    const cardData = card[0];
    
    // Get all variants for this card (same name, different sub_type_name)
    const variants = await query(`
      SELECT 
        product_id,
        sub_type_name,
        market_price,
        low_price,
        mid_price,
        high_price,
        direct_low_price
      FROM products 
      WHERE name = ? AND product_id != ?
      ORDER BY market_price DESC
    `, [cardData.name, cardId]);
    
    // Add the current card as the primary variant
    const allVariants = [
      {
        product_id: cardData.product_id,
        sub_type_name: cardData.sub_type_name || 'Normal',
        market_price: cardData.market_price,
        low_price: cardData.low_price,
        mid_price: cardData.mid_price,
        high_price: cardData.high_price,
        direct_low_price: cardData.direct_low_price,
        is_primary: true
      },
      ...variants.map(v => ({ ...v, is_primary: false }))
    ];
    
    // Calculate formatted number
    const formattedNumber = cardData.ext_number || 'N/A';
    
    // Get recent price history
    const priceHistory = await query(`
      SELECT 
        date,
        market_price,
        low_price,
        high_price
      FROM price_history
      WHERE product_id = ?
      ORDER BY date DESC
      LIMIT 7
    `, [cardId]);
    
    // Build attacks array from ext_attack1 and ext_attack2
    const attacks = [];
    if (cardData.ext_attack1) {
      // Parse attack text into structured format
      const attackText = cardData.ext_attack1.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
      const lines = attackText.split('\n');
      const attack = {
        name: lines[0] || 'Unknown Attack',
        text: lines.slice(1).join('\n').trim() || '',
        cost: [], // Will be parsed from name if needed
        damage: '' // Will be parsed from name if needed
      };
      attacks.push(attack);
    }
    if (cardData.ext_attack2) {
      // Parse attack text into structured format
      const attackText = cardData.ext_attack2.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '');
      const lines = attackText.split('\n');
      const attack = {
        name: lines[0] || 'Unknown Attack',
        text: lines.slice(1).join('\n').trim() || '',
        cost: [], // Will be parsed from name if needed
        damage: '' // Will be parsed from name if needed
      };
      attacks.push(attack);
    }

    // Build abilities array from ext_card_text
    const abilities = [];
    if (cardData.ext_card_text) {
      // Normalize common HTML to plain text while preserving tag boundaries
      const raw = String(cardData.ext_card_text)
        .replace(/<br\s*\/?>(\r?\n)?/gi, '\n')
        .replace(/&mdash;|&ndash;|—|–/g, ' — ');

      // Helper to strip HTML tags
      const stripHtml = (s) => s.replace(/<[^>]*>/g, '').trim();

      // Collect multiple matches across patterns
      const found = [];

      // 1) <strong>Ability</strong> Name ... or <strong>Ability: Name</strong>
      const reStrongAbility = /<strong>\s*Ability\s*:?\s*([^<]*)<\/strong>\s*([^<\n]*)/gi;
      let m;
      while ((m = reStrongAbility.exec(raw)) !== null) {
        const name = stripHtml(m[1] || '').replace(/^[:\-–—]\s*/, '') || 'Ability';
        const text = stripHtml(m[2] || '');
        found.push({ type: 'Ability', name, text });
      }

      // 2) Ability — Name ... (no strong)
      const reInlineAbility = /\bAbility\s*(?:—|–|—|:|-)\s*([^\n<]+)\s*[\n ]*(.*)/gi;
      if (found.length === 0) {
        const mm = reInlineAbility.exec(stripHtml(raw));
        if (mm) {
          found.push({ type: 'Ability', name: (mm[1] || '').trim(), text: (mm[2] || '').trim() });
        }
      }

      // 3) Pokémon Power / Poké-POWER / Poké-BODY variants
      const rePower = /<strong>\s*(Pokémon Power|Pokemon Power|Poké-POWER|Poke-POWER|Poké-BODY|Poke-BODY)\s*:?\s*([^<]*)<\/strong>\s*([^<\n]*)/gi;
      while ((m = rePower.exec(raw)) !== null) {
        const type = stripHtml(m[1] || 'Pokémon Power');
        const name = stripHtml(m[2] || '').replace(/^[:\-–—]\s*/, '') || type;
        const text = stripHtml(m[3] || '');
        found.push({ type, name, text });
      }

      // 4) Fallback: plain text "Pokémon Power — Name: text"
      if (found.length === 0) {
        const plain = stripHtml(raw);
        const rePlain = /(Pokémon Power|Pokemon Power|Poké-POWER|Poke-POWER|Poké-BODY|Poke-BODY)\s*(?:—|–|:|-)\s*([^\n:]+)[:\s-]*([^\n]*)/i;
        const mm2 = rePlain.exec(plain);
        if (mm2) {
          found.push({ type: mm2[1], name: (mm2[2] || '').trim(), text: (mm2[3] || '').trim() });
        }
      }

      // Push results
      for (const a of found) {
        if (a.name || a.text) abilities.push(a);
      }
    }

    const formattedCard = {
      id: cardData.product_id,
      productId: cardData.product_id,
      name: cardData.name,
      cleanName: cardData.clean_name,
      imageUrl: cardData.image_url,
      set_name: cardData.set_name,
      group_id: cardData.group_id,
      category_id: cardData.category_id,
      ext_number: cardData.ext_number,
      formattedNumber: formattedNumber,
      ext_rarity: cardData.ext_rarity,
      ext_card_type: cardData.ext_card_type,
      ext_hp: cardData.ext_hp,
      ext_stage: cardData.ext_stage,
      ext_card_text: cardData.ext_card_text,
      ext_attack1: cardData.ext_attack1,
      ext_attack2: cardData.ext_attack2,
      ext_weakness: cardData.ext_weakness,
      ext_resistance: cardData.ext_resistance,
      ext_retreat_cost: cardData.ext_retreat_cost,
      artist: cardData.artist,
      current_value: cardData.market_price,
      low_price: cardData.low_price,
      mid_price: cardData.mid_price,
      high_price: cardData.high_price,
      market_price: cardData.market_price,
      direct_low_price: cardData.direct_low_price,
      sub_type_name: cardData.sub_type_name,
      url: cardData.url,
      modified_on: cardData.modified_on,
      priceHistory: priceHistory,
      // Add structured attacks and abilities
      attacks: attacks,
      abilities: abilities,
      // Add variant pricing data
      variants: allVariants,
      created_at: cardData.created_at,
      updated_at: cardData.updated_at
    };
    
    res.json({ success: true, data: formattedCard });
  } catch (error) {
    console.error('Card details error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch card details' });
  }
});

// Get condition prices for a specific card
router.get('/:id/conditions', async (req, res) => {
  try {
    const cardId = req.params.id;
    
    const card = await query(`
      SELECT 
        product_id,
        name,
        nm_price,
        lp_price,
        mp_price,
        hp_price,
        dmg_price,
        condition_last_updated
      FROM products 
      WHERE product_id = ?
    `, [cardId]);
    
    if (card.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    const cardData = card[0];
    
    const conditionPrices = {
      near_mint: cardData.nm_price,
      lightly_played: cardData.lp_price,
      moderately_played: cardData.mp_price,
      heavily_played: cardData.hp_price,
      damaged: cardData.dmg_price,
      last_updated: cardData.condition_last_updated
    };
    
    res.json({ success: true, data: conditionPrices });
  } catch (error) {
    console.error('Condition prices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch condition prices' });
  }
});

// Get graded prices for a specific card
router.get('/:id/graded', async (req, res) => {
  try {
    const cardId = req.params.id;
    
    const gradedPrices = await query(`
      SELECT 
        grading_service,
        grade,
        price,
        market_trend,
        sales_velocity,
        last_updated
      FROM graded_prices 
      WHERE product_id = ?
      ORDER BY grading_service, grade DESC
    `, [cardId]);
    
    // Group by grading service
    const groupedPrices = {};
    gradedPrices.forEach(price => {
      if (!groupedPrices[price.grading_service]) {
        groupedPrices[price.grading_service] = [];
      }
      groupedPrices[price.grading_service].push({
        grade: price.grade,
        price: price.price,
        market_trend: price.market_trend,
        sales_velocity: price.sales_velocity,
        last_updated: price.last_updated
      });
    });
    
    res.json({ success: true, data: groupedPrices });
  } catch (error) {
    console.error('Graded prices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch graded prices' });
  }
});

// Get comprehensive pricing data (conditions + graded) for a card
router.get('/:id/pricing', async (req, res) => {
  try {
    const cardId = req.params.id;
    
    // Get card basic info
    const card = await query(`
      SELECT 
        product_id,
        name,
        market_price,
        nm_price,
        lp_price,
        mp_price,
        hp_price,
        dmg_price,
        condition_last_updated,
        graded_last_updated
      FROM products 
      WHERE product_id = ?
    `, [cardId]);
    
    if (card.length === 0) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    const cardData = card[0];
    
    // Get graded prices
    const gradedPrices = await query(`
      SELECT 
        grading_service,
        grade,
        price,
        market_trend,
        sales_velocity,
        last_updated
      FROM graded_prices 
      WHERE product_id = ?
      ORDER BY grading_service, grade DESC
    `, [cardId]);
    
    // Group graded prices by service
    const groupedGradedPrices = {};
    gradedPrices.forEach(price => {
      if (!groupedGradedPrices[price.grading_service]) {
        groupedGradedPrices[price.grading_service] = [];
      }
      groupedGradedPrices[price.grading_service].push({
        grade: price.grade,
        price: price.price,
        market_trend: price.market_trend,
        sales_velocity: price.sales_velocity,
        last_updated: price.last_updated
      });
    });
    
    const pricingData = {
      card: {
        id: cardData.product_id,
        name: cardData.name,
        market_price: cardData.market_price
      },
      conditions: {
        near_mint: cardData.nm_price,
        lightly_played: cardData.lp_price,
        moderately_played: cardData.mp_price,
        heavily_played: cardData.hp_price,
        damaged: cardData.dmg_price,
        last_updated: cardData.condition_last_updated
      },
      graded: groupedGradedPrices,
      last_updated: {
        conditions: cardData.condition_last_updated,
        graded: cardData.graded_last_updated
      }
    };
    
    res.json({ success: true, data: pricingData });
  } catch (error) {
    console.error('Pricing data error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch pricing data' });
  }
});

export default router;

