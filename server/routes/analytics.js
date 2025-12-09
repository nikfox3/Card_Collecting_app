import express from "express";
import { query, get, run } from "../utils/database.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Track event (public endpoint - called from main app)
router.post("/track", async (req, res) => {
  try {
    const {
      event_type,
      user_id,
      session_id,
      data,
      user_agent,
      screen_size,
      referrer,
    } = req.body;

    await run(
      `INSERT INTO analytics_events (event_type, user_id, session_id, data, user_agent, screen_size, referrer)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        event_type,
        user_id,
        session_id,
        JSON.stringify(data),
        user_agent,
        screen_size,
        referrer,
      ]
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking event:", error);
    // Don't fail - analytics shouldn't break the app
    res.json({ success: false, error: error.message });
  }
});

// Get analytics overview (admin only)
router.get("/overview", requireAdmin, async (req, res) => {
  try {
    const days = req.query.days;
    const timeRange = req.query.timeRange || (days ? `days:${days}` : "days:7");

    // Build date filter based on time range
    let dateFilter = "";
    let dateParams = [];

    if (timeRange === "ytd") {
      // Year-to-date: from January 1st of current year
      dateFilter = `WHERE timestamp >= date('now', 'start of year')`;
    } else if (timeRange === "1year") {
      // Last 365 days
      dateFilter = `WHERE timestamp > datetime('now', '-365 days')`;
    } else if (timeRange.startsWith("days:")) {
      const dayCount = parseInt(timeRange.split(":")[1]) || 7;
      dateFilter = `WHERE timestamp > datetime('now', '-' || ? || ' days')`;
      dateParams = [dayCount];
    } else {
      // Default to 7 days
      dateFilter = `WHERE timestamp > datetime('now', '-7 days')`;
    }

    // Get event-based stats
    const overview = await get(
      `
      SELECT 
        COUNT(DISTINCT user_id) as total_users,
        COUNT(DISTINCT session_id) as total_sessions,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'search' THEN 1 END) as total_searches,
        COUNT(CASE WHEN event_type = 'card_view' THEN 1 END) as total_card_views,
        COUNT(CASE WHEN event_type = 'collection_add' THEN 1 END) as total_collections_added,
        COUNT(CASE WHEN event_type = 'app_open' THEN 1 END) as total_app_opens
      FROM analytics_events
      ${dateFilter}
    `,
      dateParams
    );

    // Get average session time from user_sessions table
    let sessionDateFilter = "";
    let sessionDateParams = [];

    if (timeRange === "ytd") {
      sessionDateFilter = `WHERE started_at >= date('now', 'start of year')`;
    } else if (timeRange === "1year") {
      sessionDateFilter = `WHERE started_at > datetime('now', '-365 days')`;
    } else if (timeRange.startsWith("days:")) {
      const dayCount = parseInt(timeRange.split(":")[1]) || 7;
      sessionDateFilter = `WHERE started_at > datetime('now', '-' || ? || ' days')`;
      sessionDateParams = [dayCount];
    } else {
      sessionDateFilter = `WHERE started_at > datetime('now', '-7 days')`;
    }

    const sessionStats = await get(
      `
      SELECT 
        AVG(CASE WHEN duration_seconds IS NOT NULL AND duration_seconds > 0 THEN duration_seconds END) as avg_session_time_seconds,
        COUNT(*) as total_session_count
      FROM user_sessions
      ${sessionDateFilter}
    `,
      sessionDateParams
    );

    // Combine results
    const combinedOverview = {
      ...overview,
      total_app_opens: overview.total_app_opens || 0,
      avg_session_time_seconds: sessionStats?.avg_session_time_seconds || null,
      total_session_count: sessionStats?.total_session_count || 0,
    };

    res.json({ success: true, data: combinedOverview });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    res.status(500).json({ error: "Failed to fetch analytics" });
  }
});

// Get top searches (admin only)
router.get("/searches/top", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const days = req.query.days;
    const timeRange = req.query.timeRange || (days ? `days:${days}` : "days:7");

    // Build date filter based on time range
    let dateFilter = "";
    let dateParams = [];

    if (timeRange === "ytd") {
      dateFilter = `AND timestamp >= date('now', 'start of year')`;
    } else if (timeRange === "1year") {
      dateFilter = `AND timestamp > datetime('now', '-365 days')`;
    } else if (timeRange.startsWith("days:")) {
      const dayCount = parseInt(timeRange.split(":")[1]) || 7;
      dateFilter = `AND timestamp > datetime('now', '-' || ? || ' days')`;
      dateParams = [dayCount];
    } else {
      dateFilter = `AND timestamp > datetime('now', '-7 days')`;
    }

    const topSearches = await query(
      `
      SELECT 
        JSON_EXTRACT(data, '$.query') as search_term,
        COUNT(*) as search_count,
        AVG(CAST(JSON_EXTRACT(data, '$.results_count') AS INTEGER)) as avg_results
      FROM analytics_events
      WHERE event_type = 'search'
        ${dateFilter}
        AND JSON_EXTRACT(data, '$.query') IS NOT NULL
        AND JSON_EXTRACT(data, '$.query') != ''
      GROUP BY search_term
      ORDER BY search_count DESC
      LIMIT ?
    `,
      [...dateParams, limit]
    );

    res.json({ success: true, data: topSearches });
  } catch (error) {
    console.error("Error fetching top searches:", error);
    res.status(500).json({ error: "Failed to fetch top searches" });
  }
});

// Get most viewed cards (admin only)
router.get("/cards/popular", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const days = req.query.days;
    const timeRange = req.query.timeRange || (days ? `days:${days}` : "days:7");

    // Build date filter based on time range
    let dateFilter = "";
    let dateParams = [];

    if (timeRange === "ytd") {
      dateFilter = `AND timestamp >= date('now', 'start of year')`;
    } else if (timeRange === "1year") {
      dateFilter = `AND timestamp > datetime('now', '-365 days')`;
    } else if (timeRange.startsWith("days:")) {
      const dayCount = parseInt(timeRange.split(":")[1]) || 7;
      dateFilter = `AND timestamp > datetime('now', '-' || ? || ' days')`;
      dateParams = [dayCount];
    } else {
      dateFilter = `AND timestamp > datetime('now', '-7 days')`;
    }

    const popularCards = await query(
      `
      SELECT 
        JSON_EXTRACT(data, '$.card_id') as card_id,
        JSON_EXTRACT(data, '$.card_name') as card_name,
        COUNT(*) as view_count
      FROM analytics_events
      WHERE event_type = 'card_view'
        ${dateFilter}
      GROUP BY card_id
      ORDER BY view_count DESC
      LIMIT ?
    `,
      [...dateParams, limit]
    );

    res.json({ success: true, data: popularCards });
  } catch (error) {
    console.error("Error fetching popular cards:", error);
    res.status(500).json({ error: "Failed to fetch popular cards" });
  }
});

// Get search trends over time (admin only)
router.get("/trends", requireAdmin, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;

    const trends = await query(
      `
      SELECT 
        DATE(timestamp) as date,
        COUNT(CASE WHEN event_type = 'search' THEN 1 END) as searches,
        COUNT(CASE WHEN event_type = 'card_view' THEN 1 END) as card_views,
        COUNT(CASE WHEN event_type = 'collection_add' THEN 1 END) as collections_added,
        COUNT(DISTINCT user_id) as active_users
      FROM analytics_events
      WHERE timestamp > datetime('now', '-' || ? || ' days')
      GROUP BY DATE(timestamp)
      ORDER BY date ASC
    `,
      [days]
    );

    res.json({ success: true, data: trends });
  } catch (error) {
    console.error("Error fetching trends:", error);
    res.status(500).json({ error: "Failed to fetch trends" });
  }
});

// Get recent activity (admin only)
router.get("/activity/recent", requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const activity = await query(
      `
      SELECT 
        event_type,
        user_id,
        timestamp,
        data
      FROM analytics_events
      ORDER BY timestamp DESC
      LIMIT ?
    `,
      [limit]
    );

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

export default router;
