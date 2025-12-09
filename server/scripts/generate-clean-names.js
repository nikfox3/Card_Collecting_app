import { query, run } from '../utils/database.js';

function sanitizeName(name) {
  if (!name) return name;
  let n = String(name);
  // Remove trailing patterns: " - 161/132", "(150)", or standalone trailing number
  n = n.replace(/\s*-\s*\d+\/?\d*$/,'');
  n = n.replace(/\s*\(\d+\)\s*$/,'');
  n = n.replace(/\s+\d+$/,'');
  // Collapse double spaces
  n = n.replace(/\s{2,}/g,' ').trim();
  return n;
}

async function ensureColumn() {
  const cols = await query(`PRAGMA table_info(products)`);
  const colNames = new Set(cols.map(c => c.name));
  if (!colNames.has('clean_name')) {
    await run(`ALTER TABLE products ADD COLUMN clean_name TEXT`);
  }
}

async function main() {
  await ensureColumn();
  const rows = await query(`SELECT product_id, name, clean_name FROM products`);
  let updates = 0;
  for (const row of rows) {
    const currentClean = row.clean_name;
    const desired = sanitizeName(currentClean || row.name);
    if (desired && desired !== currentClean) {
      await run(`UPDATE products SET clean_name = ? WHERE product_id = ?`, [desired, row.product_id]);
      updates++;
    }
  }
  console.log(`Updated clean_name for ${updates} products.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });




