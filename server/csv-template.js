// CSV Template Generator for Card Imports

const generateCSVTemplate = () => {
  const headers = [
    // Core Identification
    'Card ID',
    'Card Name',
    'Set ID',
    'Set Name',
    'Card Number',
    
    // Basic Info
    'Supertype',
    'Subtypes',
    'HP',
    'Level',
    'Rarity',
    'Artist',
    
    // Pokemon Attributes
    'Types',
    'Evolves From',
    
    // Battle Stats
    'Attack 1 Name',
    'Attack 1 Cost',
    'Attack 1 Damage',
    'Attack 1 Text',
    'Attack 2 Name',
    'Attack 2 Cost',
    'Attack 2 Damage',
    'Attack 2 Text',
    'Weakness Type',
    'Weakness Value',
    'Resistance Type',
    'Resistance Value',
    'Retreat Cost',
    
    // Pricing - TCGPlayer
    'TCGPlayer Market (Normal)',
    'TCGPlayer Low (Normal)',
    'TCGPlayer High (Normal)',
    'TCGPlayer Market (Holofoil)',
    'TCGPlayer Low (Holofoil)',
    'TCGPlayer High (Holofoil)',
    
    // Pricing - Cardmarket
    'Cardmarket Average',
    'Cardmarket Low',
    'Cardmarket Trend',
    
    // Pricing - eBay (Future)
    'eBay Average',
    'eBay Low',
    'eBay High',
    
    // Current Value
    'Current Value',
    
    // Images
    'Image Small URL',
    'Image Large URL',
    
    // App Specific
    'Language',
    'Variant',
    'Regulation Mark',
    'Format',
    
    // Additional
    'Notes'
  ];

  const sampleRow = [
    // Core Identification
    'base1-4',
    'Charizard',
    'base1',
    'Base Set',
    '4/102',
    
    // Basic Info
    'Pokémon',
    'Stage 2',
    '120',
    '76',
    'Rare Holo',
    'Ken Sugimori',
    
    // Pokemon Attributes
    'Fire',
    'Charmeleon',
    
    // Battle Stats
    'Fire Spin',
    'Fire,Fire,Fire,Fire',
    '100',
    'Discard 2 Energy cards attached to Charizard in order to use this attack.',
    '',
    '',
    '',
    '',
    'Water',
    '×2',
    '',
    '',
    'Colorless,Colorless,Colorless',
    
    // Pricing - TCGPlayer
    '457.11',
    '389.99',
    '500.00',
    '',
    '',
    '',
    
    // Pricing - Cardmarket
    '',
    '',
    '',
    
    // Pricing - eBay
    '',
    '',
    '',
    
    // Current Value
    '457.11',
    
    // Images
    'https://images.pokemontcg.io/base1/4.png',
    'https://images.pokemontcg.io/base1/4_hires.png',
    
    // App Specific
    'en',
    'Holo',
    '',
    'Unlimited',
    
    // Additional
    'Example card - replace with your data'
  ];

  // Build CSV string
  const csvContent = [
    headers.join(','),
    sampleRow.map(val => `"${val}"`).join(',')
  ].join('\n');

  return csvContent;
};

// Instructions text
const generateInstructions = () => {
  return `POKEMON CARD CSV IMPORT - INSTRUCTIONS

1. REQUIRED FIELDS (must be filled):
   - Card ID: Unique identifier (e.g., base1-4, sm9-170)
   - Card Name: Name of the card
   - Set ID: Set identifier (e.g., base1, xy5, swsh1)
   - Card Number: Number in set (XXX/YYY format recommended)

2. OPTIONAL FIELDS (leave blank if not applicable):
   - All other fields can be empty
   - Arrays should be comma-separated (e.g., "Fire,Water")
   - JSON fields will be automatically parsed

3. PRICING FIELDS:
   - Enter prices as numbers only (no $ or currency symbols)
   - Use decimal points for cents (e.g., 12.99 not 12.99$)
   - Current Value will auto-calculate from TCGPlayer if left blank

4. IMAGE URLS:
   - Use full URLs from pokemontcg.io or other sources
   - Format: https://images.pokemontcg.io/[set-id]/[number].png
   - Small images are ~245x342px, Large are ~734x1024px

5. SPECIAL FORMATS:
   - Types: Comma-separated (Fire,Dragon)
   - Subtypes: Comma-separated (Stage 2,VMAX)
   - Retreat Cost: Comma-separated energies (Colorless,Colorless)
   - Attack Cost: Comma-separated energies (Fire,Fire,Colorless)

6. SUPPORTED LANGUAGES:
   - en (English), ja (Japanese), zh (Chinese), ko (Korean)
   - de (German), es (Spanish), fr (French), it (Italian)

7. IMPORT MODES:
   - Add New: Only create cards that don't exist
   - Update Existing: Only update cards that already exist
   - Merge: Create new + update existing (recommended)

8. TIPS:
   - Keep Card IDs consistent across imports
   - Use XXX/YYY format for card numbers (e.g., 025/165)
   - Don't delete the header row
   - Save as UTF-8 encoded CSV
   - Test with a few cards first

9. AFTER IMPORT:
   - Check the import summary for errors
   - Verify cards in the Card Browser
   - Fix any issues manually if needed

For more help, see the admin dashboard documentation.
`;
};

module.exports = {
  generateCSVTemplate,
  generateInstructions
};










