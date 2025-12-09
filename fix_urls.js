const fs = require('fs');
const content = fs.readFileSync('server/routes/pricing-monitor.js', 'utf8');
const updated = content.replace('https://api.tcgdx.net/v2/en/cards/base1-1', 'https://tcgcsv.com/api/v1/sets');
fs.writeFileSync('server/routes/pricing-monitor.js', updated);
console.log('URLs fixed!');
