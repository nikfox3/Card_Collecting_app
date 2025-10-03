const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Database path
const DB_PATH = path.join(__dirname, '../database/cards.db');

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Function to construct TCGdx image URL
function constructTCGdxImageUrl(card, quality = 'high', extension = 'webp') {
  // Map set names to TCGdx set codes
  const setCodeMap = {
    '151': 'sv12',
    'Black Bolt': 'sv13', 
    'Destined Rivals': 'sv14',
    'Journey Together': 'sv15',
    'White Flare': 'sv16',
    'Mega Evolution': 'sv17',
    'Obsidian Flames': 'sv11',
    'Silver Tempest': 'swsh12',
    'Crown Zenith': 'swsh12pt5',
    'Paldea Evolved': 'sv2',
    'Scarlet & Violet': 'sv1',
    'Brilliant Stars': 'swsh9',
    'Astral Radiance': 'swsh10',
    'Lost Origin': 'swsh11',
    'Fusion Strike': 'swsh8',
    'Evolving Skies': 'swsh7',
    'Chilling Reign': 'swsh6',
    'Battle Styles': 'swsh5',
    'Vivid Voltage': 'swsh4',
    'Darkness Ablaze': 'swsh3',
    'Rebel Clash': 'swsh2',
    'Sword & Shield': 'swsh1',
    'Cosmic Eclipse': 'sm12',
    'Hidden Fates': 'sm11',
    'Unified Minds': 'sm10',
    'Detective Pikachu': 'det1',
    'Sun & Moon': 'sm1',
    'XY': 'xy1',
    'Black & White': 'bw1',
    'HeartGold & SoulSilver': 'hgss1',
    'Platinum': 'pl1',
    'Diamond & Pearl': 'dp1',
    'EX': 'ex1',
    'Neo': 'neo1',
    'Gym': 'gym1',
    'Team Rocket': 'tr1',
    'Fossil': 'fossil1',
    'Jungle': 'jungle1',
    'Base Set': 'base1'
  };
  
  // Try to find set code from set name
  let setCode = setCodeMap[card.set_name] || card.set_id || 'base1';
  
  // Construct the TCGdx URL
  const baseUrl = 'https://assets.tcgdx.net/en';
  const cardNumber = card.number || '1';
  
  return `${baseUrl}/${setCode}/${cardNumber}/${quality}.${extension}`;
}

// Function to update image URLs for recent sets only
function updateRecentImageUrls() {
  console.log('Starting image URL update for recent sets...');
  
  // Focus on the most recent sets first
  const recentSets = [
    'Mega Evolution', '151', 'Black Bolt', 'Destined Rivals', 
    'Journey Together', 'White Flare', 'Obsidian Flames', 
    'Silver Tempest', 'Crown Zenith', 'Paldea Evolved', 
    'Scarlet & Violet', 'Brilliant Stars', 'Astral Radiance', 
    'Lost Origin', 'Fusion Strike', 'Evolving Skies', 'Chilling Reign'
  ];
  
  const setPlaceholders = recentSets.map(() => '?').join(',');
  
  const sql = `
    SELECT c.id, c.name, s.name as set_name, c.set_id, c.number, c.images 
    FROM cards c 
    JOIN sets s ON c.set_id = s.id 
    WHERE s.name IN (${setPlaceholders})
    AND c.images IS NOT NULL
    LIMIT 1000
  `;
  
  db.all(sql, recentSets, (err, cards) => {
    if (err) {
      console.error('Error fetching cards:', err.message);
      return;
    }
    
    console.log(`Found ${cards.length} cards to update from recent sets`);
    
    let updated = 0;
    let errors = 0;
    
    cards.forEach((card, index) => {
      try {
        // Parse existing images
        const existingImages = JSON.parse(card.images || '{}');
        
        // Construct new TCGdx URLs
        const newImages = {
          small: constructTCGdxImageUrl(card, 'low', 'webp'),
          large: constructTCGdxImageUrl(card, 'high', 'webp'),
          // Keep original as fallback
          original: existingImages.small || existingImages.large || ''
        };
        
        // Update the card
        const updateSql = 'UPDATE cards SET images = ? WHERE id = ?';
        db.run(updateSql, [JSON.stringify(newImages), card.id], (err) => {
          if (err) {
            console.error(`Error updating card ${card.id}:`, err.message);
            errors++;
          } else {
            updated++;
            if (updated % 100 === 0) {
              console.log(`Updated ${updated}/${cards.length} cards...`);
            }
          }
          
          // Check if we're done
          if (updated + errors >= cards.length) {
            console.log(`\nImage URL update complete!`);
            console.log(`Updated: ${updated} cards`);
            console.log(`Errors: ${errors} cards`);
            db.close();
          }
        });
        
      } catch (error) {
        console.error(`Error processing card ${card.id}:`, error.message);
        errors++;
        
        if (updated + errors >= cards.length) {
          console.log(`\nImage URL update complete!`);
          console.log(`Updated: ${updated} cards`);
          console.log(`Errors: ${errors} cards`);
          db.close();
        }
      }
    });
  });
}

// Start the update process
updateRecentImageUrls();
