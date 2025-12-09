import React, { useState, useEffect, useMemo } from 'react';
import { API_URL } from '../utils/api';
import { useUser } from '../context/UserContext';
import { useTheme } from '../context/ThemeContext';
import { seriesFromSetName, cleanSetName } from '../utils/series';
import userDatabase from '../services/userDatabase';

const SetsPage = ({ onBack, onSetClick }) => {
  const { user } = useUser();
  const { isDark } = useTheme();
  const [sets, setSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [languageFilter, setLanguageFilter] = useState('en'); // 'en', 'ja'
  const [prefetchingSetId, setPrefetchingSetId] = useState(null);
  const [collapsedSeries, setCollapsedSeries] = useState(new Set());

  // Helper to get set symbol path (matching App.jsx logic)
  const getSetSymbolPath = (setName, series) => {
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
      if (s.includes('diamond') || s.includes('pearl')) return 'Diamond & Pearl';
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
    // Special case: Mega Evolution sets use the Mega Evolutions folder
    if (cleanedName === 'Mega Evolution' || setName === 'Mega Evolution' || 
        cleanedName === 'Mega Evolution Promo' || setName === 'ME: Mega Evolution Promo' ||
        cleanedName === 'Mega Evolution Energies' || setName === 'MEE: Mega Evolution Energies') {
      seriesFolder = '16 Mega Evolutions';
    }
    // Special case: Call of Legends file is in HeartGold SoulSilver folder
    if (cleanedName === 'Call of Legends') seriesFolder = '10 HeartGold SoulSilver';
    // Special case: HeartGold SoulSilver file is in HeartGold SoulSilver folder (but might not be detected correctly)
    if (cleanedName === 'HeartGold SoulSilver' || setName === 'HeartGold SoulSilver') seriesFolder = '10 HeartGold SoulSilver';
    // Special case: WoTC Promo file is in Base folder
    if (setName === 'WoTC Promo' || setName === 'WOTC Promo') seriesFolder = '01 Base';
    // Special case: Southern Islands file is in Neo folder
    if (setName === 'Southern Islands') seriesFolder = '03 Neo';
    // Special case: Ruby and Sapphire file is in EX folder
    if (cleanedName === 'Ruby and Sapphire' || cleanedName === 'Ruby & Sapphire' || setName === 'Ruby and Sapphire' || setName === 'Ruby & Sapphire') seriesFolder = '06 EX';
    // Special case: Prize Pack Series Cards file is in Sword & Shield folder
    if (setName === 'Prize Pack Series Cards') seriesFolder = '14 Sword & Shield';
    // Special case: Legendary Treasures file is in Black & White folder
    if (setName === 'Legendary Treasures' || setName === 'Legendary Treasures: Radiant Collection') seriesFolder = '11 Black & White';
    // Special case: Dragon Vault file is in Black & White folder
    if (setName === 'Dragon Vault') seriesFolder = '11 Black & White';
    // Special case: McDonald's Promos 2011 file is in Black & White folder
    if (setName === "McDonald's Promos 2011") seriesFolder = '11 Black & White';
    // Special case: McDonald's Promos 2012 file is in Black & White folder
    if (setName === "McDonald's Promos 2012") seriesFolder = '11 Black & White';
    // Special case: McDonald's Promos 2013 file is in Black & White folder
    if (setName === "McDonald's Promos 2013") seriesFolder = '11 Black & White';
    // Special case: McDonald's Promos 2014 file is in XY folder
    if (setName === "McDonald's Promos 2014") seriesFolder = '12 XY';
    // Special case: McDonald's Promos 2015 file is in XY folder
    if (setName === "McDonald's Promos 2015") seriesFolder = '12 XY';
    // Special case: McDonald's Promos 2016 file is in XY folder
    if (setName === "McDonald's Promos 2016") seriesFolder = '12 XY';
    // Special case: Generations: Radiant Collection file is in XY folder
    if (setName === 'Generations: Radiant Collection') seriesFolder = '12 XY';
    // Special case: Double Crisis file is in XY folder
    if (setName === 'Double Crisis') seriesFolder = '12 XY';
    // Special case: McDonald's Promos 2017 file is in Sun & Moon folder
    if (setName === "McDonald's Promos 2017") seriesFolder = '13 Sun & Moon';
    // Special case: McDonald's Promos 2018 file is in Sun & Moon folder
    if (setName === "McDonald's Promos 2018") seriesFolder = '13 Sun & Moon';
    // Special case: McDonald's Promos 2019 file is in Sun & Moon folder
    if (setName === "McDonald's Promos 2019") seriesFolder = '13 Sun & Moon';
    // Special case: Hidden Fates file is in Sun & Moon folder
    if (setName === 'Hidden Fates' || setName === 'Hidden Fates: Shiny Vault') seriesFolder = '13 Sun & Moon';
    // Special case: Detective Pikachu file is in Sun & Moon folder
    if (setName === 'Detective Pikachu') seriesFolder = '13 Sun & Moon';
    // Special case: Dragon Majesty file is in Sun & Moon folder
    if (setName === 'Dragon Majesty') seriesFolder = '13 Sun & Moon';
    // Special case: McDonald's Promos 2022 file is in Sword & Shield folder
    if (setName === "McDonald's Promos 2022") seriesFolder = '14 Sword & Shield';
    // Special case: McDonald's 25th Anniversary Promos file is in Sword & Shield folder
    if (setName === "McDonald's 25th Anniversary Promos") seriesFolder = '14 Sword & Shield';
    // Special case: Celebrations file is in Sword & Shield folder
    if (setName === 'Celebrations' || setName === 'Celebrations: Classic Collection') seriesFolder = '14 Sword & Shield';
    // Special case: Rumble file is in Platinum folder
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
      '151': '151.png', 'Paldea Evolved': 'Paldea Evolved.png',       'Scarlet & Violet': 'Scarlet & Violet.png',
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
      'Trick or Trade BOOster Bundle 2024': '_Trick or Trade.png'
    };

    const fileName = setFileMap[setName] || setFileMap[cleanedName] || `${cleanedName}.png`;
    
    // Special case: Promo symbols are in root Set Symbols folder
    if (fileName === '_Promo.png' || fileName === '_Trick or Trade.png') {
      return `/Assets/Set Symbols/${fileName}`;
    }
    
    return `/Assets/Set Symbols/${seriesFolder}/${fileName}`;
  };

  // Helper to get set logo path
  const getSetLogoPath = (setName, series, language = 'en') => {
    // If Japanese language, use Japanese logos
    if (language === 'ja') {
      const cleaned = cleanSetName(setName);
      // Remove set codes like "SV4K:", "S12:", etc.
      const withoutCode = cleaned.replace(/^[A-Z0-9]+[a-z]?\d*[a-z]?:\s*/i, '').trim();
      // Try to match with available logo files
      // Most Japanese logos match the set name directly
      const logoFile = `${withoutCode}.png`;
      return `/Assets/Logo_Japanese/${logoFile}`;
    }
    
    // English/International logos (existing logic)
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
      if (s.includes('diamond') || s.includes('pearl')) return 'Diamond & Pearl';
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
    // Special case: Call of Legends file is in HeartGold SoulSilver folder
    if (cleanedName === 'Call of Legends') seriesFolder = '10 HeartGold SoulSilver';
    // Special case: HeartGold SoulSilver file is in HeartGold SoulSilver folder
    if (cleanedName === 'HeartGold SoulSilver' || setName === 'HeartGold SoulSilver') seriesFolder = '10 HeartGold SoulSilver';
    // Special case: WoTC Promo file is in Base folder
    if (setName === 'WoTC Promo' || setName === 'WOTC Promo') seriesFolder = '01 Base';
    // Special case: Southern Islands file is in Neo folder
    if (setName === 'Southern Islands') seriesFolder = '03 Neo';
    // Special case: Ruby and Sapphire file is in EX folder
    if (cleanedName === 'Ruby and Sapphire' || cleanedName === 'Ruby & Sapphire' || setName === 'Ruby and Sapphire' || setName === 'Ruby & Sapphire') seriesFolder = '06 EX';
    // Special case: Trick or Trade 2022 file is in Sword & Shield folder
    if (setName === 'Trick or Trade BOOster Bundle') seriesFolder = '14 Sword & Shield';
    // Special case: Prize Pack Series Cards file is in Sword & Shield folder
    if (setName === 'Prize Pack Series Cards') seriesFolder = '14 Sword & Shield';
    // Special case: McDonald's Promos 2015 file is in XY folder
    if (setName === "McDonald's Promos 2015") seriesFolder = '12 XY';
    // Special case: McDonald's Promos 2014 file is in XY folder
    if (setName === "McDonald's Promos 2014") seriesFolder = '12 XY';
    // Special case: McDonald's Promos 2016 file is in XY folder
    if (setName === "McDonald's Promos 2016") seriesFolder = '12 XY';
    // Special case: Generations: Radiant Collection file is in XY folder
    if (setName === 'Generations: Radiant Collection') seriesFolder = '12 XY';
    // Special case: Double Crisis file is in XY folder
    if (setName === 'Double Crisis') seriesFolder = '12 XY';
    // Special case: Legendary Treasures file is in Black & White folder
    if (setName === 'Legendary Treasures' || setName === 'Legendary Treasures: Radiant Collection') seriesFolder = '11 Black & White';
    // Special case: Dragon Vault file is in Black & White folder
    if (setName === 'Dragon Vault') seriesFolder = '11 Black & White';
    // Special case: McDonald's Promos 2011 file is in Black & White folder
    if (setName === "McDonald's Promos 2011") seriesFolder = '11 Black & White';
    // Special case: McDonald's Promos 2012 file is in Black & White folder
    if (setName === "McDonald's Promos 2012") seriesFolder = '11 Black & White';
    // Special case: McDonald's Promos 2013 file is in Black & White folder
    if (setName === "McDonald's Promos 2013") seriesFolder = '11 Black & White';
    // Special case: McDonald's Promos 2017 file is in Sun & Moon folder
    if (setName === "McDonald's Promos 2017") seriesFolder = '13 Sun & Moon';
    // Special case: McDonald's Promos 2018 file is in Sun & Moon folder
    if (setName === "McDonald's Promos 2018") seriesFolder = '13 Sun & Moon';
    // Special case: McDonald's Promos 2019 file is in Sun & Moon folder
    if (setName === "McDonald's Promos 2019") seriesFolder = '13 Sun & Moon';
    // Special case: Hidden Fates file is in Sun & Moon folder
    if (setName === 'Hidden Fates' || setName === 'Hidden Fates: Shiny Vault') seriesFolder = '13 Sun & Moon';
    // Special case: Detective Pikachu file is in Sun & Moon folder
    if (setName === 'Detective Pikachu') seriesFolder = '13 Sun & Moon';
    // Special case: Dragon Majesty file is in Sun & Moon folder
    if (setName === 'Dragon Majesty') seriesFolder = '13 Sun & Moon';
    // Special case: McDonald's Promos 2022 file is in Sword & Shield folder
    if (setName === "McDonald's Promos 2022") seriesFolder = '14 Sword & Shield';
    // Special case: McDonald's 25th Anniversary Promos file is in Sword & Shield folder
    if (setName === "McDonald's 25th Anniversary Promos") seriesFolder = '14 Sword & Shield';
    // Special case: Celebrations file is in Sword & Shield folder
    if (setName === 'Celebrations' || setName === 'Celebrations: Classic Collection') seriesFolder = '14 Sword & Shield';
    // Special case: Rumble file is in Platinum folder
    if (setName === 'Rumble') seriesFolder = '09 Platinum';

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
      'Prize Pack Series Cards': 'Play!_Pokémon_Prize_Pack_Series_2022_logo.png'
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
  };

  // Format release date
  const formatReleaseDate = (dateString) => {
    if (!dateString) return '';
    
    // Treat placeholder/invalid dates as empty
    const dateStr = String(dateString).trim();
    if (dateStr === 'None' || dateStr === 'null' || dateStr === 'undefined' || dateStr === '') {
      return '';
    }
    
    // Reject placeholder date 1999-01-09
    if (dateStr === '1999-01-09' || dateStr.startsWith('1999-01-09')) {
      return '';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      
      // Only reject the specific placeholder date, not all dates before 2000
      // (some legitimate sets like Base Set, Jungle, Fossil were released in 1999)
      // We already checked for '1999-01-09' above, so we can allow other 1999 dates
      
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  // Get set code abbreviation - use abbreviation if available, otherwise generate from name
  const getSetCode = (set) => {
    if (set.abbreviation) {
      return set.abbreviation.toUpperCase();
    }
    // Extract first letters of words
    const words = set.name.split(' ');
    if (words.length === 1) {
      return words[0].substring(0, 3).toUpperCase();
    }
    return words.map(w => w[0] || '').join('').substring(0, 3).toUpperCase();
  };

  useEffect(() => {
    const CACHE_KEY = 'sets_cache';
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    
    // Force clear cache for release dates fix (can remove after confirming it works)
    const CACHE_VERSION = 'v2';
    const versionKey = `${CACHE_KEY}_version`;
    const cachedVersion = localStorage.getItem(versionKey);
    if (cachedVersion !== CACHE_VERSION) {
      console.log('Clearing sets cache due to version change');
      localStorage.removeItem(CACHE_KEY);
      localStorage.setItem(versionKey, CACHE_VERSION);
    }
    
    const fetchSets = async (useCache = true) => {
      try {
        // Check cache first
        if (useCache) {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            // Check if cached data is missing release dates (likely outdated)
            const hasReleaseDates = data && data.length > 0 && data.some(set => 
              (set.release_date && set.release_date !== 'None' && set.release_date !== null) ||
              (set.published_on && set.published_on !== 'None' && set.published_on !== null)
            );
            // If cache is fresh but missing release dates, invalidate it
            if (Date.now() - timestamp < CACHE_TTL && !hasReleaseDates) {
              console.log('Cache invalidated: missing release dates');
              localStorage.removeItem(CACHE_KEY);
              // Fetch fresh data immediately
              fetchSets(false);
              return;
            }
            // Also invalidate cache if most sets show TBD (likely outdated cache)
            const setsWithDates = data.filter(set => 
              (set.release_date && set.release_date !== 'None' && set.release_date !== null && set.release_date !== '') ||
              (set.published_on && set.published_on !== 'None' && set.published_on !== null && set.published_on !== '')
            );
            if (setsWithDates.length < data.length * 0.1) {
              console.log(`Cache invalidated: only ${setsWithDates.length}/${data.length} sets have dates`);
              localStorage.removeItem(CACHE_KEY);
              fetchSets(false);
              return;
            }
            if (Date.now() - timestamp < CACHE_TTL) {
              setSets(data);
              setLoading(false);
              // Fetch fresh data in background
              fetchSets(false);
              return;
            }
          }
        }
        
        if (useCache) {
          setLoading(true);
        }
        
        const response = await fetch(`${API_URL}/api/sets`, {
          headers: {
            'user-id': user?.id || 'default-user'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch sets');
        }

        const data = await response.json();
        const setsData = data.data || [];
        
        // Update cache
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: setsData,
          timestamp: Date.now()
        }));
        
        setSets(setsData);
      } catch (err) {
        console.error('Error fetching sets:', err);
        // If fetch fails and we have cached data, use it
        if (useCache) {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { data } = JSON.parse(cached);
            setSets(data);
          } else {
            setError(err.message);
          }
        }
      } finally {
        if (useCache) {
          setLoading(false);
        }
      }
    };

    fetchSets();
  }, [user?.id]);

  // Filter sets by language
  const filteredSets = sets.filter(set => {
    // Use language field from API - this is the primary source of truth
    const setLanguage = set.language;
    
    // Japanese sets: language must be explicitly 'ja'
    if (languageFilter === 'ja') {
      return setLanguage === 'ja';
    }
    
    // International/English sets: language is 'en', null, undefined, or anything else
    // (defaults to English for sets without explicit language)
    if (languageFilter === 'en') {
      return setLanguage !== 'ja';
    }
    
    return false;
  });

  // Calculate collection progress for each set
  const setsWithProgress = useMemo(() => {
    const userData = userDatabase.getUserData();
    if (!userData || !userData.collections || userData.collections.length === 0) {
      return filteredSets.map(set => ({
        ...set,
        cards_collected: 0,
        percentage: 0
      }));
    }

    // Collect all card IDs from all user collections
    const collectedCardIds = new Set();
    userData.collections.forEach(collection => {
      if (collection.cards) {
        collection.cards.forEach(card => {
          // Match by product_id or cardId
          if (card.cardId) {
            collectedCardIds.add(String(card.cardId));
          }
          if (card.id && card.id !== card.cardId) {
            collectedCardIds.add(String(card.id));
          }
        });
      }
    });

    return filteredSets.map(set => {
      // We need to count cards in this set that are collected
      // Since we don't have the full card list here, we'll return the API values
      // and calculate progress on the client side when viewing set details
      return {
        ...set,
        cards_collected: set.cards_collected || 0,
        percentage: set.percentage || 0,
        _collectedCardIds: collectedCardIds // Store for later use
      };
    });
  }, [filteredSets]);

  // Sort sets by release date (newest first) as default
  const sortedSets = [...setsWithProgress].sort((a, b) => {
    // Get dates from both release_date and published_on fields
    const dateAStr = a.release_date || a.published_on;
    const dateBStr = b.release_date || b.published_on;
    
    // Handle missing dates - put them at the end
    if (!dateAStr && !dateBStr) return 0;
    if (!dateAStr) return 1; // a has no date, put it after b
    if (!dateBStr) return -1; // b has no date, put it after a
    
    const dateA = new Date(dateAStr);
    const dateB = new Date(dateBStr);
    
    // Handle invalid dates
    if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
    if (isNaN(dateA.getTime())) return 1;
    if (isNaN(dateB.getTime())) return -1;
    
    return dateB - dateA; // Newest first
  });

  // Group sets by series
  const groupedBySeries = useMemo(() => {
    const groups = {};
    
    console.log('📚 [SERIES DEBUG] Starting to group sets. Total sets:', sortedSets.length);
    
    sortedSets.forEach(set => {
      let series = seriesFromSetName(set.name);
      console.log('📚 [SERIES DEBUG] Set:', set.name, '-> Series:', series);
      
      // If series detection failed, try harder to match by set name patterns
      if (!series || series === 'Pokemon TCG' || series === '') {
        const setName = (set.name || '').toLowerCase();
        
        // Check for numeric prefix patterns that might have been missed
        if (/^bw\d+|bw[\s:]/i.test(set.name)) {
          series = 'Black & White Series';
        } else if (/^dp\d+|dp[\s:]/i.test(set.name)) {
          series = 'Diamond & Pearl Series';
        } else if (/^hgss\d+|hgss[\s:]/i.test(set.name)) {
          series = 'HeartGold & SoulSilver Series';
        } else if (/^xy\d+|xy[\s:]/i.test(set.name)) {
          series = 'XY Series';
        } else if (/^sm\d+|sm[\s:]/i.test(set.name)) {
          series = 'Sun & Moon Series';
        } else if (/^swsh\d+|swsh[\s:]/i.test(set.name)) {
          series = 'Sword & Shield Series';
        } else if (/^sv\d+|sv[\s:]/i.test(set.name)) {
          series = 'Scarlet & Violet Series';
        } else if (/^me\d+|me[\s:]/i.test(set.name)) {
          series = 'Mega Evolution Series';
        } else if (/^adv/i.test(set.name)) {
          series = 'EX Series';
        } else if (/^ex/i.test(set.name)) {
          series = 'EX Series';
        } else if (/^bk[:\s]/i.test(set.name)) {
          series = 'Black & White Series';
        } else if (/^cp[1234]:/i.test(set.name)) {
          series = 'Black & White Series';
        } else if (/^cp[56]:/i.test(set.name)) {
          series = 'XY Series';
        } else if (/^cs\d+:/i.test(set.name)) {
          series = 'XY Series';
        } else if (setName.includes('battle academy')) {
          series = 'Sword & Shield Series';
        } else if (setName.includes('celebrations')) {
          series = 'Sword & Shield Series';
        } else if (setName.includes('hidden fates')) {
          series = 'Sun & Moon Series';
        } else if (setName.includes('detective pikachu')) {
          series = 'Sun & Moon Series';
        } else if (setName.includes('movie') && setName.includes('commemoration')) {
          series = 'Diamond & Pearl Series';
        } else if (setName.includes('bw') && (setName.includes('trainer') || setName.includes('deck'))) {
          series = 'Black & White Series';
        } else if (setName.includes('dp') && (setName.includes('trainer') || setName.includes('deck'))) {
          series = 'Diamond & Pearl Series';
        } else if (setName.includes('hgss') && (setName.includes('trainer') || setName.includes('deck'))) {
          series = 'HeartGold & SoulSilver Series';
        } else if (setName.includes('xy') && (setName.includes('trainer') || setName.includes('deck'))) {
          series = 'XY Series';
        } else if (setName.includes('sm') && (setName.includes('trainer') || setName.includes('deck'))) {
          series = 'Sun & Moon Series';
        } else if (setName.includes('swsh') && (setName.includes('trainer') || setName.includes('deck'))) {
          series = 'Sword & Shield Series';
        } else if (setName.includes('sv') && (setName.includes('trainer') || setName.includes('deck'))) {
          series = 'Scarlet & Violet Series';
        } else if (setName.includes('arceus')) {
          series = 'Platinum Series';
        } else if (setName.includes('black') && setName.includes('white')) {
          series = 'Black & White Series';
        } else if (setName.includes('diamond') && setName.includes('pearl')) {
          series = 'Diamond & Pearl Series';
        } else if (setName.includes('heartgold') || setName.includes('soulsilver')) {
          series = 'HeartGold & SoulSilver Series';
        } else if (setName.includes('scarlet') && setName.includes('violet')) {
          series = 'Scarlet & Violet Series';
        } else if (setName.includes('sword') && setName.includes('shield')) {
          series = 'Sword & Shield Series';
        } else if (setName.includes('sun') && setName.includes('moon')) {
          series = 'Sun & Moon Series';
        } else if (setName.includes('aquapolis')) {
          series = 'e-Card Series';
        } else {
          // Last resort: use default
          series = 'Other Series';
        }
      }
      
      // Convert 'Pokemon TCG' fallback to 'Other Series' (after all fallback logic)
      if (!series || series === 'Pokemon TCG' || series === '') {
        series = 'Other Series';
      }
      
      // Normalize series name - ensure it ends with " Series" (except "Other Series")
      if (series && series !== 'Other Series') {
        // Remove existing " Series" suffix if present (normalize first)
        const baseSeries = series.endsWith(' Series') ? series.replace(/ Series$/, '').trim() : series.trim();
        // Add " Series" suffix consistently
        series = baseSeries + ' Series';
      }
      
      if (!groups[series]) {
        groups[series] = [];
      }
      groups[series].push(set);
    });
    
    console.log('📚 [SERIES DEBUG] Final grouped sets:', Object.keys(groups).map(series => ({
      series,
      count: groups[series].length
    })));
    
    return groups;
  }, [sortedSets]);

  // Get series order (newest series first based on latest set release date)
  const seriesOrder = useMemo(() => {
    return Object.keys(groupedBySeries)
      .filter(series => {
        // Hide "Other Series" if it's empty or has very few sets
        // (likely means those sets should have been classified better)
        if (series === 'Other Series') {
          return groupedBySeries[series].length > 0;
        }
        return true;
      })
      .sort((a, b) => {
        const setsA = groupedBySeries[a];
        const setsB = groupedBySeries[b];
        
        // Put "Other Series" at the end
        if (a === 'Other Series') return 1;
        if (b === 'Other Series') return -1;
        
        // Get the most recent release date for each series
        const getLatestDate = (sets) => {
          const dates = sets
            .map(s => s.release_date || s.published_on)
            .filter(d => d)
            .map(d => new Date(d))
            .filter(d => !isNaN(d.getTime()));
          
          if (dates.length === 0) return new Date(0);
          return new Date(Math.max(...dates));
        };
        
        const dateA = getLatestDate(setsA);
        const dateB = getLatestDate(setsB);
        
        return dateB - dateA; // Newest first
      });
  }, [groupedBySeries]);

  // Toggle series collapse state
  const toggleSeries = (series) => {
    setCollapsedSeries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(series)) {
        newSet.delete(series);
      } else {
        newSet.add(series);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-xl">Loading sets...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-white text-xl">Error: {error}</div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen text-white transition-all duration-300 ease-in-out relative"
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
      <div className={`backdrop-blur-sm border-b sticky top-0 z-10 ${
        isDark 
          ? 'bg-black/20 border-white/10' 
          : 'bg-white/80 border-gray-300'
      }`}>
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className={`w-10 h-10 backdrop-blur-md rounded-lg flex items-center justify-center transition-all duration-200 border ${
                isDark
                  ? 'bg-white/10 hover:bg-white/20 border-white/20'
                  : 'bg-gray-200 hover:bg-gray-300 border-gray-300'
              }`}
            >
              <svg className={`w-5 h-5 ${isDark ? 'text-white' : 'text-theme-primary'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-theme-primary'}`}>Sets</h1>
          </div>
        </div>
        
        {/* Language Filter Toggle */}
        <div className="px-4 pb-4">
          <div className={`flex backdrop-blur-sm rounded-lg p-1 border ${
            isDark 
              ? 'bg-white/5 border-white/10' 
              : 'bg-gray-100 border-gray-300'
          }`}>
            <button
              onClick={() => setLanguageFilter('en')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                languageFilter === 'en'
                  ? isDark
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'bg-white text-theme-primary shadow-sm'
                  : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-theme-secondary hover:text-theme-primary hover:bg-gray-200'
              }`}
            >
              International
            </button>
            <button
              onClick={() => setLanguageFilter('ja')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                languageFilter === 'ja'
                  ? isDark
                    ? 'bg-white/20 text-white shadow-sm'
                    : 'bg-white text-theme-primary shadow-sm'
                  : isDark
                    ? 'text-white/70 hover:text-white hover:bg-white/10'
                    : 'text-theme-secondary hover:text-theme-primary hover:bg-gray-200'
              }`}
            >
              Japanese
            </button>
          </div>
        </div>
      </div>

      {/* Sets Grouped by Series */}
      <div className="px-4 pb-20">
        {seriesOrder.map((series) => {
          const seriesSets = groupedBySeries[series];
          const isCollapsed = collapsedSeries.has(series);
          
          return (
            <div key={series} className="mb-6">
              {/* Series Header */}
              <button
                onClick={() => toggleSeries(series)}
                className={`w-full flex items-center justify-between px-4 py-3 mb-3 rounded-lg transition-all ${
                  isDark
                    ? 'bg-white/10 hover:bg-white/15 border border-white/20'
                    : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                }`}
              >
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {series}
                </h2>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                    {seriesSets.length} {seriesSets.length === 1 ? 'set' : 'sets'}
                  </span>
                  <svg
                    className={`w-5 h-5 transition-transform ${isDark ? 'text-white/60' : 'text-gray-600'} ${
                      isCollapsed ? '' : 'rotate-180'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {/* Series Sets Grid */}
              {!isCollapsed && (
                <div className="grid grid-cols-2 gap-2">
                  {seriesSets.map((set) => {
            const series = seriesFromSetName(set.name);
            const cleanedName = cleanSetName(set.name);
            const setLanguage = set.language || 'en';
            const symbolPath = getSetSymbolPath(set.name, series, setLanguage);
            const logoPath = getSetLogoPath(set.name, series, setLanguage);
            const setCode = getSetCode(set);
            // Format release date - show "TBD" if missing
            // Check both release_date and published_on fields
            const rawDate = set.release_date || set.published_on;
            
            const formattedDate = formatReleaseDate(rawDate);
            const releaseDate = formattedDate || 'TBD';
            
            // Determine if this set is "Coming Soon"
            // CRITICAL: Sets without release dates (showing "TBD") should NEVER show "Coming Soon"
            // Only sets with a valid future release date should show "Coming Soon"
            let isComingSoon = false;
            
            // Get the raw release date value
            const rawReleaseDate = set.release_date || set.published_on;
            
            // Only check for "Coming Soon" if we have a valid, non-empty release date
            if (rawReleaseDate && 
                rawReleaseDate !== null && 
                rawReleaseDate !== undefined &&
                rawReleaseDate !== 'null' &&
                rawReleaseDate !== 'undefined' &&
                typeof rawReleaseDate === 'string' && 
                rawReleaseDate.trim() !== '') {
              try {
                const releaseDateObj = new Date(rawReleaseDate);
                // Only mark as "Coming Soon" if the date is valid and in the future
                if (!isNaN(releaseDateObj.getTime()) && releaseDateObj > new Date()) {
                  isComingSoon = true;
                }
              } catch (e) {
                // Invalid date, not coming soon
                isComingSoon = false;
              }
            }
            
            // Final safeguard: if formatted date is "TBD", never coming soon
            if (releaseDate === 'TBD') {
              isComingSoon = false;
            }
            
            // Use progress data from API (already calculated server-side)
            const totalCards = set.cards_total || 0;
            const cardsCollected = set.cards_collected || 0;
            const progress = totalCards > 0 ? Math.round((cardsCollected / totalCards) * 100) : 0;

            return (
              <div
                key={set.id}
                className="bg-white/5 backdrop-blur-sm rounded p-1.5 flex flex-col gap-1.5 cursor-pointer hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all h-full min-h-[240px] justify-between"
                onMouseEnter={() => {
                  // Prefetch cards when hovering over a set
                  const setId = set.group_id || set.id;
                  if (setId && !prefetchingSetId) {
                    setPrefetchingSetId(setId);
                    const cacheKey = `set_cards_cache_${setId}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (!cached) {
                      // Prefetch in background
                      fetch(`${API_URL}/api/sets/${encodeURIComponent(String(setId))}`)
                        .then(res => res.json())
                        .then(result => {
                          if (result.success && result.data && result.data.cards) {
                            const formattedCards = result.data.cards.map(card => ({
                              id: card.id || card.productId,
                              product_id: card.id || card.productId,
                              cardId: String(card.id || card.productId),
                              name: card.cleanName || card.name,
                              cleanName: card.cleanName || card.name,
                              image_url: card.imageUrl || card.image_url,
                              imageUrl: card.imageUrl || card.image_url,
                              formattedNumber: card.ext_number || 'N/A',
                              current_value: card.current_value || card.market_price || 0,
                              price: card.current_value || card.market_price || 0,
                              market_price: card.market_price || 0,
                              low_price: card.low_price || 0,
                              high_price: card.high_price || 0,
                              rarity: card.ext_rarity,
                              ext_rarity: card.ext_rarity,
                              ext_card_type: card.ext_card_type,
                              ext_hp: card.ext_hp,
                              ext_stage: card.ext_stage,
                              sub_type_name: card.sub_type_name,
                              images: card.imageUrl ? { small: card.imageUrl, large: card.imageUrl } : null,
                              tcgplayer: {
                                prices: {
                                  holofoil: card.market_price ? { market: card.market_price } : null,
                                  normal: card.market_price ? { market: card.market_price } : null
                                }
                              }
                            }));
                            localStorage.setItem(cacheKey, JSON.stringify({
                              cards: formattedCards,
                              setDetails: result.data,
                              timestamp: Date.now()
                            }));
                          }
                        })
                        .catch(() => {})
                        .finally(() => {
                          setPrefetchingSetId(null);
                        });
                    } else {
                      setPrefetchingSetId(null);
                    }
                  }
                }}
                onClick={() => onSetClick && onSetClick(set)}
              >
                {/* Header with Symbol and Name */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <div className="flex gap-1 items-center">
                    {/* Set Symbol - Hide entire container if image fails to load */}
                    <div className="set-symbol-container h-8 w-8 flex items-center justify-center flex-shrink-0">
                      <img
                        src={symbolPath}
                        alt={setCode}
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          // Hide the entire container if image not found
                          const container = e.target.closest('.set-symbol-container');
                          if (container) container.style.display = 'none';
                        }}
                      />
                    </div>
                    {/* Set Name - Fixed 32px height container */}
                    <div className="flex-1 min-w-0 overflow-hidden flex items-center set-name-container">
                      <p className="text-white text-[14px] font-semibold truncate w-full m-0 flex items-center set-name-text">
                        {cleanedName}
                      </p>
                    </div>
                  </div>
                  {/* Release Date - Always visible */}
                  <div className="flex gap-2.5 items-center mt-1.5 min-h-[20px]" style={{ display: 'flex' }}>
                    <p className="text-white text-[12px] font-medium leading-tight whitespace-nowrap">
                      {releaseDate || 'TBD'}
                    </p>
                  </div>
                </div>

                {/* Set Logo */}
                <div className="h-[130px] flex items-center justify-center relative overflow-hidden rounded flex-shrink-0">
                  <img
                    src={logoPath}
                    alt={set.name}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      // Fallback if logo not found
                      e.target.style.display = 'none';
                    }}
                  />
                </div>

                {/* Progress Section - Always at bottom with consistent spacing - ALWAYS VISIBLE */}
                <div className="flex flex-col gap-0.5 justify-end flex-shrink-0 min-h-[40px] w-full pt-[11px]" style={{ display: 'flex' }}>
                  {/* Always show progress bars - only show "Coming soon" as an additional indicator for future releases */}
                  {isComingSoon && (
                    <p className="text-white text-[10px] font-semibold text-center mb-1 opacity-75">
                      Coming soon...
                    </p>
                  )}
                  <div className="flex flex-col gap-0.5 justify-end min-h-[40px] w-full">
                    <p className="text-white text-[12px] text-center whitespace-nowrap">
                      {cardsCollected || 0} of {totalCards || 0}
                    </p>
                    {/* Progress Bar - Always visible */}
                    <div className="flex gap-1 items-center w-full">
                      <div className="flex-1 h-[5px] bg-[#f4f3fe] rounded-full overflow-hidden min-w-0">
                        <div
                          className="h-full bg-[#605dec] rounded-full transition-all"
                          style={{ width: `${Math.min(progress || 0, 100)}%` }}
                        />
                      </div>
                      <p className="text-[#8a8894] text-[12px] leading-[1.3] whitespace-nowrap flex-shrink-0 min-w-[30px] text-right">
                        {progress || 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SetsPage;

