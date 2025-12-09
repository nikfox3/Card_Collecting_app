import React, { useState, useEffect, useCallback, useRef } from 'react';
import { API_URL } from '../utils/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import ProUpgradeModal from '../components/ProUpgradeModal';
import { createPortal } from 'react-dom';

const BinderBuilder = ({ onBack }) => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [binders, setBinders] = useState([]);
  const [selectedBinder, setSelectedBinder] = useState(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showNewBinderModal, setShowNewBinderModal] = useState(false);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [newBinderName, setNewBinderName] = useState('');
  const [newBinderConfig, setNewBinderConfig] = useState('9-pocket');
  const [selectedCardForPocket, setSelectedCardForPocket] = useState(null);
  const [draggedCard, setDraggedCard] = useState(null);
  const [dragOverPocket, setDragOverPocket] = useState(null);
  const [longPressTarget, setLongPressTarget] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [longPressCardTarget, setLongPressCardTarget] = useState(null);
  const [longPressCardTimer, setLongPressCardTimer] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedPage, setDraggedPage] = useState(null);
  const [dragOverPage, setDragOverPage] = useState(null);
  const [openMenuBinder, setOpenMenuBinder] = useState(null);
  const [showEditBinderModal, setShowEditBinderModal] = useState(false);
  const [editingBinderName, setEditingBinderName] = useState('');
  const [touchStartPos, setTouchStartPos] = useState(null);
  const [removalMode, setRemovalMode] = useState(false);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [proUpgradeFeature, setProUpgradeFeature] = useState(null);
  const [proUpgradeLimit, setProUpgradeLimit] = useState(null);
  const [proUpgradeCurrent, setProUpgradeCurrent] = useState(null);
  
  const configDropdownRef = useRef(null);
  const menuRef = useRef(null);
  const longPressCardTimerRef = useRef(null);
  const selectedBinderRef = useRef(selectedBinder);
  const currentPageIndexRef = useRef(currentPageIndex);
  const draggedCardRef = useRef(null);
  const isDraggingRef = useRef(false);
  const isHandlingDropRef = useRef(false);
  const touchStartPosRef = useRef(null);
  const targetPageIdRef = useRef(null); // Track which page thumbnail we're hovering over
  
  // Fetch user's binders
  const fetchBinders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/binders`, {
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch binders');
      }
      
      const data = await response.json();
      setBinders(data.data || []);
    } catch (err) {
      console.error('Error fetching binders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Fetch binder details
  const fetchBinderDetails = useCallback(async (binderId) => {
    try {
      const response = await fetch(`${API_URL}/api/binders/${binderId}`, {
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch binder details');
      }
      
      const data = await response.json();
      setSelectedBinder(data.data);
      
      // Ensure current page index is valid
      if (data.data.pages && data.data.pages.length > 0) {
        setCurrentPageIndex(0);
      }
    } catch (err) {
      console.error('Error fetching binder details:', err);
      setError(err.message);
    }
  }, [user?.id]);

  // Create new binder
  const createBinder = async () => {
    if (!newBinderName.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/binders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || 'default-user'
        },
        body: JSON.stringify({
          name: newBinderName.trim(),
          pocket_config: newBinderConfig
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if it's a pro limit error
        if (response.status === 403 && errorData.requiresPro) {
          setProUpgradeFeature('binder');
          setProUpgradeLimit(errorData.limit);
          setProUpgradeCurrent(errorData.current);
          setShowProUpgradeModal(true);
          return;
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to create binder');
      }
      
      const data = await response.json();
      const binderId = data.data.id;
      
      // Add 4 default pages (only if user is pro or has less than 8 pages)
      const isPro = user?.isPro || false;
      const pagesToAdd = isPro ? 4 : Math.min(4, 8 - (data.data.pages?.length || 0));
      
      for (let i = 0; i < pagesToAdd; i++) {
        try {
          await fetch(`${API_URL}/api/binders/${binderId}/pages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'user-id': user?.id || 'default-user'
            },
            body: JSON.stringify({})
          });
        } catch (pageErr) {
          // If page creation fails due to limit, show upgrade modal
          const pageErrorData = await pageErr.json?.().catch(() => ({}));
          if (pageErrorData.requiresPro) {
            setProUpgradeFeature('page');
            setProUpgradeLimit(pageErrorData.limit);
            setProUpgradeCurrent(pageErrorData.current);
            setShowProUpgradeModal(true);
            break;
          }
        }
      }
      
      await fetchBinders();
      await fetchBinderDetails(binderId);
      setShowNewBinderModal(false);
      setNewBinderName('');
    } catch (err) {
      console.error('Error creating binder:', err);
      setError(err.message);
    }
  };

  // Delete binder
  const deleteBinder = async (binderId) => {
    if (!confirm('Are you sure you want to delete this binder?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/binders/${binderId}`, {
        method: 'DELETE',
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete binder');
      }
      
      setBinders(prev => prev.filter(binder => binder.id !== binderId));
      if (selectedBinder?.id === binderId) {
        setSelectedBinder(null);
      }
    } catch (err) {
      console.error('Error deleting binder:', err);
      setError(err.message);
    }
  };

  // Update binder
  const updateBinder = async () => {
    if (!selectedBinder || !editingBinderName.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/api/binders/${selectedBinder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || 'default-user'
        },
        body: JSON.stringify({
          name: editingBinderName.trim()
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to update binder');
      }
      
      await fetchBinders();
      await fetchBinderDetails(selectedBinder.id);
      setShowEditBinderModal(false);
      setEditingBinderName('');
    } catch (err) {
      console.error('Error updating binder:', err);
      setError(err.message);
    }
  };

  // Add new page
  const addPage = async () => {
    if (!selectedBinder) return;
    
    try {
      const response = await fetch(`${API_URL}/api/binders/${selectedBinder.id}/pages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || 'default-user'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Check if it's a pro limit error
        if (response.status === 403 && errorData.requiresPro) {
          setProUpgradeFeature('page');
          setProUpgradeLimit(errorData.limit);
          setProUpgradeCurrent(errorData.current);
          setShowProUpgradeModal(true);
          return;
        }
        
        throw new Error(errorData.message || errorData.error || 'Failed to add page');
      }
      
      const data = await response.json();
      setSelectedBinder(data.data);
      setCurrentPageIndex(data.data.pages.length - 1);
    } catch (err) {
      console.error('Error adding page:', err);
      setError(err.message);
    }
  };

  // Delete page
  const deletePage = async (pageId) => {
    if (!selectedBinder) return;
    
    try {
      const response = await fetch(`${API_URL}/api/binders/${selectedBinder.id}/pages/${pageId}`, {
        method: 'DELETE',
        headers: {
          'user-id': user?.id || 'default-user'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete page');
      }
      
      const data = await response.json();
      setSelectedBinder(data.data);
      
      // Adjust current page index
      if (data.data.pages.length === 0) {
        setCurrentPageIndex(0);
      } else if (currentPageIndex >= data.data.pages.length) {
        setCurrentPageIndex(data.data.pages.length - 1);
      }
    } catch (err) {
      console.error('Error deleting page:', err);
      setError(err.message);
    }
  };

  // Handle card click to open card profile
  const handleCardClick = async (card) => {
    if (!card || !card.product_id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/cards/${card.product_id}?t=${Date.now()}`);
      if (response.ok) {
        const result = await response.json();
        let cardData = result.data;
        
        const parseJSONField = (field) => {
          if (!field) return field;
          if (typeof field === 'object') return field;
          if (typeof field === 'string') {
            try {
              let parsed = JSON.parse(field);
              if (typeof parsed === 'string') parsed = JSON.parse(parsed);
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
        
        const event = new CustomEvent('openCardProfileFromDeck', { detail: cardData });
        window.dispatchEvent(event);
      } else {
        const event = new CustomEvent('openCardProfileFromDeck', { detail: card });
        window.dispatchEvent(event);
      }
    } catch (error) {
      console.error('Error fetching card data:', error);
      const event = new CustomEvent('openCardProfileFromDeck', { detail: card });
      window.dispatchEvent(event);
    }
  };

  // Handle pocket click to add card
  const handlePocketClick = (pocketPosition) => {
    // Navigate to search page
    const event = new CustomEvent('navigateToSearch', { 
      detail: { 
        source: 'binder',
        targetPocket: pocketPosition,
        currentPage: currentPageIndex
      } 
    });
    window.dispatchEvent(event);
  };

  // Handle long press on page thumbnail
  const handlePageLongPressStart = (e, pageId, pageIdx) => {
    // Don't prevent default - allow scrolling to work
    
    const timer = setTimeout(() => {
      setLongPressTarget({ pageId, pageIdx });
    }, 500);
    
    setLongPressTimer(timer);
  };

  const handlePageLongPressEnd = (e) => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };

  // Handle long press on card pocket
  const handleCardLongPressStart = (e, pageId, pocketPosition) => {
    // Don't prevent default - allow scrolling to work
    
    // Store touch/mouse position for drag detection
    const pos = e.touches ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : { x: e.clientX, y: e.clientY };
    touchStartPosRef.current = pos;
    setTouchStartPos(pos);
    
    const timer = setTimeout(() => {
      setLongPressCardTarget({ pageId, pocketPosition });
    }, 500);
    
    longPressCardTimerRef.current = timer;
    setLongPressCardTimer(timer);
  };

  const handleCardLongPressEnd = (e) => {
    if (longPressCardTimerRef.current) {
      clearTimeout(longPressCardTimerRef.current);
      longPressCardTimerRef.current = null;
      setLongPressCardTimer(null);
    }
    // Don't clear touchStartPos if we're dragging - let handleDragEnd handle it
    if (!isDraggingRef.current) {
      touchStartPosRef.current = null;
      setTouchStartPos(null);
    }
  };

  // Remove card from pocket
  const removeCardFromPocket = async (pageId, pocketPosition) => {
    if (!selectedBinder) return;
    
    try {
      const response = await fetch(
        `${API_URL}/api/binders/${selectedBinder.id}/pockets/${pageId}/${pocketPosition}`,
        {
          method: 'DELETE',
          headers: {
            'user-id': user?.id || 'default-user'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Failed to remove card');
      }
      
      const data = await response.json();
      setSelectedBinder(data.data);
      setLongPressCardTarget(null);
    } catch (err) {
      console.error('Error removing card:', err);
      setError(err.message);
      setLongPressCardTarget(null);
    }
  };

  // Get current page
  const getCurrentPage = useCallback(() => {
    if (!selectedBinder || !selectedBinder.pages) return null;
    return selectedBinder.pages[currentPageIndex] || null;
  }, [selectedBinder, currentPageIndex]);

  // Find first empty pocket on a page
  const findFirstEmptyPocket = (pageId) => {
    if (!selectedBinderRef.current || !selectedBinderRef.current.pages) return null;
    
    const page = selectedBinderRef.current.pages.find(p => p.id === pageId);
    if (!page || !page.pockets) return null;
    
    const pocketCount = selectedBinderRef.current.pocket_config === '12-pocket' ? 12 : 9;
    
    // Find first empty pocket
    for (let i = 0; i < pocketCount; i++) {
      if (!page.pockets[i]) {
        return i;
      }
    }
    
    return null; // No empty pockets
  };

  // Handle drop
  const handleDrop = async (targetPageId, targetPocket) => {
    if (!draggedCardRef.current || !selectedBinderRef.current || isHandlingDropRef.current) return;
    
    isHandlingDropRef.current = true;
    
    try {
      // Prevent dropping on the same pocket
      if (draggedCardRef.current.pageId === targetPageId && draggedCardRef.current.pocketPosition === targetPocket) {
        setIsDragging(false);
        setDraggedCard(null);
        setDragOverPocket(null);
        touchStartPosRef.current = null;
        setTouchStartPos(null);
        isHandlingDropRef.current = false;
        targetPageIdRef.current = null;
        return;
      }
      // Check if target pocket is occupied
      const page = selectedBinderRef.current.pages.find(p => p.id === targetPageId);
      const isOccupied = page && page.pockets && page.pockets[targetPocket] !== null;
      
      // If occupied, find first empty pocket on that page
      let actualTargetPocket = targetPocket;
      if (isOccupied) {
        actualTargetPocket = findFirstEmptyPocket(targetPageId);
        
        // If no empty pockets, abort
        if (actualTargetPocket === null) {
          setIsDragging(false);
          setDraggedCard(null);
          setDragOverPocket(null);
          touchStartPosRef.current = null;
          setTouchStartPos(null);
          isHandlingDropRef.current = false;
          targetPageIdRef.current = null;
          return;
        }
      }
      
      // If dragging an existing card, delete it from the old position first
      if (draggedCardRef.current.pocketId) {
        const deleteResponse = await fetch(
          `${API_URL}/api/binders/${selectedBinderRef.current.id}/pockets/${draggedCardRef.current.pageId}/${draggedCardRef.current.pocketPosition}`,
          {
            method: 'DELETE',
            headers: {
              'user-id': user?.id || 'default-user'
            }
          }
        );
        
        if (!deleteResponse.ok) {
          throw new Error('Failed to remove card from old position');
        }
      }
      
      // Add card to the new position
      const response = await fetch(`${API_URL}/api/binders/${selectedBinderRef.current.id}/pockets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'user-id': user?.id || 'default-user'
        },
        body: JSON.stringify({
          page_id: targetPageId,
          product_id: draggedCardRef.current.product_id,
          pocket_position: actualTargetPocket,
          notes: ''
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to move card');
      }
      
      const data = await response.json();
      setSelectedBinder(data.data);
      
      // If we dropped on a different page, switch to that page now
      if (targetPageIdRef.current) {
        const droppedPageIdx = selectedBinderRef.current.pages.findIndex(p => p.id === targetPageIdRef.current);
        if (droppedPageIdx !== -1) {
          setCurrentPageIndex(droppedPageIdx);
        }
      }
      
      // Clear drag state completely
      setIsDragging(false);
      setDraggedCard(null);
      setDragOverPocket(null);
      touchStartPosRef.current = null;
      setTouchStartPos(null);
      isHandlingDropRef.current = false;
      targetPageIdRef.current = null;
    } catch (err) {
      console.error('Error moving card:', err);
      setError(err.message);
      // Clear drag state even on error
      setIsDragging(false);
      setDraggedCard(null);
      setDragOverPocket(null);
      touchStartPosRef.current = null;
      setTouchStartPos(null);
      isHandlingDropRef.current = false;
      targetPageIdRef.current = null;
    }
  };

  // Handle drag start
  const handleDragStart = useCallback((e, pocket, pageId, pocketPosition) => {
    if (!pocket || !pocket.card) return;
    
    // Cancel long press timer if dragging starts
    if (longPressCardTimerRef.current) {
      clearTimeout(longPressCardTimerRef.current);
      longPressCardTimerRef.current = null;
      setLongPressCardTimer(null);
    }
    
    const dragCard = {
      ...pocket.card,
      product_id: pocket.product_id,
      pageId,
      pocketPosition,
      pocketId: pocket.id
    };
    
    // Update refs immediately for synchronous access
    draggedCardRef.current = dragCard;
    isDraggingRef.current = true;
    
    setDraggedCard(dragCard);
    setIsDragging(true);
    
    // For mouse/trackpad
    if (e && e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', e.target.outerHTML);
    }
  }, []);

  // Handle drag over
  const handleDragOver = (e, pageId, pocketPosition) => {
    e.preventDefault();
    setDragOverPocket({ pageId, pocketPosition });
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedCard(null);
    setDragOverPocket(null);
    touchStartPosRef.current = null;
    setTouchStartPos(null);
    isHandlingDropRef.current = false;
    targetPageIdRef.current = null;
  };
  
  // Page drag and drop handlers
  const handlePageDragStart = (e, pageId, pageIdx) => {
    // Cancel long press timer
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    setDraggedPage({ pageId, pageIdx });
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  };
  
  const handlePageDragOver = (e, pageIdx) => {
    e.preventDefault();
    
    // If dragging a card, switch to that page
    if (draggedCard && pageIdx !== currentPageIndex) {
      setCurrentPageIndex(pageIdx);
    }
    
    // If dragging a page, track the hover state
    if (draggedPage) {
      setDragOverPage(pageIdx);
    }
  };
  
  const handlePageDragEnd = () => {
    setDraggedPage(null);
    setDragOverPage(null);
  };
  
  const handlePageDrop = async (e, pageIdx) => {
    e.preventDefault();
    if (!draggedPage || !selectedBinder) return;
    
    const sourceIdx = draggedPage.pageIdx;
    if (sourceIdx === pageIdx) {
      setDraggedPage(null);
      setDragOverPage(null);
      return;
    }
    
    // Reorder pages locally
    const newPages = [...selectedBinder.pages];
    const [movedPage] = newPages.splice(sourceIdx, 1);
    newPages.splice(pageIdx, 0, movedPage);
    
    // Update page numbers in the backend
    try {
      const updates = newPages.map((page, idx) =>
        fetch(`${API_URL}/api/binders/${selectedBinder.id}/pages/${page.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'user-id': user?.id || 'default-user'
          },
          body: JSON.stringify({ page_number: idx + 1 })
        })
      );
      
      await Promise.all(updates);
      await fetchBinderDetails(selectedBinder.id);
      
      // Update current page index if needed
      if (currentPageIndex === sourceIdx) {
        setCurrentPageIndex(pageIdx);
      } else if (currentPageIndex > sourceIdx && currentPageIndex <= pageIdx) {
        setCurrentPageIndex(currentPageIndex - 1);
      } else if (currentPageIndex < sourceIdx && currentPageIndex >= pageIdx) {
        setCurrentPageIndex(currentPageIndex + 1);
      }
    } catch (err) {
      console.error('Error reordering pages:', err);
      setError(err.message);
    }
    
    setDraggedPage(null);
    setDragOverPage(null);
  };

  useEffect(() => {
    fetchBinders();
  }, [fetchBinders]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (configDropdownRef.current && !configDropdownRef.current.contains(event.target)) {
        setShowNewBinderModal(false);
      }
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuBinder(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close long press delete overlay when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (longPressTarget && !event.target.closest('[data-page-thumbnail]')) {
        setLongPressTarget(null);
      }
      if (longPressCardTarget && !event.target.closest('[data-pocket]')) {
        setLongPressCardTarget(null);
      }
    };

    if (longPressTarget || longPressCardTarget) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [longPressTarget, longPressCardTarget]);

  // Keep refs in sync with state
  useEffect(() => {
    selectedBinderRef.current = selectedBinder;
    currentPageIndexRef.current = currentPageIndex;
  }, [selectedBinder, currentPageIndex]);
  
  // Keep drag state refs in sync
  useEffect(() => {
    draggedCardRef.current = draggedCard;
    isDraggingRef.current = isDragging;
  }, [draggedCard, isDragging]);

  // Handle touch move for drag and drop on mobile
  useEffect(() => {
    const handleTouchMove = (e) => {
      // Detect drag start from touch movement
      if (touchStartPosRef.current && !isDraggingRef.current) {
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartPosRef.current.y);
        
        // If moved more than 10px, it's a drag, not a long press
        if (deltaX > 10 || deltaY > 10) {
          // Cancel long press timer
          if (longPressCardTimerRef.current) {
            clearTimeout(longPressCardTimerRef.current);
            longPressCardTimerRef.current = null;
            setLongPressCardTimer(null);
          }
          
          // Get the card that was touched
          const element = document.elementFromPoint(touchStartPosRef.current.x, touchStartPosRef.current.y);
          let cardContainer = element;
          while (cardContainer && !cardContainer.dataset?.pocket) {
            cardContainer = cardContainer.parentElement;
          }
          
          if (cardContainer && cardContainer.dataset?.pocket) {
            const pocketData = cardContainer.dataset.pocket;
            const lastDashIndex = pocketData.lastIndexOf('-');
            const pageId = pocketData.substring(0, lastDashIndex);
            const pocketPos = parseInt(pocketData.substring(lastDashIndex + 1));
            const currentPage = selectedBinderRef.current?.pages?.find(p => p.id === pageId);
            const pocket = currentPage?.pockets?.[pocketPos];
            
            if (pocket) {
              handleDragStart(null, pocket, pageId, pocketPos);
            }
          }
          
          touchStartPosRef.current = null;
          setTouchStartPos(null);
          e.preventDefault();
          return;
        }
      }
      
      if (!isDraggingRef.current || !draggedCardRef.current || !selectedBinderRef.current) return;
      
      e.preventDefault(); // Prevent scrolling while dragging
      
      // Get the element at the touch point
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      // First check if hovering over a page thumbnail
      let thumbnailContainer = element;
      while (thumbnailContainer && !thumbnailContainer.dataset?.pageThumbnail) {
        thumbnailContainer = thumbnailContainer.parentElement;
      }
      
      if (thumbnailContainer && thumbnailContainer.dataset?.pageThumbnail) {
        // Track which page thumbnail we're hovering over (don't switch pages yet)
        const thumbnailPageId = thumbnailContainer.dataset.pageThumbnail;
        targetPageIdRef.current = thumbnailPageId;
        return; // Don't prevent default - we want to allow scrolling
      }
      
      // Clear target page if not hovering over thumbnail
      targetPageIdRef.current = null;
      
      // Otherwise check for pocket
      if (!selectedBinderRef.current?.pages || !selectedBinderRef.current.pages[currentPageIndexRef.current]) return;
      const page = selectedBinderRef.current.pages[currentPageIndexRef.current];
      
      // Find the pocket container by traversing up the DOM tree
      let pocketContainer = element;
      while (pocketContainer && !pocketContainer.dataset?.pocketIndex) {
        pocketContainer = pocketContainer.parentElement;
      }
      
      if (pocketContainer && pocketContainer.dataset?.pocketIndex) {
        const pocketIndex = parseInt(pocketContainer.dataset.pocketIndex);
        setDragOverPocket({ pageId: page.id, pocketPosition: pocketIndex });
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleDragStart]);


  if (loading) {
    return (
      <div className="min-h-screen dark:bg-background bg-[#fafafa] flex items-center justify-center">
        <div className="dark:text-white text-theme-primary text-xl">Loading binders...</div>
      </div>
    );
  }

  const currentPage = getCurrentPage();
  const pocketCount = selectedBinder?.pocket_config === '12-pocket' ? 12 : 9;
  const gridCols = pocketCount === 12 ? 'grid-cols-4' : 'grid-cols-3';

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
      {/* If no binder is selected, show binder list */}
      {!selectedBinder ? (
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
                <h1 className="text-xl font-bold dark:text-white text-theme-primary">Digital Binders</h1>
              </div>
              
              <button
                onClick={() => setShowNewBinderModal(true)}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors text-sm"
              >
                + New
              </button>
            </div>
          </div>

          {/* Binder List */}
          <div className="px-4 py-4 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="dark:text-white text-theme-primary text-lg font-semibold">My Binders</h2>
                <span className="dark:text-gray-400 text-theme-secondary text-sm">{binders.length} binder{binders.length !== 1 ? 's' : ''}</span>
              </div>
              
              {binders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 dark:bg-gray-700 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-10 h-10 dark:text-gray-400 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <p className="dark:text-gray-400 text-theme-secondary text-base mb-2">No binders yet</p>
                  <p className="dark:text-gray-500 text-theme-tertiary text-sm">Create your first digital binder to get started</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {binders.map((binder, index) => {
                    // Fallback gradient based on index for variety
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
                    const dominantColors = binder.dominant_colors;
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
                    } else if (binder.first_card_image) {
                      // Fallback to purple/indigo/blue for cards without extracted colors yet
                      gradientClass = 'from-purple-600/20 via-indigo-600/20 to-blue-600/20';
                      glowClass = 'hover:shadow-purple-500/50';
                      borderClass = 'border-purple-500/30 hover:border-purple-400/50';
                    } else {
                      // Use index-based colors for binders without cards
                      gradientClass = gradientColors[colorIndex];
                      glowClass = glowColors[colorIndex];
                      borderClass = borderColors[colorIndex];
                    }
                    
                    return (
                      <div
                        key={binder.id}
                        onClick={() => fetchBinderDetails(binder.id)}
                        className={`relative p-4 rounded-xl border-2 ${customStyle ? '' : `bg-gradient-to-br ${gradientClass}`} ${borderClass} cursor-pointer transition-all hover:shadow-lg ${glowClass} hover:scale-[1.02] backdrop-blur-sm overflow-hidden`}
                        style={customStyle}
                      >
                        {/* First card image background */}
                        {binder.first_card_image && (
                          <>
                            {/* Blurred background for depth */}
                            <div className="absolute right-0 top-0 bottom-0 pointer-events-none overflow-hidden">
                              <img
                                src={binder.first_card_image}
                                alt=""
                                className="h-full w-full object-cover opacity-30 scale-[2.5] -rotate-12 blur-2xl"
                              />
                            </div>
                            {/* Main card image */}
                            <div className="absolute right-0 top-0 bottom-0 pointer-events-none">
                              <img
                                src={binder.first_card_image}
                                alt=""
                                className="h-full object-contain opacity-60 scale-[1.8] -rotate-12"
                              />
                            </div>
                          </>
                        )}
                        
                        <div className="relative z-10 flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="dark:text-white text-theme-primary font-semibold text-base mb-1 drop-shadow-lg">{binder.name}</h3>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="dark:text-gray-300 text-theme-primary font-medium">
                                {binder.page_count || 0} {binder.page_count === 1 ? 'page' : 'pages'}
                              </span>
                            </div>
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
          {/* Binder Detail View */}
          <div className="dark:bg-black/20 bg-[#fafafa]/95 backdrop-blur-sm dark:border-b border-b border-[#d2d3db] sticky top-0 z-10">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedBinder(null)}
                  className="w-10 h-10 dark:bg-white/10 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center dark:hover:bg-white/20 hover:bg-white/30 transition-all duration-200 dark:border-white/20 border-[#d2d3db] border"
                >
                  <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h1 className="text-xl font-bold dark:text-white text-theme-primary">{selectedBinder.name}</h1>
              </div>

              <div className="relative">
                <button
                  onClick={() => setOpenMenuBinder(openMenuBinder ? null : selectedBinder.id)}
                  className="w-10 h-10 dark:bg-white/10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 dark:text-white text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                {openMenuBinder === selectedBinder.id && (
                  <div 
                    ref={menuRef}
                    className="absolute right-0 top-12 w-44 dark:bg-gray-800 bg-white rounded-lg dark:border-white/10 border-[#d2d3db] border shadow-xl z-20"
                  >
                    <button
                      onClick={() => {
                        setEditingBinderName(selectedBinder.name);
                        setShowEditBinderModal(true);
                        setOpenMenuBinder(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 dark:text-white text-theme-primary dark:hover:bg-white/10 hover:bg-gray-100 transition-colors text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Binder</span>
                    </button>
                    <button
                      onClick={() => {
                        setRemovalMode(true);
                        setOpenMenuBinder(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 dark:text-white text-theme-primary dark:hover:bg-white/10 hover:bg-gray-100 transition-colors text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 12H6" />
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                      </svg>
                      <span>Remove Cards</span>
                    </button>
                    <button
                      onClick={(e) => {
                        deleteBinder(selectedBinder.id);
                        setOpenMenuBinder(null);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 dark:hover:bg-red-600/20 hover:bg-red-50 transition-colors text-left"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Delete Binder</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="px-4 py-4 space-y-6">
            {/* Page Thumbnails Scroller */}
            {selectedBinder.pages && selectedBinder.pages.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="dark:text-white text-theme-primary font-medium">
                    {selectedBinder.name} - Page {currentPageIndex + 1} of {selectedBinder.pages.length}
                  </div>
                  <div className="flex items-center gap-2">
                    {removalMode && (
                      <button
                        onClick={() => setRemovalMode(false)}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                      >
                        Done
                      </button>
                    )}
                    {currentPage && currentPage.name && (
                      <div className="dark:text-gray-400 text-theme-secondary text-sm">{currentPage.name}</div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 binder-thumbnail-scroll scroll-smooth">
                  {selectedBinder.pages.map((page, idx) => (
                    <div
                      key={page.id}
                      data-page-thumbnail={page.id}
                      className="flex-shrink-0 w-24 h-32 relative"
                      draggable
                      onDragStart={(e) => handlePageDragStart(e, page.id, idx)}
                      onDragEnd={handlePageDragEnd}
                      onDragOver={(e) => handlePageDragOver(e, idx)}
                      onDrop={(e) => handlePageDrop(e, idx)}
                      onTouchEnd={(e) => {
                        // If dragging a card over a page thumbnail, drop it on the first empty pocket
                        if (isDraggingRef.current && draggedCardRef.current && !draggedPage && !isHandlingDropRef.current) {
                          e.stopPropagation(); // Prevent bubbling to pocket containers
                          // Find first empty pocket on this page
                          const pocketCount = selectedBinder.pocket_config === '12-pocket' ? 12 : 9;
                          for (let i = 0; i < pocketCount; i++) {
                            if (!page.pockets[i]) {
                              handleDrop(page.id, i);
                              break;
                            }
                          }
                        }
                      }}
                      style={{ 
                        opacity: draggedPage?.pageIdx === idx ? 0.5 : 1,
                        cursor: 'grab'
                      }}
                    >
                      <button
                        onClick={() => setCurrentPageIndex(idx)}
                        onTouchStart={(e) => handlePageLongPressStart(e, page.id, idx)}
                        onTouchEnd={handlePageLongPressEnd}
                        onMouseDown={(e) => handlePageLongPressStart(e, page.id, idx)}
                        onMouseUp={handlePageLongPressEnd}
                        onMouseLeave={handlePageLongPressEnd}
                        className={`w-full h-full dark:bg-white/5 bg-white/20 rounded-lg border-2 transition-all ${
                          idx === currentPageIndex 
                            ? 'border-blue-500 shadow-lg shadow-blue-500/50' 
                            : 'dark:border-white/10 border-[#d2d3db] dark:hover:border-white/30 hover:border-[#9394a5]'
                        } ${
                          dragOverPage === idx ? 'border-green-500' : ''
                        }`}
                      >
                        <div className={`grid ${gridCols} gap-0 p-0.5 h-full`}>
                          {Array.from({ length: pocketCount }).map((_, pocketIdx) => {
                            const pocket = page.pockets[pocketIdx];
                            return (
                              <div
                                key={pocketIdx}
                                className={`dark:bg-white/5 bg-white/30 rounded-sm ${
                                  pocket ? 'dark:border border-white/20 border-[#d2d3db]' : 'dark:border border-dashed border-white/10 border-[#d2d3db]'
                                }`}
                                style={{ aspectRatio: '0.7' }}
                              >
                                {pocket && (
                                  <img
                                    src={pocket.card?.image_url}
                                    alt=""
                                    className="w-full h-full object-cover rounded-sm"
                                    onError={(e) => {
                                      e.target.src = '/Assets/CardBack.svg';
                                    }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </button>
                      
                      {longPressTarget?.pageId === page.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(page.id);
                            setLongPressTarget(null);
                          }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-colors z-10 shadow-lg"
                        >
                          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                  
                  {/* Add Page Button */}
                  <button
                    onClick={addPage}
                    className="flex-shrink-0 w-24 h-32 dark:bg-white/5 bg-white/20 rounded-lg border-2 border-dashed dark:border-white/20 border-[#d2d3db] hover:border-blue-500/50 dark:hover:bg-white/10 hover:bg-white/30 transition-all flex items-center justify-center"
                  >
                    <svg className="w-8 h-8 dark:text-white/60 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* Pocket Grid */}
            {currentPage ? (
              <div className={`grid ${gridCols} gap-2`}>
                {Array.from({ length: pocketCount }).map((_, index) => {
                  const pocket = currentPage.pockets[index];
                  const isDragOver = dragOverPocket?.pageId === currentPage.id && dragOverPocket?.pocketPosition === index;
                  
                  return (
                    <div
                      key={index}
                      data-pocket-index={index}
                      data-pocket={`${currentPage.id}-${index}`}
                      className={`aspect-[2/2.8] dark:bg-white/5 bg-white/20 rounded-lg border-2 transition-all relative ${
                        pocket 
                          ? 'dark:border-white/20 border-[#d2d3db] hover:border-blue-500/50 cursor-pointer' 
                          : 'border-dashed dark:border-white/10 border-[#d2d3db] dark:hover:border-white/30 hover:border-[#9394a5] cursor-pointer'
                      } ${isDragOver ? 'border-blue-500 bg-blue-500/20' : ''}`}
                      onClick={() => !pocket && handlePocketClick(index)}
                      onDragOver={(e) => handleDragOver(e, currentPage.id, index)}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (draggedCardRef.current && !isHandlingDropRef.current) {
                          // Priority: targetPageIdRef (thumbnail hover) > dragOverPocket > currentPage
                          let targetPageId = targetPageIdRef.current 
                            ? targetPageIdRef.current
                            : (dragOverPocket?.pageId && dragOverPocket.pageId !== currentPage.id
                              ? dragOverPocket.pageId
                              : currentPage.id);
                          
                          // If dropping on a different page (from thumbnail), find first empty pocket
                          let targetIndex = index;
                          if (targetPageId !== currentPage.id && targetPageIdRef.current) {
                            const targetPage = selectedBinder.pages.find(p => p.id === targetPageId);
                            if (targetPage) {
                              const pocketCount = selectedBinder.pocket_config === '12-pocket' ? 12 : 9;
                              for (let i = 0; i < pocketCount; i++) {
                                if (!targetPage.pockets[i]) {
                                  targetIndex = i;
                                  break;
                                }
                              }
                            }
                          } else if (dragOverPocket?.pocketPosition !== undefined) {
                            targetIndex = dragOverPocket.pocketPosition;
                          }
                          
                          handleDrop(targetPageId, targetIndex);
                        }
                      }}
                      onTouchEnd={(e) => {
                        // Only handle touch end if we were dragging and didn't already drop
                        if (isDraggingRef.current && draggedCardRef.current && !isHandlingDropRef.current) {
                          // Priority: targetPageIdRef (thumbnail hover) > dragOverPocket > currentPage
                          let targetPageId = targetPageIdRef.current 
                            ? targetPageIdRef.current
                            : (dragOverPocket?.pageId && dragOverPocket.pageId !== currentPage.id
                              ? dragOverPocket.pageId
                              : currentPage.id);
                          
                          // If dropping on a different page (from thumbnail), find first empty pocket
                          let targetIndex = index;
                          if (targetPageId !== currentPage.id && targetPageIdRef.current) {
                            const targetPage = selectedBinder.pages.find(p => p.id === targetPageId);
                            if (targetPage) {
                              const pocketCount = selectedBinder.pocket_config === '12-pocket' ? 12 : 9;
                              for (let i = 0; i < pocketCount; i++) {
                                if (!targetPage.pockets[i]) {
                                  targetIndex = i;
                                  break;
                                }
                              }
                            }
                          } else if (dragOverPocket?.pocketPosition !== undefined) {
                            targetIndex = dragOverPocket.pocketPosition;
                          }
                          
                          handleDrop(targetPageId, targetIndex);
                        }
                      }}
                    >
                      {pocket ? (
                        <div className="relative w-full h-full">
                          <div
                            data-pocket={`${currentPage.id}-${index}`}
                            draggable={!removalMode}
                            onDragStart={(e) => {
                              // Prevent drag if in removal mode
                              if (removalMode) {
                                e.preventDefault();
                                return;
                              }
                              // Cancel long press timer if dragging starts
                              if (longPressCardTimerRef.current) {
                                clearTimeout(longPressCardTimerRef.current);
                                longPressCardTimerRef.current = null;
                                setLongPressCardTimer(null);
                              }
                              handleDragStart(e, pocket, currentPage.id, index);
                            }}
                            onDragEnd={handleDragEnd}
                            onTouchStart={(e) => {
                              if (!removalMode) {
                                handleCardLongPressStart(e, currentPage.id, index);
                              }
                            }}
                            onMouseDown={(e) => {
                              if (!removalMode) {
                                handleCardLongPressStart(e, currentPage.id, index);
                              }
                            }}
                            onMouseUp={handleCardLongPressEnd}
                            onMouseLeave={handleCardLongPressEnd}
                            onClick={(e) => {
                              // If in removal mode, remove the card
                              if (removalMode) {
                                e.stopPropagation();
                                removeCardFromPocket(currentPage.id, index);
                                return;
                              }
                              // Otherwise, open card profile if we're not dragging
                              if (!draggedCardRef.current && !longPressCardTarget) {
                                e.stopPropagation();
                                handleCardClick(pocket);
                              }
                            }}
                            className={`w-full h-full overflow-hidden rounded-lg ${removalMode ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing'}`}
                          >
                            <img
                              src={pocket.card?.image_url}
                              alt={pocket.card?.name || `Card ${pocket.product_id}`}
                              className="w-full h-full object-cover pointer-events-none"
                              onError={(e) => {
                                e.target.src = '/Assets/CardBack.svg';
                              }}
                              draggable="false"
                            />
                            {removalMode && (
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 dark:text-gray-600 text-theme-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 dark:bg-gray-700 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 dark:text-gray-400 text-theme-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="dark:text-gray-400 text-theme-secondary text-base mb-2">No pages yet</p>
                <p className="dark:text-gray-500 text-theme-tertiary text-sm">Add a page to start organizing your cards</p>
                <button 
                  onClick={addPage}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  + Add Page
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* New Binder Modal */}
      {showNewBinderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[99999]">
          <div className="dark:bg-gray-800 bg-white rounded-t-xl sm:rounded-xl p-6 w-full max-w-md dark:border-white/10 border-[#d2d3db] border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="dark:text-white text-theme-primary text-lg font-semibold">Create New Binder</h3>
              <button
                onClick={() => setShowNewBinderModal(false)}
                className="w-8 h-8 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 dark:text-gray-300 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Binder Name</label>
                <input
                  type="text"
                  value={newBinderName}
                  onChange={(e) => setNewBinderName(e.target.value)}
                  placeholder="Enter binder name..."
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Pocket Configuration</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewBinderConfig('9-pocket')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      newBinderConfig === '9-pocket'
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'dark:border-gray-600 border-[#d2d3db] dark:bg-gray-700/50 bg-gray-100 dark:hover:border-gray-500 hover:border-[#9394a5]'
                    }`}
                  >
                    <div className="grid grid-cols-3 gap-1 mb-2">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="aspect-square dark:bg-white/10 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                    <div className="dark:text-white text-theme-primary text-sm font-medium">9-Pocket</div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setNewBinderConfig('12-pocket')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      newBinderConfig === '12-pocket'
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'dark:border-gray-600 border-[#d2d3db] dark:bg-gray-700/50 bg-gray-100 dark:hover:border-gray-500 hover:border-[#9394a5]'
                    }`}
                  >
                    <div className="grid grid-cols-4 gap-1 mb-2">
                      {Array.from({ length: 12 }).map((_, i) => (
                        <div key={i} className="aspect-square dark:bg-white/10 bg-gray-300 rounded"></div>
                      ))}
                    </div>
                    <div className="dark:text-white text-theme-primary text-sm font-medium">12-Pocket</div>
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewBinderModal(false)}
                className="flex-1 px-4 py-2 dark:bg-gray-600 bg-gray-200 dark:hover:bg-gray-700 hover:bg-gray-300 dark:text-white text-theme-primary rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createBinder}
                disabled={!newBinderName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:dark:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Binder Modal */}
      {showEditBinderModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-[99999]">
          <div className="dark:bg-gray-800 bg-white rounded-t-xl sm:rounded-xl p-6 w-full max-w-md dark:border-white/10 border-[#d2d3db] border">
            <div className="flex items-center justify-between mb-6">
              <h3 className="dark:text-white text-theme-primary text-lg font-semibold">Edit Binder</h3>
              <button
                onClick={() => setShowEditBinderModal(false)}
                className="w-8 h-8 dark:bg-gray-700 bg-gray-200 dark:hover:bg-gray-600 hover:bg-gray-300 rounded-lg flex items-center justify-center transition-colors"
              >
                <svg className="w-4 h-4 dark:text-gray-300 text-theme-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block dark:text-white text-theme-primary text-sm font-medium mb-2">Binder Name</label>
                <input
                  type="text"
                  value={editingBinderName}
                  onChange={(e) => setEditingBinderName(e.target.value)}
                  placeholder="Enter binder name..."
                  className="w-full px-3 py-2 dark:bg-gray-700 bg-gray-100 dark:border-gray-600 border-[#d2d3db] border rounded-lg dark:text-white text-theme-primary dark:placeholder-gray-400 placeholder-theme-secondary focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditBinderModal(false)}
                className="flex-1 px-4 py-2 dark:bg-gray-600 bg-gray-200 dark:hover:bg-gray-700 hover:bg-gray-300 dark:text-white text-theme-primary rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={updateBinder}
                disabled={!editingBinderName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:dark:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
              >
                Save
              </button>
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

      {/* Pro Upgrade Modal */}
      {showProUpgradeModal && createPortal(
        <ProUpgradeModal
          isOpen={showProUpgradeModal}
          onClose={() => {
            setShowProUpgradeModal(false);
            setProUpgradeFeature(null);
            setProUpgradeLimit(null);
            setProUpgradeCurrent(null);
          }}
          feature={proUpgradeFeature}
          limit={proUpgradeLimit}
          current={proUpgradeCurrent}
        />,
        document.body
      )}
    </div>
    </>
  );
};

export default BinderBuilder;
