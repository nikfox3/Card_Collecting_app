import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { admin } from '../utils/api';

// Helper to determine series from set name (matching SetsPage logic)
function seriesFromSetName(rawName) {
  const raw = (rawName || '').toString().trim();
  const set = raw.toLowerCase();

  // Strong handling for code-prefixed set names
  if (/^sv\d+\s*:/i.test(raw)) return 'Scarlet & Violet';
  if (/^swsh\d+\s*:/i.test(raw)) return 'Sword & Shield';
  if (/^sm\d+\s*:/i.test(raw)) return 'Sun & Moon';
  if (/^xy\d+\s*:/i.test(raw)) return 'XY';
  if (/^me\d+\s*:/i.test(raw)) return 'Mega Evolutions';

  // Keyword matching
  if (set.includes('scarlet') && set.includes('violet')) return 'Scarlet & Violet';
  if (set.includes('sword') && set.includes('shield')) return 'Sword & Shield';
  if (set.includes('sun') && set.includes('moon')) return 'Sun & Moon';
  if (set.includes('heartgold') || set.includes('soul')) return 'HeartGold & SoulSilver';
  if (set.includes('diamond') || set.includes('pearl')) return 'Diamond & Pearl';
  if (set.includes('black') && set.includes('white')) return 'Black & White';
  if (set.includes('platinum')) return 'Platinum';
  if (set.includes('xy')) return 'XY';
  if (set.includes('neo')) return 'Neo';
  if (set.includes('gym')) return 'Gym';
  if (set.includes('base')) return 'Base';
  if (set.includes('mega')) return 'Mega Evolutions';
  return 'Scarlet & Violet';
}

// Helper function to clean set name (from SetsBrowser)
function cleanSetName(name) {
  if (!name) return name;
  let n = String(name);
  n = n.replace(/^(SWSH\d+:\s*)/i, '');
  n = n.replace(/^(SV\d+:\s*)/i, '');
  n = n.replace(/^(SM\s*-\s*)/i, '');
  n = n.replace(/^(SM\s+)/i, '');
  n = n.replace(/^(XY\s*-\s*)/i, '');
  n = n.replace(/^(ME\d+:\s*)/i, '');
  n = n.replace(/^(SVE:\s*)/i, '');
  n = n.replace(/^(SV:\s*)/i, '');
  if (n === 'Base Set' && name.includes('SM')) n = 'Sun & Moon';
  if (n === 'Scarlet & Violet Base Set') n = 'Scarlet & Violet';
  if (n === 'Sword & Shield Base Set') n = 'Sword & Shield';
  if (n === 'Scarlet & Violet 151') n = '151';
  return n.trim();
}

// Helper to get set symbol path (matching SetsPage.jsx logic exactly)
function getSetSymbolPath(setName, series) {
  if (!setName) return null;
  
  const cleanedName = cleanSetName(setName);
  const normalizedName = cleanedName
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*(?:-|—|–|:)\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/'/g, '_')
    .replace(/&/g, '_')
    .trim();

  const seriesFolderMap = {
    'Base': '01 Base',
    'Gym': '02 Gym',
    'Neo': '03 Neo',
    'Legendary Collection': '04 Legendary Collection',
    'Team Rocket': '01 Base',
    'eCard': '05 eCard',
    'EX': '06 EX',
    'Diamond & Pearl': '07 Diamond and Pearl',
    'Nintendo': '08 Nintendo',
    'Platinum': '09 Platinum',
    'HeartGold & SoulSilver': '10 HeartGold SoulSilver',
    'Black & White': '11 Black & White',
    'XY': '12 XY',
    'Sun & Moon': '13 Sun & Moon',
    'Sword & Shield': '14 Sword & Shield',
    'Scarlet & Violet': '15 Scarlet & Violet',
    'Mega Evolutions': '16 Mega Evolutions'
  };

  const normalizedSeriesKey = (() => {
    const s = (series || '').toString().toLowerCase();
    if (s.includes('scarlet') && s.includes('violet')) return 'Scarlet & Violet';
    if (s.includes('sword') && s.includes('shield')) return 'Sword & Shield';
    if (s.includes('sun') && s.includes('moon')) return 'Sun & Moon';
    if (s.includes('heartgold') || s.includes('soul')) return 'HeartGold & SoulSilver';
    if (s.includes('diamond') && s.includes('pearl')) return 'Diamond & Pearl';
    if (s.includes('black') && s.includes('white')) return 'Black & White';
    if (s.includes('legendary') && s.includes('collection')) return 'Legendary Collection';
    if (s.includes('platinum')) return 'Platinum';
    if (s.includes('nintendo')) return 'Nintendo';
    if (s.includes('xy')) return 'XY';
    if (s.includes('neo')) return 'Neo';
    if (s.includes('gym')) return 'Gym';
    if (s.includes('team rocket')) return 'Team Rocket';
    if (s.includes('base')) return 'Base';
    if (s.includes('e-card') || s.includes('ecard') || s.includes('e card')) return 'eCard';
    if (s.includes('ex')) return 'EX';
    if (s.includes('mega')) return 'Mega Evolutions';
    return '';
  })();

  let seriesFolder = seriesFolderMap[normalizedSeriesKey] || seriesFolderMap[series] || '15 Scarlet & Violet';
  if (cleanedName === 'Mega Evolution' || setName === 'Mega Evolution') seriesFolder = '16 Mega Evolutions';
  if (cleanedName === 'Call of Legends') seriesFolder = '10 HeartGold SoulSilver';
  if (cleanedName === 'HeartGold SoulSilver' || setName === 'HeartGold SoulSilver') seriesFolder = '10 HeartGold SoulSilver';
  if (setName === 'WoTC Promo' || setName === 'WOTC Promo') seriesFolder = '01 Base';
  if (setName === 'Southern Islands') seriesFolder = '03 Neo';
  if (cleanedName === 'Ruby and Sapphire' || cleanedName === 'Ruby & Sapphire' || setName === 'Ruby and Sapphire' || setName === 'Ruby & Sapphire') seriesFolder = '06 EX';
  if (setName === 'Prize Pack Series Cards') seriesFolder = '14 Sword & Shield';
  if (setName === 'Legendary Treasures' || setName === 'Legendary Treasures: Radiant Collection') seriesFolder = '11 Black & White';
  if (setName === 'Dragon Vault') seriesFolder = '11 Black & White';
  if (setName === "McDonald's Promos 2011") seriesFolder = '11 Black & White';
  if (setName === "McDonald's Promos 2012") seriesFolder = '11 Black & White';
  if (setName === "McDonald's Promos 2013") seriesFolder = '11 Black & White';
  if (setName === "McDonald's Promos 2014") seriesFolder = '12 XY';
  if (setName === "McDonald's Promos 2015") seriesFolder = '12 XY';
  if (setName === "McDonald's Promos 2016") seriesFolder = '12 XY';
  if (setName === 'Generations: Radiant Collection') seriesFolder = '12 XY';
  if (setName === 'Double Crisis') seriesFolder = '12 XY';
  if (setName === "McDonald's Promos 2017") seriesFolder = '13 Sun & Moon';
  if (setName === "McDonald's Promos 2018") seriesFolder = '13 Sun & Moon';
  if (setName === "McDonald's Promos 2019") seriesFolder = '13 Sun & Moon';
  if (setName === 'Hidden Fates' || setName === 'Hidden Fates: Shiny Vault') seriesFolder = '13 Sun & Moon';
  if (setName === 'Detective Pikachu') seriesFolder = '13 Sun & Moon';
  if (setName === 'Dragon Majesty') seriesFolder = '13 Sun & Moon';
  if (setName === "McDonald's Promos 2022") seriesFolder = '14 Sword & Shield';
  if (setName === "McDonald's 25th Anniversary Promos") seriesFolder = '14 Sword & Shield';
  if (setName === 'Celebrations' || setName === 'Celebrations: Classic Collection') seriesFolder = '14 Sword & Shield';
  if (setName === 'Rumble') seriesFolder = '09 Platinum';

  const setFileMap = {
    'ME01: Mega Evolution': 'mega-evolution.png',
    'ME02: Phantasmal Flames': 'Phantasmal Flame.png',
    'Call of Legends': 'Call of Legends.png',
    "Champion's Path": 'Champion_s Path.png',
    'Base Set': 'Base Set.png', 'Base Set 2': 'Base Set 2.png', 'Jungle': 'Jungle.png', 'Fossil': 'Fossil.png',
    'Gym Heroes': 'Gym Heroes.png', 'Gym Challenge': 'Gym Challenge.png',
    'Neo Genesis': 'Neo Genesis.png', 'Neo Discovery': 'Neo Discovery.png', 'Neo Revelation': 'Neo Revelation.png', 'Neo Destiny': 'Neo Destiny.png',
    'Southern Islands': 'Southern Isles.png',
    'Pop Series 1': 'Pop 1.png', 'POP Series 1': 'Pop 1.png', 'Pop Series 2': 'Pop 2.png', 'POP Series 2': 'Pop 2.png', 'Pop Series 3': 'Pop 3.png', 'POP Series 3': 'Pop 3.png', 'Pop Series 4': 'Pop 4.png', 'POP Series 4': 'Pop 4.png', 'Pop Series 5': 'Pop 5.png', 'POP Series 5': 'Pop 5.png', 'Pop Series 6': 'Pop 6.png', 'POP Series 6': 'Pop 6.png', 'Pop Series 7': 'Pop 7.png', 'POP Series 7': 'Pop 7.png', 'Pop Series 8': 'Pop 8.png', 'POP Series 8': 'Pop 8.png', 'Pop Series 9': 'Pop 9.png', 'POP Series 9': 'Pop 9.png',
    'Aquapolis': 'Aquapolis.png', 'Skyridge': 'Skyridge.png', 'Expedition Base Set': 'Expedition Base Set.png',
    'Ruby & Sapphire': 'Ruby & Sapphire.png', 'Ruby and Sapphire': 'Ruby & Sapphire.png', 'Sandstorm': 'Sandstorm.png', 'Dragon': 'Dragon.png',
    'Delta Species': 'Delta Species.png', 'Dragon Frontiers': 'Dragon Frontiers.png',
    'Team Rocket Returns': 'Team Rocket Returns.png', 'Hidden Legends': 'Hidden Legends.png', 'Hidden Fates': 'Hidden Fates.png', 'Hidden Fates: Shiny Vault': 'Hidden Fates.png', 'Detective Pikachu': 'Detective Pikachu.png', 'Dragon Majesty': 'Dragon Majesty.png', 'Flashfire': 'XY Flashfire.png', 'XY': 'XY.png', 'XY Base Set': 'XY.png',
    'Deoxys': 'Deoxys.png', 'Holon Phantoms': 'Holon Phantoms.png', 'Legend Maker': 'Legend Maker.png',
    'Power Keepers': 'Power Keepers.png', 'Unseen Forces': 'Unseen Forces.png', 'Emerald': 'Emerald.png',
    'Crystal Guardians': 'Crystal Guardians.png', 'FireRed & LeafGreen': 'FireRed LeafGreen.png',
    'Team Magma vs Team Aqua': 'Team Magma vs. Team Aqua.png', 'Team Rocket': 'Team Rocket.png',
    'Rumble': 'Pokemon Rumble.png',
    'Black and White': 'Black & White.png', 'Black & White': 'Black & White.png',
    'Black Bolt': 'black-bolt.png', 'White Flare': 'white-flare.png', 'Destined Rivals': 'destined-rivals.png',
    'Legendary Treasures': 'Legendary Treasures.png',
    'Legendary Treasures: Radiant Collection': 'Legendary Treasures.png',
    "McDonald's Promos 2011": 'McDonald_s Collection 2011.png',
    "McDonald's Promos 2012": 'McDonald_s Collection 2012.png',
    "McDonald's Promos 2013": 'McDonald_s Collection 2013.png',
    "McDonald's Promos 2014": 'McDonald_s Collection 2014.png',
    "McDonald's Promos 2015": 'McDonald_s Collection 2015.png',
    "McDonald's Promos 2016": 'McDonald_s Collection 2016.png',
    "McDonald's Promos 2017": 'McDonald_s Collection 2017.png',
    "McDonald's Promos 2018": 'S&M McDonald_s Collection 2018.png',
    "McDonald's Promos 2019": 'S&M McDonald_s Collection 2019.png',
    "McDonald's Promos 2022": 'McDonald_s Match Battle 2022.png',
    "McDonald's Promos 2023": 'McDonald_s Match Battle 2023.png',
    "McDonald's Promos 2024": 'McDonald_s Dragon Discovery.png',
    "McDonald's 25th Anniversary Promos": 'S&S McDonald_s Collection 25th Anniversary.png',
    'Mega Evolution': 'mega-evolution.png', 'Prismatic Evolutions': 'Prismatic Evolutions.png',
    'Evolutions': 'XY Evolutions.png', 'Fates Collide': 'XY Fates Collide.png', 'Steam Siege': 'XY Steam Siege.png',
    'Surging Sparks': 'Surging Sparks.png', 'Stellar Crown': 'Stellar Crown.png',
    'Shrouded Fable': 'Shrouded Fable.png', 'Twilight Masquerade': 'Twilight Masquerade.png',
    'Temporal Forces': 'Temporal Forces.png', 'Paldean Fates': 'Paldean Fates.png',
    'Paradox Rift': 'Paradox Rift.png', 'Obsidian Flames': 'Obsidian Flames.png',
    '151': '151.png', 'Paldea Evolved': 'Paldea Evolved.png', 'Scarlet & Violet': 'Scarlet & Violet.png',
    'SV: Scarlet & Violet Promo Cards': 'Scarlet & Violet Promos.png',
    'SVE: Scarlet & Violet Energies': 'scarlet-and-violet-energies.png',
    'Crown Zenith': 'Crown Zenith.png',
    'Crown Zenith: Galarian Gallery': 'Crown Zenith.png',
    'Silver Tempest': 'Silver Tempest.png',
    'SWSH12: Silver Tempest Trainer Gallery': 'Silver Tempest.png',
    'Lost Origin': 'Lost Origin.png',
    'SWSH11: Lost Origin Trainer Gallery': 'Lost Origin.png',
    'Brilliant Stars': 'Brilliant Stars.png',
    'SWSH09: Brilliant Stars Trainer Gallery': 'Brilliant Stars.png',
    'Astral Radiance': 'Astral Radiance.png',
    'SWSH10: Astral Radiance Trainer Gallery': 'Astral Radiance.png',
    'Fusion Strike': 'Fusion Strike.png',
    'Evolving Skies': 'Evolving Skies.png', 'Chilling Reign': 'Chilling Reign.png',
    'Battle Styles': 'Battle Styles.png', 'Shining Fates': 'Shining Fates.png', 'Shining Fates: Shiny Vault': 'Shining Fates.png',
    'Vivid Voltage': 'Vivid Voltage.png', 'Darkness Ablaze': 'Darkness Ablaze.png',
    'Rebel Clash': 'Rebel Clash.png', 'Sword & Shield': 'Sword & Shield.png',
    'Generations': 'XY Generations.png',
    'Generations: Radiant Collection': 'XY Generations.png',
    'Double Crisis': 'Double Crisis.png',
    'Pokemon Go': 'Pokemon Go.png', 'Pokemon GO': 'Pokemon Go.png',
    'Promos': '_Promo.png',
    'WoTC Promo': '_Promo.png',
    'WOTC Promo': '_Promo.png',
    'HGSS Promos': '_Promo.png',
    'Black and White Promos': '_Promo.png',
    'XY Promos': '_Promo.png',
    'Sun and Moon Promo': '_Promo.png',
    'Trick or Trade BOOster Bundle': '_Trick or Trade.png',
    'Trick or Trade BOOster Bundle 2023': '_Trick or Trade.png',
    'Trick or Trade BOOster Bundle 2024': '_Trick or Trade.png',
    'SV: Black Bolt': 'black-bolt.png',
    'SV: White Flare': 'white-flare.png',
    'SV10: Destined Rivals': 'destined-rivals.png'
  };

  const fileName = setFileMap[setName] || setFileMap[cleanedName] || `${cleanedName}.png`;
  
  if (fileName === '_Promo.png' || fileName === '_Trick or Trade.png') {
    return `/Assets/Set Symbols/${fileName}`;
  }
  
  return `/Assets/Set Symbols/${seriesFolder}/${fileName}`;
}

// Helper to get set logo path (matching SetsPage.jsx logic exactly)
function getSetLogoPath(setName, series) {
  if (!setName) return null;
  
  const cleanedName = cleanSetName(setName);
  const normalizedName = cleanedName
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*\[[^\]]*\]/g, '')
    .replace(/\s*(?:-|—|–|:)\s*.*$/, '')
    .replace(/\s+/g, ' ')
    .replace(/'/g, '_')
    .replace(/&/g, '_')
    .trim();

  const seriesFolderMap = {
    'Base': '01 Base',
    'Gym': '02 Gym',
    'Neo': '03 Neo',
    'Legendary Collection': '04 Legendary Collection',
    'Team Rocket': '01 Base',
    'eCard': '05 eCard',
    'EX': '06 EX',
    'Diamond & Pearl': '07 Diamond and Pearl',
    'Nintendo': '08 Nintendo',
    'Platinum': '09 Platinum',
    'HeartGold & SoulSilver': '10 HeartGold SoulSilver',
    'Black & White': '11 Black & White',
    'XY': '12 XY',
    'Sun & Moon': '13 Sun & Moon',
    'Sword & Shield': '14 Sword & Shield',
    'Scarlet & Violet': '15 Scarlet & Violet',
    'Mega Evolutions': 'Mega Evolutions'
  };

  const normalizedSeriesKey = (() => {
    const s = (series || '').toString().toLowerCase();
    if (s.includes('scarlet') && s.includes('violet')) return 'Scarlet & Violet';
    if (s.includes('sword') && s.includes('shield')) return 'Sword & Shield';
    if (s.includes('sun') && s.includes('moon')) return 'Sun & Moon';
    if (s.includes('heartgold') || s.includes('soul')) return 'HeartGold & SoulSilver';
    if (s.includes('diamond') && s.includes('pearl')) return 'Diamond & Pearl';
    if (s.includes('black') && s.includes('white')) return 'Black & White';
    if (s.includes('legendary') && s.includes('collection')) return 'Legendary Collection';
    if (s.includes('platinum')) return 'Platinum';
    if (s.includes('nintendo')) return 'Nintendo';
    if (s.includes('xy')) return 'XY';
    if (s.includes('neo')) return 'Neo';
    if (s.includes('gym')) return 'Gym';
    if (s.includes('team rocket')) return 'Team Rocket';
    if (s.includes('base')) return 'Base';
    if (s.includes('e-card') || s.includes('ecard') || s.includes('e card')) return 'eCard';
    if (s.includes('ex')) return 'EX';
    if (s.includes('mega')) return 'Mega Evolutions';
    return '';
  })();

  let seriesFolder = seriesFolderMap[normalizedSeriesKey] || seriesFolderMap[series] || '15 Scarlet & Violet';
  if (cleanedName === 'Mega Evolution' || setName === 'Mega Evolution') seriesFolder = 'Mega Evolutions';
  if (cleanedName === 'Call of Legends') seriesFolder = '10 HeartGold SoulSilver';
  if (cleanedName === 'HeartGold SoulSilver' || setName === 'HeartGold SoulSilver') seriesFolder = '10 HeartGold SoulSilver';
  if (setName === 'WoTC Promo' || setName === 'WOTC Promo') seriesFolder = '01 Base';
  if (setName === 'Southern Islands') seriesFolder = '03 Neo';
  if (cleanedName === 'Ruby and Sapphire' || cleanedName === 'Ruby & Sapphire') seriesFolder = '06 EX';
  if (setName === "McDonald's Promos 2022") seriesFolder = '14 Sword & Shield';
  if (setName === 'Celebrations' || setName === 'Celebrations: Classic Collection') seriesFolder = '14 Sword & Shield';
  if (setName === "McDonald's 25th Anniversary Promos") seriesFolder = '14 Sword & Shield';
  if (setName === "McDonald's Promos 2019") seriesFolder = '13 Sun & Moon';
  if (setName === 'Hidden Fates' || setName === 'Hidden Fates: Shiny Vault') seriesFolder = '13 Sun & Moon';
  if (setName === 'Detective Pikachu') seriesFolder = '13 Sun & Moon';
  if (setName === "McDonald's Promos 2018") seriesFolder = '13 Sun & Moon';
  if (setName === 'Dragon Majesty') seriesFolder = '13 Sun & Moon';
  if (setName === "McDonald's Promos 2017") seriesFolder = '13 Sun & Moon';
  if (setName === "McDonald's Promos 2016") seriesFolder = '12 XY';
  if (setName === 'Generations: Radiant Collection') seriesFolder = '12 XY';
  if (setName === 'Double Crisis') seriesFolder = '12 XY';
  if (setName === "McDonald's Promos 2015") seriesFolder = '12 XY';
  if (setName === "McDonald's Promos 2014") seriesFolder = '12 XY';
  if (setName === 'Legendary Treasures' || setName === 'Legendary Treasures: Radiant Collection') seriesFolder = '11 Black & White';
  if (setName === 'Dragon Vault') seriesFolder = '11 Black & White';
  if (setName === "McDonald's Promos 2011") seriesFolder = '11 Black & White';
  if (setName === "McDonald's Promos 2012") seriesFolder = '11 Black & White';
  if (setName === "McDonald's Promos 2013") seriesFolder = '11 Black & White';
  if (setName === 'Rumble') seriesFolder = '09 Platinum';
  if (setName === 'Prize Pack Series Cards') seriesFolder = '14 Sword & Shield';

  const logoFileMap = {
    'Team Magma vs Team Aqua': 'Team Magma vs. Team Aqua.png',
    'Ruby & Sapphire': 'Ruby & Sapphire.png',
    'Ruby and Sapphire': 'Ruby & Sapphire.png',
    'FireRed & LeafGreen': 'FireRed LeafGreen.png',
    'Rumble': 'Pokemon Rumble.png',
    'Evolutions': 'XY Evolutions.png',
    'Fates Collide': 'XY Fates Collide.png',
    'Steam Siege': 'XY Steam Siege.png',
    'XY': 'XY.png',
    'XY Base Set': 'XY.png',
    'Generations': 'XY Generations.png',
    'Generations: Radiant Collection': 'XY Generations Radiant Collection.png',
    'Double Crisis': 'Double Crisis.png',
    'Flashfire': 'Flashfire.png',
    'Sun & Moon': 'Sun & Moon.png',
    'SM Base Set': 'Sun & Moon.png',
    'Promos': 'Sun & Moon Promos.png',
    'WoTC Promo': 'WOTC Promos.png',
    'WOTC Promo': 'WOTC Promos.png',
    'HGSS Promos': 'HeartGold SoulSilver Promos.png',
    'Black and White Promos': 'Black & White Promos.png',
    'XY Promos': 'XY Promos.png',
    'Sun and Moon Promo': 'Sun & Moon Promos.png',
    'Hidden Fates': 'Hidden Fates.png',
    'Hidden Fates: Shiny Vault': 'Hidden Fates.png',
    'Detective Pikachu': 'Detective Pikachu.png',
    'Dragon Majesty': 'Dragon Majesty.png',
    'Sword & Shield': 'Sword & Shield.png',
    'SWSH: Sword & Shield Promo Cards': 'Sword & Shield Promos.png',
    'Scarlet & Violet': 'Scarlet & Violet.png',
    'Scarlet & Violet Base Set': 'Scarlet & Violet.png',
    'SV: Scarlet & Violet Promo Cards': 'Scarlet & Violet Promos.png',
    'SVE: Scarlet & Violet Energies': 'Scarlet & Violet.png',
    'Crown Zenith': 'Crown Zenith.png',
    'Crown Zenith: Galarian Gallery': 'Crown Zenith.png',
    'SWSH12: Silver Tempest Trainer Gallery': 'Silver Tempest.png',
    'SWSH11: Lost Origin Trainer Gallery': 'Lost Origin.png',
    'SWSH10: Astral Radiance Trainer Gallery': 'Astral Radiance.png',
    'SWSH09: Brilliant Stars Trainer Gallery': 'Brilliant Stars.png',
    'Black and White': 'Black & White.png',
    'Legendary Treasures': 'Legendary Treasures1.png',
    'Legendary Treasures: Radiant Collection': 'Legendary Treasures Radiant collection .png',
    'Delta Species': 'Delta Species Logo.png',
    'Base Set': 'Base.png',
    'Base Set (Shadowless)': 'Base.png',
    'Southern Islands': 'Southern Islands.png',
    'Pop Series 1': 'Pop.png', 'POP Series 1': 'Pop.png', 'Pop Series 2': 'Pop.png', 'POP Series 2': 'Pop.png', 'Pop Series 3': 'Pop.png', 'POP Series 3': 'Pop.png', 'Pop Series 4': 'Pop.png', 'POP Series 4': 'Pop.png', 'Pop Series 5': 'Pop.png', 'POP Series 5': 'Pop.png', 'Pop Series 6': 'Pop.png', 'POP Series 6': 'Pop.png', 'Pop Series 7': 'Pop.png', 'POP Series 7': 'Pop.png', 'Pop Series 8': 'Pop.png', 'POP Series 8': 'Pop.png', 'Pop Series 9': 'Pop.png', 'POP Series 9': 'Pop.png',
    'ME01: Mega Evolution': 'mega-evolution.png',
    'Mega Evolution': 'mega-evolution.png',
    'ME: Mega Evolution Promo': 'mega-evolution.png',
    'MEE: Mega Evolution Energies': 'mega-evolution.png',
    'ME02: Phantasmal Flames': 'Phantasmal Flames.png',
    'SV: Black Bolt': 'black bolt.png',
    'SV: White Flare': 'white flare.png',
    'SV10: Destined Rivals': 'destined-rivals.png',
    'SV09: Journey Together': 'Journey Together.png',
    'Journey Together': 'Journey Together.png',
    'Prismatic Evolutions': 'Prismatic Evolutions.png',
    "McDonald's Promos 2011": 'B&W McDonald_s Collection.png',
    "McDonald's Promos 2012": 'B&W McDonald_s Collection.png',
    "McDonald's Promos 2013": 'B&W McDonald_s Collection.png',
    "McDonald's Promos 2014": 'XY McDonald_s Collection.png',
    "McDonald's Promos 2015": 'XY McDonald_s Collection.png',
    "McDonald's Promos 2016": 'XY McDonald_s Collection.png',
    "McDonald's Promos 2017": 'S&M McDonald_s Collection.png',
    "McDonald's Promos 2018": 'S&M McDonald_s Collection.png',
    "McDonald's Promos 2019": 'S&M McDonald_s Collection.png',
    "McDonald's Promos 2022": 'Match Battle 2022.png',
    "McDonald's Promos 2023": 'McDonald_s Match Battle 2023.png',
    "McDonald's Promos 2024": 'McDonald_s Dragon Discovery.png',
    "McDonald's 25th Anniversary Promos": 'S&S McDonald_s Collection 25th Anniversary.png',
    'Trick or Trade BOOster Bundle': 'Trick or Trade 2022.png',
    'Trick or Trade BOOster Bundle 2023': 'Trick or Trade 2023.png',
    'Trick or Trade BOOster Bundle 2024': 'Trick or Trade 2024.png',
    'Battle Academy': 'Battle_Academy_Logo.png',
    'Battle Academy 2022': 'Battle_Academy_Logo.png',
    'Battle Academy 2024': 'Battle_Academy_Logo.png',
    'Pokemon Go': 'Pokemon Go.png',
    'Pokemon GO': 'Pokemon Go.png',
    'Prize Pack Series Cards': 'Play!_Pokémon_Prize_Pack_Series_2022_logo.png'
  };

  // Try exact matches first - check setName, cleanedName, and normalizedName
  let fileName = logoFileMap[setName];
  if (!fileName) {
    fileName = logoFileMap[cleanedName];
  }
  if (!fileName) {
    fileName = logoFileMap[normalizedName];
  }
  
  // If still no match, use normalized name with proper capitalization
  // (title case with spaces matches actual file naming convention)
  if (!fileName) {
    fileName = `${normalizedName}.png`;
  }
  
  return `/Assets/Logos/${seriesFolder}/${fileName}`;
}

export default function SetEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [set, setSet] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Function to navigate back with preserved search state
  const navigateBackWithState = () => {
    const returnParams = searchParams.get('return');
    if (returnParams) {
      navigate(`/sets?${returnParams}`);
    } else {
      navigate('/sets');
    }
  };

  useEffect(() => {
    loadSet();
  }, [id]);

  const loadSet = async () => {
    try {
      setLoading(true);
      const response = await admin.getSet(id);
      const setData = response.data.data;
      setSet(setData);
      setFormData({
        name: setData.name || '',
        clean_name: setData.clean_name || setData.name || '',
        logo_url: setData.logo_url || '',
        symbol_url: setData.symbol_url || '',
        published_on: setData.published_on ? setData.published_on.split('T')[0] : '',
        modified_on: setData.modified_on ? setData.modified_on.split('T')[0] : ''
      });
    } catch (error) {
      console.error('Error loading set:', error);
      setMessage('Error loading set');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');

      // Convert date strings to ISO format if needed
      const updates = { ...formData };
      if (updates.published_on) {
        updates.published_on = new Date(updates.published_on).toISOString();
      }
      if (updates.modified_on) {
        updates.modified_on = new Date(updates.modified_on).toISOString();
      }

      await admin.updateSet(id, updates);
      setMessage('Set updated successfully!');
      
      // Reload set to get updated data
      setTimeout(() => {
        loadSet();
      }, 500);
    } catch (error) {
      console.error('Error updating set:', error);
      setMessage('Error updating set');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-slate-400">Loading set...</p>
        </div>
      </div>
    );
  }

  if (!set) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-slate-400 mb-4">Set not found</p>
          <button
            onClick={navigateBackWithState}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
          >
            Back to Sets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={navigateBackWithState}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sets
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Set</h1>
          <p className="text-slate-400">Set ID: {set.id}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg ${
          message.includes('Error') 
            ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
            : 'bg-green-500/20 text-green-400 border border-green-500/50'
        }`}>
          {message}
        </div>
      )}

      {/* Form */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl border border-slate-700/50 p-6">
        <div className="space-y-6">
          {/* Preview Section */}
          <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50">
            <h2 className="text-lg font-semibold text-white mb-4">Previews</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Symbol Preview */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Set Symbol</p>
                <div className="w-20 h-20 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden relative">
                  {(() => {
                    // Use formData > set > generated path (matching SetsPage logic)
                    const symbolUrl = formData.symbol_url || set?.symbol_url;
                    const setName = formData.name || set?.name;
                    const generatedPath = setName ? (() => {
                      const series = seriesFromSetName(setName);
                      return getSetSymbolPath(setName, series);
                    })() : null;
                    const finalSymbolUrl = symbolUrl || generatedPath;
                    
                    if (!finalSymbolUrl) {
                      return (
                        <div className="text-slate-500 text-xs text-center px-2">No symbol</div>
                      );
                    }
                    
                    return (
                      <>
                        <img 
                          key={finalSymbolUrl}
                          src={finalSymbolUrl} 
                          alt="Set symbol"
                          className="w-full h-full object-contain"
                          style={{ display: 'block' }}
                          onError={(e) => {
                            console.error('Symbol image failed to load:', finalSymbolUrl);
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement?.querySelector('.symbol-fallback');
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                          onLoad={(e) => {
                            // Hide fallback when image loads successfully
                            const fallback = e.target.parentElement?.querySelector('.symbol-fallback');
                            if (fallback) {
                              fallback.style.display = 'none';
                            }
                          }}
                        />
                        <div className="hidden symbol-fallback text-slate-500 text-xs text-center px-2 absolute inset-0 items-center justify-center" style={{ display: 'none' }}>No symbol</div>
                      </>
                    );
                  })()}
                </div>
              </div>
              {/* Logo Preview */}
              <div>
                <p className="text-slate-400 text-sm mb-2">Set Logo</p>
                <div className="w-32 h-32 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden relative">
                  {(() => {
                    // Use formData > set > generated path (matching SetsPage logic)
                    const logoUrl = formData.logo_url || set?.logo_url;
                    const setName = formData.name || set?.name;
                    const generatedPath = setName ? (() => {
                      const series = seriesFromSetName(setName);
                      return getSetLogoPath(setName, series);
                    })() : null;
                    const finalLogoUrl = logoUrl || generatedPath;
                    
                    if (!finalLogoUrl) {
                      return (
                        <div className="text-slate-500 text-xs text-center px-2">No logo</div>
                      );
                    }
                    
                    return (
                      <>
                        <img 
                          key={finalLogoUrl}
                          src={finalLogoUrl} 
                          alt="Set logo"
                          className="w-full h-full object-contain"
                          style={{ display: 'block' }}
                          onError={(e) => {
                            console.error('Logo image failed to load:', finalLogoUrl);
                            e.target.style.display = 'none';
                            const fallback = e.target.parentElement?.querySelector('.logo-fallback');
                            if (fallback) {
                              fallback.style.display = 'flex';
                            }
                          }}
                          onLoad={(e) => {
                            // Hide fallback when image loads successfully
                            const fallback = e.target.parentElement?.querySelector('.logo-fallback');
                            if (fallback) {
                              fallback.style.display = 'none';
                            }
                          }}
                        />
                        <div className="hidden logo-fallback text-slate-500 text-xs text-center px-2 absolute inset-0 items-center justify-center" style={{ display: 'none' }}>No logo</div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>
            <div className="space-y-4">
              {/* Set Name */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Set Name
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter set name"
                />
              </div>

              {/* Clean Name */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Clean Name
                </label>
                <input
                  type="text"
                  value={formData.clean_name || ''}
                  onChange={(e) => setFormData({ ...formData, clean_name: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter clean name (e.g., without set codes)"
                />
                <p className="text-slate-500 text-xs mt-1">Used for display purposes, removes set codes like "SV09:", "ME01:", etc.</p>
              </div>

              {/* Symbol URL */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Set Symbol URL
                </label>
                <input
                  type="text"
                  value={formData.symbol_url || ''}
                  onChange={(e) => setFormData({ ...formData, symbol_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter symbol URL (e.g., /Assets/Set Symbols/15 Scarlet & Violet/journey-together.png)"
                />
                <p className="text-slate-500 text-xs mt-1">Path to the set symbol icon image</p>
                {formData.symbol_url && (
                  <div className="mt-3">
                    <p className="text-slate-400 text-xs mb-2">Symbol Preview:</p>
                    <div className="w-16 h-16 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                      <img 
                        src={formData.symbol_url} 
                        alt="Set symbol preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden text-slate-500 text-xs text-center px-2">No image</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Logo URL */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Set Logo URL
                </label>
                <input
                  type="text"
                  value={formData.logo_url || ''}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter logo URL (e.g., /Assets/Logos/15 Scarlet & Violet/journey-together.png)"
                />
                <p className="text-slate-500 text-xs mt-1">Path to the set logo image</p>
                {formData.logo_url && (
                  <div className="mt-3">
                    <p className="text-slate-400 text-xs mb-2">Logo Preview:</p>
                    <div className="w-32 h-32 bg-slate-900/50 rounded-lg flex items-center justify-center border border-slate-700 overflow-hidden">
                      <img 
                        src={formData.logo_url} 
                        alt="Set logo preview"
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="hidden text-slate-500 text-xs">No image</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Release Date */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Release Date
                </label>
                <input
                  type="date"
                  value={formData.published_on || ''}
                  onChange={(e) => setFormData({ ...formData, published_on: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Modified Date */}
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">
                  Modified Date
                </label>
                <input
                  type="date"
                  value={formData.modified_on || ''}
                  onChange={(e) => setFormData({ ...formData, modified_on: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Set Statistics */}
          <div className="pt-6 border-t border-slate-700/50">
            <h2 className="text-xl font-semibold text-white mb-4">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">Total Cards</div>
                <div className="text-white text-2xl font-bold">{set.total_cards || 0}</div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-1">Set ID</div>
                <div className="text-white text-2xl font-bold font-mono">{set.id}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

