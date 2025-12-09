// Synchronization service to keep cards and products tables in sync
import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, 'cards.db');

class CardSynchronizationService {
  constructor() {
    this.db = new sqlite3.Database(DB_PATH);
  }

  // Sync a card update from products table to cards table
  async syncProductToCard(productId, updates) {
    return new Promise((resolve, reject) => {
      // First, get the product data
      this.db.get(
        'SELECT * FROM products WHERE product_id = ?',
        [productId],
        (err, product) => {
          if (err) {
            reject(err);
            return;
          }

          if (!product) {
            reject(new Error('Product not found'));
            return;
          }

          // Find matching card by name
          this.db.get(
            'SELECT id FROM cards WHERE name = ?',
            [product.name],
            (err, card) => {
              if (err) {
                reject(err);
                return;
              }

              if (!card) {
                console.log(`⚠️ No matching card found for product: ${product.name}`);
                resolve({ synced: false, reason: 'No matching card found' });
                return;
              }

              // Map product fields to card fields
              const cardUpdates = this.mapProductFieldsToCardFields(updates);
              
              if (Object.keys(cardUpdates).length === 0) {
                resolve({ synced: false, reason: 'No mappable fields' });
                return;
              }

              // Update the card
              const updateFields = Object.keys(cardUpdates).map(key => `${key} = ?`).join(', ');
              const values = Object.values(cardUpdates);
              values.push(card.id);

              this.db.run(
                `UPDATE cards SET ${updateFields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                values,
                function(err) {
                  if (err) {
                    reject(err);
                    return;
                  }

                  console.log(`✅ Synced product ${productId} to card ${card.id}: ${this.changes} rows updated`);
                  resolve({ synced: true, cardId: card.id, changes: this.changes });
                }
              );
            }
          );
        }
      );
    });
  }

  // Map product table fields to card table fields
  mapProductFieldsToCardFields(productUpdates) {
    const fieldMapping = {
      'ext_rarity': 'rarity',
      'ext_hp': 'hp',
      'ext_card_type': 'supertype',
      'ext_number': 'number',
      'market_price': 'current_value',
      'mid_price': 'current_value',
      'low_price': 'current_value',
      'high_price': 'current_value',
      'name': 'name',
      'artist': 'artist'
    };

    const cardUpdates = {};
    
    for (const [key, value] of Object.entries(productUpdates)) {
      const cardField = fieldMapping[key];
      if (cardField && value !== undefined && value !== null) {
        cardUpdates[cardField] = value;
      }
    }

    return cardUpdates;
  }

  // Sync a card update from cards table to products table
  async syncCardToProduct(cardId, updates) {
    return new Promise((resolve, reject) => {
      // First, get the card data
      this.db.get(
        'SELECT * FROM cards WHERE id = ?',
        [cardId],
        (err, card) => {
          if (err) {
            reject(err);
            return;
          }

          if (!card) {
            reject(new Error('Card not found'));
            return;
          }

          // Find matching product by name
          this.db.get(
            'SELECT product_id FROM products WHERE name = ?',
            [card.name],
            (err, product) => {
              if (err) {
                reject(err);
                return;
              }

              if (!product) {
                console.log(`⚠️ No matching product found for card: ${card.name}`);
                resolve({ synced: false, reason: 'No matching product found' });
                return;
              }

              // Map card fields to product fields
              const productUpdates = this.mapCardFieldsToProductFields(updates);
              
              if (Object.keys(productUpdates).length === 0) {
                resolve({ synced: false, reason: 'No mappable fields' });
                return;
              }

              // Update the product
              const updateFields = Object.keys(productUpdates).map(key => `${key} = ?`).join(', ');
              const values = Object.values(productUpdates);
              values.push(product.product_id);

              this.db.run(
                `UPDATE products SET ${updateFields}, modified_on = CURRENT_TIMESTAMP WHERE product_id = ?`,
                values,
                function(err) {
                  if (err) {
                    reject(err);
                    return;
                  }

                  console.log(`✅ Synced card ${cardId} to product ${product.product_id}: ${this.changes} rows updated`);
                  resolve({ synced: true, productId: product.product_id, changes: this.changes });
                }
              );
            }
          );
        }
      );
    });
  }

  // Map card table fields to product table fields
  mapCardFieldsToProductFields(cardUpdates) {
    const fieldMapping = {
      'rarity': 'ext_rarity',
      'hp': 'ext_hp',
      'supertype': 'ext_card_type',
      'number': 'ext_number',
      'current_value': 'market_price',
      'name': 'name',
      'artist': 'artist'
    };

    const productUpdates = {};
    
    for (const [key, value] of Object.entries(cardUpdates)) {
      const productField = fieldMapping[key];
      if (productField && value !== undefined && value !== null) {
        productUpdates[productField] = value;
      }
    }

    return productUpdates;
  }

  // Close database connection
  close() {
    this.db.close();
  }
}

export default CardSynchronizationService;


