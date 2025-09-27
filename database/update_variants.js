#!/usr/bin/env node

/**
 * Pokemon Card Variants Updater
 * Fetches variant information from Pokemon TCG API and updates local database
 */

const sqlite3 = require('sqlite3').verbose();
const fetch = require('node-fetch');
const path = require('path');

class VariantUpdater {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'cards.db');
        this.apiBase = 'https://api.pokemontcg.io/v2';
        this.processedCards = 0;
        this.totalCards = 0;
        this.variantMap = {
            'Normal': 'Normal',
            'Holo': 'Holo',
            'Reverse Holo': 'Reverse Holo',
            '1st Edition': '1st Edition'
        };
    }

    async init() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('❌ Database connection failed:', err.message);
                    reject(err);
                } else {
                    console.log('✅ Connected to database');
                    resolve();
                }
            });
        });
    }

    async getCardCount() {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT COUNT(*) as count FROM cards', (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row.count);
                }
            });
        });
    }

    async getAllCards() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT id, name, set_id FROM cards', (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async fetchCardVariantsFromAPI(cardName, setId) {
        try {
            // Search for all variants of this card
            const searchQuery = `name:"${cardName}"`;
            const response = await fetch(`${this.apiBase}/cards?q=${encodeURIComponent(searchQuery)}&pageSize=250`);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }

            const data = await response.json();
            const variants = new Set();

            if (data.data && data.data.length > 0) {
                data.data.forEach(card => {
                    // Check if this card belongs to the same set or is a variant
                    if (card.set && card.set.id === setId) {
                        // Determine variant based on rarity and other indicators
                        const variant = this.determineVariant(card);
                        if (variant) {
                            variants.add(variant);
                        }
                    }
                });
            }

            return Array.from(variants);
        } catch (error) {
            console.error(`❌ Error fetching variants for ${cardName}:`, error.message);
            return ['Normal']; // Default fallback
        }
    }

    determineVariant(card) {
        const rarity = card.rarity || '';
        const name = card.name || '';
        
        // Check for specific variant indicators
        if (rarity.includes('1st Edition') || name.includes('1st Edition')) {
            return '1st Edition';
        }
        
        if (rarity.includes('Reverse Holo') || rarity.includes('Reverse')) {
            return 'Reverse Holo';
        }
        
        if (rarity.includes('Holo') && !rarity.includes('Reverse')) {
            return 'Holo';
        }
        
        // Default to Normal for regular cards
        return 'Normal';
    }

    async updateCardVariants(cardId, variants) {
        return new Promise((resolve, reject) => {
            // Store variants as JSON array
            const variantsJson = JSON.stringify(variants);
            
            this.db.run(
                'UPDATE cards SET variant = ? WHERE id = ?',
                [variantsJson, cardId],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        resolve();
                    }
                }
            );
        });
    }

    async processCard(card) {
        try {
            console.log(`🔍 Processing: ${card.name} (${card.id})`);
            
            // Fetch variants from API
            const variants = await this.fetchCardVariantsFromAPI(card.name, card.set_id);
            
            // Update database with variants
            await this.updateCardVariants(card.id, variants);
            
            console.log(`✅ Updated ${card.name}: [${variants.join(', ')}]`);
            
            this.processedCards++;
            
            // Add small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`❌ Error processing ${card.name}:`, error.message);
            // Continue with next card
        }
    }

    async updateAllVariants() {
        try {
            console.log('🚀 Starting variant update process...');
            
            // Get all cards from database
            const cards = await this.getAllCards();
            this.totalCards = cards.length;
            
            console.log(`📊 Found ${this.totalCards} cards to process`);
            
            // Process cards in batches to avoid overwhelming the API
            const batchSize = 10;
            for (let i = 0; i < cards.length; i += batchSize) {
                const batch = cards.slice(i, i + batchSize);
                
                console.log(`\n📦 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(cards.length/batchSize)}`);
                
                // Process batch concurrently
                await Promise.all(batch.map(card => this.processCard(card)));
                
                // Progress update
                const progress = ((this.processedCards / this.totalCards) * 100).toFixed(1);
                console.log(`📈 Progress: ${this.processedCards}/${this.totalCards} (${progress}%)`);
                
                // Longer delay between batches
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            
            console.log('\n✅ Variant update completed!');
            console.log(`📊 Processed ${this.processedCards} cards`);
            
        } catch (error) {
            console.error('❌ Variant update failed:', error);
        }
    }

    async generateVariantSummary() {
        return new Promise((resolve, reject) => {
            this.db.all(`
                SELECT 
                    variant,
                    COUNT(*) as count
                FROM cards 
                GROUP BY variant
                ORDER BY count DESC
            `, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('\n📊 Variant Distribution Summary:');
                    rows.forEach(row => {
                        console.log(`   ${row.variant}: ${row.count} cards`);
                    });
                    resolve(rows);
                }
            });
        });
    }

    async close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// Main execution
async function main() {
    const updater = new VariantUpdater();
    
    try {
        await updater.init();
        await updater.updateAllVariants();
        await updater.generateVariantSummary();
    } catch (error) {
        console.error('❌ Script failed:', error);
        process.exit(1);
    } finally {
        await updater.close();
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = VariantUpdater;
