#!/usr/bin/env node

/**
 * Get specific card data from the database
 * Usage: node get_card_data.js "Charizard" "Base Set"
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'cards.db');

class CardDataRetriever {
    constructor() {
        this.db = new sqlite3.Database(DB_PATH);
    }

    async getCardByName(cardName, setName = null) {
        return new Promise((resolve, reject) => {
            let sql = `
                SELECT c.*, s.name as set_name, s.series
                FROM cards c
                JOIN sets s ON c.set_id = s.id
                WHERE c.name LIKE ?
            `;
            let params = [`%${cardName}%`];

            if (setName) {
                sql += ` AND s.name LIKE ?`;
                params.push(`%${setName}%`);
            }

            sql += ` ORDER BY c.name LIMIT 10`;

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getCardById(cardId) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, s.name as set_name, s.series
                FROM cards c
                JOIN sets s ON c.set_id = s.id
                WHERE c.id = ?
            `;

            this.db.get(sql, [cardId], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });
    }

    async searchCards(query, limit = 50) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT c.*, s.name as set_name, s.series
                FROM cards c
                JOIN sets s ON c.set_id = s.id
                WHERE cards_fts MATCH ?
                ORDER BY c.name
                LIMIT ?
            `;

            this.db.all(sql, [query, limit], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async getSets() {
        return new Promise((resolve, reject) => {
            const sql = `SELECT * FROM sets ORDER BY name`;
            this.db.all(sql, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        this.db.close();
    }
}

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const cardName = args[0];
    const setName = args[1];

    const retriever = new CardDataRetriever();

    if (cardName) {
        retriever.getCardByName(cardName, setName)
            .then(cards => {
                console.log(`Found ${cards.length} cards matching "${cardName}"${setName ? ` in set "${setName}"` : ''}:`);
                cards.forEach(card => {
                    console.log(`- ${card.name} (${card.set_name}) - ${card.rarity} - HP: ${card.hp}`);
                    if (card.attacks) {
                        const attacks = JSON.parse(card.attacks);
                        attacks.forEach(attack => {
                            console.log(`  Attack: ${attack.name} - ${attack.damage} damage`);
                        });
                    }
                });
            })
            .catch(err => {
                console.error('Error:', err);
            })
            .finally(() => {
                retriever.close();
            });
    } else {
        console.log('Usage: node get_card_data.js "Card Name" ["Set Name"]');
        retriever.close();
    }
}

module.exports = CardDataRetriever;
