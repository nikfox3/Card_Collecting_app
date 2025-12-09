import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { admin } from '../utils/api';

export default function CardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [card, setCard] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [productType, setProductType] = useState('card'); // 'card', 'sealed', 'code'

  useEffect(() => {
    loadCard();
  }, [id]);

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
      setFormData(cardData);
      
      // Detect product type based on card data
      if (cardData.supertype === 'Trainer' && cardData.name?.toLowerCase().includes('code')) {
        setProductType('code');
      } else if (cardData.supertype === 'Trainer' && (
        cardData.name?.toLowerCase().includes('booster') ||
        cardData.name?.toLowerCase().includes('pack') ||
        cardData.name?.toLowerCase().includes('box') ||
        cardData.name?.toLowerCase().includes('collection') ||
        cardData.name?.toLowerCase().includes('etb') ||
        cardData.name?.toLowerCase().includes('tin')
      )) {
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

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage('');
      
      await admin.updateCard(id, formData);
      setMessage('Card updated successfully!');
      setTimeout(() => {
        navigate('/cards');
      }, 1500);
    } catch (error) {
      console.error('Error saving card:', error);
      setMessage('Error saving card');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
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
          onClick={() => navigate('/cards')}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
        >
          Back to Cards
        </button>
      </div>
    );
  }

  let imageUrl = '';
  try {
    const images = typeof card.images === 'string' ? JSON.parse(card.images) : card.images;
    imageUrl = images?.large || images?.small || '';
  } catch (e) {}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Edit Product</h1>
          <p className="text-slate-400">{card.clean_name || card.cleanName || card.name} • {card.set_name || card.clean_set_name}</p>
        </div>
        <button
          onClick={() => navigate('/cards')}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
        >
          ← Back
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
      </div>

      {/* Success/Error Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.includes('success') 
            ? 'bg-green-500/10 border border-green-500/50 text-green-400' 
            : 'bg-red-500/10 border border-red-500/50 text-red-400'
        }`}>
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Preview */}
        <div className="lg:col-span-1">
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6 sticky top-6">
            <h2 className="text-lg font-bold text-white mb-4">Preview</h2>
            
            {/* Product Type Badge */}
            <div className="mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                productType === 'card' 
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : productType === 'sealed'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-green-500/20 text-green-400 border border-green-500/30'
              }`}>
                {productType === 'card' ? '🃏 Individual Card' : 
                 productType === 'sealed' ? '📦 Sealed Product' : '🎫 Code Card'}
              </span>
            </div>
            
            {imageUrl ? (
              <img 
                src={imageUrl} 
                alt={card.name}
                className="w-full rounded-lg shadow-2xl"
              />
            ) : (
              <div className="aspect-[3/4] bg-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-slate-500">No image</span>
              </div>
            )}
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">ID:</span>
                <span className="text-white font-mono">{card.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Type:</span>
                <span className="text-white">{card.supertype}</span>
              </div>
              {productType === 'sealed' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Product Type:</span>
                  <span className="text-purple-400">Sealed</span>
                </div>
              )}
              {productType === 'code' && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Code Type:</span>
                  <span className="text-green-400">Digital</span>
                </div>
              )}
              {card.current_value > 0 && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Value:</span>
                  <span className="text-green-400 font-semibold">${card.current_value.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {productType === 'card' ? 'Card Name' : productType === 'sealed' ? 'Product Name' : 'Code Name'}
                </label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              {/* Artist field - only for cards */}
              {productType === 'card' && (
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
              )}
              
              {/* Rarity field - only for cards */}
              {productType === 'card' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Rarity</label>
                  <input
                    type="text"
                    value={formData.ext_rarity || ''}
                    onChange={(e) => updateField('ext_rarity', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {/* HP field - only for Pokémon cards */}
              {productType === 'card' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">HP</label>
                  <input
                    type="text"
                    value={formData.ext_hp || ''}
                    onChange={(e) => updateField('ext_hp', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {/* Card Type field - only for cards */}
              {productType === 'card' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Card Type</label>
                  <input
                    type="text"
                    value={formData.ext_card_type || ''}
                    onChange={(e) => updateField('ext_card_type', e.target.value)}
                    placeholder="e.g., Fire, Water, Psychic"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {/* Product Type field - only for sealed products */}
              {productType === 'sealed' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Product Type</label>
                  <select
                    value={formData.ext_card_type || ''}
                    onChange={(e) => updateField('ext_card_type', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Product Type</option>
                    <option value="Booster Pack">Booster Pack</option>
                    <option value="Elite Trainer Box">Elite Trainer Box</option>
                    <option value="Booster Box">Booster Box</option>
                    <option value="Collection Box">Collection Box</option>
                    <option value="Tin">Tin</option>
                    <option value="Bundle">Bundle</option>
                    <option value="Deck">Deck</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
              
              {/* Code Type field - only for code cards */}
              {productType === 'code' && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Code Type</label>
                  <select
                    value={formData.ext_card_type || ''}
                    onChange={(e) => updateField('ext_card_type', e.target.value)}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Code Type</option>
                    <option value="TCG Live Code">TCG Live Code</option>
                    <option value="Online Code">Online Code</option>
                    <option value="Digital Reward">Digital Reward</option>
                    <option value="Promo Code">Promo Code</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {productType === 'card' ? 'Card Number' : productType === 'sealed' ? 'Product Number' : 'Code Number'}
                </label>
                <input
                  type="text"
                  value={formData.ext_number || ''}
                  onChange={(e) => updateField('ext_number', e.target.value)}
                  placeholder={productType === 'card' ? 'e.g., 001/102' : productType === 'sealed' ? 'e.g., PKG-001' : 'e.g., CODE-001'}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Pricing</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Current Value
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.market_price || ''}
                    onChange={(e) => updateField('market_price', parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    TCGPlayer Low
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    TCGPlayer Market
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">
                    TCGPlayer High
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2 text-sm bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Text & Attacks - Only for individual cards */}
          {productType === 'card' && (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">Card Text & Attacks</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Card Text</label>
                <textarea
                  value={formData.ext_card_text || ''}
                  onChange={(e) => updateField('ext_card_text', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Card description text..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Attack 1</label>
                  <textarea
                    value={formData.ext_attack1 || ''}
                    onChange={(e) => updateField('ext_attack1', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First attack description..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Attack 2</label>
                  <textarea
                    value={formData.ext_attack2 || ''}
                    onChange={(e) => updateField('ext_attack2', e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Second attack description..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Weakness</label>
                  <input
                    type="text"
                    value={formData.ext_weakness || ''}
                    onChange={(e) => updateField('ext_weakness', e.target.value)}
                    placeholder="e.g., Fire×2"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Resistance</label>
                  <input
                    type="text"
                    value={formData.ext_resistance || ''}
                    onChange={(e) => updateField('ext_resistance', e.target.value)}
                    placeholder="e.g., Fighting-20"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Retreat Cost</label>
                  <input
                    type="text"
                    value={formData.ext_retreat_cost || ''}
                    onChange={(e) => updateField('ext_retreat_cost', e.target.value)}
                    placeholder="e.g., 2"
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Product Description - Only for sealed products and code cards */}
          {(productType === 'sealed' || productType === 'code') && (
            <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-lg font-bold text-white mb-4">
                {productType === 'sealed' ? 'Product Description' : 'Code Description'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {productType === 'sealed' ? 'Product Description' : 'Code Description'}
                  </label>
                  <textarea
                    value={formData.ext_card_text || ''}
                    onChange={(e) => updateField('ext_card_text', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={productType === 'sealed' ? 'Describe the sealed product contents...' : 'Describe the code card contents...'}
                  />
                </div>
                
                {/* Additional fields for sealed products */}
                {productType === 'sealed' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Pack Count</label>
                      <input
                        type="text"
                        value={formData.ext_hp || ''}
                        onChange={(e) => updateField('ext_hp', e.target.value)}
                        placeholder="e.g., 10 packs"
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Contents</label>
                      <input
                        type="text"
                        value={formData.ext_rarity || ''}
                        onChange={(e) => updateField('ext_rarity', e.target.value)}
                        placeholder="e.g., 10 Booster Packs, 1 Promo Card"
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
                
                {/* Additional fields for code cards */}
                {productType === 'code' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Platform</label>
                      <input
                        type="text"
                        value={formData.ext_hp || ''}
                        onChange={(e) => updateField('ext_hp', e.target.value)}
                        placeholder="e.g., TCG Live, Online"
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Reward Type</label>
                      <input
                        type="text"
                        value={formData.ext_rarity || ''}
                        onChange={(e) => updateField('ext_rarity', e.target.value)}
                        placeholder="e.g., Booster Pack, Promo Card"
                        className="w-full px-4 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              onClick={() => navigate('/cards')}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-700 text-white font-medium rounded-lg transition-all shadow-lg"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




