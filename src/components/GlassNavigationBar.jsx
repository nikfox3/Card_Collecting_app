import React from 'react'

const GlassNavigationBar = ({ 
  activeTab, 
  setActiveTab, 
  navigationMode, 
  setNavigationMode 
}) => {
  return (
    <div className="fixed bottom-4 left-0 right-0 px-[19px] py-0 shadow-[0px_24px_7px_0px_rgba(0,0,0,0.01),0px_16px_6px_0px_rgba(0,0,0,0.04),0px_9px_5px_0px_rgba(0,0,0,0.15),0px_4px_4px_0px_rgba(0,0,0,0.25),0px_1px_2px_0px_rgba(0,0,0,0.29)]">
      <div className="bg-[rgba(43,43,43,0.2)] backdrop-blur-md flex items-center justify-between px-[30px] py-0 rounded-[16px] relative border border-white/10 h-[75px]">
        
        {/* Home Button */}
        <button 
          onClick={() => {
            setActiveTab('home')
            setNavigationMode('home')
          }}
          className={`flex flex-col gap-[10px] h-[75px] items-center justify-end pb-0 pt-[15px] px-[10px] w-[84px] ${navigationMode === 'home' ? '' : 'justify-center pt-[26px] h-[47px]'}`}
        >
          <div className="flex flex-col gap-[6px] h-[58px] items-center w-[64px]">
            <div className="w-6 h-6">
              {navigationMode === 'home' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.04 6.82006L14.28 2.79006C12.71 1.69006 10.3 1.75006 8.78999 2.92006L3.77999 6.83006C2.77999 7.61006 1.98999 9.21006 1.98999 10.4701V17.3701C1.98999 19.9201 4.05999 22.0001 6.60999 22.0001H17.39C19.94 22.0001 22.01 19.9301 22.01 17.3801V10.6001C22.01 9.25006 21.14 7.59006 20.04 6.82006ZM12.75 18.0001C12.75 18.4101 12.41 18.7501 12 18.7501C11.59 18.7501 11.25 18.4101 11.25 18.0001V15.0001C11.25 14.5901 11.59 14.2501 12 14.2501C12.41 14.2501 12.75 14.5901 12.75 15.0001V18.0001Z" fill="#6865E7"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9.02 2.84004L3.63 7.04004C2.73 7.74004 2 9.23004 2 10.36V17.77C2 20.09 3.89 21.99 6.21 21.99H17.79C20.11 21.99 22 20.09 22 17.78V10.5C22 9.29004 21.19 7.74004 20.2 7.05004L14.02 2.72004C12.62 1.74004 10.37 1.79004 9.02 2.84004Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 17.99V14.99" stroke="#8F8F94" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            {navigationMode === 'home' && (
              <div className="text-white text-[11px] font-normal leading-[0]">
                Home
              </div>
            )}
          </div>
        </button>

        {/* Collection Button */}
        <button 
          onClick={() => {
            setActiveTab('collection')
            setNavigationMode('collection')
          }}
          className={`flex flex-col gap-[10px] h-[75px] items-center justify-end pb-0 pt-[15px] px-[10px] w-[84px] ${navigationMode === 'collection' ? '' : 'justify-center pt-[26px] h-[47px]'}`}
        >
          <div className="flex flex-col gap-[6px] h-[58px] items-center w-[64px]">
            <div className="w-6 h-6">
              {navigationMode === 'collection' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" fill="#6865E7"/>
                  <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" fill="#6865E7"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M2 3H8C9.06087 3 10.0783 3.42143 10.8284 4.17157C11.5786 4.92172 12 5.93913 12 7V21C12 20.2044 11.6839 19.4413 11.1213 18.8787C10.5587 18.3161 9.79565 18 9 18H2V3Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 3H16C14.9391 3 13.9217 3.42143 13.1716 4.17157C12.4214 4.92172 12 5.93913 12 7V21C12 20.2044 12.3161 19.4413 12.8787 18.8787C13.4413 18.3161 14.2044 18 15 18H22V3Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            {navigationMode === 'collection' && (
              <div className="text-white text-[11px] font-normal leading-[0]">
                Collection
              </div>
            )}
          </div>
        </button>

        {/* Marketplace Button */}
        <button 
          onClick={() => {
            setActiveTab('marketplace')
            setNavigationMode('marketplace')
          }}
          className={`flex flex-col gap-[10px] h-[75px] items-center justify-end pb-0 pt-[15px] px-[10px] w-[84px] ${navigationMode === 'marketplace' ? '' : 'justify-center pt-[26px] h-[47px]'}`}
        >
          <div className="flex flex-col gap-[6px] h-[58px] items-center w-[64px]">
            <div className="w-6 h-6">
              {navigationMode === 'marketplace' ? (
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_115_14278)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.3341 21.3334C11.3341 22.8061 10.1402 24 8.6674 24C7.19464 24 6.00073 22.8061 6.00073 21.3334C6.00073 19.8606 7.19464 18.6667 8.6674 18.6667C10.1402 18.6667 11.3341 19.8606 11.3341 21.3334ZM22.0007 21.3334C22.0007 22.8061 20.8068 24 19.3341 24C17.8613 24 16.6674 22.8061 16.6674 21.3334C16.6674 19.8606 17.8613 18.6667 19.3341 18.6667C20.8068 18.6667 22.0007 19.8606 22.0007 21.3334Z" fill="#6865E7"/>
                    <path d="M2.00081 0C1.26443 0 0.66748 0.596954 0.66748 1.33333C0.66748 2.06971 1.26443 2.66667 2.00081 2.66667H2.48134C3.11691 2.66667 3.66413 3.11528 3.78878 3.73851L5.81234 13.8563C6.06163 15.1028 7.15607 16 8.42722 16H20.2749C21.5153 16 22.592 15.1447 22.8725 13.9363L24.6099 6.45226C24.9009 5.19836 23.9489 4 22.6617 4H6.56055L6.40366 3.21554C6.02972 1.34584 4.38806 0 2.48134 0H2.00081Z" fill="#6865E7"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_115_14278">
                      <rect width="24" height="24" fill="white" transform="translate(0.666748)"/>
                    </clipPath>
                  </defs>
                </svg>
              ) : (
                <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_144_6148)">
                    <path fillRule="evenodd" clipRule="evenodd" d="M11.3335 21.3348C11.3335 22.8078 10.1394 24.0019 8.66636 24.0019C7.19337 24.0019 5.99927 22.8078 5.99927 21.3348C5.99927 19.8618 7.19337 18.6677 8.66636 18.6677C10.1394 18.6677 11.3335 19.8618 11.3335 21.3348ZM22.0018 21.3348C22.0018 22.8078 20.8077 24.0019 19.3347 24.0019C17.8617 24.0019 16.6676 22.8078 16.6676 21.3348C16.6676 19.8618 17.8617 18.6677 19.3347 18.6677C20.8068 18.6677 22.0018 19.8618 22.0018 21.3348Z" fill="#8F8F94"/>
                    <path d="M1.99902 0.998108H2.47949C3.90971 0.998253 5.14138 2.00775 5.42188 3.41022L5.57812 4.1944L5.73926 4.99908H21.3311C22.8789 4.99924 23.9975 6.47835 23.5762 7.96783L22.2051 12.8165C21.8396 14.1084 20.66 15.001 19.3174 15.001H9.51953C8.08934 15.001 6.85784 13.9913 6.57715 12.5889L4.76758 3.54108C4.54945 2.45042 3.59172 1.66524 2.47949 1.6651H1.99902C1.81496 1.6651 1.66528 1.5161 1.66504 1.33209C1.66504 1.17082 1.77952 1.03595 1.93164 1.00494L1.99902 0.998108Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round"/>
                  </g>
                  <defs>
                    <clipPath id="clip0_144_6148">
                      <rect width="24" height="24" fill="white" transform="translate(0.666748)"/>
                    </clipPath>
                  </defs>
                </svg>
              )}
            </div>
            {navigationMode === 'marketplace' && (
              <div className="text-white text-[11px] font-normal leading-[0]">
                Marketplace
              </div>
            )}
          </div>
        </button>

        {/* Profile Button */}
        <button 
          onClick={() => {
            setActiveTab('profile')
            setNavigationMode('profile')
          }}
          className={`flex flex-col gap-[10px] h-[75px] items-center justify-end pb-0 pt-[15px] px-[10px] w-[84px] ${navigationMode === 'profile' ? '' : 'justify-center pt-[26px] h-[47px]'}`}
        >
          <div className="flex flex-col gap-[6px] h-[58px] items-center w-[64px]">
            <div className="w-6 h-6">
              {navigationMode === 'profile' ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" fill="#6865E7"/>
                  <path d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z" fill="#6865E7"/>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12.0002 14.5C6.99016 14.5 2.91016 17.86 2.91016 22C2.91016 22.28 3.13016 22.5 3.41016 22.5H20.5902C20.8702 22.5 21.0902 22.28 21.0902 22C21.0902 17.86 17.0102 14.5 12.0002 14.5Z" stroke="#8F8F94" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            {navigationMode === 'profile' && (
              <div className="text-white text-[11px] font-normal leading-[0]">
                Profile
              </div>
            )}
          </div>
        </button>

        {/* Active Indicator */}
        <div className={`absolute bottom-0 transition-all duration-500 ease-in-out ${
          navigationMode === 'none' ? 'transform -translate-x-full opacity-0' : 'transform translate-x-0 opacity-100'
        }`}
             style={{
               left: navigationMode === 'home' ? '41px' : 
                     navigationMode === 'collection' ? '125px' :
                     navigationMode === 'marketplace' ? '209px' : 
                     navigationMode === 'profile' ? '293px' : '-84px'
             }}>
          <div className="relative flex justify-center">
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-[#6865E7] blur-sm opacity-30 scale-110" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
            <div className="absolute inset-0 bg-[#6865E7] blur-md opacity-20 scale-125" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
            
            {/* Main Indicator */}
            <svg width="64" height="8" viewBox="0 0 64 8" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
              <path d="M59.9277 3.92798C62.1768 3.92798 64 5.75121 64 8.00024H0C0 5.75121 1.82324 3.92798 4.07227 3.92798H25L31.1387 0.802979C31.9937 0.367721 33.0063 0.367721 33.8613 0.802979L40 3.92798H59.9277Z" fill="#6865E7"/>
            </svg>
            
            {/* Subtle Glass Diffusion Effect */}
            <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent" style={{clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%, 0 50%, 4% 50%, 4% 0)'}}></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlassNavigationBar
