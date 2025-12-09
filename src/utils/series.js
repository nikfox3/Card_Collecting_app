// Shared helpers for set name cleaning and series resolution

export function cleanSetName(name) {
  if (!name) return name;
  let n = String(name);
  n = n.replace(/^(SWSH\d+:\s*)/i, '');
  n = n.replace(/^(SV\d+:\s*)/i, '');
  n = n.replace(/^(SM\s*-\s*)/i, '');
  n = n.replace(/^(SM\s+)/i, '');  // Remove "SM " prefix (e.g., "SM Base Set")
  n = n.replace(/^(XY\s*-\s*)/i, '');
  n = n.replace(/^(ME\d+:\s*)/i, '');
  n = n.replace(/^(ME:\s*)/i, ''); // Remove "ME:" prefix (e.g., "ME: Mega Evolution Promo")
  n = n.replace(/^(MEE:\s*)/i, ''); // Remove "MEE:" prefix (e.g., "MEE: Mega Evolution Energies")
  n = n.replace(/^(SVE:\s*)/i, '');
  n = n.replace(/^(SV:\s*)/i, '');
  // Special case: SM Base Set -> Sun & Moon
  if (n === 'Base Set' && name.includes('SM')) n = 'Sun & Moon';
  // Special case: Scarlet & Violet Base Set -> Scarlet & Violet
  if (n === 'Scarlet & Violet Base Set') n = 'Scarlet & Violet';
  // Special case: Sword & Shield Base Set -> Sword & Shield
  if (n === 'Sword & Shield Base Set') n = 'Sword & Shield';
  // Special case: Scarlet & Violet 151 -> 151
  if (n === 'Scarlet & Violet 151') n = '151';
  return n.trim();
}

export function seriesFromSetName(rawName) {
  const raw = (rawName || '').toString().trim();
  const set = raw.toLowerCase();

  // Strong handling for code-prefixed set names (incl. sealed products), e.g. "SV03: Obsidian Flames" or "SV4K: Ancient Roar"
  if (/^sv\d+[a-z]?\s*:/i.test(raw)) return 'Scarlet & Violet Series';
  if (/^swsh\d+[a-z]?\s*:/i.test(raw)) return 'Sword & Shield Series';
  // Japanese Sword & Shield sets use "S" prefix (e.g., "S6a: Eevee Heroes", "S12: Paradigm Trigger")
  if (/^s\d+[a-z]?\s*:/i.test(raw)) return 'Sword & Shield Series';
  if (/^sm\d+[a-z]?\s*:/i.test(raw)) return 'Sun & Moon Series';
  if (/^xy\d+[a-z]?\s*:/i.test(raw)) return 'XY Series';
  if (/^me\d+[a-z]?\s*:/i.test(raw)) return 'Mega Evolution Series';

  // Prefix codes (including numeric suffixes like BW1, DP2, etc.)
  const codeMatch = raw.match(/^(SWSH|SV|SM|XY|BW|DP|HGSS|EX|ME|SVP|SWSHP|DPP|BWP|XYP|SMP|ADV|BKB|BKR|BKW|BKZ|BK)[\d:\-\s]*/i);
  const code = codeMatch ? codeMatch[1].toUpperCase() : '';
  const codeMap = {
    SWSH: 'Sword & Shield Series',
    SV: 'Scarlet & Violet Series',
    SM: 'Sun & Moon Series',
    XY: 'XY Series',
    BW: 'Black & White Series',
    DP: 'Diamond & Pearl Series',
    HGSS: 'HeartGold & SoulSilver Series',
    EX: 'EX Series',
    ME: 'Mega Evolution Series',
    DPP: 'Diamond & Pearl Series',
    BWP: 'Black & White Series',
    XYP: 'XY Series',
    SMP: 'Sun & Moon Series',
    SWSHP: 'Sword & Shield Series',
    SVP: 'Scarlet & Violet Series',
    ADV: 'EX Series', // ADV sets are part of EX Series
    BKB: 'Black & White Series', // Black Kyurem-EX Battle Strength Deck
    BKR: 'Black & White Series', // Reshiram-EX Battle Strength Deck
    BKW: 'Black & White Series', // White Kyurem-EX Battle Strength Deck
    BKZ: 'Black & White Series', // Zekrom-EX Battle Strength Deck
    BK: 'Black & White Series', // Generic BK prefix (Black & White era)
  };
  if (codeMap[code]) return codeMap[code];
  
  // Also check for codes with separators like "BW:" or "DP-" at the start
  const codeMatch2 = raw.match(/^(BW|DP|HGSS|XY|SM|SWSH|SV|ME|EX|ADV|BK)[:\-\s]/i);
  const code2 = codeMatch2 ? codeMatch2[1].toUpperCase() : '';
  if (codeMap[code2]) return codeMap[code2];

  // Explicit set name mappings (common/high-traffic)
  const explicit = {
    // Base and early
    'base set': 'Base Series',
    'jungle': 'Base Series',
    'fossil': 'Base Series',
    'base set 2': 'Base Series',
    'wotc promo': 'Base Series',
    'wizards of the coast promo': 'Base Series',
    'team rocket': 'Team Rocket Series',
    'gym heroes': 'Gym Series',
    'gym challenge': 'Gym Series',
    'legendary collection': 'Legendary Collection Series',
    // Neo
    'neo genesis': 'Neo Series',
    'neo discovery': 'Neo Series',
    'neo revelation': 'Neo Series',
    'neo destiny': 'Neo Series',
    'southern islands': 'Neo Series',
    'southern island': 'Neo Series',
    // e-Card
    'expedition': 'e-Card Series',
    'aquapolis': 'e-Card Series',
    'skyridge': 'e-Card Series',
    'best of promos': 'e-Card Series',
    // EX (examples)
    'ex ruby & sapphire': 'EX Series',
    'ruby & sapphire': 'EX Series',
    'ruby and sapphire': 'EX Series',
    'ex sandstorm': 'EX Series',
    'sandstorm': 'EX Series',
    'ex dragon': 'EX Series',
    'dragon': 'EX Series',
    'ex hidden legends': 'EX Series',
    'hidden legends': 'EX Series',
    'ex deoxys': 'EX Series',
    'deoxys': 'EX Series',
    'ex emerald': 'EX Series',
    'emerald': 'EX Series',
    'ex unseen forces': 'EX Series',
    'unseen forces': 'EX Series',
    'ex delta species': 'EX Series',
    'delta species': 'EX Series',
    'ex legend maker': 'EX Series',
    'legend maker': 'EX Series',
    'ex holon phantoms': 'EX Series',
    'holon phantoms': 'EX Series',
    'ex crystal guardians': 'EX Series',
    'crystal guardians': 'EX Series',
    'ex dragon frontiers': 'EX Series',
    'dragon frontiers': 'EX Series',
    'ex power keepers': 'EX Series',
    'power keepers': 'EX Series',
    'ex team rocket returns': 'EX Series',
    'team rocket returns': 'EX Series',
    'team magma vs team aqua': 'EX Series',
    'fire red & leafgreen': 'EX Series',
    'firered & leafgreen': 'EX Series',
    // DP
    'diamond & pearl': 'Diamond & Pearl Series',
    'mysterious treasures': 'Diamond & Pearl Series',
    'secret wonders': 'Diamond & Pearl Series',
    'great encounters': 'Diamond & Pearl Series',
    'majestic dawn': 'Diamond & Pearl Series',
    'legends awakened': 'Diamond & Pearl Series',
    'stormfront': 'Diamond & Pearl Series',
    // Platinum
    'platinum': 'Platinum Series',
    'rising rivals': 'Platinum Series',
    'supreme victors': 'Platinum Series',
    'arceus': 'Platinum Series',
    'pokemon rumble': 'Platinum Series',
    'rumble': 'Platinum Series',
    'arceus lv.x deck': 'Platinum Series',
    'arceus lv.x': 'Platinum Series',
    // HGSS
    'heartgold & soulsilver': 'HeartGold & SoulSilver Series',
    'undaunted': 'HeartGold & SoulSilver Series',
    'triumphant': 'HeartGold & SoulSilver Series',
    'unleashed': 'HeartGold & SoulSilver Series',
    'call of legends': 'Call of Legends Series',
    // BW (examples)
    'black & white': 'Black & White Series',
    'emerging powers': 'Black & White Series',
    'noble victories': 'Black & White Series',
    'next destinies': 'Black & White Series',
    'dark explorers': 'Black & White Series',
    'dragons exalted': 'Black & White Series',
    'plasma storm': 'Black & White Series',
    'plasma freeze': 'Black & White Series',
    'plasma blast': 'Black & White Series',
    'boundaries crossed': 'Black & White Series',
    'legendary treasures': 'Black & White Series',
    'legendary treasures: radiant collection': 'Black & White Series',
    'dragon vault': 'Black & White Series',
    // XY (examples)
    'xy base set': 'XY Series',
    'flashfire': 'XY Series',
    'furious fists': 'XY Series',
    'phantom forces': 'XY Series',
    'primal clash': 'XY Series',
    'roaring skies': 'XY Series',
    'ancient origins': 'XY Series',
    'breakthrough': 'XY Series',
    'breakpoint': 'XY Series',
    'fates collide': 'XY Series',
    'steam siege': 'XY Series',
    'evolutions': 'XY Series',
    'generations': 'XY Series',
    'generations: radiant': 'XY Series',
    'generations: radiant collection': 'XY Series',
    'double crisis': 'XY Series',
    'kalos starter set': 'XY Series',
    'kalos starter': 'XY Series',
    // Sun & Moon (examples)
    'sun & moon': 'Sun & Moon Series',
    'guardians rising': 'Sun & Moon Series',
    'burning shadows': 'Sun & Moon Series',
    'crimson invasion': 'Sun & Moon Series',
    'ultra prism': 'Sun & Moon Series',
    'forbidden light': 'Sun & Moon Series',
    'celestial storm': 'Sun & Moon Series',
    'lost thunder': 'Sun & Moon Series',
    'team up': 'Sun & Moon Series',
    'unbroken bonds': 'Sun & Moon Series',
    'unified minds': 'Sun & Moon Series',
    'cosmic eclipse': 'Sun & Moon Series',
    'shining legends': 'Sun & Moon Series',
    'dragon majesty': 'Sun & Moon Series',
    'hidden fates': 'Sun & Moon Series',
    'hidden fates: shiny vault': 'Sun & Moon Series',
    'hidden fates shiny vault': 'Sun & Moon Series',
    'detective pikachu': 'Sun & Moon Series',
    'great detective pikachu': 'Sun & Moon Series',
    // Sword & Shield (examples)
    "sword & shield base set": 'Sword & Shield Series',
    'rebel clash': 'Sword & Shield Series',
    'darkness ablaze': 'Sword & Shield Series',
    'vivid voltage': 'Sword & Shield Series',
    "champion's path": 'Sword & Shield Series',
    'battle styles': 'Sword & Shield Series',
    'chilling reign': 'Sword & Shield Series',
    'evolving skies': 'Sword & Shield Series',
    'fusion strike': 'Sword & Shield Series',
    'brilliant stars': 'Sword & Shield Series',
    'astral radiance': 'Sword & Shield Series',
    'pokemon go': 'Sword & Shield Series',
    'lost origin': 'Sword & Shield Series',
    'silver tempest': 'Sword & Shield Series',
    'crown zenith': 'Sword & Shield Series',
    'crown zenith: galarian gallery': 'Sword & Shield Series',
    'shining fates': 'Sword & Shield Series',
    'celebrations': 'Sword & Shield Series',
    'celebrations: classic collection': 'Sword & Shield Series',
    'celebrations classic collection': 'Sword & Shield Series',
    'battle academy': 'Sword & Shield Series',
    'battle academy 2022': 'Sword & Shield Series',
    'battle academy 2024': 'Sword & Shield Series',
    'battle styles': 'Sword & Shield Series',
    'champion\'s path': 'Sword & Shield Series',
    'champions path': 'Sword & Shield Series',
    'trick or trade': 'Sword & Shield Series',
    "mcdonald's 25th anniversary": 'Sword & Shield Series',
    "mcdonald's 25th anniversary promos": 'Sword & Shield Series',
    "mcdonald's promos 2021": 'Sword & Shield Series',
    's8a: 25th anniversary collection': 'Sword & Shield Series',
    // Japanese Sword & Shield sets
    'eevee heroes': 'Sword & Shield Series',
    'vmax climax': 'Sword & Shield Series',
    'shiny star v': 'Sword & Shield Series',
    'dark phantasma': 'Sword & Shield Series',
    'incandescent arcana': 'Sword & Shield Series',
    'lost abyss': 'Sword & Shield Series',
    'time gazer': 'Sword & Shield Series',
    'space juggler': 'Sword & Shield Series',
    'star birth': 'Sword & Shield Series',
    'fusion arts': 'Sword & Shield Series',
    'blue sky stream': 'Sword & Shield Series',
    'skyscraping perfection': 'Sword & Shield Series',
    'jet-black spirit': 'Sword & Shield Series',
    'silver lance': 'Sword & Shield Series',
    'rapid strike master': 'Sword & Shield Series',
    'single strike master': 'Sword & Shield Series',
    'amazing volt tackle': 'Sword & Shield Series',
    'infinity zone': 'Sword & Shield Series',
    'rebellion crash': 'Sword & Shield Series',
    'shield': 'Sword & Shield Series',
    'sword': 'Sword & Shield Series',
    'alter genesis': 'Sword & Shield Series',
    'miracle twin': 'Sword & Shield Series',
    'double blaze': 'Sword & Shield Series',
    'tag bolt': 'Sword & Shield Series',
    'paradigm trigger': 'Sword & Shield Series',
    'vstar universe': 'Sword & Shield Series',
    'battle region': 'Sword & Shield Series',
    // Scarlet & Violet (examples)
    'scarlet & violet base set': 'Scarlet & Violet Series',
    'paldea evolved': 'Scarlet & Violet Series',
    'obsidian flames': 'Scarlet & Violet Series',
    'scarlet & violet 151': 'Scarlet & Violet Series',
    'paradox rift': 'Scarlet & Violet Series',
    'paldean fates': 'Scarlet & Violet Series',
    'temporal forces': 'Scarlet & Violet Series',
    'twilight masquerade': 'Scarlet & Violet Series',
    'shrouded fable': 'Scarlet & Violet Series',
    'stellar crown': 'Scarlet & Violet Series',
    'surging sparks': 'Scarlet & Violet Series',
    'journey together': 'Scarlet & Violet Series',
    'prismatic evolutions': 'Scarlet & Violet Series',
    'battle partners': 'Scarlet & Violet Series',
    'destined rivals': 'Scarlet & Violet Series',
    'black bolt': 'Scarlet & Violet Series',
    'white flare': 'Scarlet & Violet Series',
    'trick or trade 2023': 'Scarlet & Violet Series',
    'trick or trade 2024': 'Scarlet & Violet Series',
    'trick or trade booster bundle': 'Sword & Shield Series',
    'trick or trade booster bundle 2023': 'Scarlet & Violet Series',
    'trick or trade booster bundle 2024': 'Scarlet & Violet Series',
    // EX Series special sets
    'adv expansion pack': 'EX Series',
    'adv-p promotional cards': 'EX Series',
    // Diamond & Pearl special sets
    'dp trainer kit': 'Diamond & Pearl Series',
    'dp training kit': 'Diamond & Pearl Series',
    'dp-p promotional cards': 'Diamond & Pearl Series',
    // Platinum special sets
    'arceus lv.x deck': 'Platinum Series',
    // Black & White special sets
    'bk: cobalion battle strength deck': 'Black & White Series',
    'bk: terrakion battle strength deck': 'Black & White Series',
    'bk: virizion battle strength deck': 'Black & White Series',
    'bkb: black kyurem-ex battle strength deck': 'Black & White Series',
    'bkr: reshiram-ex battle strength deck': 'Black & White Series',
    'bkw: white kyurem-ex battle strength deck': 'Black & White Series',
    'bkz: zekrom-ex battle strength deck': 'Black & White Series',
    'bw trainer kit': 'Black & White Series',
    'bw-p promotional cards': 'Black & White Series',
    'keldeo battle strength deck': 'Black & White Series',
    // XY special sets
    'break starter pack': 'XY Series',
    // Sun & Moon special sets
    'sm trainer kit': 'Sun & Moon Series',
    'sm3h: to have seen the battle rainbow': 'Sun & Moon Series',
    'sm4+: gx battle boost': 'Sun & Moon Series',
    // Sword & Shield special sets
    's9a: battle region': 'Sword & Shield Series',
    // Scarlet & Violet special sets
    'sv9: battle partners': 'Scarlet & Violet Series',
    'sv: chien-pao ex battle master deck': 'Scarlet & Violet Series',
    'sv: terastal charizard ex battle master deck': 'Scarlet & Violet Series',
    'svn: battle partners deck build box': 'Scarlet & Violet Series',
    // Promos and special
    "kids wb promos": 'Kids WB Promos Series',
    "burger king promos": 'Burger King Promos Series',
    "wizards of the coast promos": 'Wizards of the Coast Promos Series',
    "wizards of the coast promo": 'Wizards of the Coast Promos Series',
    "nintendo promos": 'Nintendo Promos Series',
    "pop series 1": 'Nintendo Promos Series',
    "pop series 2": 'Nintendo Promos Series',
    "pop series 3": 'Nintendo Promos Series',
    "pop series 4": 'Nintendo Promos Series',
    "pop series 5": 'Nintendo Promos Series',
    "pop series 6": 'Nintendo Promos Series',
    "pop series 7": 'Nintendo Promos Series',
    "pop series 8": 'Nintendo Promos Series',
    "pop series 9": 'Nintendo Promos Series',
    "mcdonald's promos": "McDonald's Promos Series",
    "prize pack series cards": 'Prize Pack Series',
    "league & championship cards": 'League & Championship Cards Series',
    "jumbo cards": 'Jumbo Cards Series',
    "deck exclusives": 'Deck Exclusives Series',
    "blister exclusives": 'Blister Exclusives Series',
    "professor program promos": 'Professor Program Promos Series',
    "miscellaneous cards & products": 'Miscellaneous Cards & Products Series',
    "alternate art promos": 'Alternate Art Promos Series',
    "pikachu world collection promos": 'Pikachu World Collection Promos Series',
    "countdown calendar promos": 'Countdown Calendar Promos Series',
    "trading card game classic": 'Trading Card Game Classic Series',
    "first partner pack": 'First Partner Pack Series',
    "battle academy": 'Sword & Shield Series',
    "battle academy 2022": 'Sword & Shield Series',
    "battle academy 2024": 'Sword & Shield Series',
    // Movie Commemoration sets
    "10th movie commemoration set": 'Diamond & Pearl Series',
    "11th movie commemoration set": 'Diamond & Pearl Series',
    "movie commemoration random pack": 'Diamond & Pearl Series',
    "movie commemoration vs pack": 'Diamond & Pearl Series',
    "movie commemoration vs pack: aura's lucario": 'Diamond & Pearl Series',
    "movie commemoration vs pack: sea's manaphy": 'Diamond & Pearl Series',
    "movie commemoration vs pack: sky-splitting deoxys": 'Diamond & Pearl Series',
    // Japanese collection packs (CP series are usually Black & White or XY era)
    "cp1: magma gang vs aqua gang: double crisis": 'XY Series',
    "double crisis": 'XY Series',
    "cp2: legendary shine collection": 'XY Series',
    "cp3: pokekyun collection": 'XY Series',
    "cp4: premium champion pack": 'XY Series',
    "cp5: mythical & legendary dream shine collection": 'XY Series',
    "cp6: expansion pack 20th anniversary": 'XY Series',
    // Collection sheets (CS series)
    "cs1: journey partners collection sheet": 'XY Series',
    // Other special sets
    "awakening legends": 'EX Series',
    "challenge from the darkness": 'EX Series',
    "champion road": 'EX Series',
    "clash of the blue sky": 'EX Series',
    "crossing the ruins...": 'EX Series',
    "everyone's exciting battle": 'EX Series',
    "my first battle": 'EX Series',
    // Deck Kits by era
    "aqua deck kit": 'EX Series',
    "ash vs team rocket deck kit": 'Base Series',
    "black deck kit": 'Black & White Series',
    "silver deck kit": 'HeartGold & SoulSilver Series',
    "magma deck kit": 'EX Series',
    "aquapolis": 'e-Card Series',
  };
  if (explicit[set]) return explicit[set];

  // Keyword fallback
  if (set.includes('e-card') || set.includes('expedition') || set.includes('aquapolis') || set.includes('skyridge')) return 'e-Card Series';
  // Common EX-era names without the "EX" prefix
  if (/(ruby & sapphire|sandstorm|hidden legends|deoxys|emerald|unseen forces|delta species|legend maker|holon phantoms|crystal guardians|dragon frontiers|power keepers|team magma vs team aqua|fire ?red & leafgreen|firered & leafgreen)/i.test(raw)) {
    return 'EX Series';
  }
  // Promo families
  if (/kids\s*wb\s*promos/i.test(raw)) return 'Kids WB Promos Series';
  if (/burger\s*king\s*promos/i.test(raw)) return 'Burger King Promos Series';
  if (/wizards of the coast\s*promos?/i.test(raw)) return 'Wizards of the Coast Promos Series';
  if (/nintendo\s*promos|pop\s*series\s*\d+/i.test(raw)) return 'Nintendo Promos Series';
  if (/mcdonald'?s\s*promos?/i.test(raw)) return "McDonald's Promos Series";
  if (/prize\s*pack/i.test(raw)) return 'Prize Pack Series';
  if (/league\s*&\s*championship\s*cards/i.test(raw)) return 'League & Championship Cards Series';
  if (/jumbo\s*cards/i.test(raw)) return 'Jumbo Cards Series';
  if (/deck\s*exclusives/i.test(raw)) return 'Deck Exclusives Series';
  if (/blister\s*exclusives/i.test(raw)) return 'Blister Exclusives Series';
  if (/professor\s*program\s*promos/i.test(raw)) return 'Professor Program Promos Series';
  if (/miscellaneous\s*cards\s*&\s*products/i.test(raw)) return 'Miscellaneous Cards & Products Series';
  if (/alternate\s*art\s*promos/i.test(raw)) return 'Alternate Art Promos Series';
  if (/pikachu\s*world\s*collection\s*promos/i.test(raw)) return 'Pikachu World Collection Promos Series';
  if (/countdown\s*calendar\s*promos/i.test(raw)) return 'Countdown Calendar Promos Series';
  if (/trading\s*card\s*game\s*classic/i.test(raw)) return 'Trading Card Game Classic Series';
  if (/first\s*partner\s*pack/i.test(raw)) return 'First Partner Pack Series';
  if (/battle\s*academy/i.test(raw)) return 'Battle Academy Series';
  if (set.includes('neo ')) return 'Neo Series';
  if (set.includes('gym ')) return 'Gym Series';
  if (set.includes('team rocket')) return 'Team Rocket Series';
  if (set.includes('base set')) return 'Base Series';
  if (set.includes('mega evolution')) return 'Mega Evolution Series';
  if (set.includes('diamond & pearl') || set.includes('diamond and pearl')) return 'Diamond & Pearl Series';
  if (set.includes('platinum')) return 'Platinum Series';
  if (set.includes('heartgold & soulsilver') || set.includes('heartgold and soulsilver') || set.includes('hgss')) return 'HeartGold & SoulSilver Series';
  if (set.includes('call of legends')) return 'Call of Legends Series';
  if (set.includes('black & white') || set.includes('black and white') || /^bw/i.test(raw)) return 'Black & White Series';
  if (set.includes('xy ') || /^xy/i.test(raw)) return 'XY Series';
  if (set.includes('sun & moon') || set.includes('sun and moon') || /^sm/i.test(raw)) return 'Sun & Moon Series';
  if (set.includes('sword & shield') || set.includes('sword and shield') || set.includes('swsh') || /^swsh/i.test(raw)) return 'Sword & Shield Series';
  if (set.includes('scarlet & violet') || set.includes('scarlet and violet') || set.includes(' sv ') || /^sv/i.test(raw)) return 'Scarlet & Violet Series';
  if (set.includes('shining fates')) return 'Sword & Shield Series';
  if (set.includes('celebrations')) return 'Sword & Shield Series';
  if (set.includes('hidden fates')) return 'Sun & Moon Series';
  if (set.includes('detective pikachu')) return 'Sun & Moon Series';
  if (set.includes('trick or trade')) {
    if (set.includes('2023') || set.includes('2024')) return 'Scarlet & Violet Series';
    return 'Sword & Shield Series';
  }
  if (set.includes('mcdonald') && (set.includes('25th') || set.includes('2021'))) return 'Sword & Shield Series';
  if (set.includes('best of promos')) return 'e-Card Series';
  if (set.includes('wotc promo') || (set.includes('wizards of the coast') && set.includes('promo'))) return 'Base Series';
  if (set.includes('dragon majesty')) return 'Sun & Moon Series';
  if (set.includes('dragon vault')) return 'Black & White Series';
  if (set.includes('pokemon rumble') || set.includes('rumble')) return 'Platinum Series';
  if (set.includes('legendary treasures')) return 'Black & White Series';
  if (set.includes('southern islands')) return 'Neo Series';
  if (set.includes('kalos starter')) return 'XY Series';
  if (set.includes('double crisis')) return 'XY Series';
  if (set.includes('generations') && set.includes('radiant')) return 'XY Series';
  
  // Check for trainer kits and deck kits by series prefix
  if (/bw.*trainer.*kit|bw.*deck.*kit/i.test(raw)) return 'Black & White Series';
  if (/dp.*trainer.*kit|dp.*deck.*kit|dp.*training.*kit/i.test(raw)) return 'Diamond & Pearl Series';
  if (/hgss.*trainer.*kit|hgss.*deck.*kit/i.test(raw)) return 'HeartGold & SoulSilver Series';
  if (/xy.*trainer.*kit|xy.*deck.*kit/i.test(raw)) return 'XY Series';
  if (/sm.*trainer.*kit|sm.*deck.*kit/i.test(raw)) return 'Sun & Moon Series';
  if (/swsh.*trainer.*kit|swsh.*deck.*kit/i.test(raw)) return 'Sword & Shield Series';
  if (/sv.*trainer.*kit|sv.*deck.*kit/i.test(raw)) return 'Scarlet & Violet Series';
  if (/sm.*trainer.*kit|sm.*deck.*kit/i.test(raw)) return 'Sun & Moon Series';
  if (/swsh.*trainer.*kit|swsh.*deck.*kit/i.test(raw)) return 'Sword & Shield Series';
  if (/sv.*trainer.*kit|sv.*deck.*kit/i.test(raw)) return 'Scarlet & Violet Series';
  
  // Check for ADV (which is EX Series era)
  if (/^adv/i.test(raw)) return 'EX Series';
  
  // Check for BK (Black & White Battle Strength Decks)
  if (/^bk[:\s]/i.test(raw)) return 'Black & White Series';
  
  // Check for CP (Collection Pack - various eras, but check patterns)
  if (/^cp[1234]:/i.test(raw)) return 'Black & White Series';
  if (/^cp[56]:/i.test(raw)) return 'XY Series';
  
  // Check for CS (Collection Sheet - XY era)
  if (/^cs\d+:/i.test(raw)) return 'XY Series';
  
  // Check for EX era deck kits
  if (/garchomp.*vs.*charizard.*deck.*kit/i.test(raw)) return 'Diamond & Pearl Series';
  if (/giratina.*vs.*dialga.*deck.*kit/i.test(raw)) return 'Diamond & Pearl Series';
  if (/heatran.*vs.*regigigas.*deck.*kit/i.test(raw)) return 'Platinum Series';
  if (/infernape.*vs.*gallade.*deck.*kit/i.test(raw)) return 'Platinum Series';
  if (/mewtwo.*vs.*genesect.*deck.*kit/i.test(raw)) return 'Black & White Series';
  if (/magmortar.*vs.*electivire.*deck.*kit/i.test(raw)) return 'Diamond & Pearl Series';
  
  // Check for Battle Academy (Sword & Shield era)
  if (/battle.*academy/i.test(raw)) return 'Sword & Shield Series';
  
  // Check for Battle Gift Sets
  if (/battle.*gift.*set.*thundurus.*vs.*tornadus/i.test(raw)) return 'Black & White Series';
  if (/team.*plasma.*battle.*gift.*set/i.test(raw)) return 'Black & White Series';
  
  // Check for Movie Commemoration sets (Diamond & Pearl era)
  if (/movie.*commemoration/i.test(raw)) return 'Diamond & Pearl Series';
  if (/\d+th.*movie.*commemoration/i.test(raw)) return 'Diamond & Pearl Series';
  
  // Check for Japanese deck kits
  if (/ash.*vs.*team.*rocket.*deck.*kit/i.test(raw)) return 'Base Series';
  
  // Check for EX era special sets
  if (/ex.*trainer.*kit/i.test(raw)) return 'EX Series';
  if (/ex.*battle.*boost/i.test(raw)) return 'EX Series';
  if (/ex.*battle.*stadium/i.test(raw)) return 'EX Series';
  
  // Check for XY era Mega Battle Decks
  if (/mega.*battle.*deck|m.*charizard.*ex|m.*rayquaza.*ex|m.*audino.*ex/i.test(raw)) return 'XY Series';
  if (/zygarde.*ex.*perfect.*battle.*deck/i.test(raw)) return 'XY Series';
  if (/emboar.*ex.*vs.*togekiss.*ex.*deck.*kit/i.test(raw)) return 'XY Series';
  
  // Check for Sun & Moon era products
  if (/gx.*battle.*boost/i.test(raw)) return 'Sun & Moon Series';
  
  // Check for Scarlet & Violet era products
  if (/battle.*partners/i.test(raw)) return 'Scarlet & Violet Series';
  if (/battle.*master.*deck/i.test(raw)) return 'Scarlet & Violet Series';
  
  // Check for Half Decks (various eras based on Pokemon)
  if (/bastiodon.*half.*deck/i.test(raw)) return 'Diamond & Pearl Series';
  
  // Check for Starter Decks
  if (/battle.*starter.*deck/i.test(raw)) return 'Diamond & Pearl Series';
  if (/battle.*theme.*deck.*victini/i.test(raw)) return 'Black & White Series';
  
  // Check for Battle Road (various eras)
  if (/battle.*road/i.test(raw)) return 'Diamond & Pearl Series';
  
  // Check for Limited Collection sets
  if (/limited.*collection.*master.*battle.*set/i.test(raw)) return 'EX Series';

  // Final fallback
  const finalSeries = 'Pokemon TCG';
  
  // Normalize to ensure it ends with " Series" if it's not "Other Series" or "Pokemon TCG"
  // The SetsPage will convert "Pokemon TCG" to "Other Series"
  return finalSeries;
}


