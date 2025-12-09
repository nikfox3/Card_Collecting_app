const sqlite3 = require('sqlite3').verbose();

console.log('🧪 Testing API Database Connection...');

// Test the same query that the API should be running
const db = new sqlite3.Database('./cards.db');

db.all('SELECT date, market_price FROM price_history WHERE product_id = 83514 ORDER BY date DESC LIMIT 30', (err, rows) => {
  if (err) {
    console.error('❌ Database error:', err);
    return;
  }
  
  console.log('✅ Database query successful');
  console.log('📊 Records found:', rows.length);
  console.log('📅 Sample dates:', rows.slice(0, 5).map(r => r.date));
  console.log('💰 Sample prices:', rows.slice(0, 5).map(r => r.market_price));
  
  // Check if we have both timestamp and date-only formats
  const timestampRecords = rows.filter(r => r.date.includes('T'));
  const dateOnlyRecords = rows.filter(r => !r.date.includes('T'));
  
  console.log('\n📈 Data format analysis:');
  console.log('  Timestamp format records:', timestampRecords.length);
  console.log('  Date-only format records:', dateOnlyRecords.length);
  
  if (timestampRecords.length > 0 && dateOnlyRecords.length > 0) {
    console.log('✅ Mixed format data detected - this is expected');
  } else if (timestampRecords.length > 0) {
    console.log('⚠️  Only timestamp format data found');
  } else if (dateOnlyRecords.length > 0) {
    console.log('⚠️  Only date-only format data found');
  }
  
  db.close();
});







