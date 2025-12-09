import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../utils/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import ProUpgradeModal from '../components/ProUpgradeModal';
import { createPortal } from 'react-dom';

const DeckBuilder = ({ onBack }) => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [decks, setDecks] = useState([]);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [newDeckFormat, setNewDeckFormat] = useState('standard');
  const [newDeckMode, setNewDeckMode] = useState('casual');
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [showMatchHistoryModal, setShowMatchHistoryModal] = useState(false);
  const [matchHistory, setMatchHistory] = useState([]);
  const [editingMatch, setEditingMatch] = useState(null);
  const [matchResult, setMatchResult] = useState('win');
  const [matchOpponent, setMatchOpponent] = useState('');
  const [matchNotes, setMatchNotes] = useState('');
  const [matchDate, setMatchDate] = useState(new Date().toISOString().split('T')[0]);
  const [openMenuDeck, setOpenMenuDeck] = useState(null);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [proUpgradeFeature, setProUpgradeFeature] = useState(null);
  const [showAddCardsModal, setShowAddCardsModal] = useState(false);
  const [cardSearchQuery, setCardSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addingCardId, setAddingCardId] = useState(null);
  const formatDropdownRef = useRef(null);
  const modeDropdownRef = useRef(null);
  const menuRef = useRef(null);
  
  // Fetch full deck details when selected
  const fetchDeckDetails = useCallback(async (deckId) => {
    try {
      const response = await fetch(`${API_URL}/api/decks/${deckId}`, {
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch deck details');
      }
      
      const data = await response.json();
      const deck = data.data;
      
      // Auto-validate the deck
      await validateDeck(deck.id);
      
      // Fetch updated deck with validation results
      const updatedResponse = await fetch(`${API_URL}/api/decks/${deckId}`, {
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setSelectedDeck(updatedData.data);
      } else {
        setSelectedDeck(deck);
      }
    } catch (err) {
      console.error('Error fetching deck details:', err);
      setError(err.message);
    }
  }, [user?.id]);
  
  // Validate deck
  const validateDeck = async (deckId) => {
    try {
      const response = await fetch(`${API_URL}/api/decks/${deckId}/validate`, {
        method: 'POST',
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to validate deck');
      }
      
      return await response.json();
    } catch (err) {
      console.error('Error validating deck:', err);
      return null;
    }
  };

  // Fetch user's decks
  const fetchDecks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/decks`, {
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch decks');
      }
      
      const data = await response.json();
      setDecks(data.data || []);
    } catch (err) {
      console.error('Error fetching decks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create new deck
  const createDeck = async () => {
    if (!newDeckName.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/decks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || 'default-user'
        },
        body: JSON.stringify({
          name: newDeckName.trim(),
          format: newDeckFormat,
          deck_mode: newDeckMode
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if it's a pro limit error
        if (response.status === 403 && errorData.requiresPro) {
          setProUpgradeFeature('deck');
          setShowProUpgradeModal(true);
          return;
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to create deck');
      }
      
      const data = await response.json();
      setDecks(prev => [data.data, ...prev]);
      await fetchDeckDetails(data.data.id);
      setShowNewDeckModal(false);
      setNewDeckName('');
    } catch (err) {
      console.error('Error creating deck:', err);
      setError(err.message);
    }
  };

  // Delete deck
  const deleteDeck = async (deckId) => {
    if (!confirm('Are you sure you want to delete this deck?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/decks/${deckId}`, {
        method: 'DELETE',
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete deck');
      }
      
      setDecks(prev => prev.filter(deck => deck.id !== deckId));
      if (selectedDeck?.id === deckId) {
        setSelectedDeck(null);
      }
    } catch (err) {
      console.error('Error deleting deck:', err);
      setError(err.message);
    }
  };

  // Record match result
  const recordMatch = async () => {
    if (!selectedDeck) return;
    
    try {
      const response = await fetch(`${API_URL}/api/decks/${selectedDeck.id}/matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || 'default-user'
        },
        body: JSON.stringify({
          result: matchResult,
          opponent_deck_type: matchOpponent,
          match_date: matchDate,
          format: selectedDeck.format,
          notes: matchNotes
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to record match');
      }
      
      // Refresh deck details to show updated stats
      await fetchDeckDetails(selectedDeck.id);
      setShowMatchModal(false);
      setMatchResult('win');
      setMatchOpponent('');
      setMatchNotes('');
      setMatchDate(new Date().toISOString().split('T')[0]);
    } catch (err) {
      console.error('Error recording match:', err);
      setError(err.message);
    }
  };

  // Fetch match history
  const fetchMatchHistory = async (deckId) => {
    try {
      const response = await fetch(`${API_URL}/api/decks/${deckId}/matches`, {
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch match history');
      }
      
      const data = await response.json();
      setMatchHistory(data.data || []);
      setShowMatchHistoryModal(true);
    } catch (err) {
      console.error('Error fetching match history:', err);
      setError(err.message);
    }
  };

  // Start editing a match
  const startEditingMatch = (match) => {
    setEditingMatch(match);
    setMatchResult(match.result);
    setMatchOpponent(match.opponent_deck_type || '');
    setMatchNotes(match.notes || '');
    setMatchDate(match.match_date);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingMatch(null);
    setMatchResult('win');
    setMatchOpponent('');
    setMatchNotes('');
    setMatchDate(new Date().toISOString().split('T')[0]);
  };

  // Save edited match
  const saveEditedMatch = async () => {
    if (!editingMatch || !selectedDeck) return;
    
    try {
      const response = await fetch(`${API_URL}/api/decks/${selectedDeck.id}/matches/${editingMatch.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || 'default-user'
        },
        body: JSON.stringify({
          result: matchResult,
          opponent_deck_type: matchOpponent,
          match_date: matchDate,
          format: editingMatch.format || selectedDeck.format,
          notes: matchNotes
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update match');
      }
      
      // Refresh deck details and match history
      await fetchDeckDetails(selectedDeck.id);
      await fetchMatchHistory(selectedDeck.id);
      cancelEditing();
    } catch (err) {
      console.error('Error updating match:', err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDecks();
  }, [fetchDecks]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFormatDropdown && formatDropdownRef.current && !formatDropdownRef.current.contains(event.target)) {
        setShowFormatDropdown(false);
      }
      if (showModeDropdown && modeDropdownRef.current && !modeDropdownRef.current.contains(event.target)) {
        setShowModeDropdown(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuDeck(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showFormatDropdown, showModeDropdown]);

  if (loading) {
    return (
      <div className="min-h-screen dark:bg-background bg-[#fafafa] flex items-center justify-center">
        <div className="dark:text-white text-theme-primary text-xl">Loading deck builder...</div>
      </div>
    );
  }

  // Search for cards
  const searchCards = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearchLoading(true);
      const response = await fetch(`${API_URL}/api/cards/search?q=${encodeURIComponent(query)}&limit=20`, {
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to search cards');
      }

      const data = await response.json();
      setSearchResults(data.data || []);
    } catch (err) {
      console.error('Error searching cards:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  }, [user?.id]);

  // Add card to deck
  const addCardToDeck = async (card, quantity = 1) => {
    if (!selectedDeck || !card) return;

    try {
      setAddingCardId(card.product_id || card.cardId || card.id);
      const cardId = card.product_id || card.cardId || card.id;

      if (!cardId) {
        throw new Error('Card ID not found');
      }

      const response = await fetch(`${API_URL}/api/decks/${selectedDeck.id}/cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || 'default-user'
        },
        body: JSON.stringify({
          card_id: cardId,
          quantity: quantity
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add card to deck');
      }

      // Refresh deck details
      await fetchDeckDetails(selectedDeck.id);
      setError(null);
    } catch (err) {
      console.error('Error adding card to deck:', err);
      setError(err.message);
    } finally {
      setAddingCardId(null);
    }
  };

  // Handle search input change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showAddCardsModal && cardSearchQuery) {
        searchCards(cardSearchQuery);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [cardSearchQuery, showAddCardsModal, searchCards]);

  // Handle card click - navigate to card profile
  const handleCardClick = async (card) => {
    if (!card) return;
    
    // Fetch full card details from API
    const cardId = card.product_id || card.cardId || card.id;
    if (cardId) {
      try {
        const response = await fetch(`${API_URL}/api/cards/${cardId}?t=${Date.now()}`);
        if (response.ok) {
          const result = await response.json();
          let cardData = result.data;
          
          // Parse JSON fields that might be strings
          const parseJSONField = (field) => {
            if (!field) return field;
            if (typeof field === 'object') return field;
            if (typeof field === 'string') {
              try {
                let parsed = JSON.parse(field);
                if (typeof parsed === 'string') {
                  parsed = JSON.parse(parsed);
                }
                return parsed;
              } catch {
                return field;
              }
            }
            return field;
          };
          
          cardData = {
            ...cardData,
            abilities: cardData.abilities || [],
            attacks: cardData.attacks || [],
            weaknesses: parseJSONField(cardData.weaknesses) || [],
            resistances: parseJSONField(cardData.resistances) || [],
            retreat_cost: parseJSONField(cardData.retreat_cost) || [],
            types: parseJSONField(cardData.types) || [],
            images: parseJSONField(cardData.images) || {}
          };
          
          // Dispatch custom event to open card profile in App.jsx
          const event = new CustomEvent('openCardProfileFromDeck', { detail: cardData });
          window.dispatchEvent(event);
        } else {
          // Fallback to using the card data we have
          const event = new CustomEvent('openCardProfileFromDeck', { detail: card });
          window.dispatchEvent(event);
        }
      } catch (error) {
        console.error('Error fetching card data:', error);
        // Fallback to using the card data we have
        const event = new CustomEvent('openCardProfileFromDeck', { detail: card });
        window.dispatchEvent(event);
      }
    } else {
      // No card ID available, use what we have
      const event = new CustomEvent('openCardProfileFromDeck', { detail: card });
      window.dispatchEvent(event);
    }
  };

  return (
    <>
    <div 
      className={`min-h-screen transition-all duration-300 ease-in-out relative ${
        isDark ? 'text-white' : 'text-theme-primary'
      }`}
      style={{
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        position: 'relative',
        background: isDark
          ? 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)'
          : 'linear-gradient(135deg, #fafafa 0%, #e4e5f1 50%, rgba(104, 101, 231, 0.1) 100%)'
      }}
    >
      {/* If no deck is selected, show deck list */}
      {!selectedDeck ? (
        <>
          {/* Header */}
          <div className="dark:bg-black/20 bg-[#fafafa]/95 backdrop-blur-sm dark:border-b border-b border-[#d2d3db] sticky top-0 z-10">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={onBack}
                  className="w-10 h-10 dark:bg-white/10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center dark:hover:bg-white/20 hover:bg-white/30 transition-all duration-200 dark:border-white/20 border-[#d2d3db] border"
                >
                  <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold dark:text-white text-theme-primary">Deck Builder</h1>
              </div>
              
              <button
                onClick={() => setShowNewDeckModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                + New
              </button>
            </div>
          </div>

          {/* Deck List */}
          <div className="px-4 py-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="dark:text-white text-theme-primary text-lg font-semibold">My Decks</h2>
                <span className="dark:text-gray-400 text-theme-secondary text-sm">{decks.length} deck{decks.length !== 1 ? 's' : ''}</span>
              </div>
              
              {decks.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 dark:bg-gray-700 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 dark:text-gray-400 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="dark:text-gray-400 text-theme-secondary text-base mb-2">No decks yet</p>
                  <p className="dark:text-gray-500 text-theme-tertiary text-sm">Create your first deck to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {decks.map((deck, index) => {
                    // Create gradient based on index for variety
                    const gradientColors = [
                      'from-blue-500/20 via-purple-500/20 to-pink-500/20',
                      'from-green-500/20 via-teal-500/20 to-cyan-500/20',
                      'from-orange-500/20 via-red-500/20 to-pink-500/20',
                      'from-purple-500/20 via-indigo-500/20 to-blue-500/20',
                      'from-yellow-500/20 via-orange-500/20 to-red-500/20'
                    ];
                    const glowColors = [
                      'hover:shadow-blue-500/50',
                      'hover:shadow-green-500/50',
                      'hover:shadow-orange-500/50',
                      'hover:shadow-purple-500/50',
                      'hover:shadow-yellow-500/50'
                    ];
                    const borderColors = [
                      'border-blue-500/30 hover:border-blue-400/50',
                      'border-green-500/30 hover:border-green-400/50',
                      'border-orange-500/30 hover:border-orange-400/50',
                      'border-purple-500/30 hover:border-purple-400/50',
                      'border-yellow-500/30 hover:border-yellow-400/50'
                    ];
                    const colorIndex = index % gradientColors.length;
                    
                    // Get extracted colors from card image
                    const dominantColors = deck.dominant_colors;
                    let gradientClass, glowClass, borderClass, customStyle;
                    
                    if (dominantColors && dominantColors.length >= 3) {
                      // Use extracted colors to build a gradient
                      const color1 = dominantColors[0];
                      const color2 = dominantColors[1] || dominantColors[0];
                      const color3 = dominantColors[2] || dominantColors[0];
                      
                      // Create gradient using RGB values
                      customStyle = {
                        background: `linear-gradient(to bottom right, 
                          rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.2),
                          rgba(${color2[0]}, ${color2[1]}, ${color2[2]}, 0.2),
                          rgba(${color3[0]}, ${color3[1]}, ${color3[2]}, 0.2))`,
                        borderColor: `rgba(${color1[0]}, ${color1[1]}, ${color1[2]}, 0.3)`
                      };
                      
                      // Use standard classes for hover effects
                      glowClass = 'hover:shadow-lg';
                    } else if (deck.first_card_image) {
                      // Fallback to purple/indigo/blue for cards without extracted colors yet
                      gradientClass = 'from-purple-600/20 via-indigo-600/20 to-blue-600/20';
                      glowClass = 'hover:shadow-purple-500/50';
                      borderClass = 'border-purple-500/30 hover:border-purple-400/50';
                    } else {
                      // Use index-based colors for decks without cards
                      gradientClass = gradientColors[colorIndex];
                      glowClass = glowColors[colorIndex];
                      borderClass = borderColors[colorIndex];
                    }
                    
                    return (
                      <div
                        key={deck.id}
                        onClick={() => fetchDeckDetails(deck.id)}
                        className={`relative p-4 rounded-xl border-2 ${customStyle ? '' : `bg-gradient-to-br ${gradientClass}`} ${borderClass} cursor-pointer transition-all hover:shadow-lg ${glowClass} hover:scale-[1.02] backdrop-blur-sm overflow-hidden`}
                        style={customStyle}
                      >
                        {/* First card image background */}
                        {deck.first_card_image && (
                          <>
                            {/* Blurred background for depth */}
                            <div className="absolute right-0 top-0 bottom-0 pointer-events-none overflow-hidden">
                              <img
                                src={deck.first_card_image}
                                alt=""
                                className="h-full w-full object-cover opacity-30 scale-[2.5] -rotate-12 blur-2xl"
                              />
                            </div>
                            {/* Main card image */}
                            <div className="absolute right-0 top-0 bottom-0 pointer-events-none">
                              <img
                                src={deck.first_card_image}
                                alt=""
                                className="h-full object-contain opacity-60 scale-[1.8] -rotate-12"
                              />
                            </div>
                          </>
                        )}
                        
                        <div className="relative z-10 mb-3">
                          <h3 className="dark:text-white text-theme-primary font-semibold text-base mb-1 drop-shadow-lg">{deck.name}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <span className="dark:text-gray-300 text-theme-primary capitalize">{deck.format}</span>
                            <span className="dark:text-gray-500 text-theme-tertiary">•</span>
                            <span className="dark:text-gray-300 text-theme-primary capitalize">{deck.deck_mode}</span>
                          </div>
                        </div>
                        
                        {/* Deck Stats Row */}
                        <div className="relative z-10 flex items-center gap-4">
                          <div className="text-center">
                            <div className="dark:text-white text-theme-primary text-sm font-medium drop-shadow-lg">{deck.card_count || 0}/60</div>
                            <div className="dark:text-gray-300 text-theme-secondary text-xs">cards</div>
                          </div>
                          
                          {deck.wins + deck.losses + deck.draws > 0 && (
                            <div className="text-center">
                              <div className="dark:text-white text-theme-primary text-sm font-medium drop-shadow-lg">{deck.win_rate}%</div>
                              <div className="dark:text-gray-300 text-theme-secondary text-xs">{deck.wins}W-{deck.losses}L{deck.draws > 0 && `-${deck.draws}D`}</div>
                            </div>
                          )}
                          
                          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                            deck.is_valid 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'dark:bg-yellow-500/20 dark:text-yellow-400 bg-orange-100 text-orange-700'
                          }`}>
                            {deck.is_valid ? (
                              <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                Valid
                              </>
                            ) : (
                              <>
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                Issues
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Deck Detail View */}
          <div className="dark:bg-black/20 bg-[#fafafa]/95 backdrop-blur-sm dark:border-b border-b border-[#d2d3db] sticky top-0 z-10">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedDeck(null)}
                  className="w-10 h-10 dark:bg-white/10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center dark:hover:bg-white/20 hover:bg-white/30 transition-all duration-200 dark:border-white/20 border-[#d2d3db] border"
                >
                  <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold dark:text-white text-theme-primary">{selectedDeck.name}</h1>
              </div>
              
              {/* Menu button */}
              <div className="relative">
                <button
                  onClick={() => setOpenMenuDeck(openMenuDeck === selectedDeck.id ? null : selectedDeck.id)}
                  className="w-10 h-10 dark:bg-white/10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {openMenuDeck === selectedDeck.id && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 top-12 w-40 dark:bg-gray-800 bg-white rounded-lg dark:border-white/10 border-[#d2d3db] border shadow-xl z-20"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Add edit functionality
                        setOpenMenuDeck(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 dark:text-white text-theme-primary dark:hover:bg-white/10 hover:bg-gray-100 transition-colors text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Deck</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteDeck(selectedDeck.id);
                        setOpenMenuDeck(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 dark:hover:bg-red-600/20 hover:bg-red-50 transition-colors text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Deck</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-4 space-y-6">
            {/* Deck Stats Section */}
            <div className="dark:bg-white/5 bg-white/20 backdrop-blur-md rounded-xl p-4 dark:border-white/10 border-[#d2d3db] border">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="dark:text-gray-400 text-theme-secondary text-sm capitalize">{selectedDeck.format} • {selectedDeck.deck_mode}</p>
                </div>
                <button
                  onClick={() => setShowValidationModal(true)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    selectedDeck.is_valid 
                      ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                      : 'dark:bg-yellow-500/20 dark:text-yellow-400 dark:hover:bg-yellow-500/30 bg-orange-100 text-orange-700 hover:bg-orange-200'
                  }`}
                >
                  {selectedDeck.is_valid ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Valid
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {selectedDeck.validation_issues?.length || 0} Issue{(selectedDeck.validation_issues?.length || 0) !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="dark:text-white text-theme-primary text-2xl font-bold">{selectedDeck.card_count || 0}/60</div>
                  <div className="dark:text-gray-400 text-theme-secondary text-xs">Cards</div>
                </div>
                <div className="text-center">
                  <div className="dark:text-white text-theme-primary text-2xl font-bold">{selectedDeck.wins || 0}</div>
                  <div className="dark:text-gray-400 text-theme-secondary text-xs">Wins</div>
                </div>
                <div className="text-center">
                  <div className="dark:text-white text-theme-primary text-2xl font-bold">{selectedDeck.losses || 0}</div>
                  <div className="dark:text-gray-400 text-theme-secondary text-xs">Losses</div>
                </div>
                <button 
                  onClick={() => fetchMatchHistory(selectedDeck.id)}
                  className="text-center cursor-pointer hover:opacity-80 transition-opacity"
                  title="Click to view match history"
                >
                  <div className="dark:text-white text-theme-primary text-2xl font-bold">{selectedDeck.win_rate || 0}%</div>
                  <div className="dark:text-gray-400 text-theme-secondary text-xs">Win Rate</div>
                </button>
              </div>
              
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => setShowMatchModal(true)}
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Record Match
                </button>
              </div>
            </div>

            {/* Cards Grid */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="dark:text-white text-theme-primary text-lg font-semibold">Deck List</h3>
                <button 
                  onClick={() => setShowAddCardsModal(true)}
                  className="dark:text-blue-400 text-[#6865E7] text-sm dark:hover:text-blue-300 hover:text-[#4F46E5]"
                >
                  + Add Cards
                </button>
              </div>
              
              {selectedDeck.cards && selectedDeck.cards.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                  {selectedDeck.cards.map((deckCard, index) => {
                    // For cards with quantity > 1, display multiple times
                    const cardsToRender = Array(deckCard.quantity).fill(deckCard);
                    return cardsToRender.map((card, cardIndex) => (
                      <div
                        key={`${deckCard.id}-${cardIndex}`}
                        className="relative group cursor-pointer"
                        onClick={() => handleCardClick(card.card)}
                      >
                        <div className="aspect-[2/2.8] dark:bg-white/5 bg-white/20 rounded-lg overflow-hidden dark:border-white/10 border-[#d2d3db] border hover:border-blue-500/50 transition-all hover:shadow-lg hover:scale-105">
                          {card.card?.image_url ? (
                            <img 
                              src={card.card.image_url} 
                              alt={card.card.name || `Card ${card.product_id}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/Assets/CardBack.svg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center p-2">
                                <div className="w-8 h-8 dark:bg-gray-700 bg-gray-200 rounded mb-2 mx-auto"></div>
                                <div className="dark:text-gray-400 text-theme-secondary text-xs truncate">
                                  {card.card?.name || `Card ${card.product_id}`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Show card name on hover */}
                        <div className="absolute bottom-0 left-0 right-0 dark:bg-black/80 bg-gray-900/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-medium truncate">{card.card?.name || `Card ${card.product_id}`}</p>
                        </div>
                      </div>
                    ));
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-20 h-20 dark:bg-gray-700 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 dark:text-gray-500 text-theme-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="dark:text-gray-400 text-theme-secondary text-base mb-2">No cards in deck</p>
                  <p className="dark:text-gray-500 text-theme-tertiary text-sm">Add cards to start building your deck</p>
                  <button 
                    onClick={() => setShowAddCardsModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    + Add Cards
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* New Deck Modal */}
      {showNewDeckModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[99999]">
          <div className="dark:bg-gray-800 bg-white rounded-t-xl sm:rounded-xl p-6 w-full max-w-md dark:border-white/10 border-[#d2d3db] border modal-container">
            <div className="flex items-center justify-between mb-6">
              <h3 className="dark:text-white text-theme-primary text-lg font-semibold">Create New Deck</h3>
              <button
                onClick={() => setShowNewDeckModal(false)}
                className="w-8 h-8 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 dark:text-gray-300 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Deck Name</label>
                <input
                  type="text"
                  value={newDeckName}
                  onChange={(e) => setNewDeckName(e.target.value)}
                  placeholder="Enter deck name..."
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Format</label>
                  <div className="relative" ref={formatDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowFormatDropdown(!showFormatDropdown)}
                      className="w-full dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg px-4 py-3 dark:text-white text-theme-primary text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="capitalize">{newDeckFormat}</span>
                      <svg className={`w-4 h-4 transition-transform ${showFormatDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showFormatDropdown && (
                      <div className="absolute z-50 w-full mb-1 bottom-full dark:bg-gray-700 bg-white dark:border-gray-600 border-[#d2d3db] border rounded-lg shadow-lg">
                        <div className="py-1">
                          {['standard', 'expanded', 'unlimited', 'custom'].map(format => (
                            <button
                              key={format}
                              onClick={() => {
                                setNewDeckFormat(format);
                                setShowFormatDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left dark:text-white text-theme-primary dark:hover:bg-gray-600 hover:bg-gray-100 transition-colors capitalize"
                            >
                              {format}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="relative">
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Mode</label>
                  <div className="relative" ref={modeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowModeDropdown(!showModeDropdown)}
                      className="w-full dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg px-4 py-3 dark:text-white text-theme-primary text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <span className="capitalize">{newDeckMode}</span>
                      <svg className={`w-4 h-4 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showModeDropdown && (
                      <div className="absolute z-50 w-full mb-1 bottom-full dark:bg-gray-700 bg-white dark:border-gray-600 border-[#d2d3db] border rounded-lg shadow-lg">
                        <div className="py-1">
                          {['casual', 'tournament'].map(mode => (
                            <button
                              key={mode}
                              onClick={() => {
                                setNewDeckMode(mode);
                                setShowModeDropdown(false);
                              }}
                              className="w-full px-4 py-2 text-left dark:text-white text-theme-primary dark:hover:bg-gray-600 hover:bg-gray-100 transition-colors capitalize"
                            >
                              {mode}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewDeckModal(false)}
                className="flex-1 px-4 py-2 dark:bg-gray-600 bg-gray-200 dark:hover:bg-gray-700 hover:bg-gray-300 dark:text-white text-theme-primary rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createDeck}
                disabled={!newDeckName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:dark:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Match Modal */}
      {showMatchModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
          <div className="dark:bg-gray-800 bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 dark:text-blue-400 text-[#6865E7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="dark:text-white text-theme-primary text-xl font-semibold">Record Match</h2>
              </div>
              <button
                onClick={() => setShowMatchModal(false)}
                className="w-8 h-8 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 dark:text-gray-300 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Result</label>
                <div className="grid grid-cols-3 gap-2">
                  {['win', 'loss', 'draw'].map(result => (
                    <button
                      key={result}
                      type="button"
                      onClick={() => setMatchResult(result)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        matchResult === result
                          ? result === 'win' 
                            ? 'bg-green-600 text-white' 
                            : result === 'loss'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                          : 'dark:bg-gray-700 bg-gray-200 dark:text-gray-300 text-theme-primary dark:hover:bg-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {result.charAt(0).toUpperCase() + result.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Opponent Deck Type (Optional)</label>
                <input
                  type="text"
                  value={matchOpponent}
                  onChange={(e) => setMatchOpponent(e.target.value)}
                  placeholder="e.g., Charizard ex, Mewtwo VMAX, etc."
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  placeholder="Add any notes about the match..."
                  rows="3"
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowMatchModal(false)}
                className="flex-1 px-4 py-2 dark:bg-gray-600 bg-gray-200 dark:hover:bg-gray-700 hover:bg-gray-300 dark:text-white text-theme-primary rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={recordMatch}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Record Match
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Match History Modal */}
      {showMatchHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
          <div className="dark:bg-gray-800 bg-white rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 dark:text-blue-400 text-[#6865E7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="dark:text-white text-theme-primary text-xl font-semibold">Match History</h2>
              </div>
              <button
                onClick={() => setShowMatchHistoryModal(false)}
                className="w-8 h-8 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 dark:text-gray-300 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1">
              {matchHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 dark:bg-gray-700 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 dark:text-gray-500 text-theme-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="dark:text-gray-400 text-theme-secondary text-base mb-2">No matches yet</p>
                  <p className="dark:text-gray-500 text-theme-tertiary text-sm">Start recording matches to track your deck's performance</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matchHistory.map((match, index) => (
                    <div key={match.id || index} className="dark:bg-gray-700/50 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                          match.result === 'win' 
                            ? 'bg-green-600 text-white' 
                            : match.result === 'loss'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                        }`}>
                          {match.result === 'win' ? 'W' : match.result === 'loss' ? 'L' : 'D'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <h3 className={`text-lg font-semibold capitalize ${
                                match.result === 'win' 
                                  ? 'text-green-400' 
                                  : match.result === 'loss'
                                  ? 'text-red-400'
                                  : 'text-yellow-400'
                              }`}>
                                {match.result === 'win' ? 'Victory' : match.result === 'loss' ? 'Defeat' : 'Draw'}
                              </h3>
                              {match.opponent_deck_type && (
                                <span className="dark:text-gray-400 text-theme-secondary text-sm">vs {match.opponent_deck_type}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="dark:text-gray-400 text-theme-secondary text-sm">
                                {new Date(match.match_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </div>
                              <button
                                onClick={() => startEditingMatch(match)}
                                className="p-1.5 dark:hover:bg-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                                title="Edit match"
                              >
                                <svg className="w-4 h-4 dark:text-gray-400 dark:hover:text-white text-theme-secondary hover:text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                          {match.notes && (
                            <div className="dark:bg-gray-800/50 bg-gray-100 rounded-lg p-3 mt-2">
                              <p className="dark:text-gray-300 text-theme-primary text-sm whitespace-pre-wrap">{match.notes}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-xs dark:text-gray-500 text-theme-tertiary">
                            {match.format && (
                              <span className="capitalize">{match.format}</span>
                            )}
                            <span>{new Date(match.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Match Modal */}
      {editingMatch && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10001]">
          <div className="dark:bg-gray-800 bg-white rounded-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 dark:text-blue-400 text-[#6865E7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h2 className="dark:text-white text-theme-primary text-xl font-semibold">Edit Match</h2>
              </div>
              <button
                onClick={cancelEditing}
                className="w-8 h-8 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 dark:text-gray-300 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Result</label>
                <div className="grid grid-cols-3 gap-2">
                  {['win', 'loss', 'draw'].map(result => (
                    <button
                      key={result}
                      type="button"
                      onClick={() => setMatchResult(result)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        matchResult === result
                          ? result === 'win' 
                            ? 'bg-green-600 text-white' 
                            : result === 'loss'
                            ? 'bg-red-600 text-white'
                            : 'bg-yellow-600 text-white'
                          : 'dark:bg-gray-700 bg-gray-200 dark:text-gray-300 text-theme-primary dark:hover:bg-gray-600 hover:bg-gray-300'
                      }`}
                    >
                      {result.charAt(0).toUpperCase() + result.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Date</label>
                <input
                  type="date"
                  value={matchDate}
                  onChange={(e) => setMatchDate(e.target.value)}
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Opponent Deck Type (Optional)</label>
                <input
                  type="text"
                  value={matchOpponent}
                  onChange={(e) => setMatchOpponent(e.target.value)}
                  placeholder="e.g., Charizard ex, Mewtwo VMAX, etc."
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Notes (Optional)</label>
                <textarea
                  value={matchNotes}
                  onChange={(e) => setMatchNotes(e.target.value)}
                  placeholder="Add any notes about the match..."
                  rows="3"
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={cancelEditing}
                className="flex-1 px-4 py-2 dark:bg-gray-600 bg-gray-200 dark:hover:bg-gray-700 hover:bg-gray-300 dark:text-white text-theme-primary rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveEditedMatch}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Validation Issues Modal */}
      {showValidationModal && selectedDeck && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
          <div className="dark:bg-gray-800 bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 dark:text-blue-400 text-[#6865E7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h2 className="dark:text-white text-theme-primary text-xl font-semibold">Deck Validation</h2>
              </div>
              <button
                onClick={() => setShowValidationModal(false)}
                className="w-8 h-8 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 dark:text-gray-300 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {selectedDeck.is_valid ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="dark:text-white text-theme-primary text-lg font-semibold mb-2">Deck is Valid!</h3>
                <p className="dark:text-gray-400 text-theme-secondary">Your deck meets all Pokemon TCG requirements.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h3 className="text-yellow-400 font-semibold mb-1">Issues Found</h3>
                      <p className="dark:text-gray-300 text-theme-primary text-sm">Please fix the following issues to make your deck valid:</p>
                    </div>
                  </div>
                </div>

                {selectedDeck.validation_issues && selectedDeck.validation_issues.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDeck.validation_issues.map((issue, index) => (
                      <div key={index} className="dark:bg-gray-700/50 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0"></div>
                          <div className="flex-1">
                            <h4 className="dark:text-white text-theme-primary font-medium mb-2">{issue.message}</h4>
                            {issue.fix && (
                              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
                                <p className="text-blue-300 text-sm">
                                  <span className="font-semibold">How to fix:</span> {issue.fix}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dark:text-gray-400 text-theme-secondary text-center py-4">No issues found.</p>
                )}
              </div>
            )}

            {/* TCG Rules Resources */}
            <div className="mt-6 pt-6 dark:border-t border-t border-[#d2d3db] border-gray-700">
              <h3 className="dark:text-white text-theme-primary font-semibold mb-3">Official Pokemon TCG Resources</h3>
              <div className="space-y-2">
                <a
                  href="https://www.pokemon.com/us/play-pokemon/about/tournaments-rules-and-resources"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 dark:text-blue-400 text-[#6865E7] dark:hover:text-blue-300 hover:text-[#4F46E5] transition-colors group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <span className="group-hover:underline">Pokemon TCG Rules & Resources</span>
                </a>
                <a
                  href="https://www.pokemon.com/static-assets/content-assets/cms2/pdf/trading-card-game/rulebook/meg_rulebook_en.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 dark:text-blue-400 text-[#6865E7] dark:hover:text-blue-300 hover:text-[#4F46E5] transition-colors group"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <span className="group-hover:underline">Official Rulebook (PDF)</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {error}
        </div>
      )}

      {/* Add Cards Modal */}
      {showAddCardsModal && selectedDeck && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[10000]">
          <div className="dark:bg-gray-800 bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 flex-shrink-0">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 dark:text-blue-400 text-[#6865E7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <h2 className="dark:text-white text-theme-primary text-xl font-semibold">Add Cards to {selectedDeck.name}</h2>
              </div>
              <button
                onClick={() => {
                  setShowAddCardsModal(false);
                  setCardSearchQuery('');
                  setSearchResults([]);
                }}
                className="w-8 h-8 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 dark:text-gray-300 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search Input */}
            <div className="mb-4 flex-shrink-0">
              <input
                type="text"
                value={cardSearchQuery}
                onChange={(e) => setCardSearchQuery(e.target.value)}
                placeholder="Search for cards..."
                className="w-full px-4 py-3 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="flex-1 overflow-y-auto">
              {searchLoading ? (
                <div className="text-center py-12">
                  <div className="dark:text-gray-400 text-theme-secondary">Searching...</div>
                </div>
              ) : searchResults.length === 0 && cardSearchQuery ? (
                <div className="text-center py-12">
                  <p className="dark:text-gray-400 text-theme-secondary">No cards found</p>
                  <p className="dark:text-gray-500 text-theme-tertiary text-sm mt-2">Try a different search term</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="dark:text-gray-400 text-theme-secondary">Start typing to search for cards</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {searchResults.map((card) => {
                    const cardId = card.product_id || card.cardId || card.id;
                    const isAdding = addingCardId === cardId;
                    return (
                      <div
                        key={cardId}
                        className="relative group cursor-pointer"
                      >
                        <div className="aspect-[2/2.8] dark:bg-white/5 bg-white/20 rounded-lg overflow-hidden dark:border-white/10 border-[#d2d3db] border hover:border-blue-500/50 transition-all hover:shadow-lg">
                          {card.image_url ? (
                            <img 
                              src={card.image_url} 
                              alt={card.name || `Card ${cardId}`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = '/Assets/CardBack.svg';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <div className="text-center p-2">
                                <div className="w-8 h-8 dark:bg-gray-700 bg-gray-200 rounded mb-2 mx-auto"></div>
                                <div className="dark:text-gray-400 text-theme-secondary text-xs truncate">
                                  {card.name || `Card ${cardId}`}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Card name overlay */}
                        <div className="absolute bottom-0 left-0 right-0 dark:bg-black/80 bg-gray-900/80 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-xs font-medium truncate">{card.name || `Card ${cardId}`}</p>
                        </div>
                        {/* Add button */}
                        <button
                          onClick={() => addCardToDeck(card, 1)}
                          disabled={isAdding}
                          className="absolute top-2 right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 text-white rounded-full flex items-center justify-center transition-colors shadow-lg opacity-0 group-hover:opacity-100"
                          title="Add to deck"
                        >
                          {isAdding ? (
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Pro Upgrade Modal */}
      {showProUpgradeModal && createPortal(
        <ProUpgradeModal
          isOpen={showProUpgradeModal}
          onClose={() => {
            setShowProUpgradeModal(false);
            setProUpgradeFeature(null);
          }}
          feature={proUpgradeFeature}
          limit={proUpgradeFeature === 'deck' ? 1 : null}
          current={decks.length}
        />,
        document.body
      )}
    </div>
    </>
  );
};

export default DeckBuilder;
