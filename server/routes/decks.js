// Deck Management API Routes
// Handles CRUD operations for Pokemon TCG decks

import express from 'express';
import { query, get } from '../utils/database.js';
// import deckValidation from '../services/simpleDeckValidation.js';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import { isProMember, getUserDeckCount } from '../utils/proMembership.js';

const router = express.Router();

// Helper function to extract dominant colors from an image
async function extractColorsFromImage(imageUrl) {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Resize and extract raw pixels
    const image = sharp(buffer).resize(100, 100, { fit: 'inside' });
    const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
    
    // Sample pixels and find most common colors
    const colorMap = new Map();
    const step = info.channels; // RGB = 3, RGBA = 4
    
    for (let i = 0; i < data.length; i += step * 10) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      // Quantize colors to reduce variations
      const quantized = [
        Math.floor(r / 32) * 32,
        Math.floor(g / 32) * 32,
        Math.floor(b / 32) * 32
      ];
      
      const key = quantized.join(',');
      colorMap.set(key, (colorMap.get(key) || 0) + 1);
    }
    
    // Sort by frequency and get top 3
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
    
    return sortedColors.map(([key]) => key.split(',').map(Number));
  } catch (error) {
    console.error('Error extracting colors:', error);
    return null;
  }
}

// Helper function to get user ID from request (placeholder for auth)
const getUserId = (req) => {
  // TODO: Implement proper authentication
  // For now, return a default user ID
  return req.headers['user-id'] || 'default-user';
};

// Helper function to validate a deck
const validateDeck = (deck) => {
  const issues = [];
  const suggestions = [];
  let totalCards = 0;
  
  // Count cards by type
  const cardCounts = {};
  const basicEnergyCount = {};
  let basicPokemonCount = 0;
  
  deck.cards.forEach(deckCard => {
    const card = deckCard.card;
    const cardName = card.name || '';
    const quantity = deckCard.quantity || 0;
    totalCards += quantity;
    
    // Check for Basic Pokémon
    if (card.supertype === 'Pokémon' && !card.subtypes.includes('Stage 1') && !card.subtypes.includes('Stage 2')) {
      basicPokemonCount += quantity;
    }
    
    // Count cards
    if (!cardCounts[cardName]) {
      cardCounts[cardName] = 0;
    }
    cardCounts[cardName] += quantity;
    
    // Check for Energy cards
    if (card.supertype === 'Energy') {
      // Check if basic energy
      if (cardName.toLowerCase().includes('basic') || card.subtypes.includes('Basic')) {
        if (!basicEnergyCount[cardName]) {
          basicEnergyCount[cardName] = 0;
        }
        basicEnergyCount[cardName] += quantity;
      }
    }
  });
  
  // Rule 1: Deck must have exactly 60 cards
  if (totalCards !== 60) {
    issues.push({
      type: 'deck_size',
      severity: 'error',
      message: `Deck must contain exactly 60 cards. Currently has ${totalCards} cards.`,
      current: totalCards,
      required: 60,
      fix: totalCards < 60 
        ? `Add ${60 - totalCards} more card${60 - totalCards !== 1 ? 's' : ''} to your deck.`
        : `Remove ${totalCards - 60} card${totalCards - 60 !== 1 ? 's' : ''} from your deck.`
    });
  } else {
    suggestions.push({
      type: 'deck_size',
      message: 'Deck size is correct (60 cards)',
      status: 'valid'
    });
  }
  
  // Rule 2: Must have at least 1 Basic Pokémon
  if (basicPokemonCount === 0) {
    issues.push({
      type: 'basic_pokemon',
      severity: 'error',
      message: 'Deck must contain at least 1 Basic Pokémon.',
      current: 0,
      required: 1,
      fix: 'Add at least one Basic Pokémon to your deck. (Basic Pokémon are Pokémon that are not Stage 1 or Stage 2)'
    });
  }
  
  // Rule 3: Maximum 4 copies of any card with the same name (except Basic Energy)
  Object.entries(cardCounts).forEach(([cardName, count]) => {
    // Check if this is a basic energy card
    const isBasicEnergy = cardName.toLowerCase().includes('basic') && 
                         (Object.keys(basicEnergyCount).includes(cardName) || 
                          deck.cards.find(dc => dc.card.name === cardName && dc.card.supertype === 'Energy'));
    
    if (!isBasicEnergy && count > 4) {
      issues.push({
        type: 'card_limit',
        severity: 'error',
        message: `Cannot have more than 4 copies of "${cardName}".`,
        card: cardName,
        current: count,
        required: 4,
        fix: `Remove ${count - 4} cop${count - 4 !== 1 ? 'ies' : 'y'} of "${cardName}". You currently have ${count} copies.`
      });
    }
  });
  
  const validation = {
    isValid: issues.length === 0,
    issues: issues,
    suggestions: suggestions,
    stats: {
      totalCards: totalCards,
      uniqueCards: Object.keys(cardCounts).length,
      basicPokemon: basicPokemonCount,
      energyCards: Object.values(basicEnergyCount).reduce((sum, count) => sum + count, 0)
    }
  };
  
  return validation;
};

// Helper function to get deck with cards
const getDeckWithCards = async (deckId) => {
  const deckSql = 'SELECT * FROM decks WHERE id = ?';
  const deckResults = await query(deckSql, [deckId]);
  
  if (deckResults.length === 0) {
    return null;
  }
  
  const deck = deckResults[0];
  
  // Get deck cards with product information
  const cardsSql = `
    SELECT dc.*, p.name, p.ext_card_type, p.image_url, p.ext_rarity, p.sub_type_name
    FROM deck_cards dc
    LEFT JOIN products p ON dc.product_id = p.product_id
    WHERE dc.deck_id = ?
    ORDER BY dc.added_at
  `;
  const cardResults = await query(cardsSql, [deckId]);
  
  deck.cards = cardResults.map(row => ({
    id: row.id,
    product_id: row.product_id,
    card_id: row.product_id, // For backwards compatibility
    quantity: row.quantity,
    is_energy: row.is_energy,
    notes: row.notes,
    added_at: row.added_at,
    card: {
      id: row.product_id,
      product_id: row.product_id,
      name: row.name || `Card ${row.product_id}`,
      supertype: row.ext_card_type ? (row.ext_card_type.includes('Energy') ? 'Energy' : 'Pokémon') : 'Unknown',
      subtypes: row.ext_card_type ? [row.ext_card_type] : [],
      image_url: row.image_url,
      images: row.image_url ? { small: row.image_url } : {},
      rarity: row.ext_rarity || '',
      sub_type_name: row.sub_type_name || ''
    }
  }));
  
  // Calculate total card count from quantities
  deck.card_count = cardResults.reduce((sum, row) => sum + (row.quantity || 0), 0);
  deck.total_cards = deck.card_count;
  
  // Get match statistics
  const matchesSql = 'SELECT result, COUNT(*) as count FROM deck_matches WHERE deck_id = ? GROUP BY result';
  const matchResults = await query(matchesSql, [deckId]);
  
  let wins = 0, losses = 0, draws = 0;
  matchResults.forEach(row => {
    if (row.result === 'win') wins = row.count;
    else if (row.result === 'loss') losses = row.count;
    else if (row.result === 'draw') draws = row.count;
  });
  
  deck.wins = deck.win_count || wins;
  deck.losses = deck.loss_count || losses;
  deck.draws = deck.draw_count || draws;
  deck.win_rate = (deck.wins + deck.losses + deck.draws) > 0 
    ? Math.round((deck.wins / (deck.wins + deck.losses + deck.draws)) * 100) 
    : 0;
  
  return deck;
};

// GET /api/decks - Get all user's decks
router.get('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const sql = `
      SELECT d.*, 
             COALESCE(SUM(dc.quantity), 0) as card_count,
             (SELECT COUNT(*) FROM deck_matches dm WHERE dm.deck_id = d.id AND dm.result = 'win') as wins,
             (SELECT COUNT(*) FROM deck_matches dm WHERE dm.deck_id = d.id AND dm.result = 'loss') as losses,
             (SELECT COUNT(*) FROM deck_matches dm WHERE dm.deck_id = d.id AND dm.result = 'draw') as draws
      FROM decks d
      LEFT JOIN deck_cards dc ON d.id = dc.deck_id
      WHERE d.user_id = ?
      GROUP BY d.id
      ORDER BY d.updated_at DESC
    `;
    
    const decks = await query(sql, [userId]);
    
    // Get first card for each deck
    const decksWithDetails = await Promise.all(decks.map(async (deck) => {
      const firstCardSql = `
        SELECT p.image_url 
        FROM deck_cards dc
        JOIN products p ON dc.product_id = p.product_id
        WHERE dc.deck_id = ?
        ORDER BY dc.added_at
        LIMIT 1
      `;
      const firstCardResult = await query(firstCardSql, [deck.id]);
      
      let dominantColors = null;
      if (firstCardResult[0]?.image_url) {
        dominantColors = await extractColorsFromImage(firstCardResult[0].image_url);
      }
      
      return {
        ...deck,
        validation_issues: deck.validation_issues ? JSON.parse(deck.validation_issues) : [],
        win_rate: deck.wins + deck.losses + deck.draws > 0 
          ? Math.round((deck.wins / (deck.wins + deck.losses + deck.draws)) * 100) 
          : 0,
        first_card_image: firstCardResult[0]?.image_url || null,
        dominant_colors: dominantColors
      };
    }));
    
    res.json({
      success: true,
      data: decksWithDetails
    });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ error: 'Failed to fetch decks' });
  }
});

// GET /api/decks/:id - Get specific deck with full card list
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    const deck = await getDeckWithCards(id);
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    // Check if user owns this deck or if it's public
    if (deck.user_id !== userId && !deck.is_public) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    res.json({
      success: true,
      data: {
        ...deck,
        validation_issues: deck.validation_issues ? JSON.parse(deck.validation_issues) : []
      }
    });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ error: 'Failed to fetch deck' });
  }
});

// POST /api/decks - Create new deck
router.post('/', async (req, res) => {
  try {
    const userId = getUserId(req);
    const { name, format = 'standard', deck_mode = 'casual', description = '' } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Deck name is required' });
    }
    
    // Check pro membership and deck limit
    const isPro = await isProMember(userId);
    if (!isPro) {
      const deckCount = await getUserDeckCount(userId);
      if (deckCount >= 1) {
        return res.status(403).json({ 
          error: 'Deck limit reached',
          message: 'Free users are limited to 1 deck. Upgrade to Pro for unlimited decks!',
          limit: 1,
          current: deckCount,
          requiresPro: true
        });
      }
    }
    
    const deckId = uuidv4();
    const sql = `
      INSERT INTO decks (id, user_id, name, format, deck_mode, description, total_cards)
      VALUES (?, ?, ?, ?, ?, ?, 0)
    `;
    
    await query(sql, [deckId, userId, name.trim(), format, deck_mode, description]);
    
    const newDeck = await getDeckWithCards(deckId);
    
    res.status(201).json({
      success: true,
      data: newDeck
    });
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ error: 'Failed to create deck' });
  }
});

// PUT /api/decks/:id - Update deck
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { name, format, deck_mode, description, is_public, allow_cloning } = req.body;
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Build update query dynamically
    const updates = [];
    const params = [];
    
    if (name !== undefined) {
      updates.push('name = ?');
      params.push(name.trim());
    }
    if (format !== undefined) {
      updates.push('format = ?');
      params.push(format);
    }
    if (deck_mode !== undefined) {
      updates.push('deck_mode = ?');
      params.push(deck_mode);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      params.push(description);
    }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      params.push(is_public);
    }
    if (allow_cloning !== undefined) {
      updates.push('allow_cloning = ?');
      params.push(allow_cloning);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(id);
    const sql = `UPDATE decks SET ${updates.join(', ')} WHERE id = ?`;
    
    await query(sql, params);
    
    const updatedDeck = await getDeckWithCards(id);
    
    res.json({
      success: true,
      data: updatedDeck
    });
  } catch (error) {
    console.error('Error updating deck:', error);
    res.status(500).json({ error: 'Failed to update deck' });
  }
});

// DELETE /api/decks/:id - Delete deck
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Delete deck (cascade will handle related records)
    const sql = 'DELETE FROM decks WHERE id = ?';
    await query(sql, [id]);
    
    res.json({
      success: true,
      message: 'Deck deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ error: 'Failed to delete deck' });
  }
});

// POST /api/decks/:id/validate - Validate deck against format rules
router.post('/:id/validate', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    const deck = await getDeckWithCards(id);
    
    if (!deck) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (deck.user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Validate deck against TCG rules
    const validation = validateDeck(deck);
    
    // Update deck with validation results
    const updateSql = `
      UPDATE decks 
      SET is_valid = ?, validation_issues = ?, total_cards = ?
      WHERE id = ?
    `;
    
    await query(updateSql, [
      validation.isValid,
      JSON.stringify(validation.issues),
      validation.stats.totalCards,
      id
    ]);
    
    res.json({
      success: true,
      data: {
        ...validation,
        deck: {
          ...deck,
          is_valid: validation.isValid,
          validation_issues: validation.issues,
          total_cards: validation.stats.totalCards
        }
      }
    });
  } catch (error) {
    console.error('Error validating deck:', error);
    res.status(500).json({ error: 'Failed to validate deck' });
  }
});

// GET /api/decks/:id/statistics - Get win/loss stats and performance
router.get('/:id/statistics', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get match statistics
    const statsSql = `
      SELECT 
        COUNT(*) as total_matches,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses,
        SUM(CASE WHEN result = 'draw' THEN 1 ELSE 0 END) as draws,
        AVG(CASE WHEN result = 'win' THEN 1.0 ELSE 0.0 END) as win_rate
      FROM deck_matches 
      WHERE deck_id = ?
    `;
    
    const statsResults = await query(statsSql, [id]);
    const stats = statsResults[0];
    
    // Get recent matches
    const recentMatchesSql = `
      SELECT * FROM deck_matches 
      WHERE deck_id = ? 
      ORDER BY match_date DESC 
      LIMIT 10
    `;
    
    const recentMatches = await query(recentMatchesSql, [id]);
    
    // Get opponent breakdown
    const opponentSql = `
      SELECT 
        opponent_deck_type,
        COUNT(*) as matches,
        SUM(CASE WHEN result = 'win' THEN 1 ELSE 0 END) as wins,
        SUM(CASE WHEN result = 'loss' THEN 1 ELSE 0 END) as losses
      FROM deck_matches 
      WHERE deck_id = ? AND opponent_deck_type IS NOT NULL
      GROUP BY opponent_deck_type
      ORDER BY matches DESC
      LIMIT 10
    `;
    
    const opponents = await query(opponentSql, [id]);
    
    res.json({
      success: true,
      data: {
        total_matches: stats.total_matches || 0,
        wins: stats.wins || 0,
        losses: stats.losses || 0,
        draws: stats.draws || 0,
        win_rate: Math.round((stats.win_rate || 0) * 100),
        recent_matches: recentMatches,
        opponents: opponents.map(opp => ({
          ...opp,
          win_rate: opp.matches > 0 ? Math.round((opp.wins / opp.matches) * 100) : 0
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching deck statistics:', error);
    res.status(500).json({ error: 'Failed to fetch deck statistics' });
  }
});

// POST /api/decks/:id/cards - Add card to deck
router.post('/:id/cards', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { card_id, quantity = 1, notes = '' } = req.body;
    
    if (!card_id) {
      return res.status(400).json({ error: 'Card ID is required' });
    }
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if card exists in products table
    const cardSql = 'SELECT product_id, name, ext_card_type FROM products WHERE product_id = ?';
    const cardResults = await query(cardSql, [card_id]);
    
    if (cardResults.length === 0) {
      return res.status(404).json({ error: 'Card not found' });
    }
    
    const card = cardResults[0];
    const isEnergy = card.ext_card_type && card.ext_card_type.includes('Energy');
    
    // Check if card already exists in deck
    const existingSql = 'SELECT id, quantity FROM deck_cards WHERE deck_id = ? AND product_id = ?';
    const existingResults = await query(existingSql, [id, card_id]);
    
    if (existingResults.length > 0) {
      // Update existing card quantity
      const newQuantity = existingResults[0].quantity + quantity;
      const maxQuantity = isEnergy && card.ext_card_type === 'Basic Energy' ? 999 : 4; // Basic Energy has no limit
      
      if (newQuantity > maxQuantity) {
        return res.status(400).json({ 
          error: `Cannot add more than ${maxQuantity} copies of ${card.name}` 
        });
      }
      
      const updateSql = 'UPDATE deck_cards SET quantity = ?, notes = ? WHERE id = ?';
      await query(updateSql, [newQuantity, notes, existingResults[0].id]);
    } else {
      // Add new card to deck
      const insertSql = `
        INSERT INTO deck_cards (deck_id, product_id, quantity, is_energy, notes)
        VALUES (?, ?, ?, ?, ?)
      `;
      await query(insertSql, [id, card_id, quantity, isEnergy, notes]);
    }
    
    // Update deck total cards count
    const countSql = 'SELECT SUM(quantity) as total FROM deck_cards WHERE deck_id = ?';
    const countResults = await query(countSql, [id]);
    const totalCards = countResults[0].total || 0;
    
    const updateDeckSql = 'UPDATE decks SET total_cards = ? WHERE id = ?';
    await query(updateDeckSql, [totalCards, id]);
    
    const updatedDeck = await getDeckWithCards(id);
    
    res.json({
      success: true,
      data: updatedDeck
    });
  } catch (error) {
    console.error('Error adding card to deck:', error);
    res.status(500).json({ error: 'Failed to add card to deck' });
  }
});

// PUT /api/decks/:id/cards/:cardId - Update card quantity
router.put('/:id/cards/:cardId', async (req, res) => {
  try {
    const { id, cardId } = req.params;
    const userId = getUserId(req);
    const { quantity, notes } = req.body;
    
    if (quantity === undefined && notes === undefined) {
      return res.status(400).json({ error: 'Quantity or notes must be provided' });
    }
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if card exists in deck
    const cardSql = `
      SELECT dc.*, p.name, p.ext_card_type 
      FROM deck_cards dc
      JOIN products p ON dc.product_id = p.product_id
      WHERE dc.deck_id = ? AND dc.product_id = ?
    `;
    const cardResults = await query(cardSql, [id, cardId]);
    
    if (cardResults.length === 0) {
      return res.status(404).json({ error: 'Card not found in deck' });
    }
    
    const deckCard = cardResults[0];
    const isEnergy = deckCard.ext_card_type && 
                    deckCard.ext_card_type.includes('Energy') &&
                    deckCard.ext_card_type === 'Basic Energy';
    
    // Validate quantity
    if (quantity !== undefined) {
      if (quantity < 1) {
        return res.status(400).json({ error: 'Quantity must be at least 1' });
      }
      
      const maxQuantity = isEnergy ? 999 : 4;
      if (quantity > maxQuantity) {
        return res.status(400).json({ 
          error: `Cannot have more than ${maxQuantity} copies of ${deckCard.name}` 
        });
      }
    }
    
    // Update card
    const updates = [];
    const params = [];
    
    if (quantity !== undefined) {
      updates.push('quantity = ?');
      params.push(quantity);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    
    params.push(id, cardId);
    const updateSql = `
      UPDATE deck_cards 
      SET ${updates.join(', ')} 
      WHERE deck_id = ? AND product_id = ?
    `;
    
    await query(updateSql, params);
    
    // Update deck total cards count
    const countSql = 'SELECT SUM(quantity) as total FROM deck_cards WHERE deck_id = ?';
    const countResults = await query(countSql, [id]);
    const totalCards = countResults[0].total || 0;
    
    const updateDeckSql = 'UPDATE decks SET total_cards = ? WHERE id = ?';
    await query(updateDeckSql, [totalCards, id]);
    
    const updatedDeck = await getDeckWithCards(id);
    
    res.json({
      success: true,
      data: updatedDeck
    });
  } catch (error) {
    console.error('Error updating card in deck:', error);
    res.status(500).json({ error: 'Failed to update card in deck' });
  }
});

// DELETE /api/decks/:id/cards/:cardId - Remove card from deck
router.delete('/:id/cards/:cardId', async (req, res) => {
  try {
    const { id, cardId } = req.params;
    const userId = getUserId(req);
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if card exists in deck
    const cardSql = 'SELECT id FROM deck_cards WHERE deck_id = ? AND product_id = ?';
    const cardResults = await query(cardSql, [id, cardId]);
    
    if (cardResults.length === 0) {
      return res.status(404).json({ error: 'Card not found in deck' });
    }
    
    // Remove card from deck
    const deleteSql = 'DELETE FROM deck_cards WHERE deck_id = ? AND product_id = ?';
    await query(deleteSql, [id, cardId]);
    
    // Update deck total cards count
    const countSql = 'SELECT SUM(quantity) as total FROM deck_cards WHERE deck_id = ?';
    const countResults = await query(countSql, [id]);
    const totalCards = countResults[0].total || 0;
    
    const updateDeckSql = 'UPDATE decks SET total_cards = ? WHERE id = ?';
    await query(updateDeckSql, [totalCards, id]);
    
    const updatedDeck = await getDeckWithCards(id);
    
    res.json({
      success: true,
      data: updatedDeck
    });
  } catch (error) {
    console.error('Error removing card from deck:', error);
    res.status(500).json({ error: 'Failed to remove card from deck' });
  }
});

// GET /api/decks/:id/matches - Get match history
router.get('/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const sql = `
      SELECT * FROM deck_matches 
      WHERE deck_id = ? 
      ORDER BY match_date DESC, created_at DESC
    `;
    
    const matches = await query(sql, [id]);
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching match history:', error);
    res.status(500).json({ error: 'Failed to fetch match history' });
  }
});

// POST /api/decks/:id/matches - Record new match
router.post('/:id/matches', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = getUserId(req);
    const { result, opponent_deck_type, match_date, format, notes } = req.body;
    
    if (!result || !['win', 'loss', 'draw'].includes(result)) {
      return res.status(400).json({ error: 'Valid result (win/loss/draw) is required' });
    }
    
    if (!match_date) {
      return res.status(400).json({ error: 'Match date is required' });
    }
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const sql = `
      INSERT INTO deck_matches (deck_id, user_id, result, opponent_deck_type, match_date, format, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    await query(sql, [id, userId, result, opponent_deck_type, match_date, format, notes]);
    
    // Update deck win/loss counts
    const updateSql = `
      UPDATE decks SET 
        win_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'win'),
        loss_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'loss'),
        draw_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'draw')
      WHERE id = ?
    `;
    
    await query(updateSql, [id, id, id, id]);
    
    // Get updated match history
    const matchesSql = `
      SELECT * FROM deck_matches 
      WHERE deck_id = ? 
      ORDER BY match_date DESC, created_at DESC
    `;
    
    const matches = await query(matchesSql, [id]);
    
    res.status(201).json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error recording match:', error);
    res.status(500).json({ error: 'Failed to record match' });
  }
});

// PUT /api/decks/:id/matches/:matchId - Update match
router.put('/:id/matches/:matchId', async (req, res) => {
  try {
    const { id, matchId } = req.params;
    const userId = getUserId(req);
    const { result, opponent_deck_type, match_date, format, notes } = req.body;
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if match exists
    const matchSql = 'SELECT id FROM deck_matches WHERE id = ? AND deck_id = ?';
    const matchResults = await query(matchSql, [matchId, id]);
    
    if (matchResults.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Build update query
    const updates = [];
    const params = [];
    
    if (result !== undefined) {
      if (!['win', 'loss', 'draw'].includes(result)) {
        return res.status(400).json({ error: 'Invalid result (must be win/loss/draw)' });
      }
      updates.push('result = ?');
      params.push(result);
    }
    if (opponent_deck_type !== undefined) {
      updates.push('opponent_deck_type = ?');
      params.push(opponent_deck_type);
    }
    if (match_date !== undefined) {
      updates.push('match_date = ?');
      params.push(match_date);
    }
    if (format !== undefined) {
      updates.push('format = ?');
      params.push(format);
    }
    if (notes !== undefined) {
      updates.push('notes = ?');
      params.push(notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    params.push(matchId);
    const updateSql = `UPDATE deck_matches SET ${updates.join(', ')} WHERE id = ?`;
    
    await query(updateSql, params);
    
    // Update deck win/loss counts
    const updateDeckSql = `
      UPDATE decks SET 
        win_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'win'),
        loss_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'loss'),
        draw_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'draw')
      WHERE id = ?
    `;
    
    await query(updateDeckSql, [id, id, id, id]);
    
    // Get updated match history
    const matchesSql = `
      SELECT * FROM deck_matches 
      WHERE deck_id = ? 
      ORDER BY match_date DESC, created_at DESC
    `;
    
    const matches = await query(matchesSql, [id]);
    
    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// DELETE /api/decks/:id/matches/:matchId - Delete match
router.delete('/:id/matches/:matchId', async (req, res) => {
  try {
    const { id, matchId } = req.params;
    const userId = getUserId(req);
    
    // Check if deck exists and user owns it
    const checkSql = 'SELECT user_id FROM decks WHERE id = ?';
    const checkResults = await query(checkSql, [id]);
    
    if (checkResults.length === 0) {
      return res.status(404).json({ error: 'Deck not found' });
    }
    
    if (checkResults[0].user_id !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if match exists
    const matchSql = 'SELECT id FROM deck_matches WHERE id = ? AND deck_id = ?';
    const matchResults = await query(matchSql, [matchId, id]);
    
    if (matchResults.length === 0) {
      return res.status(404).json({ error: 'Match not found' });
    }
    
    // Delete match
    const deleteSql = 'DELETE FROM deck_matches WHERE id = ?';
    await query(deleteSql, [matchId]);
    
    // Update deck win/loss counts
    const updateDeckSql = `
      UPDATE decks SET 
        win_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'win'),
        loss_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'loss'),
        draw_count = (SELECT COUNT(*) FROM deck_matches WHERE deck_id = ? AND result = 'draw')
      WHERE id = ?
    `;
    
    await query(updateDeckSql, [id, id, id, id]);
    
    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

export default router;
