import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { admin } from '../utils/api';

export default function CardCreator() {
  const navigate = useNavigate();
  
  const [productType, setProductType] = useState('card'); // 'card' or 'sealed'
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Card form data
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    supertype: 'Pokémon',
    hp: '',
    types: [],
    subtypes: [],
    evolves_from: '',
    attacks: [],
    weaknesses: [],
    resistances: [],
    retreat_cost: [],
    set_id: '',
    number: '',
    artist: '',
    rarity: '',
    regulation: '',
    format: 'Standard',
    language: 'en',
    variant: 'Normal',
    current_value: 0,
    images: { small: '', large: '' },
    tcgplayer: {},
    cardmarket: {}
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      // Validate required fields
      if (!formData.name || !formData.set_id || !formData.number) {
        setMessage('❌ Please fill in required fields: Name, Set ID, and Number');
        return;
      }
      
      // Generate card ID if not provided
      const cardId = formData.id || `${formData.set_id}-${formData.number}`;
      
      // Prepare data for saving (stringify JSON fields)
      const dataToSave = {
        ...formData,
        id: cardId,
        types: JSON.stringify(formData.types || []),
        subtypes: JSON.stringify(formData.subtypes || []),
        attacks: JSON.stringify(formData.attacks || []),
        weaknesses: JSON.stringify(formData.weaknesses || []),
        resistances: JSON.stringify(formData.resistances || []),
        retreat_cost: JSON.stringify(formData.retreat_cost || []),
        images: JSON.stringify(formData.images || {}),
        tcgplayer: JSON.stringify(formData.tcgplayer || {}),
        cardmarket: JSON.stringify(formData.cardmarket || {})
      };
      
      // Call create endpoint
      const response = await fetch('http://localhost:3001/api/admin/cards', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify(dataToSave)
      });
      
      if (!response.ok) throw new Error('Failed to create card');
      
      setMessage('✅ Card created successfully!');
      setTimeout(() => {
        navigate('/cards');
      }, 1500);
    } catch (error) {
      console.error('Error creating card:', error);
      setMessage('❌ Error creating card: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const addToArray = (field, value) => {
    updateField(field, [...(formData[field] || []), value]);
  };

  const removeFromArray = (field, index) => {
    const newArray = [...(formData[field] || [])];
    newArray.splice(index, 1);
    updateField(field, newArray);
  };

  const autoGenerateImages = () => {
    // Don't auto-generate image URLs as they often don't exist
    // Users should manually enter correct URLs from tcgdx.net or other sources
    setMessage('⚠️ Please manually enter correct image URLs from tcgdx.net or other sources');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Card</h1>
          <p className="text-slate-400">Add a new card or sealed product to the database</p>
        </div>
        <button
          onClick={() => navigate('/cards')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          ← Back to Browser
        </button>
      </div>

      {/* Product Type Selector */}
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
        <h2 className="text-lg font-bold text-white mb-4">Product Type</h2>
        <div className="flex gap-4">
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
        </div>
        <p className="text-slate-400 text-sm mt-3">
          {productType === 'card' 
            ? 'Create a new individual card entry (Pokémon, Trainer, Energy)' 
            : 'Create a sealed product (Booster Pack, ETB, Booster Box, etc.)'}
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl ${
          message.includes('✅') ? 'bg-green-500/20 text-green-300' : 
          message.includes('❌') ? 'bg-red-500/20 text-red-300' : 
          'bg-yellow-500/20 text-yellow-300'
        }`}>
          {message}
        </div>
      )}

      {/* Card Form */}
      {productType === 'card' && (
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Card Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Charizard ex"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Set ID *</label>
                <input
                  type="text"
                  value={formData.set_id}
                  onChange={(e) => updateField('set_id', e.target.value)}
                  placeholder="e.g., sv10"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Card Number *</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => updateField('number', e.target.value)}
                  placeholder="e.g., 006/162"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Supertype</label>
                <select
                  value={formData.supertype}
                  onChange={(e) => updateField('supertype', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Pokémon">Pokémon</option>
                  <option value="Trainer">Trainer</option>
                  <option value="Energy">Energy</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">HP</label>
                <input
                  type="text"
                  value={formData.hp}
                  onChange={(e) => updateField('hp', e.target.value)}
                  placeholder="e.g., 310"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Artist</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => updateField('artist', e.target.value)}
                  placeholder="e.g., 5ban Graphics"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rarity</label>
                <select
                  value={formData.rarity}
                  onChange={(e) => updateField('rarity', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Rarity</option>
                  <option value="Common">Common</option>
                  <option value="Uncommon">Uncommon</option>
                  <option value="Rare">Rare</option>
                  <option value="Rare Holo">Rare Holo</option>
                  <option value="Rare Ultra">Rare Ultra</option>
                  <option value="Rare Secret">Rare Secret</option>
                  <option value="Rare Rainbow">Rare Rainbow</option>
                  <option value="Illustration Rare">Illustration Rare</option>
                  <option value="Special Illustration Rare">Special Illustration Rare</option>
                  <option value="Hyper Rare">Hyper Rare</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Regulation Mark</label>
                <select
                  value={formData.regulation}
                  onChange={(e) => updateField('regulation', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
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
            </div>
          </div>

          {/* Image URLs */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Card Images</h2>
              <button
                onClick={autoGenerateImages}
                className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg text-sm font-medium transition-colors"
              >
                🤖 Auto-Generate URLs
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Small Image URL</label>
                <input
                  type="text"
                  value={formData.images.small || ''}
                  onChange={(e) => updateField('images', { ...formData.images, small: e.target.value })}
                  placeholder="https://images.pokemontcg.io/..."
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Large Image URL</label>
                <input
                  type="text"
                  value={formData.images.large || ''}
                  onChange={(e) => updateField('images', { ...formData.images, large: e.target.value })}
                  placeholder="https://images.pokemontcg.io/..._hires.png"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Value (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => updateField('current_value', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sealed Product Form */}
      {productType === 'sealed' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Sealed Product Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Scarlet & Violet Booster Box"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Product Type</label>
                <select
                  value={formData.supertype}
                  onChange={(e) => updateField('supertype', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Booster Pack">Booster Pack</option>
                  <option value="Booster Box">Booster Box</option>
                  <option value="Elite Trainer Box">Elite Trainer Box</option>
                  <option value="Theme Deck">Theme Deck</option>
                  <option value="Collection Box">Collection Box</option>
                  <option value="Tin">Tin</option>
                  <option value="Bundle">Bundle</option>
                  <option value="Special Collection">Special Collection</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Set ID *</label>
                <input
                  type="text"
                  value={formData.set_id}
                  onChange={(e) => updateField('set_id', e.target.value)}
                  placeholder="e.g., sv10"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Product Code</label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) => updateField('number', e.target.value)}
                  placeholder="e.g., ETB-001"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Current Value (USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.current_value}
                  onChange={(e) => updateField('current_value', parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Image URL</label>
                <input
                  type="text"
                  value={formData.images.small || ''}
                  onChange={(e) => updateField('images', { small: e.target.value, large: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white rounded-xl font-medium shadow-lg transition-all duration-200"
        >
          {saving ? 'Creating...' : `✨ Create ${productType === 'card' ? 'Card' : 'Sealed Product'}`}
        </button>
        <button
          onClick={() => navigate('/cards')}
          className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
      
      {/* Helper Text */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <h3 className="text-blue-400 font-medium mb-2">💡 Quick Tips:</h3>
        <ul className="text-slate-300 text-sm space-y-1">
          <li>• Set ID should match the official Pokémon TCG set code (e.g., "sv10" for Destined Rivals)</li>
          <li>• Card Number should be in XXX/YYY format (e.g., "006/162")</li>
          <li>• Use "Auto-Generate URLs" button after filling in Set ID and Number</li>
          <li>• You can add more details by editing the card after creation</li>
        </ul>
      </div>
    </div>
  );
}

