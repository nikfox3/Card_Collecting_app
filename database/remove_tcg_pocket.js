const sqlite3 = require('sqlite3').verbose();

// Remove TCG Pocket digital-only cards from database
const removeTCGPocket = () => {
  const db = new sqlite3.Database('./cards.db');
  
  console.log('🗑️  Removing TCG Pocket digital-only cards...\n');
  
  // First, show what will be removed
  db.all(`
    SELECT s.name, COUNT(*) as card_count
    FROM cards c
    JOIN sets s ON c.set_id = s.id
    WHERE c.is_digital_only = 1
    GROUP BY c.set_id
    ORDER BY card_count DESC
  `, (err, sets) => {
    if (err) {
      console.error('❌ Error querying sets:', err);
      return;
    }
    
    console.log('📋 Sets to be removed:');
    sets.forEach(set => {
      console.log(`   - ${set.name}: ${set.card_count} cards`);
    });
    
    const totalCards = sets.reduce((sum, set) => sum + set.card_count, 0);
    console.log(`\n   Total: ${totalCards} cards will be removed\n`);
    
    // Delete the cards
    db.run(`DELETE FROM cards WHERE is_digital_only = 1`, function(err) {
      if (err) {
        console.error('❌ Error deleting cards:', err);
      } else {
        console.log(`✅ Removed ${this.changes} digital-only cards`);
        
        // Remove empty sets
        db.run(`
          DELETE FROM sets 
          WHERE id NOT IN (SELECT DISTINCT set_id FROM cards)
        `, function(err) {
          if (err) {
            console.error('❌ Error removing empty sets:', err);
          } else {
            console.log(`✅ Removed ${this.changes} empty sets`);
            
            // Show new statistics
            db.get('SELECT COUNT(*) as total FROM cards', (err, row) => {
              if (!err) {
                console.log(`\n📊 Remaining cards: ${row.total.toLocaleString()}`);
              }
              
              db.get('SELECT COUNT(*) as total FROM sets', (err, row) => {
                if (!err) {
                  console.log(`📚 Remaining sets: ${row.total.toLocaleString()}`);
                }
                
                console.log('\n✨ Database cleaned! TCG Pocket cards removed.');
                db.close();
              });
            });
          }
        });
      }
    });
  });
};

// Run the removal
removeTCGPocket();




