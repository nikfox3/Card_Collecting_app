import { run } from "../utils/database.js";

async function initializeTrendingCardsTable() {
  try {
    console.log("📊 Initializing featured_trending_cards table...");

    // Create table
    await run(`
      CREATE TABLE IF NOT EXISTS featured_trending_cards (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER NOT NULL UNIQUE,
        position INTEGER NOT NULL,
        featured_until DATETIME,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create indexes
    await run(
      "CREATE INDEX IF NOT EXISTS idx_featured_trending_position ON featured_trending_cards(position)"
    );
    await run(
      "CREATE INDEX IF NOT EXISTS idx_featured_trending_product ON featured_trending_cards(product_id)"
    );
    await run(
      "CREATE INDEX IF NOT EXISTS idx_featured_trending_active ON featured_trending_cards(featured_until, position)"
    );

    console.log("✅ Featured trending cards table initialized successfully!");
    process.exit(0);
  } catch (error) {
    console.error(
      "❌ Error initializing featured trending cards table:",
      error
    );
    process.exit(1);
  }
}

initializeTrendingCardsTable();
