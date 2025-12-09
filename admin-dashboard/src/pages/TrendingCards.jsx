import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { admin } from "../utils/api";
import axios from "axios";

const API_BASE_URL = "http://localhost:3002/api";

export default function TrendingCards() {
  const navigate = useNavigate();
  const [featuredCards, setFeaturedCards] = useState([]);
  const [autoTrendingCards, setAutoTrendingCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAuto, setLoadingAuto] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  const [position, setPosition] = useState(1);
  const [featuredUntil, setFeaturedUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [editingCard, setEditingCard] = useState(null);
  const [showAutoCards, setShowAutoCards] = useState(true);
  const [selectedAutoCards, setSelectedAutoCards] = useState(new Set());
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadAllCards();
  }, []);

  const loadAllCards = async () => {
    await Promise.all([loadFeaturedCards(), loadAutoTrendingCards()]);
  };

  const loadFeaturedCards = async () => {
    try {
      setLoading(true);
      const response = await admin.getTrendingCards();
      setFeaturedCards(response.data.data || []);
    } catch (error) {
      console.error("Error loading featured cards:", error);
      alert("Failed to load featured cards");
    } finally {
      setLoading(false);
    }
  };

  const loadAutoTrendingCards = async () => {
    try {
      setLoadingAuto(true);
      const response = await admin.getAutoTrendingCards(50);
      setAutoTrendingCards(response.data.data || []);
    } catch (error) {
      console.error("Error loading auto trending cards:", error);
      // Don't show alert for auto cards - it's a nice-to-have feature
    } finally {
      setLoadingAuto(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await admin.searchTrendingCards(searchTerm);
      setSearchResults(response.data.data || []);
    } catch (error) {
      console.error("Error searching cards:", error);
      alert("Failed to search cards");
    } finally {
      setSearching(false);
    }
  };

  const handleAddCard = (card) => {
    setSelectedCard(card);
    setPosition(featuredCards.length + 1);
    setFeaturedUntil("");
    setNotes("");
    setEditingCard(null);
    setShowAddModal(true);
  };

  const handleEditCard = (featuredCard) => {
    setSelectedCard(featuredCard);
    setPosition(featuredCard.position);
    setFeaturedUntil(
      featuredCard.featured_until
        ? featuredCard.featured_until.split("T")[0]
        : ""
    );
    setNotes(featuredCard.notes || "");
    setEditingCard(featuredCard);
    setShowAddModal(true);
  };

  const handleSaveCard = async () => {
    if (!selectedCard) return;

    try {
      const cardData = {
        product_id: selectedCard.product_id,
        position: parseInt(position),
        featured_until: featuredUntil || null,
        notes: notes || null,
      };

      if (editingCard) {
        await admin.updateTrendingCard(editingCard.id, cardData);
      } else {
        await admin.addTrendingCard(cardData);
      }

      setShowAddModal(false);
      setSelectedCard(null);
      setEditingCard(null);
      await Promise.all([loadFeaturedCards(), loadAutoTrendingCards()]);
    } catch (error) {
      console.error("Error saving card:", error);
      alert("Failed to save card");
    }
  };

  const handleDeleteCard = async (id) => {
    if (!confirm("Are you sure you want to remove this card from trending?")) {
      return;
    }

    try {
      await admin.deleteTrendingCard(id);
      await Promise.all([loadFeaturedCards(), loadAutoTrendingCards()]);
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card");
    }
  };

  const handleReorder = async (newOrder) => {
    try {
      const cards = newOrder.map((card, index) => ({
        id: card.id,
        position: index + 1,
      }));

      await admin.reorderTrendingCards(cards);
      loadFeaturedCards();
    } catch (error) {
      console.error("Error reordering cards:", error);
      alert("Failed to reorder cards");
    }
  };

  const moveCard = (index, direction) => {
    const newCards = [...featuredCards];
    const newIndex = direction === "up" ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newCards.length) return;

    [newCards[index], newCards[newIndex]] = [
      newCards[newIndex],
      newCards[index],
    ];
    setFeaturedCards(newCards);
    handleReorder(newCards);
  };

  const handleMakeAllFeatured = async () => {
    if (
      !confirm(
        `Are you sure you want to make all ${autoTrendingCards.length} auto-populated cards featured?`
      )
    ) {
      return;
    }

    try {
      setSyncing(true);
      const nonFeaturedCards = autoTrendingCards.filter(
        (card) => !featuredCards.some((fc) => fc.product_id === card.product_id)
      );

      // Add cards starting from the next available position
      const startPosition = featuredCards.length + 1;
      const promises = nonFeaturedCards.map((card, index) => {
        return admin.addTrendingCard({
          product_id: card.product_id,
          position: startPosition + index,
          featured_until: null,
          notes: "Auto-populated from trending algorithm",
        });
      });

      await Promise.all(promises);
      await Promise.all([loadFeaturedCards(), loadAutoTrendingCards()]);
      setSelectedAutoCards(new Set());
      alert(`Successfully added ${nonFeaturedCards.length} cards to featured!`);
    } catch (error) {
      console.error("Error making all cards featured:", error);
      alert("Failed to make all cards featured");
    } finally {
      setSyncing(false);
    }
  };

  const handleMakeSelectedFeatured = async () => {
    if (selectedAutoCards.size === 0) return;

    try {
      setSyncing(true);
      const cardsToFeature = autoTrendingCards.filter((card) =>
        selectedAutoCards.has(card.product_id.toString())
      );

      const nonFeaturedCards = cardsToFeature.filter(
        (card) => !featuredCards.some((fc) => fc.product_id === card.product_id)
      );

      if (nonFeaturedCards.length === 0) {
        alert("All selected cards are already featured!");
        setSelectedAutoCards(new Set());
        return;
      }

      const startPosition = featuredCards.length + 1;
      const promises = nonFeaturedCards.map((card, index) => {
        return admin.addTrendingCard({
          product_id: card.product_id,
          position: startPosition + index,
          featured_until: null,
          notes: "Auto-populated from trending algorithm",
        });
      });

      await Promise.all(promises);
      await Promise.all([loadFeaturedCards(), loadAutoTrendingCards()]);
      setSelectedAutoCards(new Set());
      alert(`Successfully added ${nonFeaturedCards.length} cards to featured!`);
    } catch (error) {
      console.error("Error making selected cards featured:", error);
      alert("Failed to make selected cards featured");
    } finally {
      setSyncing(false);
    }
  };

  const handleToggleCardSelection = (productId) => {
    const productIdStr = productId.toString();
    const newSelection = new Set(selectedAutoCards);
    if (newSelection.has(productIdStr)) {
      newSelection.delete(productIdStr);
    } else {
      newSelection.add(productIdStr);
    }
    setSelectedAutoCards(newSelection);
  };

  const handleSelectAll = () => {
    const nonFeaturedCardIds = autoTrendingCards
      .filter(
        (card) => !featuredCards.some((fc) => fc.product_id === card.product_id)
      )
      .map((card) => card.product_id.toString());
    setSelectedAutoCards(new Set(nonFeaturedCardIds));
  };

  const handleDeselectAll = () => {
    setSelectedAutoCards(new Set());
  };

  const getImageUrl = (card) => {
    // Handle different card structures (featured cards vs auto-populated)
    if (card.local_image_url) {
      return `http://localhost:3002${card.local_image_url}`;
    }
    if (card.image_url) {
      // If it's already a full URL, return as is, otherwise construct it
      if (card.image_url.startsWith("http")) {
        return card.image_url;
      }
      return card.image_url;
    }
    // Check for images object (from formatted cards)
    if (card.images && card.images.small) {
      return card.images.small;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">Loading trending cards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Manage Trending Cards
          </h1>
          <p className="text-slate-400">
            Manually feature cards in the trending section
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Add Card
        </button>
      </div>

      {/* Auto-Populated Trending Cards */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">
              Auto-Populated Trending Cards ({autoTrendingCards.length})
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Cards automatically selected by the trending algorithm. Select
              cards and use "Make All Featured" or "Make Selected Featured" to
              feature them, or click individual "Add to Featured" buttons.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="flex gap-2">
              {autoTrendingCards.length > 0 && (
                <button
                  onClick={handleMakeAllFeatured}
                  disabled={syncing || loadingAuto}
                  className="px-3 py-1.5 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg
                    className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Make All Featured
                </button>
              )}
              {selectedAutoCards.size > 0 && (
                <button
                  onClick={handleMakeSelectedFeatured}
                  disabled={syncing || loadingAuto}
                  className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg
                    className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Make Selected Featured ({selectedAutoCards.size})
                </button>
              )}
              <button
                onClick={loadAutoTrendingCards}
                disabled={loadingAuto}
                className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <svg
                  className={`w-4 h-4 ${loadingAuto ? "animate-spin" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Refresh
              </button>
              <button
                onClick={() => {
                  setShowAutoCards(!showAutoCards);
                }}
                className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                {showAutoCards ? "Hide" : "Show"}
              </button>
            </div>
          </div>
        </div>

        {showAutoCards && (
          <>
            {loadingAuto ? (
              <div className="text-center py-8 text-slate-400">
                Loading trending cards...
              </div>
            ) : autoTrendingCards.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p>No auto-populated trending cards available.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSelectAll}
                      className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleDeselectAll}
                      className="px-3 py-1.5 text-sm bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Deselect All
                    </button>
                    {selectedAutoCards.size > 0 && (
                      <span className="text-slate-400 text-sm">
                        {selectedAutoCards.size} selected
                      </span>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {autoTrendingCards.map((card, index) => {
                    const isFeatured = featuredCards.some(
                      (fc) => fc.product_id === card.product_id
                    );
                    const isSelected = selectedAutoCards.has(
                      card.product_id.toString()
                    );
                    return (
                      <div
                        key={card.product_id}
                        className={`bg-slate-900/50 rounded-lg border transition-colors overflow-hidden relative ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/50"
                            : "border-slate-700/50 hover:border-slate-600/50"
                        }`}
                      >
                        {/* Selection Checkbox */}
                        {!isFeatured && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                handleToggleCardSelection(card.product_id)
                              }
                              className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-2 cursor-pointer"
                            />
                          </div>
                        )}
                        {getImageUrl(card) && (
                          <img
                            src={getImageUrl(card)}
                            alt={card.name}
                            className="w-full h-48 object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                            }}
                          />
                        )}
                        <div className="p-3">
                          <h3 className="text-white font-semibold text-sm mb-1 truncate">
                            {card.name}
                          </h3>
                          <p className="text-slate-400 text-xs mb-2 truncate">
                            {card.set_name}
                          </p>
                          {card.market_price && (
                            <p className="text-green-400 text-sm font-semibold mb-2">
                              ${parseFloat(card.market_price).toFixed(2)}
                            </p>
                          )}
                          {isFeatured ? (
                            <div className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs text-center">
                              Featured
                            </div>
                          ) : (
                            <button
                              onClick={() => handleAddCard(card)}
                              className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs transition-colors"
                            >
                              Add to Featured
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Featured Cards List */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          Featured Cards ({featuredCards.length})
        </h2>

        {featuredCards.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p>No featured cards yet. Click "Add Card" to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {featuredCards.map((card, index) => (
              <div
                key={card.id}
                className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 transition-colors"
              >
                {/* Position Controls */}
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveCard(index, "up")}
                    disabled={index === 0}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 15l7-7 7 7"
                      />
                    </svg>
                  </button>
                  <div className="text-center text-sm font-bold text-white px-2">
                    #{card.position}
                  </div>
                  <button
                    onClick={() => moveCard(index, "down")}
                    disabled={index === featuredCards.length - 1}
                    className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </button>
                </div>

                {/* Card Image */}
                {getImageUrl(card) && (
                  <img
                    src={getImageUrl(card)}
                    alt={card.card_name}
                    className="w-16 h-22 object-cover rounded border border-slate-700"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}

                {/* Card Info */}
                <div className="flex-1">
                  <h3 className="text-white font-semibold">{card.card_name}</h3>
                  <p className="text-slate-400 text-sm">{card.set_name}</p>
                  {card.ext_number && (
                    <p className="text-slate-500 text-xs">#{card.ext_number}</p>
                  )}
                  {card.market_price && (
                    <p className="text-green-400 text-sm font-semibold mt-1">
                      ${parseFloat(card.market_price).toFixed(2)}
                    </p>
                  )}
                  {card.notes && (
                    <p className="text-slate-500 text-xs mt-1 italic">
                      {card.notes}
                    </p>
                  )}
                  {card.featured_until && (
                    <p className="text-slate-500 text-xs mt-1">
                      Featured until:{" "}
                      {new Date(card.featured_until).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditCard(card)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">
                  {editingCard ? "Edit Featured Card" : "Add Featured Card"}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedCard(null);
                    setEditingCard(null);
                    setSearchResults([]);
                    setSearchTerm("");
                  }}
                  className="text-slate-400 hover:text-white"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>

              {!selectedCard ? (
                /* Search for Card */
                <div>
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                      placeholder="Search for a card..."
                      className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {searching ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.map((card) => (
                        <div
                          key={card.product_id}
                          onClick={() => handleAddCard(card)}
                          className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50 hover:border-slate-600/50 cursor-pointer transition-colors"
                        >
                          {getImageUrl(card) && (
                            <img
                              src={getImageUrl(card)}
                              alt={card.name}
                              className="w-12 h-16 object-cover rounded border border-slate-700"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="text-white font-medium">
                              {card.name}
                            </h3>
                            <p className="text-slate-400 text-sm">
                              {card.set_name}
                            </p>
                            {card.ext_number && (
                              <p className="text-slate-500 text-xs">
                                #{card.ext_number}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* Card Details Form */
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-lg">
                    {getImageUrl(selectedCard) && (
                      <img
                        src={getImageUrl(selectedCard)}
                        alt={selectedCard.card_name || selectedCard.name}
                        className="w-20 h-28 object-cover rounded border border-slate-700"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                    )}
                    <div>
                      <h3 className="text-white font-semibold text-lg">
                        {selectedCard.card_name || selectedCard.name}
                      </h3>
                      <p className="text-slate-400">
                        {selectedCard.set_name || selectedCard.clean_set_name}
                      </p>
                      {selectedCard.ext_number && (
                        <p className="text-slate-500 text-sm">
                          #{selectedCard.ext_number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Position
                    </label>
                    <input
                      type="number"
                      value={position}
                      onChange={(e) =>
                        setPosition(parseInt(e.target.value) || 1)
                      }
                      min="1"
                      max={featuredCards.length + 1}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Featured Until (optional)
                    </label>
                    <input
                      type="date"
                      value={featuredUntil}
                      onChange={(e) => setFeaturedUntil(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-slate-500 text-xs mt-1">
                      Leave empty to feature indefinitely
                    </p>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-sm font-medium mb-2">
                      Notes (optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows="3"
                      className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      placeholder="Add any notes about why this card is featured..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveCard}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg transition-colors"
                    >
                      {editingCard ? "Update Card" : "Add Card"}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedCard(null);
                        setSearchResults([]);
                        setSearchTerm("");
                      }}
                      className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                    >
                      Change Card
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
