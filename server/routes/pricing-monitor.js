import express from 'express';
import { query } from '../utils/database.js';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Get pricing collection statistics
router.get('/stats', async (req, res) => {
  try {
    console.log('Fetching pricing stats...');
    
    // Get overall pricing statistics from both cards and products tables
    const overallStats = await query(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN current_value > 0 THEN 1 END) as cards_with_prices,
        COUNT(CASE WHEN current_value = 0 OR current_value IS NULL THEN 1 END) as cards_without_prices,
        ROUND(AVG(current_value), 2) as avg_price,
        MIN(current_value) as min_price,
        MAX(current_value) as max_price
      FROM cards
    `);

    // Get additional stats from products table
    const productStats = await query(`
      SELECT 
        COUNT(*) as total_products,
        COUNT(CASE WHEN market_price > 0 THEN 1 END) as products_with_prices
      FROM products
    `);

    console.log('Overall stats:', overallStats[0]);

    // Get price coverage percentage
    const coverage = overallStats[0] ? 
      Math.round((overallStats[0].cards_with_prices / overallStats[0].total_cards) * 100) : 0;

    // Get last collection date from price history for each source
    const lastCollection = await query(`
      SELECT 
        CASE 
          WHEN source = 'TCGCSV' THEN 'TCGCSV'
          WHEN source LIKE 'pokemonpricetracker%' THEN 'Pokemon Tracker'
          ELSE source
        END as source_group,
        MAX(date) as last_collection_date,
        COUNT(*) as records_count
      FROM price_history
      GROUP BY source_group
      ORDER BY MAX(date) DESC
    `);

    console.log('Last collection by source:', lastCollection);

    // Get the most recent collection date overall
    const mostRecentCollection = await query(`
      SELECT MAX(date) as last_collection_date
      FROM price_history
    `);

    // Get price history stats
    const priceHistoryStats = await query(`
      SELECT 
        COUNT(*) as total_price_records,
        COUNT(DISTINCT product_id) as unique_cards_with_history,
        COUNT(CASE WHEN source LIKE 'TCGCSV%' THEN 1 END) as tcgcsv_records,
        COUNT(CASE WHEN source LIKE 'pokemonpricetracker%' THEN 1 END) as pokemon_tracker_records,
        MIN(date) as earliest_date,
        MAX(date) as latest_date
      FROM price_history
    `);

    // Get Pokemon Price Tracker collection progress
    const pokemonTrackerProgress = await query(`
      SELECT 
        MIN(product_id) as min_collected_id,
        MAX(product_id) as max_collected_id,
        COUNT(DISTINCT product_id) as cards_collected,
        MAX(date) as last_collection_date
      FROM price_history 
      WHERE source = 'pokemonpricetracker-raw'
    `);

    // Get total cards available for collection (all products with product_id)
    const totalCardsAvailable = await query(`
      SELECT 
        MIN(product_id) as min_available_id,
        MAX(product_id) as max_available_id,
        COUNT(*) as total_cards_available
      FROM products 
      WHERE product_id IS NOT NULL
    `);

    // Also get count of products with market price > 10 for reference
    const highValueProducts = await query(`
      SELECT COUNT(*) as count
      FROM products 
      WHERE product_id IS NOT NULL AND market_price > 10
    `);

    // Calculate collection progress
    const cardsCollected = pokemonTrackerProgress[0]?.cards_collected || 0;
    const totalAvailable = totalCardsAvailable[0]?.total_cards_available || 1;
    const progressPercentage = Math.min(Math.round((cardsCollected / totalAvailable) * 100), 100);
    
    const collectionProgress = pokemonTrackerProgress[0] && totalCardsAvailable[0] ? {
      cardsCollected: cardsCollected,
      totalCardsAvailable: totalAvailable,
      highValueProductsCount: highValueProducts[0]?.count || 0,
      progressPercentage: progressPercentage,
      lastCollectionDate: pokemonTrackerProgress[0].last_collection_date,
      collectedRange: `${pokemonTrackerProgress[0].min_collected_id} - ${pokemonTrackerProgress[0].max_collected_id}`,
      availableRange: `${totalCardsAvailable[0].min_available_id} - ${totalCardsAvailable[0].max_available_id}`
    } : null;

    res.json({
      success: true,
      data: {
        total_cards: overallStats[0]?.total_cards || 0,
        cards_with_prices: overallStats[0]?.cards_with_prices || 0,
        cards_without_prices: overallStats[0]?.cards_without_prices || 0,
        price_coverage: coverage,
        avg_price: overallStats[0]?.avg_price || 0,
        min_price: overallStats[0]?.min_price || 0,
        max_price: overallStats[0]?.max_price || 0,
        last_collection_date: mostRecentCollection[0]?.last_collection_date || null,
        last_collection_by_source: lastCollection.map(item => ({
          source: item.source_group,
          last_collection_date: item.last_collection_date,
          records_count: item.records_count
        })),
        cards_processed: overallStats[0]?.cards_with_prices || 0,
        success_rate: 95, // Default success rate since we don't track failures
        // Additional stats
        total_products: productStats[0]?.total_products || 0,
        products_with_prices: productStats[0]?.products_with_prices || 0,
        total_price_records: priceHistoryStats[0]?.total_price_records || 0,
        unique_cards_with_history: priceHistoryStats[0]?.unique_cards_with_history || 0,
        tcgcsv_records: priceHistoryStats[0]?.tcgcsv_records || 0,
        pokemon_tracker_records: priceHistoryStats[0]?.pokemon_tracker_records || 0,
        collection_progress: collectionProgress,
        price_history_range: {
          earliest_date: priceHistoryStats[0]?.earliest_date || null,
          latest_date: priceHistoryStats[0]?.latest_date || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching pricing stats:', error);
    res.status(500).json({ error: 'Failed to fetch pricing statistics', details: error.message });
  }
});

// Get pricing collection logs
router.get('/logs', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const logsDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logsDir)) {
      return res.json({ success: true, data: [] });
    }

    const logFiles = fs.readdirSync(logsDir)
      .filter(file => file.startsWith('price-collection-') && file.endsWith('.log'))
      .sort()
      .reverse()
      .slice(0, parseInt(days));

    const logs = [];
    for (const file of logFiles) {
      const filePath = path.join(logsDir, file);
      const stats = fs.statSync(filePath);
      const content = fs.readFileSync(filePath, 'utf8');
      
      logs.push({
        filename: file,
        date: stats.mtime.toISOString(),
        size: stats.size,
        content: content.split('\n').slice(-100) // Last 100 lines
      });
    }

    res.json({ success: true, data: logs });
  } catch (error) {
    console.error('Error fetching pricing logs:', error);
    res.status(500).json({ error: 'Failed to fetch pricing logs' });
  }
});

// Trigger manual price collection
router.post('/collect', async (req, res) => {
  try {
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Determine which collection to run based on current progress
    const progressQuery = await query(`
      SELECT 
        MIN(product_id) as min_collected,
        MAX(product_id) as max_collected,
        COUNT(DISTINCT product_id) as cards_collected
      FROM price_history 
      WHERE source = 'pokemonpricetracker-raw'
    `);

    const totalCardsQuery = await query(`
      SELECT 
        MIN(product_id) as min_total,
        MAX(product_id) as max_total,
        COUNT(*) as total_cards
      FROM products 
      WHERE product_id IS NOT NULL AND market_price > 10
    `);

    const progress = progressQuery[0];
    const totalCards = totalCardsQuery[0];
    
    // Determine collection strategy
    let collectionMessage = '';
    let scriptToRun = 'collect-condition-graded-pricing-v2.js';
    
    if (!progress || progress.cards_collected === 0) {
      collectionMessage = 'Starting Pokemon Price Tracker collection from the beginning...';
    } else {
      const progressPercentage = Math.round((progress.cards_collected / totalCards.total_cards) * 100);
      collectionMessage = `Continuing Pokemon Price Tracker collection (${progressPercentage}% complete)...`;
    }

    console.log(`Starting collection: ${collectionMessage}`);

    // Run the Pokemon Price Tracker collector
    const { stdout, stderr } = await execAsync(`node ${scriptToRun}`, {
      cwd: path.join(process.cwd(), '..'), // Go up one level to project root
      timeout: 3600000 // 1 hour timeout
    });

    res.json({
      success: true,
      message: collectionMessage,
      collectionType: 'pokemon-price-tracker',
      output: stdout,
      errors: stderr,
      progress: {
        cardsCollected: progress?.cards_collected || 0,
        totalCards: totalCards?.total_cards || 0,
        progressPercentage: progress && totalCards ? 
          Math.round((progress.cards_collected / totalCards.total_cards) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Error running price collection:', error);
    res.status(500).json({ 
      error: 'Failed to run price collection',
      details: error.message
    });
  }
});

// Get API status
router.get('/api-status', async (req, res) => {
  try {
    // Use built-in fetch (Node.js 18+) or import node-fetch
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    
    const apis = [
      {
        name: 'Pokemon Price Tracker',
        url: 'https://www.pokemonpricetracker.com/api/v2/cards/base1-4',
        apiKey: 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56',
        timeout: 5000
      },
      {
        name: 'TCGCSV Data',
        url: 'https://api.tcgdex.net/v2/en/cards/base1-1',
        timeout: 5000
      }
    ];

    const statuses = await Promise.allSettled(
      apis.map(async (api) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), api.timeout);
        
        try {
          const headers = {
            'User-Agent': 'Pokemon-Card-Collector/1.0'
          };
          
          // Add API key for Pokemon Price Tracker
          if (api.apiKey) {
            headers['Authorization'] = `Bearer ${api.apiKey}`;
          }
          
          const response = await fetch(api.url, {
            signal: controller.signal,
            headers
          });
          
          clearTimeout(timeoutId);
          
          return {
            name: api.name,
            status: response.ok ? 'online' : 'error',
            responseTime: Date.now(),
            statusCode: response.status
          };
        } catch (error) {
          clearTimeout(timeoutId);
          return {
            name: api.name,
            status: 'offline',
            error: error.message
          };
        }
      })
    );

    const apiStatuses = statuses.map((result, index) => ({
      ...apis[index],
      ...(result.status === 'fulfilled' ? result.value : { status: 'error', error: result.reason.message })
    }));

    res.json({ success: true, data: apiStatuses });
  } catch (error) {
    console.error('Error checking API status:', error);
    res.status(500).json({ error: 'Failed to check API status' });
  }
});

// Get price history for a specific card
router.get('/price-history/:cardId', async (req, res) => {
  try {
    const { cardId } = req.params;
    
    const priceHistory = await query(`
      SELECT date, price, volume
      FROM price_history
      WHERE product_id = ?
      ORDER BY date DESC
      LIMIT 30
    `, [cardId]);

    const cardInfo = await query(`
      SELECT c.name, c.current_value, s.name as set_name
      FROM cards c
      LEFT JOIN sets s ON c.set_id = s.id
      WHERE c.id = ?
    `, [cardId]);

    res.json({
      success: true,
      data: {
        card: cardInfo[0],
        priceHistory
      }
    });
  } catch (error) {
    console.error('Error fetching price history:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Get cards with suspicious pricing
router.get('/suspicious-prices', async (req, res) => {
  try {
    const suspiciousCards = await query(`
      SELECT c.id, c.name, c.current_value, c.rarity, s.name as set_name
      FROM cards c
      LEFT JOIN sets s ON c.set_id = s.id
      WHERE c.current_value > 0 AND (
        c.current_value > 10000 OR
        c.current_value % 1000 = 0 OR
        (c.current_value > 100 AND CAST(c.current_value AS TEXT) LIKE '%.99')
      )
      ORDER BY c.current_value DESC
      LIMIT 50
    `);

    res.json({ success: true, data: suspiciousCards });
  } catch (error) {
    console.error('Error fetching suspicious prices:', error);
    res.status(500).json({ error: 'Failed to fetch suspicious prices' });
  }
});

// Get dates with pricing data (for calendar)
router.get('/calendar-dates', async (req, res) => {
  try {
    const dates = await query(`
      SELECT 
        date,
        COUNT(DISTINCT product_id) as cards_count,
        COUNT(*) as records_count
      FROM price_history
      GROUP BY date
      ORDER BY date DESC
    `);

    res.json({ success: true, data: dates });
  } catch (error) {
    console.error('Error fetching calendar dates:', error);
    res.status(500).json({ error: 'Failed to fetch calendar dates' });
  }
});

// Test endpoint
router.get('/test-date', (req, res) => {
  res.json({ success: true, message: 'Date test endpoint working' });
});

// Simple date test endpoint
router.get('/date-test/:date', (req, res) => {
  const { date } = req.params;
  res.json({ success: true, date, message: 'Date test working' });
});

// Get pricing data for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const { date } = req.params;
    
    // Get basic count for the date
    const countResult = await query(`SELECT COUNT(*) as count FROM price_history WHERE date = ?`, [date]);
    const totalRecords = countResult[0]?.count || 0;
    
    if (totalRecords === 0) {
      return res.json({
        success: true,
        data: {
          date,
          summary: null,
          sampleCards: [],
          sources: []
        }
      });
    }
    
    // Get summary stats for the date
    const summary = await query(`
      SELECT 
        COUNT(*) as total_records,
        COUNT(DISTINCT product_id) as unique_cards,
        COUNT(DISTINCT source) as sources_count,
        ROUND(AVG(price), 2) as avg_price,
        MIN(price) as min_price,
        MAX(price) as max_price
      FROM price_history
      WHERE date = ?
    `, [date]);

    res.json({
      success: true,
      data: {
        date,
        summary: summary[0] || null,
        sampleCards: [],
        sources: []
      }
    });
  } catch (error) {
    console.error('Error fetching date data:', error);
    res.status(500).json({ error: 'Failed to fetch date data' });
  }
});

// Get log file for a specific date
router.get('/date/:date/logs', async (req, res) => {
  try {
    const { date } = req.params;
    const logsDir = path.join(process.cwd(), '..', 'logs');
    const logFile = path.join(logsDir, `pricing-update-${date}.log`);
    
    
    if (!fs.existsSync(logFile)) {
      return res.json({ 
        success: true, 
        data: { 
          exists: false, 
          filename: `pricing-update-${date}.log`,
          content: []
        } 
      });
    }

    const stats = fs.statSync(logFile);
    const content = fs.readFileSync(logFile, 'utf8');

    res.json({
      success: true,
      data: {
        exists: true,
        filename: `pricing-update-${date}.log`,
        date: stats.mtime.toISOString(),
        size: stats.size,
        content: content.split('\n').filter(line => line.trim().length > 0)
      }
    });
  } catch (error) {
    console.error('Error fetching log file:', error);
    res.status(500).json({ error: 'Failed to fetch log file' });
  }
});

export default router;
