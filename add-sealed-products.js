#!/usr/bin/env node

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./cards.db');
const run = promisify(db.run.bind(db));
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

class SealedProductsAdder {
  constructor() {
    this.addedCount = 0;
    this.errorCount = 0;
  }

  async addSealedProducts() {
    try {
      console.log('🔄 Adding Sealed Products to Database...\n');

      // Get some popular sets to associate sealed products with
      const popularSets = await all(`
        SELECT group_id, name FROM groups 
        WHERE name IN ('Base Set', 'Jungle', 'Fossil', 'Base Set 2', 'Team Rocket', 
                      'Neo Genesis', 'Neo Discovery', 'Neo Revelation', 'Neo Destiny',
                      'Expedition Base Set', 'Aquapolis', 'Skyridge', 'Ruby & Sapphire',
                      'Diamond & Pearl', 'Black & White', 'XY', 'Sun & Moon', 
                      'Sword & Shield', 'Scarlet & Violet', '151', 'Astral Radiance',
                      'Brilliant Stars', 'Lost Origin', 'Silver Tempest', 'Crown Zenith',
                      'Paldea Evolved', 'Obsidian Flames', 'Paradox Rift', 'Temporal Forces')
        ORDER BY name
      `);

      console.log(`📚 Found ${popularSets.length} popular sets to add sealed products for\n`);

      // Define sealed products for each set
      const sealedProducts = [
        // Booster Packs
        { name: 'Booster Pack', type: 'Sealed Product', rarity: 'Common', description: 'Single booster pack containing random cards' },
        { name: 'Booster Bundle', type: 'Sealed Product', rarity: 'Uncommon', description: 'Bundle of 6 booster packs' },
        { name: 'Booster Box', type: 'Sealed Product', rarity: 'Rare', description: 'Box containing 36 booster packs' },
        
        // Elite Trainer Boxes
        { name: 'Elite Trainer Box', type: 'Sealed Product', rarity: 'Ultra Rare', description: 'Premium box with 10 booster packs, dice, sleeves, and more' },
        { name: 'Elite Trainer Box Plus', type: 'Sealed Product', rarity: 'Ultra Rare', description: 'Enhanced Elite Trainer Box with additional items' },
        
        // Collection Boxes
        { name: 'Collection Box', type: 'Sealed Product', rarity: 'Rare', description: 'Special collection box with themed contents' },
        { name: 'Premium Collection Box', type: 'Sealed Product', rarity: 'Ultra Rare', description: 'Premium collection box with exclusive items' },
        { name: 'Holiday Collection Box', type: 'Sealed Product', rarity: 'Rare', description: 'Limited edition holiday collection box' },
        
        // Special Products
        { name: 'Booster Bundle Display', type: 'Sealed Product', rarity: 'Rare', description: 'Display case containing multiple booster bundles' },
        { name: 'Booster Pack Display', type: 'Sealed Product', rarity: 'Uncommon', description: 'Display case containing multiple booster packs' },
        { name: 'Theme Deck', type: 'Sealed Product', rarity: 'Uncommon', description: 'Pre-constructed deck with 60 cards' },
        { name: 'Starter Deck', type: 'Sealed Product', rarity: 'Common', description: 'Beginner-friendly pre-constructed deck' },
        
        // Promotional Products
        { name: 'Promo Pack', type: 'Sealed Product', rarity: 'Uncommon', description: 'Special promotional pack with exclusive cards' },
        { name: 'Championship Pack', type: 'Sealed Product', rarity: 'Rare', description: 'Tournament championship pack' },
        { name: 'Prerelease Pack', type: 'Sealed Product', rarity: 'Rare', description: 'Prerelease event pack with exclusive cards' },
        
        // Digital Products
        { name: 'Code Card', type: 'Sealed Product', rarity: 'Common', description: 'Digital code for online game redemption' },
        { name: 'Code Card Pack', type: 'Sealed Product', rarity: 'Uncommon', description: 'Bundle of digital code cards' },
        
        // Special Editions
        { name: 'Special Edition Box', type: 'Sealed Product', rarity: 'Ultra Rare', description: 'Limited edition special box' },
        { name: 'Anniversary Box', type: 'Sealed Product', rarity: 'Ultra Rare', description: 'Commemorative anniversary edition box' },
        { name: 'Holiday Box', type: 'Sealed Product', rarity: 'Rare', description: 'Special holiday-themed collection box' }
      ];

      console.log(`📦 Adding ${sealedProducts.length} types of sealed products for ${popularSets.length} sets...\n`);

      for (const set of popularSets) {
        for (const product of sealedProducts) {
          try {
            // Generate a unique product ID
            const productId = Math.floor(Math.random() * 10000000) + 1000000;
            
            // Create product name with set
            const productName = `${set.name} ${product.name}`;
            
            // Generate a realistic price range based on product type
            let basePrice = 0;
            if (product.name.includes('Booster Pack')) basePrice = 4.99;
            else if (product.name.includes('Booster Bundle')) basePrice = 24.99;
            else if (product.name.includes('Booster Box')) basePrice = 144.99;
            else if (product.name.includes('Elite Trainer Box')) basePrice = 49.99;
            else if (product.name.includes('Collection Box')) basePrice = 29.99;
            else if (product.name.includes('Theme Deck')) basePrice = 14.99;
            else if (product.name.includes('Code Card')) basePrice = 0.99;
            else basePrice = 19.99;

            // Add some price variation
            const priceVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
            const finalPrice = basePrice * (1 + priceVariation);

            // Insert the sealed product
            await run(`
              INSERT INTO products (
                product_id, name, ext_card_type, ext_rarity, group_id, 
                market_price, low_price, mid_price, high_price,
                ext_number, artist, image_url
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              productId,
              productName,
              product.type,
              product.rarity,
              set.group_id,
              finalPrice,
              finalPrice * 0.8, // Low price (20% below market)
              finalPrice,        // Mid price (same as market)
              finalPrice * 1.2, // High price (20% above market)
              `SP-${Math.floor(Math.random() * 1000)}`, // Special product number
              'Pokémon Company', // Default artist for sealed products
              '' // No image URL for now
            ]);

            this.addedCount++;

            if (this.addedCount % 100 === 0) {
              console.log(`📦 Added ${this.addedCount} sealed products...`);
            }

          } catch (error) {
            console.error(`❌ Error adding ${product.name} for ${set.name}:`, error.message);
            this.errorCount++;
          }
        }
      }

      console.log('\n🎉 Sealed products addition complete!\n');
      console.log('📊 Final Statistics:');
      console.log(`   • Sealed products added: ${this.addedCount}`);
      console.log(`   • Errors: ${this.errorCount}`);
      console.log(`   • Success rate: ${((this.addedCount / (this.addedCount + this.errorCount)) * 100).toFixed(1)}%`);

      // Show breakdown by product type
      console.log('\n📊 Breakdown by sealed product type:');
      const breakdown = await all(`
        SELECT 
          CASE 
            WHEN name LIKE '%Booster Pack%' AND name NOT LIKE '%Bundle%' AND name NOT LIKE '%Box%' THEN 'Booster Packs'
            WHEN name LIKE '%Booster Bundle%' THEN 'Booster Bundles'
            WHEN name LIKE '%Booster Box%' THEN 'Booster Boxes'
            WHEN name LIKE '%Elite Trainer Box%' THEN 'Elite Trainer Boxes'
            WHEN name LIKE '%Collection Box%' THEN 'Collection Boxes'
            WHEN name LIKE '%Theme Deck%' OR name LIKE '%Starter Deck%' THEN 'Decks'
            WHEN name LIKE '%Code Card%' THEN 'Code Cards'
            ELSE 'Other Sealed Products'
          END as product_type,
          COUNT(*) as count
        FROM products 
        WHERE ext_card_type = 'Sealed Product'
        GROUP BY product_type
        ORDER BY count DESC
      `);
      
      for (const item of breakdown) {
        console.log(`   ${item.product_type}: ${item.count} products`);
      }

    } catch (error) {
      console.error('❌ Sealed products addition failed:', error.message);
    } finally {
      db.close();
    }
  }
}

// Run the addition
const adder = new SealedProductsAdder();
adder.addSealedProducts();




