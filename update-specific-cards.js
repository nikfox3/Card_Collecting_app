#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fetch from 'node-fetch';

const db = new sqlite3.Database('./database/cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

async function updateSpecificCards() {
  console.log('🔄 Updating specific test cards...\n');
  
  const cardIds = ['swsh7-95', 'swsh7-217', 'base1-4'];
  
  for (const cardId of cardIds) {
    try {
      // Get card from database
      const card = await get('SELECT id, name, current_value FROM cards WHERE id = ?', [cardId]);
      
      if (!card) {
        console.log(`⚠️  Card ${cardId} not found in database`);
        continue;
      }
      
      console.log(`🔍 ${card.name} (${cardId})`);
      console.log(`   Current DB price: $${card.current_value}`);
      
      // Fetch from TCGdex
      const url = `https://api.tcgdex.net/v2/en/cards/${cardId}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        console.log(`   ❌ Not found in TCGdex\n`);
        continue;
      }
      
      const cardData = await response.json();
      
      // Extract price
      let price = null;
      
      if (cardData.pricing) {
        // Try TCGPlayer USD first
        if (cardData.pricing.tcgplayer) {
          const tcp = cardData.pricing.tcgplayer;
          price = tcp.holofoil?.marketPrice || tcp.normal?.marketPrice;
        }
        
        // Fallback to Cardmarket EUR
        if (!price && cardData.pricing.cardmarket) {
          const cm = cardData.pricing.cardmarket;
          const eurPrice = cm['avg1'] || cm['avg7'] || cm['avg30'] || cm.avg || cm.trend;
          if (eurPrice) {
            price = eurPrice * 1.10; // Convert EUR to USD
          }
        }
      }
      
      if (price) {
        console.log(`   💰 TCGdex price: $${price.toFixed(2)}`);
        
        // Update database
        const result = await run(
          'UPDATE cards SET current_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [price, cardId]
        );
        
        console.log(`   ✅ Database updated!`);
        
        // Verify update
        const updated = await get('SELECT current_value, updated_at FROM cards WHERE id = ?', [cardId]);
        console.log(`   ✓ Verified: $${updated.current_value} (updated: ${updated.updated_at})`);
      } else {
        console.log(`   ⚠️  No price found`);
      }
      
      console.log('');
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`❌ Error updating ${cardId}:`, error.message);
    }
  }
  
  db.close();
  console.log('🎉 Done!');
}

updateSpecificCards();








