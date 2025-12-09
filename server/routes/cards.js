import express from "express";
import { query, get } from "../utils/database.js";
import { hammingDistance } from "../utils/imageHash.js";
import { config } from "../config.js";

// Helper to make Pokemon Price Tracker API requests
async function makePriceTrackerRequest(endpoint) {
  if (!config.pokemonPriceTrackerAPIKey) {
    return null;
  }

  try {
    // Use v2 API endpoint (www.pokemonpricetracker.com/api/v2)
    const response = await fetch(
      `https://www.pokemonpricetracker.com/api/v2${endpoint}`,
      {
        headers: {
          Authorization: `Bearer ${config.pokemonPriceTrackerAPIKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.log(
        `⚠️  Price Tracker API returned ${response.status} for ${endpoint}`
      );
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error("Price Tracker API error:", error.message);
    return null;
  }
}

const router = express.Router();

// Helper function to parse search query into components
function parseSearchQuery(query) {
  const trimmed = query.trim();
  const parts = {
    cardName: null,
    setName: null,
    cardNumber: null,
    artist: null,
    rawQuery: trimmed,
    queryParts: trimmed.split(/\s+/),
  };

  // Extract card number patterns: "25", "25/102", "025", "223/198", etc.
  const numberPattern = /(\d{1,4}\/?\d{0,4})/g;
  const numberMatches = [];
  let match;
  while ((match = numberPattern.exec(trimmed)) !== null) {
    numberMatches.push({
      number: match[1],
      index: match.index,
      length: match[0].length,
    });
  }

  if (numberMatches.length > 0) {
    // Use the last number match (most likely to be card number)
    const lastMatch = numberMatches[numberMatches.length - 1];
    parts.cardNumber = lastMatch.number;

    // Remove number from query to extract other parts
    const withoutNumber =
      trimmed.substring(0, lastMatch.index).trim() +
      " " +
      trimmed.substring(lastMatch.index + lastMatch.length).trim();
    parts.queryParts = withoutNumber.split(/\s+/).filter((p) => p.length > 0);
  }

  // If we have multiple parts after removing numbers, try to identify card name vs set name
  if (parts.queryParts.length > 1) {
    // Common set name patterns (words that often appear in set names)
    const setIndicators = [
      "set",
      "base",
      "collection",
      "promo",
      "ex",
      "v",
      "vmax",
      "gx",
      "ex",
      "flames",
      "tempest",
      "radiance",
      "origin",
      "stars",
      "zenith",
      "climax",
      "heroes",
      "battle",
      "legends",
      "treasures",
      "crown",
      "silver",
      "gold",
    ];

    // Try different splits: first word as card name, rest as set name
    // Also try: last 2-3 words as set name, rest as card name
    const firstWord = parts.queryParts[0];
    const restWords = parts.queryParts.slice(1).join(" ");
    const lastTwoWords = parts.queryParts.slice(-2).join(" ");
    const lastThreeWords = parts.queryParts.slice(-3).join(" ");

    // Check if rest words contain set indicators
    const restHasSetIndicator = setIndicators.some((ind) =>
      restWords.toLowerCase().includes(ind.toLowerCase())
    );
    const lastWordsHaveSetIndicator = setIndicators.some((ind) =>
      (lastTwoWords + " " + lastThreeWords)
        .toLowerCase()
        .includes(ind.toLowerCase())
    );

    if (restHasSetIndicator || parts.queryParts.length === 2) {
      // Likely: "CardName SetName"
      parts.cardName = firstWord;
      parts.setName = restWords;
    } else if (lastWordsHaveSetIndicator && parts.queryParts.length >= 3) {
      // Likely: "CardName ... SetName"
      const setNameStart = parts.queryParts.length - 2;
      parts.cardName = parts.queryParts.slice(0, setNameStart).join(" ");
      parts.setName = lastTwoWords;
    } else {
      // Try both combinations
      parts.cardName = firstWord;
      parts.setName = restWords;
    }
  } else if (parts.queryParts.length === 1) {
    // Single word - could be card name, set name, or artist
    parts.cardName = parts.queryParts[0];
  }

  return parts;
}

// Public search endpoint (for main app)
router.get("/search", async (req, res) => {
  try {
    const searchQuery = req.query.q || "";
    const limit = parseInt(req.query.limit) || 500;
    const hpFilter = req.query.hp ? parseInt(req.query.hp) : null;
    const damageFilter = req.query.damage ? parseInt(req.query.damage) : null;
    const energyTypeFilter = req.query.energyType || null;
    const cardNumberParam = req.query.number || null; // Support explicit number parameter

    if (!searchQuery && !cardNumberParam) {
      return res.json({ success: true, data: [] });
    }

    // Parse the search query into components
    const parsed = parseSearchQuery(searchQuery);

    // If card number is provided as a separate parameter, use it (takes priority)
    if (cardNumberParam) {
      parsed.cardNumber = cardNumberParam;
      console.log(`🔍 Card number from parameter: ${cardNumberParam}`);
    }

    // Build WHERE clause with multiple matching strategies
    let whereConditions = [];
    let params = [];
    let paramIndex = 0;

    // Helper to add a param and return placeholder
    const addParam = (value) => {
      params.push(value);
      return `?`;
    };

    // Separate filter conditions (HP, damage) - these will be ANDed with search conditions
    const filterConditions = [];

    // Add HP filter if provided
    if (hpFilter) {
      filterConditions.push(
        `CAST(p.ext_hp AS INTEGER) = ${addParam(hpFilter)}`
      );
      console.log(`🔍 Filtering by HP: ${hpFilter}`);
    }

    // Add attack damage filter if provided
    // Damage can be in ext_attack1 or ext_attack2 fields
    if (damageFilter) {
      filterConditions.push(`(
        (p.ext_attack1 LIKE ${addParam(
          `%(${damageFilter})%`
        )} OR p.ext_attack1 LIKE ${addParam(`% ${damageFilter}%`)})
        OR
        (p.ext_attack2 LIKE ${addParam(
          `%(${damageFilter})%`
        )} OR p.ext_attack2 LIKE ${addParam(`% ${damageFilter}%`)})
      )`);
      console.log(`🔍 Filtering by damage: ${damageFilter}`);
    }

    // Add energy type filter if provided
    // Match against ext_card_type field
    if (energyTypeFilter) {
      filterConditions.push(
        `p.ext_card_type LIKE ${addParam(`%${energyTypeFilter}%`)}`
      );
      console.log(`🔍 Filtering by energy type: ${energyTypeFilter}`);
    }

    // Strategy 1: Exact matches (highest priority)
    if (parsed.cardName && parsed.cardNumber && parsed.setName) {
      // All three: Card Name + Set Name + Number
      whereConditions.push(`(
        (p.name LIKE ${addParam(
          `%${parsed.cardName}%`
        )} OR p.clean_name LIKE ${addParam(`%${parsed.cardName}%`)})
        AND (g.name LIKE ${addParam(
          `%${parsed.setName}%`
        )} OR g.clean_name LIKE ${addParam(`%${parsed.setName}%`)})
        AND (p.ext_number LIKE ${addParam(
          `%${parsed.cardNumber}%`
        )} OR p.ext_number = ${addParam(parsed.cardNumber)})
      )`);
    }

    if (parsed.cardName && parsed.cardNumber) {
      // Card Name + Number (handle different number formats: "096/165", "96/165", "096", "96")
      const cardNumParts = parsed.cardNumber.split("/");
      const cardNumOnly = cardNumParts[0].replace(/^0+/, "") || cardNumParts[0]; // Remove leading zeros: "096" -> "96"
      const cardNumWithZeros = cardNumParts[0].padStart(3, "0"); // Add leading zeros: "96" -> "096"
      const fullNumber = parsed.cardNumber; // "096/165"
      const numberWithoutLeadingZeros =
        cardNumOnly + (cardNumParts[1] ? "/" + cardNumParts[1] : ""); // "96/165"

      whereConditions.push(`(
        (p.name LIKE ${addParam(
          `%${parsed.cardName}%`
        )} OR p.clean_name LIKE ${addParam(`%${parsed.cardName}%`)})
        AND (
          p.ext_number = ${addParam(fullNumber)} OR
          p.ext_number = ${addParam(numberWithoutLeadingZeros)} OR
          p.ext_number = ${addParam(cardNumOnly)} OR
          p.ext_number = ${addParam(cardNumWithZeros)} OR
          p.ext_number LIKE ${addParam(`%${cardNumOnly}%`)} OR
          p.ext_number LIKE ${addParam(`%${cardNumWithZeros}%`)} OR
          p.ext_number LIKE ${addParam(`%${fullNumber}%`)}
        )
      )`);
      console.log(
        `🔍 Searching for: name="${parsed.cardName}", number="${parsed.cardNumber}" (also trying "${cardNumOnly}", "${cardNumWithZeros}", "${numberWithoutLeadingZeros}")`
      );
    }

    // If ONLY card number is provided (no name), search by number alone
    if (!parsed.cardName && parsed.cardNumber) {
      const cardNumParts = parsed.cardNumber.split("/");
      const cardNumOnly = cardNumParts[0].replace(/^0+/, "") || cardNumParts[0];
      const cardNumWithZeros = cardNumParts[0].padStart(3, "0");
      const fullNumber = parsed.cardNumber;
      const numberWithoutLeadingZeros =
        cardNumOnly + (cardNumParts[1] ? "/" + cardNumParts[1] : "");

      whereConditions.push(`(
        p.ext_number = ${addParam(fullNumber)} OR
        p.ext_number = ${addParam(numberWithoutLeadingZeros)} OR
        p.ext_number = ${addParam(cardNumOnly)} OR
        p.ext_number = ${addParam(cardNumWithZeros)} OR
        p.ext_number LIKE ${addParam(`%${cardNumOnly}%`)} OR
        p.ext_number LIKE ${addParam(`%${cardNumWithZeros}%`)} OR
        p.ext_number LIKE ${addParam(`%${fullNumber}%`)}
      )`);
      console.log(`🔍 Searching by card number only: "${parsed.cardNumber}"`);
    }

    if (parsed.cardName && parsed.setName) {
      // Card Name + Set Name
      whereConditions.push(`(
        (p.name LIKE ${addParam(
          `%${parsed.cardName}%`
        )} OR p.clean_name LIKE ${addParam(`%${parsed.cardName}%`)})
        AND (g.name LIKE ${addParam(
          `%${parsed.setName}%`
        )} OR g.clean_name LIKE ${addParam(`%${parsed.setName}%`)})
      )`);
    }

    // Strategy 2: Individual field matches
    if (parsed.cardName) {
      whereConditions.push(`(
        p.name LIKE ${addParam(`%${parsed.cardName}%`)} OR 
        p.clean_name LIKE ${addParam(`%${parsed.cardName}%`)}
      )`);
    }

    if (parsed.setName) {
      whereConditions.push(`(
        g.name LIKE ${addParam(`%${parsed.setName}%`)} OR 
        g.clean_name LIKE ${addParam(`%${parsed.setName}%`)}
      )`);
    }

    if (parsed.cardNumber) {
      whereConditions.push(
        `p.ext_number LIKE ${addParam(`%${parsed.cardNumber}%`)}`
      );
    }

    // Strategy 3: Fallback - search entire query across all fields
    whereConditions.push(`(
      p.name LIKE ${addParam(`%${parsed.rawQuery}%`)} OR
      p.clean_name LIKE ${addParam(`%${parsed.rawQuery}%`)} OR
      p.artist LIKE ${addParam(`%${parsed.rawQuery}%`)} OR
      g.name LIKE ${addParam(`%${parsed.rawQuery}%`)} OR
      g.clean_name LIKE ${addParam(`%${parsed.rawQuery}%`)} OR
      p.ext_number LIKE ${addParam(`%${parsed.rawQuery}%`)} OR
      p.ext_card_type LIKE ${addParam(`%${parsed.rawQuery}%`)} OR
      p.ext_rarity LIKE ${addParam(`%${parsed.rawQuery}%`)}
    )`);

    // Build final WHERE clause
    // Search conditions are ORed together, filters are ANDed with search conditions
    let whereClause = "";
    if (filterConditions.length > 0 && whereConditions.length > 0) {
      // Combine: (search conditions OR ...) AND (filter conditions AND ...)
      whereClause = `WHERE (${whereConditions.join(
        " OR "
      )}) AND (${filterConditions.join(" AND ")})`;
    } else if (whereConditions.length > 0) {
      // Only search conditions
      whereClause = `WHERE ${whereConditions.join(" OR ")}`;
    } else if (filterConditions.length > 0) {
      // Only filter conditions (unlikely but handle it)
      whereClause = `WHERE ${filterConditions.join(" AND ")}`;
    }

    // Build ORDER BY clause for relevance scoring
    let orderConditions = [];
    let orderParams = [];

    if (parsed.cardName && parsed.cardNumber && parsed.setName) {
      // Perfect match: name + set + number
      orderConditions.push(`WHEN (
        (p.name LIKE ? OR p.clean_name LIKE ?)
        AND (g.name LIKE ? OR g.clean_name LIKE ?)
        AND (p.ext_number = ? OR p.ext_number LIKE ?)
      ) THEN 1`);
      orderParams.push(
        `%${parsed.cardName}%`,
        `%${parsed.cardName}%`,
        `%${parsed.setName}%`,
        `%${parsed.setName}%`,
        parsed.cardNumber,
        `%${parsed.cardNumber}%`
      );
    }

    if (parsed.cardName && parsed.cardNumber) {
      // Good match: name + number (prioritize exact number matches)
      const cardNumParts = parsed.cardNumber.split("/");
      const cardNumOnly = cardNumParts[0].replace(/^0+/, "") || cardNumParts[0];
      const cardNumWithZeros = cardNumParts[0].padStart(3, "0");
      const fullNumber = parsed.cardNumber;
      const numberWithoutLeadingZeros =
        cardNumOnly + (cardNumParts[1] ? "/" + cardNumParts[1] : "");

      // Exact number matches (highest priority)
      orderConditions.push(`WHEN (
        (p.name LIKE ? OR p.clean_name LIKE ?)
        AND (p.ext_number = ? OR p.ext_number = ? OR p.ext_number = ? OR p.ext_number = ?)
      ) THEN 2`);
      orderParams.push(
        `%${parsed.cardName}%`,
        `%${parsed.cardName}%`,
        fullNumber,
        numberWithoutLeadingZeros,
        cardNumOnly,
        cardNumWithZeros
      );

      // Partial number matches (lower priority)
      orderConditions.push(`WHEN (
        (p.name LIKE ? OR p.clean_name LIKE ?)
        AND (p.ext_number LIKE ? OR p.ext_number LIKE ? OR p.ext_number LIKE ?)
      ) THEN 3`);
      orderParams.push(
        `%${parsed.cardName}%`,
        `%${parsed.cardName}%`,
        `%${cardNumOnly}%`,
        `%${cardNumWithZeros}%`,
        `%${fullNumber}%`
      );
    }

    if (parsed.cardName && parsed.setName) {
      // Good match: name + set
      orderConditions.push(`WHEN (
        (p.name LIKE ? OR p.clean_name LIKE ?)
        AND (g.name LIKE ? OR g.clean_name LIKE ?)
      ) THEN 3`);
      orderParams.push(
        `%${parsed.cardName}%`,
        `%${parsed.cardName}%`,
        `%${parsed.setName}%`,
        `%${parsed.setName}%`
      );
    }

    if (parsed.cardName) {
      // Name starts with query
      orderConditions.push(`WHEN p.name LIKE ? THEN 4`);
      orderConditions.push(`WHEN p.clean_name LIKE ? THEN 5`);
      orderParams.push(`${parsed.cardName}%`, `${parsed.cardName}%`);
    }

    if (parsed.cardNumber) {
      // Exact number match (highest priority for number-only searches)
      const cardNumParts = parsed.cardNumber.split("/");
      const cardNumOnly = cardNumParts[0].replace(/^0+/, "") || cardNumParts[0];
      const cardNumWithZeros = cardNumParts[0].padStart(3, "0");
      const fullNumber = parsed.cardNumber;
      const numberWithoutLeadingZeros =
        cardNumOnly + (cardNumParts[1] ? "/" + cardNumParts[1] : "");

      // Exact matches (highest priority)
      orderConditions.push(
        `WHEN p.ext_number = ? OR p.ext_number = ? OR p.ext_number = ? OR p.ext_number = ? THEN 5`
      );
      orderParams.push(
        fullNumber,
        numberWithoutLeadingZeros,
        cardNumOnly,
        cardNumWithZeros
      );

      // Partial matches (lower priority)
      orderConditions.push(
        `WHEN p.ext_number LIKE ? OR p.ext_number LIKE ? OR p.ext_number LIKE ? THEN 6`
      );
      orderParams.push(
        `%${cardNumOnly}%`,
        `%${cardNumWithZeros}%`,
        `%${fullNumber}%`
      );
    }

    const orderClause =
      orderConditions.length > 0
        ? `ORDER BY CASE ${orderConditions.join(
            " "
          )} ELSE 7 END, p.name ASC, p.ext_number ASC`
        : `ORDER BY 
          CASE 
            WHEN p.name LIKE ? THEN 1
            WHEN p.clean_name LIKE ? THEN 2
            ELSE 3
          END,
          p.name ASC`;

    if (orderConditions.length === 0) {
      orderParams.push(`${parsed.rawQuery}%`, `${parsed.rawQuery}%`);
    }

    // Combine all params for the query
    const allParams = [...params, ...orderParams, limit];

    // Build the final query
    let finalQuery = `
      SELECT 
        p.*,
        g.name as set_name,
        g.clean_name as clean_set_name,
        g.language as language
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE p.category_id = 3
    `;

    // Add search and filter conditions
    if (whereClause.includes("WHERE")) {
      // Replace WHERE with AND if we already have WHERE
      finalQuery += ` AND (${whereClause.replace("WHERE ", "")})`;
    } else {
      finalQuery += ` AND ${whereClause}`;
    }

    finalQuery += ` ${orderClause} LIMIT ?`;

    console.log("🔍 Final query:", finalQuery.substring(0, 200) + "...");
    console.log("🔍 Query params:", allParams.slice(0, 10));

    const cards = await query(finalQuery, allParams);

    // Helper function to parse JSON fields
    const parseJSON = (field) => {
      if (!field) return null;
      if (typeof field === "object") return field;
      try {
        return JSON.parse(field);
      } catch (e) {
        return field;
      }
    };

    // Format card data for frontend
    const formattedCards = cards.map((card) => {
      // Parse weaknesses
      let weaknesses = [];
      if (card.ext_weakness) {
        const parsed = parseJSON(card.ext_weakness);
        if (Array.isArray(parsed)) {
          weaknesses = parsed;
        } else if (typeof parsed === "object" && parsed.type) {
          weaknesses = [parsed];
        } else if (typeof parsed === "string" && parsed.trim()) {
          const weaknessStr = parsed.trim();
          const match = weaknessStr.match(/^(.+?)(?:[\s×x]*(?:\d+))?$/i);
          if (match) {
            const type = match[1].trim();
            const valueMatch = weaknessStr.match(/[\s×x]*(\d+)/i);
            const value = valueMatch ? `×${valueMatch[1]}` : "×2";
            weaknesses = [{ type, value }];
          }
        }
      }

      // Parse resistances
      let resistances = [];
      if (card.ext_resistance) {
        const parsed = parseJSON(card.ext_resistance);
        if (Array.isArray(parsed)) {
          resistances = parsed;
        } else if (typeof parsed === "object" && parsed.type) {
          resistances = [parsed];
        } else if (typeof parsed === "string" && parsed.trim()) {
          const resistanceStr = parsed.trim();
          if (resistanceStr && resistanceStr.toLowerCase() !== "none") {
            resistances = [{ type: resistanceStr, value: "-20" }];
          }
        }
      }

      // Parse retreat cost
      let retreat_cost = [];
      if (card.ext_retreat_cost) {
        const parsed = parseJSON(card.ext_retreat_cost);
        if (Array.isArray(parsed)) {
          retreat_cost = parsed;
        } else {
          const num =
            typeof parsed === "number"
              ? parsed
              : parseInt(card.ext_retreat_cost);
          if (!isNaN(num) && num > 0) {
            retreat_cost = Array(num).fill("Colorless");
          } else if (
            typeof card.ext_retreat_cost === "string" &&
            card.ext_retreat_cost.trim()
          ) {
            retreat_cost = [card.ext_retreat_cost.trim()];
          }
        }
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
            Fire: "Fire",
            Water: "Water",
            Lightning: "Lightning",
            Psychic: "Psychic",
            Fighting: "Fighting",
            Darkness: "Darkness",
            Metal: "Metal",
            Colorless: "Colorless",
            Fairy: "Fairy",
            Dragon: "Dragon",
            // Short forms
            G: "Grass",
            R: "Fire",
            W: "Water",
            L: "Lightning",
            P: "Psychic",
            F: "Fighting",
            D: "Darkness",
            M: "Metal",
            C: "Colorless",
            Y: "Fairy",
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

      const attacks = [];
      if (card.ext_attack1) {
        const attack = parseAttack(card.ext_attack1);
        if (attack) attacks.push(attack);
      }
      if (card.ext_attack2) {
        const attack = parseAttack(card.ext_attack2);
        if (attack) attacks.push(attack);
      }

      // Parse abilities from ext_card_text
      const abilities = [];
      if (card.ext_card_text) {
        const raw = String(card.ext_card_text)
          .replace(/<br\s*\/?>(\r?\n)?/gi, "\n")
          .replace(/&mdash;|&ndash;|—|–/g, " — ");
        const stripHtml = (s) => s.replace(/<[^>]*>/g, "").trim();
        const found = [];

        const reStrongAbility =
          /<strong>\s*Ability\s*:?\s*([^<]*)<\/strong>\s*([^<\n]*)/gi;
        let m;
        while ((m = reStrongAbility.exec(raw)) !== null) {
          const name =
            stripHtml(m[1] || "").replace(/^[:\-–—]\s*/, "") || "Ability";
          const text = stripHtml(m[2] || "");
          found.push({ type: "Ability", name, text });
        }

        const reInlineAbility =
          /\bAbility\s*(?:—|–|—|:|-)\s*([^\n<]+)\s*[\n ]*(.*)/gi;
        if (found.length === 0) {
          const mm = reInlineAbility.exec(stripHtml(raw));
          if (mm) {
            found.push({
              type: "Ability",
              name: (mm[1] || "").trim(),
              text: (mm[2] || "").trim(),
            });
          }
        }

        const rePower =
          /<strong>\s*(Pokémon Power|Pokemon Power|Poké-POWER|Poke-POWER|Poké-BODY|Poke-BODY)\s*:?\s*([^<]*)<\/strong>\s*([^<\n]*)/gi;
        while ((m = rePower.exec(raw)) !== null) {
          const type = stripHtml(m[1] || "Pokémon Power");
          const name = stripHtml(m[2] || "").replace(/^[:\-–—]\s*/, "") || type;
          const text = stripHtml(m[3] || "");
          found.push({ type, name, text });
        }

        const rePlain =
          /(Pokémon Power|Pokemon Power|Poké-POWER|Poke-POWER|Poké-BODY|Poke-BODY)\s*(?:—|–|:|-)\s*([^\n:]+)[:\s-]*([^\n]*)/i;
        if (found.length === 0) {
          const plain = stripHtml(raw);
          const mm2 = rePlain.exec(plain);
          if (mm2) {
            found.push({
              type: mm2[1],
              name: (mm2[2] || "").trim(),
              text: (mm2[3] || "").trim(),
            });
          }
        }

        for (const a of found) {
          if (a.name || a.text) abilities.push(a);
        }
      }

      // Derive stage
      let stage = null;
      if (card.ext_stage) {
        const extStageValue = String(card.ext_stage).trim();
        const extStageLower = extStageValue.toLowerCase();
        if (
          extStageLower.includes("stage 2") ||
          extStageLower.includes("stage2")
        ) {
          stage = "Stage 2";
        } else if (
          extStageLower.includes("stage 1") ||
          extStageLower.includes("stage1")
        ) {
          stage = "Stage 1";
        } else if (extStageLower === "basic" || extStageValue === "Basic") {
          stage = "Basic";
        } else {
          stage = extStageValue;
        }
      }

      return {
        ...card,
        hp: card.ext_hp || card.hp || null,
        stage: stage,
        type: card.ext_card_type || null,
        types: card.ext_card_type ? [card.ext_card_type] : [],
        weaknesses: weaknesses,
        resistances: resistances,
        retreat_cost: retreat_cost,
        attacks: attacks,
        abilities: abilities,
        current_value:
          card.market_price || card.mid_price || card.low_price || 0,
        price: card.market_price || card.mid_price || card.low_price || 0,
        product_id: card.product_id,
        cardId: card.product_id.toString(),
        rarity: card.ext_rarity,
        artist: card.artist || null,
        images: (() => {
          const imageUrl = card.local_image_url || card.image_url;
          const isLocal = !!card.local_image_url;
          return imageUrl
            ? {
                small: imageUrl,
                large: imageUrl,
                local: isLocal,
              }
            : null;
        })(),
        formattedNumber: card.ext_number || "N/A",
        // External marketplace product IDs for direct linking
        marketplaceIds: {
          tcgplayer: card.tcgplayer_product_id || null,
          ebay: card.ebay_product_id || null,
          whatnot: card.whatnot_product_id || null,
          drip: card.drip_product_id || null,
          fanatics: card.fanatics_product_id || null,
        },
      };
    });

    res.json({ success: true, data: formattedCards });
  } catch (error) {
    console.error("Error searching cards:", error);
    res.status(500).json({ error: "Search failed" });
  }
});

// Get card stats (for main app dashboard)
router.get("/stats", async (req, res) => {
  try {
    const stats = await get(`
      SELECT 
        COUNT(*) as total_cards,
        COUNT(CASE WHEN 1 THEN 1 END) as cards_with_price,
        0 as avg_price,
        0 as max_price
      FROM products
    `);

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("Error fetching card stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Get sets (for main app)
router.get("/sets", async (req, res) => {
  try {
    const sets = await query(`
      SELECT 
        g.*,
        COUNT(p.product_id) as card_count,
        COUNT(p.product_id) as cards_with_pricing
      FROM groups g
      LEFT JOIN products p ON g.group_id = p.group_id
      GROUP BY g.group_id
      ORDER BY g.published_on DESC
    `);

    res.json({ success: true, data: sets });
  } catch (error) {
    console.error("Error fetching sets:", error);
    res.status(500).json({ error: "Failed to fetch sets" });
  }
});

// Get trending cards (for main app dashboard)
// Prioritizes manually featured cards, then uses Pokemon Price Tracker API, falls back to database query
router.get("/trending", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    // First, check for manually featured trending cards
    try {
      const featuredCards = await query(
        `
        SELECT 
          ftc.position,
          p.*,
          g.name as set_name,
          g.clean_name as clean_set_name,
          g.published_on as release_date
        FROM featured_trending_cards ftc
        LEFT JOIN products p ON ftc.product_id = p.product_id
        LEFT JOIN groups g ON p.group_id = g.group_id
        WHERE ftc.featured_until IS NULL OR ftc.featured_until > datetime('now')
        ORDER BY ftc.position ASC
        LIMIT ?
      `,
        [limit]
      );

      if (featuredCards && featuredCards.length > 0) {
        const formattedFeaturedCards = featuredCards
          .filter((card) => card.product_id) // Ensure card exists
          .map((card) => formatCardForFrontend(card, req));

        if (formattedFeaturedCards.length > 0) {
          console.log(
            `✅ Using ${formattedFeaturedCards.length} manually featured trending cards`
          );
          return res.json({
            success: true,
            data: formattedFeaturedCards,
            source: "featured",
            featured_count: formattedFeaturedCards.length,
          });
        }
      }
    } catch (error) {
      // Table might not exist yet, continue with normal flow
      console.log(
        "⚠️  Featured trending cards table not available, continuing with normal flow"
      );
    }

    // Try to get trending cards from Pokemon Price Tracker API
    const trendingData = await makePriceTrackerRequest(
      `/trending?limit=${limit}`
    );

    if (
      trendingData &&
      Array.isArray(trendingData) &&
      trendingData.length > 0
    ) {
      // Extract product IDs from API response
      // API might return objects with product_id, id, productId, or just IDs
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
        .filter((id) => id !== null && id !== undefined);

      if (productIds.length > 0) {
        // Fetch full card data from database
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

        // Format and return cards in API order (preserve trending order)
        const cardMap = new Map(cards.map((c) => [c.product_id, c]));
        const formattedCards = productIds
          .map((id) => cardMap.get(Number(id)) || cardMap.get(String(id)))
          .filter((card) => card) // Remove any not found in database
          .map((card) => formatCardForFrontend(card, req));

        if (formattedCards.length > 0) {
          console.log(
            `✅ Using trending cards from Pokemon Price Tracker API (${formattedCards.length} cards)`
          );
          return res.json({
            success: true,
            data: formattedCards,
            source: "api",
          });
        }
      }
    }

    // If API didn't return usable data, log and fall through to database query
    if (config.pokemonPriceTrackerAPIKey) {
      console.log(
        "⚠️  Pokemon Price Tracker API returned no usable data, using database fallback"
      );
    }

    // Get ACTUAL trending cards - prioritizing MOST RECENT sets and market activity
    // Similar to Collectr: focus on cards from recent releases (last 6-12 months)
    // 1. Cards from the absolute most recent sets (2024-2025, especially late 2024/2025)
    // 2. Cards updated recently (market activity = trending)
    // 3. High-value cards from recent sets
    // 4. High rarity cards from recent sets
    const cards = await query(
      `
      SELECT 
        p.*,
        g.name as set_name,
        g.clean_name as clean_set_name,
        g.published_on as release_date,
        -- Set recency score based on release date (MOST RECENT sets get highest priority)
        -- Use published_on date when available, fallback to set name patterns, then group_id
        CASE 
          -- Cards from sets released in last 3 months or upcoming within 3 months - MAXIMUM priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= date('now', '-3 months') THEN 200
          -- Cards from sets releasing soon (future dates within 3 months) - MAXIMUM priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= date('now') AND g.published_on <= date('now', '+3 months') THEN 265
          -- Cards from sets released in last 6 months - VERY HIGH priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= date('now', '-6 months') THEN 180
          -- Cards from sets released in last 12 months - HIGH priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= date('now', '-12 months') THEN 150
          -- Cards from sets released in 2024 - HIGH priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= '2024-01-01' AND g.published_on < '2025-01-01' THEN 120
          -- Cards from sets released in 2023 - MODERATE priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= '2023-01-01' AND g.published_on < '2024-01-01' THEN 80
          -- Cards from sets released in 2022 - LOWER priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= '2022-01-01' AND g.published_on < '2023-01-01' THEN 60
          -- Cards from sets released in 2021 - EVEN LOWER priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= '2021-01-01' AND g.published_on < '2022-01-01' THEN 40
          -- Cards from sets released in 2020 - LOW priority
          WHEN g.published_on IS NOT NULL AND g.published_on >= '2020-01-01' AND g.published_on < '2021-01-01' THEN 20
          -- Fallback: Use set name patterns for sets without published_on dates
          -- Check MOST SPECIFIC patterns FIRST (order matters!)
          -- Based on actual release dates from Pokemon TCG (as of 2025)
          -- ABSOLUTE MOST RECENT sets (2025) - MAXIMUM priority
          -- Phantasmal Flames (ME02) - 2025-11-14 - NEWEST SET
          WHEN g.name LIKE '%Phantasmal Flames%' OR g.name LIKE '%ME02%' OR g.name LIKE '%me02%' THEN 265
          -- Mega Evolution (me1) - 2025-09-26 - VERY RECENT SET
          WHEN g.name LIKE '%Mega Evolution%' OR g.name LIKE '%MEG%' OR g.name LIKE '%me1%' OR g.name LIKE '%ME1%' THEN 260
          -- Black Bolt (zsv10pt5) - 2025-07-18
          WHEN g.name LIKE '%Black Bolt%' OR g.name LIKE '%BLK%' OR g.name LIKE '%zsv10pt5%' OR g.name LIKE '%ZSV10PT5%' THEN 255
          -- White Flare (rsv10pt5) - 2025-07-18
          WHEN g.name LIKE '%White Flare%' OR g.name LIKE '%WHT%' OR g.name LIKE '%rsv10pt5%' OR g.name LIKE '%RSV10PT5%' THEN 255
          -- Destined Rivals (sv10) - 2025-05-30
          WHEN g.name LIKE '%Destined Rivals%' OR g.name LIKE '%DRI%' OR g.name LIKE '%sv10%' OR g.name LIKE '%SV10%' THEN 250
          -- Journey Together (sv9) - 2025-03-28
          WHEN g.name LIKE '%Journey Together%' OR g.name LIKE '%JTG%' OR g.name LIKE '%sv9%' OR g.name LIKE '%SV9%' THEN 245
          -- Prismatic Evolutions (sv8pt5) - 2025-01-17
          WHEN g.name LIKE '%Prismatic Evolutions%' OR g.name LIKE '%PRE%' OR g.name LIKE '%sv8pt5%' OR g.name LIKE '%SV8PT5%' OR g.name LIKE '%sv8.5%' OR g.name LIKE '%SV8.5%' THEN 240
          -- Surging Sparks (sv8) - 2024-11-08
          WHEN g.name LIKE '%Surging Sparks%' OR g.name LIKE '%SSP%' OR g.name LIKE '%sv8%' OR g.name LIKE '%SV8%' THEN 235
          -- Stellar Crown (sv7) - 2024-09-13
          WHEN g.name LIKE '%Stellar Crown%' OR g.name LIKE '%SCR%' OR g.name LIKE '%sv7%' OR g.name LIKE '%SV7%' THEN 230
          -- Shrouded Fable (sv6pt5) - 2024-08-02
          WHEN g.name LIKE '%Shrouded Fable%' OR g.name LIKE '%SFA%' OR g.name LIKE '%sv6pt5%' OR g.name LIKE '%SV6PT5%' OR g.name LIKE '%sv6.5%' OR g.name LIKE '%SV6.5%' THEN 225
          -- Twilight Masquerade (sv6) - 2024-05-24
          WHEN g.name LIKE '%Twilight Masquerade%' OR g.name LIKE '%TWM%' OR g.name LIKE '%sv6%' OR g.name LIKE '%SV6%' THEN 220
          -- Temporal Forces (sv5) - 2024-03-22
          WHEN g.name LIKE '%Temporal Forces%' OR g.name LIKE '%TEF%' OR g.name LIKE '%sv5%' OR g.name LIKE '%SV5%' THEN 215
          -- Paldean Fates (sv4pt5) - 2024-01-26
          WHEN g.name LIKE '%Paldean Fates%' OR g.name LIKE '%PAF%' OR g.name LIKE '%sv4pt5%' OR g.name LIKE '%SV4PT5%' OR g.name LIKE '%sv4.5%' OR g.name LIKE '%SV4.5%' THEN 210
          -- Paradox Rift (sv4) - 2023-11-03
          WHEN g.name LIKE '%Paradox Rift%' OR g.name LIKE '%PAR%' OR g.name LIKE '%sv4%' OR g.name LIKE '%SV4%' THEN 205
          -- 151 (sv3pt5) - 2023-09-22 - Popular but older
          WHEN g.name LIKE '%151%' OR g.name LIKE '%MEW%' OR g.name LIKE '%sv3pt5%' OR g.name LIKE '%SV3PT5%' OR g.name LIKE '%sv3.5%' OR g.name LIKE '%SV3.5%' THEN 200
          -- Obsidian Flames (sv3) - 2023-08-11
          WHEN g.name LIKE '%Obsidian Flames%' OR g.name LIKE '%OBF%' OR g.name LIKE '%sv3%' OR g.name LIKE '%SV3%' THEN 195
          -- Paldea Evolved (sv2) - 2023-06-09
          WHEN g.name LIKE '%Paldea Evolved%' OR g.name LIKE '%PAL%' OR g.name LIKE '%sv2%' OR g.name LIKE '%SV2%' THEN 190
          -- Base Scarlet & Violet (sv1) - 2023-03-31
          WHEN g.name LIKE '%Scarlet & Violet%' OR g.name LIKE '%Scarlet and Violet%' OR g.name LIKE '%sv1%' OR g.name LIKE '%SV1%' OR (g.name LIKE 'SV:%' AND g.name NOT LIKE '%151%' AND g.name NOT LIKE '%Paldea%' AND g.name NOT LIKE '%Obsidian%' AND g.name NOT LIKE '%Paradox%' AND g.name NOT LIKE '%Paldean%' AND g.name NOT LIKE '%Temporal%' AND g.name NOT LIKE '%Twilight%' AND g.name NOT LIKE '%Shrouded%' AND g.name NOT LIKE '%Stellar%' AND g.name NOT LIKE '%Surging%' AND g.name NOT LIKE '%Prismatic%' AND g.name NOT LIKE '%Journey%' AND g.name NOT LIKE '%Destined%' AND g.name NOT LIKE '%Black%' AND g.name NOT LIKE '%White%' AND g.name NOT LIKE '%Mega%') THEN 185
          -- Very recent sets (late 2023 - early 2024)
          WHEN g.name LIKE '%Silver Tempest%' THEN 150
          -- Scarlet & Violet era (2023-2024) - but exclude already handled sets
          WHEN (g.name LIKE '%Crown Zenith%' OR g.name LIKE '%Scarlet & Violet%' OR g.name LIKE '%Scarlet and Violet%') AND g.name NOT LIKE '%151%' AND g.name NOT LIKE '%Paldea%' AND g.name NOT LIKE '%Obsidian%' AND g.name NOT LIKE '%Paradox%' THEN 140
          -- Recent Sword & Shield (2022-2023)
          WHEN g.name LIKE '%Brilliant Stars%' OR g.name LIKE '%Astral Radiance%' OR g.name LIKE '%Lost Origin%' OR g.name LIKE '%Fusion Strike%' OR g.name LIKE '%Evolving Skies%' OR g.name LIKE '%Chilling Reign%' THEN 80
          WHEN g.name LIKE '%Battle Styles%' OR g.name LIKE '%Vivid Voltage%' OR g.name LIKE '%Darkness Ablaze%' OR g.name LIKE '%Rebel Clash%' OR g.name LIKE '%Sword & Shield%' OR g.name LIKE '%Sword and Shield%' OR g.name LIKE 'SWSH%' THEN 60
          -- Late Sun & Moon / Early Sword & Shield (2020-2021)
          WHEN g.name LIKE '%Hidden Fates%' OR g.name LIKE '%Unified Minds%' OR g.name LIKE '%Cosmic Eclipse%' THEN 40
          -- Fallback: Use group_id to infer recency (higher group_ids are usually newer sets)
          -- Group IDs above 24000 are typically the newest sets (2024-2025)
          -- Check highest ranges first, then work down (CASE stops at first match)
          WHEN g.group_id >= 24500 THEN 260  -- Mega Evolution and newest sets (24500+)
          WHEN g.group_id = 24448 THEN 265   -- Phantasmal Flames (ME02) - newest set (exact match)
          WHEN g.group_id >= 24450 THEN 255  -- Black Bolt, White Flare (24450-24499)
          WHEN g.group_id >= 24400 THEN 250  -- Destined Rivals, Journey Together (24400-24447, 24449)
          WHEN g.group_id >= 24350 THEN 240  -- Prismatic Evolutions, Surging Sparks
          WHEN g.group_id >= 24300 THEN 230  -- Stellar Crown
          WHEN g.group_id >= 24250 THEN 225  -- Shrouded Fable
          WHEN g.group_id >= 24200 THEN 220  -- Twilight Masquerade
          WHEN g.group_id >= 24150 THEN 215  -- Temporal Forces
          WHEN g.group_id >= 24100 THEN 210  -- Paldean Fates
          WHEN g.group_id >= 24000 THEN 205  -- Paradox Rift
          WHEN g.group_id >= 23500 THEN 200  -- 151 and Obsidian Flames
          WHEN g.group_id >= 23000 THEN 195  -- Paldea Evolved, SV1
          WHEN g.group_id >= 20000 THEN 180  -- Other SV sets
          WHEN g.group_id >= 15000 THEN 120  -- SWSH sets
          WHEN g.group_id >= 10000 THEN 80
          WHEN g.group_id >= 5000 THEN 60
          WHEN g.group_id >= 1000 THEN 40
          ELSE 20
        END as recency_score,
        -- Recent activity boost (cards updated recently = actively trending)
        CASE 
          WHEN datetime(p.updated_at) > datetime('now', '-1 day') THEN 50
          WHEN datetime(p.updated_at) > datetime('now', '-3 days') THEN 40
          WHEN datetime(p.updated_at) > datetime('now', '-7 days') THEN 30
          WHEN datetime(p.updated_at) > datetime('now', '-30 days') THEN 20
          WHEN datetime(p.updated_at) > datetime('now', '-90 days') THEN 10
          ELSE 0
        END as activity_score,
        -- Value tier (higher value = more sought after, but lower threshold for recent sets)
        CASE 
          WHEN p.market_price >= 100 THEN 40
          WHEN p.market_price >= 50 THEN 30
          WHEN p.market_price >= 25 THEN 20
          WHEN p.market_price >= 10 THEN 15
          WHEN p.market_price >= 5 THEN 10
          -- Lower threshold for very recent sets (new releases might not have high prices yet)
          WHEN p.market_price >= 1 AND g.published_on >= date('now', '-6 months') THEN 5
          ELSE 0
        END as value_tier,
        -- Rarity tier (higher rarity = more sought after)
        CASE p.ext_rarity
          WHEN 'Secret Rare' THEN 30
          WHEN 'Rainbow Rare' THEN 25
          WHEN 'Special Illustration Rare' THEN 25
          WHEN 'Illustration Rare' THEN 20
          WHEN 'Trainer Gallery' THEN 15
          WHEN 'Ultra Rare' THEN 15
          WHEN 'Rare Holo' THEN 10
          ELSE 5
        END as rarity_tier,
        -- Popularity score (based on collection count - more users collecting = more popular)
        COALESCE(popularity_stats.collection_count, 0) as collection_count,
        CASE 
          WHEN COALESCE(popularity_stats.collection_count, 0) >= 50 THEN 40  -- Very popular (50+ collectors)
          WHEN COALESCE(popularity_stats.collection_count, 0) >= 25 THEN 30  -- Popular (25-49 collectors)
          WHEN COALESCE(popularity_stats.collection_count, 0) >= 10 THEN 20  -- Moderately popular (10-24 collectors)
          WHEN COALESCE(popularity_stats.collection_count, 0) >= 5 THEN 10   -- Somewhat popular (5-9 collectors)
          ELSE 0            -- Not collected yet
        END as popularity_tier
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      LEFT JOIN (
        SELECT product_id, COUNT(*) as collection_count
        FROM user_collections
        GROUP BY product_id
      ) popularity_stats ON popularity_stats.product_id = p.product_id
      WHERE p.category_id = 3
        -- Flexible threshold: prioritize newer cards and popular cards even if lower value
        AND (
          p.market_price >= 10  -- Standard threshold for higher value cards
          OR (p.market_price >= 1 AND (g.published_on >= date('now', '-6 months') OR (g.published_on > date('now') AND g.published_on <= date('now', '+6 months'))))  -- Lower threshold for sets released in last 6 months or upcoming within 6 months
          OR (
            -- Popular cards (5+ collectors) can be included even if lower value
            COALESCE(popularity_stats.collection_count, 0) >= 5
            AND p.market_price >= 0.50
          )
        )
        AND p.market_price < 2000  -- Cap to avoid extremely expensive vintage
        AND p.image_url IS NOT NULL
        -- Must be an individual card (has card type and is not a sealed product)
        AND p.ext_card_type IS NOT NULL
        AND p.ext_card_type != ''
        -- Exclude sealed products
        AND p.name NOT LIKE '%Case%' 
        AND p.name NOT LIKE '%Booster Box%' 
        AND p.name NOT LIKE '%Display%'
        AND p.name NOT LIKE '%Pack%'
        AND p.name NOT LIKE '%Elite Trainer Box%'
        AND p.name NOT LIKE '%Collection%'
        AND p.name NOT LIKE '%Bundle%'
        AND p.name NOT LIKE '%Tin%'
        AND p.name NOT LIKE '%Sleeved%'
        AND p.name NOT LIKE '%Blister%'
        AND p.name NOT LIKE '%Starter%'
        AND p.name NOT LIKE '%Theme Deck%'
        AND p.name NOT LIKE '%Battle Academy%'
        AND p.name NOT LIKE '%Trainer Kit%'
        AND p.name NOT LIKE '%Code Card%'
        AND p.name NOT LIKE '%Premium%'
        AND p.name NOT LIKE '%Super-Premium%'
        AND p.name NOT LIKE '%Ultra-Premium%'
        AND p.name NOT LIKE '%Prerelease Kit%'
        AND p.name NOT LIKE '%World Championships%'
        AND p.name NOT LIKE '%Promo Set%'
        AND p.name NOT LIKE '%Chest%'
        AND p.name NOT LIKE '%Figure%'
        AND p.name NOT LIKE '%Box Set%'
        AND p.name NOT LIKE '%Gift Set%'
        -- Must have card number (individual cards have numbers)
        -- Japanese cards can bypass this requirement if they're high value
        AND (
          (p.ext_number IS NOT NULL AND p.ext_number != '')
          OR (p.name LIKE '%(Japanese)%' OR p.name LIKE '%Japanese%' OR g.name LIKE '%Japanese%' OR g.name LIKE '%JP%')
        )
        -- Include modern sets (2020+) AND Japanese cards from recent sets only
        -- Prioritize sets by release date, name patterns, or group_id (higher = newer)
        AND (
          -- Sets released in 2020 or later (modern era)
          (g.published_on >= '2020-01-01')
          -- OR Modern set name patterns (SV, SWSH, Crown Zenith, etc.)
          OR g.name LIKE 'SV%'
          OR g.name LIKE 'SWSH%'
          OR g.name LIKE '%Crown Zenith%'
          OR g.name LIKE '%Paldea Evolved%'
          OR g.name LIKE '%Obsidian Flames%'
          OR g.name LIKE '%Paradox Rift%'
          OR g.name LIKE '%Paldean Fates%'
          OR g.name LIKE '%Temporal Forces%'
          OR g.name LIKE '%Twilight Masquerade%'
          OR g.name LIKE '%Shrouded Fable%'
          OR g.name LIKE '%Stellar Crown%'
          OR g.name LIKE '%Surging Sparks%'
          OR g.name LIKE '%Prismatic Evolutions%'
          OR g.name LIKE '%Journey Together%'
          OR g.name LIKE '%Destined Rivals%'
          OR g.name LIKE '%Black Bolt%'
          OR g.name LIKE '%White Flare%'
          OR g.name LIKE '%Mega Evolution%'
          OR g.name LIKE '%Phantasmal Flames%'
          OR g.name LIKE '%Scarlet & Violet%'
          OR g.name LIKE '%Scarlet and Violet%'
          OR g.name LIKE '%Silver Tempest%'
          OR g.name LIKE '%Brilliant Stars%'
          OR g.name LIKE '%Astral Radiance%'
          OR g.name LIKE '%Lost Origin%'
          OR g.name LIKE '%Fusion Strike%'
          OR g.name LIKE '%Evolving Skies%'
          OR g.name LIKE '%Chilling Reign%'
          OR g.name LIKE '%Battle Styles%'
          OR g.name LIKE '%Vivid Voltage%'
          OR g.name LIKE '%Darkness Ablaze%'
          OR g.name LIKE '%Rebel Clash%'
          OR g.name LIKE '%Sword & Shield%'
          OR g.name LIKE '%Sword and Shield%'
          -- OR Higher group_ids (typically newer sets - group_ids above 1000 are modern)
          OR g.group_id >= 1000
          -- OR Japanese sets/cards from recent SV era (2023+) only
          OR (
            (g.name LIKE '%Japanese%' OR g.name LIKE '%JP%' OR g.name LIKE '%日本語%' OR p.name LIKE '%(Japanese)%' OR p.name LIKE '%Japanese%')
            AND (g.name LIKE '%SV%' OR g.name LIKE '%Scarlet%' OR g.name LIKE '%Violet%' OR g.published_on >= '2023-01-01' OR g.group_id >= 20000)
          )
        )
        -- Explicitly exclude old Japanese promos and older sets (handle NULL group names)
        AND (g.name IS NULL OR g.name NOT LIKE '%JP Exclusive%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Japanese Exclusive%')
        AND (g.name IS NULL OR g.name NOT LIKE '%SM Promos%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Miscellaneous Cards%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Pikachu World Collection%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Delta Species%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Dragon Frontiers%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Base Set%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Jungle%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Fossil%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Team Rocket%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Gym Heroes%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Gym Challenge%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Neo%')
        AND (g.name IS NULL OR g.name NOT LIKE '%EX%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Diamond & Pearl%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Platinum%')
        AND (g.name IS NULL OR g.name NOT LIKE '%HeartGold%')
        AND (g.name IS NULL OR g.name NOT LIKE '%SoulSilver%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Black & White%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Black and White%')
        AND (g.name IS NULL OR g.name NOT LIKE '%XY%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Sun & Moon%')
        AND (g.name IS NULL OR g.name NOT LIKE '%Sun and Moon%')
      ORDER BY 
        -- PRIMARY: Comprehensive trending score prioritizing newer, more popular, higher valued cards
        -- Recency score (8x weight) - newer cards are trending NOW
        -- Popularity score (3x weight) - more collectors = more popular/trending
        -- Value tier (2x weight) - higher value cards are more sought after
        -- Activity score (1.5x weight) - recent market activity = trending
        -- Rarity tier (0.5x weight) - higher rarity adds appeal within same tier
        (recency_score * 8.0 + popularity_tier * 3.0 + value_tier * 2.0 + activity_score * 1.5 + rarity_tier * 0.5) DESC,
        -- Secondary: Most recent release date (prioritize newest sets)
        CASE WHEN g.published_on IS NOT NULL THEN g.published_on ELSE '2000-01-01' END DESC,
        -- Tertiary: Higher value cards (within same trending score)
        p.market_price DESC,
        -- Quaternary: Most recently updated (active market = trending)
        CASE WHEN p.updated_at IS NOT NULL THEN p.updated_at ELSE '2000-01-01' END DESC,
        -- Quinary: Higher popularity (collection count) as tiebreaker
        collection_count DESC
      LIMIT ?
    `,
      [limit]
    );

    // Format card data for frontend
    const formattedCards = cards.map((card) =>
      formatCardForFrontend(card, req)
    );

    res.json({ success: true, data: formattedCards, source: "database" });
  } catch (error) {
    console.error("Error getting trending cards:", error);
    res.status(500).json({ error: "Failed to get trending cards" });
  }
});

// Helper function to format card data for frontend
function formatCardForFrontend(card, req = null) {
  // Determine image URL - prefer local, fallback to external
  let imageUrl = card.local_image_url || card.image_url;
  let isLocal = !!card.local_image_url;

  // If local URL and we have request object, construct full URL
  if (isLocal && req) {
    imageUrl = `${req.protocol}://${req.get("host")}${card.local_image_url}`;
  }

  return {
    ...card,
    current_value: card.market_price || card.mid_price || card.low_price || 0,
    price: card.market_price || card.mid_price || card.low_price || 0,
    product_id: card.product_id,
    cardId: card.product_id.toString(),
    attacks: (() => {
      const attacks = [];
      if (card.ext_attack1) {
        const attackText = card.ext_attack1
          .replace(/<br>/g, "\n")
          .replace(/<[^>]*>/g, "");
        const lines = attackText.split("\n");
        const attack = {
          name: lines[0] || "Unknown Attack",
          text: lines.slice(1).join("\n").trim() || "",
          cost: [],
          damage: "",
        };
        attacks.push(attack);
      }
      if (card.ext_attack2) {
        const attackText = card.ext_attack2
          .replace(/<br>/g, "\n")
          .replace(/<[^>]*>/g, "");
        const lines = attackText.split("\n");
        const attack = {
          name: lines[0] || "Unknown Attack",
          text: lines.slice(1).join("\n").trim() || "",
          cost: [],
          damage: "",
        };
        attacks.push(attack);
      }
      return attacks;
    })(),
    weaknesses: card.ext_weakness ? [card.ext_weakness] : [],
    resistances: card.ext_resistance ? [card.ext_resistance] : [],
    retreat_cost: card.ext_retreat_cost ? [card.ext_retreat_cost] : [],
    rarity: card.ext_rarity,
    types: card.ext_card_type ? [card.ext_card_type] : [],
    images: imageUrl
      ? {
          small: imageUrl,
          large: imageUrl,
          local: isLocal,
        }
      : null,
    formattedNumber: card.ext_number || "N/A",
  };
}

// Get top movers (for main app dashboard)
router.get("/top-movers", async (req, res) => {
  try {
    const cards = await query(`
      SELECT 
        p.*,
        g.name as set_name,
        g.clean_name as clean_set_name,
        g.published_on as release_date
      FROM products p
      LEFT JOIN groups g ON p.group_id = g.group_id
      WHERE 1=1
      ORDER BY 
        p.name,
        g.published_on DESC
      LIMIT 20
    `);

    // Format card data for frontend
    const formattedCards = cards.map((card) => {
      return {
        ...card,
        current_value:
          card.market_price || card.mid_price || card.low_price || 0,
        price: card.market_price || card.mid_price || card.low_price || 0,
        product_id: card.product_id,
        cardId: card.product_id.toString(),
        attacks: (() => {
          const attacks = [];
          if (card.ext_attack1) {
            const attackText = card.ext_attack1
              .replace(/<br>/g, "\n")
              .replace(/<[^>]*>/g, "");
            const lines = attackText.split("\n");
            const attack = {
              name: lines[0] || "Unknown Attack",
              text: lines.slice(1).join("\n").trim() || "",
              cost: [],
              damage: "",
            };
            attacks.push(attack);
          }
          if (card.ext_attack2) {
            const attackText = card.ext_attack2
              .replace(/<br>/g, "\n")
              .replace(/<[^>]*>/g, "");
            const lines = attackText.split("\n");
            const attack = {
              name: lines[0] || "Unknown Attack",
              text: lines.slice(1).join("\n").trim() || "",
              cost: [],
              damage: "",
            };
            attacks.push(attack);
          }
          return attacks;
        })(),
        weaknesses: card.ext_weakness ? [card.ext_weakness] : [],
        resistances: card.ext_resistance ? [card.ext_resistance] : [],
        retreat_cost: card.ext_retreat_cost ? [card.ext_retreat_cost] : [],
        rarity: card.ext_rarity,
        types: card.ext_card_type ? [card.ext_card_type] : [],
        images: (() => {
          const imageUrl = card.local_image_url || card.image_url;
          const isLocal = !!card.local_image_url;
          return imageUrl
            ? {
                small: imageUrl,
                large: imageUrl,
                local: isLocal,
              }
            : null;
        })(),
        formattedNumber: card.ext_number || "N/A",
      };
    });

    res.json({ success: true, data: formattedCards });
  } catch (error) {
    console.error("Error getting top movers:", error);
    res.status(500).json({ error: "Failed to get top movers" });
  }
});

// Get price history for a specific card (MUST be before /:id route!)
// Get price history for a specific card by ID
router.get("/price-history/:id", async (req, res) => {
  try {
    const cardId = req.params.id;
    const timeRange = req.query.timeRange || "All";
    const variant = req.query.variant || "Normal";

    console.log(`=== PRICE HISTORY REQUEST ===`);
    console.log(`Card ID: ${cardId}`);
    console.log(`Time Range: ${timeRange}`);
    console.log(`Variant: ${variant}`);

    // Map frontend variant IDs to database variant names
    const variantMapping = {
      normal: "Normal",
      holo: "Holofoil",
      reverseholo: "Reverse Holofoil",
      "1stedition": "1st Edition",
      shadowless: "Shadowless",
      radiant: "Radiant",
      unlimitedholofoil: "Unlimited Holofoil",
      "1steditionholofoil": "1st Edition Holofoil",
    };

    const dbVariant = variantMapping[variant] || variant;
    console.log(`Received variant: "${variant}", mapped to: "${dbVariant}"`);

    // Calculate date range based on timeRange parameter
    let dateFilter = "";
    let params = [cardId];

    if (timeRange !== "All") {
      const now = new Date();
      let startDate;

      switch (timeRange) {
        case "7D":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "1M":
          startDate = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000);
          break;
        case "3M":
          startDate = new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000);
          break;
        case "6M":
          startDate = new Date(now.getTime() - 185 * 24 * 60 * 60 * 1000);
          break;
        case "1Y":
          // For 1Y and All, return all available data (since we only have ~14 days)
          // Don't filter by date - just return all records
          startDate = null;
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        dateFilter = " AND date >= ?";
        params.push(startDate.toISOString().split("T")[0]);
      }
    }

    console.log(
      `Querying price history for card ${cardId}, dateFilter: ${dateFilter}, params:`,
      params
    );

    const queryString = `
      SELECT 
        date,
        price as mid_price,
        price as low_price,
        price as high_price,
        price as market_price
      FROM price_history
      WHERE product_id = ?
      ${dateFilter}
      ORDER BY date DESC
      LIMIT 100
    `;
    const queryParams = params;

    console.log(`Executing query: ${queryString}`);
    console.log(`With params:`, queryParams);

    let priceHistory = await query(queryString, queryParams);

    console.log(
      `Found ${priceHistory.length} price history records for card ${cardId}`
    );

    if (priceHistory.length > 0) {
      console.log(`Sample record:`, priceHistory[0]);
    }

    // Always return success: true with data array (even if empty)
    res.json({
      success: true,
      data: priceHistory || [],
      variant:
        priceHistory.length > 0
          ? priceHistory[0].sub_type_name || dbVariant
          : dbVariant,
      count: priceHistory.length,
    });
  } catch (error) {
    console.error("Error fetching price history:", error);
    // Return success: false so frontend can handle it properly
    res.status(500).json({
      success: false,
      error: "Failed to fetch price history",
      message: error.message,
      data: [],
    });
  }
});

// Old price history endpoint for backward compatibility
router.get("/price-history", async (req, res) => {
  try {
    const { cardName, setName, cardId, startDate, endDate } = req.query;

    let cardIdToUse = cardId;

    // If cardId is not provided, try to find it by name and set
    if (!cardIdToUse && cardName && setName) {
      const cardSql = `
        SELECT c.id, c.current_value, c.name, s.name as set_name
        FROM cards c
        LEFT JOIN sets s ON c.set_id = s.id
        WHERE c.name = ? AND s.name = ?
        LIMIT 1
      `;

      const cardResult = await query(cardSql, [cardName, setName]);
      if (cardResult.length > 0) {
        cardIdToUse = cardResult[0].id;
      }
    }

    if (!cardIdToUse) {
      return res.json({ data: [] });
    }

    // Build the query for price history
    let sql = `
      SELECT date, price, volume
      FROM price_history
      WHERE product_id = ?
    `;
    const params = [cardIdToUse];

    if (startDate) {
      sql += ` AND date >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND date <= ?`;
      params.push(endDate);
    }

    sql += ` ORDER BY date ASC`;

    const data = await query(sql, params);

    res.json({ data });
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

// Image matching endpoint - matches cards by visual similarity using image hashes
// MUST be before /:id route to avoid route conflicts
router.post("/match-image", async (req, res) => {
  try {
    // Much lower default threshold for better matching (0.15 = 85% similarity, very lenient)
    // This allows more potential matches through while still filtering obvious non-matches
    const { hashes, threshold = 0.15 } = req.body;

    // FIXED: Only require differenceHash (new implementation uses only dHash)
    if (!hashes || !hashes.differenceHash) {
      return res.status(400).json({
        success: false,
        error: "Image hash (differenceHash) required",
      });
    }

    // DEBUG: Log received hash for debugging
    const receivedHashPreview = hashes.differenceHash
      ? hashes.differenceHash.substring(0, 20) +
        "..." +
        hashes.differenceHash.substring(hashes.differenceHash.length - 20)
      : "null";

    console.log("🖼️ Image matching request (FIXED - dHash only):", {
      hasDifferenceHash: !!hashes.differenceHash,
      differenceHashLength: hashes.differenceHash?.length,
      hashPreview: receivedHashPreview,
      first10: hashes.differenceHash?.substring(0, 10),
      last10: hashes.differenceHash?.substring(
        hashes.differenceHash.length - 10
      ),
      threshold,
    });

    // Get energy type filter if provided
    const energyTypeFilter = req.body.energyType || null;

    // Build WHERE clause with optional energy type filter
    // Check for hashes in any orientation (new format) or old format (backward compatibility)
    let whereClause = `
      p.category_id = 3
      AND p.image_url IS NOT NULL
      AND (
        -- New format: check normal orientation
        p.image_hash_perceptual_normal IS NOT NULL OR
        p.image_hash_difference_normal IS NOT NULL OR
        p.image_hash_average_normal IS NOT NULL OR
        p.image_hash_wavelet_normal IS NOT NULL OR
        -- Old format: backward compatibility
        p.image_hash_perceptual IS NOT NULL OR
        p.image_hash_difference IS NOT NULL
      )
    `;

    // Add energy type filter if provided (use parameterized query to prevent SQL injection)
    // IMPORTANT: Don't filter by energy type if it's likely incorrect (e.g., Metal for Psychic cards)
    // Instead, use energy type as a boost in scoring, not a filter
    const queryParams = [];
    // DISABLED: Energy type filtering - too strict and causes false negatives
    // We'll use energy type for scoring/ranking instead
    if (false && energyTypeFilter) {
      // Match if energy type is:
      // 1. Exact match: "Fire"
      // 2. First type in combo: "Fire/Fighting" or "Fire / Fighting"
      // 3. Standalone word: "Fire" (not "Firefly")
      whereClause += ` AND (
        p.ext_card_type = ? OR
        p.ext_card_type LIKE ? OR
        p.ext_card_type LIKE ?
      )`;
      queryParams.push(energyTypeFilter); // Exact match
      queryParams.push(`${energyTypeFilter}/%`); // First type in combo
      queryParams.push(`${energyTypeFilter} %`); // First type with space
      console.log(`🔍 Filtering by energy type (strict): ${energyTypeFilter}`);
    } else {
      if (energyTypeFilter) {
        console.log(
          `ℹ️ Energy type detected: ${energyTypeFilter} (will be used for scoring, not filtering)`
        );
      } else {
        console.log("ℹ️ No energy type filter - searching all cards");
      }
    }

    // Get cards with computed hashes (optimized for speed)
    // Reduced from 10,000 to 2,000 and removed slow RANDOM() ordering
    // Support both old format (single orientation) and new format (multiple orientations)
    const cards = await query(
      `
      SELECT 
        p.product_id,
        p.name,
        p.clean_name,
        p.image_url,
        -- Old format (backward compatibility)
        p.image_hash_perceptual,
        p.image_hash_difference,
        p.image_hash_average,
        -- New format: normal orientation
        p.image_hash_perceptual_normal,
        p.image_hash_difference_normal,
        p.image_hash_average_normal,
        p.image_hash_wavelet_normal,
        -- New format: mirrored orientation
        p.image_hash_perceptual_mirrored,
        p.image_hash_difference_mirrored,
        p.image_hash_average_mirrored,
        p.image_hash_wavelet_mirrored,
        -- New format: upside-down orientation
        p.image_hash_perceptual_upsidedown,
        p.image_hash_difference_upsidedown,
        p.image_hash_average_upsidedown,
        p.image_hash_wavelet_upsidedown,
        -- New format: mirrored+upside-down orientation
        p.image_hash_perceptual_mirrored_upsidedown,
        p.image_hash_difference_mirrored_upsidedown,
        p.image_hash_average_mirrored_upsidedown,
        p.image_hash_wavelet_mirrored_upsidedown,
        p.ext_card_type,
        p.ext_hp,
        p.ext_number,
        p.ext_rarity,
        p.ext_attack1,
        p.ext_attack2,
        p.ext_weakness,
        p.ext_resistance,
        p.ext_retreat_cost,
        p.market_price,
        p.mid_price,
        p.low_price,
        p.group_id,
        g.name as set_name,
        g.clean_name as clean_set_name
          FROM products p
          LEFT JOIN groups g ON p.group_id = g.group_id
          WHERE ${whereClause}
              AND (p.image_hash_difference_normal IS NOT NULL AND p.image_hash_difference_normal != '')
          ORDER BY p.product_id DESC
          LIMIT 2000
    `,
      queryParams
    );

    console.log(`📊 Comparing against ${cards.length} cards with hashes`);

    if (cards.length === 0) {
      console.log("⚠️ WARNING: No cards found with hashes in database!");
      console.log("💡 Run: npm run hashes:precompute-all to hash cards");
      return res.json({
        success: true,
        matches: [],
        count: 0,
        warning:
          "No cards have been hashed yet. Run the precompute script to enable image matching.",
      });
    }

    // Calculate similarity for each card using max-of-mins approach
    // Based on NolanAmblard/Pokemon-Card-Scanner algorithm
    // Optimized: Early termination if we find very good matches
    const matches = [];
    const hashLength = hashes.differenceHash.length || 5696;
    let bestMatchDistance = Infinity;
    let processedCount = 0;
    const MAX_PROCESS = 2000; // Process max 2000 cards

    for (const card of cards) {
      processedCount++;

      // Early termination: If we found a very good match (similarity > 0.95),
      // we can stop after processing a reasonable number more
      if (bestMatchDistance < hashLength * 0.05 && processedCount > 500) {
        console.log(
          `✅ Early termination: Found excellent match (distance: ${bestMatchDistance}), processed ${processedCount} cards`
        );
        break;
      }

      // Limit total processing to prevent timeout
      if (processedCount > MAX_PROCESS) {
        console.log(
          `⏱️ Processed ${MAX_PROCESS} cards, stopping to prevent timeout`
        );
        break;
      }
      // FIXED: Collect only differenceHash orientations (new implementation uses only dHash)
      const orientations = [
        {
          name: "normal",
          differenceHash:
            card.image_hash_difference_normal || card.image_hash_difference,
        },
        {
          name: "mirrored",
          differenceHash: card.image_hash_difference_mirrored,
        },
        {
          name: "upsideDown",
          differenceHash: card.image_hash_difference_upsidedown,
        },
        {
          name: "mirroredUpsideDown",
          differenceHash: card.image_hash_difference_mirrored_upsidedown,
        },
      ];

      // FIXED: Only compare differenceHash (dHash only)
      const hashDistances = {
        difference: [],
      };

      // Compare differenceHash across all orientations
      for (const orientation of orientations) {
        if (hashes.differenceHash && orientation.differenceHash) {
          const dist = hammingDistance(
            hashes.differenceHash,
            orientation.differenceHash
          );
          hashDistances.difference.push(dist);
        }
      }

      // Calculate similarity using only dHash
      if (hashDistances.difference.length > 0) {
        const minDist = Math.min(...hashDistances.difference);

        // Track best match distance for early termination
        if (minDist < bestMatchDistance) {
          bestMatchDistance = minDist;
        }

        // DEBUG: Warn if hash length mismatch
        if (
          hashes.differenceHash.length !== 5696 &&
          hashes.differenceHash.length !== 5760
        ) {
          console.warn(
            `⚠️ Unexpected hash length: ${hashes.differenceHash.length} (expected 5696 or 5760)`
          );
        }
        const normalizedDist = minDist / hashLength;
        const similarity = Math.max(0, 1 - normalizedDist);

        // DEBUG: Log first few matches for debugging
        if (matches.length < 3) {
          const dbHashPreview =
            orientations
              .find((o) => o.differenceHash)
              ?.differenceHash?.substring(0, 20) + "...";
          console.log(`🔍 Match ${matches.length + 1}:`, {
            cardName: card.name,
            hashDistance: minDist,
            hashLength: hashLength,
            normalizedDist: normalizedDist.toFixed(4),
            similarity: similarity.toFixed(4),
            dbHashPreview: dbHashPreview,
          });
        }

        // Lower threshold significantly for dHash-only matching
        // Start with very lenient threshold (0.05 = 95% similarity) to see more matches
        // This will help debug why only Base Set cards are showing
        const effectiveThreshold = Math.min(threshold, 0.05);

        // Include matches above threshold
        if (similarity >= effectiveThreshold) {
          matches.push({
            ...card,
            similarity: similarity,
            matchScore: Math.round(similarity * 100) / 100,
            hashDistance: minDist,
            hashLength: hashLength,
          });
        } else if (matches.length < 50) {
          // Include top 50 even if below threshold for debugging
          matches.push({
            ...card,
            similarity: similarity,
            matchScore: Math.round(similarity * 100) / 100,
            belowThreshold: true,
            hashDistance: minDist,
            hashLength: hashLength,
          });
        }
      }
    }

    // Sort by similarity (highest first)
    matches.sort((a, b) => b.similarity - a.similarity);

    // DEBUG: Log all matches before filtering to see what we're working with
    console.log(`📊 Total matches found: ${matches.length}`);
    if (matches.length > 0) {
      console.log(
        "📊 Top 10 matches (before filtering):",
        matches.slice(0, 10).map((m) => ({
          name: m.name,
          set: m.set_name,
          product_id: m.product_id,
          similarity: m.similarity?.toFixed(4),
          matchScore: m.matchScore?.toFixed(4),
          hashDistance: m.hashDistance,
          belowThreshold: m.belowThreshold,
        }))
      );

      // Log set distribution in matches
      const setCounts = {};
      matches.slice(0, 20).forEach((m) => {
        const setName = m.set_name || "Unknown";
        setCounts[setName] = (setCounts[setName] || 0) + 1;
      });
      console.log("📦 Set distribution in top 20 matches:", setCounts);
    }

    // Filter out below-threshold matches unless we have very few matches
    let topMatches = matches.filter(
      (m) =>
        !m.belowThreshold ||
        matches.filter((m2) => !m2.belowThreshold).length < 3
    );

    // Take top 50 matches (increased to catch more potential matches)
    topMatches = topMatches.slice(0, 50);

    // If we have matches but they're all below threshold, still return top 20 for debugging
    const aboveThresholdMatches = matches.filter((m) => !m.belowThreshold);
    if (aboveThresholdMatches.length === 0 && matches.length > 0) {
      console.log(
        "⚠️ All matches below threshold, returning top 20 for debugging"
      );
      console.log(
        "📊 Sample match similarity scores:",
        matches.slice(0, 5).map((m) => ({
          name: m.name,
          similarity: m.similarity,
          matchScore: m.matchScore,
          hashDistance: m.hashDistance,
        }))
      );
      topMatches = matches.slice(0, 20);
    }

    // Log card names in results to help debug
    if (topMatches.length > 0) {
      console.log(
        "📋 Card names in results:",
        topMatches.slice(0, 10).map((m) => ({
          name: m.name || m.clean_name || "Unknown",
          product_id: m.product_id,
          similarity: m.similarity?.toFixed(3),
          type: m.ext_card_type,
        }))
      );

      // Check specifically for Drowzee
      const drowzeeInResults = topMatches.filter(
        (m) =>
          (m.name || "").toLowerCase().includes("drowzee") ||
          (m.clean_name || "").toLowerCase().includes("drowzee")
      );
      if (drowzeeInResults.length > 0) {
        console.log(
          `🎯 Found ${drowzeeInResults.length} Drowzee card(s) in top matches!`
        );
      } else {
        console.log("⚠️ No Drowzee cards found in top matches");
      }
    }

    console.log(
      `✅ Found ${topMatches.length} matches (threshold: ${threshold})`
    );
    console.log(
      `📊 Total cards compared: ${cards.length}, Total matches found: ${matches.length}, Above threshold: ${aboveThresholdMatches.length}`
    );

    if (topMatches.length > 0) {
      console.log(
        "📊 Top 3 matches:",
        topMatches.slice(0, 3).map((m) => ({
          name: m.name,
          similarity: m.similarity?.toFixed(3),
          matchScore: m.matchScore?.toFixed(3),
          product_id: m.product_id,
          belowThreshold: m.belowThreshold || false,
        }))
      );
    } else {
      console.log(
        "⚠️ No matches found. Check if cards are hashed in database."
      );
    }

    // Format matches for frontend
    const formattedMatches = topMatches.map((card) => {
      // Parse attacks
      const attacks = [];
      if (card.ext_attack1) {
        const attackText = card.ext_attack1
          .replace(/<br>/g, "\n")
          .replace(/<[^>]*>/g, "");
        const lines = attackText.split("\n");
        const attack = {
          name: lines[0] || "Unknown Attack",
          text: lines.slice(1).join("\n").trim() || "",
          cost: [],
          damage: "",
        };
        attacks.push(attack);
      }
      if (card.ext_attack2) {
        const attackText = card.ext_attack2
          .replace(/<br>/g, "\n")
          .replace(/<[^>]*>/g, "");
        const lines = attackText.split("\n");
        const attack = {
          name: lines[0] || "Unknown Attack",
          text: lines.slice(1).join("\n").trim() || "",
          cost: [],
          damage: "",
        };
        attacks.push(attack);
      }

      return {
        product_id: card.product_id,
        id: card.product_id.toString(),
        cardId: card.product_id.toString(),
        name: card.name,
        cleanName: card.clean_name || card.name,
        imageUrl: card.image_url,
        set_name: card.set_name,
        clean_set_name: card.clean_set_name,
        ext_number: card.ext_number,
        ext_rarity: card.ext_rarity,
        ext_card_type: card.ext_card_type,
        hp: card.ext_hp,
        current_value:
          card.market_price || card.mid_price || card.low_price || 0,
        price: card.market_price || card.mid_price || card.low_price || 0,
        attacks: attacks,
        weaknesses: card.ext_weakness ? [card.ext_weakness] : [],
        resistances: card.ext_resistance ? [card.ext_resistance] : [],
        retreat_cost: card.ext_retreat_cost ? [card.ext_retreat_cost] : [],
        rarity: card.ext_rarity,
        types: card.ext_card_type ? [card.ext_card_type] : [],
        images: (() => {
          const imageUrl = card.local_image_url || card.image_url;
          const isLocal = !!card.local_image_url;
          return imageUrl
            ? {
                small: imageUrl,
                large: imageUrl,
                local: isLocal,
              }
            : null;
        })(),
        formattedNumber: card.ext_number || "N/A",
        similarity: card.similarity || card.matchScore || 0,
        matchScore: card.matchScore || card.similarity || 0,
        matchType: "image",
      };
    });

    res.json({
      success: true,
      matches: formattedMatches,
      count: formattedMatches.length,
    });
  } catch (error) {
    console.error("Error matching image:", error);
    res.status(500).json({
      success: false,
      error: "Failed to match image",
    });
  }
});

// Get individual card by ID (MUST be after specific routes like /price-history and /match-image!)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("🔍 Fetching card with ID:", id);

    // Get card data - fetch ext_regulation and legalities separately due to SQLite schema cache issues
    const sql = `
      SELECT 
        p.*,
        g.name as set_name, g.clean_name as clean_set_name, g.published_on as release_date
      FROM products p
      JOIN groups g ON p.group_id = g.group_id
      WHERE p.product_id = ?
    `;

    console.log("🔍 SQL query:", sql);
    const card = await get(sql, [id]);

    // Fetch ext_regulation and legalities separately to avoid SQLite schema cache issues
    if (card) {
      try {
        const regulationData = await get(
          "SELECT ext_regulation, legalities FROM products WHERE product_id = ?",
          [id]
        );
        if (regulationData) {
          card.ext_regulation = regulationData.ext_regulation;
          card.legalities = regulationData.legalities;
        }
      } catch (err) {
        console.log(
          "⚠️ Error fetching ext_regulation/legalities separately:",
          err.message
        );
      }
    }
    console.log("🔍 Card result:", card ? "Found" : "Not found");
    console.log(
      "🎯 Regulation Debug - card.ext_regulation from DB:",
      card?.ext_regulation
    );
    console.log(
      "🎯 Regulation Debug - card.legalities from DB:",
      card?.legalities
    );

    if (!card) {
      return res.status(404).json({ error: "Card not found" });
    }

    // Parse JSON fields
    const parseJSON = (field) => {
      if (!field) return null;
      if (typeof field === "object") return field;
      try {
        return JSON.parse(field);
      } catch (e) {
        return field;
      }
    };

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
          Fire: "Fire",
          Water: "Water",
          Lightning: "Lightning",
          Psychic: "Psychic",
          Fighting: "Fighting",
          Darkness: "Darkness",
          Metal: "Metal",
          Colorless: "Colorless",
          Fairy: "Fairy",
          Dragon: "Dragon",
          // Short forms
          G: "Grass",
          R: "Fire",
          W: "Water",
          L: "Lightning",
          P: "Psychic",
          F: "Fighting",
          D: "Darkness",
          M: "Metal",
          C: "Colorless",
          Y: "Fairy",
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

    // Build attacks array from ext_attack1 and ext_attack2
    const attacks = [];
    if (card.ext_attack1) {
      const attack = parseAttack(card.ext_attack1);
      if (attack) attacks.push(attack);
    }
    if (card.ext_attack2) {
      const attack = parseAttack(card.ext_attack2);
      if (attack) attacks.push(attack);
    }

    // Derive stage from multiple sources:
    // 1. ext_stage column (direct from TCGCSV)
    // 2. tcgplayer.extendedData (from TCGCSV extendedData)
    // 3. ext_card_type (fallback)
    let derivedStage = null;

    // First, check ext_stage column directly
    if (card.ext_stage) {
      const extStageValue = String(card.ext_stage).trim();
      const extStageLower = extStageValue.toLowerCase();
      if (
        extStageLower.includes("stage 2") ||
        extStageLower.includes("stage2") ||
        extStageValue === "Stage 2" ||
        extStageValue === "Stage2"
      ) {
        derivedStage = "Stage 2";
      } else if (
        extStageLower.includes("stage 1") ||
        extStageLower.includes("stage1") ||
        extStageValue === "Stage 1" ||
        extStageValue === "Stage1"
      ) {
        derivedStage = "Stage 1";
      } else if (extStageLower === "basic" || extStageValue === "Basic") {
        derivedStage = "Basic";
      } else {
        derivedStage = extStageValue;
      }
      console.log(
        "🎴 Stage Debug - Found in ext_stage column:",
        card.ext_stage,
        "→",
        derivedStage
      );
    }

    // If not found, check tcgplayer.extendedData
    if (!derivedStage) {
      const tcg = parseJSON(card.tcgplayer);
      console.log("🎴 Stage Debug - Card ID:", card.product_id);
      console.log("🎴 Stage Debug - Checking tcgplayer.extendedData");

      if (tcg && Array.isArray(tcg.extendedData)) {
        console.log(
          "🎴 Stage Debug - extendedData array found, length:",
          tcg.extendedData.length
        );
        const stageEntry = tcg.extendedData.find((ed) => {
          const n = (ed?.name || ed?.displayName || "")
            .toString()
            .toLowerCase();
          return n === "stage";
        });
        console.log("🎴 Stage Debug - stageEntry found:", stageEntry);
        if (stageEntry?.value) {
          const value = String(stageEntry.value).trim();
          const valueLower = value.toLowerCase();
          console.log(
            "🎴 Stage Debug - stageEntry value:",
            value,
            "lowercase:",
            valueLower
          );
          // Try to preserve exact value if it matches expected patterns, otherwise normalize
          if (
            valueLower.includes("stage 2") ||
            valueLower.includes("stage2") ||
            value === "Stage 2" ||
            value === "Stage2"
          ) {
            derivedStage = "Stage 2";
          } else if (
            valueLower.includes("stage 1") ||
            valueLower.includes("stage1") ||
            value === "Stage 1" ||
            value === "Stage1"
          ) {
            derivedStage = "Stage 1";
          } else if (valueLower === "basic" || value === "Basic") {
            derivedStage = "Basic";
          } else {
            // Use the exact value if it doesn't match known patterns but still set it
            derivedStage = value;
          }
          console.log(
            "🎴 Stage Debug - derivedStage set from extendedData:",
            derivedStage
          );
        }
      } else {
        console.log("🎴 Stage Debug - No extendedData array or tcg is null");
      }
    }

    // Final fallback to ext_card_type
    if (!derivedStage && card.ext_card_type) {
      const t = String(card.ext_card_type).toLowerCase();
      console.log(
        "🎴 Stage Debug - Falling back to ext_card_type:",
        card.ext_card_type
      );
      if (t.includes("stage 2") || t.includes("stage2"))
        derivedStage = "Stage 2";
      else if (t.includes("stage 1") || t.includes("stage1"))
        derivedStage = "Stage 1";
      else if (t.includes("basic")) derivedStage = "Basic";
    }
    console.log("🎴 Stage Debug - Final derivedStage:", derivedStage);

    // Parse tcgplayer data once for use in weaknesses, resistances, and type
    const tcg = parseJSON(card.tcgplayer);

    // Derive weaknesses from TCGCSV extendedData or ext_weakness
    let weaknesses = [];
    if (tcg && Array.isArray(tcg.extendedData)) {
      const weaknessEntry = tcg.extendedData.find((ed) => {
        const n = (ed?.name || ed?.displayName || "").toString().toLowerCase();
        return n === "weakness" || n === "weaknesses";
      });
      if (weaknessEntry?.value) {
        // Try to parse weakness value - could be JSON or string
        try {
          const parsed =
            typeof weaknessEntry.value === "string"
              ? JSON.parse(weaknessEntry.value)
              : weaknessEntry.value;
          if (Array.isArray(parsed)) {
            weaknesses = parsed;
          } else if (typeof parsed === "object" && parsed.type) {
            weaknesses = [parsed];
          } else if (typeof parsed === "string") {
            // If it's just a string like "Psychic", create object with default value
            weaknesses = [{ type: parsed, value: "X2" }];
          }
        } catch (e) {
          // If not JSON, treat as string
          const value = String(weaknessEntry.value).trim();
          if (value) {
            weaknesses = [{ type: value, value: "X2" }];
          }
        }
      }
    }

    // If not found in extendedData, try ext_weakness column
    if (weaknesses.length === 0 && card.ext_weakness) {
      const parsed = parseJSON(card.ext_weakness);
      console.log("🎴 Weakness Debug - ext_weakness raw:", card.ext_weakness);
      console.log("🎴 Weakness Debug - ext_weakness parsed:", parsed);
      if (Array.isArray(parsed)) {
        // Already in correct format
        weaknesses = parsed;
      } else if (typeof parsed === "object" && parsed !== null && parsed.type) {
        // Single object with type and value
        weaknesses = [parsed];
      } else if (typeof parsed === "string" && parsed.trim()) {
        // Plain string like "Psychic" or "Water" - need to extract type and value
        const weaknessStr = parsed.trim();
        // Check if it contains a value like "×2" or "x2" or just the type
        if (
          weaknessStr.includes("×") ||
          weaknessStr.toLowerCase().includes("x2")
        ) {
          // Format like "Water×2" or "Psychic x2"
          const match = weaknessStr.match(/^(.+?)(?:[\s×x]*(?:\d+))?$/i);
          if (match) {
            const type = match[1].trim();
            const valueMatch = weaknessStr.match(/[\s×x]*(\d+)/i);
            const value = valueMatch ? `×${valueMatch[1]}` : "×2";
            weaknesses = [{ type: type, value: value }];
          } else {
            weaknesses = [{ type: weaknessStr, value: "×2" }];
          }
        } else {
          // Just the type name
          weaknesses = [{ type: weaknessStr, value: "×2" }];
        }
      }
      console.log(
        "🎴 Weakness Debug - weaknesses after parsing ext_weakness:",
        weaknesses
      );
    }

    // Derive resistances from TCGCSV extendedData or ext_resistance
    let resistances = [];
    if (tcg && Array.isArray(tcg.extendedData)) {
      const resistanceEntry = tcg.extendedData.find((ed) => {
        const n = (ed?.name || ed?.displayName || "").toString().toLowerCase();
        return n === "resistance" || n === "resistances";
      });
      if (resistanceEntry?.value) {
        try {
          const parsed =
            typeof resistanceEntry.value === "string"
              ? JSON.parse(resistanceEntry.value)
              : resistanceEntry.value;
          if (Array.isArray(parsed)) {
            resistances = parsed;
          } else if (typeof parsed === "object" && parsed.type) {
            resistances = [parsed];
          } else if (typeof parsed === "string") {
            resistances = [{ type: parsed, value: "-20" }];
          }
        } catch (e) {
          const value = String(resistanceEntry.value).trim();
          if (value) {
            resistances = [{ type: value, value: "-20" }];
          }
        }
      }
    }

    // If not found in extendedData, try ext_resistance column
    if (resistances.length === 0 && card.ext_resistance) {
      const parsed = parseJSON(card.ext_resistance);
      if (Array.isArray(parsed)) {
        resistances = parsed;
      } else if (typeof parsed === "object" && parsed.type) {
        resistances = [parsed];
      } else if (typeof parsed === "string" && parsed.trim()) {
        resistances = [{ type: parsed.trim(), value: "-20" }];
      }
    }

    // Derive primary type
    let primaryType = null;
    if (tcg && Array.isArray(tcg.extendedData)) {
      const typeEntry = tcg.extendedData.find((ed) => {
        const n = (ed?.name || ed?.displayName || "").toString().toLowerCase();
        return n === "card type" || n === "type";
      });
      primaryType = typeEntry?.value || null;
    }
    if (!primaryType) {
      const parsedTypes = parseJSON(card.types);
      if (Array.isArray(parsedTypes) && parsedTypes.length > 0)
        primaryType = parsedTypes[0];
      else if (card.ext_card_type) primaryType = card.ext_card_type;
    }

    console.log(
      "🎴 Stage Debug - Setting formattedCard.stage to:",
      derivedStage
    );
    const formattedCard = {
      ...card,
      hp: card.ext_hp || card.hp || null,
      stage: derivedStage || null, // Explicitly set to null if not found
      type: primaryType || null,
      types: (() => {
        const parsed = parseJSON(card.types);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        if (primaryType) return [primaryType];
        if (card.ext_card_type) return [card.ext_card_type];
        return [];
      })(),
      subtypes: parseJSON(card.subtypes),
      abilities: (() => {
        // Parse abilities from ext_card_text (for Japanese cards and cards with card text)
        const abilities = [];
        if (card.ext_card_text) {
          // Normalize common HTML to plain text while preserving tag boundaries
          const raw = String(card.ext_card_text)
            .replace(/<br\s*\/?>(\r?\n)?/gi, "\n")
            .replace(/&mdash;|&ndash;|—|–/g, " — ");

          // Helper to strip HTML tags
          const stripHtml = (s) => s.replace(/<[^>]*>/g, "").trim();

          // Collect multiple matches across patterns
          const found = [];

          // 1) <strong>Ability</strong> Name ... or <strong>Ability: Name</strong>
          const reStrongAbility =
            /<strong>\s*Ability\s*:?\s*([^<]*)<\/strong>\s*([^<\n]*)/gi;
          let m;
          while ((m = reStrongAbility.exec(raw)) !== null) {
            const name =
              stripHtml(m[1] || "").replace(/^[:\-–—]\s*/, "") || "Ability";
            const text = stripHtml(m[2] || "");
            found.push({ type: "Ability", name, text });
          }

          // 2) Ability — Name ... (no strong)
          const reInlineAbility =
            /\bAbility\s*(?:—|–|—|:|-)\s*([^\n<]+)\s*[\n ]*(.*)/gi;
          if (found.length === 0) {
            const mm = reInlineAbility.exec(stripHtml(raw));
            if (mm) {
              found.push({
                type: "Ability",
                name: (mm[1] || "").trim(),
                text: (mm[2] || "").trim(),
              });
            }
          }

          // 3) Pokémon Power / Poké-POWER / Poké-BODY variants
          const rePower =
            /<strong>\s*(Pokémon Power|Pokemon Power|Poké-POWER|Poke-POWER|Poké-BODY|Poke-BODY)\s*:?\s*([^<]*)<\/strong>\s*([^<\n]*)/gi;
          while ((m = rePower.exec(raw)) !== null) {
            const type = stripHtml(m[1] || "Pokémon Power");
            const name =
              stripHtml(m[2] || "").replace(/^[:\-–—]\s*/, "") || type;
            const text = stripHtml(m[3] || "");
            found.push({ type, name, text });
          }

          // 4) Fallback: plain text "Pokémon Power — Name: text"
          if (found.length === 0) {
            const plain = stripHtml(raw);
            const rePlain =
              /(Pokémon Power|Pokemon Power|Poké-POWER|Poke-POWER|Poké-BODY|Poke-BODY)\s*(?:—|–|:|-)\s*([^\n:]+)[:\s-]*([^\n]*)/i;
            const mm2 = rePlain.exec(plain);
            if (mm2) {
              found.push({
                type: mm2[1],
                name: (mm2[2] || "").trim(),
                text: (mm2[3] || "").trim(),
              });
            }
          }

          // Push results
          for (const a of found) {
            if (a.name || a.text) abilities.push(a);
          }
        }
        return abilities;
      })(),
      attacks: attacks,
      weaknesses: weaknesses, // Use derived weaknesses from extendedData or ext_weakness
      resistances: resistances, // Use derived resistances from extendedData or ext_resistance
      retreat_cost: (() => {
        // Handle retreat cost - could be a number, JSON array, or energy type array
        if (!card.ext_retreat_cost) return [];

        // Try to parse as JSON first
        const parsed = parseJSON(card.ext_retreat_cost);
        if (Array.isArray(parsed)) {
          return parsed;
        }

        // If it's a number, convert to array of Colorless
        const num =
          typeof parsed === "number" ? parsed : parseInt(card.ext_retreat_cost);
        if (!isNaN(num) && num > 0) {
          return Array(num).fill("Colorless");
        }

        // If it's a string that's not a number, treat as single energy type
        if (
          typeof card.ext_retreat_cost === "string" &&
          card.ext_retreat_cost.trim()
        ) {
          return [card.ext_retreat_cost.trim()];
        }

        return [];
      })(),
      images: parseJSON(card.images),
      tcgplayer: tcg,
      cardmarket: parseJSON(card.cardmarket),
      legalities: parseJSON(card.legalities),
      national_pokedex_numbers: parseJSON(card.national_pokedex_numbers),
      variants: parseJSON(card.variants),
      formattedNumber: card.ext_number || "N/A",
      current_value: card.market_price || card.mid_price || card.low_price || 0,
      price: card.market_price || card.mid_price || card.low_price || 0,
      product_id: card.product_id,
      cardId: card.product_id.toString(),
      rarity: card.ext_rarity,
      artist: card.artist || null,
      images: card.image_url
        ? { small: card.image_url, large: card.image_url }
        : parseJSON(card.images),
      // Derive regulation from release_date if not present
      regulation: (() => {
        // First, check if there's a regulation column in the database
        let regulation = null;
        if (card.ext_regulation) {
          regulation = String(card.ext_regulation).trim().toUpperCase();
          console.log(
            "🎯 Regulation Debug - Found in ext_regulation column:",
            regulation
          );
        }

        // Second, try to get from TCGCSV extendedData - check all possible variations
        if (!regulation && tcg && Array.isArray(tcg.extendedData)) {
          console.log(
            "🎯 Regulation Debug - Checking TCGCSV extendedData, length:",
            tcg.extendedData.length
          );
          // Check for regulation in various name formats
          const regulationEntry = tcg.extendedData.find((ed) => {
            if (!ed) return false;
            const name = String(ed?.name || "")
              .toLowerCase()
              .trim();
            const displayName = String(ed?.displayName || "")
              .toLowerCase()
              .trim();
            const value = ed?.value;
            console.log("🎯 Regulation Debug - Checking entry:", {
              name,
              displayName,
              value,
            });
            return (
              name === "regulation" ||
              name === "regulation mark" ||
              name === "regulationmark" ||
              name === "regulationmarking" ||
              displayName === "regulation" ||
              displayName === "regulation mark" ||
              displayName === "regulationmark"
            );
          });
          if (regulationEntry?.value) {
            regulation = String(regulationEntry.value).trim().toUpperCase();
            console.log(
              "🎯 Regulation Debug - Found in TCGCSV extendedData:",
              regulation,
              "from entry:",
              regulationEntry
            );
          } else {
            console.log(
              "🎯 Regulation Debug - No regulation found in TCGCSV extendedData"
            );
            // Log all extendedData entries for debugging
            console.log(
              "🎯 Regulation Debug - All extendedData entries:",
              JSON.stringify(
                tcg.extendedData.map((ed) => ({
                  name: ed?.name,
                  displayName: ed?.displayName,
                  value: ed?.value,
                })),
                null,
                2
              )
            );
          }
        } else {
          console.log("🎯 Regulation Debug - No TCGCSV extendedData available");
        }

        // If not found, derive from release_date
        if (!regulation && card.release_date) {
          console.log(
            "🎯 Regulation Debug - release_date:",
            card.release_date,
            "type:",
            typeof card.release_date
          );
          const date = new Date(card.release_date);
          console.log(
            "🎯 Regulation Debug - parsed date:",
            date,
            "isValid:",
            !isNaN(date.getTime())
          );

          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            console.log("🎯 Regulation Debug - year:", year);
            if (year < 2021) regulation = "A";
            else if (year === 2021) regulation = "B";
            else if (year === 2022) regulation = "C";
            else if (year === 2023) regulation = "D";
            else if (year === 2024) regulation = "E";
            else if (year === 2025) regulation = "F";
            else if (year === 2026) regulation = "G";
            else if (year === 2027) regulation = "H";
            else if (year >= 2028) regulation = "I";
            else regulation = "A";
            console.log(
              "🎯 Regulation Debug - derived regulation from date:",
              regulation
            );
          } else {
            console.log(
              "🎯 Regulation Debug - Invalid date, cannot derive regulation"
            );
          }
        } else if (!card.release_date) {
          console.log(
            "🎯 Regulation Debug - No release_date available for card:",
            card.product_id
          );
        }

        // Default to 'A' if nothing found
        const finalRegulation = regulation || "A";
        console.log(
          "🎯 Regulation Debug - Final regulation for card",
          card.product_id,
          ":",
          finalRegulation
        );
        return finalRegulation;
      })(),
      regulation_mark: (() => {
        // Use the same logic as regulation field
        // First, check if there's a regulation column in the database
        let regulation = null;
        if (card.ext_regulation) {
          regulation = String(card.ext_regulation).trim().toUpperCase();
        }

        // Second, try to get from TCGCSV extendedData
        if (!regulation && tcg && Array.isArray(tcg.extendedData)) {
          const regulationEntry = tcg.extendedData.find((ed) => {
            const n = (ed?.name || ed?.displayName || "")
              .toString()
              .toLowerCase();
            return (
              n === "regulation" ||
              n === "regulation mark" ||
              n === "regulationmark"
            );
          });
          if (regulationEntry?.value) {
            regulation = String(regulationEntry.value).trim().toUpperCase();
          }
        }

        // If not found, derive from release_date
        if (!regulation && card.release_date) {
          const date = new Date(card.release_date);
          if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            if (year < 2021) regulation = "A";
            else if (year === 2021) regulation = "B";
            else if (year === 2022) regulation = "C";
            else if (year === 2023) regulation = "D";
            else if (year === 2024) regulation = "E";
            else if (year === 2025) regulation = "F";
            else if (year === 2026) regulation = "G";
            else if (year === 2027) regulation = "H";
            else if (year >= 2028) regulation = "I";
            else regulation = "A";
          }
        }

        return regulation || "A";
      })(),
    };

    console.log(
      "🎴 Stage Debug - Final formattedCard.stage:",
      formattedCard.stage
    );
    console.log(
      "🎴 Weakness Debug - Final weaknesses:",
      JSON.stringify(weaknesses, null, 2)
    );
    console.log("🎴 Weakness Debug - ext_weakness from DB:", card.ext_weakness);
    console.log(
      "🎴 Resistance Debug - Final resistances:",
      JSON.stringify(resistances, null, 2)
    );
    console.log(
      "🎴 Stage Debug - Sending response with stage:",
      formattedCard.stage
    );
    res.json({ data: formattedCard });
  } catch (error) {
    console.error("Error fetching card:", error);
    res.status(500).json({ error: "Failed to fetch card" });
  }
});

// Get condition-based pricing for a card
router.get("/:id/condition-prices", async (req, res) => {
  try {
    const { id } = req.params;
    const variant = req.query.variant || "Normal"; // Get variant from query params

    // Build source pattern based on variant
    let sourcePattern = "pokemonpricetracker-%";
    if (variant !== "Normal") {
      const variantKey = variant.toLowerCase().replace(/\s+/g, "-");
      sourcePattern = `pokemonpricetracker-${variantKey}-%`;
    } else {
      // For Normal variant, exclude variant-specific sources
      sourcePattern = "pokemonpricetracker-%";
    }

    const sql = `
      SELECT condition, grade, price, date, source
      FROM price_history ph1
      WHERE product_id = ?
        AND source LIKE ?
        AND date = (
          SELECT MAX(date) 
          FROM price_history ph2 
          WHERE ph2.product_id = ph1.product_id
            AND ph2.source LIKE ?
        )
        ${
          variant !== "Normal"
            ? `AND source NOT LIKE 'pokemonpricetracker-raw'`
            : `AND source NOT LIKE 'pokemonpricetracker-%holofoil%' AND source NOT LIKE 'pokemonpricetracker-%reverse%'`
        }
      ORDER BY 
        CASE condition
          WHEN 'Near Mint' THEN 1
          WHEN 'Lightly Played' THEN 2
          WHEN 'Moderately Played' THEN 3
          WHEN 'Heavily Played' THEN 4
          WHEN 'Damaged' THEN 5
          WHEN 'Graded' THEN 6
          ELSE 7
        END,
        CASE WHEN grade IS NOT NULL THEN 0 ELSE 1 END,
        grade DESC
    `;

    const prices = await query(sql, [id, sourcePattern, sourcePattern]);

    // Get the variant's base price from the card
    const cardSql = `
      SELECT market_price, mid_price, low_price
      FROM products
      WHERE product_id = ?
    `;
    const card = await get(cardSql, [id]);
    const basePrice = card?.market_price || card?.mid_price || 0;

    // Display raw prices from the API without multipliers
    // Group by condition and grade
    const groupedPrices = {};
    prices.forEach((row) => {
      if (row.condition === "Graded") {
        const key = `PSA ${row.grade}`;
        if (!groupedPrices[key]) {
          groupedPrices[key] = [];
        }
        groupedPrices[key].push({
          price: row.price, // Display raw price from API
          date: row.date,
          source: row.source,
        });
      } else {
        if (!groupedPrices[row.condition]) {
          groupedPrices[row.condition] = [];
        }
        groupedPrices[row.condition].push({
          price: row.price, // Display raw price from API
          date: row.date,
          source: row.source,
        });
      }
    });

    // Take the most recent price for each condition
    const latestPrices = {};
    Object.keys(groupedPrices).forEach((condition) => {
      const sortedPrices = groupedPrices[condition].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      latestPrices[condition] = sortedPrices[0].price;
    });

    res.json({
      success: true,
      data: latestPrices,
      source: prices[0]?.source || "pokemonpricetracker",
      hasData: Object.keys(latestPrices).length > 0,
    });
  } catch (error) {
    console.error("Error fetching condition prices:", error);
    res.status(500).json({ error: "Failed to fetch condition prices" });
  }
});

// Get available variants for a card
router.get("/:id/variants", async (req, res) => {
  try {
    const { id } = req.params;

    // Get available variants from price_history database
    const variantsSql = `
      SELECT DISTINCT 
        CASE 
          WHEN source LIKE 'pokemonpricetracker-holofoil-%' THEN 'Holofoil'
          WHEN source LIKE 'pokemonpricetracker-reverse-holofoil-%' THEN 'Reverse Holofoil'
          WHEN source LIKE 'pokemonpricetracker-normal-%' THEN 'Normal'
          ELSE 'Normal'
        END as variant_name,
        condition,
        price,
        date
      FROM price_history
      WHERE product_id = ?
        AND source LIKE 'pokemonpricetracker-%'
        AND date = (
          SELECT MAX(date) 
          FROM price_history 
          WHERE product_id = ? 
            AND source LIKE 'pokemonpricetracker-%'
        )
      ORDER BY variant_name, condition
    `;

    const variantData = await query(variantsSql, [id, id]);

    if (!variantData || variantData.length === 0) {
      return res.json({
        success: true,
        variants: [{ name: "Normal", price: 0 }],
      });
    }

    // Group by variant and get Near Mint price for each
    const variants = [];
    const variantMap = {};

    variantData.forEach((row) => {
      if (!variantMap[row.variant_name]) {
        variantMap[row.variant_name] = {
          name: row.variant_name,
          conditions: {},
        };
      }
      variantMap[row.variant_name].conditions[row.condition] = row.price;
    });

    // Convert to variants array with Near Mint price as main price
    Object.values(variantMap).forEach((variant) => {
      const nearMintPrice = variant.conditions["Near Mint"] || 0;
      variants.push({
        product_id: id,
        name: variant.name,
        price: nearMintPrice,
        market_price: nearMintPrice,
        low_price: variant.conditions["Damaged"] || 0,
        mid_price: variant.conditions["Lightly Played"] || nearMintPrice,
        high_price: nearMintPrice,
        set_name: "Unknown", // Could be fetched separately if needed
      });
    });

    // Sort by price (highest first)
    variants.sort((a, b) => b.price - a.price);

    res.json({
      success: true,
      variants: variants.length > 0 ? variants : [{ name: "Normal", price: 0 }],
    });
  } catch (error) {
    console.error("Error fetching card variants:", error);
    res.status(500).json({ error: "Failed to fetch card variants" });
  }
});

export default router;
