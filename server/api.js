const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Database path
const DB_PATH = path.join(__dirname, '../database/cards.db');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database connection
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
  }
});

// Helper function to run queries
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// Helper function to run single query
const runQuerySingle = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Routes

// Get all cards with pagination
app.get('/api/cards', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;
    
    const sql = `
      SELECT c.*, s.name as set_name, s.series
      FROM cards c
      JOIN sets s ON c.set_id = s.id
      ORDER BY c.name
      LIMIT ? OFFSET ?
    `;
    
    const cards = await runQuery(sql, [limit, offset]);
    
    // Get total count
    const countResult = await runQuerySingle('SELECT COUNT(*) as total FROM cards');
    const total = countResult.total;
    
    res.json({
      data: cards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Search cards
app.get('/api/cards/search', async (req, res) => {
  try {
    const query = req.query.q || '';
    const limit = parseInt(req.query.limit) || 50;
    
    if (!query) {
      return res.json({ data: [] });
    }
    
    // Use LIKE search instead of FTS for now
    const sql = `
      SELECT c.*, s.name as set_name, s.series
      FROM cards c
      JOIN sets s ON c.set_id = s.id
      WHERE c.name LIKE ? OR s.name LIKE ?
      ORDER BY c.name
      LIMIT ?
    `;
    
    const searchTerm = `%${query}%`;
    const cards = await runQuery(sql, [searchTerm, searchTerm, limit]);
    res.json({ data: cards });
  } catch (error) {
    console.error('Error searching cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trending cards (must come before /:id route)
app.get('/api/cards/trending', async (req, res) => {
  try {
    const sql = `
      SELECT c.*, s.name as set_name, s.series
      FROM cards c
      JOIN sets s ON c.set_id = s.id
      WHERE c.rarity IN ('Rare Holo', 'Ultra Rare', 'VMAX', 'V')
      ORDER BY c.current_value DESC
      LIMIT 8
    `;
    
    const cards = await runQuery(sql);
    res.json({ data: cards });
  } catch (error) {
    console.error('Error fetching trending cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top movers (must come before /:id route)
app.get('/api/cards/top-movers', async (req, res) => {
  try {
    // Get specific high-value cards for dashboard display
    const sql = `
      SELECT c.*, s.name as set_name, s.series
      FROM cards c
      JOIN sets s ON c.set_id = s.id
      WHERE (c.name IN ('Charizard', 'Blastoise') 
             AND s.name = 'Base' 
             AND c.current_value > 50)
         OR (c.name = 'Erika''s Venusaur' 
             AND s.name = 'Gym Challenge' 
             AND c.current_value > 50)
      ORDER BY c.current_value DESC
      LIMIT 8
    `;
    
    const cards = await runQuery(sql);
    res.json({ data: cards });
  } catch (error) {
    console.error('Error fetching top movers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get card by ID (must come after specific routes)
app.get('/api/cards/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT c.*, s.name as set_name, s.series
      FROM cards c
      JOIN sets s ON c.set_id = s.id
      WHERE c.id = ?
    `;
    
    const card = await runQuerySingle(sql, [id]);
    
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    res.json({ data: card });
  } catch (error) {
    console.error('Error fetching card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get cards by set
app.get('/api/sets/:setId/cards', async (req, res) => {
  try {
    const { setId } = req.params;
    const limit = parseInt(req.query.limit) || 50;
    
    const sql = `
      SELECT c.*, s.name as set_name, s.series
      FROM cards c
      JOIN sets s ON c.set_id = s.id
      WHERE c.set_id = ?
      ORDER BY c.name
      LIMIT ?
    `;
    
    const cards = await runQuery(sql, [setId, limit]);
    res.json({ data: cards });
  } catch (error) {
    console.error('Error fetching cards by set:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all sets
app.get('/api/sets', async (req, res) => {
  try {
    const sql = 'SELECT * FROM sets ORDER BY name';
    const sets = await runQuery(sql);
    res.json({ data: sets });
  } catch (error) {
    console.error('Error fetching sets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Database: ${DB_PATH}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

module.exports = app;