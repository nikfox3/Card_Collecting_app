import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { query, run } from './server/utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TCGCSV_DATA_DIR = path.join(__dirname, 'pokemon_data');
const FULL_JSON_FILE = path.join(TCGCSV_DATA_DIR, 'pokemon_prices_full.json');
const GROUPS_CSV_FILE = path.join(TCGCSV_DATA_DIR, 'groups.csv');

async function createTcgcsvSchema() {
    console.log('🏗️  Creating new TCGCSV database schema...');
    
    // Drop existing tables if they exist
    await run('DROP TABLE IF EXISTS price_history');
    await run('DROP TABLE IF EXISTS products');
    await run('DROP TABLE IF EXISTS groups');
    await run('DROP TABLE IF EXISTS categories');
    
    // Create categories table
    await run(`
        CREATE TABLE categories (
            category_id INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    // Create groups table (replaces 'sets' table)
    await run(`
        CREATE TABLE groups (
            group_id INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            abbreviation VARCHAR(10),
            is_supplemental BOOLEAN DEFAULT 0,
            published_on TIMESTAMP,
            modified_on TIMESTAMP,
            category_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(category_id) ON DELETE CASCADE
        )
    `);
    
    // Create products table (replaces 'cards' table)
    await run(`
        CREATE TABLE products (
            product_id INTEGER PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            clean_name VARCHAR(255),
            image_url TEXT,
            category_id INTEGER NOT NULL,
            group_id INTEGER NOT NULL,
            url TEXT,
            modified_on TIMESTAMP,
            image_count INTEGER DEFAULT 1,
            
            -- Extended data fields
            ext_number VARCHAR(20),
            ext_rarity VARCHAR(50),
            ext_card_type VARCHAR(50),
            ext_hp INTEGER,
            ext_stage VARCHAR(50),
            ext_card_text TEXT,
            ext_attack1 TEXT,
            ext_attack2 TEXT,
            ext_weakness VARCHAR(50),
            ext_resistance VARCHAR(50),
            ext_retreat_cost INTEGER,
            
            -- Pricing data
            low_price DECIMAL(10,2),
            mid_price DECIMAL(10,2),
            high_price DECIMAL(10,2),
            market_price DECIMAL(10,2),
            direct_low_price DECIMAL(10,2),
            sub_type_name VARCHAR(50),
            
            -- Metadata
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            
            FOREIGN KEY (group_id) REFERENCES groups(group_id) ON DELETE CASCADE
        )
    `);
    
    // Create price_history table
    await run(`
        CREATE TABLE price_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER NOT NULL,
            date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            low_price DECIMAL(10,2),
            mid_price DECIMAL(10,2),
            high_price DECIMAL(10,2),
            market_price DECIMAL(10,2),
            direct_low_price DECIMAL(10,2),
            sub_type_name VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
        )
    `);
    
    // Create indexes
    await run('CREATE INDEX idx_groups_category_id ON groups(category_id)');
    await run('CREATE INDEX idx_groups_name ON groups(name)');
    await run('CREATE INDEX idx_products_group_id ON products(group_id)');
    await run('CREATE INDEX idx_products_category_id ON products(category_id)');
    await run('CREATE INDEX idx_products_name ON products(name)');
    await run('CREATE INDEX idx_products_market_price ON products(market_price)');
    await run('CREATE INDEX idx_price_history_product_id ON price_history(product_id)');
    await run('CREATE INDEX idx_price_history_date ON price_history(date)');
    
    console.log('✅ TCGCSV database schema created.');
}

async function importCategoriesAndGroups() {
    console.log('📥 Importing categories and groups...');
    
    try {
        // Insert Pokemon category
        await run('INSERT INTO categories (category_id, name) VALUES (?, ?)', [3, 'Pokémon']);
        
        // Read groups from CSV
        const groupsCsvContent = await fs.readFile(GROUPS_CSV_FILE, 'utf-8');
        const lines = groupsCsvContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        
        let importedGroups = 0;
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= headers.length) {
                const groupData = {};
                headers.forEach((header, index) => {
                    groupData[header.trim()] = values[index]?.trim() || null;
                });
                
                if (groupData.groupId && groupData.name) {
                    await run(
                        `INSERT INTO groups (group_id, name, abbreviation, is_supplemental, published_on, modified_on, category_id)
                         VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            parseInt(groupData.groupId),
                            groupData.name,
                            groupData.abbreviation || null,
                            groupData.isSupplemental === 'true' ? 1 : 0,
                            groupData.publishedOn || null,
                            groupData.modifiedOn || null,
                            3 // Pokemon category
                        ]
                    );
                    importedGroups++;
                }
            }
        }
        
        console.log(`✅ Imported ${importedGroups} groups.`);
    } catch (error) {
        console.error('❌ Error importing categories and groups:', error);
        throw error;
    }
}

async function importProductsAndPrices() {
    console.log('📥 Importing products and prices...');
    
    try {
        const jsonData = JSON.parse(await fs.readFile(FULL_JSON_FILE, 'utf-8'));
        let productCount = 0;
        let priceHistoryCount = 0;
        
        for (const setName in jsonData) {
            console.log(`Processing set: ${setName}`);
            const products = jsonData[setName];
            
            for (const product of products) {
                try {
                    // Extract extended data
                    const extData = {};
                    if (product.extendedData && Array.isArray(product.extendedData)) {
                        product.extendedData.forEach(item => {
                            if (item.name && item.value !== undefined) {
                                extData[item.name] = item.value;
                            }
                        });
                    }
                    
                    // Insert product
                    await run(
                        `INSERT INTO products (
                            product_id, name, clean_name, image_url, category_id, group_id, url, modified_on, image_count,
                            ext_number, ext_rarity, ext_card_type, ext_hp, ext_stage, ext_card_text,
                            ext_attack1, ext_attack2, ext_weakness, ext_resistance, ext_retreat_cost,
                            low_price, mid_price, high_price, market_price, direct_low_price, sub_type_name
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                        [
                            product.productId,
                            product.name,
                            product.cleanName || null,
                            product.imageUrl || null,
                            product.categoryId || 3, // Default to Pokemon
                            product.groupId,
                            product.url || null,
                            product.modifiedOn || null,
                            product.imageCount || 1,
                            extData.Number || null,
                            extData.Rarity || null,
                            extData['Card Type'] || null,
                            extData.HP ? parseInt(extData.HP) : null,
                            extData.Stage || null,
                            extData.CardText || null,
                            extData['Attack 1'] || null,
                            extData['Attack 2'] || null,
                            extData.Weakness || null,
                            extData.Resistance || null,
                            extData['Retreat Cost'] ? parseInt(extData['Retreat Cost']) : null,
                            product.pricing?.lowPrice || null,
                            product.pricing?.midPrice || null,
                            product.pricing?.highPrice || null,
                            product.pricing?.marketPrice || null,
                            product.pricing?.directLowPrice || null,
                            product.pricing?.subTypeName || null
                        ]
                    );
                    productCount++;
                    
                    // Insert into price_history if pricing data exists
                    if (product.pricing && product.pricing.marketPrice) {
                        await run(
                            `INSERT INTO price_history (product_id, date, low_price, mid_price, high_price, market_price, direct_low_price, sub_type_name)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                            [
                                product.productId,
                                product.collected_at || new Date().toISOString(),
                                product.pricing.lowPrice || null,
                                product.pricing.midPrice || null,
                                product.pricing.highPrice || null,
                                product.pricing.marketPrice || null,
                                product.pricing.directLowPrice || null,
                                product.pricing.subTypeName || null
                            ]
                        );
                        priceHistoryCount++;
                    }
                } catch (productError) {
                    console.error(`Error importing product ${product.productId}:`, productError.message);
                }
            }
        }
        
        console.log(`✅ Imported ${productCount} products and ${priceHistoryCount} price history entries.`);
    } catch (error) {
        console.error('❌ Error importing products and prices:', error);
        throw error;
    }
}

async function runTcgcsvImporter() {
    console.log('🚀 Starting TCGCSV Database Import...');
    
    try {
        await createTcgcsvSchema();
        await importCategoriesAndGroups();
        await importProductsAndPrices();
        
        console.log('✅ TCGCSV Database Import Complete!');
        
        // Show summary
        const categoryCount = await query('SELECT COUNT(*) as count FROM categories');
        const groupCount = await query('SELECT COUNT(*) as count FROM groups');
        const productCount = await query('SELECT COUNT(*) as count FROM products');
        const priceCount = await query('SELECT COUNT(*) as count FROM price_history');
        
        console.log('\n📊 Import Summary:');
        console.log(`  Categories: ${categoryCount[0].count}`);
        console.log(`  Groups (Sets): ${groupCount[0].count}`);
        console.log(`  Products (Cards): ${productCount[0].count}`);
        console.log(`  Price History Entries: ${priceCount[0].count}`);
        
    } catch (error) {
        console.error('❌ Import failed:', error);
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runTcgcsvImporter();
}







