/**
 * Simple API server for Pokémon Card Database
 * Handles search requests from the frontend
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const PokemonCardSearch = require('../database/search');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database search
const cardSearch = new PokemonCardSearch();

// Initialize database connection
cardSearch.init().catch(console.error);

// API Routes

// Search cards with enhanced fuzzy search
app.post('/api/cards/search', async (req, res) => {
  try {
    const { query, ...filters } = req.body;
    console.log('🔍 Enhanced search for:', query, 'with filters:', filters);
    
    const searchOptions = {
      ...filters,
      fuzzySearch: true,
      searchAllFields: true,
      limit: filters.limit || 50
    };
    
    const cards = await cardSearch.searchCards(query, searchOptions);
    console.log(`✅ Found ${cards.length} cards for "${query}"`);
    
    res.json({ 
      cards, 
      query, 
      totalResults: cards.length,
      searchOptions 
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: error.message });
  }
});


// Get card by ID
app.get('/api/cards/:id', async (req, res) => {
  try {
    const card = await cardSearch.getCardById(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(card);
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get database statistics
app.get('/api/cards/stats', async (req, res) => {
  try {
    const stats = await cardSearch.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available sets
app.get('/api/sets', async (req, res) => {
  try {
    const sets = await cardSearch.getSets();
    res.json(sets);
  } catch (error) {
    console.error('Sets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available rarities
app.get('/api/cards/rarities', async (req, res) => {
  try {
    const rarities = await cardSearch.getRarities();
    res.json(rarities);
  } catch (error) {
    console.error('Rarities error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get available types
app.get('/api/cards/types', async (req, res) => {
  try {
    const types = await cardSearch.getTypes();
    res.json(types);
  } catch (error) {
    console.error('Types error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📊 Database: ${path.join(__dirname, '../database/cards.db')}`);
});

module.exports = app;
