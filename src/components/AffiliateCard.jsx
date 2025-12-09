import React from 'react';
import { seriesFromSetName, cleanSetName } from '../utils/series';

const AffiliateCard = ({ 
  platform, 
  cardName, 
  setName, 
  rarity, 
  cardNumber, 
  price, 
  cardImage, 
  onClick,
  isAuction = false
}) => {
  const getPlatformLogo = (platform) => {
    const logos = {
      'TCGPlayer': '/Assets/TCGplayer_Logo 1.svg',
      'eBay': '/Assets/EBay_logo 1.svg',
      'Drip.live': '/Assets/Drip.svg',
      'Whatnot': '/Assets/Whatnot-Logo-PNG-Pic 1.png',
      'Fanatics': '/Assets/Fanatics.svg'
    };
    return logos[platform] || '/Assets/TCGplayer_Logo 1.svg';
  };

  const getPlatformColor = (platform) => {
    const colors = {
      'TCGPlayer': 'from-blue-500/20 to-blue-600/20 border-blue-400/30',
      'eBay': 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30',
      'Drip.live': 'from-purple-500/20 to-pink-500/20 border-purple-400/30',
      'Whatnot': 'from-green-500/20 to-emerald-500/20 border-green-400/30',
      'Fanatics': 'from-red-500/20 to-pink-500/20 border-red-400/30'
    };
    return colors[platform] || 'from-blue-500/20 to-blue-600/20 border-blue-400/30';
  };

  const displaySet = cleanSetName(setName);
  const series = seriesFromSetName(setName);

  return (
    <div 
      className="bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-xl hover:border-white/20 transition-all duration-300 cursor-pointer group"
      onClick={onClick}
    >
      {/* Card Image */}
      <div className="aspect-[3/4] bg-white/5 backdrop-blur-sm rounded-lg mb-3 flex items-center justify-center overflow-hidden relative border border-white/10">
        {cardImage ? (
          <img 
            src={cardImage} 
            alt={cardName} 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-xs">No Image</span>
          </div>
        )}
        
        {/* Platform Logo Overlay */}
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg p-1.5">
          <img 
            src={getPlatformLogo(platform)} 
            alt={platform}
            className="w-6 h-auto max-w-[24px]"
          />
        </div>

        {/* Auction Indicator */}
        {isAuction && (
          <div className="absolute top-2 left-2 bg-red-500/90 backdrop-blur-sm rounded-lg px-2 py-1">
            <span className="text-white text-xs font-medium">Auction</span>
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="space-y-1">
        <h3 className="dark:text-white text-theme-primary font-medium text-sm mb-1 line-clamp-2 leading-tight">
          {(() => {
            const rawName = (cardName || '').toString();
            return rawName
              .replace(/\s*\([^)]*Exclusive[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Exclusive[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Staff[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Staff[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Prerelease[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Prerelease[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Build-A-Bear[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Build-A-Bear[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Workshop[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Workshop[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Kit[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Kit[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Deck[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Deck[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Special[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Special[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Promo[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Promo[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Edition[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Edition[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Variant[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Variant[^\]]*\]\s*/gi, '')
              .replace(/\s*\([^)]*Version[^)]*\)\s*/gi, '')
              .replace(/\s*\[[^\]]*Version[^\]]*\]\s*/gi, '')
              .replace(/\s*-\s*\d{1,4}\/?\d*\s*$/, '')
              .replace(/\s*-\s*\d{1,4}\/?\d*\s*(?=[(\[])/i, '')
              .replace(/\s+\d{1,4}\/?\d*\s*$/, '')
              .replace(/\s*\(\d{1,4}\)\s*$/, '')
              .replace(/\s*\[\d{1,4}\]\s*$/, '')
              .replace(/\s*\(\d{1,4}\)\s*(?=[(\[])/i, '')
              .replace(/\s*\[\d{1,4}\]\s*(?=[(\[])/i, '')
              .trim();
          })()}
        </h3>
        <p className="dark:text-gray-400 text-theme-secondary text-xs mb-1">{displaySet}</p>
        <p className="dark:text-gray-400 text-theme-secondary text-xs mb-2">{series || cardNumber || '—'}</p>
        
        {/* Price */}
        <div className="flex items-center justify-start">
          <p className="text-blue-300 font-bold text-sm">{price}</p>
        </div>
      </div>
    </div>
  );
};

export default AffiliateCard;
