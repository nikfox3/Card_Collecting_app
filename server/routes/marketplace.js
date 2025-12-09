import express from "express";
import { query } from "../utils/database.js";

const router = express.Router();

// Get all enabled marketplace configurations (public endpoint)
router.get("/config", async (req, res) => {
  try {
    const configs = await query(
      "SELECT platform, enabled, affiliate_link, affiliate_id, logo_path, display_name FROM marketplace_config WHERE enabled = 1 ORDER BY platform ASC"
    );
    
    // Convert to a more usable format for the frontend
    const marketplaceMap = {};
    configs.forEach((config) => {
      marketplaceMap[config.platform] = {
        link: config.affiliate_link || `https://www.${config.platform.toLowerCase()}.com`,
        affiliateId: config.affiliate_id || null,
        logo: config.logo_path,
        displayName: config.display_name || config.platform,
        enabled: config.enabled === 1,
      };
    });
    
    res.json({ success: true, data: marketplaceMap });
  } catch (error) {
    console.error("Error fetching marketplace configs:", error);
    res.status(500).json({ error: "Failed to fetch marketplace configurations" });
  }
});

// Get product marketplace links (public endpoint for frontend)
router.get("/products/:productId/links", async (req, res) => {
  try {
    const { productId } = req.params;

    const links = await query(
      `
      SELECT platform, url
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

export default router;


