const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

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

// Load CSV data
const csvPath = path.join(__dirname, '../public/Pokemon database files/pokemon_tcgdex_complete_20250930_105109.csv');
const pokemonData = [];

fs.createReadStream(csvPath)
  .pipe(csv())
  .on('data', (row) => {
    pokemonData.push(row);
  })
  .on('end', () => {
    console.log(`Loaded ${pokemonData.length} cards from CSV file`);
    processCards();
  });

// Focus on recent sets
const recentSets = [
  'Scarlet & Violet',
  'Paldea Evolved', 
  'Crown Zenith',
  'Brilliant Stars',
  'Astral Radiance',
  'Lost Origin',
  'Fusion Strike',
  'Evolving Skies',
  'Chilling Reign',
  'Battle Styles',
  'Vivid Voltage',
  'Darkness Ablaze',
  'Rebel Clash',
  'Sword & Shield',
  'Hidden Fates',
  'Detective Pikachu'
];


// Function to insert or update a card
function insertOrUpdateCard(card) {
  return new Promise((resolve, reject) => {
    // Validate required fields
    if (!card.name || !card.set_name || !card.set_id) {
      reject(new Error(`Missing required fields for card: ${card.name}`));
      return;
    }

    const cardData = {
      id: card.id || `${card.name}-${card.set_name}-${card.number || 'unknown'}`,
      name: card.name,
      supertype: card.supertype,
      subtypes: JSON.stringify(card.subtypes || []),
      level: card.level,
      hp: card.hp,
      types: JSON.stringify(card.types || []),
      evolves_from: card.evolves_from,
      attacks: JSON.stringify(card.attacks || []),
      weaknesses: JSON.stringify(card.weaknesses || []),
      resistances: JSON.stringify(card.resistances || []),
      retreat_cost: JSON.stringify(card.retreat_cost || []),
      converted_retreat_cost: card.converted_retreat_cost,
      set_id: card.set_id,
      number: card.number,
      artist: card.artist,
      rarity: card.rarity,
      national_pokedex_numbers: JSON.stringify(card.national_pokedex_numbers || []),
      legalities: JSON.stringify(card.legalities || {}),
      images: JSON.stringify(card.images || {}),
      tcgplayer: JSON.stringify(card.tcgplayer || {}),
      cardmarket: JSON.stringify(card.cardmarket || {}),
      current_value: card.tcgplayer?.prices?.holofoil?.market || card.tcgplayer?.prices?.normal?.market || 0,
      quantity: 0,
      collected: false,
      language: 'en',
      variant: 'Normal',
      variants: JSON.stringify(['Normal']),
      regulation: 'A',
      format: 'Standard'
    };

    // Check if card already exists
    db.get('SELECT id FROM cards WHERE id = ?', [cardData.id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        // Update existing card
        const updateSql = `
          UPDATE cards SET 
            name = ?, supertype = ?, subtypes = ?, level = ?, hp = ?, types = ?,
            evolves_from = ?, attacks = ?, weaknesses = ?, resistances = ?, retreat_cost = ?,
            converted_retreat_cost = ?, set_id = ?, number = ?, artist = ?, rarity = ?,
            national_pokedex_numbers = ?, legalities = ?, images = ?, tcgplayer = ?,
            cardmarket = ?, current_value = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `;
        
        db.run(updateSql, [
          cardData.name, cardData.supertype, cardData.subtypes, cardData.level, cardData.hp, cardData.types,
          cardData.evolves_from, cardData.attacks, cardData.weaknesses, cardData.resistances, cardData.retreat_cost,
          cardData.converted_retreat_cost, cardData.set_id, cardData.number, cardData.artist, cardData.rarity,
          cardData.national_pokedex_numbers, cardData.legalities, cardData.images, cardData.tcgplayer,
          cardData.cardmarket, cardData.current_value, cardData.id
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve('updated');
          }
        });
      } else {
        // Insert new card
        const insertSql = `
          INSERT INTO cards (
            id, name, supertype, subtypes, level, hp, types, evolves_from, attacks,
            weaknesses, resistances, retreat_cost, converted_retreat_cost, set_id, number,
            artist, rarity, national_pokedex_numbers, legalities, images, tcgplayer,
            cardmarket, current_value, quantity, collected, language, variant, variants,
            regulation, format, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        db.run(insertSql, [
          cardData.id, cardData.name, cardData.supertype, cardData.subtypes, cardData.level, cardData.hp, cardData.types,
          cardData.evolves_from, cardData.attacks, cardData.weaknesses, cardData.resistances, cardData.retreat_cost,
          cardData.converted_retreat_cost, cardData.set_id, cardData.number, cardData.artist, cardData.rarity,
          cardData.national_pokedex_numbers, cardData.legalities, cardData.images, cardData.tcgplayer,
          cardData.cardmarket, cardData.current_value, cardData.quantity, cardData.collected, cardData.language,
          cardData.variant, cardData.variants, cardData.regulation, cardData.format
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve('inserted');
          }
        });
      }
    });
  });
}

// Function to ensure set exists
function ensureSetExists(card) {
  return new Promise((resolve, reject) => {
    const setData = {
      id: card.set_id,
      name: card.set_name,
      series: card.series,
      printed_total: card.printed_total || card.total_in_set || card.official_card_count,
      total: card.total_in_set || card.official_card_count,
      legalities: JSON.stringify(card.legalities || {}),
      ptcgo_code: card.ptcgo_code,
      release_date: card.release_date,
      images: JSON.stringify(card.set_logo_url ? { logo: card.set_logo_url } : {})
    };

    db.get('SELECT id FROM sets WHERE id = ?', [setData.id], (err, row) => {
      if (err) {
        reject(err);
        return;
      }

      if (row) {
        resolve('exists');
      } else {
        const insertSql = `
          INSERT INTO sets (id, name, series, printed_total, total, legalities, ptcgo_code, release_date, images, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `;
        
        db.run(insertSql, [
          setData.id, setData.name, setData.series, setData.printed_total, setData.total,
          setData.legalities, setData.ptcgo_code, setData.release_date, setData.images
        ], (err) => {
          if (err) {
            reject(err);
          } else {
            resolve('inserted');
          }
        });
      }
    });
  });
}

// Process cards
async function processCards() {
  // Import ALL cards from the database, not just recent sets
  const allCards = pokemonData.filter(card => {
    const setName = card.set_name || '';
    if (!setName) return false; // Skip cards without set information
    return true; // Import all cards with set information
  });

  console.log(`Found ${allCards.length} cards to import from database`);

  let processed = 0;
  let inserted = 0;
  let updated = 0;
  let errors = 0;

  console.log('Starting card import process...');

  for (const card of allCards) {
    try {
      // Ensure set exists
      await ensureSetExists(card);

      // Insert or update card
      const result = await insertOrUpdateCard(card);
      if (result === 'inserted') {
        inserted++;
      } else if (result === 'updated') {
        updated++;
      }

      processed++;
      
      if (processed % 1000 === 0) {
        console.log(`Processed ${processed}/${allCards.length} cards...`);
      }
    } catch (error) {
      console.error(`Error processing card ${card.name}:`, error.message);
      errors++;
    }
  }

  console.log(`\nImport completed!`);
  console.log(`Total processed: ${processed}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated: ${updated}`);
  console.log(`Errors: ${errors}`);

  // Close database connection
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed');
    }
  });
}
