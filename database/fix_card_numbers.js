#!/usr/bin/env node

/**
 * Fix Card Numbers Script
 * Updates missing card numbers in the database
 */

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'cards.db');

class CardNumberFixer {
    constructor() {
        this.db = null;
    }

    async init() {
        console.log('🗄️  Connecting to database...');
        this.db = new sqlite3.Database(DB_PATH);
        console.log('✅ Database connected');
    }

    async runQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    async updateQuery(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) reject(err);
                else resolve({ changes: this.changes, lastID: this.lastID });
            });
        });
    }

    async checkMissingNumbers() {
        console.log('🔍 Checking for missing card numbers...');
        
        const sql = `
            SELECT id, name, number, set_id, 
                   (SELECT name FROM sets WHERE id = cards.set_id) as set_name
            FROM cards 
            WHERE number IS NULL OR number = '' OR number = '?'
            ORDER BY set_id, name
        `;
        
        const missingNumbers = await this.runQuery(sql);
        
        console.log(`📊 Found ${missingNumbers.length} cards with missing numbers`);
        
        if (missingNumbers.length > 0) {
            console.log('\n📋 Cards with missing numbers:');
            missingNumbers.forEach((card, index) => {
                console.log(`${index + 1}. ${card.name} (${card.set_name}) - ID: ${card.id}`);
            });
        }
        
        return missingNumbers;
    }

    async fixCardNumbers() {
        console.log('🔧 Attempting to fix card numbers...');
        
        // Get all cards with missing numbers
        const missingNumbers = await this.checkMissingNumbers();
        
        if (missingNumbers.length === 0) {
            console.log('✅ All cards have numbers!');
            return;
        }

        // Group by set to see patterns
        const bySet = {};
        missingNumbers.forEach(card => {
            if (!bySet[card.set_id]) {
                bySet[card.set_id] = [];
            }
            bySet[card.set_id].push(card);
        });

        console.log('\n📦 Cards grouped by set:');
        Object.keys(bySet).forEach(setId => {
            const setCards = bySet[setId];
            console.log(`\n${setCards[0].set_name} (${setId}): ${setCards.length} cards`);
            
            // Try to generate numbers based on position in set
            setCards.forEach((card, index) => {
                const suggestedNumber = String(index + 1).padStart(3, '0');
                console.log(`  - ${card.name}: ${card.number || 'NULL'} → ${suggestedNumber}`);
            });
        });

        // Ask if user wants to auto-fix
        console.log('\n❓ Would you like to auto-assign numbers based on card order? (This will update the database)');
        console.log('   Note: This is a best-guess approach. Manual verification recommended.');
        
        // For now, let's just show what would be updated
        console.log('\n🔧 To fix manually, you can:');
        console.log('1. Check the Pokémon TCG API for accurate numbers');
        console.log('2. Update the database with correct numbers');
        console.log('3. Re-sync specific sets if needed');
    }

    async getSetStatistics() {
        console.log('\n📊 Set Statistics:');
        
        const sql = `
            SELECT 
                s.name as set_name,
                COUNT(c.id) as total_cards,
                COUNT(CASE WHEN c.number IS NOT NULL AND c.number != '' AND c.number != '?' THEN 1 END) as cards_with_numbers,
                COUNT(CASE WHEN c.number IS NULL OR c.number = '' OR c.number = '?' THEN 1 END) as cards_missing_numbers
            FROM sets s
            LEFT JOIN cards c ON s.id = c.set_id
            GROUP BY s.id, s.name
            ORDER BY cards_missing_numbers DESC, s.name
        `;
        
        const stats = await this.runQuery(sql);
        
        console.log('Set Name | Total | With Numbers | Missing Numbers');
        console.log('---------|-------|--------------|----------------');
        stats.forEach(stat => {
            console.log(`${stat.set_name} | ${stat.total_cards} | ${stat.cards_with_numbers} | ${stat.cards_missing_numbers}`);
        });
    }

    async close() {
        if (this.db) {
            this.db.close();
        }
    }

    async run() {
        try {
            await this.init();
            await this.checkMissingNumbers();
            await this.getSetStatistics();
            await this.fixCardNumbers();
        } catch (error) {
            console.error('❌ Error:', error);
        } finally {
            await this.close();
        }
    }
}

// Run if called directly
if (require.main === module) {
    const fixer = new CardNumberFixer();
    fixer.run();
}

module.exports = CardNumberFixer;
