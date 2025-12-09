import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { admin } from "../utils/api";
import { SetSymbol } from "../utils/setSymbolMapping";
import { RaritySymbol } from "../utils/raritySymbolMapping";

// Energy symbol component
function EnergySymbol({ type, size = "w-6 h-6" }) {
  const getEnergySvg = (type) => {
    const svgMap = {
      Grass: "/Assets/Energies/Grass.svg",
      Fire: "/Assets/Energies/Fire.svg",
      Water: "/Assets/Energies/Water.svg",
      Lightning: "/Assets/Energies/Electric.svg",
      Electric: "/Assets/Energies/Electric.svg", // Handle both names
      Psychic: "/Assets/Energies/Psychic.svg",
      Fighting: "/Assets/Energies/Fighting.svg",
      Darkness: "/Assets/Energies/Darkness.svg",
      Metal: "/Assets/Energies/Metal.svg",
      Fairy: "/Assets/Energies/Fairy.svg",
      Dragon: "/Assets/Energies/Dragon.svg",
      Colorless: "/Assets/Energies/Colorless.svg",
    };

    return svgMap[type] || "/Assets/Energies/Colorless.svg";
  };

  return (
    <div className={`${size} flex items-center justify-center`}>
      <img
        src={getEnergySvg(type)}
        alt={type}
        className="w-full h-full object-contain"
        style={{ filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}
        onError={(e) => {
          console.log(
            "Failed to load energy symbol for:",
            type,
            "Path:",
            getEnergySvg(type)
          );
          e.target.style.display = "none";
        }}
      />
    </div>
  );
}

// Image hover preview component
function ImagePreview({ src, alt }) {
  const [isHovering, setIsHovering] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e) => {
    setIsHovering(true);
    updatePosition(e);
  };

  const handleMouseMove = (e) => {
    if (isHovering) {
      updatePosition(e);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const updatePosition = (e) => {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Get mouse position
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    // Card preview dimensions
    const previewWidth = 280;
    const previewHeight = 390;
    const offset = 20; // Offset from cursor

    let x, y;

    // Position to the right of cursor if there's room
    if (mouseX + offset + previewWidth < windowWidth) {
      x = mouseX + offset;
    } else {
      // Position to the left if not enough room on right
      x = mouseX - previewWidth - offset;
    }

    // Position below cursor, but keep on screen
    y = mouseY - 50; // Slightly above cursor
    if (y + previewHeight > windowHeight) {
      y = windowHeight - previewHeight - 10;
    }
    if (y < 10) {
      y = 10;
    }

    setPosition({ x, y });
  };

  // Add global mouse move listener when hovering
  useEffect(() => {
    if (isHovering) {
      const handleGlobalMouseMove = (e) => {
        updatePosition(e);
      };

      document.addEventListener("mousemove", handleGlobalMouseMove);

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove);
      };
    }
  }, [isHovering]);

  return (
    <div className="relative">
      <img
        src={src}
        alt={alt}
        className="w-12 h-16 object-cover rounded cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {isHovering && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <div className="bg-slate-900/95 backdrop-blur-xl border-2 border-blue-500/50 rounded-xl p-2 shadow-2xl">
            <img
              src={src.replace(".png", "_hires.png")}
              alt={alt}
              className="w-64 h-auto rounded-lg"
              onError={(e) => {
                // Fallback to regular size if hires doesn't exist
                e.target.src = src;
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Helper function to format card numbers
function formatCardNumber(number, printedTotal) {
  if (!number) return "?/?";

  // If number already has proper format (XXX/YYY), return as is
  if (number.includes("/") && !number.includes("???")) {
    return number;
  }

  // Extract the card number part (before /)
  const cardNum = number.split("/")[0];

  // Use printed_total if available, otherwise use total, otherwise show ?
  const total = printedTotal || "?";

  return `${cardNum}/${total}`;
}

// Sort icon component
function SortIcon({ active, order }) {
  if (!active) {
    return (
      <svg
        className="w-4 h-4 text-slate-500"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
      </svg>
    );
  }
  return order === "asc" ? (
    <svg
      className="w-4 h-4 text-blue-400"
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
  ) : (
    <svg
      className="w-4 h-4 text-blue-400"
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
  );
}

export default function CardBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filter, setFilter] = useState(searchParams.get("filter") || "");
  const [languageFilter, setLanguageFilter] = useState(
    searchParams.get("language") || "all"
  ); // 'all', 'international', 'japanese'
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [sortBy, setSortBy] = useState("release_date"); // Default to newest first (shows Phantasmal Flames, etc.)
  const [sortOrder, setSortOrder] = useState("desc"); // Newest first
  // Fuzzy search is now automatic - no toggle needed

  // New filter and pagination states
  const [productType, setProductType] = useState("all"); // 'all', 'cards', 'sealed'
  const [itemsPerPage, setItemsPerPage] = useState(25); // 10, 25, 50, 100
  const [totalPages, setTotalPages] = useState(1);

  // Bulk edit state
  const [selectedCards, setSelectedCards] = useState([]);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({
    artist: "",
    rarity: "",
    current_value: "",
    regulation: "",
    format: "",
    release_date: "",
  });

  // Preview modal state
  const [previewCard, setPreviewCard] = useState(null);
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [conditionPrices, setConditionPrices] = useState(null);
  const [cardVariants, setCardVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState("Normal");
  const [variantPrices, setVariantPrices] = useState({});

  // Enhanced selection state for shift-click and drag
  const [lastSelectedIndex, setLastSelectedIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartIndex, setDragStartIndex] = useState(-1);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "a" && bulkEditMode) {
          e.preventDefault();
          selectAllOnPage();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [bulkEditMode]);

  // Helper function to clean card name (remove " - card number" suffix)
  const cleanCardName = (name) => {
    if (!name) return name;
    // Remove pattern like " - 123/456" or " - 123" at the end
    return name.replace(/\s*-\s*\d+\/?\d*$/, "");
  };

  // Helper function to check if a product is a sealed product
  const isSealedProduct = (card) => {
    if (!card.name) return false;
    const name = card.name.toLowerCase();
    return (
      name.includes("box") ||
      name.includes("pack") ||
      name.includes("bundle") ||
      name.includes("tin") ||
      name.includes("case") ||
      name.includes("collection") ||
      name.includes("display") ||
      name.includes("elite trainer") ||
      name.includes("premium") ||
      name.includes("starter") ||
      name.includes("theme deck")
    );
  };

  // Helper function to get artist display text
  const getArtistDisplay = (card) => {
    if (card.artist && card.artist.trim()) {
      return <span className="text-slate-300">{card.artist}</span>;
    } else if (isSealedProduct(card)) {
      return <span className="text-slate-500">N/A</span>;
    } else {
      return <span className="text-yellow-400">⚠️ Missing</span>;
    }
  };

  // Function to get higher quality image URL for enlarged view
  const getHighQualityImageUrl = (imageSrc) => {
    if (!imageSrc) return imageSrc;

    // If it's a TCGPlayer URL, try to get the high-res version
    if (imageSrc.includes("tcgplayer.com")) {
      return imageSrc
        .replace("_hq", "_hq")
        .replace("_small", "_hq")
        .replace("_medium", "_hq");
    }

    // If it's a TCGdx URL, try to get the high-res version
    if (imageSrc.includes("tcgdx.com")) {
      return imageSrc
        .replace("/small/", "/large/")
        .replace("/medium/", "/large/");
    }

    // Return original if no known pattern
    return imageSrc;
  };
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  const openPreview = async (card) => {
    console.log("Opening preview for card:", card);
    setPreviewCard(card);
    setShowPreviewModal(true);

    // Fetch full card data including battle stats
    try {
      const cardData = await admin.getCard(card.product_id);
      console.log("Card data response:", cardData);
      if (cardData.data.success && cardData.data.data) {
        setPreviewCard(cardData.data.data);
        console.log("Updated preview card:", cardData.data.data);
      }
    } catch (error) {
      console.error("Error fetching full card data:", error);
    }

    // Fetch condition pricing for this card
    const fetchConditionPrices = async (variantName) => {
      try {
        const response = await fetch(
          `http://localhost:3002/api/cards/${card.product_id}/condition-prices?variant=${variantName}`
        );
        if (response.ok) {
          const data = await response.json();
          setConditionPrices(data.data);
        } else {
          setConditionPrices(null);
        }
      } catch (error) {
        console.error("Error fetching condition prices:", error);
        setConditionPrices(null);
      }
    };

    // Fetch initial condition prices for the first variant
    fetchConditionPrices("Normal");

    // Fetch available variants for this card
    try {
      const variantsResponse = await fetch(
        `http://localhost:3002/api/cards/${card.product_id}/variants`
      );
      if (variantsResponse.ok) {
        const variantsData = await variantsResponse.json();
        if (variantsData.variants && variantsData.variants.length > 0) {
          setCardVariants(variantsData.variants);
          // Set first variant as selected
          setSelectedVariant(variantsData.variants[0].name || "Normal");
          // Set variant prices
          const priceMap = {};
          variantsData.variants.forEach((v) => {
            priceMap[v.name] = v.price;
          });
          setVariantPrices(priceMap);
        } else {
          // Default to Normal if no variants
          setCardVariants([{ name: "Normal", price: card.market_price }]);
          setSelectedVariant("Normal");
          setVariantPrices({ Normal: card.market_price });
        }
      } else {
        // Fallback to Normal if API fails
        setCardVariants([{ name: "Normal", price: card.market_price }]);
        setSelectedVariant("Normal");
        setVariantPrices({ Normal: card.market_price });
      }
    } catch (error) {
      console.error("Error fetching variants:", error);
      setCardVariants([{ name: "Normal", price: card.market_price }]);
      setSelectedVariant("Normal");
      setVariantPrices({ Normal: card.market_price });
    }
  };

  const closePreview = () => {
    setPreviewCard(null);
    setShowPreviewModal(false);
    setConditionPrices(null);
    setCardVariants([]);
    setSelectedVariant("Normal");
    setVariantPrices({});
  };

  const loadCards = async (forceRefresh = false) => {
    try {
      setLoading(true);

      // Add timestamp to force cache busting if needed
      const params = {
        page,
        limit: itemsPerPage,
        search: search,
        filter: filter,
        language: languageFilter !== "all" ? languageFilter : undefined, // Only send if not "all"
        sortBy: sortBy,
        sortOrder: sortOrder,
        productType: productType,
        fuzzySearch: true, // Always use fuzzy search
      };

      if (forceRefresh) {
        params._t = Date.now(); // Force cache busting
      }

      const response = await admin.getCards(params);

      setCards(response.data.data);
      setPagination(response.data.pagination);

      // Debug: Log sample card data to see if release_date is present
      if (response.data.data.length > 0) {
        console.log("Sample card from API:", {
          product_id: response.data.data[0].product_id,
          name: response.data.data[0].name,
          release_date: response.data.data[0].release_date,
          set_name: response.data.data[0].set_name,
        });
      }

      // Calculate total pages
      const total = response.data.pagination.total || 0;
      setTotalPages(Math.ceil(total / itemsPerPage));
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadCards();
    }, 300); // 300ms delay for search

    return () => clearTimeout(timeoutId);
  }, [search]);

  useEffect(() => {
    loadCards();
  }, [
    page,
    filter,
    languageFilter,
    sortBy,
    sortOrder,
    productType,
    itemsPerPage,
  ]);

  const handleSort = (column) => {
    if (sortBy === column) {
      // Toggle sort order if clicking same column
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // New column, default to desc for price, asc for others
      setSortBy(column);
      setSortOrder(column === "current_value" ? "desc" : "asc");
    }
    setPage(1); // Reset to first page when sorting changes
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearchParams({ search, filter, language: languageFilter, page: "1" });
    loadCards();
  };

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    setPage(1);
    setSearchParams({ filter: newFilter, language: languageFilter, page: "1" });
  };

  const handleLanguageFilterChange = (newLanguageFilter) => {
    setLanguageFilter(newLanguageFilter);
    setPage(1);
    setSearchParams({ filter, language: newLanguageFilter, page: "1" });
  };

  // Enhanced bulk edit handlers with shift-click and drag support
  const toggleCardSelection = (cardId, event = null, cardIndex = -1) => {
    // Handle shift-click selection
    if (
      event &&
      event.shiftKey &&
      lastSelectedIndex !== -1 &&
      cardIndex !== -1
    ) {
      const startIndex = Math.min(lastSelectedIndex, cardIndex);
      const endIndex = Math.max(lastSelectedIndex, cardIndex);
      const cardIdsToToggle = cards
        .slice(startIndex, endIndex + 1)
        .map((card) => card.product_id);

      setSelectedCards((prev) => {
        const newSelection = [...prev];
        cardIdsToToggle.forEach((id) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        return newSelection;
      });

      setLastSelectedIndex(cardIndex);
      return;
    }

    // Regular toggle
    setSelectedCards((prev) =>
      prev.includes(cardId)
        ? prev.filter((id) => id !== cardId)
        : [...prev, cardId]
    );

    if (cardIndex !== -1) {
      setLastSelectedIndex(cardIndex);
    }
  };

  const selectAllOnPage = () => {
    const allIds = cards.map((c) => c.product_id);
    setSelectedCards(allIds);
  };

  const clearSelection = () => {
    setSelectedCards([]);
    setLastSelectedIndex(-1);
  };

  // Drag selection handlers
  const handleDragStart = (cardIndex) => {
    setIsDragging(true);
    setDragStartIndex(cardIndex);
  };

  const handleDragOver = (cardIndex) => {
    if (!isDragging) return;

    const startIndex = Math.min(dragStartIndex, cardIndex);
    const endIndex = Math.max(dragStartIndex, cardIndex);
    const cardIdsToSelect = cards
      .slice(startIndex, endIndex + 1)
      .map((card) => card.product_id);

    setSelectedCards((prev) => {
      const newSelection = [...prev];
      cardIdsToSelect.forEach((id) => {
        if (!newSelection.includes(id)) {
          newSelection.push(id);
        }
      });
      return newSelection;
    });
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDragStartIndex(-1);
  };

  const handleBulkEdit = async () => {
    if (selectedCards.length === 0) {
      alert("Please select at least one card");
      return;
    }

    console.log("🔍 Bulk edit data:", bulkEditData);
    console.log("📅 Release date in bulk edit:", bulkEditData.release_date);

    try {
      // Filter out empty values
      const updates = {};
      if (bulkEditData.artist) updates.artist = bulkEditData.artist;
      if (bulkEditData.rarity) updates.rarity = bulkEditData.rarity;
      if (bulkEditData.current_value)
        updates.current_value = parseFloat(bulkEditData.current_value);
      if (bulkEditData.regulation) updates.regulation = bulkEditData.regulation;
      if (bulkEditData.format) updates.format = bulkEditData.format;

      // Handle release date separately since it's stored in groups table
      let releaseDateUpdate = null;
      if (bulkEditData.release_date) {
        releaseDateUpdate = bulkEditData.release_date;
        console.log("📅 Bulk edit release date detected:", releaseDateUpdate);
        console.log("📅 Release date type:", typeof releaseDateUpdate);
        console.log("📅 Release date length:", releaseDateUpdate?.length);
      } else {
        console.log("⚠️ No release date in bulk edit data:", bulkEditData);
      }

      if (Object.keys(updates).length === 0 && !releaseDateUpdate) {
        alert("Please fill in at least one field to update");
        return;
      }

      // Get unique group IDs for release date updates
      let groupIdsToUpdate = new Set();
      if (releaseDateUpdate) {
        // Get group IDs for all selected cards
        for (const cardId of selectedCards) {
          const card = await admin.getCard(cardId);
          if (card && card.group_id) {
            groupIdsToUpdate.add(card.group_id);
          }
        }
      }

      // Update each selected card
      for (const cardId of selectedCards) {
        if (Object.keys(updates).length > 0) {
          await admin.updateCard(cardId, updates);
        }
      }

      // Update release dates for affected groups
      if (releaseDateUpdate && groupIdsToUpdate.size > 0) {
        console.log(
          "Updating release dates for groups:",
          Array.from(groupIdsToUpdate),
          "to:",
          releaseDateUpdate
        );
        const updateResult = await admin.updateGroupsReleaseDate(
          Array.from(groupIdsToUpdate),
          releaseDateUpdate
        );
        console.log("Release dates update result:", updateResult);

        // Verify the update worked by checking a sample group
        if (groupIdsToUpdate.size > 0) {
          const sampleGroupId = Array.from(groupIdsToUpdate)[0];
          console.log("Verifying update for group:", sampleGroupId);
          // We could add a verification call here if needed
        }
      }

      alert(`✅ Successfully updated ${selectedCards.length} cards!`);
      setShowBulkEditModal(false);
      setBulkEditData({
        artist: "",
        rarity: "",
        current_value: "",
        regulation: "",
        format: "",
        release_date: "",
      });
      clearSelection();

      // Force reload with a small delay to ensure database changes are committed
      setTimeout(() => {
        console.log("Reloading cards to show updates...");
        // Force a complete refresh by resetting page to 1 and reloading with cache busting
        setPage(1);
        // Clear any cached data and force a fresh load
        setCards([]);
        setPagination({});
        loadCards(true); // Force refresh with cache busting
      }, 1000); // Increased delay to ensure database changes are committed
    } catch (error) {
      console.error("Error in bulk edit:", error);
      alert("❌ Error updating cards: " + error.message);
    }
  };

  const handleDelete = async (cardId, cardName) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${cardName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      await admin.deleteCard(cardId);
      // Refresh the cards list
      loadCards();
      alert("Card deleted successfully");
    } catch (error) {
      console.error("Error deleting card:", error);
      alert("Failed to delete card: " + error.message);
    }
  };

  // Accent color helper for glow based on card type
  const getAccentColor = (type) => {
    const key = (type || "").toLowerCase();
    const map = {
      fire: "#ef4444",
      water: "#3b82f6",
      grass: "#22c55e",
      electric: "#f59e0b",
      lightning: "#f59e0b",
      psychic: "#a855f7",
      fighting: "#f97316",
      darkness: "#0ea5e9",
      dark: "#0ea5e9",
      metal: "#94a3b8",
      steel: "#94a3b8",
      dragon: "#eab308",
      fairy: "#ec4899",
      colorless: "#ffffff",
      trainer: "#38bdf8",
    };
    return map[key] || "#60a5fa"; // default blue
  };

  const cleanSetNameLocal = (name) => {
    if (!name) return name;
    let n = String(name);
    // Remove common set prefixes
    n = n.replace(/^(SWSH\d+:\s*)/i, "");
    n = n.replace(/^(SV\d+:\s*)/i, "");
    n = n.replace(/^(SM\s*-\s*)/i, "");
    n = n.replace(/^(XY\s*-\s*)/i, "");
    n = n.replace(/^(ME\d+:\s*)/i, ""); // ME02: Phantasmal Flames
    n = n.replace(/^(M\d+[a-z]?:\s*)/i, ""); // M2a: Mega Dream, etc.
    n = n.replace(/^(SVE:\s*)/i, "");
    n = n.replace(/^(SV:\s*)/i, "");
    // Remove "High Class Pack:" prefix from Japanese sets
    n = n.replace(/^High Class Pack:\s*/i, "");
    // Clean up common Japanese set prefixes
    n = n.replace(/^sp\d+:\s*/i, "");
    n = n.replace(/^S\d+[a-z]:\s*/i, "");
    n = n.replace(/^SM\d+[A-Z]:\s*/i, "");
    return n.trim();
  };

  // Compute relative luminance from hex color (simple)
  const getLuminance = (hex) => {
    try {
      const h = hex.replace("#", "");
      const r = parseInt(h.substring(0, 2), 16) / 255;
      const g = parseInt(h.substring(2, 4), 16) / 255;
      const b = parseInt(h.substring(4, 6), 16) / 255;
      const toLin = (c) =>
        c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      const R = toLin(r),
        G = toLin(g),
        B = toLin(b);
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    } catch {
      return 0.5;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Card Browser</h1>
          <p className="text-slate-400">
            Browse and manage all {pagination.total?.toLocaleString() || 0}{" "}
            cards
            {selectedCards.length > 0 && (
              <span className="ml-2 text-blue-400 font-medium">
                • {selectedCards.length} selected
              </span>
            )}
            {bulkEditMode && (
              <div className="mt-2 text-sm text-slate-400">
                💡 <strong>Selection Tips:</strong> Click to select •
                Shift+Click for range • Drag across checkboxes • Ctrl+A to
                select all
              </div>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          {!bulkEditMode ? (
            <>
              <button
                onClick={() => setBulkEditMode(true)}
                className="px-6 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 border border-purple-500/50 rounded-xl font-medium transition-all duration-200 flex items-center gap-2"
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
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                Bulk Edit
              </button>
            </>
          ) : (
            <>
              <button
                onClick={selectAllOnPage}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-medium transition-colors"
              >
                Select All ({cards.length})
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowBulkEditModal(true)}
                disabled={selectedCards.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-medium shadow-lg transition-all duration-200"
              >
                Edit {selectedCards.length} Cards
              </button>
              <button
                onClick={() => {
                  setBulkEditMode(false);
                  clearSelection();
                }}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-4">
        <form onSubmit={handleSearch} className="flex gap-4 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchParams({
                search: e.target.value,
                filter,
                language: languageFilter,
                page: "1",
              });
            }}
            placeholder="Search by name, number, set, price, release date, artist, rarity..."
            className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Search
          </button>
        </form>

        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleFilterChange("")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === ""
                ? "bg-blue-500 text-white"
                : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
            }`}
          >
            All Cards
          </button>
          <button
            onClick={() => handleFilterChange("no_price")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "no_price"
                ? "bg-yellow-500 text-white"
                : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
            }`}
          >
            Missing Price
          </button>
          <button
            onClick={() => handleFilterChange("no_artist")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "no_artist"
                ? "bg-purple-500 text-white"
                : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
            }`}
          >
            Missing Artist
          </button>
          <button
            onClick={() => handleFilterChange("high_value")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === "high_value"
                ? "bg-green-500 text-white"
                : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
            }`}
          >
            High Value ($100+)
          </button>
          {/* Language/Region Selector */}
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4 ml-2">
            <span className="text-slate-400 text-sm font-medium">
              Language:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleLanguageFilterChange("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  languageFilter === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleLanguageFilterChange("international")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  languageFilter === "international"
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                International
              </button>
              <button
                onClick={() => handleLanguageFilterChange("japanese")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  languageFilter === "japanese"
                    ? "bg-purple-500 text-white"
                    : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                Japanese
              </button>
            </div>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => {
                setSortBy("release_date");
                setSortOrder("desc");
                setPage(1);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                sortBy === "release_date"
                  ? "bg-indigo-500 text-white"
                  : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
              }`}
            >
              📅 Newest First
            </button>
          </div>
        </div>
      </div>

      {/* Cards Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-slate-400">
            Loading cards...
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No cards found</div>
        ) : (
          <>
            {/* Filter and Pagination Controls */}
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left side - Filters */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Product Type Filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-300">
                      Type:
                    </label>
                    <select
                      value={productType}
                      onChange={(e) => setProductType(e.target.value)}
                      className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Products</option>
                      <option value="cards">Cards Only</option>
                      <option value="sealed">Sealed Products</option>
                    </select>
                  </div>

                  {/* Items Per Page */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-slate-300">
                      Show:
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) =>
                        setItemsPerPage(parseInt(e.target.value))
                      }
                      className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span className="text-sm text-slate-400">per page</span>
                  </div>
                </div>

                {/* Right side - Pagination Info */}
                <div className="flex items-center gap-4">
                  <div className="text-sm text-slate-400">
                    Showing {(page - 1) * itemsPerPage + 1} to{" "}
                    {Math.min(page * itemsPerPage, pagination.total || 0)} of{" "}
                    {pagination.total?.toLocaleString() || 0} results
                  </div>

                  {/* Pagination Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(1)}
                      disabled={page === 1}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm transition-colors"
                    >
                      First
                    </button>
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm transition-colors"
                    >
                      Previous
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, totalPages) },
                        (_, i) => {
                          const startPage = Math.max(1, page - 2);
                          const pageNum = startPage + i;
                          if (pageNum > totalPages) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                                pageNum === page
                                  ? "bg-blue-500 text-white"
                                  : "bg-slate-700 hover:bg-slate-600 text-white"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm transition-colors"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page === totalPages}
                      className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-sm transition-colors"
                    >
                      Last
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    {bulkEditMode && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                        <input
                          type="checkbox"
                          checked={
                            selectedCards.length === cards.length &&
                            cards.length > 0 &&
                            cards.every((card) =>
                              selectedCards.includes(card.product_id)
                            )
                          }
                          onChange={(e) =>
                            e.target.checked
                              ? selectAllOnPage()
                              : clearSelection()
                          }
                          className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500"
                        />
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Image
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        Name
                        <SortIcon
                          active={sortBy === "name"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("set_name")}
                    >
                      <div className="flex items-center gap-2">
                        Set
                        <SortIcon
                          active={sortBy === "set_name"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("ext_number")}
                    >
                      <div className="flex items-center gap-2">
                        Number
                        <SortIcon
                          active={sortBy === "ext_number"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("artist")}
                    >
                      <div className="flex items-center gap-2">
                        Artist
                        <SortIcon
                          active={sortBy === "artist"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("ext_rarity")}
                    >
                      <div className="flex items-center gap-2">
                        Rarity
                        <SortIcon
                          active={sortBy === "ext_rarity"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("market_price")}
                    >
                      <div className="flex items-center gap-2">
                        Price
                        <SortIcon
                          active={sortBy === "market_price"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("ext_card_type")}
                    >
                      <div className="flex items-center gap-2">
                        Type
                        <SortIcon
                          active={sortBy === "ext_card_type"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("ext_hp")}
                    >
                      <div className="flex items-center gap-2">
                        HP
                        <SortIcon
                          active={sortBy === "ext_hp"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th
                      className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase cursor-pointer hover:text-white transition-colors"
                      onClick={() => handleSort("release_date")}
                    >
                      <div className="flex items-center gap-2">
                        Release
                        <SortIcon
                          active={sortBy === "release_date"}
                          order={sortOrder}
                        />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {cards.map((card, index) => {
                    let imageUrl = "";
                    try {
                      // Use TCGCSV image_url first, then fall back to images object
                      if (card.image_url) {
                        imageUrl = card.image_url;
                      } else if (typeof card.images === "string") {
                        // Try to parse as JSON first
                        if (
                          card.images.trim().startsWith("{") ||
                          card.images.trim().startsWith("[")
                        ) {
                          const images = JSON.parse(card.images);
                          imageUrl =
                            images?.low ||
                            images?.small ||
                            images?.high ||
                            images?.large ||
                            "";
                        } else {
                          // It's a plain URL string - this shouldn't happen but handle it
                          imageUrl = "";
                        }
                      } else if (
                        card.images &&
                        typeof card.images === "object"
                      ) {
                        // Already an object
                        imageUrl =
                          card.images?.low ||
                          card.images?.small ||
                          card.images?.high ||
                          card.images?.large ||
                          "";
                      }
                    } catch (e) {
                      // If parsing fails, silently continue
                      imageUrl = "";
                    }

                    return (
                      <tr
                        key={card.product_id || `card-${index}`}
                        className={`hover:bg-slate-900/30 transition-colors ${
                          selectedCards.includes(card.product_id)
                            ? "bg-blue-500/10"
                            : ""
                        } ${
                          isDragging &&
                          index >=
                            Math.min(dragStartIndex, lastSelectedIndex) &&
                          index <= Math.max(dragStartIndex, lastSelectedIndex)
                            ? "bg-blue-500/5 ring-1 ring-blue-500/30"
                            : ""
                        }`}
                      >
                        {bulkEditMode && (
                          <td
                            className="px-4 py-3"
                            onMouseDown={() => handleDragStart(index)}
                            onMouseEnter={() => handleDragOver(index)}
                            onMouseUp={handleDragEnd}
                          >
                            <input
                              type="checkbox"
                              checked={selectedCards.includes(card.product_id)}
                              onChange={(e) =>
                                toggleCardSelection(card.product_id, e, index)
                              }
                              className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                            />
                          </td>
                        )}
                        <td
                          className="px-4 py-3 cursor-pointer"
                          onClick={() => openPreview(card)}
                        >
                          {imageUrl ? (
                            <div className="w-12 h-16 relative">
                              <img
                                src={imageUrl}
                                alt={
                                  card.clean_name ||
                                  card.cleanName ||
                                  cleanCardName(card.name)
                                }
                                className="w-full h-full object-cover rounded cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                                onError={(e) => {
                                  e.target.style.display = "none";
                                  e.target.nextSibling.style.display = "flex";
                                }}
                              />
                              <div
                                className="w-full h-full bg-slate-700 rounded flex items-center justify-center text-slate-500 text-xs"
                                style={{ display: "none" }}
                              >
                                Broken
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-16 bg-slate-700 rounded flex items-center justify-center text-slate-500 text-xs">
                              No img
                            </div>
                          )}
                        </td>
                        <td
                          className="px-4 py-3 text-white font-medium cursor-pointer hover:text-blue-400 transition-colors"
                          onClick={() => openPreview(card)}
                        >
                          {card.clean_name ||
                            card.cleanName ||
                            cleanCardName(card.name)}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {cleanSetNameLocal(
                            card.clean_set_name || card.set_name || card.set_id
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {card.ext_number || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {getArtistDisplay(card)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <RaritySymbol
                              rarityName={card.ext_rarity || "Common"}
                              className="w-3 h-3"
                              language={card.language || "en"}
                            />
                            <span className="text-slate-300">
                              {card.ext_rarity || "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {card.market_price && card.market_price > 0 ? (
                            <span className="text-green-400 font-semibold">
                              ${card.market_price.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {card.ext_card_type ? (
                            <div className="flex items-center gap-1">
                              <EnergySymbol
                                type={card.ext_card_type}
                                size="w-4 h-4"
                              />
                              <span>{card.ext_card_type}</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-300 text-sm">
                          {card.ext_hp ? (
                            <span className="font-semibold">{card.ext_hp}</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {card.release_date ? (
                            <span>
                              {new Date(card.release_date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                // Preserve current search state in URL
                                const currentParams = new URLSearchParams(
                                  window.location.search
                                );
                                navigate(
                                  `/cards/${
                                    card.product_id
                                  }?return=${encodeURIComponent(
                                    currentParams.toString()
                                  )}`
                                );
                              }}
                              className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm rounded transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(
                                  card.product_id,
                                  card.clean_name ||
                                    card.cleanName ||
                                    cleanCardName(card.name)
                                )
                              }
                              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm rounded transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 bg-slate-900/30 border-t border-slate-700/50 flex items-center justify-between">
            <div className="text-slate-400 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                className="px-4 py-2 bg-slate-900/50 hover:bg-slate-900/70 disabled:bg-slate-900/30 disabled:text-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page >= pagination.totalPages}
                className="px-4 py-2 bg-slate-900/50 hover:bg-slate-900/70 disabled:bg-slate-900/30 disabled:text-slate-600 text-white rounded-lg transition-colors text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Edit Modal */}
      {showBulkEditModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-white mb-4">
              Bulk Edit {selectedCards.length} Cards
            </h2>

            <p className="text-slate-400 text-sm mb-6">
              Fill in only the fields you want to update. Empty fields will be
              skipped.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Artist
                </label>
                <input
                  type="text"
                  value={bulkEditData.artist}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, artist: e.target.value })
                  }
                  placeholder="Leave empty to skip"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Rarity
                </label>
                <select
                  value={bulkEditData.rarity}
                  onChange={(e) =>
                    setBulkEditData({ ...bulkEditData, rarity: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Don't change</option>
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Rare Holo">Rare Holo</option>
                  <option value="Rare Ultra">Rare Ultra</option>
                  <option value="Rare Secret">Rare Secret</option>
                  <option value="Illustration Rare">Illustration Rare</option>
                  <option value="Special Illustration Rare">
                    Special Illustration Rare
                  </option>
                  <option value="Hyper Rare">Hyper Rare</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Value (USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bulkEditData.current_value}
                  onChange={(e) =>
                    setBulkEditData({
                      ...bulkEditData,
                      current_value: e.target.value,
                    })
                  }
                  placeholder="Leave empty to skip"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Release Date
                </label>
                <input
                  type="date"
                  value={bulkEditData.release_date}
                  onChange={(e) => {
                    console.log("📅 Date input changed:", e.target.value);
                    console.log("📅 Date input type:", typeof e.target.value);
                    setBulkEditData({
                      ...bulkEditData,
                      release_date: e.target.value,
                    });
                  }}
                  placeholder="Leave empty to skip"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Regulation
                  </label>
                  <select
                    value={bulkEditData.regulation}
                    onChange={(e) =>
                      setBulkEditData({
                        ...bulkEditData,
                        regulation: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Don't change</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                    <option value="F">F</option>
                    <option value="G">G</option>
                    <option value="H">H</option>
                    <option value="I">I</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Format
                  </label>
                  <select
                    value={bulkEditData.format}
                    onChange={(e) =>
                      setBulkEditData({
                        ...bulkEditData,
                        format: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Don't change</option>
                    <option value="Standard">Standard</option>
                    <option value="Expanded">Expanded</option>
                    <option value="Unlimited">Unlimited</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  console.log("🚀 Bulk edit button clicked!");
                  console.log("📊 Selected cards:", selectedCards);
                  console.log("📝 Bulk edit data:", bulkEditData);
                  handleBulkEdit();
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-medium shadow-lg transition-all duration-200"
              >
                Apply to {selectedCards.length} Cards
              </button>
              <button
                onClick={() => setShowBulkEditModal(false)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Preview Modal */}
      {showPreviewModal && previewCard && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <div
            className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6 flex items-center justify-between z-10">
              <h2 className="text-2xl font-bold text-white">
                {previewCard.clean_name ||
                  previewCard.cleanName ||
                  cleanCardName(previewCard.name || "Unknown Card")}
              </h2>
              <button
                onClick={closePreview}
                className="w-10 h-10 bg-slate-800 hover:bg-slate-700 rounded-xl flex items-center justify-center transition-colors"
              >
                <svg
                  className="w-6 h-6 text-white"
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

            <div className="p-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Card Image with glow */}
                <div className="flex flex-col items-center">
                  <div className="relative flex justify-center">
                    {/* Image-based glow perfectly aligned behind the card */}
                    {(() => {
                      let imageUrl = "";
                      try {
                        // Use TCGCSV image_url first, then fall back to images object
                        if (previewCard.image_url) {
                          imageUrl = previewCard.image_url;
                        } else if (typeof previewCard.images === "string") {
                          if (
                            previewCard.images.trim().startsWith("{") ||
                            previewCard.images.trim().startsWith("[")
                          ) {
                            const images = JSON.parse(previewCard.images);
                            imageUrl =
                              images?.high ||
                              images?.large ||
                              images?.low ||
                              images?.small ||
                              "";
                          } else {
                            // Plain URL string - shouldn't happen
                            imageUrl = "";
                          }
                        } else if (
                          previewCard.images &&
                          typeof previewCard.images === "object"
                        ) {
                          imageUrl =
                            previewCard.images?.high ||
                            previewCard.images?.large ||
                            previewCard.images?.low ||
                            previewCard.images?.small ||
                            "";
                        }
                      } catch (e) {
                        // Silently fail
                        imageUrl = "";
                      }

                      const glow = imageUrl ? (
                        <div
                          aria-hidden
                          className="absolute blur-2xl"
                          style={{
                            backgroundImage: `url(${imageUrl})`,
                            backgroundSize: "cover",
                            backgroundPosition: "center center",
                            filter: "blur(25px) saturate(1.3) brightness(1.1)",
                            width: "110%",
                            height: "110%",
                            left: "100px",
                            transform: "translateX(-50%) scale(1.05)",
                            top: "-2px",
                            zIndex: 1,
                            borderRadius: "8px",
                            opacity: 0.15,
                          }}
                        />
                      ) : null;

                      return imageUrl ? (
                        <div className="relative z-10">
                          {glow}
                          <img
                            src={imageUrl}
                            alt={cleanCardName(previewCard.name)}
                            className="max-w-full max-h-[32rem] w-auto h-auto object-contain rounded-xl shadow-2xl cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => setEnlargedImage(imageUrl)}
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                          <div
                            className="w-64 h-96 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500"
                            style={{ display: "none" }}
                          >
                            <div className="text-center">
                              <div className="text-2xl mb-2">🖼️</div>
                              <div>Image Not Available</div>
                              <div className="text-sm text-slate-400 mt-1">
                                Broken Link
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="w-64 h-96 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 z-0">
                          <div className="text-center">
                            <div className="text-2xl mb-2">🖼️</div>
                            <div>No Image Available</div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Edit Button */}
                  <div className="mt-4 w-full max-w-xs">
                    <button
                      onClick={() => {
                        closePreview();
                        // Preserve current search state in URL
                        const currentParams = new URLSearchParams(
                          window.location.search
                        );
                        navigate(
                          `/cards/${
                            previewCard.product_id
                          }?return=${encodeURIComponent(
                            currentParams.toString()
                          )}`
                        );
                      }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-medium shadow-lg transition-all duration-200"
                    >
                      Edit Card
                    </button>
                  </div>
                </div>

                {/* Card Details */}
                <div className="space-y-6">
                  {/* Card Header - Name, Type, HP */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h1 className="text-2xl font-bold text-blue-400 mb-1">
                          {previewCard.clean_name ||
                            previewCard.cleanName ||
                            cleanCardName(previewCard.name)}
                        </h1>
                        <div className="text-slate-400 text-sm">
                          {previewCard.ext_card_type || "Pokémon"}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {previewCard.ext_hp && (
                          <div className="text-slate-300 text-lg">
                            HP {previewCard.ext_hp}
                          </div>
                        )}
                        {previewCard.ext_card_type && (
                          <EnergySymbol
                            type={previewCard.ext_card_type}
                            size="w-8 h-8"
                          />
                        )}
                      </div>
                    </div>
                    <div className="text-blue-400 text-sm">
                      {previewCard.ext_stage || "Basic"}
                    </div>
                  </div>

                  {/* Abilities */}
                  {(() => {
                    try {
                      // Handle abilities that might be a string, array, or already parsed
                      let abilities = previewCard.abilities;

                      // If it's a string, parse it
                      if (
                        typeof abilities === "string" &&
                        abilities.trim() !== ""
                      ) {
                        abilities = JSON.parse(abilities);
                        // Handle double-encoded JSON (JSON string within JSON string)
                        if (typeof abilities === "string") {
                          abilities = JSON.parse(abilities);
                        }
                      }

                      if (Array.isArray(abilities) && abilities.length > 0) {
                        return (
                          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                            <div className="border-b border-slate-700/50 mb-4">
                              <h3 className="text-lg font-semibold text-slate-200 pb-2">
                                Abilities
                              </h3>
                            </div>
                            <div className="space-y-4">
                              {abilities.map((ability, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-start gap-3"
                                >
                                  <div className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm font-medium">
                                    {ability.type || "Ability"}
                                  </div>
                                  <div className="flex-1">
                                    <div className="font-medium text-slate-300 mb-1">
                                      {ability.name || `Ability ${idx + 1}`}
                                    </div>
                                    {(ability.text || ability.effect) && (
                                      <div
                                        className="text-sm text-slate-400"
                                        dangerouslySetInnerHTML={{
                                          __html: (
                                            ability.text || ability.effect
                                          )
                                            .replace(
                                              /\{G\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_74_8758)"><path d="M20 10.7356C20.0279 16.1897 15.5307 20.6913 10.1269 20.7268C4.35027 20.8292 -0.374579 15.8712 0.0234369 10.0902C0.230713 6.38791 2.63977 2.99471 6.04732 1.55133C12.56 -1.28682 20.03 3.56861 19.9998 10.7315V10.7356H20Z" fill="#1EA34A"/><path d="M14.1515 3.69844C13.8892 3.31232 13.4796 2.67423 13.2327 2.38536C13.1549 2.29618 13.0603 2.22565 12.9416 2.18817C12.8036 2.14435 12.6403 2.1849 12.5077 2.21604C10.9046 2.65194 9.09204 3.66826 7.6215 4.58234C7.24213 4.82201 6.88373 5.06072 6.56031 5.28924C3.34408 7.44047 0.23648 12.3922 4.18837 15.3585C4.9296 15.8886 6.08558 16.1348 6.75721 16.7475C6.89603 16.8746 7.01409 17.017 7.10158 17.1828C7.18714 17.3412 7.23694 17.5248 7.26059 17.706C7.32673 18.234 7.23675 18.7127 7.75686 18.967C8.08277 19.1265 8.32985 19.1352 8.74094 19.2161C9.01897 19.2601 9.26951 19.3002 9.51371 19.3027C10.1753 19.2655 9.3793 17.5119 9.71694 17.1308C9.74117 17.1027 9.76521 17.0914 9.79712 17.0819C10.2659 16.9449 12.1172 16.7498 12.7857 16.5845C14.5331 16.1421 16.7512 15.3026 17.4579 13.5023C18.4344 10.5654 15.795 6.12682 14.1532 3.70075L14.1515 3.69825V3.69844ZM14.7339 13.102C13.0232 12.8073 11.0356 13.0943 9.54428 14.023C9.29393 14.179 9.00974 14.3745 8.78209 14.5571C8.71287 14.6138 8.66576 14.6601 8.62865 14.7149C8.34869 15.1321 8.41311 16.2026 8.38042 16.8851C8.37677 16.9487 8.37677 17.0235 8.35023 17.0714C8.30678 17.1523 8.21121 17.1753 8.15757 17.0445C8.03778 16.7629 7.8307 16.3339 7.7634 16.0074C7.69379 15.6541 7.71071 15.2938 7.69322 14.9393C7.68033 14.6841 7.64419 14.42 7.54362 14.1836C7.05524 13.0645 5.16707 12.2444 3.95245 12.1735C3.93456 12.1675 3.95302 12.1562 4.00821 12.1364C4.01897 12.1325 4.03128 12.1283 4.04435 12.1237C4.23952 12.0645 4.45429 11.9653 4.65599 11.9551C5.48279 11.9017 6.30497 12.0091 7.03197 12.4114C7.93299 12.8698 7.68418 12.8423 7.8555 12.1781C7.9451 11.777 8.14526 11.2809 8.01374 10.8817C7.823 10.4328 7.15215 9.96765 6.70433 9.71356C6.56685 9.63803 6.49879 9.63015 6.34862 9.5798C5.95002 9.45218 5.23302 9.22943 4.98921 9.14793C4.91153 9.12084 5.13746 9.08317 5.16264 9.07375C6.3265 8.80275 7.35423 9.04992 8.33331 9.69973C8.3858 9.72663 8.43637 9.73394 8.48194 9.7103C8.53655 9.68493 8.58731 9.6044 8.61942 9.54174C9.34123 8.17677 8.20256 7.24617 6.95314 6.77068C6.89815 6.74511 6.87257 6.71917 6.89026 6.69476C7.33346 6.4474 8.00336 6.66228 8.44579 6.86812C8.7344 6.99112 9.00398 7.25309 9.28278 7.36917C9.42795 7.43298 9.54659 7.40357 9.64618 7.2823C9.78924 7.10144 9.89307 6.89618 10.0148 6.69937C10.3636 6.06532 10.7499 5.45318 11.1821 4.87217C11.2073 4.83719 11.2344 4.80029 11.2634 4.77069C11.2955 4.73821 11.325 4.72188 11.3419 4.72918C11.3598 4.73591 11.3642 4.76724 11.3548 4.81144C11.3253 4.92714 11.2577 5.034 11.2131 5.14586C11.0837 5.46625 10.9523 5.78625 10.8304 6.10952C10.6897 6.49853 10.5626 6.89291 10.4407 7.28806C10.4278 7.33169 10.4013 7.42068 10.4422 7.44182C10.472 7.46354 10.5509 7.43817 10.5953 7.42414C11.5686 7.12028 12.6565 6.81507 13.6546 7.13911C13.7373 7.16852 13.8396 7.20331 13.9032 7.22752C13.9499 7.24559 13.9728 7.25847 13.968 7.2675C12.3427 7.48487 9.83385 7.8806 9.57908 9.767C9.56274 9.87578 9.56081 10.0069 9.71002 9.94574C11.2817 9.21098 12.9495 9.16985 14.521 9.93151C14.6023 9.9713 14.73 10.0426 14.6935 10.0837C14.6746 10.0953 14.6445 10.0947 14.6183 10.0933C14.5497 10.0883 14.4712 10.0726 14.4001 10.0637C13.2612 9.90038 12.2517 9.94593 11.146 10.3009C10.6903 10.4418 10.1607 10.6198 9.72406 10.8959C9.48102 11.0518 9.27643 11.2267 9.13338 11.4691C9.08108 11.5592 9.05358 11.634 9.01551 11.752C8.93072 12.0174 8.82227 12.4529 8.80189 12.7775C8.79266 12.9803 8.79324 13.2867 9.04532 13.1879C9.41641 13.0804 10.1332 12.772 10.5987 12.688C11.7214 12.4904 13.7688 12.381 14.7081 13.0257C14.7442 13.058 14.7567 13.0874 14.7348 13.1012L14.7335 13.102H14.7339Z" fill="black"/></g><defs><clipPath id="clip0_74_8758"><rect width="20" height="20" fill="white" transform="translate(0 0.728516)"/></clipPath></defs></svg></span>'
                                            )
                                            .replace(
                                              /\{R\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L15 8L21 9L15 10L12 16L9 10L3 9L9 8L12 2Z" fill="#EF4444"/></svg></span>'
                                            )
                                            .replace(
                                              /\{W\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L8 6L2 8L8 10L12 14L16 10L22 8L16 6L12 2Z" fill="#3B82F6"/></svg></span>'
                                            )
                                            .replace(
                                              /\{L\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14 7L19 8L14 9L12 14L10 9L5 8L10 7L12 2Z" fill="#F59E0B"/></svg></span>'
                                            )
                                            .replace(
                                              /\{P\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L13 8L19 9L13 10L12 16L11 10L5 9L11 8L12 2Z" fill="#8B5CF6"/></svg></span>'
                                            )
                                            .replace(
                                              /\{F\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L11 8L5 9L11 10L12 16L13 10L19 9L13 8L12 2Z" fill="#F97316"/></svg></span>'
                                            )
                                            .replace(
                                              /\{M\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L14 6L18 7L14 8L12 12L10 8L6 7L10 6L12 2Z" fill="#6B7280"/></svg></span>'
                                            )
                                            .replace(
                                              /\{D\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L11 6L7 7L11 8L12 12L13 8L17 7L13 6L12 2Z" fill="#1F2937"/></svg></span>'
                                            )
                                            .replace(
                                              /\{C\}/g,
                                              '<span class="inline-block w-4 h-4 mx-1 align-middle"><svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#9CA3AF"/></svg></span>'
                                            ),
                                        }}
                                      />
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                    } catch (e) {}
                    return null;
                  })()}

                  {/* Attacks */}
                  {(() => {
                    // Use parsed attacks from API if available, otherwise parse from ext_attack1/2
                    let attacks = [];
                    if (
                      previewCard.attacks &&
                      Array.isArray(previewCard.attacks) &&
                      previewCard.attacks.length > 0
                    ) {
                      attacks = previewCard.attacks;
                    } else {
                      // Parse attacks from ext_attack1 and ext_attack2
                      const parseAttack = (attackText) => {
                        if (!attackText) return null;

                        const parts = attackText.split(/<br\s*\/?>/i);
                        const header = parts[0] || "";
                        const description = parts.slice(1).join(" ").trim();

                        const energyCosts = [];
                        const energyPattern = /\[([^\]]+)\]/g;
                        let match;
                        while ((match = energyPattern.exec(header)) !== null) {
                          const energyType = match[1].trim();
                          const energyMap = {
                            Grass: "Grass",
                            G: "Grass",
                            Fire: "Fire",
                            R: "Fire",
                            Water: "Water",
                            W: "Water",
                            Lightning: "Lightning",
                            L: "Lightning",
                            Psychic: "Psychic",
                            P: "Psychic",
                            Fighting: "Fighting",
                            F: "Fighting",
                            Darkness: "Darkness",
                            D: "Darkness",
                            Metal: "Metal",
                            M: "Metal",
                            Colorless: "Colorless",
                            C: "Colorless",
                            Fairy: "Fairy",
                            Y: "Fairy",
                            Dragon: "Dragon",
                          };
                          const mappedEnergy =
                            energyMap[energyType] || energyType;
                          energyCosts.push(mappedEnergy);
                        }

                        const damageMatch = header.match(/\((\d+)\)\s*$/);
                        const damage = damageMatch ? damageMatch[1] : "";

                        let namePart = header
                          .replace(/\[([^\]]+)\]/g, "")
                          .trim();
                        if (damageMatch) {
                          namePart = namePart.replace(/\(\d+\)\s*$/, "").trim();
                        }
                        const attackName = namePart || "Unknown Attack";

                        return {
                          name: attackName,
                          cost: energyCosts,
                          damage: damage,
                          text: description,
                        };
                      };

                      if (previewCard.ext_attack1) {
                        const attack1 = parseAttack(previewCard.ext_attack1);
                        if (attack1) attacks.push(attack1);
                      }
                      if (previewCard.ext_attack2) {
                        const attack2 = parseAttack(previewCard.ext_attack2);
                        if (attack2) attacks.push(attack2);
                      }
                    }

                    // Energy symbol mapping
                    const energySymbols = {
                      "[C]": "/Assets/Energies/Colorless.svg",
                      "[G]": "/Assets/Energies/Grass.svg",
                      "[R]": "/Assets/Energies/Fire.svg",
                      "[W]": "/Assets/Energies/Water.svg",
                      "[L]": "/Assets/Energies/Electric.svg",
                      "[P]": "/Assets/Energies/Psychic.svg",
                      "[F]": "/Assets/Energies/Fighting.svg",
                      "[D]": "/Assets/Energies/Darkness.svg",
                      "[M]": "/Assets/Energies/Metal.svg",
                    };

                    // Function to parse attack text (name, damage, description)
                    const parseAttackText = (text) => {
                      if (!text)
                        return { name: "", damage: "", description: "" };

                      // Split by <br> tags to separate name/damage from description
                      const parts = text.split(/<br\s*\/?>/i);
                      const nameAndDamage = parts[0] || "";
                      const description = parts.slice(1).join("").trim();

                      // Extract damage amount (##) from name
                      const damageMatch = nameAndDamage.match(/(\d+)$/);
                      const damage = damageMatch ? damageMatch[1] : "";
                      const name = damageMatch
                        ? nameAndDamage.replace(/\d+$/, "").trim()
                        : nameAndDamage.trim();

                      return { name, damage, description };
                    };

                    // Function to render energy symbols in text
                    const renderEnergyText = (text) => {
                      if (!text) return text;

                      // Split text by energy symbols (including multiple letters in brackets)
                      const parts = text.split(/(\[[CGWRPLFDM]+\])/g);

                      return parts.map((part, index) => {
                        // Check if this part is an energy symbol pattern
                        if (part.match(/^\[[CGWRPLFDM]+\]$/)) {
                          // Extract individual energy letters from brackets
                          const energyLetters = part.slice(1, -1).split("");
                          return (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1"
                            >
                              {energyLetters.map((letter, letterIndex) => {
                                const energyKey = `[${letter}]`;
                                if (energySymbols[energyKey]) {
                                  return (
                                    <img
                                      key={letterIndex}
                                      src={energySymbols[energyKey]}
                                      alt={letter}
                                      className="inline-block w-4 h-4 align-middle"
                                    />
                                  );
                                }
                                return letter;
                              })}
                            </span>
                          );
                        }
                        return part;
                      });
                    };

                    if (attacks.length > 0) {
                      return (
                        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                          <div className="border-b border-slate-700/50 mb-4">
                            <h3 className="text-lg font-semibold text-slate-200 pb-2">
                              Attacks
                            </h3>
                          </div>
                          <div className="space-y-4">
                            {attacks.map((attack, idx) => {
                              // If attack is already parsed (has cost array), use it directly
                              // Otherwise, parse from text
                              const parsedAttack =
                                attack.cost && Array.isArray(attack.cost)
                                  ? attack
                                  : parseAttackText(
                                      attack.text || attack.name || ""
                                    );

                              // Helper to render energy icons
                              const renderEnergyIcons = (costs) => {
                                if (!costs || !Array.isArray(costs))
                                  return null;
                                return (
                                  <div className="flex items-center gap-1">
                                    {costs.map((energy, i) => {
                                      const energyMap = {
                                        Grass: "/Assets/Energies/Grass.svg",
                                        Fire: "/Assets/Energies/Fire.svg",
                                        Water: "/Assets/Energies/Water.svg",
                                        Lightning:
                                          "/Assets/Energies/Electric.svg",
                                        Psychic: "/Assets/Energies/Psychic.svg",
                                        Fighting:
                                          "/Assets/Energies/Fighting.svg",
                                        Darkness:
                                          "/Assets/Energies/Darkness.svg",
                                        Metal: "/Assets/Energies/Metal.svg",
                                        Colorless:
                                          "/Assets/Energies/Colorless.svg",
                                        Fairy: "/Assets/Energies/Fairy.svg",
                                        Dragon: "/Assets/Energies/Dragon.svg",
                                      };
                                      const iconPath =
                                        energyMap[energy] ||
                                        "/Assets/Energies/Colorless.svg";
                                      return (
                                        <img
                                          key={i}
                                          src={iconPath}
                                          alt={energy}
                                          className="w-5 h-5"
                                        />
                                      );
                                    })}
                                  </div>
                                );
                              };

                              return (
                                <div key={idx} className="space-y-2">
                                  <div className="flex items-center gap-3">
                                    {renderEnergyIcons(parsedAttack.cost)}
                                    <div className="font-medium text-slate-300">
                                      {parsedAttack.name || `Attack ${idx + 1}`}
                                      {parsedAttack.damage &&
                                        ` (${parsedAttack.damage})`}
                                    </div>
                                  </div>
                                  {parsedAttack.text && (
                                    <div className="text-sm text-slate-400 pl-4">
                                      {renderEnergyText(parsedAttack.text)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Battle Stats */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <div className="border-b border-slate-700/50 mb-4">
                      <h3 className="text-lg font-semibold text-slate-200 pb-2">
                        Battle Stats
                      </h3>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-sm">
                      {/* Weakness */}
                      <div>
                        <div className="text-slate-400 mb-2">Weakness</div>
                        {(() => {
                          try {
                            let weaknesses = null;

                            // Helper function to parse weakness string
                            const parseWeaknessString = (weaknessStr) => {
                              if (
                                !weaknessStr ||
                                typeof weaknessStr !== "string"
                              )
                                return null;
                              const trimmed = weaknessStr.trim();
                              if (!trimmed) return null;

                              // Try to parse as JSON first
                              try {
                                const parsed = JSON.parse(trimmed);
                                if (
                                  Array.isArray(parsed) &&
                                  parsed.length > 0
                                ) {
                                  return parsed;
                                }
                                if (typeof parsed === "object" && parsed.type) {
                                  return [parsed];
                                }
                              } catch (e) {
                                // Not JSON, continue with string parsing
                              }

                              // Parse string format like "Fire x2" or "Water×2"
                              const match = trimmed.match(
                                /^(.+?)(?:[\s×x]*(\d+))?$/i
                              );
                              if (match) {
                                const type = match[1].trim();
                                const valueMatch =
                                  trimmed.match(/[\s×x]*(\d+)/i);
                                const value = valueMatch
                                  ? `×${valueMatch[1]}`
                                  : "×2";
                                return [{ type, value }];
                              }

                              return null;
                            };

                            // First try to parse from weaknesses field
                            if (previewCard.weaknesses) {
                              weaknesses = parseWeaknessString(
                                previewCard.weaknesses
                              );
                              if (
                                !weaknesses &&
                                typeof previewCard.weaknesses === "object"
                              ) {
                                if (Array.isArray(previewCard.weaknesses)) {
                                  weaknesses = previewCard.weaknesses;
                                } else if (previewCard.weaknesses.type) {
                                  weaknesses = [previewCard.weaknesses];
                                }
                              }
                            }

                            // If not found, try to parse from ext_weakness
                            if (
                              (!weaknesses ||
                                !Array.isArray(weaknesses) ||
                                weaknesses.length === 0) &&
                              previewCard.ext_weakness
                            ) {
                              weaknesses = parseWeaknessString(
                                previewCard.ext_weakness
                              );
                              if (
                                !weaknesses &&
                                typeof previewCard.ext_weakness === "object"
                              ) {
                                if (Array.isArray(previewCard.ext_weakness)) {
                                  weaknesses = previewCard.ext_weakness;
                                } else if (previewCard.ext_weakness.type) {
                                  weaknesses = [previewCard.ext_weakness];
                                }
                              }
                            }

                            if (
                              Array.isArray(weaknesses) &&
                              weaknesses.length > 0
                            ) {
                              const weakness = weaknesses[0];
                              return (
                                <div className="flex items-center gap-2">
                                  <EnergySymbol
                                    type={weakness.type}
                                    size="w-6 h-6"
                                  />
                                  <span className="text-slate-300">
                                    {weakness.value}
                                  </span>
                                </div>
                              );
                            }
                          } catch (e) {
                            console.error("Error parsing weakness:", e);
                          }
                          return <span className="text-slate-500">—</span>;
                        })()}
                      </div>

                      {/* Resistance */}
                      <div>
                        <div className="text-slate-400 mb-2">Resistance</div>
                        {(() => {
                          try {
                            let resistances = null;

                            // Helper function to parse resistance string
                            const parseResistanceString = (resistanceStr) => {
                              if (
                                !resistanceStr ||
                                typeof resistanceStr !== "string"
                              )
                                return null;
                              const trimmed = resistanceStr.trim();
                              if (!trimmed || trimmed.toLowerCase() === "none")
                                return null;

                              // Try to parse as JSON first
                              try {
                                const parsed = JSON.parse(trimmed);
                                if (
                                  Array.isArray(parsed) &&
                                  parsed.length > 0
                                ) {
                                  return parsed;
                                }
                                if (typeof parsed === "object" && parsed.type) {
                                  return [parsed];
                                }
                              } catch (e) {
                                // Not JSON, continue with string parsing
                              }

                              // Parse string format - if it's just a type, default to -20
                              return [{ type: trimmed, value: "-20" }];
                            };

                            // First try to parse from resistances field
                            if (previewCard.resistances) {
                              resistances = parseResistanceString(
                                previewCard.resistances
                              );
                              if (
                                !resistances &&
                                typeof previewCard.resistances === "object"
                              ) {
                                if (Array.isArray(previewCard.resistances)) {
                                  resistances = previewCard.resistances;
                                } else if (previewCard.resistances.type) {
                                  resistances = [previewCard.resistances];
                                }
                              }
                            }

                            // If not found, try to parse from ext_resistance
                            if (
                              (!resistances ||
                                !Array.isArray(resistances) ||
                                resistances.length === 0) &&
                              previewCard.ext_resistance
                            ) {
                              resistances = parseResistanceString(
                                previewCard.ext_resistance
                              );
                              if (
                                !resistances &&
                                typeof previewCard.ext_resistance === "object"
                              ) {
                                if (Array.isArray(previewCard.ext_resistance)) {
                                  resistances = previewCard.ext_resistance;
                                } else if (previewCard.ext_resistance.type) {
                                  resistances = [previewCard.ext_resistance];
                                }
                              }
                            }

                            if (
                              Array.isArray(resistances) &&
                              resistances.length > 0
                            ) {
                              const resistance = resistances[0];
                              return (
                                <div className="flex items-center gap-2">
                                  <EnergySymbol
                                    type={resistance.type}
                                    size="w-6 h-6"
                                  />
                                  <span className="text-slate-300">
                                    {resistance.value}
                                  </span>
                                </div>
                              );
                            }
                          } catch (e) {
                            console.error("Error parsing resistance:", e);
                          }
                          return <span className="text-slate-500">—</span>;
                        })()}
                      </div>

                      {/* Retreat Cost */}
                      <div>
                        <div className="text-slate-400 mb-2">Retreat Cost</div>
                        {(() => {
                          try {
                            let retreatCost = previewCard.retreat_cost;

                            // Parse if string
                            if (typeof retreatCost === "string") {
                              if (retreatCost.trim().startsWith("[")) {
                                retreatCost = JSON.parse(retreatCost);
                              } else {
                                // Handle numeric strings like "1.0", "2.0", etc.
                                const numericValue = parseFloat(retreatCost);
                                if (!isNaN(numericValue) && numericValue > 0) {
                                  // Convert to array of Colorless energies
                                  retreatCost = Array(
                                    Math.floor(numericValue)
                                  ).fill("Colorless");
                                }
                              }
                            }

                            // Handle numeric values
                            if (
                              typeof retreatCost === "number" &&
                              retreatCost > 0
                            ) {
                              retreatCost = Array(Math.floor(retreatCost)).fill(
                                "Colorless"
                              );
                            }

                            if (
                              Array.isArray(retreatCost) &&
                              retreatCost.length > 0
                            ) {
                              return (
                                <div className="flex gap-1">
                                  {retreatCost.map((energy, i) => (
                                    <EnergySymbol
                                      key={i}
                                      type={energy}
                                      size="w-6 h-6"
                                    />
                                  ))}
                                </div>
                              );
                            }
                          } catch (e) {}
                          return <span className="text-slate-500">—</span>;
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Card Details */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    <div className="border-b border-slate-700/50 mb-4"></div>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                      <div>
                        <div className="text-slate-400 mb-2">Expansion</div>
                        <div className="flex items-center gap-2">
                          <SetSymbol
                            setName={cleanSetNameLocal(
                              previewCard.clean_set_name ||
                                previewCard.set_name ||
                                previewCard.set_id
                            )}
                            className="w-8 h-6"
                          />
                          <span className="text-blue-400">
                            {cleanSetNameLocal(
                              previewCard.clean_set_name ||
                                previewCard.set_name ||
                                previewCard.set_id
                            )}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-2">Card Number</div>
                        <span className="text-slate-300">
                          {previewCard.ext_number || "—"}
                        </span>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-2">Illustrator</div>
                        <span className="text-blue-400">
                          {previewCard.artist && previewCard.artist.trim()
                            ? previewCard.artist
                            : isSealedProduct(previewCard)
                            ? "N/A"
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-2">Rarity</div>
                        <div className="flex items-center gap-2">
                          <RaritySymbol
                            rarityName={previewCard.ext_rarity || "Common"}
                            className="w-4 h-4"
                            language={previewCard.language || "en"}
                          />
                          <span className="text-blue-400">
                            {previewCard.ext_rarity || "Common"}
                          </span>
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-2">Release Date</div>
                        <span className="text-blue-400">
                          {previewCard.release_date
                            ? new Date(
                                previewCard.release_date
                              ).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              })
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <div className="text-slate-400 mb-2">Card Type</div>
                        <span className="text-blue-400">
                          {previewCard.ext_card_type || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Actions */}
                  <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
                    {/* Variant Dropdown */}
                    <div className="mb-4">
                      <label className="block text-slate-400 text-sm mb-2">
                        Variant
                      </label>
                      <div className="relative">
                        <select
                          value={selectedVariant}
                          onChange={(e) => {
                            setSelectedVariant(e.target.value);
                            // Update prices based on variant
                            const selected = cardVariants.find(
                              (v) => v.name === e.target.value
                            );
                            if (selected) {
                              setVariantPrices((prev) => ({
                                ...prev,
                                [e.target.value]: selected.price,
                              }));

                              // Fetch condition prices for this variant
                              fetch(
                                `http://localhost:3002/api/cards/${previewCard.product_id}/condition-prices?variant=${e.target.value}`
                              )
                                .then((res) => res.json())
                                .then((data) =>
                                  setConditionPrices(data.data || null)
                                )
                                .catch((err) =>
                                  console.error(
                                    "Error fetching variant condition prices:",
                                    err
                                  )
                                );
                            }
                          }}
                          className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        >
                          {cardVariants.map((variant) => (
                            <option key={variant.name} value={variant.name}>
                              {variant.name}{" "}
                              {variant.price
                                ? `($${variant.price.toFixed(2)})`
                                : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Display market price for selected variant */}
                    {(() => {
                      // Get price for selected variant
                      const selectedVariantData = cardVariants.find(
                        (v) => v.name === selectedVariant
                      );
                      let displayPrice =
                        selectedVariantData?.price ||
                        variantPrices[selectedVariant] ||
                        previewCard.market_price;

                      // For condition pricing, we'd need to fetch variant-specific condition prices
                      // For now, show the variant price

                      if (displayPrice && displayPrice > 0) {
                        return (
                          <div className="mb-6">
                            <div className="text-slate-400 mb-2">
                              Market Value (Near Mint) - {selectedVariant}
                            </div>
                            <div className="text-3xl font-bold text-green-400">
                              ${displayPrice.toFixed(2)}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              {selectedVariantData?.market_price &&
                              selectedVariantData.market_price > 0
                                ? "Live pricing available"
                                : "Estimated pricing"}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Condition Pricing */}
                    {conditionPrices &&
                      Object.keys(conditionPrices).length > 0 && (
                        <div className="mt-6 pt-6 border-t border-slate-700">
                          <div className="text-slate-400 mb-3">
                            Condition & Graded Pricing
                          </div>
                          <div className="space-y-2">
                            {Object.entries(conditionPrices).map(
                              ([condition, price]) => (
                                <div
                                  key={condition}
                                  className="flex justify-between items-center text-sm"
                                >
                                  <span className="text-slate-300">
                                    {condition}:
                                  </span>
                                  <span className="text-green-400 font-semibold">
                                    ${price.toFixed(2)}
                                  </span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-[98vw] max-h-[98vh]">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={getHighQualityImageUrl(enlargedImage)}
              alt="Enlarged card"
              className="max-w-full max-h-[98vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              style={{
                minWidth: "400px",
                minHeight: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
