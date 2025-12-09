// Card Image Matcher - Visual matching using image hashing
// This provides an alternative to OCR that can be more accurate
// Based on techniques from existing Pokemon card scanner projects

import { calculateAllHashesAllOrientations } from './imageHashFixed';
import { API_URL } from './api';
import { detectFeatures, matchFeatures, extractDescriptorData } from './featureMatcher';

/**
 * Find matching cards by comparing image hashes
 * This is more accurate than OCR for card identification
 */
export const findCardsByImageMatch = async (scannedImageDataUrl, threshold = 0.05, energyType = null) => {
  try {
    console.log('🖼️ Starting image hash matching...');
    
    // Calculate hashes for all orientations using FIXED implementation (64x89 aspect ratio, dHash only)
    const scannedHashesAllOrientations = await calculateAllHashesAllOrientations(scannedImageDataUrl);
    
    if (!scannedHashesAllOrientations || !scannedHashesAllOrientations.normal?.differenceHash) {
      throw new Error('Failed to calculate image hashes');
    }
    
    // Extract hashes in format expected by backend (only dHash, all orientations)
    // Send all orientations so backend can find best match
    const scannedHashes = {
      differenceHash: scannedHashesAllOrientations.normal.differenceHash,
      // Backend compares scanned hash against all orientations in database
      // Sending normal orientation is sufficient - backend handles orientation matching
    };
    
    // Store all orientations for potential future use
    const scannedHashesWithOrientations = {
      normal: scannedHashesAllOrientations.normal.differenceHash,
      mirrored: scannedHashesAllOrientations.mirrored.differenceHash,
      upsideDown: scannedHashesAllOrientations.upsideDown.differenceHash,
      mirroredUpsideDown: scannedHashesAllOrientations.mirroredUpsideDown.differenceHash
    };
    
    // DEBUG: Log hash details for debugging
    const hashPreview = scannedHashes.differenceHash ? 
      scannedHashes.differenceHash.substring(0, 50) + '...' + scannedHashes.differenceHash.substring(scannedHashes.differenceHash.length - 50) : 
      'null';
    
    // Calculate hash stats for better debugging
    const hashStats = scannedHashes.differenceHash ? {
      onesCount: (scannedHashes.differenceHash.match(/1/g) || []).length,
      zerosCount: (scannedHashes.differenceHash.match(/0/g) || []).length,
      first50: scannedHashes.differenceHash.substring(0, 50),
      last50: scannedHashes.differenceHash.substring(scannedHashes.differenceHash.length - 50)
    } : null;
    
    console.log('✅ Calculated hashes for scanned image (FIXED - 64x89 aspect ratio):', {
      hasDifferenceHash: !!scannedHashes.differenceHash,
      differenceHashLength: scannedHashes.differenceHash?.length,
      hashPreview: hashPreview,
      hashStats: hashStats,
      normalOrientation: !!scannedHashesAllOrientations.normal?.differenceHash,
      mirroredOrientation: !!scannedHashesAllOrientations.mirrored?.differenceHash,
      upsideDownOrientation: !!scannedHashesAllOrientations.upsideDown?.differenceHash,
      mirroredUpsideDownOrientation: !!scannedHashesAllOrientations.mirroredUpsideDown?.differenceHash
    });
    
    // DEBUG: Compare hashes from different orientations to ensure they're different
    if (scannedHashesAllOrientations.normal?.differenceHash && 
        scannedHashesAllOrientations.mirrored?.differenceHash) {
      let diffCount = 0;
      const normalHash = scannedHashesAllOrientations.normal.differenceHash;
      const mirroredHash = scannedHashesAllOrientations.mirrored.differenceHash;
      for (let i = 0; i < Math.min(normalHash.length, mirroredHash.length); i++) {
        if (normalHash[i] !== mirroredHash[i]) diffCount++;
      }
      console.log('🔍 Hash comparison (normal vs mirrored):', {
        differences: diffCount,
        similarity: ((normalHash.length - diffCount) / normalHash.length * 100).toFixed(2) + '%'
      });
    }
    
    // Send hashes to backend for comparison
    // The backend will compare against card images in the database
    // Backend expects hashes object with differenceHash (and optionally other hash types)
    // Backend will compare against all orientations in database
    // Add timeout to prevent hanging (30 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let response;
    try {
      response = await fetch(`${API_URL}/api/cards/match-image`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hashes: scannedHashes,
          threshold: threshold,
          energyType: energyType // Pass detected energy type for filtering
        }),
        credentials: 'omit',
        signal: controller.signal
      });
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('Image matching request timed out after 30 seconds');
      }
      throw error;
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      // If endpoint doesn't exist yet or no hashes in DB
      if (response.status === 404 || response.status === 500) {
        console.log('⚠️ Image matching endpoint not ready or no hashes in database');
        return []; // Return empty array
      }
      throw new Error(`Image matching failed: ${errorText}`);
    }
    
    const data = await response.json();
    
    console.log('📊 API Response:', {
      success: data.success,
      matchCount: data.matches?.length || 0,
      warning: data.warning || null
    });
    
    if (data.warning) {
      console.warn('⚠️', data.warning);
    }
    
    if (data.success && data.matches && data.matches.length > 0) {
      console.log(`✅ Found ${data.matches.length} image matches`);
      
      // DEBUG: Log full match details to see what server is returning
      console.log('🔍 DEBUG: Full match details from server:', data.matches.slice(0, 5).map(m => ({
        name: m.name || m.clean_name,
        product_id: m.product_id,
        set: m.set_name,
        similarity: m.similarity,
        matchScore: m.matchScore,
        similarityType: typeof m.similarity,
        matchScoreType: typeof m.matchScore,
        hasSimilarity: m.similarity !== undefined && m.similarity !== null,
        hasMatchScore: m.matchScore !== undefined && m.matchScore !== null
      })));
      
      // Check for Drowzee cards in results
      const drowzeeMatches = data.matches.filter(m => 
        (m.name || '').toLowerCase().includes('drowzee') || 
        (m.clean_name || '').toLowerCase().includes('drowzee')
      );
      
      if (drowzeeMatches.length > 0) {
        console.log(`🎯 Found ${drowzeeMatches.length} Drowzee card(s) in matches:`, drowzeeMatches.map(m => ({
          name: m.name || m.clean_name,
          product_id: m.product_id,
          similarity: m.similarity,
          matchScore: m.matchScore
        })));
      } else {
        console.log('⚠️ No Drowzee cards found in matches. Top 10 matches:', data.matches.slice(0, 10).map(m => ({
          name: m.name || m.clean_name,
          product_id: m.product_id,
          set: m.set_name,
          similarity: m.similarity,
          matchScore: m.matchScore,
          similarityStr: String(m.similarity),
          matchScoreStr: String(m.matchScore)
        })));
      }
      
      return data.matches;
    }
    
    console.log('⚠️ No image matches found');
    if (data.warning) {
      console.error('❌', data.warning);
    }
    return [];
  } catch (error) {
    console.error('❌ Image matching error:', error);
    // Return empty array on error
    return [];
  }
};

/**
 * Refine matches using feature-based matching
 * Takes top hash matches and uses ORB features for more accurate ranking
 */
const refineMatchesWithFeatures = async (scannedImageDataUrl, topMatches, maxRefine = 20) => {
  try {
    console.log('🔍 Refining matches with feature-based matching...');
    
    // Detect features in scanned image
    const scannedFeatures = await detectFeatures(scannedImageDataUrl);
    if (!scannedFeatures || scannedFeatures.featureCount === 0) {
      console.log('⚠️ No features detected in scanned image');
      return topMatches; // Return original matches
    }
    
    console.log(`✅ Detected ${scannedFeatures.featureCount} features in scanned image`);
    
    // Refine top matches (limit to avoid too much computation)
    const matchesToRefine = topMatches.slice(0, maxRefine);
    const refinedMatches = [];
    
    for (const match of matchesToRefine) {
      try {
        // Fetch card image
        if (!match.imageUrl) continue;
        
        const cardImg = new Image();
        cardImg.crossOrigin = 'anonymous';
        
        await new Promise((resolve, reject) => {
          cardImg.onload = resolve;
          cardImg.onerror = reject;
          cardImg.src = match.imageUrl;
        });
        
        // Convert to data URL
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = cardImg.width;
        canvas.height = cardImg.height;
        ctx.drawImage(cardImg, 0, 0);
        const cardImageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
        
        // Detect features in card image
        const cardFeatures = await detectFeatures(cardImageDataUrl);
        if (!cardFeatures || cardFeatures.featureCount === 0) {
          // No features, keep original similarity score
          refinedMatches.push({ ...match, featureScore: 0 });
          continue;
        }
        
        // Match features
        const featureMatchResult = await matchFeatures(
          scannedFeatures.descriptors,
          cardFeatures.descriptors
        );
        
        // Combine hash similarity with feature match score
        const hashScore = match.similarity || 0;
        const featureScore = featureMatchResult.matchScore || 0;
        const combinedScore = (hashScore * 0.6) + (featureScore * 0.4); // Weighted combination
        
        console.log(`  📊 ${match.name}: hash=${hashScore.toFixed(2)}, features=${featureScore.toFixed(2)}, combined=${combinedScore.toFixed(2)}`);
        
        refinedMatches.push({
          ...match,
          featureScore: featureScore,
          featureMatchCount: featureMatchResult.goodMatchCount,
          combinedScore: combinedScore
        });
        
        // Clean up descriptors
        if (cardFeatures.descriptors) {
          cardFeatures.descriptors.delete();
        }
        canvas.remove();
      } catch (error) {
        console.warn(`⚠️ Failed to refine match for ${match.name}:`, error.message);
        // Keep original match with no feature score
        refinedMatches.push({ ...match, featureScore: 0 });
      }
    }
    
    // Sort by combined score
    refinedMatches.sort((a, b) => {
      const scoreA = a.combinedScore || a.similarity || 0;
      const scoreB = b.combinedScore || b.similarity || 0;
      return scoreB - scoreA;
    });
    
    console.log(`✅ Refined ${refinedMatches.length} matches with feature matching`);
    return refinedMatches;
  } catch (error) {
    console.warn('⚠️ Feature refinement failed, using hash matches only:', error.message);
    return topMatches; // Return original matches if feature matching fails
  }
};

/**
 * Hybrid approach: Combine OCR and image matching
 * This combines the best of both worlds for maximum accuracy
 */
export const hybridCardIdentification = async (scannedImageDataUrl, ocrText, ocrCardInfo, detectedEnergyType = null) => {
  try {
    // Import OCR utilities
    const { hybridCardMatching } = await import('./ocrCardMatcher');
    const { performImprovedOCR } = await import('./improvedOCR');
    
    // Strategy 1: Perform OCR for text-based matching
    console.log('🔍 Strategy 1: Performing OCR for text extraction...');
    let ocrData = null;
    try {
      ocrData = await performImprovedOCR(scannedImageDataUrl);
      console.log('✅ OCR completed:', {
        cardName: ocrData.cardName,
        hp: ocrData.hp,
        cardNumber: ocrData.cardNumber,
        confidence: ocrData.confidence?.toFixed(2)
      });
    } catch (error) {
      console.warn('⚠️ OCR failed, continuing with image matching only:', error.message);
    }
    
    // Strategy 2: Try hybrid matching (OCR + Image)
    console.log('🔍 Strategy 2: Hybrid matching (OCR + Image)...');
    let hybridMatches = [];
    try {
      hybridMatches = await hybridCardMatching(scannedImageDataUrl, ocrData);
    } catch (error) {
      console.warn('⚠️ Hybrid matching failed, falling back to image matching:', error.message);
    }
    
    // Strategy 3: Fallback to image matching only if OCR completely failed AND hybrid failed
    let imageMatches = [];
    const ocrFailed = !ocrData || !ocrData.cardName || ocrData.cardName === 'NOT FOUND';
    
    if (hybridMatches.length === 0 && ocrFailed) {
      console.log('🔍 Strategy 3: Image hash matching (fallback - OCR failed)...');
      
      // Only use image matching as last resort if OCR failed
      // Energy type detection is unreliable (especially for full art cards)
      // Don't use it for filtering - rely purely on image similarity
      // Always search without energy type filter
      imageMatches = await findCardsByImageMatch(scannedImageDataUrl, 0.05, null);
      
      // Log detected energy type for reference, but don't use it for filtering
      if (detectedEnergyType) {
        console.log(`ℹ️ Detected energy type: ${detectedEnergyType} (not used for filtering - unreliable for full art cards)`);
      }
    } else if (hybridMatches.length === 0 && !ocrFailed) {
      console.log('⚠️ OCR succeeded but hybrid matching found no results. Try improving image quality or lighting.');
    }
    
    // Prioritize hybrid matches (OCR + Image), fallback to image only if OCR failed
    const finalMatches = hybridMatches.length > 0 ? hybridMatches : imageMatches;
    
    // If empty array, no matches found
    if (!finalMatches || finalMatches.length === 0) {
      console.log('⚠️ No matches found');
      console.log('💡 Possible issues:');
      console.log('   1. No cards have been hashed yet - run: npm run hashes:precompute-10000');
      console.log('   2. Card may not be in database');
      console.log('   3. Image quality may be too poor');
      console.log('   4. OCR may have failed to extract card name');
      return [];
    }
    
    if (finalMatches && finalMatches.length > 0) {
      const matchType = hybridMatches.length > 0 ? 'hybrid' : 'image';
      console.log(`📊 Found ${finalMatches.length} ${matchType} matches`);
      
      if (matchType === 'hybrid') {
        console.log(`   Top combined score: ${finalMatches[0]?.combinedScore?.toFixed(2) || 'N/A'}`);
        console.log(`   OCR score: ${finalMatches[0]?.ocrScore?.toFixed(2) || 'N/A'}`);
        console.log(`   Image score: ${finalMatches[0]?.imageScore?.toFixed(2) || 'N/A'}`);
      } else {
        console.log(`   Top similarity: ${finalMatches[0]?.similarity?.toFixed(3) || 'N/A'}`);
      }
      
      // Strategy 1.5: Refine top matches with feature-based matching (only for image matches)
      if (matchType === 'image' && finalMatches.length > 0) {
        try {
          const refinedMatches = await refineMatchesWithFeatures(
            scannedImageDataUrl,
            finalMatches.slice(0, 10), // Refine top 10
            10
          );
          
          // Use refined matches if we got good results
          if (refinedMatches.length > 0 && refinedMatches[0].combinedScore > 0.5) {
            console.log(`✅ Using feature-refined matches (top score: ${refinedMatches[0].combinedScore.toFixed(2)})`);
            return refinedMatches;
          }
        } catch (error) {
          console.warn('⚠️ Feature refinement failed:', error.message);
        }
      }
      
      return finalMatches;
    }
    
    return [];
  } catch (error) {
    console.error('Hybrid card identification error:', error);
    return [];
  }
};


