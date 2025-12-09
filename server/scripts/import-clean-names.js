import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { query, run } from '../utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function ensureColumns() {
  const cols = await query(`PRAGMA table_info(products)`);
  const colNames = new Set(cols.map(c => c.name));
  if (!colNames.has('clean_name')) {
    await run(`ALTER TABLE products ADD COLUMN clean_name TEXT`);
  }
}

function parseCsv(content) {
  const lines = content.split(/\r?\n/).filter(Boolean);
  // Expect header: Group ID,Group Name,Products,Prices
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = [];
    let cur = '';
    let inQuotes = false;
    for (let c of line) {
      if (c === '"') { inQuotes = !inQuotes; continue; }
      if (c === ',' && !inQuotes) { parts.push(cur); cur = ''; continue; }
      cur += c;
    }
    parts.push(cur);
    // columns: 0:id,1:name,2:productsUrl,3:pricesUrl
    if (parts.length >= 3) {
      rows.push({
        groupId: parts[0],
        groupName: parts[1],
        productsUrl: parts[2]
      });
    }
  }
  return rows;
}

async function processProductsUrl(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const data = await res.json();
  // TCGCSV returns { totalItems, success, results: [ ... ] }
  const items = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  let updated = 0;
  for (const p of items) {
    const productId = p.productId || p.id || p.product_id;
    if (!productId) continue;
    const name = p.name || null;
    const cleanName = p.cleanName || p.clean_name || null;
    if (cleanName || name) {
      const fields = [];
      const values = [];
      if (cleanName) { fields.push('clean_name = ?'); values.push(cleanName); }
      // Only set name if not present in DB
      if (name) { fields.push('name = COALESCE(name, ?)'); values.push(name); }
      values.push(productId);
      await run(`UPDATE products SET ${fields.join(', ')} WHERE product_id = ?`, values);
      updated++;
    }
  }
  return updated;
}

async function main() {
  try {
    await ensureColumns();
    const csvPath = path.resolve(__dirname, '../../tcgcsv-set-products-prices.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('CSV file not found at', csvPath);
      process.exit(1);
    }
    const content = fs.readFileSync(csvPath, 'utf8');
    const rows = parseCsv(content);
    let totalUpdated = 0;
    for (const row of rows) {
      if (!row.productsUrl) continue;
      try {
        const updated = await processProductsUrl(row.productsUrl);
        totalUpdated += updated;
        console.log(`Updated ${updated} products from ${row.groupName}`);
      } catch (e) {
        console.warn('Failed processing', row.groupName, row.productsUrl, e.message);
      }
    }
    console.log('Done. Total products updated:', totalUpdated);
    process.exit(0);
  } catch (e) {
    console.error('Import failed:', e);
    process.exit(1);
  }
}

main();


