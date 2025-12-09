// OCR-based card matching utility
// Uses extracted text (card name, HP, attack damage) to find matching cards

import { API_URL } from './api';
import { performImprovedOCR, extractCardName, extractHP, extractCardNumber, extractAttackDamage, extractEnergyType } from './improvedOCR';

/**
 * Search for cards using OCR-extracted information
 * Uses multiple strategies: name, name+HP, name+number, name+HP+damage
 */
export async function findCardsByOCR(ocrData) {
  try {
    const { cardName, hp, cardNumber, attackDamages, energyType } = ocrData;
    
    if (!cardName) {
      console.log('⚠️ No card name extracted from OCR');
      return [];
    }
    
    console.log('🔍 Searching cards by OCR:', {
      cardName,
      hp,
      cardNumber,
      attackDamages,
      energyType
    });
    
    // Build search query with multiple criteria
    const searchParams = new URLSearchParams();
    
    // If we have both card name and number, prioritize number matching
    // Include card name in query for better matching, but number is the key identifier
    if (cardNumber) {
      // Include card number in the query string for server-side parsing
      // Also send as separate parameter for explicit matching
      searchParams.append('q', cardName || '');
      searchParams.append('number', cardNumber);
      console.log(`🔍 Searching with card number: ${cardNumber}`);
    } else {
      searchParams.append('q', cardName);
    }
    
    searchParams.append('limit', '50');
    
    // Add filters if available
    if (hp) {
      searchParams.append('hp', hp.toString());
    }
    if (energyType) {
      searchParams.append('energyType', energyType);
    }
    
    // Search via API
    const searchUrl = `${API_URL}/api/cards/search?${searchParams.toString()}`;
    console.log(`🔍 Searching API: ${searchUrl}`);
    
    let response;
    try {
      // Increased timeout to 30 seconds for complex searches
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      response = await fetch(searchUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'omit',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (fetchError) {
      if (fetchError.name === 'AbortError') {
        throw new Error('Search request timed out. Is the API server running?');
      } else if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('ERR_CONNECTION_REFUSED')) {
        throw new Error('Cannot connect to API server. Please start the API server:\n\ncd server && npm run dev');
      }
      throw fetchError;
    }
    
    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`Search failed: ${response.status} ${response.statusText}\n${errorText}`);
    }
    
    const data = await response.json();
    console.log(`📊 API response:`, { 
      success: data.success, 
      hasData: !!data.data, 
      dataLength: data.data?.length || 0,
      hasCards: !!data.cards,
      cardsLength: data.cards?.length || 0,
      responseKeys: Object.keys(data || {}),
      firstCardName: data.data?.[0]?.name || data.cards?.[0]?.name || 'none'
    });
    
    // Handle different response formats: { cards: [...] } or { data: [...] } or [...]
    let matches = data.cards || data.data || data || [];
    
    if (!Array.isArray(matches)) {
      console.warn('⚠️ API response is not an array:', matches);
      console.warn('⚠️ Response type:', typeof matches);
      console.warn('⚠️ Response value:', matches);
      matches = [];
    }
    
    console.log(`📋 Found ${matches.length} matches from API`);
    
    if (matches.length === 0) {
      console.warn('⚠️ No matches returned from API!');
      console.warn('⚠️ Search query:', { cardName, cardNumber, hp, attackDamages, energyType });
      console.warn('⚠️ Full API response:', JSON.stringify(data, null, 2).substring(0, 500));
    } else {
      console.log(`✅ API returned ${matches.length} cards. First card:`, {
        name: matches[0]?.name,
        clean_name: matches[0]?.clean_name,
        ext_number: matches[0]?.ext_number,
        product_id: matches[0]?.product_id
      });
    }
    
    // Score and rank matches based on OCR data
    matches = matches.map(card => {
      let score = 0;
      const reasons = [];
      
      // Name match (most important)
      const cardNameLower = (card.name || '').toLowerCase().trim();
      const cleanNameLower = (card.clean_name || '').toLowerCase().trim();
      const searchNameLower = cardName.toLowerCase().trim();
      
      // Check both name and clean_name fields
      const nameMatches = cardNameLower === searchNameLower || cleanNameLower === searchNameLower;
      const nameIncludes = cardNameLower.includes(searchNameLower) || searchNameLower.includes(cardNameLower) ||
                           cleanNameLower.includes(searchNameLower) || searchNameLower.includes(cleanNameLower);
      
      if (nameMatches) {
        score += 100;
        reasons.push('exact name match');
      } else if (nameIncludes) {
        score += 70;
        reasons.push('partial name match');
      } else {
        // Fuzzy match using Levenshtein distance
        const similarity1 = calculateSimilarity(cardNameLower, searchNameLower);
        const similarity2 = calculateSimilarity(cleanNameLower, searchNameLower);
        const bestSimilarity = Math.max(similarity1, similarity2);
        
        if (bestSimilarity > 0.7) {
          score += 50 * bestSimilarity;
          reasons.push(`fuzzy name match (${(bestSimilarity * 100).toFixed(0)}%)`);
        } else if (bestSimilarity > 0.5) {
          // Lower threshold for fuzzy matches
          score += 30 * bestSimilarity;
          reasons.push(`fuzzy name match (${(bestSimilarity * 100).toFixed(0)}%)`);
        } else if (bestSimilarity > 0.3) {
          // Very lenient threshold for OCR errors (e.g., "ShuckIe" vs "Shuckle")
          score += 20 * bestSimilarity;
          reasons.push(`fuzzy name match (${(bestSimilarity * 100).toFixed(0)}%) - OCR error tolerance`);
        }
      }
      
      // HP match
      if (hp && card.ext_hp) {
        const cardHP = parseInt(card.ext_hp, 10);
        if (cardHP === hp) {
          score += 30;
          reasons.push('HP match');
        } else if (Math.abs(cardHP - hp) <= 10) {
          score += 15;
          reasons.push(`HP close (${cardHP} vs ${hp})`);
        }
      }
      
      // Card number match (improved matching)
      if (cardNumber && card.ext_number) {
        const cardNum = card.ext_number.toString().trim();
        const searchNum = cardNumber.trim();
        
        // Try exact match first
        if (cardNum === searchNum) {
          score += 50; // Higher score for exact match
          reasons.push('exact number match');
        } else {
          // Try without leading zeros
          const cardNumNoZeros = cardNum.replace(/^0+/, '');
          const searchNumNoZeros = searchNum.replace(/^0+/, '').split('/')[0];
          
          if (cardNumNoZeros === searchNumNoZeros || 
              cardNum.includes(searchNumNoZeros) || 
              searchNumNoZeros.includes(cardNumNoZeros) ||
              cardNumNoZeros.includes(searchNumNoZeros) ||
              searchNumNoZeros.includes(cardNumNoZeros)) {
            score += 30; // Good score for partial match
            reasons.push('number match (partial)');
          } else if (cardNum.includes(searchNum) || searchNum.includes(cardNum)) {
            score += 20; // Lower score for substring match
            reasons.push('number match (substring)');
          }
        }
      }
      
      // Attack damage match
      if (attackDamages && attackDamages.length > 0 && card.ext_attack1) {
        const attackText = card.ext_attack1.toLowerCase();
        for (const damage of attackDamages) {
          if (attackText.includes(damage.toString())) {
            score += 20;
            reasons.push(`attack damage match (${damage})`);
            break;
          }
        }
      }
      
      // Energy type match
      if (energyType && card.ext_card_type) {
        const cardType = card.ext_card_type.toLowerCase();
        if (cardType.includes(energyType.toLowerCase())) {
          score += 15;
          reasons.push('energy type match');
        }
      }
      
      return {
        ...card,
        ocrScore: score,
        ocrReasons: reasons,
        matchType: 'ocr'
      };
    });
    
    // Sort by score (highest first)
    matches.sort((a, b) => b.ocrScore - a.ocrScore);
    
    // Log scoring details for debugging
    if (matches.length > 0) {
      console.log(`📊 Top 5 matches before filtering:`, matches.slice(0, 5).map(m => ({
        name: m.name,
        number: m.ext_number,
        score: m.ocrScore,
        reasons: m.ocrReasons
      })));
    }
    
    // Filter out very low scores (lowered threshold to catch more matches)
    // Check if we have any matches with scores before filtering
    const hasLowScoringMatches = matches.some(m => m.ocrScore > 0 && m.ocrScore < 20);
    let threshold = 20; // Minimum score to include (lowered from 30)
    
    // If we have low-scoring matches (likely OCR errors), lower threshold
    if (hasLowScoringMatches) {
      const maxLowScore = Math.max(...matches.filter(m => m.ocrScore < 20).map(m => m.ocrScore));
      if (maxLowScore >= 10) {
        threshold = 10; // Lower threshold to catch OCR errors
        console.log(`⚠️ Lowering threshold to ${threshold} to catch OCR errors (max low score: ${maxLowScore})`);
      }
    }
    
    const beforeFilter = matches.length;
    matches = matches.filter(m => m.ocrScore >= threshold);
    
    if (beforeFilter > matches.length) {
      console.log(`⚠️ Filtered out ${beforeFilter - matches.length} matches below threshold (${threshold})`);
    }
    
    console.log(`✅ Found ${matches.length} OCR matches (top score: ${matches[0]?.ocrScore || 0})`);
    
    // If we have matches, return them; otherwise return empty array
    return matches.slice(0, 20); // Return top 20 matches
  } catch (error) {
    console.error('OCR card matching error:', error);
    return [];
  }
}

/**
 * Calculate string similarity using Levenshtein distance
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

/**
 * Calculate Levenshtein distance between two strings
 */
function levenshteinDistance(str1, str2) {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

/**
 * Hybrid matching: Combine OCR and image matching results
 * OCR provides text-based matching, image matching provides visual matching
 */
export async function hybridCardMatching(imageDataUrl, ocrData = null) {
  try {
    // Perform OCR if not provided
    if (!ocrData) {
      console.log('🔍 Performing OCR for hybrid matching...');
      ocrData = await performImprovedOCR(imageDataUrl);
    }
    
    // Get OCR matches
    const ocrMatches = await findCardsByOCR(ocrData);
    
    // Get image matches (import dynamically to avoid circular dependency)
    const { findCardsByImageMatch } = await import('./cardImageMatcher');
    const imageMatches = await findCardsByImageMatch(imageDataUrl, 0.05, ocrData.energyType);
    
    console.log(`📊 Hybrid matching results:`, {
      ocrMatches: ocrMatches.length,
      imageMatches: imageMatches.length
    });
    
    // Combine and deduplicate matches
    const combinedMatches = new Map();
    
    // Add OCR matches with OCR weight
    for (const match of ocrMatches) {
      const key = match.product_id || match.id || match.cardId;
      if (key) {
        combinedMatches.set(key, {
          ...match,
          ocrScore: match.ocrScore || 0,
          imageScore: 0,
          combinedScore: match.ocrScore || 0
        });
      }
    }
    
    // Add image matches, combine scores if card already exists
    for (const match of imageMatches) {
      const key = match.product_id || match.id || match.cardId;
      const imageScore = (match.similarity || match.matchScore || 0) * 100; // Convert to 0-100 scale
      
      if (key && combinedMatches.has(key)) {
        // Card exists in both - combine scores
        const existing = combinedMatches.get(key);
        existing.imageScore = imageScore;
        existing.combinedScore = (existing.ocrScore * 0.6) + (imageScore * 0.4); // OCR 60%, Image 40%
        existing.matchType = 'hybrid';
      } else if (key) {
        // New card from image matching only
        combinedMatches.set(key, {
          ...match,
          ocrScore: 0,
          imageScore: imageScore,
          combinedScore: imageScore * 0.4, // Lower weight for image-only matches
          matchType: 'image'
        });
      }
    }
    
    // Convert to array and sort by combined score
    const finalMatches = Array.from(combinedMatches.values())
      .sort((a, b) => b.combinedScore - a.combinedScore);
    
    console.log(`✅ Hybrid matching found ${finalMatches.length} unique matches`);
    if (finalMatches.length > 0) {
      console.log('📊 Top 5 hybrid matches:', finalMatches.slice(0, 5).map(m => ({
        name: m.name,
        ocrScore: m.ocrScore?.toFixed(1),
        imageScore: m.imageScore?.toFixed(1),
        combinedScore: m.combinedScore?.toFixed(1),
        matchType: m.matchType
      })));
    }
    
    return finalMatches;
  } catch (error) {
    console.error('Hybrid matching error:', error);
    // Fallback to image matching only
    const { findCardsByImageMatch } = await import('./cardImageMatcher');
    return await findCardsByImageMatch(imageDataUrl, 0.05);
  }
}

