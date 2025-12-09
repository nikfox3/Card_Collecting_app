const fs = require('fs');
const path = require('path');

// Function to update the app's pricing logic
function updateAppPricing() {
  console.log('🔧 Updating app pricing logic...');
  
  const appFilePath = path.join(__dirname, '..', 'src', 'App.jsx');
  
  try {
    let appContent = fs.readFileSync(appFilePath, 'utf8');
    
    // Update the getCardPrice function to prioritize the new pricing structure
    const newGetCardPriceFunction = `
  // Enhanced card price extraction function
  const getCardPrice = (card) => {
    if (!card) return 0;
    
    // Priority 1: Use current_value if available and > 0
    if (card.current_value && card.current_value > 0) {
      return card.current_value;
    }
    
    // Priority 2: Try to parse tcgplayer JSON data
    let tcgplayerData = null;
    if (typeof card.tcgplayer === 'string') {
      try {
        tcgplayerData = JSON.parse(card.tcgplayer);
      } catch (e) {
        console.warn('Failed to parse tcgplayer data for', card.name);
      }
    } else if (typeof card.tcgplayer === 'object') {
      tcgplayerData = card.tcgplayer;
    }
    
    if (tcgplayerData) {
      // Try normal market price first
      if (tcgplayerData.normal?.market && tcgplayerData.normal.market > 0) {
        return tcgplayerData.normal.market;
      }
      // Fall back to holofoil market price
      if (tcgplayerData.holofoil?.market && tcgplayerData.holofoil.market > 0) {
        return tcgplayerData.holofoil.market;
      }
      // Fall back to normal low price
      if (tcgplayerData.normal?.low && tcgplayerData.normal.low > 0) {
        return tcgplayerData.normal.low;
      }
    }
    
    // Priority 3: Try cardmarket data
    let cardmarketData = null;
    if (typeof card.cardmarket === 'string') {
      try {
        cardmarketData = JSON.parse(card.cardmarket);
      } catch (e) {
        console.warn('Failed to parse cardmarket data for', card.name);
      }
    } else if (typeof card.cardmarket === 'object') {
      cardmarketData = card.cardmarket;
    }
    
    if (cardmarketData?.average && cardmarketData.average > 0) {
      return cardmarketData.average;
    }
    
    // Priority 4: Legacy tcgplayer parsing (for backward compatibility)
    if (card.tcgplayer && typeof card.tcgplayer === 'string') {
      try {
        const tcgData = JSON.parse(card.tcgplayer);
        if (tcgData.prices?.normal?.market && tcgData.prices.normal.market > 0) {
          return tcgData.prices.normal.market;
        }
        if (tcgData.prices?.holofoil?.market && tcgData.prices.holofoil.market > 0) {
          return tcgData.prices.holofoil.market;
        }
      } catch (e) {
        // Ignore parsing errors for legacy format
      }
    }
    
    return 0;
  };
`;
    
    // Replace the existing getCardPrice function
    const getCardPriceRegex = /const getCardPrice = \(card\) => \{[\s\S]*?\};/;
    
    if (getCardPriceRegex.test(appContent)) {
      appContent = appContent.replace(getCardPriceRegex, newGetCardPriceFunction);
      console.log('✅ Updated getCardPrice function');
    } else {
      console.log('⚠️  getCardPrice function not found, adding new one');
      // Add the function after the existing helper functions
      const helperFunctionsEnd = appContent.indexOf('  // Currency options and conversion rates');
      if (helperFunctionsEnd !== -1) {
        appContent = appContent.slice(0, helperFunctionsEnd) + 
                    newGetCardPriceFunction + '\n\n  ' + 
                    appContent.slice(helperFunctionsEnd);
      }
    }
    
    // Add enhanced price display helper function
    const priceDisplayHelper = `
  // Enhanced price display helper
  const getPriceDisplayInfo = (card) => {
    const price = getCardPrice(card);
    if (price === 0) return { price: 0, source: null, variant: null };
    
    // Try to determine the source and variant
    let tcgplayerData = null;
    if (typeof card.tcgplayer === 'string') {
      try {
        tcgplayerData = JSON.parse(card.tcgplayer);
      } catch (e) {}
    } else if (typeof card.tcgplayer === 'object') {
      tcgplayerData = card.tcgplayer;
    }
    
    if (tcgplayerData) {
      if (tcgplayerData.normal?.market === price) {
        return { price, source: 'TCGPlayer', variant: 'Normal' };
      }
      if (tcgplayerData.holofoil?.market === price) {
        return { price, source: 'TCGPlayer', variant: 'Holofoil' };
      }
    }
    
    let cardmarketData = null;
    if (typeof card.cardmarket === 'string') {
      try {
        cardmarketData = JSON.parse(card.cardmarket);
      } catch (e) {}
    } else if (typeof card.cardmarket === 'object') {
      cardmarketData = card.cardmarket;
    }
    
    if (cardmarketData?.average === price) {
      return { price, source: 'Cardmarket', variant: 'Average' };
    }
    
    return { price, source: 'Database', variant: null };
  };
`;
    
    // Add the price display helper function
    if (!appContent.includes('getPriceDisplayInfo')) {
      const insertPoint = appContent.indexOf('  // Currency options and conversion rates');
      if (insertPoint !== -1) {
        appContent = appContent.slice(0, insertPoint) + 
                    priceDisplayHelper + '\n\n  ' + 
                    appContent.slice(insertPoint);
        console.log('✅ Added getPriceDisplayInfo function');
      }
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(appFilePath, appContent, 'utf8');
    console.log('✅ App pricing logic updated successfully!');
    
  } catch (error) {
    console.error('❌ Error updating app pricing logic:', error);
    throw error;
  }
}

// Run the update
updateAppPricing()
  .then(() => {
    console.log('🎉 App pricing updates completed!');
  })
  .catch((error) => {
    console.error('❌ App update failed:', error);
    process.exit(1);
  });









