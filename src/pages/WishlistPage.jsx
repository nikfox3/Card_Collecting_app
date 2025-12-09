import React, { useState, useEffect } from 'react';
import { API_URL } from '../utils/api';
import { useUser } from '../context/UserContext';

const WishlistPage = ({ onBack, onCardClick }) => {
  const { user } = useUser();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all'); // 'all', 'High', 'Medium', 'Low'
  const [sortBy, setSortBy] = useState('priority'); // 'priority', 'date', 'name', 'price'
  const [selectedItem, setSelectedItem] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editPriority, setEditPriority] = useState('Medium');
  const [editMaxPrice, setEditMaxPrice] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [openMenuId, setOpenMenuId] = useState(null);
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);

  const API_BASE = `${API_URL}/api/wishlist`;

  // Fetch wishlist items
  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const headers = {};
      if (user?.id) {
        headers['x-user-id'] = user.id;
      }

      const response = await fetch(`${API_BASE}?limit=200`, { headers });
      if (!response.ok) throw new Error('Failed to fetch wishlist');

      const result = await response.json();
      if (result.success) {
        setWishlistItems(result.data);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId && !event.target.closest('.wishlist-menu-container')) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openMenuId]);

  // Remove item from wishlist
  const handleRemoveItem = async (itemId) => {
    if (!window.confirm('Remove this card from your wishlist?')) return;
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_BASE}/${itemId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user.id
        }
      });

      if (!response.ok) throw new Error('Failed to remove item');

      setWishlistItems(wishlistItems.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  // Handle edit
  const handleStartEdit = (item) => {
    setSelectedItem(item);
    setEditPriority(item.priority || 'Medium');
    setEditMaxPrice(item.maxPrice || '');
    setEditNotes(item.notes || '');
    setPriorityDropdownOpen(false);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem || !user?.id) return;

    try {
      const response = await fetch(`${API_BASE}/${selectedItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.id
        },
        body: JSON.stringify({
          priority: editPriority,
          maxPrice: editMaxPrice ? parseFloat(editMaxPrice) : null,
          notes: editNotes
        })
      });

      if (!response.ok) throw new Error('Failed to update item');

      await fetchWishlist();
      setShowEditModal(false);
      setSelectedItem(null);
      setPriorityDropdownOpen(false);
    } catch (error) {
      console.error('Error updating item:', error);
      alert('Failed to update item. Please try again.');
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price) return 'N/A';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  // Filter and sort items
  const filteredAndSortedItems = wishlistItems
    .filter(item => {
      const matchesSearch = !searchQuery || 
        item.card?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.card?.set_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      
      return matchesSearch && matchesPriority;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 };
          return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
        case 'date':
          return new Date(b.addedAt) - new Date(a.addedAt);
        case 'name':
          return (a.card?.name || '').localeCompare(b.card?.name || '');
        case 'price':
          return (b.card?.market_price || 0) - (a.card?.market_price || 0);
        default:
          return 0;
      }
    });

  if (!user?.id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{
        background: 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)'
      }}>
        <div className="text-center">
          <p className="dark:text-white text-theme-primary text-xl mb-4">Please log in to view your wishlist</p>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onBack) {
                onBack();
              } else {
                console.warn("onBack handler not provided to WishlistPage");
              }
            }}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-colors cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{
        background: 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)'
      }}>
        <div className="dark:text-white text-theme-primary text-xl">Loading wishlist...</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen dark:text-white text-theme-primary transition-all duration-300 ease-in-out relative"
      style={{
        height: '100vh',
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
        position: 'relative',
        background: 'linear-gradient(rgba(0, 0, 0, 0.2) 0%, rgba(71, 135, 243, 0.2) 100%), linear-gradient(0deg, rgb(1, 1, 12) 0%, rgb(1, 1, 12) 100%), rgb(1, 1, 12)'
      }}
    >
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10 sticky top-0 z-20">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center hover:bg-white/20 transition-all duration-200 border border-white/20 cursor-pointer relative z-50"
              type="button"
            >
              <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-xl font-bold dark:text-white text-theme-primary">My Wishlist</h1>
              <p className="dark:text-gray-400 text-theme-secondary text-xs">{wishlistItems.length} {wishlistItems.length === 1 ? 'card' : 'cards'}</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="px-4 pb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full dark:bg-white/10 bg-[#e4e5f1]/80 backdrop-blur-md dark:border-white/20 border-[#d2d3db] rounded-lg px-4 py-2 pl-10 dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-[#9394a5] focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <svg className="absolute left-3 top-2.5 w-5 h-5 dark:text-gray-400 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 dark:bg-white/10 bg-[#e4e5f1]/80 dark:border-white/20 border-[#d2d3db] rounded-lg dark:text-white text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 dark:bg-white/10 bg-[#e4e5f1]/80 dark:border-white/20 border-[#d2d3db] rounded-lg dark:text-white text-theme-primary text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            >
              <option value="priority">Sort by Priority</option>
              <option value="date">Sort by Date</option>
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6 pb-24">
        {filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 dark:text-gray-500 text-theme-tertiary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p className="dark:text-gray-400 text-theme-secondary text-lg mb-2">
              {searchQuery || priorityFilter !== 'all' 
                ? 'No cards match your filters' 
                : 'Your wishlist is empty'}
            </p>
            <p className="dark:text-gray-500 text-theme-tertiary text-sm">
              {searchQuery || priorityFilter !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add cards you want to collect from the collection or search pages'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredAndSortedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:border-white/20 transition-all group relative"
              >
                {/* Priority Badge - Top Left */}
                <div className="absolute top-2 left-2 z-10">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${
                    item.priority === 'High' ? 'bg-red-500/30 text-red-400' :
                    item.priority === 'Medium' ? 'bg-yellow-500/30 text-yellow-400' :
                    'bg-blue-500/30 text-blue-400'
                  }`}>
                    {item.priority}
                  </span>
                </div>

                {/* Actions Menu - Top Right */}
                <div className="absolute top-2 right-2 z-10 wishlist-menu-container">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === item.id ? null : item.id);
                    }}
                    className="p-1.5 dark:bg-black/50 bg-white/50 dark:hover:bg-black/70 hover:bg-white/60 rounded-lg transition-all backdrop-blur-sm"
                    aria-label="More options"
                  >
                    <svg className="w-4 h-4 dark:text-gray-200 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                    </svg>
                  </button>
                  
                  {/* Dropdown Menu */}
                  {openMenuId === item.id && (
                    <>
                      {/* Backdrop to close menu */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setOpenMenuId(null)}
                      />
                      {/* Menu */}
                      <div className="absolute top-full right-0 mt-1 bg-gray-800 dark:bg-gray-900 rounded-lg shadow-xl border border-white/10 z-50 overflow-hidden min-w-[120px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit(item);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm dark:text-white text-theme-primary hover:bg-white/10 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveItem(item.id);
                            setOpenMenuId(null);
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {/* Card Image */}
                {item.card?.image_url ? (
                  <div 
                    className="relative w-full aspect-[2/3] rounded-lg overflow-hidden mb-2 cursor-pointer mt-8"
                    onClick={() => onCardClick && onCardClick(item.card)}
                  >
                    <img
                      src={item.card.image_url}
                      alt={item.card.name || 'Card'}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/200x280?text=No+Image';
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative w-full aspect-[2/3] rounded-lg bg-gray-700/50 flex items-center justify-center mb-2 mt-8">
                    <span className="dark:text-gray-500 text-theme-tertiary text-xs text-center px-2">No Image</span>
                  </div>
                )}

                {/* Card Info */}
                <div className="space-y-1">
                  <h3 
                    className="dark:text-white text-theme-primary text-sm font-semibold line-clamp-2 cursor-pointer dark:hover:text-blue-400 hover:text-[#6865E7] transition-colors"
                    onClick={() => onCardClick && onCardClick(item.card)}
                  >
                    {item.card?.name || `Card ${item.cardId}`}
                  </h3>
                  
                  {item.card?.set_name && (
                    <p className="dark:text-gray-400 text-theme-secondary text-xs">{item.card.set_name}</p>
                  )}

                  {item.card?.market_price && (
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 text-xs font-medium">
                        {formatPrice(item.card.market_price)}
                      </span>
                      {item.maxPrice && (
                        <span className="dark:text-gray-500 text-theme-tertiary text-xs">
                          Max: {formatPrice(item.maxPrice)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100500] flex items-center justify-center p-4"
          onClick={() => {
            setShowEditModal(false);
            setSelectedItem(null);
            setPriorityDropdownOpen(false);
          }}
        >
          <div 
            className="bg-gray-800 rounded-2xl w-full max-w-md relative overflow-visible"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 overflow-visible">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold dark:text-white text-theme-primary">Edit Wishlist Item</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                  className="dark:text-gray-400 text-theme-secondary dark:hover:text-white hover:text-theme-primary"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedItem.card && (
                <div className="mb-4 p-3 bg-gray-700/50 rounded-lg">
                  <p className="dark:text-white text-theme-primary font-semibold">{selectedItem.card.name}</p>
                  {selectedItem.card.set_name && (
                    <p className="dark:text-gray-400 text-theme-secondary text-sm">{selectedItem.card.set_name}</p>
                  )}
                </div>
              )}

              <div className="space-y-4">
                <div className="relative">
                  <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Priority</label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
                      className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg py-2.5 dark:text-white text-theme-primary focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer flex items-center justify-between"
                    >
                      <span className="px-4">{editPriority}</span>
                      <span className="px-4 flex items-center">
                        <svg 
                          className={`w-5 h-5 transition-transform ${priorityDropdownOpen ? 'transform rotate-180' : ''}`}
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </span>
                    </button>
                    
                    {priorityDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[100510]" 
                          onClick={() => setPriorityDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-1 dark:bg-gray-700 bg-gray-200 rounded-lg shadow-xl border border-white/10 z-[100520] overflow-hidden">
                          {['High', 'Medium', 'Low'].map((priority) => (
                            <button
                              key={priority}
                              type="button"
                              onClick={() => {
                                setEditPriority(priority);
                                setPriorityDropdownOpen(false);
                              }}
                              className={`w-full px-4 py-2.5 text-left dark:text-white text-theme-primary hover:dark:bg-gray-600 hover:bg-gray-300 transition-colors flex items-center justify-between ${
                                editPriority === priority ? 'dark:bg-gray-600 bg-gray-300' : ''
                              }`}
                            >
                              <span>{priority}</span>
                              {editPriority === priority && (
                                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Max Price (optional)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editMaxPrice}
                    onChange={(e) => setEditMaxPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-gray-700 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-white text-sm font-medium mb-2">Notes (optional)</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add notes about this card..."
                    rows="3"
                    className="w-full dark:bg-gray-700 bg-gray-200 rounded-lg px-4 py-2 dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-[#9394a5] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-lg py-2 font-medium transition-all"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedItem(null);
                  }}
                  className="px-6 py-2 dark:bg-gray-700 bg-gray-300 dark:hover:bg-gray-600 hover:bg-gray-400 dark:text-white text-theme-primary rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;


