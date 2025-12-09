const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'cards.db');

console.log('🎨 Updating artist information for special pattern cards...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    return;
  }
  console.log('✅ Connected to database');
});

// Function to extract base card name from special pattern names
function extractBaseName(cardName) {
  // Remove common pattern suffixes
  const patterns = [
    ' (Master Ball Pattern)',
    ' (Poké Ball Pattern)',
    ' (Poke Ball Pattern)', 
    ' (Non-Holo)',
    ' (Holo)',
    ' (Cosmos Holo)',
    ' (Cracked Ice Holo)',
    ' (Tinsel Holo)',
    ' (Shiny Holo)',
    ' (#\\d+ Non-Holo)',
    ' (#\\d+ Holo)',
    ' - \\d+/\\d+ \\(.*Holo\\)',
    ' - \\d+/\\d+ \\(.*\\)'
  ];
  
  let baseName = cardName;
  for (const pattern of patterns) {
    const regex = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    baseName = baseName.replace(regex, '');
  }
  
  return baseName.trim();
}

// Get all special pattern cards without artists
db.all(`
  SELECT product_id, name, ext_rarity 
  FROM products 
  WHERE artist IS NULL 
  AND (
    name LIKE '%Master Ball%' OR 
    name LIKE '%Poké Ball%' OR 
    name LIKE '%Poke Ball%' OR 
    name LIKE '%Non-Holo%' OR 
    name LIKE '%Holo%' OR 
    name LIKE '%pattern%' OR
    name LIKE '%Cosmos%' OR
    name LIKE '%Cracked Ice%' OR
    name LIKE '%Tinsel%'
  )
`, [], (err, specialCards) => {
  if (err) {
    console.error('❌ Error fetching special cards:', err.message);
    return;
  }
  
  console.log(`📋 Found ${specialCards.length} special pattern cards without artists`);
  
  let updatedCount = 0;
  let processedCount = 0;
  
  // Process each special card
  specialCards.forEach((specialCard, index) => {
    const baseName = extractBaseName(specialCard.name);
    
    // Find matching normal version with artist
    db.get(`
      SELECT artist 
      FROM products 
      WHERE name = ? 
      AND artist IS NOT NULL 
      AND artist != ''
      LIMIT 1
    `, [baseName], (err, normalCard) => {
      if (err) {
        console.error(`❌ Error finding normal card for ${specialCard.name}:`, err.message);
        return;
      }
      
      processedCount++;
      
      if (normalCard && normalCard.artist) {
        // Update the special card with the artist from normal version
        db.run(`
          UPDATE products 
          SET artist = ? 
          WHERE product_id = ?
        `, [normalCard.artist, specialCard.product_id], function(err) {
          if (err) {
            console.error(`❌ Error updating ${specialCard.name}:`, err.message);
            return;
          }
          
          updatedCount++;
          console.log(`✅ Updated: ${specialCard.name} → Artist: ${normalCard.artist}`);
          
          // Check if we've processed all cards
          if (processedCount === specialCards.length) {
            console.log(`\n🎉 Update complete!`);
            console.log(`📊 Updated ${updatedCount} out of ${specialCards.length} special pattern cards`);
            
            // Copy updated database to server directory
            const fs = require('fs');
            const serverDbPath = path.join(__dirname, 'server', 'cards.db');
            
            try {
              fs.copyFileSync(dbPath, serverDbPath);
              console.log('📁 Database copied to server directory');
              console.log('🔄 Please restart the API server to apply changes');
            } catch (copyErr) {
              console.error('❌ Error copying database:', copyErr.message);
            }
            
            db.close();
          }
        });
      } else {
        console.log(`⚠️  No normal version found for: ${specialCard.name} (base: ${baseName})`);
        
        // Check if we've processed all cards
        if (processedCount === specialCards.length) {
          console.log(`\n🎉 Update complete!`);
          console.log(`📊 Updated ${updatedCount} out of ${specialCards.length} special pattern cards`);
          
          // Copy updated database to server directory
          const fs = require('fs');
          const serverDbPath = path.join(__dirname, 'server', 'cards.db');
          
          try {
            fs.copyFileSync(dbPath, serverDbPath);
            console.log('📁 Database copied to server directory');
            console.log('🔄 Please restart the API server to apply changes');
          } catch (copyErr) {
            console.error('❌ Error copying database:', copyErr.message);
          }
          
          db.close();
        }
      }
    });
  });
});
