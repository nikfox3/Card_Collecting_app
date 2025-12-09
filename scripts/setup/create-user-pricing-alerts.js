const Database = require('better-sqlite3');
const path = require('path');

// Path to the database
const dbPath = path.join(__dirname, '../../database/cards.db');
const db = new Database(dbPath);

try {
  console.log('Creating user_pricing_alerts table...');

  // Create user_pricing_alerts table
  const createTable = `
    CREATE TABLE IF NOT EXISTS user_pricing_alerts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      card_id VARCHAR(50) NOT NULL,
      card_name VARCHAR(255) NOT NULL,
      set_name VARCHAR(255) NOT NULL,
      rarity VARCHAR(100),
      card_number VARCHAR(20),
      image_url TEXT,
      alert_price DECIMAL(10,2) NOT NULL,
      alert_type VARCHAR(10) NOT NULL DEFAULT 'above', -- 'above' or 'below'
      notes TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(user_id, card_id, alert_price, alert_type)
    )
  `;

  db.exec(createTable);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_user_pricing_alerts_user_id ON user_pricing_alerts(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_pricing_alerts_card_id ON user_pricing_alerts(card_id);
    CREATE INDEX IF NOT EXISTS idx_user_pricing_alerts_active ON user_pricing_alerts(user_id, is_active);
  `);

  // Insert some sample pricing alerts for the demo user (user_id = 1)
  const demoUserId = 1;
  
  // Check if demo user exists
  const userExists = db.prepare('SELECT id FROM users WHERE id = ?').get(demoUserId);
  
  if (userExists) {
    console.log('Inserting sample pricing alerts for demo user...');
    
    const insertAlert = db.prepare(`
      INSERT OR IGNORE INTO user_pricing_alerts 
      (user_id, card_id, card_name, set_name, rarity, card_number, image_url, alert_price, alert_type, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Sample alerts for demo user
    const sampleAlerts = [
      [demoUserId, 'base1-4', 'Charizard', 'Base', 'Rare Holo', '004/102', 'https://assets.tcgdex.net/en/base/base1/4/high.webp', 400.00, 'above', 'Want to buy when price drops'],
      [demoUserId, '2014xy-5', 'Pikachu', "Macdonald's Collection 2014", 'None', '005/001', 'https://assets.tcgdex.net/en/xy/2014xy/5/high.webp', 25.00, 'above', 'Rare McDonald\'s promo'],
      [demoUserId, 'base1-2', 'Blastoise', 'Base', 'Rare Holo', '002/102', 'https://assets.tcgdex.net/en/base/base1/2/high.webp', 140.00, 'above', 'Base set holo']
    ];

    for (const alert of sampleAlerts) {
      insertAlert.run(...alert);
    }

    console.log(`✅ Inserted ${sampleAlerts.length} sample pricing alerts for demo user`);
  } else {
    console.log('⚠️  Demo user not found, skipping sample data insertion');
  }

  console.log('✅ user_pricing_alerts table created successfully');

} catch (error) {
  console.error('❌ Error creating user_pricing_alerts table:', error);
} finally {
  db.close();
}








