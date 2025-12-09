import express from "express";
import { query, get, run } from "../utils/database.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Helper function to clean card names
const cleanCardName = (name) => {
  if (!name) return name;

  // Remove card numbers like " - 8/102", " - 22/107"
  let cleaned = name.replace(/\s*-\s*\d+\/?\d*\s*$/, "");

  // Remove parenthetical card numbers like "(1)", "(10)", "(H1)", "(H2)"
  cleaned = cleaned.replace(/\s*\([A-Z]?\d+\)\s*$/, "");

  // Remove other common suffixes
  cleaned = cleaned.replace(/\s*\([A-Z]\d+\)\s*$/, ""); // Like "(H1)", "(H2)"
  cleaned = cleaned.replace(/\s*\([A-Z]+\)\s*$/, ""); // Like "(H)", "(EX)"

  return cleaned.trim();
};

// Helper function to clean set names
const cleanSetName = (name) => {
  if (!name) return name;

  // Remove series codes like "SWSH01:", "SM -", "XY -", "ME01:", "M2a:", etc.
  let cleaned = name.replace(/^(SWSH\d+:\s*)/i, ""); // Remove "SWSH01: " prefix
  cleaned = cleaned.replace(/^(SM\s*-\s*)/i, ""); // Remove "SM - " prefix
  cleaned = cleaned.replace(/^(XY\s*-\s*)/i, ""); // Remove "XY - " prefix
  cleaned = cleaned.replace(/^(ME\d+:\s*)/i, ""); // Remove "ME01: ", "ME02: " prefix (Phantasmal Flames)
  cleaned = cleaned.replace(/^(M\d+[a-z]?:\s*)/i, ""); // Remove "M2a: " prefix (Mega Dream)
  cleaned = cleaned.replace(/^(BW\s*-\s*)/i, ""); // Remove "BW - " prefix
  cleaned = cleaned.replace(/^(DP\s*-\s*)/i, ""); // Remove "DP - " prefix
  cleaned = cleaned.replace(/^(HGSS\s*-\s*)/i, ""); // Remove "HGSS - " prefix
  cleaned = cleaned.replace(/^(EX\s*-\s*)/i, ""); // Remove "EX - " prefix
  cleaned = cleaned.replace(/^(SV\d+:\s*)/i, ""); // Remove "SV01: " prefix
  cleaned = cleaned.replace(/^(SV:\s*)/i, ""); // Remove "SV: " prefix
  cleaned = cleaned.replace(/^(SVE:\s*)/i, ""); // Remove "SVE: " prefix
  // Remove "High Class Pack:" prefix from Japanese sets
  cleaned = cleaned.replace(/^High Class Pack:\s*/i, "");
  // Remove other Japanese set prefixes
  cleaned = cleaned.replace(/^sp\d+:\s*/i, "");
  cleaned = cleaned.replace(/^S\d+[a-z]:\s*/i, "");
  cleaned = cleaned.replace(/^SM\d+[A-Z]:\s*/i, "");

  return cleaned.trim();
};

// All routes require admin authentication (except in development)
// Temporarily disabled for debugging
// if (process.env.NODE_ENV !== 'development') {
//   router.use(requireAdmin);
// }

// CSV Import endpoint
router.post("/csv/import", async (req, res) => {
  try {
    const { csvData, options } = req.body;
    const rows = csvData;
    const previewMode = options?.previewOnly || false;

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: "Invalid CSV data" });
    }

    // If preview mode, just return the first 10 rows
    if (previewMode) {
      return res.json({
        success: true,
        data: rows.slice(0, 10),
        preview: rows.slice(0, 10),
        totalRows: rows.length,
      });
    }

    // Ensure optional columns exist (clean_name, clean_set_name)
    try {
      const cols = await query(`PRAGMA table_info(products)`);
      const colNames = new Set(cols.map((c) => c.name));
      const alterStmts = [];
      if (!colNames.has("clean_name"))
        alterStmts.push("ALTER TABLE products ADD COLUMN clean_name TEXT");
      if (!colNames.has("clean_set_name"))
        alterStmts.push("ALTER TABLE products ADD COLUMN clean_set_name TEXT");
      for (const stmt of alterStmts) {
        await run(stmt);
      }
    } catch (e) {
      // Non-fatal; continue if unable to alter
      console.warn("Optional column ensure warning:", e?.message);
    }

    // Import mode - update database
    let successCount = 0;
    let errorCount = 0;

    for (const row of rows) {
      try {
        const cardId = row.id || row.card_id;

        if (!cardId) {
          errorCount++;
          continue;
        }

        // Build dynamic UPDATE query based on available fields
        const updates = [];
        const values = [];

        const fieldMap = {
          name: "name",
          hp: "hp",
          artist: "artist",
          rarity: "rarity",
          current_value: "current_value",
          price: "current_value",
          cleanName: "clean_name",
          clean_set_name: "clean_set_name",
          cleanSetName: "clean_set_name",
        };

        for (const [csvField, dbField] of Object.entries(fieldMap)) {
          if (
            row[csvField] !== undefined &&
            row[csvField] !== null &&
            row[csvField] !== ""
          ) {
            updates.push(`${dbField} = ?`);
            values.push(row[csvField]);
          }
        }

        if (updates.length > 0) {
          values.push(cardId);
          await run(
            `UPDATE cards SET ${updates.join(
              ", "
            )}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
          );
          successCount++;
        }
      } catch (error) {
        console.error(`Error importing row:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      imported: successCount,
      errors: errorCount,
      total: rows.length,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    res.status(500).json({ error: "Failed to import CSV" });
  }
});

// Bulk price update endpoint
router.post("/prices/bulk-update", async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "Invalid updates array" });
    }

    let successCount = 0;
    let errorCount = 0;

    for (const update of updates) {
      try {
        const { cardId, newPrice } = update;

        if (!cardId || newPrice === undefined) {
          errorCount++;
          continue;
        }

        await run(
          "UPDATE cards SET current_value = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
          [parseFloat(newPrice), cardId]
        );

        successCount++;
      } catch (error) {
        console.error(`Error updating card ${update.cardId}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      updated: successCount,
      errors: errorCount,
      total: updates.length,
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ error: "Failed to update prices" });
  }
});

// Dashboard stats
router.get("/dashboard/stats", async (req, res) => {
  try {
    const stats = await get(`
      SELECT 
        (SELECT COUNT(*) FROM products) as total_cards,
        (SELECT COUNT(*) FROM groups) as total_sets,
        (SELECT COUNT(*) FROM products WHERE market_price > 0) as cards_with_pricing,
        (SELECT COUNT(*) FROM products WHERE artist IS NOT NULL AND artist != '') as cards_with_artist,
        (SELECT AVG(market_price) FROM products WHERE market_price > 0) as avg_price,
        (SELECT MAX(market_price) FROM products WHERE market_price > 0) as max_price,
        (SELECT COUNT(DISTINCT user_id) FROM analytics_events WHERE DATE(timestamp) = DATE('now')) as active_users_today,
        (SELECT COUNT(*) FROM analytics_events WHERE event_type = 'search' AND DATE(timestamp) = DATE('now')) as searches_today
    `);

    res.json({
      success: true,
      stats: {
        total_cards: stats.total_cards,
        total_sets: stats.total_sets,
        cards_with_pricing: stats.cards_with_pricing,
        pricing_coverage: (
          (stats.cards_with_pricing / stats.total_cards) *
          100
        ).toFixed(1),
        cards_with_artist: stats.cards_with_artist,
        artist_coverage: (
          (stats.cards_with_artist / stats.total_cards) *
          100
        ).toFixed(1),
        avg_price: parseFloat(stats.avg_price?.toFixed(2) || 0),
        max_price: parseFloat(stats.max_price?.toFixed(2) || 0),
        active_users_today: stats.active_users_today || 0,
        searches_today: stats.searches_today || 0,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get all cards (paginated)
router.get("/cards", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const filter = req.query.filter || "";
    const language = req.query.language || ""; // 'international', 'japanese', or empty for all
    const sortBy = req.query.sortBy || "release_date";
    const sortOrder = req.query.sortOrder || "desc";
    const productType = req.query.productType || "all";
    // Fuzzy search is now automatic

    let whereClause = "1=1";
    let params = [];

    // Enhanced fuzzy search across multiple fields
    if (search) {
      whereClause += ` AND (
        p.name LIKE ? OR 
        p.artist LIKE ? OR 
        p.product_id LIKE ? OR
        p.ext_number LIKE ? OR
        p.ext_rarity LIKE ? OR
        p.ext_card_type LIKE ? OR
        g.name LIKE ? OR
        g.published_on LIKE ? OR
        CAST(p.market_price AS TEXT) LIKE ? OR
        CAST(p.low_price AS TEXT) LIKE ? OR
        CAST(p.mid_price AS TEXT) LIKE ? OR
        CAST(p.high_price AS TEXT) LIKE ? OR
        -- Fuzzy matching for partial words
        p.name LIKE ? OR
        p.artist LIKE ? OR
        g.name LIKE ?
      )`;
      const searchPattern = `%${search}%`;
      const fuzzyPattern = `%${search.split(" ").join("%")}%`; // Match partial words
      params.push(
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        searchPattern,
        fuzzyPattern,
        fuzzyPattern,
        fuzzyPattern
      );
    }

    // Special filters
    if (filter === "no_price") {
      whereClause += " AND (p.market_price IS NULL OR p.market_price = 0)";
    } else if (filter === "no_artist") {
      whereClause += ' AND (p.artist IS NULL OR p.artist = "")';
    } else if (filter === "high_value") {
      whereClause += " AND p.market_price > 100";
    } else if (filter === "new_sets") {
      // Filter for recent/new sets (Phantasmal Flames, Mega Dream, Ascending Heroes, etc.)
      whereClause += ` AND (
        g.group_id = 24448 OR  -- Phantasmal Flames
        g.group_id = 24499 OR  -- Mega Dream
        g.name LIKE '%Phantasmal Flames%' OR
        g.name LIKE '%ME02%' OR
        g.name LIKE '%MEGA Dream%' OR
        g.name LIKE '%M2a%' OR
        g.name LIKE '%Ascending Heroes%' OR
        (g.published_on IS NOT NULL AND g.published_on >= date('now', '-6 months')) OR
        (g.published_on IS NOT NULL AND g.published_on > date('now'))
      )`;
    }

    // Language/Region filter - use the language field as primary indicator
    if (language === "japanese") {
      // Filter for Japanese cards - primarily use language field
      whereClause += ` AND p.language = 'ja'`;
    } else if (language === "international") {
      // Filter for International (non-Japanese) cards
      whereClause += ` AND (p.language = 'en' OR p.language IS NULL OR p.language = '')`;
    }

    // Product type filter
    if (productType === "cards") {
      // Filter for individual cards - exclude sealed products by name patterns
      whereClause += ` AND p.name NOT LIKE '%Booster Box%' 
        AND p.name NOT LIKE '%Booster Pack%' 
        AND p.name NOT LIKE '%Elite Trainer Box%' 
        AND p.name NOT LIKE '%Collection Box%' 
        AND p.name NOT LIKE '%Theme Deck%' 
        AND p.name NOT LIKE '%Starter Deck%' 
        AND p.name NOT LIKE '%Code Card%' 
        AND p.name NOT LIKE '%Display%' 
        AND p.name NOT LIKE '%Case%' 
        AND p.name NOT LIKE '%Bundle%'`;
    } else if (productType === "sealed") {
      // Filter for sealed products - include products with sealed product name patterns
      whereClause += ` AND (
        p.name LIKE '%Booster Box%' 
        OR p.name LIKE '%Booster Pack%' 
        OR p.name LIKE '%Elite Trainer Box%' 
        OR p.name LIKE '%Collection Box%' 
        OR p.name LIKE '%Theme Deck%' 
        OR p.name LIKE '%Starter Deck%' 
        OR p.name LIKE '%Code Card%' 
        OR p.name LIKE '%Display%' 
        OR p.name LIKE '%Case%' 
        OR p.name LIKE '%Bundle%'
      )`;
    }

    // Build ORDER BY clause
    let orderByClause = "";
    const validColumns = [
      "name",
      "market_price",
      "artist",
      "ext_rarity",
      "ext_hp",
      "release_date",
      "set_name",
    ];

    if (validColumns.includes(sortBy)) {
      const direction = sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

      if (sortBy === "release_date") {
        // Sort by release date, handling nulls properly
        // Future dates (like Phantasmal Flames) will show first with DESC
        // Use date() function to ensure proper date comparison in SQLite
        if (direction === "DESC") {
          orderByClause = `date(COALESCE(g.published_on, s.release_date, '1900-01-01')) DESC, g.name ASC, CAST(p.ext_number AS INTEGER) ASC, p.ext_number ASC`;
        } else {
          orderByClause = `date(COALESCE(g.published_on, s.release_date, '9999-12-31')) ASC, g.name ASC, CAST(p.ext_number AS INTEGER) ASC, p.ext_number ASC`;
        }
      } else if (sortBy === "set_name") {
        // Sort by set name, then by card number (numeric)
        orderByClause = `g.name ${direction}, CAST(p.ext_number AS INTEGER) ASC, p.ext_number ASC`;
      } else if (sortBy === "current_value") {
        orderByClause = `p.market_price ${direction}, p.name ASC`;
      } else if (sortBy === "rarity") {
        orderByClause = `p.ext_rarity ${direction}, p.name ASC`;
      } else if (sortBy === "hp") {
        orderByClause = `p.ext_hp ${direction}, p.name ASC`;
      } else {
        orderByClause = `p.${sortBy} ${direction}, p.name ASC`;
      }
    } else {
      orderByClause = "p.market_price DESC, p.name ASC";
    }

    // Get total count with release dates
    const countResult = await get(
      `SELECT COUNT(*) as total FROM products p
       LEFT JOIN groups g ON p.group_id = g.group_id
       LEFT JOIN sets s ON (
         g.name = s.name OR 
         g.name LIKE '%' || s.name || '%' OR 
         s.name LIKE '%' || REPLACE(REPLACE(g.name, 'SWSH', ''), 'SM', '') || '%'
       )
       WHERE ${whereClause}`,
      params
    );

    // Get paginated cards with release dates
    const cards = await query(
      `SELECT 
        p.*,
        g.name as set_name,
        COALESCE(g.published_on, s.release_date) as release_date
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      LEFT JOIN sets s ON (
        g.name = s.name OR 
        g.name LIKE '%' || s.name || '%' OR 
        s.name LIKE '%' || REPLACE(REPLACE(g.name, 'SWSH', ''), 'SM', '') || '%'
      )
      WHERE ${whereClause}
      ORDER BY ${orderByClause}
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Debug: Log a few cards to see if release_date is being returned
    if (cards.length > 0) {
      console.log("Sample card data:", {
        product_id: cards[0].product_id,
        name: cards[0].name,
        release_date: cards[0].release_date,
        set_name: cards[0].set_name,
      });
    }

    // Clean up card names and set names
    const cleanedCards = cards.map((card) => ({
      ...card,
      name: cleanCardName(card.name),
      set_name: cleanSetName(card.set_name),
    }));

    res.json({
      success: true,
      data: cleanedCards,
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    res.status(500).json({ error: "Failed to fetch cards" });
  }
});

// Get single card
router.get("/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined") {
      return res.status(400).json({ error: "Invalid card ID" });
    }

    const card = await get(
      `SELECT 
        p.*,
        g.name as set_name,
        g.clean_name as clean_set_name,
        COALESCE(g.published_on, s.release_date) as release_date,
        COALESCE(c.weaknesses, p.ext_weakness) as weaknesses,
        COALESCE(c.resistances, p.ext_resistance) as resistances,
        COALESCE(c.retreat_cost, p.ext_retreat_cost) as retreat_cost,
        c.converted_retreat_cost
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      LEFT JOIN sets s ON (
        g.name = s.name OR 
        g.name LIKE '%' || s.name || '%' OR 
        s.name LIKE '%' || REPLACE(REPLACE(g.name, 'SWSH', ''), 'SM', '') || '%'
      )
      LEFT JOIN cards c ON (
        p.name = c.name AND 
        CAST(p.ext_hp AS INTEGER) = CAST(c.hp AS INTEGER) AND
        (p.ext_rarity = c.rarity OR 
         p.ext_rarity LIKE '%' || c.rarity || '%' OR 
         c.rarity LIKE '%' || p.ext_rarity || '%') AND
        s.id = c.set_id
      )
      WHERE p.product_id = ?`,
      [id]
    );

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Parse attacks - format: [Energy][Energy] Attack Name (damage)<br>description
    const parseAttack = (attackText) => {
      if (!attackText) return null;

      // Split by <br> to separate attack header from description
      const parts = attackText.split(/<br\s*\/?>/i);
      const header = parts[0] || "";
      const description = parts.slice(1).join(" ").trim();

      // Extract energy costs - match [Energy] patterns
      const energyCosts = [];
      const energyPattern = /\[([^\]]+)\]/g;
      let match;
      let energyEndIndex = 0;
      while ((match = energyPattern.exec(header)) !== null) {
        const energyType = match[1].trim();
        // Map common energy types
        const energyMap = {
          Grass: "Grass",
          G: "Grass",
          Fire: "Fire",
          R: "Fire",
          Water: "Water",
          W: "Water",
          Lightning: "Lightning",
          L: "Lightning",
          Psychic: "Psychic",
          P: "Psychic",
          Fighting: "Fighting",
          F: "Fighting",
          Darkness: "Darkness",
          D: "Darkness",
          Metal: "Metal",
          M: "Metal",
          Colorless: "Colorless",
          C: "Colorless",
          Fairy: "Fairy",
          Y: "Fairy",
          Dragon: "Dragon",
        };
        const mappedEnergy = energyMap[energyType] || energyType;
        energyCosts.push(mappedEnergy);
        energyEndIndex = match.index + match[0].length;
      }

      // Extract damage - match (number) at the end
      const damageMatch = header.match(/\((\d+)\)\s*$/);
      const damage = damageMatch ? damageMatch[1] : "";

      // Extract attack name - everything after energy costs and before damage
      // Remove all energy cost brackets first, then remove damage
      let namePart = header;
      // Remove all [Energy] patterns
      namePart = namePart.replace(/\[([^\]]+)\]/g, "").trim();
      // Remove damage if present
      if (damageMatch) {
        namePart = namePart.replace(/\(\d+\)\s*$/, "").trim();
      }
      const attackName = namePart || "Unknown Attack";

      return {
        name: attackName,
        cost: energyCosts,
        damage: damage,
        text: description,
      };
    };

    // Parse attacks from ext_attack1 and ext_attack2
    const attacks = [];
    if (card.ext_attack1) {
      const attack = parseAttack(card.ext_attack1);
      if (attack) attacks.push(attack);
    }
    if (card.ext_attack2) {
      const attack = parseAttack(card.ext_attack2);
      if (attack) attacks.push(attack);
    }

    // Clean up card name and set name
    const cleanedCard = {
      ...card,
      name: cleanCardName(card.name),
      set_name: cleanSetName(card.set_name),
      attacks: attacks, // Add parsed attacks
    };

    res.json({ success: true, data: cleanedCard });
  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ error: "Failed to fetch card" });
  }
});

// Update card
router.put("/cards/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Build dynamic UPDATE query - only allow fields that exist in the products table
    const allowedFields = [
      "name",
      "artist",
      "ext_rarity",
      "market_price",
      "ext_hp",
      "ext_card_type",
      "ext_number",
      "ext_card_text",
      "ext_attack1",
      "ext_attack2",
      "ext_weakness",
      "ext_resistance",
      "ext_retreat_cost",
      "image_url",
      "ext_stage",
      "sub_type_name",
      "low_price",
      "mid_price",
      "high_price",
      "direct_low_price",
      "abilities",
      "attacks",
      "ext_regulation",
      "legalities",
    ];

    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(typeof value === "object" ? JSON.stringify(value) : value);
        console.log(`🔍 Server: Processing field ${key} with value:`, value);
      } else {
        console.log(`🔍 Server: Skipping field ${key} (not in allowedFields)`);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    values.push(id);

    const query = `UPDATE products SET ${updateFields.join(
      ", "
    )} WHERE product_id = ?`;
    console.log("🔍 Server: Final SQL query:", query);
    console.log("🔍 Server: Values:", values);

    const result = await run(query, values);

    if (result.changes === 0) {
      return res.status(404).json({ error: "Card not found" });
    }

    res.json({ success: true, message: "Card updated successfully" });
  } catch (error) {
    console.error("Error updating card:", error);
    console.error("Error details:", error.message);
    console.error("SQL Error:", error.code);
    res
      .status(500)
      .json({ error: "Failed to update card", details: error.message });
  }
});

// Get missing data summary
router.get("/cards/missing/summary", async (req, res) => {
  try {
    const summary = await get(`
      SELECT 
        COUNT(CASE WHEN current_value IS NULL OR current_value = 0 THEN 1 END) as missing_price,
        COUNT(CASE WHEN artist IS NULL OR artist = '' THEN 1 END) as missing_artist,
        COUNT(CASE WHEN images IS NULL THEN 1 END) as missing_images,
        COUNT(CASE WHEN rarity IS NULL OR rarity = '' THEN 1 END) as missing_rarity
      FROM cards
    `);

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error("Error fetching missing data summary:", error);
    res.status(500).json({ error: "Failed to fetch summary" });
  }
});

// System health check
router.get("/system/health", async (req, res) => {
  try {
    const health = await get(`
      SELECT 
        (SELECT COUNT(*) FROM cards) as total_cards,
        (SELECT COUNT(*) FROM sets) as total_sets,
        (SELECT COUNT(*) FROM analytics_events) as total_events
    `);

    res.json({
      success: true,
      status: "healthy",
      database: "connected",
      tables: health,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error.message,
    });
  }
});

// Update groups release date
router.put("/groups/release-date", async (req, res) => {
  try {
    const { groupIds, releaseDate } = req.body;

    if (!groupIds || !Array.isArray(groupIds) || groupIds.length === 0) {
      return res.status(400).json({ error: "Group IDs are required" });
    }

    if (!releaseDate) {
      return res.status(400).json({ error: "Release date is required" });
    }

    // Update all groups with the new release date
    const placeholders = groupIds.map(() => "?").join(",");
    const query = `UPDATE groups SET published_on = ? WHERE group_id IN (${placeholders})`;
    const params = [releaseDate, ...groupIds];

    console.log("Updating groups release date:", {
      groupIds,
      releaseDate,
      query,
      params,
    });
    console.log(
      "📅 Server received release date:",
      releaseDate,
      "Type:",
      typeof releaseDate,
      "Length:",
      releaseDate?.length
    );
    try {
      const result = await run(query, params);
      console.log("Update result:", result);
      console.log("📅 Database update successful, changes:", result.changes);
    } catch (error) {
      console.error("❌ Database update failed:", error);
      throw error;
    }

    res.json({
      success: true,
      message: `Updated release date for ${groupIds.length} groups`,
      updatedGroups: groupIds.length,
    });
  } catch (error) {
    console.error("Error updating groups release date:", error);
    res.status(500).json({ error: "Failed to update groups release date" });
  }
});

// Test endpoint
router.get("/test", (req, res) => {
  res.json({ success: true, message: "Test endpoint working" });
});

// Pricing dashboard data (uses price_history + products)
router.get("/pricing-dashboard", async (req, res) => {
  try {
    const timeRange = req.query.timeRange || "7d";

    // Compute start date (local) for filtering
    const now = new Date();
    let start = new Date(now);
    const daysMap = { "1d": 1, "7d": 7, "30d": 30, "90d": 90 };
    const backDays = daysMap[timeRange] || 7;
    start.setDate(start.getDate() - backDays);
    const startDate = `${start.getFullYear()}-${String(
      start.getMonth() + 1
    ).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0"
    )}-${String(now.getDate()).padStart(2, "0")}`;

    // Summary from price_history (price column)
    const summaryRows = await query(
      `SELECT 
         COUNT(*) AS totalRecords,
         ROUND(AVG(price), 2) AS averagePrice,
         MAX(price) AS highestPrice,
         SUM(CASE WHEN date = ? THEN 1 ELSE 0 END) AS updatesToday
       FROM price_history
       WHERE price > 0 AND date >= ?`,
      [today, startDate]
    );
    const summary = summaryRows[0] || {
      totalRecords: 0,
      averagePrice: 0,
      highestPrice: 0,
      updatesToday: 0,
    };

    // Price trends over time
    const trendRows = await query(
      `SELECT date, ROUND(AVG(price), 2) AS avgPrice, COUNT(*) AS recordCount
       FROM price_history
       WHERE price > 0 AND date >= ?
       GROUP BY date
       ORDER BY date ASC`,
      [startDate]
    );

    // Price distribution buckets
    const distRows = await query(
      `SELECT 
         CASE 
           WHEN price < 1 THEN '< $1'
           WHEN price < 5 THEN '$1-$5'
           WHEN price < 10 THEN '$5-$10'
           WHEN price < 25 THEN '$10-$25'
           WHEN price < 50 THEN '$25-$50'
           WHEN price < 100 THEN '$50-$100'
           ELSE '> $100'
         END AS priceRange,
         COUNT(*) AS count
       FROM price_history
       WHERE price > 0 AND date >= ?
       GROUP BY priceRange
       ORDER BY 
         CASE priceRange
           WHEN '< $1' THEN 1
           WHEN '$1-$5' THEN 2
           WHEN '$5-$10' THEN 3
           WHEN '$10-$25' THEN 4
           WHEN '$25-$50' THEN 5
           WHEN '$50-$100' THEN 6
           ELSE 7
         END`,
      [startDate]
    );

    // Recent updates (last 20 rows in range)
    const recentUpdates = await query(
      `SELECT 
         ph.product_id,
         p.name,
         p.image_url,
         ph.price AS market_price,
         p.sub_type_name,
         p.ext_card_type,
         g.name AS set_name,
         ph.date
       FROM price_history ph
       LEFT JOIN products p ON p.product_id = ph.product_id
       LEFT JOIN groups g ON g.group_id = p.group_id
       WHERE ph.price > 0 AND ph.date >= ?
       ORDER BY ph.date DESC
       LIMIT 20`,
      [startDate]
    );

    // Top value cards (from products table)
    const topCards = await query(
      `SELECT 
         p.product_id,
         p.name,
         p.image_url,
         p.market_price,
         p.ext_rarity,
         p.sub_type_name,
         p.ext_card_type,
         g.name AS set_name
       FROM products p
       LEFT JOIN groups g ON g.group_id = p.group_id
       WHERE p.market_price > 0
       ORDER BY p.market_price DESC
       LIMIT 20`
    );

    // Format chart payloads
    const charts = {
      priceTrends: {
        labels: trendRows.map((r) => r.date),
        datasets: [
          {
            label: "Average Price",
            data: trendRows.map((r) => Number(r.avgPrice)),
            borderColor: "rgb(59, 130, 246)",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.1,
          },
        ],
      },
      priceDistribution: {
        labels: distRows.map((r) => r.priceRange),
        datasets: [
          {
            data: distRows.map((r) => r.count),
            backgroundColor: [
              "#ef4444",
              "#f97316",
              "#eab308",
              "#22c55e",
              "#06b6d4",
              "#3b82f6",
              "#8b5cf6",
            ],
          },
        ],
      },
      setPerformance: {
        labels: [],
        datasets: [
          {
            label: "Average Price",
            data: [],
            backgroundColor: "rgba(59,130,246,0.8)",
          },
        ],
      },
    };

    res.json({
      success: true,
      data: { summary, charts, recentUpdates, topCards },
    });
  } catch (error) {
    console.error("Error fetching pricing dashboard data:", error);
    res.status(500).json({ error: "Failed to fetch pricing dashboard data" });
  }
});

// ==================== SETS MANAGEMENT HELPERS ====================

// Helper function to ensure set columns exist
async function ensureSetColumns() {
  try {
    const cols = await query(`PRAGMA table_info(groups)`);
    const colNames = new Set(cols.map((c) => c.name));

    if (!colNames.has("clean_name")) {
      await run("ALTER TABLE groups ADD COLUMN clean_name VARCHAR(255)");
    }
    if (!colNames.has("logo_url")) {
      await run("ALTER TABLE groups ADD COLUMN logo_url TEXT");
    }
    if (!colNames.has("symbol_url")) {
      await run("ALTER TABLE groups ADD COLUMN symbol_url TEXT");
    }
    if (!colNames.has("published_on")) {
      await run("ALTER TABLE groups ADD COLUMN published_on TIMESTAMP");
    }
  } catch (error) {
    console.warn("Warning: Could not ensure set columns:", error.message);
  }
}

// Get all sets (groups) with pagination and filtering
router.get("/sets", async (req, res) => {
  try {
    await ensureSetColumns();

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const language = req.query.language || ""; // 'international', 'japanese', or empty for all
    const sortBy = req.query.sortBy || "published_on";
    const sortOrder = req.query.sortOrder || "DESC";

    // Build WHERE clause for search
    let whereClause = "WHERE g.category_id = 3";
    const queryParams = [];

    // Language/Region filter for sets
    let languageFilterClause = "";
    if (language === "japanese") {
      // Only show sets that have Japanese cards (language = 'ja')
      languageFilterClause = ` AND EXISTS (
        SELECT 1 FROM products p_lang 
        WHERE p_lang.group_id = g.group_id 
        AND p_lang.category_id = 3 
        AND p_lang.language = 'ja'
      )`;
    } else if (language === "international") {
      // Only show sets that have International cards (language = 'en' or NULL) and no Japanese cards
      languageFilterClause = ` AND EXISTS (
        SELECT 1 FROM products p_lang 
        WHERE p_lang.group_id = g.group_id 
        AND p_lang.category_id = 3 
        AND (p_lang.language = 'en' OR p_lang.language IS NULL OR p_lang.language = '')
      ) AND NOT EXISTS (
        SELECT 1 FROM products p_lang_ja 
        WHERE p_lang_ja.group_id = g.group_id 
        AND p_lang_ja.category_id = 3 
        AND p_lang_ja.language = 'ja'
      )`;
    }

    if (search) {
      whereClause += " AND (g.name LIKE ? OR g.group_id LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    // Get total count
    const countResult = await query(
      `
      SELECT COUNT(DISTINCT g.group_id) as total
      FROM groups g
      LEFT JOIN products p ON g.group_id = p.group_id AND p.category_id = 3
      ${whereClause}
      ${languageFilterClause}
      AND EXISTS (
        SELECT 1 
        FROM products p2 
        WHERE p2.group_id = g.group_id 
        AND p2.category_id = 3
        LIMIT 1
      )
    `,
      queryParams
    );

    const total = countResult[0]?.total || 0;

    // Get sets with card counts
    const sets = await query(
      `
      SELECT 
        g.group_id as id,
        g.name,
        COALESCE(g.clean_name, g.name) as clean_name,
        g.published_on,
        g.modified_on,
        g.logo_url,
        g.symbol_url,
        COUNT(DISTINCT p.product_id) as total_cards
      FROM groups g
      LEFT JOIN products p ON g.group_id = p.group_id AND p.category_id = 3
      ${whereClause}
      ${languageFilterClause}
      AND EXISTS (
        SELECT 1 
        FROM products p2 
        WHERE p2.group_id = g.group_id 
        AND p2.category_id = 3
        LIMIT 1
      )
      GROUP BY g.group_id, g.name, g.clean_name, g.published_on, g.modified_on, g.logo_url, g.symbol_url
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      data: sets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching sets:", error);
    res.status(500).json({ error: "Failed to fetch sets" });
  }
});

// Get single set by ID
router.get("/sets/:id", async (req, res) => {
  try {
    await ensureSetColumns();

    const setId = parseInt(req.params.id, 10);

    if (isNaN(setId)) {
      return res.status(400).json({ error: "Invalid set ID" });
    }

    // Get set info
    const set = await query(
      `
      SELECT 
        g.group_id as id,
        g.name,
        COALESCE(g.clean_name, g.name) as clean_name,
        g.published_on,
        g.modified_on,
        g.logo_url,
        g.symbol_url
      FROM groups g
      WHERE g.group_id = ? AND g.category_id = 3
    `,
      [setId]
    );

    if (set.length === 0) {
      return res.status(404).json({ error: "Set not found" });
    }

    const setData = set[0];

    // Get card count
    const cardCountResult = await query(
      `
      SELECT COUNT(*) as card_count
      FROM products p
      WHERE p.group_id = ? AND p.category_id = 3
    `,
      [setId]
    );

    const cardCount = cardCountResult[0]?.card_count || 0;

    res.json({
      success: true,
      data: {
        ...setData,
        total_cards: cardCount,
      },
    });
  } catch (error) {
    console.error("Error fetching set:", error);
    res.status(500).json({ error: "Failed to fetch set" });
  }
});

// Update set
router.put("/sets/:id", async (req, res) => {
  try {
    await ensureSetColumns();

    const setId = parseInt(req.params.id, 10);
    const updates = req.body;

    if (isNaN(setId)) {
      return res.status(400).json({ error: "Invalid set ID" });
    }

    // Allowed fields for groups table
    const allowedFields = [
      "name",
      "clean_name",
      "published_on",
      "modified_on",
      "logo_url",
      "symbol_url",
    ];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Add updated_at
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(setId);

    await run(
      `UPDATE groups SET ${updateFields.join(
        ", "
      )} WHERE group_id = ? AND category_id = 3`,
      values
    );

    // Fetch updated set
    const updatedSet = await query(
      `
      SELECT 
        g.group_id as id,
        g.name,
        COALESCE(g.clean_name, g.name) as clean_name,
        g.published_on,
        g.modified_on,
        g.logo_url,
        g.symbol_url
      FROM groups g
      WHERE g.group_id = ? AND g.category_id = 3
    `,
      [setId]
    );

    res.json({
      success: true,
      data: updatedSet[0],
    });
  } catch (error) {
    console.error("Error updating set:", error);
    res.status(500).json({ error: "Failed to update set" });
  }
});

// ==================== USER MANAGEMENT ====================

// Helper function to ensure suspension columns exist
async function ensureSuspensionColumns() {
  try {
    const cols = await query(`PRAGMA table_info(users)`);
    const colNames = new Set(cols.map((c) => c.name));

    if (!colNames.has("is_suspended")) {
      await run("ALTER TABLE users ADD COLUMN is_suspended INTEGER DEFAULT 0");
    }
    if (!colNames.has("suspended_until")) {
      await run("ALTER TABLE users ADD COLUMN suspended_until TEXT");
    }
    if (!colNames.has("suspension_reason")) {
      await run("ALTER TABLE users ADD COLUMN suspension_reason TEXT");
    }
  } catch (error) {
    console.warn(
      "Warning: Could not ensure suspension columns:",
      error.message
    );
  }
}

// Ensure columns exist on first user management request
let columnsChecked = false;

// Get all users with pagination and filtering
router.get("/users", async (req, res) => {
  try {
    if (!columnsChecked) {
      await ensureSuspensionColumns();
      columnsChecked = true;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    const search = req.query.search || "";
    const sortBy = req.query.sortBy || "created_at";
    const sortOrder = req.query.sortOrder || "DESC";
    const filterStatus = req.query.filterStatus || "all"; // 'all', 'active', 'suspended', 'free', 'pro'

    // Build WHERE clause
    let whereClause = "1=1";
    const queryParams = [];

    if (search) {
      whereClause +=
        " AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)";
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (filterStatus === "pro") {
      whereClause += " AND is_pro = 1";
    } else if (filterStatus === "free") {
      whereClause += " AND (is_pro = 0 OR is_pro IS NULL)";
    } else if (filterStatus === "suspended") {
      whereClause +=
        ' AND (is_suspended = 1 OR (suspended_until IS NOT NULL AND suspended_until > datetime("now")))';
    } else if (filterStatus === "active") {
      whereClause +=
        ' AND (is_suspended = 0 OR is_suspended IS NULL) AND (suspended_until IS NULL OR suspended_until < datetime("now"))';
    }

    // Get total count
    const countQuery =
      whereClause === "1=1"
        ? "SELECT COUNT(*) as total FROM users"
        : `SELECT COUNT(*) as total FROM users WHERE ${whereClause.replace(
            "1=1 AND ",
            ""
          )}`;
    const countResult = await query(countQuery, queryParams);

    const total = countResult[0]?.total || 0;

    // Get users with usage stats
    const whereClauseFinal =
      whereClause === "1=1"
        ? ""
        : `WHERE ${whereClause.replace("1=1 AND ", "")}`;

    // Build ORDER BY clause - handle computed fields specially
    let orderByClause = "";
    if (sortBy === "products_collected") {
      // For products_collected, we need to use the subquery in ORDER BY
      orderByClause = `ORDER BY (SELECT COUNT(DISTINCT card_id) FROM user_collections uc WHERE uc.user_id = u.id) ${sortOrder}`;
    } else {
      orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;
    }

    const users = await query(
      `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.profile_image,
        u.is_pro,
        u.created_at,
        u.updated_at,
        COALESCE(u.is_suspended, 0) as is_suspended,
        COALESCE(u.suspended_until, NULL) as suspended_until,
        COALESCE(u.suspension_reason, NULL) as suspension_reason,
        (SELECT COUNT(*) FROM analytics_events ae WHERE ae.user_id = u.id) as event_count,
        (SELECT COUNT(*) FROM analytics_events ae WHERE ae.user_id = u.id AND DATE(ae.timestamp) = DATE('now')) as events_today,
        (SELECT MAX(timestamp) FROM analytics_events ae WHERE ae.user_id = u.id) as last_activity,
        (SELECT COUNT(DISTINCT DATE(timestamp)) FROM analytics_events ae WHERE ae.user_id = u.id) as active_days,
        (SELECT COUNT(DISTINCT card_id) FROM user_collections uc WHERE uc.user_id = u.id) as products_collected
      FROM users u
      ${whereClauseFinal}
      ${orderByClause}
      LIMIT ? OFFSET ?
    `,
      [...queryParams, limit, offset]
    );

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// Get single user by ID
router.get("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;

    // Get user with detailed stats
    const user = await get(
      `
      SELECT 
        u.*,
        (SELECT COUNT(*) FROM analytics_events ae WHERE ae.user_id = u.id) as total_events,
        (SELECT COUNT(*) FROM analytics_events ae WHERE ae.user_id = u.id AND DATE(ae.timestamp) = DATE('now')) as events_today,
        (SELECT MAX(timestamp) FROM analytics_events ae WHERE ae.user_id = u.id) as last_activity,
        (SELECT MIN(timestamp) FROM analytics_events ae WHERE ae.user_id = u.id) as first_activity,
        (SELECT COUNT(DISTINCT DATE(timestamp)) FROM analytics_events ae WHERE ae.user_id = u.id) as active_days,
        (SELECT COUNT(*) FROM analytics_events ae WHERE ae.user_id = u.id AND event_type = 'search') as search_count,
        (SELECT COUNT(*) FROM analytics_events ae WHERE ae.user_id = u.id AND event_type = 'card_view') as card_view_count,
        (SELECT COUNT(*) FROM analytics_events ae WHERE ae.user_id = u.id AND event_type = 'collection_add') as collection_add_count,
        (SELECT COUNT(DISTINCT card_id) FROM user_collections uc WHERE uc.user_id = u.id) as products_collected
      FROM users u
      WHERE u.id = ?
    `,
      [userId]
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get recent activity
    const recentActivity = await query(
      `
      SELECT event_type, data, timestamp
      FROM analytics_events
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT 20
    `,
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...user,
        recent_activity: recentActivity,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

// Update user
router.put("/users/:id", async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    // Allowed fields
    const allowedFields = [
      "is_pro",
      "is_suspended",
      "suspended_until",
      "suspension_reason",
      "full_name",
      "username",
      "email",
    ];
    const updateFields = [];
    const values = [];

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key)) {
        updateFields.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No valid fields to update" });
    }

    // Add updated_at
    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(userId);

    await run(
      `UPDATE users SET ${updateFields.join(", ")} WHERE id = ?`,
      values
    );

    // Fetch updated user
    const updatedUser = await get(
      `
      SELECT * FROM users WHERE id = ?
    `,
      [userId]
    );

    res.json({
      success: true,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Suspend user (temporary timeout)
router.post("/users/:id/suspend", async (req, res) => {
  try {
    await ensureSuspensionColumns();

    const userId = req.params.id;
    const { hours, reason } = req.body;

    if (!hours || hours <= 0) {
      return res.status(400).json({ error: "Hours must be a positive number" });
    }

    const suspendedUntil = new Date();
    suspendedUntil.setHours(suspendedUntil.getHours() + parseInt(hours));

    await run(
      `
      UPDATE users 
      SET is_suspended = 1, 
          suspended_until = ?, 
          suspension_reason = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [suspendedUntil.toISOString(), reason || "Temporary suspension", userId]
    );

    const updatedUser = await get("SELECT * FROM users WHERE id = ?", [userId]);

    res.json({
      success: true,
      message: `User suspended for ${hours} hours`,
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error suspending user:", error);
    res.status(500).json({ error: "Failed to suspend user" });
  }
});

// Activate user (remove suspension)
router.post("/users/:id/activate", async (req, res) => {
  try {
    await ensureSuspensionColumns();

    const userId = req.params.id;

    await run(
      `
      UPDATE users 
      SET is_suspended = 0, 
          suspended_until = NULL, 
          suspension_reason = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `,
      [userId]
    );

    const updatedUser = await get("SELECT * FROM users WHERE id = ?", [userId]);

    res.json({
      success: true,
      message: "User activated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error activating user:", error);
    res.status(500).json({ error: "Failed to activate user" });
  }
});

// ===== TRENDING CARDS MANAGEMENT =====

// Initialize featured_trending_cards table if it doesn't exist
const ensureTrendingCardsTable = async () => {
  try {
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

    await run(
      "CREATE INDEX IF NOT EXISTS idx_featured_trending_position ON featured_trending_cards(position)"
    );
    await run(
      "CREATE INDEX IF NOT EXISTS idx_featured_trending_product ON featured_trending_cards(product_id)"
    );
    await run(
      "CREATE INDEX IF NOT EXISTS idx_featured_trending_active ON featured_trending_cards(featured_until, position)"
    );
  } catch (error) {
    console.error("Error ensuring trending cards table exists:", error);
  }
};

// Get all featured trending cards
router.get("/trending-cards", async (req, res) => {
  try {
    await ensureTrendingCardsTable();

    const featuredCards = await query(`
      SELECT 
        ftc.*,
        p.name as card_name,
        p.image_url,
        p.local_image_url,
        p.market_price,
        p.ext_rarity,
        p.ext_number,
        g.name as set_name,
        g.clean_name as clean_set_name
      FROM featured_trending_cards ftc
      LEFT JOIN products p ON ftc.product_id = p.product_id
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE ftc.featured_until IS NULL OR ftc.featured_until > datetime('now')
      ORDER BY ftc.position ASC
    `);

    res.json({ success: true, data: featuredCards });
  } catch (error) {
    console.error("Error fetching featured trending cards:", error);
    res.status(500).json({ error: "Failed to fetch featured trending cards" });
  }
});

// Add a card to featured trending
router.post("/trending-cards", async (req, res) => {
  try {
    await ensureTrendingCardsTable();

    const { product_id, position, featured_until, notes } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: "product_id is required" });
    }

    // Check if card already exists
    const existing = await get(
      "SELECT * FROM featured_trending_cards WHERE product_id = ?",
      [product_id]
    );

    if (existing) {
      // Update existing
      await run(
        `
        UPDATE featured_trending_cards
        SET position = ?,
            featured_until = ?,
            notes = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE product_id = ?
      `,
        [
          position !== undefined ? position : existing.position,
          featured_until || null,
          notes || null,
          product_id,
        ]
      );
    } else {
      // Get max position to add at end if not specified
      let newPosition = position;
      if (newPosition === undefined) {
        const maxPos = await get(
          "SELECT MAX(position) as max_pos FROM featured_trending_cards"
        );
        newPosition = (maxPos?.max_pos || 0) + 1;
      }

      // Insert new
      await run(
        `
        INSERT INTO featured_trending_cards (product_id, position, featured_until, notes)
        VALUES (?, ?, ?, ?)
      `,
        [product_id, newPosition, featured_until || null, notes || null]
      );
    }

    // Fetch updated card
    const updatedCard = await get(
      `
      SELECT 
        ftc.*,
        p.name as card_name,
        p.image_url,
        p.local_image_url,
        p.market_price,
        p.ext_rarity,
        p.ext_number,
        g.name as set_name,
        g.clean_name as clean_set_name
      FROM featured_trending_cards ftc
      LEFT JOIN products p ON ftc.product_id = p.product_id
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE ftc.product_id = ?
    `,
      [product_id]
    );

    res.json({ success: true, data: updatedCard });
  } catch (error) {
    console.error("Error adding featured trending card:", error);
    res.status(500).json({ error: "Failed to add featured trending card" });
  }
});

// Update a featured trending card
router.put("/trending-cards/:id", async (req, res) => {
  try {
    await ensureTrendingCardsTable();

    const id = req.params.id;
    const { position, featured_until, notes } = req.body;

    const updateFields = [];
    const values = [];

    if (position !== undefined) {
      updateFields.push("position = ?");
      values.push(position);
    }

    if (featured_until !== undefined) {
      updateFields.push("featured_until = ?");
      values.push(featured_until || null);
    }

    if (notes !== undefined) {
      updateFields.push("notes = ?");
      values.push(notes || null);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    await run(
      `
      UPDATE featured_trending_cards
      SET ${updateFields.join(", ")}
      WHERE id = ?
    `,
      values
    );

    // Fetch updated card
    const updatedCard = await get(
      `
      SELECT 
        ftc.*,
        p.name as card_name,
        p.image_url,
        p.local_image_url,
        p.market_price,
        p.ext_rarity,
        p.ext_number,
        g.name as set_name,
        g.clean_name as clean_set_name
      FROM featured_trending_cards ftc
      LEFT JOIN products p ON ftc.product_id = p.product_id
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE ftc.id = ?
    `,
      [id]
    );

    res.json({ success: true, data: updatedCard });
  } catch (error) {
    console.error("Error updating featured trending card:", error);
    res.status(500).json({ error: "Failed to update featured trending card" });
  }
});

// Delete a featured trending card
router.delete("/trending-cards/:id", async (req, res) => {
  try {
    await ensureTrendingCardsTable();

    const id = req.params.id;

    await run("DELETE FROM featured_trending_cards WHERE id = ?", [id]);

    res.json({ success: true, message: "Featured trending card removed" });
  } catch (error) {
    console.error("Error deleting featured trending card:", error);
    res.status(500).json({ error: "Failed to delete featured trending card" });
  }
});

// Reorder featured trending cards
router.post("/trending-cards/reorder", async (req, res) => {
  try {
    await ensureTrendingCardsTable();

    const { cards } = req.body; // Array of { id, position }

    if (!Array.isArray(cards)) {
      return res.status(400).json({ error: "cards must be an array" });
    }

    // Update positions in a transaction
    for (const card of cards) {
      await run(
        "UPDATE featured_trending_cards SET position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [card.position, card.id]
      );
    }

    res.json({ success: true, message: "Cards reordered successfully" });
  } catch (error) {
    console.error("Error reordering featured trending cards:", error);
    res
      .status(500)
      .json({ error: "Failed to reorder featured trending cards" });
  }
});

// Search cards to add to trending
router.get("/trending-cards/search", async (req, res) => {
  try {
    const searchTerm = req.query.q || "";
    const limit = parseInt(req.query.limit) || 20;

    if (!searchTerm) {
      return res.json({ success: true, data: [] });
    }

    const cards = await query(
      `
      SELECT 
        p.product_id,
        p.name,
        p.image_url,
        p.local_image_url,
        p.market_price,
        p.ext_rarity,
        p.ext_number,
        g.name as set_name,
        g.clean_name as clean_set_name
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.category_id = 3
        AND (
          p.name LIKE ? OR
          p.clean_name LIKE ? OR
          g.name LIKE ? OR
          g.clean_name LIKE ? OR
          p.ext_number LIKE ?
        )
      ORDER BY p.market_price DESC, p.name ASC
      LIMIT ?
    `,
      [
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        limit,
      ]
    );

    res.json({ success: true, data: cards });
  } catch (error) {
    console.error("Error searching cards:", error);
    res.status(500).json({ error: "Failed to search cards" });
  }
});

// Get current algorithm-based trending cards (for auto-population)
// This returns trending cards from the algorithm, excluding manually featured ones
router.get("/trending-cards/auto", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // Get currently featured product IDs to exclude them
    await ensureTrendingCardsTable();
    let featuredIds = [];
    try {
      const featuredProductIds = await query(`
        SELECT product_id FROM featured_trending_cards
        WHERE featured_until IS NULL OR featured_until > datetime('now')
      `);
      featuredIds = featuredProductIds.map((row) => row.product_id);
    } catch (error) {
      // Table might not exist or have no featured cards yet
      console.log("No featured cards to exclude:", error.message);
      featuredIds = [];
    }
    const featuredPlaceholders =
      featuredIds.length > 0
        ? `AND p.product_id NOT IN (${featuredIds.map(() => "?").join(",")})`
        : "";

    // Get trending cards using the same algorithm as public endpoint
    // Import config to check for API key
    const { config } = await import("../config.js");

    // Try Pokemon Price Tracker API first
    let apiCards = [];
    if (config.pokemonPriceTrackerAPIKey) {
      try {
        const response = await fetch(
          `https://www.pokemonpricetracker.com/api/v2/trending?limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${config.pokemonPriceTrackerAPIKey}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const trendingData = await response.json();
          if (
            trendingData &&
            Array.isArray(trendingData) &&
            trendingData.length > 0
          ) {
            const productIds = trendingData
              .map((item) => {
                if (typeof item === "object" && item !== null) {
                  return (
                    item.product_id ||
                    item.id ||
                    item.productId ||
                    item.tcgplayer_id ||
                    null
                  );
                }
                return typeof item === "number" || typeof item === "string"
                  ? item
                  : null;
              })
              .filter(
                (id) =>
                  id !== null &&
                  id !== undefined &&
                  !featuredIds.includes(Number(id))
              );

            if (productIds.length > 0) {
              const placeholders = productIds.map(() => "?").join(",");
              const cards = await query(
                `
                SELECT 
                  p.*,
                  g.name as set_name,
                  g.clean_name as clean_set_name,
                  g.published_on as release_date
                FROM products p
                LEFT JOIN groups g ON p.group_id = g.group_id
                WHERE p.category_id = 3
                  AND p.product_id IN (${placeholders})
              `,
                productIds
              );

              if (cards.length > 0) {
                return res.json({ success: true, data: cards, source: "api" });
              }
            }
          }
        }
      } catch (error) {
        console.log("Price Tracker API error:", error.message);
      }
    }

    // Fallback to database algorithm (simplified version)
    let queryParams = [];
    let excludeClause = "";

    if (featuredIds.length > 0) {
      const placeholders = featuredIds.map(() => "?").join(",");
      excludeClause = `AND p.product_id NOT IN (${placeholders})`;
      queryParams = [...featuredIds];
    }

    queryParams.push(limit);

    // Build query string with proper concatenation
    const queryString =
      `
      SELECT 
        p.*,
        g.name as set_name,
        g.clean_name as clean_set_name,
        g.published_on as release_date,
        CASE 
          WHEN g.published_on IS NOT NULL AND g.published_on >= date('now', '-6 months') THEN 200
          WHEN g.name LIKE '%Phantasmal Flames%' OR g.name LIKE '%ME02%' THEN 265
          WHEN g.name LIKE '%Mega Evolution%' OR g.name LIKE '%MEG%' THEN 260
          WHEN g.group_id = 24448 THEN 265
          WHEN g.group_id >= 24000 THEN 200
          ELSE 50
        END as recency_score,
        CASE 
          WHEN datetime(p.updated_at) > datetime('now', '-7 days') THEN 30
          ELSE 0
        END as activity_score,
        CASE 
          WHEN p.market_price >= 50 THEN 30
          WHEN p.market_price >= 25 THEN 20
          WHEN p.market_price >= 10 THEN 15
          ELSE 5
        END as value_tier,
        0 as collection_count
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.category_id = 3
        AND (
          p.market_price >= 10
          OR (p.market_price >= 1 AND g.published_on >= date('now', '-6 months'))
        )
        AND p.market_price < 2000
        AND p.image_url IS NOT NULL
        AND p.ext_card_type IS NOT NULL
        AND p.ext_card_type != ''
        ` +
      excludeClause +
      `
      ORDER BY 
        (recency_score * 8.0 + 
         value_tier * 2.0 + 
         activity_score * 1.5) DESC,
        p.market_price DESC
      LIMIT ?
    `;

    const cards = await query(queryString, queryParams);

    res.json({ success: true, data: cards, source: "database" });
  } catch (error) {
    console.error("Error fetching auto trending cards:", error);
    res.status(500).json({ error: "Failed to fetch auto trending cards" });
  }
});

// ============================================================================
// MARKETPLACE CONFIGURATION ROUTES
// ============================================================================

// IMPORTANT: Product marketplace routes must come BEFORE /marketplace/:platform
// to avoid route conflicts

// Search products for marketplace ID management
router.get("/marketplace/products/search", requireAdmin, async (req, res) => {
  try {
    const searchTerm = req.query.q || "";
    const limit = parseInt(req.query.limit) || 20;

    if (!searchTerm) {
      return res.json({ success: true, data: [] });
    }

    const products = await query(
      `
      SELECT 
        p.product_id,
        p.name,
        p.image_url,
        p.local_image_url,
        p.ext_number,
        p.ext_rarity,
        p.tcgplayer_product_id,
        p.ebay_product_id,
        p.whatnot_product_id,
        p.drip_product_id,
        p.fanatics_product_id,
        g.name as set_name,
        g.clean_name as clean_set_name
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.category_id = 3
        AND (
          p.name LIKE ? OR
          p.clean_name LIKE ? OR
          g.name LIKE ? OR
          g.clean_name LIKE ? OR
          p.ext_number LIKE ?
        )
      ORDER BY p.name ASC
      LIMIT ?
    `,
      [
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        `%${searchTerm}%`,
        limit,
      ]
    );

    res.json({ success: true, data: products });
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Failed to search products" });
  }
});

// Get product marketplace links
router.get("/marketplace/products/:productId/links", requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;

    const links = await query(
      `
      SELECT 
        id,
        product_id,
        platform,
        url,
        created_at,
        updated_at
      FROM product_marketplace_links
      WHERE product_id = ?
      ORDER BY platform ASC
    `,
      [productId]
    );

    res.json({ success: true, data: links });
  } catch (error) {
    console.error("Error fetching product marketplace links:", error);
    res.status(500).json({ error: "Failed to fetch product marketplace links" });
  }
});

// Auto-find products on affiliate platforms
router.post("/marketplace/auto-find", requireAdmin, async (req, res) => {
  try {
    const { productId, platforms } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    // Get product info
    const product = await get(
      `
      SELECT 
        p.product_id,
        p.name,
        p.ext_number,
        g.name as set_name,
        g.clean_name as clean_set_name
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.product_id = ?
    `,
      [productId]
    );

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Import marketplace finder service
    const marketplaceFinder = (await import("../services/marketplaceProductFinder.js")).default;

    // Search platforms
    const searchPlatforms = platforms || ['eBay', 'TCGPlayer'];
    const cardName = product.name;
    const setName = product.set_name || product.clean_set_name;

    const results = await marketplaceFinder.searchAll(
      cardName,
      setName,
      searchPlatforms,
      { limit: 5 }
    );

    res.json({ success: true, data: results });
  } catch (error) {
    console.error("Error auto-finding products:", error);
    res.status(500).json({ error: error.message || "Failed to auto-find products" });
  }
});

// Parse and fetch product info from marketplace URL
router.post("/marketplace/parse-link", requireAdmin, async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    let platform = "TCGPlayer";
    let productId = null;
    let productName = null;
    let imageUrl = null;
    let price = null;
    let description = null;

    // Detect platform and extract info
    if (hostname.includes("tcgplayer.com")) {
      platform = "TCGPlayer";
      const productMatch = url.match(/\/product\/(\d+)/);
      if (productMatch) {
        productId = productMatch[1];
        const nameMatch = url.match(/\/product\/\d+\/([^/?]+)/);
        if (nameMatch) {
          productName = decodeURIComponent(nameMatch[1].replace(/-/g, " "));
        }
      }
    } else if (hostname.includes("ebay.com") || hostname.includes("ebay.ca")) {
      platform = "eBay";
      const itemMatch = url.match(/\/itm\/(\d+)/);
      if (itemMatch) {
        productId = itemMatch[1];
      }
    } else if (hostname.includes("whatnot.com")) {
      platform = "Whatnot";
    } else if (hostname.includes("drip.com")) {
      platform = "Drip";
    } else if (hostname.includes("fanatics.com") || hostname.includes("fanaticsollect.com")) {
      platform = "Fanatics";
    }

    // Try to fetch additional product info (images, prices, etc.)
    // Note: This is limited by CORS and API availability
    // For now, we'll return what we can parse from the URL
    // In the future, you could add server-side scraping or API integration

    res.json({
      success: true,
      data: {
        platform,
        productId,
        productName,
        imageUrl,
        price,
        description,
        url,
      },
    });
  } catch (error) {
    console.error("Error parsing marketplace link:", error);
    res.status(500).json({ error: "Failed to parse marketplace link" });
  }
});

// Add or update product marketplace link
router.post("/marketplace/products/:productId/links", requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { platform, url } = req.body;

    if (!platform || !url) {
      return res.status(400).json({ error: "Platform and URL are required" });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    // Insert or replace
    await run(
      `
      INSERT INTO product_marketplace_links (product_id, platform, url, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(product_id, platform) DO UPDATE SET
        url = excluded.url,
        updated_at = CURRENT_TIMESTAMP
    `,
      [productId, platform, url]
    );

    // Fetch updated links
    const links = await query(
      `SELECT * FROM product_marketplace_links WHERE product_id = ? ORDER BY platform ASC`,
      [productId]
    );

    res.json({ success: true, data: links });
  } catch (error) {
    console.error("Error saving product marketplace link:", error);
    res.status(500).json({ error: "Failed to save product marketplace link" });
  }
});

// Delete product marketplace link
router.delete("/marketplace/products/:productId/links/:linkId", requireAdmin, async (req, res) => {
  try {
    const { productId, linkId } = req.params;

    await run(
      `DELETE FROM product_marketplace_links WHERE id = ? AND product_id = ?`,
      [linkId, productId]
    );

    res.json({ success: true, message: "Link deleted" });
  } catch (error) {
    console.error("Error deleting product marketplace link:", error);
    res.status(500).json({ error: "Failed to delete product marketplace link" });
  }
});

// Get all marketplace configurations
router.get("/marketplace", requireAdmin, async (req, res) => {
  try {
    const configs = await query(
      "SELECT * FROM marketplace_config ORDER BY platform ASC"
    );
    res.json({ success: true, data: configs });
  } catch (error) {
    console.error("Error fetching marketplace configs:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch marketplace configurations" });
  }
});

// Get a single marketplace configuration
router.get("/marketplace/:platform", requireAdmin, async (req, res) => {
  try {
    const { platform } = req.params;
    const config = await get(
      "SELECT * FROM marketplace_config WHERE platform = ?",
      [platform]
    );

    if (!config) {
      return res
        .status(404)
        .json({ error: "Marketplace configuration not found" });
    }

    res.json({ success: true, data: config });
  } catch (error) {
    console.error("Error fetching marketplace config:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch marketplace configuration" });
  }
});

// Create or update marketplace configuration
router.put("/marketplace/:platform", requireAdmin, async (req, res) => {
  try {
    const { platform } = req.params;
    const {
      enabled,
      affiliate_link,
      affiliate_id,
      logo_path,
      display_name,
      commission_rate,
      notes,
    } = req.body;

    // Check if configuration exists
    const existing = await get(
      "SELECT id FROM marketplace_config WHERE platform = ?",
      [platform]
    );

    if (existing) {
      // Update existing configuration
      await run(
        `UPDATE marketplace_config 
         SET enabled = ?, 
             affiliate_link = ?, 
             affiliate_id = ?, 
             logo_path = ?, 
             display_name = ?, 
             commission_rate = ?, 
             notes = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE platform = ?`,
        [
          enabled !== undefined ? enabled : 1,
          affiliate_link || null,
          affiliate_id || null,
          logo_path || null,
          display_name || null,
          commission_rate || null,
          notes || null,
          platform,
        ]
      );
    } else {
      // Create new configuration
      await run(
        `INSERT INTO marketplace_config 
         (platform, enabled, affiliate_link, affiliate_id, logo_path, display_name, commission_rate, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          platform,
          enabled !== undefined ? enabled : 1,
          affiliate_link || null,
          affiliate_id || null,
          logo_path || null,
          display_name || null,
          commission_rate || null,
          notes || null,
        ]
      );
    }

    // Return updated configuration
    const updated = await get(
      "SELECT * FROM marketplace_config WHERE platform = ?",
      [platform]
    );

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Error updating marketplace config:", error);
    res
      .status(500)
      .json({ error: "Failed to update marketplace configuration" });
  }
});

// Delete marketplace configuration
router.delete("/marketplace/:platform", requireAdmin, async (req, res) => {
  try {
    const { platform } = req.params;

    await run("DELETE FROM marketplace_config WHERE platform = ?", [platform]);

    res.json({ success: true, message: "Marketplace configuration deleted" });
  } catch (error) {
    console.error("Error deleting marketplace config:", error);
    res
      .status(500)
      .json({ error: "Failed to delete marketplace configuration" });
  }
});

export default router;
