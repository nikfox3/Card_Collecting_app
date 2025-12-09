// Card Service - Handles API calls to the database
import { API_URL } from '../utils/api';

const API_BASE_URL = `${API_URL}/api`;

class CardService {
  // Search cards
  async searchCards(query, limit = 50) {
    try {
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/cards/search?q=${encodeURIComponent(query)}&limit=${limit}&t=${timestamp}`);
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
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/cards?page=${page}&limit=${limit}&t=${timestamp}`);
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
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/cards/${id}?t=${timestamp}`);
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
      // Add cache-busting parameter to force fresh data
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/cards/trending?t=${timestamp}`);
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
      // Add cache-busting parameter to force fresh data
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/cards/top-movers?t=${timestamp}`);
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
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/sets?t=${timestamp}`);
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
      // Add cache-busting parameter to ensure fresh data
      const timestamp = Date.now();
      const response = await fetch(`${API_BASE_URL}/sets/${setId}/cards?limit=${limit}&t=${timestamp}`);
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

    // Parse JSON fields - handle both string and already-parsed data
    const parseJSONField = (field) => {
      if (!field) return null;
      if (typeof field === 'object') return field;
      if (typeof field === 'string') {
        try {
          return JSON.parse(field);
        } catch (e) {
          return field; // Return as string if parsing fails
        }
      }
      return field;
    };

    const attacks = parseJSONField(card.attacks) || [];
    const types = parseJSONField(card.types) || [];
    const subtypes = parseJSONField(card.subtypes) || [];
    const weaknesses = parseJSONField(card.weaknesses) || [];
    const resistances = parseJSONField(card.resistances) || [];
    const retreatCost = parseJSONField(card.retreat_cost) || [];
    const images = parseJSONField(card.images) || {};
    const tcgplayer = parseJSONField(card.tcgplayer) || {};
    const nationalPokedexNumbers = parseJSONField(card.national_pokedex_numbers) || [];
    const variants = parseJSONField(card.variants) || ['Normal'];
    const legalities = parseJSONField(card.legalities) || {};

    // Handle missing release_date in TCGCSV data
    const releaseDate = card.release_date || card.published_on || null;
    console.log('CardService transformCard - release_date:', releaseDate, 'for card:', card.name);
    
    return {
      id: card.id || card.product_id || card.cardId,
      name: card.name,
      set: card.set_name,
      set_name: card.set_name, // Preserve original field name
      series: card.series,
      release_date: releaseDate, // Use processed release date for regulation mark derivation
      rarity: card.rarity || card.ext_rarity,
      number: card.number || card.ext_number,
      formattedNumber: card.formattedNumber || card.ext_number || this.formatCardNumber(card.number, card.printed_total),
      price: card.current_value || card.price || card.mid_price || 0,
      current_value: card.current_value || card.price || card.mid_price || 0, // Preserve original field for trending cards
      change: 0, // We'll calculate this later
      dailyChange: 0, // We'll calculate this later
      quantity: card.quantity || 0,
      rank: 0, // We'll calculate this later
      type: 'gain', // Default
      emoji: this.getTypeEmoji(types[0]),
      color: this.getTypeColor(types[0]),
      cardId: card.cardId || card.id || card.product_id,
      image_url: card.image_url, // Preserve TCGCSV image_url
      imageUrl: card.imageUrl || images.high || images.large || images.small || '',
      ext_number: card.ext_number, // Preserve TCGCSV ext_number
      ext_rarity: card.ext_rarity, // Preserve TCGCSV ext_rarity
      images: images,
      artist: card.artist || null, // TCGCSV data doesn't include artist information
      hp: card.hp || card.ext_hp,
      type: types[0] || card.ext_card_type || 'Colorless',
      supertype: card.supertype,
      subtypes: subtypes,
      level: card.level || card.ext_stage,
      evolvesFrom: card.evolves_from,
      attacks: attacks,
      weaknesses: weaknesses,
      resistances: resistances,
      retreatCost: retreatCost,
      convertedRetreatCost: card.converted_retreat_cost,
      nationalPokedexNumbers: nationalPokedexNumbers,
      legalities: legalities,
      tcgplayer: tcgplayer,
      collected: card.collected || false,
      language: card.language || 'en',
      variant: card.variant || 'Normal',
      variants: variants,
      // Variant boolean fields from CSV
      variant_normal: card.variant_normal === true || card.variant_normal === 'true' || card.variant_normal === 1 || card.variant_normal === '1',
      variant_reverse: card.variant_reverse === true || card.variant_reverse === 'true' || card.variant_reverse === 1 || card.variant_reverse === '1',
      variant_holo: card.variant_holo === true || card.variant_holo === 'true' || card.variant_holo === 1 || card.variant_holo === '1',
      variant_first_edition: card.variant_first_edition === true || card.variant_first_edition === 'true' || card.variant_first_edition === 1 || card.variant_first_edition === '1',
      regulation: card.regulation || 'A',
      format: card.format || 'Standard',
      created_at: card.created_at,
      updated_at: card.updated_at
    };
  }

  // Format card number as XXX/YYY
  formatCardNumber(number, printedTotal) {
    if (!number) return number;
    
    // If we have a set total and the number is purely numeric, format as XXX/YYY
    if (printedTotal && number.match(/^\d+$/)) {
      const totalStr = String(printedTotal);
      const paddedNumber = number.padStart(totalStr.length, '0');
      return `${paddedNumber}/${printedTotal}`;
    }
    
    return number;
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
