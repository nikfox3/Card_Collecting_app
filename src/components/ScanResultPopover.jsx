import React from 'react';

/**
 * Popover notification shown after auto-adding a card to collection
 * Displays card info and provides options to edit or review matches
 */
const ScanResultPopover = ({ 
  card, 
  collectionName, 
  onEdit, 
  onReviewMatches, 
  onDismiss,
  isVisible 
}) => {
  if (!isVisible || !card) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center pointer-events-none">
      <div className="w-full max-w-md mx-4 mb-8 pointer-events-auto">
        <div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
          style={{
            animation: 'slideUp 0.3s ease-out',
            transform: 'translateY(0)'
          }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">Card Added</h3>
                  <p className="text-blue-100 text-sm">Added to {collectionName}</p>
                </div>
              </div>
              <button
                onClick={onDismiss}
                className="text-white/80 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Card Info */}
          <div className="px-6 py-4">
            <div className="flex items-start gap-4">
              {card.images?.small && (
                <img 
                  src={card.images.small} 
                  alt={card.name}
                  className="w-20 h-28 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="text-gray-900 dark:text-white font-semibold text-base mb-1 truncate">
                  {(() => {
                    const rawName = card.name || card.cleanName || '';
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
                </h4>
                {card.set_name && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
                    {card.set_name}
                  </p>
                )}
                {card.ext_number && (
                  <p className="text-gray-500 dark:text-gray-500 text-xs">
                    #{card.ext_number}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="px-6 pb-4 flex gap-3">
            <button
              onClick={onEdit}
              className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Card
            </button>
            <button
              onClick={onReviewMatches}
              className="flex-1 px-4 py-2.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Review Matches
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScanResultPopover;

