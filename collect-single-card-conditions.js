import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_KEY = 'pokeprice_pro_062976b28c69cf8011cb8b728d2ebc4a2b4af606e1347c56';
const API_BASE_URL = 'https://www.pokemonpricetracker.com/api/v2';
const DB_PATH = path.join(__dirname, 'cards.db');

async function collectCardConditions(productId) {
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  try {
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`\n📊 Collecting all conditions for card ${productId}...`);
    
    // Fetch comprehensive pricing
    const url = `${API_BASE_URL}/cards?tcgPlayerId=${productId}&includeBoth=true&includeEbay=true`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    });
    
    const cardData = await response.json();
    
    if (!cardData || !cardData.data || !cardData.data.prices) {
      console.log('⚠️  No pricing data available');
      return;
    }

    const card = cardData.data;
    console.log(`✅ Found: ${card.name}`);
    
    // Store ALL conditions
    if (card.prices.conditions) {
      console.log('📝 Storing conditions:');
      for (const [condition, pricing] of Object.entries(card.prices.conditions)) {
        if (pricing && pricing.price) {
          // Check if record already exists
          const exists = await db.get(`
            SELECT id FROM price_history 
            WHERE product_id = ? AND date = ? AND condition = ?
          `, [productId, today, condition]);
          
          if (exists) {
            await db.run(`
              UPDATE price_history 
              SET price = ?, volume = ?, source = ?
              WHERE product_id = ? AND date = ? AND condition = ?
            `, [
              pricing.price,
              pricing.listings || 0,
              `pokemonpricetracker-${condition.toLowerCase().replace(/\s+/g, '-')}`,
              productId,
              today,
              condition
            ]);
          } else {
            await db.run(`
              INSERT INTO price_history (
                product_id, date, price, volume, condition, source
              ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
              productId,
              today,
              pricing.price,
              pricing.listings || 0,
              condition,
              `pokemonpricetracker-${condition.toLowerCase().replace(/\s+/g, '-')}`
            ]);
          }
          console.log(`   ✅ ${condition}: $${pricing.price.toFixed(2)}`);
        }
      }
    }
    
    // Store Near Mint if not in conditions
    if (card.prices.market && !card.prices.conditions?.['Near Mint']) {
      await db.run(`
        INSERT OR REPLACE INTO price_history (
          product_id, date, price, volume, condition, source
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [productId, today, card.prices.market, 0, 'Near Mint', 'pokemonpricetracker-raw']);
      console.log(`   ✅ Near Mint (market): $${card.prices.market.toFixed(2)}`);
    }
    
    console.log('✅ Complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.close();
  }
}

const productId = process.argv[2] || '84196';
collectCardConditions(productId);

