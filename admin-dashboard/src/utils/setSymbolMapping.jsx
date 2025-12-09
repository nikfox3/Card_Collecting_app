// Set Symbol Mapping Utility
// Maps set names from the database to their corresponding symbol files

const setSymbolMapping = {
  // Base Set Era
  'Base Set': '/Assets/Set Symbols/01 Base/Base Set 2.png', // Using Base Set 2 as closest match
  'Base Set 2': '/Assets/Set Symbols/01 Base/Base Set 2.png',
  'Fossil': '/Assets/Set Symbols/01 Base/Fossil.png',
  'Jungle': '/Assets/Set Symbols/01 Base/Jungle.png',
  'Team Rocket': '/Assets/Set Symbols/01 Base/Team Rocket.png',
  'Pikachu World Collection': '/Assets/Set Symbols/01 Base/Pikachu World Collection.png',
  
  // Gym Era
  'Gym Heroes': '/Assets/Set Symbols/02 Gym/Gym Heroes.png',
  'Gym Challenge': '/Assets/Set Symbols/02 Gym/Gym Challenge.png',
  
  // Neo Era
  'Neo Genesis': '/Assets/Set Symbols/03 Neo/Neo Genesis.png',
  'Neo Discovery': '/Assets/Set Symbols/03 Neo/Neo Discovery.png',
  'Neo Revelation': '/Assets/Set Symbols/03 Neo/Neo Revelation.png',
  'Neo Destiny': '/Assets/Set Symbols/03 Neo/Neo Destiny.png',
  'Southern Isles': '/Assets/Set Symbols/03 Neo/Southern Isles.png',
  'Southern Islands': '/Assets/Set Symbols/03 Neo/Southern Isles.png',
  
  // Legendary Collection
  'Legendary Collection': '/Assets/Set Symbols/04 Legendary Collection/Legendary Collection.png',
  
  // eCard Era
  'Expedition': '/Assets/Set Symbols/05 eCard/Expedition.png',
  'Aquapolis': '/Assets/Set Symbols/05 eCard/Aquapolis.png',
  'Skyridge': '/Assets/Set Symbols/05 eCard/Skyridge.png',
  'Best of Game': '/Assets/Set Symbols/05 eCard/Best of Game.png',
  
  // EX Era
  'Ruby and Sapphire': '/Assets/Set Symbols/06 EX/Ruby & Sapphire.png',
  'Sandstorm': '/Assets/Set Symbols/06 EX/Sandstorm.png',
  'Dragon': '/Assets/Set Symbols/06 EX/Dragon.png',
  'Team Magma vs Team Aqua': '/Assets/Set Symbols/06 EX/Team Magma vs. Team Aqua.png',
  'Hidden Legends': '/Assets/Set Symbols/06 EX/Hidden Legends.png',
  'FireRed & LeafGreen': '/Assets/Set Symbols/06 EX/FireRed LeafGreen.png',
  'Team Rocket Returns': '/Assets/Set Symbols/06 EX/Team Rocket Returns.png',
  'Deoxys': '/Assets/Set Symbols/06 EX/Deoxys.png',
  'Emerald': '/Assets/Set Symbols/06 EX/Emerald.png',
  'Unseen Forces': '/Assets/Set Symbols/06 EX/Unseen Forces.png',
  'Delta Species': '/Assets/Set Symbols/06 EX/Delta Species.png',
  'Legend Maker': '/Assets/Set Symbols/06 EX/Legend Maker.png',
  'Holon Phantoms': '/Assets/Set Symbols/06 EX/Holon Phantoms.png',
  'Crystal Guardians': '/Assets/Set Symbols/06 EX/Crystal Guardians.png',
  'Dragon Frontiers': '/Assets/Set Symbols/06 EX/Dragon Frontiers.png',
  'Power Keepers': '/Assets/Set Symbols/06 EX/Power Keepers.png',
  
  // Diamond and Pearl Era
  'Diamond and Pearl': '/Assets/Set Symbols/07 Diamond and Pearl/Diamond and Pearl.png',
  'Mysterious Treasures': '/Assets/Set Symbols/07 Diamond and Pearl/Mysterious Treasures.png',
  'Secret Wonders': '/Assets/Set Symbols/07 Diamond and Pearl/Secret Wonders.png',
  'Great Encounters': '/Assets/Set Symbols/07 Diamond and Pearl/Great Encounters.png',
  'Majestic Dawn': '/Assets/Set Symbols/07 Diamond and Pearl/Majestic Dawn.png',
  'Legends Awakened': '/Assets/Set Symbols/07 Diamond and Pearl/Legends Awakened.png',
  'Stormfront': '/Assets/Set Symbols/07 Diamond and Pearl/Stormfront.png',
  
  // Nintendo Era
  'Pop Series 1': '/Assets/Set Symbols/08 Nintendo/Pop 1.png',
  'Pop Series 2': '/Assets/Set Symbols/08 Nintendo/Pop 2.png',
  'Pop Series 3': '/Assets/Set Symbols/08 Nintendo/Pop 3.png',
  'Pop Series 4': '/Assets/Set Symbols/08 Nintendo/Pop 4.png',
  'Pop Series 5': '/Assets/Set Symbols/08 Nintendo/Pop 5.png',
  'Pop Series 6': '/Assets/Set Symbols/08 Nintendo/Pop 6.png',
  'Pop Series 7': '/Assets/Set Symbols/08 Nintendo/Pop 7.png',
  'Pop Series 8': '/Assets/Set Symbols/08 Nintendo/Pop 8.png',
  'Pop Series 9': '/Assets/Set Symbols/08 Nintendo/Pop 9.png',
  
  // Platinum Era
  'Platinum': '/Assets/Set Symbols/09 Platinum/Platinum.png',
  'Rising Rivals': '/Assets/Set Symbols/09 Platinum/Rising Rivals.png',
  'Supreme Victors': '/Assets/Set Symbols/09 Platinum/Supreme Victors.png',
  'Arceus': '/Assets/Set Symbols/09 Platinum/Arceus.png',
  'Pokemon Rumble': '/Assets/Set Symbols/09 Platinum/Pokemon Rumble.png',
  
  // HeartGold SoulSilver Era
  'HeartGold SoulSilver': '/Assets/Set Symbols/10 HeartGold SoulSilver/HeartGold SoulSilver.png',
  'Unleashed': '/Assets/Set Symbols/10 HeartGold SoulSilver/Unleashed.png',
  'Undaunted': '/Assets/Set Symbols/10 HeartGold SoulSilver/Undaunted.png',
  'Triumphant': '/Assets/Set Symbols/10 HeartGold SoulSilver/Triumphant.png',
  'Call of Legends': '/Assets/Set Symbols/10 HeartGold SoulSilver/Call of Legends.png',
  
  // Black & White Era
  'Black and White': '/Assets/Set Symbols/11 Black & White/Black & White.png',
  'Emerging Powers': '/Assets/Set Symbols/11 Black & White/Emerging Powers.png',
  'Noble Victories': '/Assets/Set Symbols/11 Black & White/Noble Victories.png',
  'Next Destinies': '/Assets/Set Symbols/11 Black & White/Next Destinies.png',
  'Dark Explorers': '/Assets/Set Symbols/11 Black & White/Dark Explorers.png',
  'Dragons Exalted': '/Assets/Set Symbols/11 Black & White/Dragons Exalted.png',
  'Boundaries Crossed': '/Assets/Set Symbols/11 Black & White/Boundaries Crossed.png',
  'Plasma Storm': '/Assets/Set Symbols/11 Black & White/Plasma Storm.png',
  'Plasma Freeze': '/Assets/Set Symbols/11 Black & White/Plasma Freeze.png',
  'Plasma Blast': '/Assets/Set Symbols/11 Black & White/Plasma Blast.png',
  'Legendary Treasures': '/Assets/Set Symbols/11 Black & White/Legendary Treasures.png',
  'Dragon Vault': '/Assets/Set Symbols/11 Black & White/Dragon Vault.png',
  'Box Topper (BW)': '/Assets/Set Symbols/11 Black & White/Box Topper.png',
  
  // XY Era
  'XY Base Set': '/Assets/Set Symbols/12 XY/XY.png',
  'XY - Flashfire': '/Assets/Set Symbols/12 XY/XY Flashfire.png',
  'XY - Furious Fists': '/Assets/Set Symbols/12 XY/Furious Fists.png',
  'XY - Phantom Forces': '/Assets/Set Symbols/12 XY/Phantom Forces.png',
  'XY - Primal Clash': '/Assets/Set Symbols/12 XY/Primal Clash.png',
  'XY - Roaring Skies': '/Assets/Set Symbols/12 XY/Roaring Skies.png',
  'XY - Ancient Origins': '/Assets/Set Symbols/12 XY/Ancient Origins.png',
  'XY - BREAKthrough': '/Assets/Set Symbols/12 XY/BREAKthrough.png',
  'XY - BREAKpoint': '/Assets/Set Symbols/12 XY/BREAKpoint.png',
  'XY - Fates Collide': '/Assets/Set Symbols/12 XY/XY Fates Collide.png',
  'XY - Steam Siege': '/Assets/Set Symbols/12 XY/XY Steam Siege.png',
  'XY - Evolutions': '/Assets/Set Symbols/12 XY/XY Evolutions.png',
  'Evolutions': '/Assets/Set Symbols/12 XY/XY Evolutions.png',
  'XY Generations': '/Assets/Set Symbols/12 XY/XY Generations.png',
  'Double Crisis': '/Assets/Set Symbols/12 XY/Double Crisis.png',
  'Kalos Starter Set': '/Assets/Set Symbols/12 XY/Kalos Starter Set.png',
  
  // Sun & Moon Era
  'SM Base Set': '/Assets/Set Symbols/13 Sun & Moon/Sun & Moon.png',
  'SM - Guardians Rising': '/Assets/Set Symbols/13 Sun & Moon/Guardians Rising.png',
  'SM - Burning Shadows': '/Assets/Set Symbols/13 Sun & Moon/Burning Shadows.png',
  'SM - Crimson Invasion': '/Assets/Set Symbols/13 Sun & Moon/Crimson Invasion.png',
  'SM - Ultra Prism': '/Assets/Set Symbols/13 Sun & Moon/Ultra Prism.png',
  'SM - Forbidden Light': '/Assets/Set Symbols/13 Sun & Moon/Forbidden Light.png',
  'SM - Celestial Storm': '/Assets/Set Symbols/13 Sun & Moon/Celestial Storm.png',
  'SM - Lost Thunder': '/Assets/Set Symbols/13 Sun & Moon/Lost Thunder.png',
  'SM - Team Up': '/Assets/Set Symbols/13 Sun & Moon/Team Up.png',
  'SM - Unbroken Bonds': '/Assets/Set Symbols/13 Sun & Moon/Unbroken Bonds.png',
  'SM - Unified Minds': '/Assets/Set Symbols/13 Sun & Moon/Unified Minds.png',
  'SM - Cosmic Eclipse': '/Assets/Set Symbols/13 Sun & Moon/Cosmic Eclipse.png',
  'Hidden Fates': '/Assets/Set Symbols/13 Sun & Moon/Hidden Fates.png',
  'Shining Legends': '/Assets/Set Symbols/13 Sun & Moon/Shining Legends.png',
  'Dragon Majesty': '/Assets/Set Symbols/13 Sun & Moon/Dragon Majesty.png',
  'Detective Pikachu': '/Assets/Set Symbols/13 Sun & Moon/Detective Pikachu.png',
  
  // Sword & Shield Era
  'Sword & Shield Base Set': '/Assets/Set Symbols/14 Sword & Shield/Sword & Shield.png',
  'SWSH01: Sword & Shield Base Set': '/Assets/Set Symbols/14 Sword & Shield/Sword & Shield.png',
  'SWSH02: Rebel Clash': '/Assets/Set Symbols/14 Sword & Shield/Rebel Clash.png',
  'SWSH03: Darkness Ablaze': '/Assets/Set Symbols/14 Sword & Shield/Darkness Ablaze.png',
  'SWSH04: Vivid Voltage': '/Assets/Set Symbols/14 Sword & Shield/Vivid Voltage.png',
  'SWSH05: Battle Styles': '/Assets/Set Symbols/14 Sword & Shield/Battle Styles.png',
  'SWSH06: Chilling Reign': '/Assets/Set Symbols/14 Sword & Shield/Chilling Reign.png',
  'SWSH07: Evolving Skies': '/Assets/Set Symbols/14 Sword & Shield/Evolving Skies.png',
  'SWSH08: Fusion Strike': '/Assets/Set Symbols/14 Sword & Shield/Fusion Strike.png',
  'SWSH09: Brilliant Stars': '/Assets/Set Symbols/14 Sword & Shield/Brilliant Stars.png',
  'SWSH10: Astral Radiance': '/Assets/Set Symbols/14 Sword & Shield/Astral Radiance.png',
  'SWSH11: Lost Origin': '/Assets/Set Symbols/14 Sword & Shield/Lost Origin.png',
  'SWSH12: Silver Tempest': '/Assets/Set Symbols/14 Sword & Shield/Silver Tempest.png',
  'Celebrations': '/Assets/Set Symbols/14 Sword & Shield/Celebrations.png',
  'Champion\'s Path': '/Assets/Set Symbols/14 Sword & Shield/Champion_s Path.png',
  'Shining Fates': '/Assets/Set Symbols/14 Sword & Shield/Shining Fates.png',
  'Crown Zenith': '/Assets/Set Symbols/14 Sword & Shield/Crown Zenith.png',
  'Pokemon GO': '/Assets/Set Symbols/14 Sword & Shield/Pokemon Go.png',
  
  // Scarlet & Violet Era
  'SV01: Scarlet & Violet Base Set': '/Assets/Set Symbols/15 Scarlet & Violet/Scarlet & Violet.png',
  'SV02: Paldea Evolved': '/Assets/Set Symbols/15 Scarlet & Violet/Paldea Evolved.png',
  'SV03: Obsidian Flames': '/Assets/Set Symbols/15 Scarlet & Violet/Obsidian Flames.png',
  'SV: Scarlet & Violet 151': '/Assets/Set Symbols/15 Scarlet & Violet/151.png',
  'SV04: Paradox Rift': '/Assets/Set Symbols/15 Scarlet & Violet/Paradox Rift.png',
  'SV: Paldean Fates': '/Assets/Set Symbols/15 Scarlet & Violet/Paldean Fates.png',
  'SV05: Temporal Forces': '/Assets/Set Symbols/15 Scarlet & Violet/Temporal Forces.png',
  'SV06: Twilight Masquerade': '/Assets/Set Symbols/15 Scarlet & Violet/Twilight Masquerade.png',
  'SV: Shrouded Fable': '/Assets/Set Symbols/15 Scarlet & Violet/Shrouded Fable.png',
  'SV07: Stellar Crown': '/Assets/Set Symbols/15 Scarlet & Violet/Stellar Crown.png',
  'SV08: Surging Sparks': '/Assets/Set Symbols/15 Scarlet & Violet/Surging Sparks.png',
  'SV: Prismatic Evolutions': '/Assets/Set Symbols/15 Scarlet & Violet/Prismatic Evolutions.png',
  'SV09: Journey Together': '/Assets/Set Symbols/15 Scarlet & Violet/Journey Together.png',
  'SV10: Destined Rivals': '/Assets/Set Symbols/15 Scarlet & Violet/destined-rivals.png',
  'SV: Black Bolt': '/Assets/Set Symbols/15 Scarlet & Violet/black-bolt.png',
  'SV: White Flare': '/Assets/Set Symbols/15 Scarlet & Violet/white-flare.png',
  'SV: Scarlet & Violet Energies': '/Assets/Set Symbols/15 Scarlet & Violet/scarlet-and-violet-energies.png',
  'SV: Scarlet & Violet Promo Cards': '/Assets/Set Symbols/15 Scarlet & Violet/Scarlet & Violet Promos.png',
  
  // Mega Evolution Era
  'Mega Evolution': '/Assets/Set Symbols/16 Mega Evolutions/mega-evolution.png',
  'ME01: Mega Evolution': '/Assets/Set Symbols/16 Mega Evolutions/mega-evolution.png',
  'ME02: Phantasmal Flames': '/Assets/Set Symbols/16 Mega Evolutions/mega-evolution.png', // Using mega-evolution as fallback
  
  // Special Sets
  'Celebrations: Classic Collection': '/Assets/Set Symbols/14 Sword & Shield/Celebrations.png',
  'Crown Zenith: Galarian Gallery': '/Assets/Set Symbols/14 Sword & Shield/Crown Zenith.png',
  
  // Promos
  'SWSH: Sword & Shield Promo Cards': '/Assets/Set Symbols/_Promo.png',
  'SM Promos': '/Assets/Set Symbols/_Promo.png',
  'XY Promos': '/Assets/Set Symbols/_Promo.png',
  'BW Promos': '/Assets/Set Symbols/_Promo.png',
  'Black and White Promos': '/Assets/Set Symbols/_Promo.png',
  'DP Promos': '/Assets/Set Symbols/_Promo.png',
  'Diamond and Pearl Promos': '/Assets/Set Symbols/_Promo.png',
  'EX Promos': '/Assets/Set Symbols/_Promo.png',
  'Neo Promos': '/Assets/Set Symbols/_Promo.png',
  'Gym Promos': '/Assets/Set Symbols/_Promo.png',
  'Base Promos': '/Assets/Set Symbols/_Promo.png',
  'Alternate Art Promos': '/Assets/Set Symbols/_Promo.png',
  'Best of Promos': '/Assets/Set Symbols/_Promo.png',
  'Blister Exclusives': '/Assets/Set Symbols/_Promo.png',
  'Burger King Promos': '/Assets/Set Symbols/_Promo.png',
  'Countdown Calendar Promos': '/Assets/Set Symbols/_Promo.png',
  'Deck Exclusives': '/Assets/Set Symbols/_Promo.png',
  'WoTC Promo': '/Assets/Set Symbols/_Promo.png',
  'Fustal Promos': '/Assets/Set Symbols/_Promo.png',
  
  // Trick or Trade
  'Trick or Trade BOOster Bundle': '/Assets/Set Symbols/_Trick or Trade.png',
  'Trick or Trade BOOster Bundle 2023': '/Assets/Set Symbols/_Trick or Trade.png',
  'Trick or Trade BOOster Bundle 2024': '/Assets/Set Symbols/_Trick or Trade.png',
  
  // 1st Edition
  'Base Set (Shadowless)': '/Assets/Set Symbols/_1st Edition.png',
  
  // Box Topper
  'Box Topper': '/Assets/Set Symbols/_Box Topper.png',
  
  // Trainer Kits and Special Products
  'Battle Academy': '/Assets/Set Symbols/_Special.png',
  'Battle Academy 2022': '/Assets/Set Symbols/_Special.png',
  'Battle Academy 2024': '/Assets/Set Symbols/_Special.png',
  'World Championship Decks': '/Assets/Set Symbols/_Special.png',
  'First Partner Pack': '/Assets/Set Symbols/_Special.png',
  
  // McDonald's Collections
  'McDonald\'s Collection 2011': '/Assets/Set Symbols/11 Black & White/McDonald_s Collection 2011.png',
  'McDonald\'s Collection 2012': '/Assets/Set Symbols/11 Black & White/McDonald_s Collection 2012.png',
  'McDonald\'s Collection 2013': '/Assets/Set Symbols/11 Black & White/McDonald_s Collection 2013.png',
  'McDonald\'s Collection 2014': '/Assets/Set Symbols/12 XY/McDonald_s Collection 2014.png',
  'McDonald\'s Collection 2015': '/Assets/Set Symbols/12 XY/McDonald_s Collection 2015.png',
  'McDonald\'s Collection 2016': '/Assets/Set Symbols/12 XY/McDonald_s Collection 2016.png',
  'McDonald\'s Collection 2017': '/Assets/Set Symbols/13 Sun & Moon/McDonald_s Collection 2017.png',
  'McDonald\'s Collection 2018': '/Assets/Set Symbols/13 Sun & Moon/S&M McDonald_s Collection 2018.png',
  'McDonald\'s Collection 2019': '/Assets/Set Symbols/13 Sun & Moon/S&M McDonald_s Collection 2019.png',
  'McDonald\'s Match Battle 2022': '/Assets/Set Symbols/14 Sword & Shield/McDonald_s Match Battle 2022.png',
  'McDonald\'s Match Battle 2023': '/Assets/Set Symbols/15 Scarlet & Violet/McDonald_s Match Battle 2023.png',
  'McDonald\'s Dragon Discovery': '/Assets/Set Symbols/15 Scarlet & Violet/McDonald_s Dragon Discovery.png',
  'McDonald\'s Collection 25th Anniversary': '/Assets/Set Symbols/14 Sword & Shield/S&S McDonald_s Collection 25th Anniversary.png'
};

// Function to get set symbol path
export function getSetSymbolPath(setName) {
  if (!setName) {
    return '/Assets/Set Symbols/_Special.png';
  }
  
  // Direct match first
  if (setSymbolMapping[setName]) {
    return setSymbolMapping[setName];
  }
  
  // Try to find partial matches for sets with variations
  const normalizedName = setName.toLowerCase().trim();
  
  // Handle common variations and patterns
  for (const [key, value] of Object.entries(setSymbolMapping)) {
    const normalizedKey = key.toLowerCase().trim();
    
    // Check if the set name contains the key or vice versa
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      return value;
    }
  }
  
  // Handle specific patterns
  if (normalizedName.includes('promo') || normalizedName.includes('promos')) {
    return '/Assets/Set Symbols/_Promo.png';
  }
  
  if (normalizedName.includes('celebrations')) {
    return '/Assets/Set Symbols/14 Sword & Shield/Celebrations.png';
  }
  
  if (normalizedName.includes('hidden fates')) {
    return '/Assets/Set Symbols/13 Sun & Moon/Hidden Fates.png';
  }
  
  if (normalizedName.includes('shining fates')) {
    return '/Assets/Set Symbols/14 Sword & Shield/Shining Fates.png';
  }
  
  if (normalizedName.includes('champion\'s path')) {
    return '/Assets/Set Symbols/14 Sword & Shield/Champion_s Path.png';
  }
  
  if (normalizedName.includes('pokemon go')) {
    return '/Assets/Set Symbols/14 Sword & Shield/Pokemon Go.png';
  }
  
  if (normalizedName.includes('crown zenith')) {
    return '/Assets/Set Symbols/14 Sword & Shield/Crown Zenith.png';
  }
  
  if (normalizedName.includes('trick or trade')) {
    return '/Assets/Set Symbols/_Trick or Trade.png';
  }
  
  if (normalizedName.includes('shadowless')) {
    return '/Assets/Set Symbols/_1st Edition.png';
  }
  
  if (normalizedName.includes('box topper')) {
    return '/Assets/Set Symbols/_Box Topper.png';
  }
  
  // Handle era-based fallbacks
  if (normalizedName.includes('swsh') || normalizedName.includes('sword') || normalizedName.includes('shield')) {
    return '/Assets/Set Symbols/14 Sword & Shield/Sword & Shield.png';
  }
  
  if (normalizedName.includes('sv') || normalizedName.includes('scarlet') || normalizedName.includes('violet')) {
    return '/Assets/Set Symbols/15 Scarlet & Violet/Scarlet & Violet.png';
  }
  
  if (normalizedName.includes('sm') || normalizedName.includes('sun') || normalizedName.includes('moon')) {
    return '/Assets/Set Symbols/13 Sun & Moon/Sun & Moon.png';
  }
  
  if (normalizedName.includes('xy')) {
    return '/Assets/Set Symbols/12 XY/XY.png';
  }
  
  if (normalizedName.includes('black') || normalizedName.includes('white') || normalizedName.includes('bw')) {
    return '/Assets/Set Symbols/11 Black & White/Black & White.png';
  }
  
  if (normalizedName.includes('diamond') || normalizedName.includes('pearl') || normalizedName.includes('dp')) {
    return '/Assets/Set Symbols/07 Diamond and Pearl/Diamond and Pearl.png';
  }
  
  if (normalizedName.includes('ex')) {
    return '/Assets/Set Symbols/06 EX/Ruby & Sapphire.png';
  }
  
  if (normalizedName.includes('neo')) {
    return '/Assets/Set Symbols/03 Neo/Neo Genesis.png';
  }
  
  if (normalizedName.includes('base set')) {
    return '/Assets/Set Symbols/01 Base/Base Set 2.png';
  }
  
  // Default fallback
  return '/Assets/Set Symbols/_Special.png';
}

// React component for set symbol
export function SetSymbol({ setName, className = "w-6 h-4" }) {
  const symbolPath = getSetSymbolPath(setName);

  return (
    <img 
      src={symbolPath} 
      alt={setName || 'Set Symbol'} 
      className={`${className} object-contain rounded`}
      onError={(e) => {
        // Fallback to generic symbol if image fails to load
        e.target.src = '/Assets/Set Symbols/_Special.png';
      }}
    />
  );
}

export default setSymbolMapping;