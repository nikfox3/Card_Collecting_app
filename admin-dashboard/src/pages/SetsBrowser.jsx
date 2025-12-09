import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { admin } from "../utils/api";

// Helper function to clean set name
function cleanSetName(name) {
  if (!name) return name;
  let n = String(name);
  n = n.replace(/^(SWSH\d+:\s*)/i, "");
  n = n.replace(/^(SV\d+:\s*)/i, "");
  n = n.replace(/^(SM\s*-\s*)/i, "");
  n = n.replace(/^(SM\s+)/i, "");
  n = n.replace(/^(XY\s*-\s*)/i, "");
  n = n.replace(/^(ME\d+:\s*)/i, "");
  n = n.replace(/^(SVE:\s*)/i, "");
  n = n.replace(/^(SV:\s*)/i, "");
  if (n === "Base Set" && name.includes("SM")) n = "Sun & Moon";
  if (n === "Scarlet & Violet Base Set") n = "Scarlet & Violet";
  if (n === "Sword & Shield Base Set") n = "Sword & Shield";
  if (n === "Scarlet & Violet 151") n = "151";
  return n.trim();
}

// Helper to determine series from set name (matching SetsPage logic)
function seriesFromSetName(rawName) {
  const raw = (rawName || "").toString().trim();
  const set = raw.toLowerCase();

  // Strong handling for code-prefixed set names
  if (/^sv\d+\s*:/i.test(raw)) return "Scarlet & Violet";
  if (/^swsh\d+\s*:/i.test(raw)) return "Sword & Shield";
  if (/^sm\d+\s*:/i.test(raw)) return "Sun & Moon";
  if (/^xy\d+\s*:/i.test(raw)) return "XY";
  if (/^me\d+\s*:/i.test(raw)) return "Mega Evolutions";

  // Keyword matching
  if (set.includes("scarlet") && set.includes("violet"))
    return "Scarlet & Violet";
  if (set.includes("sword") && set.includes("shield")) return "Sword & Shield";
  if (set.includes("sun") && set.includes("moon")) return "Sun & Moon";
  if (set.includes("heartgold") || set.includes("soul"))
    return "HeartGold & SoulSilver";
  if (set.includes("diamond") && set.includes("pearl"))
    return "Diamond & Pearl";
  if (set.includes("black") && set.includes("white")) return "Black & White";
  if (set.includes("platinum")) return "Platinum";
  if (set.includes("xy")) return "XY";
  if (set.includes("neo")) return "Neo";
  if (set.includes("gym")) return "Gym";
  if (set.includes("base")) return "Base";
  if (set.includes("mega")) return "Mega Evolutions";
  return "Scarlet & Violet";
}

// Helper function to get set symbol path (matching SetsPage.jsx logic exactly)
function getSetSymbolPath(setName, series) {
  if (!setName) return null;

  const cleanedName = cleanSetName(setName);
  const normalizedName = cleanedName
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/\s*\[[^\]]*\]/g, "")
    .replace(/\s*(?:-|—|–|:)\s*.*$/, "")
    .replace(/\s+/g, " ")
    .replace(/'/g, "_")
    .replace(/&/g, "_")
    .trim();

  const seriesFolderMap = {
    Base: "01 Base",
    Gym: "02 Gym",
    Neo: "03 Neo",
    "Legendary Collection": "04 Legendary Collection",
    "Team Rocket": "01 Base",
    eCard: "05 eCard",
    EX: "06 EX",
    "Diamond & Pearl": "07 Diamond and Pearl",
    Nintendo: "08 Nintendo",
    Platinum: "09 Platinum",
    "HeartGold & SoulSilver": "10 HeartGold SoulSilver",
    "Black & White": "11 Black & White",
    XY: "12 XY",
    "Sun & Moon": "13 Sun & Moon",
    "Sword & Shield": "14 Sword & Shield",
    "Scarlet & Violet": "15 Scarlet & Violet",
    "Mega Evolutions": "16 Mega Evolutions",
  };

  const normalizedSeriesKey = (() => {
    const s = (series || "").toString().toLowerCase();
    if (s.includes("scarlet") && s.includes("violet"))
      return "Scarlet & Violet";
    if (s.includes("sword") && s.includes("shield")) return "Sword & Shield";
    if (s.includes("sun") && s.includes("moon")) return "Sun & Moon";
    if (s.includes("heartgold") || s.includes("soul"))
      return "HeartGold & SoulSilver";
    if (s.includes("diamond") && s.includes("pearl")) return "Diamond & Pearl";
    if (s.includes("black") && s.includes("white")) return "Black & White";
    if (s.includes("legendary") && s.includes("collection"))
      return "Legendary Collection";
    if (s.includes("platinum")) return "Platinum";
    if (s.includes("nintendo")) return "Nintendo";
    if (s.includes("xy")) return "XY";
    if (s.includes("neo")) return "Neo";
    if (s.includes("gym")) return "Gym";
    if (s.includes("team rocket")) return "Team Rocket";
    if (s.includes("base")) return "Base";
    if (s.includes("e-card") || s.includes("ecard") || s.includes("e card"))
      return "eCard";
    if (s.includes("ex")) return "EX";
    if (s.includes("mega")) return "Mega Evolutions";
    return "";
  })();

  let seriesFolder =
    seriesFolderMap[normalizedSeriesKey] ||
    seriesFolderMap[series] ||
    "15 Scarlet & Violet";
  if (cleanedName === "Mega Evolution" || setName === "Mega Evolution")
    seriesFolder = "16 Mega Evolutions";
  if (cleanedName === "Call of Legends")
    seriesFolder = "10 HeartGold SoulSilver";
  if (
    cleanedName === "HeartGold SoulSilver" ||
    setName === "HeartGold SoulSilver"
  )
    seriesFolder = "10 HeartGold SoulSilver";
  if (setName === "WoTC Promo" || setName === "WOTC Promo")
    seriesFolder = "01 Base";
  if (setName === "Southern Islands") seriesFolder = "03 Neo";
  if (cleanedName === "Ruby and Sapphire" || cleanedName === "Ruby & Sapphire")
    seriesFolder = "06 EX";
  if (setName === "McDonald's Promos 2022") seriesFolder = "14 Sword & Shield";
  if (
    setName === "Celebrations" ||
    setName === "Celebrations: Classic Collection"
  )
    seriesFolder = "14 Sword & Shield";
  if (setName === "McDonald's 25th Anniversary Promos")
    seriesFolder = "14 Sword & Shield";
  if (setName === "McDonald's Promos 2019") seriesFolder = "13 Sun & Moon";
  if (setName === "Hidden Fates" || setName === "Hidden Fates: Shiny Vault")
    seriesFolder = "13 Sun & Moon";
  if (setName === "Detective Pikachu") seriesFolder = "13 Sun & Moon";
  if (setName === "McDonald's Promos 2018") seriesFolder = "13 Sun & Moon";
  if (setName === "Dragon Majesty") seriesFolder = "13 Sun & Moon";
  if (setName === "McDonald's Promos 2017") seriesFolder = "13 Sun & Moon";
  if (setName === "McDonald's Promos 2016") seriesFolder = "12 XY";
  if (setName === "Generations: Radiant Collection") seriesFolder = "12 XY";
  if (setName === "Double Crisis") seriesFolder = "12 XY";
  if (setName === "McDonald's Promos 2015") seriesFolder = "12 XY";
  if (setName === "McDonald's Promos 2014") seriesFolder = "12 XY";
  if (
    setName === "Legendary Treasures" ||
    setName === "Legendary Treasures: Radiant Collection"
  )
    seriesFolder = "11 Black & White";
  if (setName === "Dragon Vault") seriesFolder = "11 Black & White";
  if (setName === "McDonald's Promos 2011") seriesFolder = "11 Black & White";
  if (setName === "McDonald's Promos 2012") seriesFolder = "11 Black & White";
  if (setName === "McDonald's Promos 2013") seriesFolder = "11 Black & White";
  if (setName === "Rumble") seriesFolder = "09 Platinum";
  if (setName === "Prize Pack Series Cards") seriesFolder = "14 Sword & Shield";
  // Special case: Crown Zenith is in Sword & Shield folder
  if (
    setName === "Crown Zenith" ||
    setName === "Crown Zenith: Galarian Gallery"
  )
    seriesFolder = "14 Sword & Shield";
  // Special case: Pokemon Go is in Sword & Shield folder
  if (setName === "Pokemon Go" || setName === "Pokemon GO")
    seriesFolder = "14 Sword & Shield";

  const setFileMap = {
    "ME01: Mega Evolution": "mega-evolution.png",
    "ME02: Phantasmal Flames": "Phantasmal Flame.png",
    "Call of Legends": "Call of Legends.png",
    "Champion's Path": "Champion_s Path.png",
    "Base Set": "Base Set.png",
    "Base Set 2": "Base Set 2.png",
    Jungle: "Jungle.png",
    Fossil: "Fossil.png",
    "Gym Heroes": "Gym Heroes.png",
    "Gym Challenge": "Gym Challenge.png",
    "Neo Genesis": "Neo Genesis.png",
    "Neo Discovery": "Neo Discovery.png",
    "Neo Revelation": "Neo Revelation.png",
    "Neo Destiny": "Neo Destiny.png",
    "Southern Islands": "Southern Isles.png",
    "Pop Series 1": "Pop 1.png",
    "POP Series 1": "Pop 1.png",
    "Pop Series 2": "Pop 2.png",
    "POP Series 2": "Pop 2.png",
    "Pop Series 3": "Pop 3.png",
    "POP Series 3": "Pop 3.png",
    "Pop Series 4": "Pop 4.png",
    "POP Series 4": "Pop 4.png",
    "Pop Series 5": "Pop 5.png",
    "POP Series 5": "Pop 5.png",
    "Pop Series 6": "Pop 6.png",
    "POP Series 6": "Pop 6.png",
    "Pop Series 7": "Pop 7.png",
    "POP Series 7": "Pop 7.png",
    "Pop Series 8": "Pop 8.png",
    "POP Series 8": "Pop 8.png",
    "Pop Series 9": "Pop 9.png",
    "POP Series 9": "Pop 9.png",
    Aquapolis: "Aquapolis.png",
    Skyridge: "Skyridge.png",
    "Expedition Base Set": "Expedition Base Set.png",
    "Ruby & Sapphire": "Ruby & Sapphire.png",
    "Ruby and Sapphire": "Ruby & Sapphire.png",
    Sandstorm: "Sandstorm.png",
    Dragon: "Dragon.png",
    "Delta Species": "Delta Species.png",
    "Dragon Frontiers": "Dragon Frontiers.png",
    "Team Rocket Returns": "Team Rocket Returns.png",
    "Hidden Legends": "Hidden Legends.png",
    "Hidden Fates": "Hidden Fates.png",
    "Hidden Fates: Shiny Vault": "Hidden Fates.png",
    "Detective Pikachu": "Detective Pikachu.png",
    "Dragon Majesty": "Dragon Majesty.png",
    Flashfire: "XY Flashfire.png",
    XY: "XY.png",
    "XY Base Set": "XY.png",
    Deoxys: "Deoxys.png",
    "Holon Phantoms": "Holon Phantoms.png",
    "Legend Maker": "Legend Maker.png",
    "Power Keepers": "Power Keepers.png",
    "Unseen Forces": "Unseen Forces.png",
    Emerald: "Emerald.png",
    "Crystal Guardians": "Crystal Guardians.png",
    "FireRed & LeafGreen": "FireRed LeafGreen.png",
    "Team Magma vs Team Aqua": "Team Magma vs. Team Aqua.png",
    "Team Rocket": "Team Rocket.png",
    Rumble: "Pokemon Rumble.png",
    "Black and White": "Black & White.png",
    "Black & White": "Black & White.png",
    "Black Bolt": "black-bolt.png",
    "White Flare": "white-flare.png",
    "Destined Rivals": "destined-rivals.png",
    "Legendary Treasures": "Legendary Treasures.png",
    "Legendary Treasures: Radiant Collection": "Legendary Treasures.png",
    "McDonald's Promos 2011": "McDonald_s Collection 2011.png",
    "McDonald's Promos 2012": "McDonald_s Collection 2012.png",
    "McDonald's Promos 2013": "McDonald_s Collection 2013.png",
    "McDonald's Promos 2014": "McDonald_s Collection 2014.png",
    "McDonald's Promos 2015": "McDonald_s Collection 2015.png",
    "McDonald's Promos 2016": "McDonald_s Collection 2016.png",
    "McDonald's Promos 2017": "McDonald_s Collection 2017.png",
    "McDonald's Promos 2018": "S&M McDonald_s Collection 2018.png",
    "McDonald's Promos 2019": "S&M McDonald_s Collection 2019.png",
    "McDonald's Promos 2022": "McDonald_s Match Battle 2022.png",
    "McDonald's Promos 2023": "McDonald_s Match Battle 2023.png",
    "McDonald's Promos 2024": "McDonald_s Dragon Discovery.png",
    "McDonald's 25th Anniversary Promos":
      "S&S McDonald_s Collection 25th Anniversary.png",
    "Mega Evolution": "mega-evolution.png",
    "Prismatic Evolutions": "Prismatic Evolutions.png",
    Evolutions: "XY Evolutions.png",
    "Fates Collide": "XY Fates Collide.png",
    "Steam Siege": "XY Steam Siege.png",
    "Surging Sparks": "Surging Sparks.png",
    "Stellar Crown": "Stellar Crown.png",
    "Shrouded Fable": "Shrouded Fable.png",
    "Twilight Masquerade": "Twilight Masquerade.png",
    "Temporal Forces": "Temporal Forces.png",
    "Paldean Fates": "Paldean Fates.png",
    "Paradox Rift": "Paradox Rift.png",
    "Obsidian Flames": "Obsidian Flames.png",
    151: "151.png",
    "Paldea Evolved": "Paldea Evolved.png",
    "Scarlet & Violet": "Scarlet & Violet.png",
    "SV: Scarlet & Violet Promo Cards": "Scarlet & Violet Promos.png",
    "SVE: Scarlet & Violet Energies": "scarlet-and-violet-energies.png",
    "Crown Zenith": "Crown Zenith.png",
    "Crown Zenith: Galarian Gallery": "Crown Zenith.png",
    "Silver Tempest": "Silver Tempest.png",
    "SWSH12: Silver Tempest Trainer Gallery": "Silver Tempest.png",
    "Lost Origin": "Lost Origin.png",
    "SWSH11: Lost Origin Trainer Gallery": "Lost Origin.png",
    "Brilliant Stars": "Brilliant Stars.png",
    "SWSH09: Brilliant Stars Trainer Gallery": "Brilliant Stars.png",
    "Astral Radiance": "Astral Radiance.png",
    "SWSH10: Astral Radiance Trainer Gallery": "Astral Radiance.png",
    "Fusion Strike": "Fusion Strike.png",
    "Evolving Skies": "Evolving Skies.png",
    "Chilling Reign": "Chilling Reign.png",
    "Battle Styles": "Battle Styles.png",
    "Shining Fates": "Shining Fates.png",
    "Shining Fates: Shiny Vault": "Shining Fates.png",
    "Vivid Voltage": "Vivid Voltage.png",
    "Darkness Ablaze": "Darkness Ablaze.png",
    "Rebel Clash": "Rebel Clash.png",
    "Sword & Shield": "Sword & Shield.png",
    Generations: "XY Generations.png",
    "Generations: Radiant Collection": "XY Generations.png",
    "Double Crisis": "Double Crisis.png",
    "Pokemon Go": "Pokemon Go.png",
    "Pokemon GO": "Pokemon Go.png",
    Promos: "_Promo.png",
    "WoTC Promo": "_Promo.png",
    "WOTC Promo": "_Promo.png",
    "HGSS Promos": "_Promo.png",
    "Black and White Promos": "_Promo.png",
    "XY Promos": "_Promo.png",
    "Sun and Moon Promo": "_Promo.png",
    "Trick or Trade BOOster Bundle": "_Trick or Trade.png",
    "Trick or Trade BOOster Bundle 2023": "_Trick or Trade.png",
    "Trick or Trade BOOster Bundle 2024": "_Trick or Trade.png",
    "SV: Black Bolt": "black-bolt.png",
    "SV: White Flare": "white-flare.png",
    "SV10: Destined Rivals": "destined-rivals.png",
    "MEE: Mega Evolution Energies": "mega-evolution.png",
    "ME: Mega Evolution Promo": "mega-evolution.png",
    "Celebrations: Classic Collection": "Celebrations.png",
    Celebrations: "Celebrations.png",
  };

  // Try multiple lookup keys: original name, cleaned name, normalized name
  const fileName =
    setFileMap[setName] ||
    setFileMap[cleanedName] ||
    setFileMap[normalizedName] ||
    `${cleanedName}.png`;

  // Special case: Promo symbols are in root Set Symbols folder
  if (fileName === "_Promo.png" || fileName === "_Trick or Trade.png") {
    return `/Assets/Set Symbols/${fileName}`;
  }

  return `/Assets/Set Symbols/${seriesFolder}/${fileName}`;
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

export default function SetsBrowser() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [languageFilter, setLanguageFilter] = useState(
    searchParams.get("language") || "all"
  ); // 'all', 'international', 'japanese'
  const [page, setPage] = useState(parseInt(searchParams.get("page")) || 1);
  const [sortBy, setSortBy] = useState("published_on");
  const [sortOrder, setSortOrder] = useState("DESC");
  const [itemsPerPage, setItemsPerPage] = useState(50);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    loadSets();
  }, [page, search, languageFilter, sortBy, sortOrder, itemsPerPage]);

  useEffect(() => {
    // Update URL params when filters change
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (languageFilter !== "all") params.set("language", languageFilter);
    if (page > 1) params.set("page", page.toString());
    setSearchParams(params);
  }, [search, languageFilter, page]);

  const loadSets = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: itemsPerPage,
        search,
        language: languageFilter !== "all" ? languageFilter : undefined, // Only send if not "all"
        sortBy,
        sortOrder,
      };

      const response = await admin.getSets(params);
      setSets(response.data.data);
      setPagination(response.data.pagination || {});
    } catch (error) {
      console.error("Error loading sets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "ASC" ? "DESC" : "ASC");
    } else {
      setSortBy(field);
      setSortOrder("DESC");
    }
    setPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white mb-2">Sets</h1>
        <p className="text-slate-400">Browse and manage Pokemon card sets</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-4 mb-6 border border-slate-700/50">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search sets by name or ID..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Items per page */}
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(parseInt(e.target.value));
                setPage(1);
              }}
              className="px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
              <option value={100}>100 per page</option>
            </select>
          </div>

          {/* Language/Region Selector */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm font-medium">
              Language:
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLanguageFilter("all");
                  setPage(1);
                  setSearchParams({ search, language: "all", page: "1" });
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  languageFilter === "all"
                    ? "bg-blue-500 text-white"
                    : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                All
              </button>
              <button
                onClick={() => {
                  setLanguageFilter("international");
                  setPage(1);
                  setSearchParams({
                    search,
                    language: "international",
                    page: "1",
                  });
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  languageFilter === "international"
                    ? "bg-indigo-500 text-white"
                    : "bg-slate-900/50 text-slate-300 hover:bg-slate-900/70"
                }`}
              >
                International
              </button>
              <button
                onClick={() => {
                  setLanguageFilter("japanese");
                  setPage(1);
                  setSearchParams({ search, language: "japanese", page: "1" });
                }}
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
        </div>
      </div>

      {/* Sets Table */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-slate-400">Loading sets...</p>
          </div>
        ) : sets.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400">No sets found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("id")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <span>ID</span>
                        <SortIcon active={sortBy === "id"} order={sortOrder} />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-slate-400">Symbol</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("name")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <span>Name</span>
                        <SortIcon
                          active={sortBy === "name"}
                          order={sortOrder}
                        />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort("published_on")}
                        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                      >
                        <span>Release Date</span>
                        <SortIcon
                          active={sortBy === "published_on"}
                          order={sortOrder}
                        />
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-slate-400">Cards</span>
                    </th>
                    <th className="px-6 py-3 text-left">
                      <span className="text-slate-400">Modified</span>
                    </th>
                    <th className="px-6 py-3 text-right">
                      <span className="text-slate-400">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {sets.map((set) => {
                    // Always generate path from set name to ensure correct mapping
                    const series = seriesFromSetName(set.name);
                    const symbolPath = getSetSymbolPath(set.name, series);

                    // Debug: Log if path generation fails for troubleshooting
                    if (!symbolPath && set.name) {
                      console.warn(
                        "No symbol path generated for set:",
                        set.name
                      );
                    }
                    return (
                      <tr
                        key={set.id}
                        className="hover:bg-slate-700/30 transition-colors"
                      >
                        <td className="px-6 py-4 text-white font-mono text-sm">
                          {set.id}
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-8 h-8 flex items-center justify-center relative">
                            {symbolPath ? (
                              <>
                                <img
                                  key={symbolPath}
                                  src={symbolPath}
                                  alt={set.name || "Set symbol"}
                                  className="h-full w-full object-contain"
                                  style={{ display: "block" }}
                                  onError={(e) => {
                                    // Silently handle missing symbol files (many sets don't have symbols, only logos)
                                    e.target.style.display = "none";
                                    const fallback =
                                      e.target.parentElement?.querySelector(
                                        ".symbol-fallback"
                                      );
                                    if (fallback) {
                                      fallback.style.display = "flex";
                                    }
                                  }}
                                  onLoad={(e) => {
                                    // Hide fallback when image loads successfully
                                    const fallback =
                                      e.target.parentElement?.querySelector(
                                        ".symbol-fallback"
                                      );
                                    if (fallback) {
                                      fallback.style.display = "none";
                                    }
                                  }}
                                />
                                <div
                                  className="hidden symbol-fallback text-slate-500 text-xs absolute inset-0 items-center justify-center"
                                  style={{ display: "none" }}
                                >
                                  —
                                </div>
                              </>
                            ) : (
                              <div className="text-slate-500 text-xs">—</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-medium">
                            {set.name || "N/A"}
                          </span>
                          {set.clean_name && set.clean_name !== set.name && (
                            <div className="text-slate-400 text-xs mt-1">
                              {set.clean_name}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {formatDate(set.published_on)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-slate-300">
                            {set.total_cards || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-sm">
                          {formatDate(set.modified_on)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() =>
                                navigate(
                                  `/sets/${set.id}?return=${encodeURIComponent(
                                    searchParams.toString()
                                  )}`
                                )
                              }
                              className="px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm font-medium"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-slate-700/50 flex items-center justify-between">
                <div className="text-slate-400 text-sm">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                  {Math.min(
                    pagination.page * pagination.limit,
                    pagination.total
                  )}{" "}
                  of {pagination.total} sets
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.page === 1}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(pagination.totalPages, p + 1))
                    }
                    disabled={pagination.page === pagination.totalPages}
                    className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
