#!/usr/bin/env node

/**
 * Pokémon Card Database Search Utility
 * Provides search functionality for the local database
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class PokemonCardSearch {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, 'cards.db');
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

    async searchCards(query, options = {}) {
        const {
            limit = 50,
            offset = 0,
            setFilter = null,
            rarityFilter = null,
            typeFilter = null,
            collectedFilter = null,
            languageFilter = null,
            energyTypes = null,
            types = null,
            rarities = null,
            rarityType = 'international',
            variants = null,
            regulations = null,
            formats = null,
            sortBy = 'current_value',
            sortOrder = 'DESC',
            fuzzySearch = true,
            searchAllFields = true
        } = options;

        let sql = `
            SELECT 
                cards.*,
                sets.name as set_name,
                sets.series,
                sets.printed_total,
                sets.release_date
            FROM cards
            JOIN sets ON cards.set_id = sets.id
        `;
        
        const conditions = [];
        const params = [];

        // Enhanced text search with fuzzy matching and comprehensive field search
        if (query && query.trim()) {
            const searchTerm = query.trim();
            
            if (searchAllFields) {
                // Comprehensive search across all card fields
                const searchConditions = [];
                const searchParams = [];
                
                // Exact matches (highest priority)
                searchConditions.push(`(
                    cards.name LIKE ? OR 
                    cards.artist LIKE ? OR 
                    sets.name LIKE ? OR
                    cards.rarity LIKE ?
                )`);
                searchParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
                
                // Partial matches in attacks, abilities, and other text fields
                searchConditions.push(`(
                    cards.attacks LIKE ? OR 
                    cards.weaknesses LIKE ? OR 
                    cards.resistances LIKE ? OR
                    cards.retreat_cost LIKE ? OR
                    cards.evolves_from LIKE ? OR
                    cards.subtypes LIKE ?
                )`);
                searchParams.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
                
                // Type and Pokemon number searches
                if (searchTerm.match(/^\d+$/)) {
                    // Numeric search - could be card number or Pokemon number
                    searchConditions.push(`(
                        cards.number = ? OR 
                        cards.national_pokedex_numbers LIKE ?
                    )`);
                    searchParams.push(searchTerm, `%${searchTerm}%`);
                }
                
                // Fuzzy matching for misspellings (using LIKE with wildcards)
                if (fuzzySearch) {
                    const fuzzyTerms = this.generateFuzzyTerms(searchTerm);
                    fuzzyTerms.forEach(term => {
                        searchConditions.push(`(
                            cards.name LIKE ? OR 
                            sets.name LIKE ?
                        )`);
                        searchParams.push(`%${term}%`, `%${term}%`);
                    });
                }
                
                conditions.push(`(${searchConditions.join(' OR ')})`);
                params.push(...searchParams);
            } else {
                // Standard FTS search
                sql += ` JOIN cards_fts ON cards.rowid = cards_fts.rowid`;
                conditions.push('cards_fts MATCH ?');
                params.push(`"${searchTerm}"`);
            }
        }

        // Filters
        if (setFilter) {
            conditions.push('cards.set_id = ?');
            params.push(setFilter);
        }

        if (rarityFilter) {
            conditions.push('cards.rarity = ?');
            params.push(rarityFilter);
        }

        if (typeFilter) {
            conditions.push('JSON_EXTRACT(cards.types, "$") LIKE ?');
            params.push(`%"${typeFilter}"%`);
        }

        if (collectedFilter !== null) {
            conditions.push('cards.collected = ?');
            params.push(collectedFilter);
        }

        if (languageFilter && languageFilter.length > 0) {
            const languagePlaceholders = languageFilter.map(() => '?').join(',');
            conditions.push(`cards.language IN (${languagePlaceholders})`);
            params.push(...languageFilter);
        }

        if (energyTypes && energyTypes.length > 0) {
            // Filter by energy types using SQLite JSON functions
            const energyConditions = energyTypes.map(() => {
                return `cards.types LIKE ?`;
            });
            conditions.push(`(${energyConditions.join(' OR ')})`);
            // Convert energy types to JSON-like patterns for SQLite LIKE search
            params.push(...energyTypes.map(energy => `%"${energy}"%`));
        }

        if (types && types.length > 0) {
            // Filter by card types (Pokemon, Trainer, Energy)
            const typeConditions = types.map(() => {
                return `cards.supertype = ?`;
            });
            conditions.push(`(${typeConditions.join(' OR ')})`);
            // Map frontend type names to Pokemon TCG API supertype names
            const typeMap = {
                pokemon: 'Pokémon',
                trainer: 'Trainer',
                energy: 'Energy'
            };
            params.push(...types.map(type => typeMap[type] || type));
        }

        if (rarities && rarities.length > 0) {
            // Map frontend rarity names to Pokemon TCG API rarity names
            const rarityMap = {
                // International rarities
                common: 'Common',
                uncommon: 'Uncommon',
                rare: ['Rare', 'Rare Holo', 'Holo Rare'], // Combine regular and holo rares
                doubleRare: 'Double Rare',
                aceSpecRare: 'ACE',
                illustrationRare: 'Illustration Rare',
                ultraRare: 'Ultra Rare',
                specialIllustrationRare: 'Special Illustration Rare',
                hyperRare: 'Hyper Rare',
                shinyRare: 'Shiny Rare',
                shinyUltraRare: 'Shiny Ultra Rare',
                blackStarPromo: 'Promo',
                // Japanese rarities
                artRare: 'Art Rare',
                specialArtRare: 'Special Art Rare',
                superRare: 'Super Rare',
                shinySuperRare: 'Shiny Super Rare'
            };
            
            // Apply rarity type specific mapping if needed
            let mappedRarities = [];
            rarities.forEach(rarity => {
                const mapped = rarityMap[rarity] || rarity;
                // For Japanese cards, some rarities have different names
                if (rarityType === 'japanese' && rarity === 'illustrationRare') {
                    mappedRarities.push('Art Rare');
                } else if (rarityType === 'japanese' && rarity === 'specialIllustrationRare') {
                    mappedRarities.push('Special Art Rare');
                } else if (Array.isArray(mapped)) {
                    // Handle arrays of rarities (like rare + holo rare)
                    mappedRarities.push(...mapped);
                } else {
                    mappedRarities.push(mapped);
                }
            });
            
            // Filter by card rarities
            conditions.push(`cards.rarity IN (${'?,'.repeat(mappedRarities.length).slice(0, -1)})`);
            params.push(...mappedRarities);
        }

        if (variants && variants.length > 0) {
            // Filter by card variants (stored as JSON array)
            const variantConditions = variants.map(() => 'cards.variants LIKE ?');
            conditions.push(`(${variantConditions.join(' OR ')})`);
            // Add LIKE patterns for JSON array matching
            variants.forEach(variant => {
                params.push(`%"${variant}"%`);
            });
        }

        if (regulations && regulations.length > 0) {
            // Filter by card regulations
            conditions.push(`cards.regulation IN (${'?,'.repeat(regulations.length).slice(0, -1)})`);
            params.push(...regulations);
        }

        if (formats && formats.length > 0) {
            // Filter by card formats
            conditions.push(`cards.format IN (${'?,'.repeat(formats.length).slice(0, -1)})`);
            params.push(...formats);
        }

        // Add WHERE clause
        if (conditions.length > 0) {
            sql += ` WHERE ${conditions.join(' AND ')}`;
        }

        // Enhanced sorting with search relevance ranking
        if (query && query.trim()) {
            // Custom ranking for search relevance
            sql += ` ORDER BY 
                CASE 
                    WHEN LOWER(cards.name) = LOWER(?) THEN 1
                    WHEN LOWER(cards.name) LIKE LOWER(?) THEN 2
                    WHEN LOWER(sets.name) = LOWER(?) THEN 3
                    WHEN LOWER(sets.name) LIKE LOWER(?) THEN 4
                    WHEN LOWER(cards.rarity) = LOWER(?) THEN 5
                    WHEN LOWER(cards.rarity) LIKE LOWER(?) THEN 6
                    ELSE 7
                END,
                cards.name ASC`;
            
            const exactTerm = query.trim();
            const likeTerm = `%${exactTerm}%`;
            params.push(exactTerm, likeTerm, exactTerm, likeTerm, exactTerm, likeTerm);
        } else {
            // Default sorting when no search query
            const validSortFields = ['name', 'rarity', 'current_value', 'set_name', 'release_date'];
            const sortField = validSortFields.includes(sortBy) ? sortBy : 'current_value';
            const order = sortOrder.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
            sql += ` ORDER BY cards.${sortField} ${order}`;
        }
        
        // Pagination
        sql += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getCardById(id) {
        const sql = `
            SELECT 
                cards.*,
                sets.name as set_name,
                sets.series,
                sets.printed_total,
                sets.release_date
            FROM cards
            JOIN sets ON cards.set_id = sets.id
            WHERE cards.id = ?
        `;

        return new Promise((resolve, reject) => {
            this.db.get(sql, [id], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async getSets() {
        const sql = `
            SELECT 
                id,
                name,
                series,
                printed_total,
                total,
                release_date,
                images
            FROM sets
            ORDER BY release_date DESC
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getRarities() {
        const sql = `
            SELECT DISTINCT rarity
            FROM cards
            WHERE rarity IS NOT NULL
            ORDER BY rarity
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.rarity));
                }
            });
        });
    }

    async getTypes() {
        const sql = `
            SELECT DISTINCT value as type
            FROM cards,
            JSON_EACH(JSON_EXTRACT(cards.types, '$'))
            WHERE cards.types IS NOT NULL
            ORDER BY type
        `;

        return new Promise((resolve, reject) => {
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows.map(row => row.type));
                }
            });
        });
    }

    async getStats() {
        const sql = `
            SELECT 
                COUNT(*) as total_cards,
                COUNT(CASE WHEN collected = 1 THEN 1 END) as collected_cards,
                COUNT(DISTINCT set_id) as total_sets,
                AVG(current_value) as avg_value,
                MAX(current_value) as max_value,
                MIN(current_value) as min_value
            FROM cards
        `;

        return new Promise((resolve, reject) => {
            this.db.get(sql, [], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    // Generate fuzzy search terms for misspelling tolerance
    generateFuzzyTerms(term) {
        const fuzzyTerms = [];
        const originalTerm = term.toLowerCase();
        
        // Add original term
        fuzzyTerms.push(originalTerm);
        
        // Common misspellings and variations
        const commonMisspellings = {
            'charizard': ['charazard', 'charzard', 'charizard'],
            'pikachu': ['pikachu', 'pikachoo', 'pikach'],
            'blastoise': ['blastoise', 'blastios', 'blastois'],
            'venusaur': ['venusaur', 'venosaur', 'venusar'],
            'mewtwo': ['mewtwo', 'mew2', 'mew two'],
            'mew': ['mew', 'meww'],
            'lugia': ['lugia', 'lugiah'],
            'hooh': ['ho-oh', 'hooh', 'ho oh'],
            'rayquaza': ['rayquaza', 'rayquaza'],
            'garchomp': ['garchomp', 'garchom'],
            'giratina': ['giratina', 'giratina'],
            'dialga': ['dialga', 'dialga'],
            'palkia': ['palkia', 'palkia']
        };
        
        // Check for common Pokemon misspellings
        for (const [correct, variations] of Object.entries(commonMisspellings)) {
            if (variations.some(variation => originalTerm.includes(variation))) {
                variations.forEach(variation => {
                    if (!fuzzyTerms.includes(variation)) {
                        fuzzyTerms.push(variation);
                    }
                });
            }
        }
        
        // Add partial matches (remove last character)
        if (originalTerm.length > 3) {
            fuzzyTerms.push(originalTerm.slice(0, -1));
            fuzzyTerms.push(originalTerm.slice(1));
        }
        
        // Add character substitution patterns for common typos
        if (originalTerm.length > 2) {
            const substitutions = {
                'z': ['s', 'x'],
                's': ['z', 'c'],
                'c': ['k', 's'],
                'k': ['c', 'q'],
                'u': ['o', 'i'],
                'o': ['u', '0'],
                'i': ['1', 'l', 'u'],
                'l': ['1', 'i'],
                'e': ['3'],
                'a': ['@', '4'],
                't': ['7']
            };
            
            for (let i = 0; i < originalTerm.length; i++) {
                const char = originalTerm[i];
                if (substitutions[char]) {
                    substitutions[char].forEach(sub => {
                        const fuzzyTerm = originalTerm.slice(0, i) + sub + originalTerm.slice(i + 1);
                        if (!fuzzyTerms.includes(fuzzyTerm)) {
                            fuzzyTerms.push(fuzzyTerm);
                        }
                    });
                }
            }
        }
        
        return fuzzyTerms.slice(0, 10); // Limit to prevent too many queries
    }


    async close() {
        if (this.db) {
            this.db.close();
        }
    }
}

// CLI interface
if (require.main === module) {
    const args = process.argv.slice(2);
    const query = args[0] || '';
    
    const search = new PokemonCardSearch();
    
    search.init()
        .then(() => search.searchCards(query))
        .then(cards => {
            console.log(`\n🔍 Found ${cards.length} cards for "${query}"`);
            cards.forEach(card => {
                console.log(`• ${card.name} (${card.set_name}) - ${card.rarity} - $${card.current_value}`);
            });
        })
        .catch(err => {
            console.error('❌ Search failed:', err.message);
        })
        .finally(() => {
            search.close();
        });
}

module.exports = PokemonCardSearch;

