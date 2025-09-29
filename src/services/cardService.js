// Card Service - Handles API calls to the database
const API_BASE_URL = 'http://localhost:3001/api';

class CardService {
  // Search cards
  async searchCards(query, limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error searching cards:', error);
      return [];
    }
  }

  // Get all cards with pagination
  async getCards(page = 1, limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/cards?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching cards:', error);
      return [];
    }
  }

  // Get card by ID
  async getCardById(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching card:', error);
      return null;
    }
  }

  // Get trending cards
  async getTrendingCards() {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/trending`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching trending cards:', error);
      return [];
    }
  }

  // Get top movers
  async getTopMovers() {
    try {
      const response = await fetch(`${API_BASE_URL}/cards/top-movers`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching top movers:', error);
      return [];
    }
  }

  // Get all sets
  async getSets() {
    try {
      const response = await fetch(`${API_BASE_URL}/sets`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching sets:', error);
      return [];
    }
  }

  // Get cards by set
  async getCardsBySet(setId, limit = 50) {
    try {
      const response = await fetch(`${API_BASE_URL}/sets/${setId}/cards?limit=${limit}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching cards by set:', error);
      return [];
    }
  }

  // Transform database card to app format
  transformCard(card) {
    if (!card) return null;

    // Parse JSON fields
    const attacks = card.attacks ? JSON.parse(card.attacks) : [];
    const types = card.types ? JSON.parse(card.types) : [];
    const subtypes = card.subtypes ? JSON.parse(card.subtypes) : [];
    const weaknesses = card.weaknesses ? JSON.parse(card.weaknesses) : [];
    const resistances = card.resistances ? JSON.parse(card.resistances) : [];
    const retreatCost = card.retreat_cost ? JSON.parse(card.retreat_cost) : [];
    const images = card.images ? JSON.parse(card.images) : {};
    const tcgplayer = card.tcgplayer ? JSON.parse(card.tcgplayer) : {};
    const nationalPokedexNumbers = card.national_pokedex_numbers ? JSON.parse(card.national_pokedex_numbers) : [];

    return {
      id: card.id,
      name: card.name,
      set: card.set_name,
      series: card.series,
      rarity: card.rarity,
      number: card.number,
      price: card.current_value || 0,
      change: 0, // We'll calculate this later
      dailyChange: 0, // We'll calculate this later
      quantity: card.quantity || 0,
      rank: 0, // We'll calculate this later
      type: 'gain', // Default
      emoji: this.getTypeEmoji(types[0]),
      color: this.getTypeColor(types[0]),
      cardId: card.id,
      imageUrl: images.large || images.small || '',
      artist: card.artist || 'Unknown',
      hp: card.hp,
      type: types[0] || 'Colorless',
      supertype: card.supertype,
      subtypes: subtypes,
      level: card.level,
      evolvesFrom: card.evolves_from,
      attacks: attacks,
      weaknesses: weaknesses,
      resistances: resistances,
      retreatCost: retreatCost,
      convertedRetreatCost: card.converted_retreat_cost,
      nationalPokedexNumbers: nationalPokedexNumbers,
      legalities: card.legalities ? JSON.parse(card.legalities) : {},
      tcgplayer: tcgplayer,
      collected: card.collected || false,
      language: card.language || 'en',
      variant: card.variant || 'Normal',
      variants: card.variants ? JSON.parse(card.variants) : ['Normal'],
      regulation: card.regulation || 'A',
      format: card.format || 'Standard',
      created_at: card.created_at,
      updated_at: card.updated_at
    };
  }

  // Get emoji for Pokemon type
  getTypeEmoji(type) {
    const typeEmojis = {
      'Fire': '🔥',
      'Water': '💧',
      'Grass': '🌿',
      'Lightning': '⚡',
      'Psychic': '✨',
      'Fighting': '👊',
      'Darkness': '🌑',
      'Metal': '⚙️',
      'Fairy': '🧚',
      'Dragon': '🐉',
      'Colorless': '⚪'
    };
    return typeEmojis[type] || '⚪';
  }

  // Get color for Pokemon type
  getTypeColor(type) {
    const typeColors = {
      'Fire': 'red',
      'Water': 'blue',
      'Grass': 'green',
      'Lightning': 'yellow',
      'Psychic': 'purple',
      'Fighting': 'orange',
      'Darkness': 'gray',
      'Metal': 'gray',
      'Fairy': 'pink',
      'Dragon': 'purple',
      'Colorless': 'gray'
    };
    return typeColors[type] || 'gray';
  }
}

export default new CardService();
