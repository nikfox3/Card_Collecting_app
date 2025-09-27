import React, { useState, useRef } from 'react'

const HolographicCard = ({ 
  src, 
  alt, 
  className = '', 
  onClick, 
  enableGyroscope = true,
  enableHolographic = true,
  cardRarity = 'common',
  showExpandedOverlay = false,
  onExpandedClick
}) => {
  const [showExpanded, setShowExpanded] = useState(false)
  const cardRef = useRef(null)

  // Handle card click - direct to expanded overlay or onClick
  const handleCardClick = () => {
    if (showExpandedOverlay) {
      setShowExpanded(true)
    } else if (onClick) {
      onClick()
    }
  }

  // Handle expanded overlay close
  const handleExpandedClose = () => {
    setShowExpanded(false)
    if (onExpandedClick) {
      onExpandedClick()
    }
  }

  // Check if background should be transparent (for card profile)
  const hasTransparentBg = className.includes('bg-transparent')
  
  const cardClasses = `
    w-full h-full rounded shadow-lg cursor-pointer
    flex items-center justify-center
    ${hasTransparentBg ? 'bg-transparent' : 'bg-gray-800'}
    ${className}
  `.trim()

  return (
    <div className="relative">
      {/* Simple Card */}
      <div
        ref={cardRef}
        className={cardClasses}
        onClick={handleCardClick}
      >
        {/* Card Image Container */}
        <div className="w-full h-full flex items-center justify-center">
          {src ? (
            <img
              src={src}
              alt={alt}
              className="block rounded"
              style={{ 
                width: 'auto', 
                height: 'auto',
                objectFit: 'contain'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded-lg">
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Expanded Overlay */}
      {showExpanded && (
        <div 
          className="fixed inset-0 bg-black/80 z-50" 
          onClick={handleExpandedClose}
        >
          {/* Close Button - Fixed position */}
          <button
            onClick={handleExpandedClose}
            className="fixed right-4 w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors z-20"
            style={{ top: '53px' }}
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="flex justify-center p-4" style={{ paddingTop: '100px' }}>
            <div 
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
            
            {/* Expanded Card */}
            <div className="w-full h-full bg-transparent rounded-lg shadow-2xl flex items-center justify-center" style={{ marginBottom: '0px', paddingBottom: '210px' }}>
              {src ? (
                <img
                  src={src}
                  alt={alt}
                  className="block rounded"
                  style={{ 
                    width: '365px',
                    height: 'auto',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-700 rounded-lg">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HolographicCard