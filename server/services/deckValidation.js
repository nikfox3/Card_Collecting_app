// Deck Validation Service
// Validates Pokemon TCG decks against official rules and format requirements

import { query } from '../utils/database.js';

class DeckValidationService {
  constructor() {
    this.validationRules = {
      standard: {
        minCards: 60,
        maxCards: 60,
        maxCopies: 4,
        requiresBasicPokemon: true,
        allowedRegulationMarks: ['F', 'G', 'H'], // Current Standard format marks
        bannedCards: [] // Add banned cards as needed
      },
      expanded: {
        minCards: 60,
        maxCards: 60,
        maxCopies: 4,
        requiresBasicPokemon: true,
        allowedRegulationMarks: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], // All regulation marks
        bannedCards: [] // Add banned cards as needed
      },
      unlimited: {
        minCards: 60,
        maxCards: 60,
        maxCopies: 4,
        requiresBasicPokemon: true,
        allowedRegulationMarks: null, // All cards allowed
        bannedCards: [] // Add banned cards as needed
      },
      custom: {
        minCards: 1,
        maxCards: 1000,
        maxCopies: 4,
        requiresBasicPokemon: false,
        allowedRegulationMarks: null,
        bannedCards: []
      }
    };
  }

  /**
   * Validate a deck against format rules
   * @param {Object} deck - Deck object with cards array
   * @param {string} format - Format to validate against
   * @param {string} mode - 'casual' or 'tournament'
   * @returns {Object} Validation result with issues and suggestions
   */
  async validateDeck(deck, format = 'standard', mode = 'casual') {
    const rules = this.validationRules[format];
    if (!rules) {
      return {
        isValid: false,
        issues: [`Unknown format: ${format}`],
        suggestions: []
      };
    }

    const issues = [];
    const suggestions = [];
    let totalCards = 0;
    const cardCounts = {};
    let hasBasicPokemon = false;

    // Get card details from database
    const cardIds = deck.cards.map(c => c.card_id);
    if (cardIds.length === 0) {
      return {
        isValid: mode === 'casual',
        issues: mode === 'tournament' ? ['Deck must contain at least 1 card'] : [],
        suggestions: mode === 'tournament' ? ['Add cards to your deck'] : []
      };
    }

    const cardDetails = await this.getCardDetails(cardIds);

    // Validate each card
    for (const deckCard of deck.cards) {
      const card = cardDetails.find(c => c.id === deckCard.card_id);
      if (!card) {
        issues.push(`Card not found: ${deckCard.card_id}`);
        continue;
      }

      totalCards += deckCard.quantity;

      // Count card copies
      if (!cardCounts[card.name]) {
        cardCounts[card.name] = 0;
      }
      cardCounts[card.name] += deckCard.quantity;

      // Check for Basic Pokemon
      if (card.supertype === 'Pokémon' && card.subtypes && 
          card.subtypes.includes('Basic')) {
        hasBasicPokemon = true;
      }

      // Check regulation marks for Standard/Expanded
      if (format === 'standard' || format === 'expanded') {
        if (card.regulation && rules.allowedRegulationMarks && 
            !rules.allowedRegulationMarks.includes(card.regulation)) {
          issues.push(`${card.name} (${card.regulation}) is not legal in ${format} format`);
          suggestions.push(`Remove ${card.name} or switch to a different format`);
        }
      }

      // Check for banned cards
      if (rules.bannedCards.includes(card.name)) {
        issues.push(`${card.name} is banned in ${format} format`);
        suggestions.push(`Remove ${card.name} from your deck`);
      }
    }

    // Validate card count
    if (mode === 'tournament') {
      if (totalCards < rules.minCards) {
        issues.push(`Deck must contain exactly ${rules.minCards} cards (currently ${totalCards})`);
        suggestions.push(`Add ${rules.minCards - totalCards} more cards`);
      } else if (totalCards > rules.maxCards) {
        issues.push(`Deck must contain exactly ${rules.maxCards} cards (currently ${totalCards})`);
        suggestions.push(`Remove ${totalCards - rules.maxCards} cards`);
      }
    } else {
      // Casual mode - more lenient
      if (totalCards < rules.minCards) {
        issues.push(`Recommended minimum: ${rules.minCards} cards (currently ${totalCards})`);
        suggestions.push(`Consider adding more cards for better consistency`);
      }
    }

    // Validate card copy limits
    for (const [cardName, count] of Object.entries(cardCounts)) {
      const card = cardDetails.find(c => c.name === cardName);
      const isBasicEnergy = card && card.supertype === 'Energy' && 
                           card.subtypes && card.subtypes.includes('Basic');
      
      if (!isBasicEnergy && count > rules.maxCopies) {
        issues.push(`Too many copies of ${cardName} (${count}/${rules.maxCopies})`);
        suggestions.push(`Remove ${count - rules.maxCopies} copies of ${cardName}`);
      }
    }

    // Check for Basic Pokemon requirement
    if (rules.requiresBasicPokemon && !hasBasicPokemon) {
      issues.push('Deck must contain at least one Basic Pokémon');
      suggestions.push('Add at least one Basic Pokémon to start the game');
    }

    // Additional deck composition suggestions
    if (mode === 'casual' && totalCards > 0) {
      const pokemonCount = deck.cards.filter(c => {
        const card = cardDetails.find(cd => cd.id === c.card_id);
        return card && card.supertype === 'Pokémon';
      }).reduce((sum, c) => sum + c.quantity, 0);

      const trainerCount = deck.cards.filter(c => {
        const card = cardDetails.find(cd => cd.id === c.card_id);
        return card && card.supertype === 'Trainer';
      }).reduce((sum, c) => sum + c.quantity, 0);

      const energyCount = deck.cards.filter(c => {
        const card = cardDetails.find(cd => cd.id === c.card_id);
        return card && card.supertype === 'Energy';
      }).reduce((sum, c) => sum + c.quantity, 0);

      // Suggest better ratios
      if (pokemonCount < 10) {
        suggestions.push('Consider adding more Pokémon (recommended: 15-20)');
      }
      if (trainerCount < 15) {
        suggestions.push('Consider adding more Trainer cards (recommended: 20-30)');
      }
      if (energyCount < 5) {
        suggestions.push('Consider adding more Energy cards (recommended: 8-12)');
      }
    }

    const isValid = issues.length === 0 || (mode === 'casual' && issues.every(issue => 
      issue.includes('Recommended') || issue.includes('Consider')
    ));

    return {
      isValid,
      issues,
      suggestions,
      stats: {
        totalCards,
        pokemonCount: deck.cards.filter(c => {
          const card = cardDetails.find(cd => cd.id === c.card_id);
          return card && card.supertype === 'Pokémon';
        }).reduce((sum, c) => sum + c.quantity, 0),
        trainerCount: deck.cards.filter(c => {
          const card = cardDetails.find(cd => cd.id === c.card_id);
          return card && card.supertype === 'Trainer';
        }).reduce((sum, c) => sum + c.quantity, 0),
        energyCount: deck.cards.filter(c => {
          const card = cardDetails.find(cd => cd.id === c.card_id);
          return card && card.supertype === 'Energy';
        }).reduce((sum, c) => sum + c.quantity, 0)
      }
    };
  }

  /**
   * Get card details from database
   * @param {Array} cardIds - Array of card IDs
   * @returns {Array} Card details
   */
  async getCardDetails(cardIds) {
    if (cardIds.length === 0) return [];
    
    const placeholders = cardIds.map(() => '?').join(',');
    const sql = `
      SELECT id, name, supertype, subtypes, regulation, legalities
      FROM cards 
      WHERE id IN (${placeholders})
    `;
    
    try {
      const results = await query(sql, cardIds);
      return results.map(row => ({
        ...row,
        subtypes: row.subtypes ? JSON.parse(row.subtypes) : []
      }));
    } catch (error) {
      console.error('Error fetching card details:', error);
      return [];
    }
  }

  /**
   * Get format legality for a card
   * @param {string} cardId - Card ID
   * @param {string} format - Format to check
   * @returns {boolean} Is card legal in format
   */
  async isCardLegalInFormat(cardId, format) {
    const rules = this.validationRules[format];
    if (!rules) return false;

    const sql = 'SELECT regulation, legalities FROM cards WHERE id = ?';
    const results = await query(sql, [cardId]);
    
    if (results.length === 0) return false;
    
    const card = results[0];
    
    // Check regulation marks
    if (format === 'standard' || format === 'expanded') {
      if (card.regulation && rules.allowedRegulationMarks && 
          !rules.allowedRegulationMarks.includes(card.regulation)) {
        return false;
      }
    }

    // Check banned cards
    if (rules.bannedCards.includes(card.name)) {
      return false;
    }

    return true;
  }

  /**
   * Get recommended card ratios for a format
   * @param {string} format - Format
   * @returns {Object} Recommended ratios
   */
  getRecommendedRatios(format) {
    const recommendations = {
      standard: {
        pokemon: { min: 15, max: 20, recommended: 18 },
        trainer: { min: 20, max: 30, recommended: 25 },
        energy: { min: 8, max: 12, recommended: 10 }
      },
      expanded: {
        pokemon: { min: 15, max: 20, recommended: 18 },
        trainer: { min: 20, max: 30, recommended: 25 },
        energy: { min: 8, max: 12, recommended: 10 }
      },
      unlimited: {
        pokemon: { min: 15, max: 20, recommended: 18 },
        trainer: { min: 20, max: 30, recommended: 25 },
        energy: { min: 8, max: 12, recommended: 10 }
      },
      custom: {
        pokemon: { min: 0, max: 60, recommended: 18 },
        trainer: { min: 0, max: 60, recommended: 25 },
        energy: { min: 0, max: 60, recommended: 10 }
      }
    };

    return recommendations[format] || recommendations.standard;
  }
}

export default new DeckValidationService();







