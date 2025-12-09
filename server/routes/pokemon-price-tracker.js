import express from 'express';
import { query, get } from '../utils/database.js';
import { config } from '../config.js';

const router = express.Router();

// API Key from config
const API_KEY = config.pokemonPriceTrackerAPIKey;
const API_BASE_URL = 'https://pokemonpricetracker.com/api';

// Make API request helper
async function makeAPIRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Pokemon Price Tracker API error:', error);
    throw error;
  }
}

// Get RAW card price
router.get('/raw/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const data = await makeAPIRequest(`/prices/raw/${productId}`);
    
    const priceData = {
      product_id: productId,
      date: new Date().toISOString().split('T')[0],
      low_price: data.low || 0,
      mid_price: data.mid || 0,
      high_price: data.high || 0,
      market_price: data.market || 0,
      source: 'pokemonpricetracker-raw',
      created_at: new Date().toISOString()
    };

    // Store in database with proper schema
    await query(`
      INSERT OR REPLACE INTO price_history (
        product_id, date, price, volume, condition, source
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      priceData.product_id,
      priceData.date,
      priceData.mid_price || priceData.market_price || priceData.low_price || 0,
      0,
      'Near Mint',
      priceData.source
    ]);

    res.json({ success: true, data: priceData });
  } catch (error) {
    console.error('Error getting RAW price:', error);
    res.status(500).json({ error: 'Failed to get RAW price', message: error.message });
  }
});

// Get PSA graded prices (all grades)
router.get('/psa/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const data = await makeAPIRequest(`/prices/psa/${productId}`);
    
    const today = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();
    
    // Return all grades
    const result = {
      product_id: productId,
      date: today,
      grades: data,
      timestamp: timestamp
    };
    
    // Store each grade in database with proper schema
    for (const grade in data) {
      const gradeData = data[grade];
      
      // Insert with new schema
      await query(`
        INSERT OR REPLACE INTO price_history (
          product_id, date, price, volume, grade, condition, population, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        productId,
        today,
        gradeData.mid || gradeData.low || gradeData.high || 0,
        0,
        grade,
        'Graded',
        gradeData.population || 0,
        `pokemonpricetracker-psa-${grade}`
      ]);
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting PSA prices:', error);
    res.status(500).json({ error: 'Failed to get PSA prices', message: error.message });
  }
});

// Get comprehensive pricing (RAW + all PSA grades)
router.get('/comprehensive/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    // Get both RAW and PSA prices
    const [rawData, psaData] = await Promise.all([
      makeAPIRequest(`/prices/raw/${productId}`),
      makeAPIRequest(`/prices/psa/${productId}`)
    ]);

    const result = {
      product_id: productId,
      date: new Date().toISOString().split('T')[0],
      raw: rawData,
      psa: psaData,
      timestamp: new Date().toISOString()
    };

    // Store RAW price with proper schema
    await query(`
      INSERT OR REPLACE INTO price_history (
        product_id, date, price, volume, condition, source
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      productId,
      result.date,
      rawData.mid || rawData.market || rawData.low || 0,
      0,
      'Near Mint',
      'pokemonpricetracker-raw'
    ]);

    // Store PSA prices with proper schema
    for (const grade in psaData) {
      const gradeData = psaData[grade];
      await query(`
        INSERT OR REPLACE INTO price_history (
          product_id, date, price, volume, grade, condition, population, source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        productId,
        result.date,
        gradeData.mid || gradeData.low || gradeData.high || 0,
        0,
        grade,
        'Graded',
        gradeData.population || 0,
        `pokemonpricetracker-psa-${grade}`
      ]);
    }

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error getting comprehensive pricing:', error);
    res.status(500).json({ error: 'Failed to get comprehensive pricing', message: error.message });
  }
});

// Get price history with enhancements
router.get('/history/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { type = 'both', range = '6m' } = req.query;
    
    const data = await makeAPIRequest(`/history/${productId}?type=${type}&range=${range}`);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting price history:', error);
    res.status(500).json({ error: 'Failed to get price history', message: error.message });
  }
});

// Get PSA population data
router.get('/population/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    
    const data = await makeAPIRequest(`/psa/population/${productId}`);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting PSA population:', error);
    res.status(500).json({ error: 'Failed to get PSA population', message: error.message });
  }
});

// Get trending cards from Pokemon Price Tracker API
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const data = await makeAPIRequest(`/trending?limit=${limit}`);
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error getting trending cards from API:', error);
    res.status(500).json({ error: 'Failed to get trending cards', message: error.message });
  }
});

export default router;

