const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const PokemonPriceTrackerService = require('./server/services/pokemonPriceTracker');

console.log('🔄 UPDATING CONDITION & GRADED PRICES');
console.log('=====================================');

const dbPath = path.resolve(__dirname, './cards.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

const pokemonPriceTracker = new PokemonPriceTrackerService();

/**
 * Get high-value cards that need condition/graded pricing
 */
async function getPriorityCards(limit = 50) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT 
        product_id,
        name,
        market_price,
        nm_price,
        condition_last_updated,
        graded_last_updated
      FROM products 
      WHERE market_price > 10 
        AND (nm_price IS NULL 
             OR condition_last_updated IS NULL 
             OR condition_last_updated < datetime('now', '-7 days')
             OR graded_last_updated IS NULL 
             OR graded_last_updated < datetime('now', '-7 days'))
      ORDER BY market_price DESC
      LIMIT ?
    `;
    
    db.all(sql, [limit], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

/**
 * Update condition prices in database
 */
async function updateConditionPrices(productId, conditionPrices) {
  return new Promise((resolve, reject) => {
    const sql = `
      UPDATE products 
      SET nm_price = ?,
          lp_price = ?,
          mp_price = ?,
          hp_price = ?,
          dmg_price = ?,
          condition_last_updated = CURRENT_TIMESTAMP
      WHERE product_id = ?
    `;
    
    const params = [
      conditionPrices.nm_price,
      conditionPrices.lp_price,
      conditionPrices.mp_price,
      conditionPrices.hp_price,
      conditionPrices.dmg_price,
      productId
    ];
    
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        console.log(`✅ Updated condition prices for product ${productId} (${this.changes} rows)`);
        resolve(this.changes);
      }
    });
  });
}

/**
 * Update graded prices in database
 */
async function updateGradedPrices(productId, gradedPrices) {
  return new Promise((resolve, reject) => {
    // First, delete existing graded prices for this product
    const deleteSql = 'DELETE FROM graded_prices WHERE product_id = ?';
    
    db.run(deleteSql, [productId], (err) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (gradedPrices.length === 0) {
        resolve(0);
        return;
      }
      
      // Insert new graded prices
      const insertSql = `
        INSERT INTO graded_prices 
        (product_id, grading_service, grade, price, market_trend, sales_velocity, last_updated)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      let completed = 0;
      let total = gradedPrices.length;
      
      gradedPrices.forEach(gradeData => {
        const params = [
          productId,
          gradeData.grading_service,
          gradeData.grade,
          gradeData.price,
          gradeData.market_trend,
          gradeData.sales_velocity
        ];
        
        db.run(insertSql, params, (err) => {
          if (err) {
            console.error(`❌ Error inserting graded price: ${err.message}`);
          } else {
            console.log(`✅ Inserted ${gradeData.grading_service} ${gradeData.grade} price: $${gradeData.price}`);
          }
          
          completed++;
          if (completed === total) {
            resolve(total);
          }
        });
      });
    });
  });
}

/**
 * Update graded last updated timestamp
 */
async function updateGradedTimestamp(productId) {
  return new Promise((resolve, reject) => {
    const sql = 'UPDATE products SET graded_last_updated = CURRENT_TIMESTAMP WHERE product_id = ?';
    
    db.run(sql, [productId], function(err) {
      if (err) {
        reject(err);
      } else {
        resolve(this.changes);
      }
    });
  });
}

/**
 * Main collection process
 */
async function collectConditionAndGradedPrices() {
  try {
    console.log('\n📊 Step 1: Getting priority cards...');
    const priorityCards = await getPriorityCards(50);
    console.log(`✅ Found ${priorityCards.length} priority cards`);
    
    if (priorityCards.length === 0) {
      console.log('✅ No cards need updating at this time');
      return;
    }
    
    console.log('\n📊 Step 2: Checking rate limit...');
    const rateLimitStatus = pokemonPriceTracker.getRateLimitStatus();
    console.log(`📈 Rate limit: ${rateLimitStatus.used}/${rateLimitStatus.remaining + rateLimitStatus.used} used`);
    
    if (rateLimitStatus.used >= 100) {
      console.log('⏳ Daily rate limit reached. Try again tomorrow.');
      return;
    }
    
    const maxCards = Math.min(priorityCards.length, Math.floor((100 - rateLimitStatus.used) / 3));
    console.log(`📊 Will process ${maxCards} cards (${maxCards * 3} credits needed)`);
    
    let successCount = 0;
    let errorCount = 0;
    
    console.log('\n📊 Step 3: Collecting pricing data...');
    
    for (let i = 0; i < maxCards; i++) {
      const card = priorityCards[i];
      console.log(`\n🔍 Processing ${i + 1}/${maxCards}: ${card.name} (ID: ${card.product_id})`);
      
      try {
        // Get full pricing data (3 credits per card)
        const pricingData = await pokemonPriceTracker.getFullPricingData(card.product_id);
        
        if (!pricingData) {
          console.log(`⚠️  No pricing data found for ${card.name}`);
          errorCount++;
          continue;
        }
        
        // Update condition prices
        if (pricingData.conditionPrices) {
          await updateConditionPrices(card.product_id, pricingData.conditionPrices);
          console.log(`✅ Condition prices: NM=$${pricingData.conditionPrices.nm_price}, LP=$${pricingData.conditionPrices.lp_price}, MP=$${pricingData.conditionPrices.mp_price}`);
        }
        
        // Update graded prices
        if (pricingData.gradedPrices && pricingData.gradedPrices.length > 0) {
          await updateGradedPrices(card.product_id, pricingData.gradedPrices);
          await updateGradedTimestamp(card.product_id);
          console.log(`✅ Graded prices: ${pricingData.gradedPrices.length} grades found`);
        }
        
        successCount++;
        
        // Small delay to be respectful to API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${card.name}: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n🎉 COLLECTION COMPLETED!');
    console.log('========================');
    console.log(`✅ Successfully processed: ${successCount} cards`);
    console.log(`❌ Errors: ${errorCount} cards`);
    console.log(`📊 Total credits used: ${successCount * 3}`);
    console.log(`📈 Remaining credits: ${100 - (successCount * 3)}`);
    
    // Show rate limit status
    const finalRateLimit = pokemonPriceTracker.getRateLimitStatus();
    console.log(`📊 Final rate limit: ${finalRateLimit.used}/100 used`);
    
  } catch (error) {
    console.error('❌ Collection failed:', error.message);
    process.exit(1);
  } finally {
    db.close();
  }
}

/**
 * Test with a single high-value card
 */
async function testSingleCard() {
  try {
    console.log('\n🧪 TESTING SINGLE CARD');
    console.log('======================');
    
    // Get a high-value card for testing
    const testCard = await new Promise((resolve, reject) => {
      db.get(`
        SELECT product_id, name, market_price 
        FROM products 
        WHERE market_price > 50 
        ORDER BY market_price DESC 
        LIMIT 1
      `, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
    
    if (!testCard) {
      console.log('❌ No high-value cards found for testing');
      return;
    }
    
    console.log(`🔍 Testing with: ${testCard.name} (ID: ${testCard.product_id}, Price: $${testCard.market_price})`);
    
    const pricingData = await pokemonPriceTracker.getFullPricingData(testCard.product_id);
    
    if (pricingData) {
      console.log('✅ Test successful!');
      console.log('📊 Condition prices:', pricingData.conditionPrices);
      console.log('📊 Graded prices:', pricingData.gradedPrices);
    } else {
      console.log('❌ Test failed - no data returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    db.close();
  }
}

// Command line argument handling
const args = process.argv.slice(2);
if (args.includes('--test')) {
  testSingleCard();
} else {
  collectConditionAndGradedPrices();
}






