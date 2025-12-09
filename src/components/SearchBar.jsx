import React from 'react';

const SearchBar = ({ 
  searchQuery, 
  setSearchQuery, 
  onSearch, 
  onScanClick, 
  onSearchInputClick,
  onClearSearch,
  placeholder = "Search cards, sets, attacks, abilities...",
  className = "",
  isMenuOpen = false,
  isModalOpen = false,
  showScanButton = true
}) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const handleSearchInputClick = () => {
    // Call the parent's search input click handler
    if (onSearchInputClick) {
      onSearchInputClick();
    }
  };

  return (
    <div className={`flex items-center gap-2 mb-3 px-1 sm:px-2 py-0 relative ${isModalOpen ? 'z-0' : (isMenuOpen ? 'z-0' : 'z-auto')} ${className}`}>
      <div className="flex items-center min-h-0 min-w-0 pl-0 pr-7 py-0 relative shrink-0 w-full">
        {/* Scan Button - Overlapping with Gradient */}
        {showScanButton && (
          <button 
            onClick={onScanClick}
            aria-label="Scan card"
            className={`flex items-center justify-center mr-[-28px] relative rounded-full shrink-0 size-[64px] ${isModalOpen ? 'z-10' : (isMenuOpen ? 'z-[30]' : 'z-[50]')} dark:border-white/20 border-[#d2d3db] dark:shadow-xl shadow-lg hover:opacity-90 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#6865E7] focus:ring-offset-2`}
            style={{
              background: 'var(--scan-button-bg)',
              backdropFilter: 'blur(16px)'
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dark:fill-white fill-[#6865E7]">
              <path d="M4 15C4.24493 15 4.48134 15.09 4.66437 15.2527C4.84741 15.4155 4.96434 15.6397 4.993 15.883L5 16V19H9C9.25488 19.0003 9.50003 19.0979 9.68537 19.2728C9.8707 19.4478 9.98224 19.687 9.99717 19.9414C10.0121 20.1958 9.92933 20.4464 9.76574 20.6418C9.60215 20.8373 9.3701 20.9629 9.117 20.993L9 21H5C4.49542 21.0002 4.00943 20.8096 3.63945 20.4665C3.26947 20.1234 3.04284 19.6532 3.005 19.15L3 19V16C3 15.7348 3.10536 15.4804 3.29289 15.2929C3.48043 15.1054 3.73478 15 4 15ZM20 15C20.2652 15 20.5196 15.1054 20.7071 15.2929C20.8946 15.4804 21 15.7348 21 16V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H15C14.7348 21 14.4804 20.8946 14.2929 20.7071C14.1054 20.5196 14 20.2652 14 20C14 19.7348 14.1054 19.4804 14.2929 19.2929C14.4804 19.1054 14.7348 19 15 19H19V16C19 15.7348 19.1054 15.4804 19.2929 15.2929C19.4804 15.1054 19.7348 15 20 15ZM20 11C20.2549 11.0003 20.5 11.0979 20.6854 11.2728C20.8707 11.4478 20.9822 11.687 20.9972 11.9414C21.0121 12.1958 20.9293 12.4464 20.7657 12.6418C20.6021 12.8373 20.3701 12.9629 20.117 12.993L20 13H4C3.74512 12.9997 3.49997 12.9021 3.31463 12.7272C3.1293 12.5522 3.01777 12.313 3.00283 12.0586C2.98789 11.8042 3.07067 11.5536 3.23426 11.3582C3.39786 11.1627 3.6299 11.0371 3.883 11.007L4 11H20ZM9 3C9.26522 3 9.51957 3.10536 9.70711 3.29289C9.89464 3.48043 10 3.73478 10 4C10 4.26522 9.89464 4.51957 9.70711 4.70711C9.51957 4.89464 9.26522 5 9 5H5V8C5 8.26522 4.89464 8.51957 4.70711 8.70711C4.51957 8.89464 4.26522 9 4 9C3.73478 9 3.48043 8.89464 3.29289 8.70711C3.10536 8.51957 3 8.26522 3 8V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9ZM19 3C19.5304 3 20.0391 3.21071 20.4142 3.58579C20.7893 3.96086 21 4.46957 21 5V8C21 8.26522 20.8946 8.51957 20.7071 8.70711C20.5196 8.89464 20.2652 9 20 9C19.7348 9 19.4804 8.89464 19.2929 8.70711C19.1054 8.51957 19 8.26522 19 8V5H15C14.7348 5 14.4804 4.89464 14.2929 4.70711C14.1054 4.51957 14 4.26522 14 4C14 3.73478 14.1054 3.48043 14.2929 3.29289C14.4804 3.10536 14.7348 3 15 3H19Z" fill="currentColor"/>
            </svg>
          </button>
        )}
        
        {/* Search Bar - Expanded Width */}
        <div className={`dark:bg-white/5 bg-[#e4e5f1]/80 backdrop-blur-md flex gap-2.5 grow h-[48px] items-center min-h-0 min-w-0 ${showScanButton ? 'mr-[-28px] pl-10' : 'mr-0 pl-4'} pr-3 py-4 relative rounded-xl shrink-0 ${isModalOpen ? 'z-0' : (isMenuOpen ? 'z-[5]' : 'z-[10]')} dark:border-white/10 border-[#d2d3db]/50 shadow-xl`}>
          {/* Search Input */}
          <div className="flex gap-2.5 grow items-start min-h-0 min-w-0 relative shrink-0">
            <input
              type="text"
              id="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              onClick={handleSearchInputClick}
              placeholder={placeholder}
              aria-label="Search cards, sets, attacks, and abilities"
              aria-describedby="search-description"
              className="font-['SF_Pro:Thin',_sans-serif] font-[110.725] leading-[0] relative shrink-0 text-[16px] text-nowrap dark:text-white text-theme-primary bg-transparent focus:outline-none rounded-lg flex-1 dark:placeholder-white/70 placeholder-[#9394a5] cursor-pointer pl-1"
              style={{ fontVariationSettings: "'wdth' 100" }}
            />
            <span id="search-description" className="sr-only">Search for cards, sets, attacks, and abilities</span>
          </div>
          
          {/* Search/Close Icon */}
          {searchQuery ? (
            <button 
              onClick={() => {
                setSearchQuery('');
                if (onClearSearch) {
                  onClearSearch();
                }
              }}
              aria-label="Clear search"
              className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#6865E7] focus:ring-offset-2 rounded"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dark:text-white text-theme-primary">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          ) : (
            <button 
              onClick={onSearch}
              aria-label="Search"
              className="relative shrink-0 size-[24px] hover:opacity-70 transition-opacity flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#6865E7] focus:ring-offset-2 rounded"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="dark:text-white text-theme-primary">
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
