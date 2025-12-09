import { run, query } from "../utils/database.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function initializeMarketplaceConfig() {
  try {
    console.log("📊 Initializing marketplace_config table...");

    // Read and execute the migration SQL file
    const migrationPath = join(__dirname, "../migrations/create-marketplace-config.sql");
    const migrationSQL = readFileSync(migrationPath, "utf-8");

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0);

    for (const statement of statements) {
      if (statement.toLowerCase().includes("insert or ignore")) {
        // Handle INSERT OR IGNORE separately
        await run(statement);
      } else {
        await run(statement);
      }
    }

    // Verify table was created
    const tables = await query(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='marketplace_config'"
    );

    if (tables.length > 0) {
      const count = await query("SELECT COUNT(*) as count FROM marketplace_config");
      console.log(`✅ Marketplace config table initialized successfully! (${count[0].count} platforms configured)`);
    } else {
      console.error("❌ Marketplace config table was not created");
      process.exit(1);
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing marketplace config table:", error);
    process.exit(1);
  }
}

initializeMarketplaceConfig();




