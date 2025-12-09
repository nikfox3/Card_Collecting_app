import { useState, useEffect, useCallback } from 'react';
import { API_URL } from '../utils/api';

/**
 * Custom hook for searching Pokémon cards in the local database
 */
export const useCardSearch = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [sets, setSets] = useState([]);
  const [rarities, setRarities] = useState([]);
  const [types, setTypes] = useState([]);

  // Search cards with filters
  const searchCards = useCallback(async (query = '', filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/cards/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          ...filters,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setCards(data.cards || []);
    } catch (err) {
      setError(err.message);
      setCards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get card by ID
  const getCardById = useCallback(async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/cards/${id}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch card: ${response.statusText}`);
      }
      return await response.json();
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Get database statistics
  const getStats = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/cards/stats`);
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.statusText}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Get available sets
  const getSets = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/sets`);
      if (!response.ok) {
        throw new Error(`Failed to fetch sets: ${response.statusText}`);
      }
      const data = await response.json();
      setSets(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Get available rarities
  const getRarities = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/cards/rarities`);
      if (!response.ok) {
        throw new Error(`Failed to fetch rarities: ${response.statusText}`);
      }
      const data = await response.json();
      setRarities(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Get available types
  const getTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/cards/types`);
      if (!response.ok) {
        throw new Error(`Failed to fetch types: ${response.statusText}`);
      }
      const data = await response.json();
      setTypes(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    getStats();
    getSets();
    getRarities();
    getTypes();
  }, [getStats, getSets, getRarities, getTypes]);

  return {
    cards,
    loading,
    error,
    stats,
    sets,
    rarities,
    types,
    searchCards,
    getCardById,
    getStats,
    getSets,
    getRarities,
    getTypes,
  };
};

export default useCardSearch;


