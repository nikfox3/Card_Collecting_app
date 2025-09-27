#!/usr/bin/env node

/**
 * Pokémon TCG API Database Sync Script
 * Syncs all cards from the Pokémon TCG API to local SQLite database
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Configuration
const DB_PATH = path.join(__dirname, 'cards.db');
const API_BASE_URL = 'https://api.pokemontcg.io/v2';
const BATCH_SIZE = 100; // Cards per API request
const DELAY_MS = 100; // Delay between requests to respect rate limits

class PokemonTCGSync {
    constructor() {
        this.db = null;
        this.totalCards = 0;
        this.syncedCards = 0;
        this.syncedSets = 0;
    }

    async init() {
        console.log('🗄️  Initializing database...');
        
        // Create database directory if it doesn't exist
        const dbDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dbDir)) {
            fs.mkdirSync(dbDir, { recursive: true });
        }

        // Initialize database
        this.db = new sqlite3.Database(DB_PATH);
        
        // Read and execute schema
        const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
        await this.runQuery(schema);
        
        console.log('✅ Database initialized');
    }

    async runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async runQueryWithResult(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async fetchFromAPI(endpoint, page = 1, pageSize = BATCH_SIZE) {
        const url = `${API_BASE_URL}${endpoint}?page=${page}&pageSize=${pageSize}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`API Error: ${response.status} ${response.statusText}`);
            }
            return await response.json();
        } catch (error) {
            console.error(`❌ API Error for ${endpoint}:`, error.message);
            throw error;
        }
    }

    async syncSets() {
        console.log('🔄 Syncing sets...');
        
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
            try {
                const data = await this.fetchFromAPI('/sets', page);
                
                if (data.data && data.data.length > 0) {
                    for (const set of data.data) {
                        await this.insertSet(set);
                        this.syncedSets++;
                    }
                    
                    console.log(`📦 Synced ${this.syncedSets} sets (page ${page})`);
                    page++;
                    
                    // Check if there are more pages
                    hasMore = data.data.length === BATCH_SIZE;
                } else {
                    hasMore = false;
                }
                
                // Rate limiting
                await this.delay(DELAY_MS);
                
            } catch (error) {
                console.error('❌ Error syncing sets:', error.message);
                hasMore = false;
            }
        }
        
        console.log(`✅ Sets sync complete: ${this.syncedSets} sets`);
    }

    async insertSet(set) {
        const sql = `
            INSERT OR REPLACE INTO sets (
                id, name, series, printed_total, total, legalities,
                ptcgo_code, release_date, updated_at, images
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [
            set.id,
            set.name,
            set.series,
            set.printedTotal,
            set.total,
            JSON.stringify(set.legalities || {}),
            set.ptcgoCode,
            set.releaseDate,
            set.updatedAt,
            JSON.stringify(set.images || {})
        ];
        
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async syncCards() {
        console.log('🔄 Syncing cards...');
        
        // First, get total count
        try {
            const countData = await this.fetchFromAPI('/cards', 1, 1);
            this.totalCards = countData.totalCount;
            console.log(`📊 Total cards to sync: ${this.totalCards}`);
        } catch (error) {
            console.error('❌ Error getting card count:', error.message);
            return;
        }
        
        let page = 1;
        let hasMore = true;
        
        while (hasMore) {
            try {
                const data = await this.fetchFromAPI('/cards', page);
                
                if (data.data && data.data.length > 0) {
                    for (const card of data.data) {
                        await this.insertCard(card);
                        this.syncedCards++;
                        
                        // Progress indicator
                        if (this.syncedCards % 100 === 0) {
                            const progress = ((this.syncedCards / this.totalCards) * 100).toFixed(1);
                            console.log(`🃏 Progress: ${this.syncedCards}/${this.totalCards} (${progress}%)`);
                        }
                    }
                    
                    page++;
                    hasMore = data.data.length === BATCH_SIZE;
                } else {
                    hasMore = false;
                }
                
                // Rate limiting
                await this.delay(DELAY_MS);
                
            } catch (error) {
                console.error('❌ Error syncing cards:', error.message);
                hasMore = false;
            }
        }
        
        console.log(`✅ Cards sync complete: ${this.syncedCards} cards`);
    }

    async insertCard(card) {
        const sql = `
            INSERT OR REPLACE INTO cards (
                id, name, supertype, subtypes, level, hp, types, evolves_from,
                attacks, weaknesses, resistances, retreat_cost, converted_retreat_cost,
                set_id, number, artist, rarity, national_pokedex_numbers,
                legalities, images, tcgplayer, cardmarket, current_value,
                quantity, collected, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Extract current value from TCGPlayer prices
        let currentValue = 0;
        if (card.tcgplayer?.prices) {
            const prices = card.tcgplayer.prices;
            // Try different price types in order of preference
            currentValue = prices.unlimitedHolofoil?.market || 
                          prices.holofoil?.market || 
                          prices.normal?.market || 
                          prices.reverseHolofoil?.market || 0;
        }
        
        const params = [
            card.id,
            card.name,
            card.supertype,
            JSON.stringify(card.subtypes || []),
            card.level,
            card.hp,
            JSON.stringify(card.types || []),
            card.evolvesFrom,
            JSON.stringify(card.attacks || []),
            JSON.stringify(card.weaknesses || []),
            JSON.stringify(card.resistances || []),
            JSON.stringify(card.retreatCost || []),
            card.convertedRetreatCost,
            card.set?.id,
            card.number,
            card.artist,
            card.rarity,
            JSON.stringify(card.nationalPokedexNumbers || []),
            JSON.stringify(card.legalities || {}),
            JSON.stringify(card.images || {}),
            JSON.stringify(card.tcgplayer || {}),
            JSON.stringify(card.cardmarket || {}),
            currentValue,
            0, // quantity
            false, // collected
            new Date().toISOString()
        ];
        
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async searchCards(query, filters = {}) {
        const conditions = [];
        const params = [];
        
        // Text search
        if (query) {
            conditions.push(`cards_fts MATCH ?`);
            params.push(query);
        }
        
        // Set filter
        if (filters.setId) {
            conditions.push('cards.set_id = ?');
            params.push(filters.setId);
        }
        
        // Rarity filter
        if (filters.rarity) {
            conditions.push('cards.rarity = ?');
            params.push(filters.rarity);
        }
        
        // Collected filter
        if (filters.collected !== undefined) {
            conditions.push('cards.collected = ?');
            params.push(filters.collected);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        
        const sql = `
            SELECT cards.*, sets.name as set_name
            FROM cards
            JOIN sets ON cards.set_id = sets.id
            ${whereClause}
            ORDER BY cards.name
            LIMIT 50
        `;
        
        return await this.runQueryWithResult(sql, params);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async close() {
        if (this.db) {
            this.db.close();
        }
    }

    async run() {
        try {
            await this.init();
            await this.syncSets();
            await this.syncCards();
            
            console.log('\n🎉 Sync Complete!');
            console.log(`📦 Sets: ${this.syncedSets}`);
            console.log(`🃏 Cards: ${this.syncedCards}`);
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
        } finally {
            await this.close();
        }
    }
}

// Run sync if called directly
if (require.main === module) {
    const sync = new PokemonTCGSync();
    sync.run();
}

module.exports = PokemonTCGSync;


