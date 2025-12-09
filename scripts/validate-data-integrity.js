#!/usr/bin/env node

/**
 * Data Validation & Integrity Checker
 * 
 * Runs comprehensive checks on the database to ensure:
 * - All required fields are present
 * - JSON fields are valid
 * - Referential integrity (foreign keys)
 * - Data format consistency
 * - Price reasonability
 * 
 * Usage: node scripts/validate-data-integrity.js
 */

import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database/cards.db');
const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

console.log('🔍 DATABASE VALIDATION & INTEGRITY CHECK\n');
console.log('='.repeat(80) + '\n');

let totalErrors = 0;
let totalWarnings = 0;

// Helper to validate JSON
function isValidJSON(str) {
  if (!str) return false;
  try {
    JSON.parse(str);
    return true;
  } catch {
    return false;
  }
}

// Helper to format error count
function formatCount(count, type = 'error') {
  if (count === 0) {
    return `✅ 0 ${type}s`;
  } else {
    return `❌ ${count} ${type}${count !== 1 ? 's' : ''}`;
  }
}

// 1. CHECK REQUIRED FIELDS
console.log('1️⃣  Checking required fields...\n');

const requiredFields = ['id', 'name', 'set_id', 'supertype', 'number', 'images'];
let missingFieldErrors = 0;

for (const field of requiredFields) {
  const result = await get(`
    SELECT COUNT(*) as count 
    FROM cards 
    WHERE ${field} IS NULL OR ${field} = ''
  `);
  
  if (result.count > 0) {
    console.log(`  ❌ ${result.count} cards missing required field: ${field}`);
    missingFieldErrors += result.count;
    totalErrors += result.count;
  } else {
    console.log(`  ✅ All cards have: ${field}`);
  }
}

console.log(`\n  ${formatCount(missingFieldErrors)}\n`);

// 2. CHECK REFERENTIAL INTEGRITY
console.log('2️⃣  Checking referential integrity...\n');

const orphanedCards = await get(`
  SELECT COUNT(*) as count 
  FROM cards c 
  LEFT JOIN sets s ON c.set_id = s.id 
  WHERE s.id IS NULL
`);

if (orphanedCards.count > 0) {
  console.log(`  ❌ ${orphanedCards.count} cards reference non-existent sets`);
  totalErrors += orphanedCards.count;
  
  // Show which set_ids are missing
  const missingSetIds = await all(`
    SELECT DISTINCT c.set_id, COUNT(*) as card_count
    FROM cards c 
    LEFT JOIN sets s ON c.set_id = s.id 
    WHERE s.id IS NULL
    GROUP BY c.set_id
  `);
  
  for (const row of missingSetIds) {
    console.log(`    - set_id '${row.set_id}': ${row.card_count} cards`);
  }
} else {
  console.log('  ✅ All cards reference valid sets');
}

console.log();

// 3. CHECK JSON FIELD VALIDITY
console.log('3️⃣  Checking JSON field validity...\n');

const jsonFields = [
  'types', 'subtypes', 'abilities', 'attacks', 
  'weaknesses', 'resistances', 'retreat_cost', 
  'images', 'national_pokedex_numbers', 'legalities', 'variants'
];

let invalidJSONErrors = 0;

for (const field of jsonFields) {
  const cardsWithField = await all(`
    SELECT id, ${field} 
    FROM cards 
    WHERE ${field} IS NOT NULL AND ${field} != ''
    LIMIT 1000
  `);
  
  let fieldErrors = 0;
  for (const card of cardsWithField) {
    if (!isValidJSON(card[field])) {
      fieldErrors++;
      if (fieldErrors <= 5) { // Show first 5 examples
        console.log(`  ❌ Invalid JSON in ${field} for card ${card.id}`);
      }
    }
  }
  
  if (fieldErrors > 0) {
    console.log(`  ❌ ${fieldErrors} cards have invalid JSON in ${field}`);
    invalidJSONErrors += fieldErrors;
    totalErrors += fieldErrors;
  } else {
    console.log(`  ✅ All ${field} fields have valid JSON`);
  }
}

console.log(`\n  ${formatCount(invalidJSONErrors)}\n`);

// 4. CHECK DATA FORMAT CONSISTENCY
console.log('4️⃣  Checking data format consistency...\n');

let formatWarnings = 0;

// Check retreat_cost format (should be arrays)
const numericRetreat = await get(`
  SELECT COUNT(*) as count 
  FROM cards 
  WHERE retreat_cost IS NOT NULL 
    AND retreat_cost != '' 
    AND retreat_cost NOT LIKE '[%'
`);

if (numericRetreat.count > 0) {
  console.log(`  ⚠️  ${numericRetreat.count} cards have numeric retreat_cost (should be JSON array)`);
  formatWarnings += numericRetreat.count;
  totalWarnings += numericRetreat.count;
} else {
  console.log('  ✅ All retreat_cost fields are JSON arrays');
}

// Check images format (should be objects)
const plainURLImages = await get(`
  SELECT COUNT(*) as count 
  FROM cards 
  WHERE images IS NOT NULL 
    AND images != ''
    AND images LIKE 'https://%' 
    AND images NOT LIKE '{%'
`);

if (plainURLImages.count > 0) {
  console.log(`  ⚠️  ${plainURLImages.count} cards have plain URL images (should be JSON object)`);
  formatWarnings += plainURLImages.count;
  totalWarnings += plainURLImages.count;
} else {
  console.log('  ✅ All images fields are JSON objects');
}

// Check supertype values
const invalidSupertypes = await all(`
  SELECT DISTINCT supertype, COUNT(*) as count
  FROM cards 
  WHERE supertype NOT IN ('Pokémon', 'Trainer', 'Energy')
  GROUP BY supertype
`);

if (invalidSupertypes.length > 0) {
  console.log(`  ⚠️  Found ${invalidSupertypes.length} invalid supertype(s):`);
  for (const row of invalidSupertypes) {
    console.log(`    - '${row.supertype}': ${row.count} cards`);
  }
  formatWarnings += invalidSupertypes.reduce((sum, row) => sum + row.count, 0);
  totalWarnings += invalidSupertypes.reduce((sum, row) => sum + row.count, 0);
} else {
  console.log('  ✅ All supertypes are valid');
}

console.log(`\n  ${formatCount(formatWarnings, 'warning')}\n`);

// 5. CHECK PRICE REASONABILITY
console.log('5️⃣  Checking price reasonability...\n');

let priceWarnings = 0;

// Check for negative prices
const negativePrices = await get(`
  SELECT COUNT(*) as count 
  FROM cards 
  WHERE current_value < 0
`);

if (negativePrices.count > 0) {
  console.log(`  ❌ ${negativePrices.count} cards have negative prices`);
  priceWarnings += negativePrices.count;
  totalErrors += negativePrices.count;
} else {
  console.log('  ✅ No negative prices found');
}

// Check for suspiciously high prices (>$10,000)
const highPrices = await all(`
  SELECT id, name, current_value 
  FROM cards 
  WHERE current_value > 10000
  ORDER BY current_value DESC
  LIMIT 5
`);

if (highPrices.length > 0) {
  console.log(`  ⚠️  ${highPrices.length} cards have prices > $10,000 (verify these):`);
  for (const card of highPrices) {
    console.log(`    - ${card.name} (${card.id}): $${card.current_value.toFixed(2)}`);
  }
  priceWarnings += highPrices.length;
  totalWarnings += highPrices.length;
} else {
  console.log('  ✅ No suspiciously high prices found');
}

// Check for cards without pricing
const noPricing = await get(`
  SELECT COUNT(*) as count 
  FROM cards 
  WHERE (current_value IS NULL OR current_value = 0)
    AND supertype = 'Pokémon'
`);

if (noPricing.count > 0) {
  console.log(`  ℹ️  ${noPricing.count} Pokémon cards have no pricing data`);
} else {
  console.log('  ✅ All Pokémon cards have pricing');
}

console.log(`\n  ${formatCount(priceWarnings, 'warning')}\n`);

// 6. CHECK CARD NUMBER FORMATTING
console.log('6️⃣  Checking card number formatting...\n');

let numberWarnings = 0;

// Check for missing printed_total
const noPrintedTotal = await get(`
  SELECT COUNT(*) as count 
  FROM cards 
  WHERE printed_total IS NULL
`);

if (noPrintedTotal.count > 0) {
  console.log(`  ⚠️  ${noPrintedTotal.count} cards missing printed_total`);
  numberWarnings += noPrintedTotal.count;
  totalWarnings += noPrintedTotal.count;
} else {
  console.log('  ✅ All cards have printed_total');
}

// Check for cards where number already contains slash
const hasSlashInNumber = await get(`
  SELECT COUNT(*) as count 
  FROM cards 
  WHERE number LIKE '%/%'
`);

console.log(`  ℹ️  ${hasSlashInNumber.count} cards have formatted numbers (XXX/YYY)`);

console.log(`\n  ${formatCount(numberWarnings, 'warning')}\n`);

// 7. CHECK SET DATA COMPLETENESS
console.log('7️⃣  Checking set data completeness...\n');

let setWarnings = 0;

// Check for sets without release dates
const setsNoDate = await all(`
  SELECT id, name 
  FROM sets 
  WHERE release_date IS NULL OR release_date = ''
  LIMIT 10
`);

if (setsNoDate.length > 0) {
  console.log(`  ⚠️  ${setsNoDate.length} sets missing release dates:`);
  for (const set of setsNoDate.slice(0, 5)) {
    console.log(`    - ${set.id}: ${set.name}`);
  }
  if (setsNoDate.length > 5) {
    console.log(`    ... and ${setsNoDate.length - 5} more`);
  }
  setWarnings += setsNoDate.length;
  totalWarnings += setsNoDate.length;
} else {
  console.log('  ✅ All sets have release dates');
}

// Check for sets without cards
const emptySets = await all(`
  SELECT s.id, s.name 
  FROM sets s 
  LEFT JOIN cards c ON s.id = c.set_id 
  GROUP BY s.id 
  HAVING COUNT(c.id) = 0
`);

if (emptySets.length > 0) {
  console.log(`  ⚠️  ${emptySets.length} sets have no cards:`);
  for (const set of emptySets.slice(0, 5)) {
    console.log(`    - ${set.id}: ${set.name}`);
  }
  if (emptySets.length > 5) {
    console.log(`    ... and ${emptySets.length - 5} more`);
  }
  setWarnings += emptySets.length;
  totalWarnings += emptySets.length;
} else {
  console.log('  ✅ All sets have cards');
}

console.log(`\n  ${formatCount(setWarnings, 'warning')}\n`);

// 8. CHECK POKÉMON-SPECIFIC FIELDS
console.log('8️⃣  Checking Pokémon-specific fields...\n');

let pokemonWarnings = 0;

// Check for Pokémon without types
const pokemonNoTypes = await get(`
  SELECT COUNT(*) as count 
  FROM cards 
  WHERE supertype = 'Pokémon' 
    AND (types IS NULL OR types = '' OR types = '[]')
`);

if (pokemonNoTypes.count > 0) {
  console.log(`  ⚠️  ${pokemonNoTypes.count} Pokémon cards have no types`);
  pokemonWarnings += pokemonNoTypes.count;
  totalWarnings += pokemonNoTypes.count;
} else {
  console.log('  ✅ All Pokémon cards have types');
}

// Check for Pokémon without HP (excluding certain subtypes)
const pokemonNoHP = await get(`
  SELECT COUNT(*) as count 
  FROM cards 
  WHERE supertype = 'Pokémon' 
    AND (hp IS NULL OR hp = '')
    AND subtypes NOT LIKE '%BREAK%'
    AND subtypes NOT LIKE '%Level-Up%'
`);

if (pokemonNoHP.count > 0) {
  console.log(`  ℹ️  ${pokemonNoHP.count} Pokémon cards have no HP (some may be valid)`);
} else {
  console.log('  ✅ All standard Pokémon cards have HP');
}

console.log(`\n  ${formatCount(pokemonWarnings, 'warning')}\n`);

// FINAL SUMMARY
console.log('='.repeat(80));
console.log('📊 VALIDATION SUMMARY\n');

const totalCards = await get('SELECT COUNT(*) as count FROM cards');
const totalSets = await get('SELECT COUNT(*) as count FROM sets');

console.log(`Total Cards: ${totalCards.count}`);
console.log(`Total Sets: ${totalSets.count}`);
console.log();

if (totalErrors === 0 && totalWarnings === 0) {
  console.log('🎉 PERFECT! No errors or warnings found!\n');
  console.log('✅ Database integrity: 100%');
  console.log('✅ Data quality: Excellent');
  console.log('✅ Format consistency: Perfect');
} else {
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Total Warnings: ${totalWarnings}`);
  console.log();
  
  if (totalErrors === 0) {
    console.log('✅ No critical errors found!');
  } else {
    console.log(`⚠️  ${totalErrors} critical error(s) need immediate attention`);
  }
  
  if (totalWarnings > 0) {
    console.log(`ℹ️  ${totalWarnings} warning(s) - review when possible`);
  }
}

console.log('\n' + '='.repeat(80));

db.close();

process.exit(totalErrors > 0 ? 1 : 0);








