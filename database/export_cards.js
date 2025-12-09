const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

// Export script to create CSV from current database
const exportCards = () => {
  const db = new sqlite3.Database('./cards.db');
  
  console.log('🔄 Exporting cards to CSV format...');
  
  // Create the CSV header
  const csvHeader = [
    'id', 'set_id', 'set_name', 'set_series', 'set_release_date', 'set_total_cards',
    'card_number', 'card_name', 'supertype', 'subtypes', 'level', 'hp', 'types', 
    'evolves_from', 'artist', 'rarity', 'national_pokedex_numbers',
    'attacks', 'weaknesses', 'resistances', 'retreat_cost', 'converted_retreat_cost', 
    'legalities', 'regulation_mark', 'format',
    'current_value', 'price_last_updated', 'tcgplayer_id', 'tcgplayer_url',
    'tcgplayer_normal_low', 'tcgplayer_normal_mid', 'tcgplayer_normal_high', 'tcgplayer_normal_market',
    'tcgplayer_holofoil_low', 'tcgplayer_holofoil_mid', 'tcgplayer_holofoil_high', 'tcgplayer_holofoil_market',
    'tcgplayer_reverse_holofoil_low', 'tcgplayer_reverse_holofoil_mid', 'tcgplayer_reverse_holofoil_high', 'tcgplayer_reverse_holofoil_market',
    'cardmarket_id', 'cardmarket_url', 'cardmarket_average_sell_price', 'cardmarket_low_price', 'cardmarket_trend_price',
    'image_small', 'image_large', 'image_high', 'image_artwork',
    'language', 'variant', 'is_collected', 'quantity', 'condition', 'grading_service', 'grade', 'notes', 'date_added', 'last_updated',
    'variant_normal', 'variant_holo', 'variant_reverse_holo', 'variant_first_edition', 'variant_shadowless', 'variant_error',
    'search_keywords', 'popularity_score', 'trending_score'
  ].join(',');
  
  let csvContent = csvHeader + '\n';
  let processedCount = 0;
  
  // Query to join cards with sets data
  const query = `
    SELECT 
      c.id, c.set_id, s.name as set_name, s.series as set_series, s.release_date as set_release_date, s.total as set_total_cards,
      c.number as card_number, c.name as card_name, c.supertype, c.subtypes, c.level, c.hp, c.types, 
      c.evolves_from, c.artist, c.rarity, c.national_pokedex_numbers,
      c.attacks, c.weaknesses, c.resistances, c.retreat_cost, c.converted_retreat_cost, 
      c.legalities, c.regulation as regulation_mark, c.format,
      c.current_value, c.updated_at as price_last_updated, c.tcgplayer, c.cardmarket,
      c.images, c.language, c.variant, c.collected as is_collected, c.quantity, c.created_at as date_added, c.updated_at as last_updated,
      c.variant_normal, c.variant_holo, c.variant_reverse_holo, c.variant_first_edition
    FROM cards c
    LEFT JOIN sets s ON c.set_id = s.id
    ORDER BY s.release_date DESC, c.number ASC
  `;
  
  db.each(query, (err, row) => {
    if (err) {
      console.error('❌ Error querying database:', err);
      return;
    }
    
    try {
      // Parse JSON fields
      const subtypes = row.subtypes ? JSON.parse(row.subtypes) : [];
      const types = row.types ? JSON.parse(row.types) : [];
      const attacks = row.attacks ? JSON.parse(row.attacks) : [];
      const weaknesses = row.weaknesses ? JSON.parse(row.weaknesses) : [];
      const resistances = row.resistances ? JSON.parse(row.resistances) : [];
      const retreatCost = row.retreat_cost ? JSON.parse(row.retreat_cost) : [];
      const legalities = row.legalities ? JSON.parse(row.legalities) : {};
      const nationalPokedexNumbers = row.national_pokedex_numbers ? JSON.parse(row.national_pokedex_numbers) : [];
      const images = row.images ? JSON.parse(row.images) : {};
      const tcgplayer = row.tcgplayer ? JSON.parse(row.tcgplayer) : {};
      const cardmarket = row.cardmarket ? JSON.parse(row.cardmarket) : {};
      
      // Extract TCGPlayer prices
      const tcgPrices = tcgplayer.prices || {};
      const normalPrices = tcgPrices.normal || {};
      const holofoilPrices = tcgPrices.holofoil || {};
      const reverseHolofoilPrices = tcgPrices.reverseHolofoil || {};
      
      // Extract CardMarket prices
      const cardmarketPrices = cardmarket.prices || {};
      
      // Create search keywords
      const searchKeywords = [
        row.card_name,
        row.set_name,
        row.artist,
        types.join(' '),
        subtypes.join(' ')
      ].filter(Boolean).join(' ').toLowerCase();
      
      // Create CSV row
      const csvRow = [
        row.id,
        row.set_id,
        `"${row.set_name || ''}"`,
        `"${row.set_series || ''}"`,
        row.set_release_date || '',
        row.set_total_cards || '',
        row.card_number || '',
        `"${row.card_name}"`,
        row.supertype || '',
        `"${JSON.stringify(subtypes)}"`,
        row.level || '',
        row.hp || '',
        `"${JSON.stringify(types)}"`,
        `"${row.evolves_from || ''}"`,
        `"${row.artist || ''}"`,
        row.rarity || '',
        `"${JSON.stringify(nationalPokedexNumbers)}"`,
        `"${JSON.stringify(attacks)}"`,
        `"${JSON.stringify(weaknesses)}"`,
        `"${JSON.stringify(resistances)}"`,
        `"${JSON.stringify(retreatCost)}"`,
        row.converted_retreat_cost || '',
        `"${JSON.stringify(legalities)}"`,
        row.regulation_mark || 'A',
        row.format || 'Unlimited',
        row.current_value || '',
        row.price_last_updated || '',
        tcgplayer.url ? tcgplayer.url.split('/').pop() : '',
        tcgplayer.url || '',
        normalPrices.low || '',
        normalPrices.mid || '',
        normalPrices.high || '',
        normalPrices.market || '',
        holofoilPrices.low || '',
        holofoilPrices.mid || '',
        holofoilPrices.high || '',
        holofoilPrices.market || '',
        reverseHolofoilPrices.low || '',
        reverseHolofoilPrices.mid || '',
        reverseHolofoilPrices.high || '',
        reverseHolofoilPrices.market || '',
        cardmarket.url ? cardmarket.url.split('/').pop() : '',
        cardmarket.url || '',
        cardmarketPrices.averageSellPrice || '',
        cardmarketPrices.lowPrice || '',
        cardmarketPrices.trendPrice || '',
        images.small || '',
        images.large || '',
        images.high || '',
        images.artwork || '',
        row.language || 'en',
        row.variant || 'Normal',
        row.is_collected ? 'true' : 'false',
        row.quantity || 0,
        '', // condition
        '', // grading_service
        '', // grade
        '', // notes
        row.date_added || '',
        row.last_updated || '',
        row.variant_normal ? 'true' : 'false',
        row.variant_holo ? 'true' : 'false',
        row.variant_reverse_holo ? 'true' : 'false',
        row.variant_first_edition ? 'true' : 'false',
        'false', // variant_shadowless
        'false', // variant_error
        `"${searchKeywords}"`,
        '', // popularity_score
        ''  // trending_score
      ].join(',');
      
      csvContent += csvRow + '\n';
      processedCount++;
      
      if (processedCount % 1000 === 0) {
        console.log(`📊 Processed ${processedCount} cards...`);
      }
      
    } catch (parseError) {
      console.error(`❌ Error processing card ${row.id}:`, parseError);
    }
  }, (err) => {
    if (err) {
      console.error('❌ Error during export:', err);
    } else {
      // Write CSV file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `cards_export_${timestamp}.csv`;
      const filepath = path.join(__dirname, filename);
      
      fs.writeFileSync(filepath, csvContent);
      
      console.log(`✅ Export complete!`);
      console.log(`📁 File saved: ${filename}`);
      console.log(`📊 Total cards exported: ${processedCount}`);
      console.log(`💾 File size: ${(fs.statSync(filepath).size / 1024 / 1024).toFixed(2)} MB`);
    }
    
    db.close();
  });
};

// Run the export
exportCards();




