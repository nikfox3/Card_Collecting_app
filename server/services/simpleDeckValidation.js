// Simple Deck Validation Service
// Basic validation without requiring cards table

class SimpleDeckValidationService {
  constructor() {
    this.validationRules = {
      standard: {
        minCards: 60,
        maxCards: 60,
        maxCopies: 4,
        requiresBasicPokemon: true
      },
      expanded: {
        minCards: 60,
        maxCards: 60,
        maxCopies: 4,
        requiresBasicPokemon: true
      },
      unlimited: {
        minCards: 60,
        maxCards: 60,
        maxCopies: 4,
        requiresBasicPokemon: true
      },
      custom: {
        minCards: 1,
        maxCards: 1000,
        maxCopies: 4,
        requiresBasicPokemon: false
      }
    };
  }

  /**
   * Validate a deck against format rules
   * @param {Object} deck - Deck object
   * @param {string} format - Format to validate against
   * @param {string} mode - 'casual' or 'tournament'
   * @returns {Object} Validation result with issues and suggestions
   */
  validateDeck(deck, format, mode) {
    const rules = this.validationRules[format] || this.validationRules.standard;
    const issues = [];
    let isValid = true;

    // Basic validation for empty deck
    if (!deck || !deck.cards || deck.cards.length === 0) {
      if (mode === 'tournament') {
        issues.push({
          type: 'error',
          message: 'Deck is empty',
          suggestion: 'Add at least one card to your deck'
        });
        isValid = false;
      } else {
        issues.push({
          type: 'warning',
          message: 'Deck is empty',
          suggestion: 'Add some cards to get started'
        });
      }
    }

    // For now, return basic validation
    return {
      isValid,
      issues,
      suggestions: []
    };
  }
}

export default new SimpleDeckValidationService();







