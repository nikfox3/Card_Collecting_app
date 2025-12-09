// Rarity Symbol Mapping Utility
// Maps rarity names from the database to their corresponding symbol files

const raritySymbolMapping = {
  // International Rarities
  'Common': '/Assets/Rarity/International/Common.svg',
  'Uncommon': '/Assets/Rarity/International/Uncommon.svg',
  'Rare': '/Assets/Rarity/International/Rare.svg',
  'Ultra Rare': '/Assets/Rarity/International/Ultra Rare.svg',
  'Hyper Rare': '/Assets/Rarity/International/Hyper Rare.svg',
  'Double Rare': '/Assets/Rarity/International/Double Rare.svg',
  'Shiny Rare': '/Assets/Rarity/International/Shiny Rare.svg',
  'Shiny Ultra Rare': '/Assets/Rarity/International/Shiny Ultra Rare.svg',
  'Promo': '/Assets/Rarity/International/Promo.svg',
  'IR': '/Assets/Rarity/International/IR.svg',
  'SIR': '/Assets/Rarity/International/SIR.svg',
  'ACE': '/Assets/Rarity/International/ACE.svg',
  
  // Japanese Rarities
  'Art Rare': '/Assets/Rarity/Japanese/Art Rare.svg',
  'Special Art Rare': '/Assets/Rarity/Japanese/Special Art Rare.svg',
  'Super Rare': '/Assets/Rarity/Japanese/Super Rare.svg',
  
  // Common variations and fallbacks
  'Holo': '/Assets/Rarity/International/Rare.svg',
  'Reverse Holo': '/Assets/Rarity/International/Rare.svg',
  'Secret': '/Assets/Rarity/International/Ultra Rare.svg',
  'Secret Rare': '/Assets/Rarity/International/Ultra Rare.svg',
  'Full Art': '/Assets/Rarity/International/Ultra Rare.svg',
  'Rainbow Rare': '/Assets/Rarity/International/Hyper Rare.svg',
  'Gold Rare': '/Assets/Rarity/International/Hyper Rare.svg',
  'Amazing Rare': '/Assets/Rarity/International/Ultra Rare.svg',
  'V': '/Assets/Rarity/International/Rare.svg',
  'VMAX': '/Assets/Rarity/International/Ultra Rare.svg',
  'VSTAR': '/Assets/Rarity/International/Ultra Rare.svg',
  'ex': '/Assets/Rarity/International/Rare.svg',
  'GX': '/Assets/Rarity/International/Ultra Rare.svg',
  'BREAK': '/Assets/Rarity/International/Rare.svg',
  'Prime': '/Assets/Rarity/International/Rare.svg',
  'Legend': '/Assets/Rarity/International/Ultra Rare.svg',
  'Lv.X': '/Assets/Rarity/International/Rare.svg',
  'EX': '/Assets/Rarity/International/Ultra Rare.svg',
  'Mega': '/Assets/Rarity/International/Ultra Rare.svg',
  'Mega EX': '/Assets/Rarity/International/Ultra Rare.svg',
  'Tag Team': '/Assets/Rarity/International/Ultra Rare.svg',
  'Tag Team GX': '/Assets/Rarity/International/Ultra Rare.svg',
  'Radiant': '/Assets/Rarity/International/Rare.svg',
  'Illustration Rare': '/Assets/Rarity/International/IR.svg',
  'Special Illustration Rare': '/Assets/Rarity/International/SIR.svg',
  'Ace Spec': '/Assets/Rarity/International/ACE.svg',
};

// Function to get the rarity symbol path for a given rarity name
export function getRaritySymbolPath(rarityName, language = 'en') {
  if (!rarityName) {
    return language === 'ja' ? '/Assets/Rarity/Japanese/Common.svg' : '/Assets/Rarity/International/Common.svg';
  }
  
  // Japanese rarity mappings
  const japaneseRarityMapping = {
    'Common': '/Assets/Rarity/Japanese/Common.svg',
    'Uncommon': '/Assets/Rarity/Japanese/Uncommon.svg',
    'Rare': '/Assets/Rarity/Japanese/Rare.svg',
    'Super Rare': '/Assets/Rarity/Japanese/Super Rare.svg',
    'Double Rare': '/Assets/Rarity/Japanese/Double Rare.svg',
    'Hyper Rare': '/Assets/Rarity/Japanese/Hyper Rare.svg',
    'Art Rare': '/Assets/Rarity/Japanese/Art Rare.svg',
    'Special Art Rare': '/Assets/Rarity/Japanese/Special Art Rare.svg',
    'Shiny Rare': '/Assets/Rarity/Japanese/Shiny Rare.svg',
    'Shiny Ultra Rare': '/Assets/Rarity/Japanese/Shiny Ultra Rare.svg',
    'ACE': '/Assets/Rarity/Japanese/ACE.svg',
    'Promo': '/Assets/Rarity/Japanese/Promo.svg',
  };
  
  // Use Japanese mapping if language is Japanese
  if (language === 'ja') {
    // Direct match first
    if (japaneseRarityMapping[rarityName]) {
      return japaneseRarityMapping[rarityName];
    }
    
    // Try to find partial matches for Japanese rarities
    const normalizedName = rarityName.toLowerCase().trim();
    
    for (const [key, value] of Object.entries(japaneseRarityMapping)) {
      const normalizedKey = key.toLowerCase().trim();
      if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
        return value;
      }
    }
    
    // Handle Japanese-specific patterns
    if (normalizedName.includes('promo')) {
      return '/Assets/Rarity/Japanese/Promo.svg';
    }
    if (normalizedName.includes('art rare') && normalizedName.includes('special')) {
      return '/Assets/Rarity/Japanese/Special Art Rare.svg';
    }
    if (normalizedName.includes('art rare')) {
      return '/Assets/Rarity/Japanese/Art Rare.svg';
    }
    if (normalizedName.includes('hyper rare')) {
      return '/Assets/Rarity/Japanese/Hyper Rare.svg';
    }
    if (normalizedName.includes('double rare')) {
      return '/Assets/Rarity/Japanese/Double Rare.svg';
    }
    if (normalizedName.includes('super rare')) {
      return '/Assets/Rarity/Japanese/Super Rare.svg';
    }
    if (normalizedName.includes('shiny ultra rare')) {
      return '/Assets/Rarity/Japanese/Shiny Ultra Rare.svg';
    }
    if (normalizedName.includes('shiny rare')) {
      return '/Assets/Rarity/Japanese/Shiny Rare.svg';
    }
    if (normalizedName.includes('ace')) {
      return '/Assets/Rarity/Japanese/ACE.svg';
    }
    if (normalizedName.includes('rare')) {
      return '/Assets/Rarity/Japanese/Rare.svg';
    }
    if (normalizedName.includes('uncommon')) {
      return '/Assets/Rarity/Japanese/Uncommon.svg';
    }
    
    // Default fallback for Japanese
    return '/Assets/Rarity/Japanese/Common.svg';
  }
  
  // International rarity logic (existing code)
  // Direct match first
  if (raritySymbolMapping[rarityName]) {
    return raritySymbolMapping[rarityName];
  }
  
  // Try to find partial matches for rarities with variations
  const normalizedName = rarityName.toLowerCase().trim();
  
  // Handle common variations and patterns
  for (const [key, value] of Object.entries(raritySymbolMapping)) {
    const normalizedKey = key.toLowerCase().trim();
    
    // Check if the rarity name contains the key or vice versa
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      return value;
    }
  }
  
  // Handle specific patterns
  if (normalizedName.includes('promo') || normalizedName.includes('promos')) {
    return '/Assets/Rarity/International/Promo.svg';
  }
  
  if (normalizedName.includes('secret')) {
    return '/Assets/Rarity/International/Ultra Rare.svg';
  }
  
  if (normalizedName.includes('rainbow')) {
    return '/Assets/Rarity/International/Hyper Rare.svg';
  }
  
  if (normalizedName.includes('gold')) {
    return '/Assets/Rarity/International/Hyper Rare.svg';
  }
  
  if (normalizedName.includes('full art')) {
    return '/Assets/Rarity/International/Ultra Rare.svg';
  }
  
  if (normalizedName.includes('illustration rare')) {
    return '/Assets/Rarity/International/IR.svg';
  }
  
  if (normalizedName.includes('special illustration rare')) {
    return '/Assets/Rarity/International/SIR.svg';
  }
  
  if (normalizedName.includes('ace spec')) {
    return '/Assets/Rarity/International/ACE.svg';
  }
  
  // Handle era-based fallbacks
  if (normalizedName.includes('vmax') || normalizedName.includes('v-star') || normalizedName.includes('vstar')) {
    return '/Assets/Rarity/International/Ultra Rare.svg';
  }
  
  if (normalizedName.includes('gx') || normalizedName.includes('ex') || normalizedName.includes('mega')) {
    return '/Assets/Rarity/International/Ultra Rare.svg';
  }
  
  if (normalizedName.includes('holo') || normalizedName.includes('reverse')) {
    return '/Assets/Rarity/International/Rare.svg';
  }
  
  if (normalizedName.includes('rare')) {
    return '/Assets/Rarity/International/Rare.svg';
  }
  
  if (normalizedName.includes('uncommon')) {
    return '/Assets/Rarity/International/Uncommon.svg';
  }
  
  // Default fallback
  return '/Assets/Rarity/International/Common.svg';
}

// React component for rarity symbol
export function RaritySymbol({ rarityName, className = "w-4 h-4", language = 'en' }) {
  const symbolPath = getRaritySymbolPath(rarityName, language);

  return (
    <img 
      src={symbolPath} 
      alt={rarityName || 'Rarity Symbol'} 
      className={`${className} object-contain`}
      onError={(e) => {
        // Fallback to common symbol if image fails to load
        e.target.src = language === 'ja' ? '/Assets/Rarity/Japanese/Common.svg' : '/Assets/Rarity/International/Common.svg';
      }}
    />
  );
}

export default raritySymbolMapping;


