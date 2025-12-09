// Analyze matching patterns to understand Hamming distances
// Shows what similarity scores look like in practice

import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import { config } from '../server/config.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = config?.databasePath || path.resolve(__dirname, '../cards.db');
const db = new sqlite3.Database(dbPath);

const get = promisify(db.get.bind(db));
const all = promisify(db.all.bind(db));

async function analyzeMatchingPatterns() {
  console.log('🔍 Analyzing Matching Patterns\n');
  
  // Get a sample of cards with hashes
  const cards = await all(`
    SELECT 
      p.product_id,
      p.name,
      p.image_url,
      p.image_hash_difference_normal as hash
    FROM products p
    WHERE p.category_id = 3
      AND p.image_hash_difference_normal IS NOT NULL
      AND p.image_hash_difference_normal != ''
      AND p.image_url IS NOT NULL
    LIMIT 20
  `);
  
  if (cards.length === 0) {
    console.log('❌ No hashed cards found');
    db.close();
    return;
  }
  
  console.log(`📊 Analyzing ${cards.length} cards\n`);
  
  // Analyze hash characteristics
  const hashLengths = cards.map(c => c.hash?.length || 0);
  const uniqueLengths = [...new Set(hashLengths)];
  
  console.log('📏 Hash Length Analysis:');
  console.log(`   Unique lengths: ${uniqueLengths.join(', ')}`);
  console.log(`   Average length: ${(hashLengths.reduce((a, b) => a + b, 0) / hashLengths.length).toFixed(0)}`);
  console.log(`   Min length: ${Math.min(...hashLengths)}`);
  console.log(`   Max length: ${Math.max(...hashLengths)}\n`);
  
  // Compare a card to itself (should be perfect match)
  const testCard = cards[0];
  console.log(`🧪 Testing self-comparison for: ${testCard.name} (ID: ${testCard.product_id})`);
  console.log(`   Hash length: ${testCard.hash.length}`);
  console.log(`   Hash preview: ${testCard.hash.substring(0, 50)}...\n`);
  
  // Compare test card to all other cards
  console.log('🔍 Comparing test card to all other cards...\n');
  
  const comparisons = [];
  
  for (const card of cards) {
    if (card.product_id === testCard.product_id) continue;
    
    // Calculate Hamming distance
    const distance = hammingDistance(testCard.hash, card.hash);
    const similarity = 1 - (distance / Math.max(testCard.hash.length, card.hash.length));
    
    comparisons.push({
      name: card.name,
      product_id: card.product_id,
      distance,
      similarity
    });
  }
  
  // Sort by similarity (highest first)
  comparisons.sort((a, b) => b.similarity - a.similarity);
  
  console.log('📊 Top 10 Most Similar Cards:');
  comparisons.slice(0, 10).forEach((comp, i) => {
    console.log(`   ${i + 1}. ${comp.name} (ID: ${comp.product_id})`);
    console.log(`      Distance: ${comp.distance}, Similarity: ${(comp.similarity * 100).toFixed(2)}%`);
  });
  
  console.log('\n📊 Bottom 10 Least Similar Cards:');
  comparisons.slice(-10).reverse().forEach((comp, i) => {
    console.log(`   ${i + 1}. ${comp.name} (ID: ${comp.product_id})`);
    console.log(`      Distance: ${comp.distance}, Similarity: ${(comp.similarity * 100).toFixed(2)}%`);
  });
  
  // Statistics
  const similarities = comparisons.map(c => c.similarity);
  const distances = comparisons.map(c => c.distance);
  
  console.log('\n📈 Similarity Statistics:');
  console.log(`   Average similarity: ${(similarities.reduce((a, b) => a + b, 0) / similarities.length * 100).toFixed(2)}%`);
  console.log(`   Min similarity: ${(Math.min(...similarities) * 100).toFixed(2)}%`);
  console.log(`   Max similarity: ${(Math.max(...similarities) * 100).toFixed(2)}%`);
  console.log(`   Median similarity: ${(median(similarities) * 100).toFixed(2)}%`);
  
  console.log('\n📈 Distance Statistics:');
  console.log(`   Average distance: ${(distances.reduce((a, b) => a + b, 0) / distances.length).toFixed(0)}`);
  console.log(`   Min distance: ${Math.min(...distances)}`);
  console.log(`   Max distance: ${Math.max(...distances)}`);
  console.log(`   Median distance: ${median(distances).toFixed(0)}`);
  
  // Distribution analysis
  console.log('\n📊 Similarity Distribution:');
  const ranges = [
    { min: 0.9, max: 1.0, label: '90-100% (Excellent)' },
    { min: 0.8, max: 0.9, label: '80-90% (Very Good)' },
    { min: 0.7, max: 0.8, label: '70-80% (Good)' },
    { min: 0.6, max: 0.7, label: '60-70% (Fair)' },
    { min: 0.5, max: 0.6, label: '50-60% (Poor)' },
    { min: 0.0, max: 0.5, label: '0-50% (Very Poor)' }
  ];
  
  ranges.forEach(range => {
    const count = similarities.filter(s => s >= range.min && s < range.max).length;
    const percentage = (count / similarities.length * 100).toFixed(1);
    console.log(`   ${range.label}: ${count} cards (${percentage}%)`);
  });
  
  // Check if similarities are clustered or spread out
  const stdDev = standardDeviation(similarities);
  console.log(`\n📊 Standard Deviation: ${(stdDev * 100).toFixed(2)}%`);
  if (stdDev < 0.1) {
    console.log('   ⚠️  Low variation - similarities are clustered (may indicate poor discrimination)');
  } else if (stdDev > 0.2) {
    console.log('   ✅ High variation - similarities are well-distributed (good discrimination)');
  } else {
    console.log('   ⚠️  Moderate variation - similarities are somewhat clustered');
  }
  
  db.close();
}

function hammingDistance(hash1, hash2) {
  if (!hash1 || !hash2) return Infinity;
  const minLength = Math.min(hash1.length, hash2.length);
  let distance = Math.abs(hash1.length - hash2.length);
  for (let i = 0; i < minLength; i++) {
    if (hash1[i] !== hash2[i]) distance++;
  }
  return distance;
}

function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function standardDeviation(arr) {
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / arr.length;
  return Math.sqrt(avgSquareDiff);
}

analyzeMatchingPatterns();

