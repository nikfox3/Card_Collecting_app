import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { admin } from '../utils/api';

// Energy symbol component
function EnergySymbol({ type, size = "w-6 h-6" }) {
  const getEnergySvg = (type) => {
    const svgMap = {
      'Grass': '/Assets/Energies/Grass.svg',
      'Fire': '/Assets/Energies/Fire.svg',
      'Water': '/Assets/Energies/Water.svg',
      'Lightning': '/Assets/Energies/Electric.svg',
      'Electric': '/Assets/Energies/Electric.svg', // Handle both names
      'Psychic': '/Assets/Energies/Psychic.svg',
      'Fighting': '/Assets/Energies/Fighting.svg',
      'Darkness': '/Assets/Energies/Darkness.svg',
      'Metal': '/Assets/Energies/Metal.svg',
      'Fairy': '/Assets/Energies/Fairy.svg',
      'Dragon': '/Assets/Energies/Dragon.svg',
      'Colorless': '/Assets/Energies/Colorless.svg'
    };
    
    return svgMap[type] || '/Assets/Energies/Colorless.svg';
  };

  return (
    <div className={`${size} flex items-center justify-center`}>
      <img 
        src={getEnergySvg(type)} 
        alt={type} 
        className="w-full h-full object-contain"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        onError={(e) => {
          console.log('Failed to load energy symbol for:', type, 'Path:', getEnergySvg(type));
          e.target.style.display = 'none';
        }}
      />
    </div>
  );
}

export default function CardEditorFull() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [card, setCard] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [productType, setProductType] = useState('card'); // 'card', 'sealed', 'code'
  const [activeTab, setActiveTab] = useState('basic'); // basic, game, pricing, images
  const [enlargedImage, setEnlargedImage] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('Holofoil'); // Variant for pricing
  const [availableVariants, setAvailableVariants] = useState([]);

  // Function to navigate back with preserved search state
  const navigateBackWithState = () => {
    const returnParams = searchParams.get('return');
    if (returnParams) {
      navigate(`/cards?${returnParams}`);
    } else {
      navigate('/cards');
    }
  };

  // Function to get higher quality image URL for enlarged view
  const getHighQualityImageUrl = (imageSrc) => {
    if (!imageSrc) return imageSrc;
    
    // If it's a TCGPlayer URL, try to get the high-res version
    if (imageSrc.includes('tcgplayer.com')) {
      return imageSrc.replace('_hq', '_hq').replace('_small', '_hq').replace('_medium', '_hq');
    }
    
    // If it's a TCGdx URL, try to get the high-res version
    if (imageSrc.includes('tcgdx.com')) {
      return imageSrc.replace('/small/', '/large/').replace('/medium/', '/large/');
    }
    
    // Return original if no known pattern
    return imageSrc;
  };


  // Function to parse individual attack text
  const parseAttackText = (attackText) => {
    if (!attackText) return { name: '', damage: '', description: '', energyCost: [] };
    
    // Split by <br> tags to separate name/damage from description
    const parts = attackText.split(/<br\s*\/?>/i);
    const nameAndDamage = parts[0] || '';
    const description = parts.slice(1).join('').trim();
    
    // Extract damage amount (##) from name, handling parentheses
    const damageMatch = nameAndDamage.match(/\((\d+)\)$/);
    const damage = damageMatch ? damageMatch[1] : '';
    let name = damageMatch ? nameAndDamage.replace(/\(\d+\)$/, '').trim() : nameAndDamage.trim();
    
    // Extract energy costs from the name (look for [Energy] patterns)
    const energyCost = [];
    const energyMatches = name.match(/\[([CGWRPLFDM]+)\]/g);
    if (energyMatches) {
      energyMatches.forEach(match => {
        const energyLetters = match.slice(1, -1).split('');
        energyLetters.forEach(letter => {
          const energyMap = {
            'C': 'Colorless', 'G': 'Grass', 'W': 'Water', 'R': 'Fire',
            'L': 'Lightning', 'P': 'Psychic', 'F': 'Fighting', 'D': 'Darkness', 'M': 'Metal'
          };
          if (energyMap[letter]) {
            energyCost.push(energyMap[letter]);
          }
        });
      });
    }
    
    // Remove energy brackets from the name for clean display
    name = name.replace(/\[([CGWRPLFDM]+)\]/g, '').trim();
    
    return { name, damage, description, energyCost };
  };

  useEffect(() => {
    loadCard();
  }, [id]);

  // Load available variants for this card
  useEffect(() => {
    const loadAvailableVariants = async () => {
      if (!card?.product_id) return;
      
      try {
        const response = await fetch(`http://localhost:3002/api/cards/${card.product_id}/variants`);
        if (response.ok) {
          const data = await response.json();
          if (data.variants && data.variants.length > 0) {
            setAvailableVariants(data.variants);
            // Set first variant as selected if not already set
            if (!selectedVariant && data.variants[0]) {
              setSelectedVariant(data.variants[0].name);
            }
          }
        }
      } catch (error) {
        console.error('Error loading variants:', error);
      }
    };
    
    loadAvailableVariants();
  }, [card]);

  // Load pricing data when variant changes
  useEffect(() => {
    if (card && selectedVariant) {
      loadVariantPricing();
    }
  }, [card, selectedVariant]);

  const loadVariantPricing = async () => {
    if (!card?.product_id) return;
    
    try {
      const response = await fetch(`http://localhost:3002/api/cards/${card.product_id}/condition-prices?variant=${selectedVariant}`);
      if (response.ok) {
        const data = await response.json();
        // Update formData with the fetched prices
        if (data.data) {
          const newFormData = { ...formData };
          if (data.data['Near Mint']) newFormData.nm_price = data.data['Near Mint'];
          if (data.data['Lightly Played']) newFormData.lp_price = data.data['Lightly Played'];
          if (data.data['Moderately Played']) newFormData.mp_price = data.data['Moderately Played'];
          if (data.data['Heavily Played']) newFormData.hp_price = data.data['Heavily Played'];
          if (data.data['Damaged']) newFormData.dmg_price = data.data['Damaged'];
          setFormData(newFormData);
        }
      }
    } catch (error) {
      console.error('Error loading variant pricing:', error);
    }
  };

  const loadCard = async () => {
    if (!id) {
      setMessage('No card ID provided');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await admin.getCard(id);
      const cardData = response.data.data;
      setCard(cardData);
      
      // Parse abilities - check database first, then fallback to ext_card_text
      let existingAbilities = [];
      
      // First, try to load from database abilities column
      console.log('🔍 Raw cardData.abilities:', cardData.abilities);
      if (cardData.abilities) {
        try {
          existingAbilities = JSON.parse(cardData.abilities);
          console.log('🔍 Loaded abilities from database:', existingAbilities);
        } catch (error) {
          console.log('🔍 Error parsing abilities from database:', error);
          existingAbilities = [];
        }
      } else {
        console.log('🔍 No abilities field in cardData');
      }
      
      // If no abilities in database, parse from ext_card_text
      if (existingAbilities.length === 0 && cardData.ext_card_text) {
        console.log('🔍 Parsing abilities from ext_card_text:', cardData.ext_card_text);
        // Try to match different ability formats
        let abilityMatch = null;
        let abilityType = '';
        
        // Try Pokémon Power format first
        abilityMatch = cardData.ext_card_text.match(/<strong>Pokémon Power: ([^<]+)<\/strong>(.*)/);
        if (abilityMatch) {
          abilityType = 'Pokémon Power';
        } else {
          // Try Ability format - handle HTML tags and line breaks between </strong> and description
          abilityMatch = cardData.ext_card_text.match(/<strong>Ability — ([^<]+)<\/strong>(?:<[^>]*>|\r?\n)*(.*)/);
          if (abilityMatch) {
            abilityType = 'Ability';
          }
        }
        
        console.log('🔍 Ability match result:', abilityMatch);
        if (abilityMatch) {
          const ability = {
            name: abilityMatch[1].trim(),
            text: abilityMatch[2].replace(/<[^>]+>/g, '').trim(),
            type: abilityType
          };
          console.log('🔍 Created ability object:', ability);
          existingAbilities.push(ability);
        } else {
          console.log('🔍 No ability match found in text:', cardData.ext_card_text);
        }
      }
      
      console.log('🔍 Final existingAbilities array:', existingAbilities);

      // Parse attacks - check database first, then fallback to ext_attack1/2
      let existingAttacks = [];
      
      // First, try to load from database attacks column
      if (cardData.attacks) {
        try {
          existingAttacks = JSON.parse(cardData.attacks);
          console.log('🔍 Loaded attacks from database:', existingAttacks);
        } catch (error) {
          console.log('🔍 Error parsing attacks from database:', error);
          existingAttacks = [];
        }
      }
      
      // If no attacks in database, use parsed attacks from API or parse from ext_attack1 and ext_attack2
      if (existingAttacks.length === 0) {
        // First, check if API already parsed attacks
        if (cardData.attacks && Array.isArray(cardData.attacks) && cardData.attacks.length > 0) {
          existingAttacks = cardData.attacks;
          console.log('🔍 Using parsed attacks from API:', existingAttacks);
        } else {
          // Parse attacks using the same logic as the API
          const parseAttack = (attackText) => {
            if (!attackText) return null;
            
            const parts = attackText.split(/<br\s*\/?>/i);
            const header = parts[0] || '';
            const description = parts.slice(1).join(' ').trim();
            
            const energyCosts = [];
            const energyPattern = /\[([^\]]+)\]/g;
            let match;
            while ((match = energyPattern.exec(header)) !== null) {
              const energyType = match[1].trim();
              const energyMap = {
                'Grass': 'Grass', 'G': 'Grass',
                'Fire': 'Fire', 'R': 'Fire',
                'Water': 'Water', 'W': 'Water',
                'Lightning': 'Lightning', 'L': 'Lightning',
                'Psychic': 'Psychic', 'P': 'Psychic',
                'Fighting': 'Fighting', 'F': 'Fighting',
                'Darkness': 'Darkness', 'D': 'Darkness',
                'Metal': 'Metal', 'M': 'Metal',
                'Colorless': 'Colorless', 'C': 'Colorless',
                'Fairy': 'Fairy', 'Y': 'Fairy',
                'Dragon': 'Dragon'
              };
              const mappedEnergy = energyMap[energyType] || energyType;
              energyCosts.push(mappedEnergy);
            }
            
            const damageMatch = header.match(/\((\d+)\)\s*$/);
            const damage = damageMatch ? damageMatch[1] : '';
            
            let namePart = header.replace(/\[([^\]]+)\]/g, '').trim();
            if (damageMatch) {
              namePart = namePart.replace(/\(\d+\)\s*$/, '').trim();
            }
            const attackName = namePart || 'Unknown Attack';
            
            return {
              name: attackName,
              cost: energyCosts,
              damage: damage,
              text: description
            };
          };
          
          // Parse attack 1
          if (cardData.ext_attack1) {
            console.log('🔍 Parsing attack1:', cardData.ext_attack1);
            const attack1 = parseAttack(cardData.ext_attack1);
            if (attack1) existingAttacks.push(attack1);
          }
          
          // Parse attack 2
          if (cardData.ext_attack2) {
            console.log('🔍 Parsing attack2:', cardData.ext_attack2);
            const attack2 = parseAttack(cardData.ext_attack2);
            if (attack2) existingAttacks.push(attack2);
          }
        }
      }

      const parsed = {
        ...cardData,
        types: parseJSON(cardData.types, []),
        subtypes: parseJSON(cardData.subtypes, []),
        abilities: existingAbilities,
        attacks: existingAttacks,
        ext_hp: cardData.ext_hp || '',
        ext_number: cardData.ext_number || '',
        ext_rarity: cardData.ext_rarity || '',
        ext_card_type: cardData.ext_card_type || '',
        ext_stage: cardData.ext_stage || '',
        release_date: cardData.release_date || '', // Add release_date to form data
        weaknesses: (() => {
          // First try to parse from weaknesses column (JSON)
          const parsed = parseJSON(cardData.weaknesses, []);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          
          // If not found, try to parse from ext_weakness (string)
          if (cardData.ext_weakness) {
            try {
              const extParsed = typeof cardData.ext_weakness === 'string' ? JSON.parse(cardData.ext_weakness) : cardData.ext_weakness;
              if (Array.isArray(extParsed) && extParsed.length > 0) return extParsed;
              if (typeof extParsed === 'object' && extParsed.type) return [extParsed];
              // If it's a plain string like "Water×2", convert to object format
              if (typeof cardData.ext_weakness === 'string') {
                const match = cardData.ext_weakness.match(/^(.+?)(?:[\s×x]*(?:\d+))?$/i);
                if (match) {
                  const type = match[1].trim();
                  const valueMatch = cardData.ext_weakness.match(/[\s×x]*(\d+)/i);
                  const value = valueMatch ? `×${valueMatch[1]}` : '×2';
                  return [{ type, value }];
                }
              }
            } catch (e) {
              // If parsing fails, treat as string
              const weaknessStr = String(cardData.ext_weakness).trim();
              if (weaknessStr) {
                const match = weaknessStr.match(/^(.+?)(?:[\s×x]*(?:\d+))?$/i);
                if (match) {
                  const type = match[1].trim();
                  const valueMatch = weaknessStr.match(/[\s×x]*(\d+)/i);
                  const value = valueMatch ? `×${valueMatch[1]}` : '×2';
                  return [{ type, value }];
                }
              }
            }
          }
          return [];
        })(),
        resistances: (() => {
          // First try to parse from resistances column (JSON)
          const parsed = parseJSON(cardData.resistances, []);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          
          // If not found, try to parse from ext_resistance (string)
          if (cardData.ext_resistance) {
            try {
              const extParsed = typeof cardData.ext_resistance === 'string' ? JSON.parse(cardData.ext_resistance) : cardData.ext_resistance;
              if (Array.isArray(extParsed) && extParsed.length > 0) return extParsed;
              if (typeof extParsed === 'object' && extParsed.type) return [extParsed];
              // If it's a plain string like "Water-20", convert to object format
              if (typeof cardData.ext_resistance === 'string') {
                const resistanceStr = String(cardData.ext_resistance).trim();
                if (resistanceStr && resistanceStr.toLowerCase() !== 'none') {
                  return [{ type: resistanceStr, value: '-20' }];
                }
              }
            } catch (e) {
              // If parsing fails, treat as string
              const resistanceStr = String(cardData.ext_resistance).trim();
              if (resistanceStr && resistanceStr.toLowerCase() !== 'none') {
                return [{ type: resistanceStr, value: '-20' }];
              }
            }
          }
          return [];
        })(),
        retreat_cost: (() => {
          // First try to parse from retreat_cost column (JSON array)
          const parsed = parseJSON(cardData.retreat_cost, []);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
          
          // If not found, try to parse from ext_retreat_cost
          if (cardData.ext_retreat_cost) {
            try {
              const extParsed = typeof cardData.ext_retreat_cost === 'string' ? JSON.parse(cardData.ext_retreat_cost) : cardData.ext_retreat_cost;
              if (Array.isArray(extParsed) && extParsed.length > 0) return extParsed;
              // If it's a number, convert to array of Colorless
              const num = typeof extParsed === 'number' ? extParsed : parseInt(cardData.ext_retreat_cost);
              if (!isNaN(num) && num > 0) {
                return Array(num).fill('Colorless');
              }
              // If it's a string that's not a number, treat as single energy type
              if (typeof cardData.ext_retreat_cost === 'string' && cardData.ext_retreat_cost.trim()) {
                return [cardData.ext_retreat_cost.trim()];
              }
            } catch (e) {
              // If parsing fails, try to parse as number
              const num = parseInt(cardData.ext_retreat_cost);
              if (!isNaN(num) && num > 0) {
                return Array(num).fill('Colorless');
              }
            }
          }
          return [];
        })(),
        ext_weakness: cardData.ext_weakness || '',
        ext_resistance: cardData.ext_resistance || '',
        ext_retreat_cost: cardData.ext_retreat_cost || '',
        images: parseJSON(cardData.images, {}),
        tcgplayer: parseJSON(cardData.tcgplayer, {}),
        cardmarket: parseJSON(cardData.cardmarket, {}),
        // Load regulation mark - check ext_regulation first, then regulation, then regulation_mark
        regulation: cardData.ext_regulation || cardData.regulation || cardData.regulation_mark || '',
        // Load legalities - parse if string, otherwise use as-is
        legalities: parseJSON(cardData.legalities, {})
      };
      
      setFormData(parsed);
      
      // Debug: Log the final parsed data
      console.log('🔍 Final parsed data:', {
        abilities: parsed.abilities,
        attacks: parsed.attacks,
        abilities_length: parsed.abilities.length,
        attacks_length: parsed.attacks.length
      });
      
      // Debug: Log abilities and attacks data
      console.log('🔍 Abilities and Attacks loaded:', {
        raw_ext_card_text: cardData.ext_card_text,
        raw_ext_attack1: cardData.ext_attack1,
        raw_ext_attack2: cardData.ext_attack2,
        parsed_abilities: existingAbilities,
        parsed_attacks: existingAttacks,
        abilities_length: existingAbilities.length,
        attacks_length: existingAttacks.length
      });
      
      // Additional debugging for abilities
      if (cardData.ext_card_text) {
        console.log('🔍 Extracting abilities from:', cardData.ext_card_text);
        const testMatch = cardData.ext_card_text.match(/<strong>Pokémon Power: ([^<]+)<\/strong>(.*)/);
        console.log('🔍 Ability match result:', testMatch);
      }
      
      // Debug: Log release date information
      console.log('📅 Card release date loaded:', {
        release_date: cardData.release_date,
        set_name: cardData.set_name,
        group_id: cardData.group_id
      });
      
      // Detect product type based on card data
      console.log('Card data for detection:', {
        name: cardData.name,
        supertype: cardData.supertype,
        ext_rarity: cardData.ext_rarity,
        ext_card_type: cardData.ext_card_type
      });
      
      if (cardData.name?.toLowerCase().includes('code') || 
          cardData.ext_rarity?.toLowerCase().includes('code') ||
          cardData.ext_card_type?.toLowerCase().includes('code')) {
        setProductType('code');
      } else if (cardData.name?.toLowerCase().includes('booster') ||
                 cardData.name?.toLowerCase().includes('pack') ||
                 cardData.name?.toLowerCase().includes('box') ||
                 cardData.name?.toLowerCase().includes('collection') ||
                 cardData.name?.toLowerCase().includes('etb') ||
                 cardData.name?.toLowerCase().includes('tin') ||
                 cardData.name?.toLowerCase().includes('elite') ||
                 cardData.name?.toLowerCase().includes('premium')) {
        setProductType('sealed');
      } else {
        setProductType('card');
      }
    } catch (error) {
      console.error('Error loading card:', error);
      setMessage('Error loading card');
    } finally {
      setLoading(false);
    }
  };

  const parseJSON = (value, defaultValue) => {
    if (!value) return defaultValue;
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        let parsed = JSON.parse(value);
        // Handle double-encoded JSON (JSON string within JSON string)
        if (typeof parsed === 'string') {
          parsed = JSON.parse(parsed);
        }
        // Ensure arrays are actually arrays
        if (Array.isArray(defaultValue) && !Array.isArray(parsed)) {
          return defaultValue;
        }
        return parsed;
      } catch {
        return defaultValue;
      }
    }
    return defaultValue;
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      // Prepare data for saving - only send TCGCSV compatible fields
      const dataToSave = {
        name: formData.name || '',
        artist: formData.artist || '',
        ext_rarity: formData.ext_rarity || '',
        market_price: formData.market_price || 0,
        ext_hp: formData.ext_hp || '',
        ext_card_type: formData.ext_card_type || '',
        ext_number: formData.ext_number || '',
        ext_card_text: formData.ext_card_text || '',
        ext_weakness: formData.weaknesses && Array.isArray(formData.weaknesses) && formData.weaknesses.length > 0 
          ? JSON.stringify(formData.weaknesses) 
          : (formData.ext_weakness || ''),
        ext_resistance: formData.resistances && Array.isArray(formData.resistances) && formData.resistances.length > 0 
          ? JSON.stringify(formData.resistances) 
          : (formData.ext_resistance || ''),
        ext_retreat_cost: formData.ext_retreat_cost || '',
        image_url: formData.image_url || '',
        ext_stage: formData.ext_stage || '',
        sub_type_name: formData.sub_type_name || '',
        // Save regulation mark
        ext_regulation: formData.regulation || '',
        // Save legalities as JSON string
        legalities: formData.legalities && typeof formData.legalities === 'object' 
          ? JSON.stringify(formData.legalities) 
          : (formData.legalities || ''),
        // Save abilities and attacks as JSON strings
        abilities: JSON.stringify(formData.abilities || []),
        attacks: JSON.stringify(formData.attacks || [])
      };
      
      console.log('💾 Saving card:', id);
      console.log('📦 Data to save:', dataToSave);
      console.log('📅 Release date in form data:', formData.release_date);
      console.log('🔍 Abilities being saved:', formData.abilities);
      console.log('🔍 Attacks being saved:', formData.attacks);
      
      const response = await admin.updateCard(id, dataToSave);
      console.log('✅ Server response:', response);
      
      // Handle release date separately since it's stored in groups table
      if (formData.release_date) {
        console.log('📅 Updating release date:', formData.release_date);
        try {
          // Get the card's group_id first
          const cardData = await admin.getCard(id);
          if (cardData && cardData.group_id) {
            console.log('🏷️ Updating group release date for group_id:', cardData.group_id);
            await admin.updateGroupsReleaseDate([cardData.group_id], formData.release_date);
            console.log('✅ Release date updated successfully');
          } else {
            console.log('⚠️ No group_id found for card, skipping release date update');
          }
        } catch (releaseDateError) {
          console.error('❌ Error updating release date:', releaseDateError);
          setMessage('✅ Card updated, but release date update failed: ' + releaseDateError.message);
          return;
        }
      }
      
      setMessage('✅ Card updated successfully!');
      
      // If release date was updated, trigger a refresh of the parent component
      if (formData.release_date) {
        // Notify parent component to refresh data
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({ type: 'CARD_UPDATED', cardId: id }, '*');
        }
        // Also trigger a page refresh after a short delay to show updated data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
      
      // Don't navigate away - keep the modal open and maintain search position
    } catch (error) {
      console.error('❌ Error saving card:', error);
      console.error('📋 Error details:', error.response?.data);
      setMessage('❌ Error saving card: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const updateArrayField = (field, index, value) => {
    const newArray = [...(formData[field] || [])];
    newArray[index] = value;
    updateField(field, newArray);
  };

  const addToArray = (field, defaultValue = '') => {
    updateField(field, [...(formData[field] || []), defaultValue]);
  };

  const removeFromArray = (field, index) => {
    const newArray = [...(formData[field] || [])];
    newArray.splice(index, 1);
    updateField(field, newArray);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-white text-xl">Loading card...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="text-center py-12">
        <div className="text-white text-xl mb-4">Card not found</div>
        <button
          onClick={navigateBackWithState}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Back to Cards
        </button>
      </div>
    );
  }

  // Get image URL (prioritize TCGCSV image_url, then fall back to images object)
  let imageUrl = formData.image_url || formData.images?.high || formData.images?.low || formData.images?.large || formData.images?.small || '';
  // Don't generate fallback URLs from set_id/number as they often don't exist
  // The database should contain working image URLs from tcgdx.net

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Card</h1>
          <p className="text-slate-400">{card.clean_name || card.name} • {card.set_name || card.clean_set_name} • #{card.ext_number || card.number}</p>
        </div>
        <button
          onClick={navigateBackWithState}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          ← Back to Browser
        </button>
      </div>

      {/* Product Type Selector */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Product Type</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setProductType('card')}
            className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${
              productType === 'card'
                ? 'bg-blue-500 text-white shadow-lg scale-105'
                : 'bg-slate-900/50 text-slate-300 hover:bg-slate-900/70'
            }`}
          >
            🃏 Individual Card
          </button>
          <button
            onClick={() => setProductType('sealed')}
            className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${
              productType === 'sealed'
                ? 'bg-purple-500 text-white shadow-lg scale-105'
                : 'bg-slate-900/50 text-slate-300 hover:bg-slate-900/70'
            }`}
          >
            📦 Sealed Product
          </button>
          <button
            onClick={() => setProductType('code')}
            className={`flex-1 px-6 py-4 rounded-xl font-medium transition-all ${
              productType === 'code'
                ? 'bg-green-500 text-white shadow-lg scale-105'
                : 'bg-slate-900/50 text-slate-300 hover:bg-slate-900/70'
            }`}
          >
            🎫 Code Card
          </button>
        </div>
        <p className="text-slate-400 text-sm mt-3">
          {productType === 'card' 
            ? 'Individual card entry (Pokémon, Trainer, Energy)' 
            : productType === 'sealed'
            ? 'Sealed product (Booster Pack, ETB, Booster Box, etc.)'
            : 'Code card (TCG Live codes, digital rewards, etc.)'}
        </p>
        <p className="text-slate-500 text-xs mt-2">
          Current type: {productType} | Card: {card?.name} | Rarity: {card?.ext_rarity}
        </p>
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('✅') 
            ? 'bg-green-500/10 border border-green-500/50 text-green-400' 
            : 'bg-red-500/10 border border-red-500/50 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Card Preview - Sticky */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 sticky top-6">
            <h2 className="text-lg font-bold text-white mb-4">Card Preview</h2>
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={card.name}
                className="w-full rounded-lg shadow-2xl mb-4"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="280"><rect fill="%23334155" width="200" height="280"/><text x="50%" y="50%" text-anchor="middle" fill="%23cbd5e1" font-size="14">No Image</text></svg>';
                }}
              />
            ) : (
              <div className="aspect-[3/4] bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                <span className="text-slate-500">No image</span>
              </div>
            )}
            
            {/* Quick Info */}
            <div className="space-y-2 text-sm border-t border-slate-700 pt-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Product ID:</span>
                <span className="text-white font-mono text-xs">{card.product_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Card Number:</span>
                <span className="text-white font-mono text-xs">{card.ext_number || card.number || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Set:</span>
                <span className="text-white text-xs">{card.set_name || card.clean_set_name || card.set_id || '—'}</span>
              </div>
              {card.ext_hp && (
                <div className="flex justify-between">
                  <span className="text-slate-400">HP:</span>
                  <span className="text-white font-semibold">{card.ext_hp}</span>
                </div>
              )}
              {card.ext_rarity && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Rarity:</span>
                  <span className="text-white">{card.ext_rarity}</span>
                </div>
              )}
              {card.ext_card_type && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white">{card.ext_card_type}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Artist:</span>
                <span className="text-white text-xs">
                  {card.artist && card.artist.trim() ? 
                    card.artist : 
                    (card.name && (card.name.toLowerCase().includes('box') || 
                                   card.name.toLowerCase().includes('pack') || 
                                   card.name.toLowerCase().includes('bundle') || 
                                   card.name.toLowerCase().includes('tin') || 
                                   card.name.toLowerCase().includes('case') || 
                                   card.name.toLowerCase().includes('collection') || 
                                   card.name.toLowerCase().includes('display') || 
                                   card.name.toLowerCase().includes('elite trainer') || 
                                   card.name.toLowerCase().includes('premium') ||
                                   card.name.toLowerCase().includes('starter') ||
                                   card.name.toLowerCase().includes('theme deck'))) ? 
                      'N/A' : 
                      '—'
                  }
                </span>
              </div>
              {card.market_price > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Price:</span>
                  <span className="text-green-400 font-semibold">${card.market_price.toFixed(2)}</span>
                </div>
              )}
              {card.release_date && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Released:</span>
                  <span className="text-white text-xs">{card.release_date}</span>
                </div>
              )}
            </div>

            {/* Abilities Preview */}
            {Array.isArray(formData.abilities) && formData.abilities.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-3">Abilities</h3>
                <div className="space-y-3">
                  {formData.abilities.map((ability, index) => (
                    <div key={index} className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-400 text-xs font-medium">{ability.type}</span>
                        <span className="text-white text-sm font-bold">{ability.name}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed">
                        {ability.text || ability.effect || ability.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attacks Preview */}
            {Array.isArray(formData.attacks) && formData.attacks.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-700">
                <h3 className="text-sm font-semibold text-white mb-3">Attacks</h3>
                <div className="space-y-3">
                  {formData.attacks.map((attack, index) => (
                    <div key={index} className="bg-slate-900/50 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        {Array.isArray(attack.cost) && attack.cost.length > 0 && (
                          <div className="flex gap-1">
                            {attack.cost.map((energy, i) => (
                              <EnergySymbol key={i} type={energy} size="w-4 h-4" />
                            ))}
                          </div>
                        )}
                        <span className="text-white text-sm font-bold">{attack.name}</span>
                        {attack.damage && (
                          <span className="text-yellow-400 text-sm font-bold ml-auto">{attack.damage}</span>
                        )}
                      </div>
                      {attack.text && (
                        <p className="text-slate-300 text-xs leading-relaxed">
                          {attack.text}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form - 3 columns */}
        <div className="lg:col-span-3 space-y-6">
          {/* Tab Navigation */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-1 flex gap-1">
            {[
              { id: 'basic', label: 'Basic Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'game', label: 'Game Data', icon: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z' },
              { id: 'pricing', label: 'Pricing', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'images', label: 'Images', icon: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              {/* Core Details */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Core Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Card Name</label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => updateField('name', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Supertype</label>
                    <select
                      value={formData.supertype || ''}
                      onChange={(e) => updateField('supertype', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Pokémon">Pokémon</option>
                      <option value="Trainer">Trainer</option>
                      <option value="Energy">Energy</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Card Type</label>
                    <input
                      type="text"
                      value={formData.ext_card_type || ''}
                      onChange={(e) => updateField('ext_card_type', e.target.value)}
                      placeholder="e.g., Stage 2, Item, Basic Energy"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Stage</label>
                    <input
                      type="text"
                      value={formData.ext_stage || ''}
                      onChange={(e) => updateField('ext_stage', e.target.value)}
                      placeholder="e.g., Basic, Stage 1, Stage 2"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">HP</label>
                    <input
                      type="text"
                      value={formData.ext_hp || formData.hp || ''}
                      onChange={(e) => updateField('ext_hp', e.target.value)}
                      placeholder="e.g., 120"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Card Number</label>
                    <input
                      type="text"
                      value={formData.ext_number || formData.number || ''}
                      onChange={(e) => updateField('ext_number', e.target.value)}
                      placeholder="e.g., 025/165"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Rarity</label>
                    <input
                      type="text"
                      value={formData.ext_rarity || formData.rarity || ''}
                      onChange={(e) => updateField('ext_rarity', e.target.value)}
                      placeholder="e.g., Rare Holo"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Artist</label>
                    <input
                      type="text"
                      value={formData.artist || ''}
                      onChange={(e) => updateField('artist', e.target.value)}
                      placeholder="e.g., Ken Sugimori"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Evolves From</label>
                    <input
                      type="text"
                      value={formData.evolves_from || ''}
                      onChange={(e) => updateField('evolves_from', e.target.value)}
                      placeholder="e.g., Charmeleon"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
                    <input
                      type="text"
                      value={formData.level || ''}
                      onChange={(e) => updateField('level', e.target.value)}
                      placeholder="e.g., 76"
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Release Date</label>
                    <input
                      type="date"
                      value={formData.release_date || ''}
                      onChange={(e) => {
                        console.log('📅 Individual card date input changed:', e.target.value);
                        console.log('📅 Individual card date input type:', typeof e.target.value);
                        updateField('release_date', e.target.value);
                      }}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Types */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Types & Subtypes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Energy Types</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(formData.types) && formData.types.map((type, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-lg">
                          <EnergySymbol type={type} size="w-5 h-5" />
                          <span className="text-white text-sm">{type}</span>
                          <button onClick={() => removeFromArray('types', index)} className="text-red-400 hover:text-red-300">×</button>
                        </div>
                      ))}
                    </div>
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          addToArray('types', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full mt-2 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Add type...</option>
                      <option value="Fire">Fire</option>
                      <option value="Water">Water</option>
                      <option value="Grass">Grass</option>
                      <option value="Lightning">Lightning</option>
                      <option value="Psychic">Psychic</option>
                      <option value="Fighting">Fighting</option>
                      <option value="Darkness">Darkness</option>
                      <option value="Metal">Metal</option>
                      <option value="Dragon">Dragon</option>
                      <option value="Fairy">Fairy</option>
                      <option value="Colorless">Colorless</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Subtypes</label>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(formData.subtypes) && formData.subtypes.map((subtype, index) => (
                        <span key={index} className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-sm flex items-center gap-2">
                          {subtype}
                          <button onClick={() => removeFromArray('subtypes', index)} className="text-purple-400 hover:text-red-400">×</button>
                        </span>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Add subtype and press Enter"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          addToArray('subtypes', e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full mt-2 px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-slate-500 mt-1">Examples: Stage 2, VMAX, GX, V, ex</p>
                  </div>
                </div>
              </div>

              {/* Format & Regulation */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Format & Legality</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Regulation Mark</label>
                    <select
                      value={formData.regulation || ''}
                      onChange={(e) => updateField('regulation', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">None</option>
                      {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'].map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
                    <select
                      value={formData.format || ''}
                      onChange={(e) => updateField('format', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select...</option>
                      <option value="Standard">Standard</option>
                      <option value="Expanded">Expanded</option>
                      <option value="Unlimited">Unlimited</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Language</label>
                    <select
                      value={formData.language || 'en'}
                      onChange={(e) => updateField('language', e.target.value)}
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="en">English</option>
                      <option value="ja">Japanese</option>
                      <option value="zh">Chinese</option>
                      <option value="ko">Korean</option>
                      <option value="de">German</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="it">Italian</option>
                    </select>
                  </div>
                </div>
                
                {/* Legalities */}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Legalities</label>
                  <div className="space-y-2">
                    {['unlimited', 'standard', 'expanded'].map((format) => (
                      <div key={format} className="flex items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-slate-300 capitalize">
                          <input
                            type="checkbox"
                            checked={formData.legalities && formData.legalities[format] === 'Legal'}
                            onChange={(e) => {
                              const newLegalities = { ...(formData.legalities || {}) };
                              if (e.target.checked) {
                                newLegalities[format] = 'Legal';
                              } else {
                                newLegalities[format] = 'Illegal';
                              }
                              updateField('legalities', newLegalities);
                            }}
                            className="w-4 h-4 text-blue-600 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                          />
                          {format}
                        </label>
                        {formData.legalities && formData.legalities[format] && (
                          <span className="text-xs text-slate-400">
                            ({formData.legalities[format]})
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">Toggle to set format legality</p>
                </div>
              </div>
            </div>
          )}

          {/* Game Data Tab */}
          {activeTab === 'game' && (
            <div className="space-y-6">
              {/* Abilities */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Abilities</h2>
                  <button
                    onClick={() => addToArray('abilities', { name: '', text: '', effect: '', type: 'Ability' })}
                    className="px-3 py-1 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg text-sm"
                  >
                    + Add Ability
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Ability type examples: "Ability", "Pokémon Power", "Ancient Trait", "Poké-Body", etc.
                </p>
                <div className="space-y-4">
                  {Array.isArray(formData.abilities) && formData.abilities.length > 0 ? (
                    formData.abilities.map((ability, index) => {
                      return (
                    <div key={index} className="p-4 bg-slate-900/30 rounded-xl border border-slate-700/50">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          <input
                            type="text"
                            value={ability.type || 'Ability'}
                            onChange={(e) => {
                              const newAbilities = [...formData.abilities];
                              newAbilities[index].type = e.target.value;
                              updateField('abilities', newAbilities);
                            }}
                            placeholder="Ability type"
                            className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-sm font-medium border border-red-500/30 focus:outline-none focus:ring-2 focus:ring-red-500"
                          />
                        </div>
                        <div className="flex-1 space-y-3">
                          <input
                            type="text"
                            value={ability.name || ''}
                            onChange={(e) => {
                              const newAbilities = [...formData.abilities];
                              newAbilities[index].name = e.target.value;
                              updateField('abilities', newAbilities);
                            }}
                            placeholder="Ability name"
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                          <textarea
                            value={ability.text || ability.effect || ''}
                            onChange={(e) => {
                              const newAbilities = [...formData.abilities];
                              // Update both text and effect to maintain compatibility
                              newAbilities[index].text = e.target.value;
                              newAbilities[index].effect = e.target.value;
                              updateField('abilities', newAbilities);
                            }}
                            placeholder="Ability description"
                            rows={3}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <button
                          onClick={() => removeFromArray('abilities', index)}
                          className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    );
                    })
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <p>No abilities found for this card.</p>
                      <p className="text-sm mt-1">Click "+ Add Ability" to add one.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Attacks */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Attacks</h2>
                  <button
                    onClick={() => addToArray('attacks', { name: '', cost: [], damage: '', text: '', effect: '' })}
                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm"
                  >
                    + Add Attack
                  </button>
                </div>

                <div className="space-y-6">
                  {Array.isArray(formData.attacks) && formData.attacks.map((attack, index) => (
                    <div key={index} className="p-6 bg-slate-900/30 rounded-xl border border-slate-700/50">
                      <div className="border-b border-slate-700/50 mb-4"></div>
                      <div className="flex items-start gap-4">
                        {/* Energy Cost Display & Selection */}
                        <div className="flex-shrink-0 w-48">
                          <label className="block text-xs text-slate-400 mb-2">Energy Cost</label>
                          
                          {/* Current Energy Display */}
                          <div className="flex gap-1 mb-3 flex-wrap">
                            {Array.isArray(attack.cost) && attack.cost.length > 0 ? (
                              attack.cost.map((energy, i) => (
                                <div key={i} className="flex items-center gap-1">
                                  <EnergySymbol type={energy} size="w-6 h-6" />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newAttacks = [...formData.attacks];
                                      const currentCost = [...newAttacks[index].cost];
                                      currentCost.splice(i, 1);
                                      newAttacks[index].cost = currentCost;
                                      updateField('attacks', newAttacks);
                                    }}
                                    className="text-red-400 hover:text-red-300 text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))
                            ) : (
                              <div className="text-slate-500 text-xs">No energy cost</div>
                            )}
                          </div>
                          
                          {/* Energy Selection Buttons */}
                          <div className="space-y-2">
                            <div className="text-xs text-slate-400 mb-1">Add Energy:</div>
                            <div className="flex flex-wrap gap-1">
                              {['Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'].map((energy) => (
                                <button
                                  key={energy}
                                  type="button"
                                  onClick={() => {
                                    const newAttacks = [...formData.attacks];
                                    const currentCost = Array.isArray(newAttacks[index].cost) ? newAttacks[index].cost : [];
                                    newAttacks[index].cost = [...currentCost, energy];
                                    updateField('attacks', newAttacks);
                                  }}
                                  className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded border border-slate-600 transition-colors"
                                >
                                  + {energy}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Attack Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={attack.name || ''}
                              onChange={(e) => {
                                const newAttacks = [...formData.attacks];
                                newAttacks[index].name = e.target.value;
                                updateField('attacks', newAttacks);
                              }}
                              placeholder="Attack name"
                              className="flex-1 mr-3 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={attack.damage || ''}
                              onChange={(e) => {
                                const newAttacks = [...formData.attacks];
                                newAttacks[index].damage = e.target.value;
                                updateField('attacks', newAttacks);
                              }}
                              placeholder="Damage"
                              className="w-20 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                              onClick={() => removeFromArray('attacks', index)}
                              className="ml-2 px-3 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                          <textarea
                            value={attack.text || attack.effect || ''}
                            onChange={(e) => {
                              const newAttacks = [...formData.attacks];
                              // Update both text and effect to maintain compatibility
                              newAttacks[index].text = e.target.value;
                              newAttacks[index].effect = e.target.value;
                              updateField('attacks', newAttacks);
                            }}
                            placeholder="Attack description or effect"
                            rows={2}
                            className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weakness, Resistance, Retreat */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="border-b border-slate-700/50 mb-4"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Weaknesses */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Weakness</label>
                    <div className="space-y-3">
                      {Array.isArray(formData.weaknesses) && formData.weaknesses.map((weakness, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <EnergySymbol type={weakness.type} size="w-6 h-6" />
                          <input
                            type="text"
                            value={weakness.type || ''}
                            onChange={(e) => {
                              const newWeaknesses = [...formData.weaknesses];
                              newWeaknesses[index].type = e.target.value;
                              updateField('weaknesses', newWeaknesses);
                            }}
                            placeholder="Type"
                            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={weakness.value || ''}
                            onChange={(e) => {
                              const newWeaknesses = [...formData.weaknesses];
                              newWeaknesses[index].value = e.target.value;
                              updateField('weaknesses', newWeaknesses);
                            }}
                            placeholder="Value"
                            className="w-20 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => removeFromArray('weaknesses', index)}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addToArray('weaknesses', { type: '', value: '' })}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        + Add Weakness
                      </button>
                    </div>
                  </div>

                  {/* Resistances */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Resistance</label>
                    <div className="space-y-3">
                      {Array.isArray(formData.resistances) && formData.resistances.map((resistance, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <EnergySymbol type={resistance.type} size="w-6 h-6" />
                          <input
                            type="text"
                            value={resistance.type || ''}
                            onChange={(e) => {
                              const newResistances = [...formData.resistances];
                              newResistances[index].type = e.target.value;
                              updateField('resistances', newResistances);
                            }}
                            placeholder="Type"
                            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="text"
                            value={resistance.value || ''}
                            onChange={(e) => {
                              const newResistances = [...formData.resistances];
                              newResistances[index].value = e.target.value;
                              updateField('resistances', newResistances);
                            }}
                            placeholder="Value"
                            className="w-20 px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => removeFromArray('resistances', index)}
                            className="px-2 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={() => addToArray('resistances', { type: '', value: '' })}
                        className="text-sm text-blue-400 hover:text-blue-300"
                      >
                        + Add Resistance
                      </button>
                    </div>
                  </div>

                  {/* Retreat Cost */}
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-3">Retreat Cost</label>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {Array.isArray(formData.retreat_cost) && formData.retreat_cost.map((cost, index) => (
                        <div key={index} className="flex items-center gap-2 px-3 py-1 bg-slate-700/50 rounded-lg">
                          <EnergySymbol type={cost} size="w-5 h-5" />
                          <span className="text-white text-sm">{cost}</span>
                          <button onClick={() => removeFromArray('retreat_cost', index)} className="text-orange-400 hover:text-red-400">×</button>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => addToArray('retreat_cost', 'Colorless')}
                      className="text-sm text-blue-400 hover:text-blue-300"
                    >
                      + Add Colorless
                    </button>
                    <div className="text-xs text-slate-500 mt-2">
                      Total: {formData.retreat_cost?.length || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Pricing Tab */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              {/* Variant Selector */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Select Variant</h2>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-slate-300 mb-2">Variant Type</label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => {
                      setSelectedVariant(e.target.value);
                      // Will trigger useEffect to reload pricing
                    }}
                    className="w-full px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    {availableVariants.map(variant => (
                      <option key={variant.name} value={variant.name}>
                        {variant.name} {variant.price ? `($${variant.price.toFixed(2)})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400 mt-2">
                    Select the variant type to edit its pricing. Each variant can have different condition and graded pricing.
                  </p>
                </div>
              </div>

              {/* Condition-Specific Pricing */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">
                  Condition-Specific Pricing - {selectedVariant}
                </h2>
                <div className="space-y-4">
                  {[
                    { key: 'nm_price', label: 'Near Mint', description: 'Perfect condition, no wear' },
                    { key: 'lp_price', label: 'Lightly Played', description: 'Minor wear, slight edge wear' },
                    { key: 'mp_price', label: 'Moderately Played', description: 'Noticeable wear, some creases' },
                    { key: 'hp_price', label: 'Heavily Played', description: 'Significant wear, multiple creases' },
                    { key: 'dmg_price', label: 'Damaged', description: 'Major damage, holes, tears' }
                  ].map((condition) => (
                    <div key={condition.key} className="grid grid-cols-3 gap-4 items-center">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-1">{condition.label}</label>
                        <p className="text-xs text-slate-400">{condition.description}</p>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={formData[condition.key] || ''}
                          onChange={(e) => updateField(condition.key, parseFloat(e.target.value) || null)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="text-xs text-slate-400">
                        {formData[condition.key] ? `$${formData[condition.key].toFixed(2)}` : 'No price set'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graded Card Pricing */}
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <h2 className="text-lg font-bold text-white mb-4">Graded Card Pricing</h2>
                <div className="space-y-4">
                  {[
                    { service: 'PSA', grades: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'] },
                    { service: 'BGS', grades: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1'] },
                    { service: 'CGC', grades: ['10', '9.5', '9', '8.5', '8', '7.5', '7', '6.5', '6', '5.5', '5', '4.5', '4', '3.5', '3', '2.5', '2', '1.5', '1'] }
                  ].map((gradingService) => (
                    <div key={gradingService.service} className="bg-slate-700/50 rounded-lg p-4">
                      <h3 className="text-white font-medium mb-3">{gradingService.service} Graded</h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {gradingService.grades.map((grade) => (
                          <div key={`${gradingService.service}-${grade}`} className="bg-slate-600/50 rounded p-3">
                            <div className="text-center">
                              <div className="text-white text-sm font-medium mb-1">
                                {gradingService.service} {grade}
                              </div>
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  value={formData.graded_prices?.[gradingService.service]?.[grade] || ''}
                                  onChange={(e) => {
                                    const newGraded = { ...formData.graded_prices };
                                    if (!newGraded[gradingService.service]) newGraded[gradingService.service] = {};
                                    newGraded[gradingService.service][grade] = parseFloat(e.target.value) || null;
                                    updateField('graded_prices', newGraded);
                                  }}
                                  placeholder="0.00"
                                  className="w-full pl-6 pr-2 py-1 bg-slate-700/50 border border-slate-500/50 rounded text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-white">Card Images</h2>
                  <button
                    onClick={() => {
                      // Don't auto-generate image URLs as they often don't exist
                      // Users should manually enter correct URLs from tcgdx.net or other sources
                    }}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-sm font-medium rounded-lg transition-colors"
                  >
                    🔄 Auto-Generate URLs
                  </button>
                </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">TCGCSV Image URL</label>
                      <input
                        type="text"
                        value={formData.image_url || ''}
                        onChange={(e) => updateField('image_url', e.target.value)}
                        placeholder="https://product-images.tcgplayer.com/..."
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Small Image URL</label>
                    <input
                      type="text"
                      value={formData.images?.small || ''}
                      onChange={(e) => {
                        const newImages = { ...formData.images, small: e.target.value };
                        updateField('images', newImages);
                      }}
                      placeholder="https://images.pokemontcg.io/..."
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Large Image URL</label>
                    <input
                      type="text"
                      value={formData.images?.large || ''}
                      onChange={(e) => {
                        const newImages = { ...formData.images, large: e.target.value };
                        updateField('images', newImages);
                      }}
                      placeholder="https://images.pokemontcg.io/..."
                      className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Clickable Card Image */}
                  {imageUrl && (
                    <div className="pt-4 border-t border-slate-700">
                      <h4 className="text-sm font-medium text-slate-300 mb-3">Card Image (Click to Enlarge)</h4>
                      <div className="flex justify-center">
                        <img 
                          src={imageUrl} 
                          alt={card.name || 'Card image'} 
                          className="max-w-sm max-h-[28rem] rounded-lg shadow-lg cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => setEnlargedImage(imageUrl)}
                          onError={(e) => {
                            console.log('Failed to load card image:', imageUrl);
                            e.target.style.display = 'none';
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Image Preview */}
                  {(formData.image_url || formData.images?.small || formData.images?.large) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-700">
                      {formData.image_url && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">TCGCSV Image:</p>
                          <img 
                            src={formData.image_url} 
                            alt="TCGCSV image" 
                            className="w-full rounded-lg"
                            onError={(e) => {
                              console.log('Failed to load TCGCSV image:', formData.image_url);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {formData.images?.small && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Small Preview:</p>
                          <img 
                            src={formData.images.small} 
                            alt="Small preview" 
                            className="w-full rounded-lg"
                            onError={(e) => {
                              console.log('Failed to load small image:', formData.images.small);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                      {formData.images?.large && (
                        <div>
                          <p className="text-xs text-slate-400 mb-2">Large Preview:</p>
                          <img 
                            src={formData.images.large} 
                            alt="Large preview" 
                            className="w-full rounded-lg"
                            onError={(e) => {
                              console.log('Failed to load large image:', formData.images.large);
                              e.target.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Save Actions */}
          <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-700/50 p-6 -mx-6 flex gap-4">
            <button
              onClick={navigateBackWithState}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all shadow-lg"
            >
              {saving ? 'Saving...' : '💾 Save All Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-2"
          onClick={() => setEnlargedImage(null)}
        >
          <div className="relative max-w-[98vw] max-h-[98vh]">
            <button
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={getHighQualityImageUrl(enlargedImage)} 
              alt="Enlarged card" 
              className="max-w-full max-h-[98vh] w-auto h-auto object-contain rounded-lg shadow-2xl"
              style={{ 
                minWidth: '400px',
                minHeight: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}

