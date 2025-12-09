// Improved OCR utility for Pokemon card recognition
// Focuses on accurate text extraction with better preprocessing and zone-based recognition

import { createWorker } from 'tesseract.js';
import { smartOCR } from './ocrProviders';

/**
 * Preprocess image for better OCR accuracy
 * Applies multiple enhancement techniques - less aggressive for better text recognition
 */
export async function preprocessImageForOCR(imageDataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Scale up image for better OCR (2x for better text recognition)
      const scale = 2;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      // Use high-quality scaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Draw original image scaled up
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      // Apply preprocessing techniques (less aggressive)
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale (weighted average for better contrast)
        const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
        
        // Enhance contrast moderately (less aggressive)
        const contrast = 1.3; // Moderate contrast increase
        const enhanced = Math.min(255, Math.max(0, (gray - 128) * contrast + 128));
        
        // Apply adaptive threshold (less aggressive - keep more detail)
        // Use a softer threshold that preserves more information
        const threshold = 120; // Lower threshold to keep more detail
        const brightness = enhanced > threshold ? 
          Math.min(255, enhanced + 30) : // Brighten text areas
          Math.max(0, enhanced - 20);     // Darken background
        
        data[i] = brightness;     // R
        data[i + 1] = brightness; // G
        data[i + 2] = brightness; // B
        // Alpha stays the same
      }
      
      // Put processed data back
      ctx.putImageData(imageData, 0, 0);
      
      // Apply sharpening filter for better text clarity
      const sharpenedCanvas = document.createElement('canvas');
      sharpenedCanvas.width = canvas.width;
      sharpenedCanvas.height = canvas.height;
      const sharpenedCtx = sharpenedCanvas.getContext('2d');
      sharpenedCtx.drawImage(canvas, 0, 0);
      
      // Simple unsharp mask for sharpening
      const sharpenedData = sharpenedCtx.getImageData(0, 0, sharpenedCanvas.width, sharpenedCanvas.height);
      const sharpenedPixels = sharpenedData.data;
      const originalData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const originalPixels = originalData.data;
      
      // Apply unsharp mask (simplified)
      for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1; x < canvas.width - 1; x++) {
          const idx = (y * canvas.width + x) * 4;
          const center = originalPixels[idx];
          
          // Get surrounding pixels for blur
          const top = originalPixels[((y - 1) * canvas.width + x) * 4];
          const bottom = originalPixels[((y + 1) * canvas.width + x) * 4];
          const left = originalPixels[(y * canvas.width + (x - 1)) * 4];
          const right = originalPixels[(y * canvas.width + (x + 1)) * 4];
          
          // Average blur
          const blur = (top + bottom + left + right) / 4;
          
          // Unsharp mask: original + (original - blur) * amount
          const amount = 0.5;
          const sharpened = Math.min(255, Math.max(0, center + (center - blur) * amount));
          
          sharpenedPixels[idx] = sharpened;
          sharpenedPixels[idx + 1] = sharpened;
          sharpenedPixels[idx + 2] = sharpened;
        }
      }
      
      sharpenedCtx.putImageData(sharpenedData, 0, 0);
      
      // Convert back to data URL
      const processedDataUrl = sharpenedCanvas.toDataURL('image/png', 1.0);
      resolve(processedDataUrl);
    };
    img.src = imageDataUrl;
  });
}

/**
 * Extract card name from OCR text
 * Uses multiple strategies to find the card name
 */
export function extractCardName(ocrText) {
  if (!ocrText) return null;
  
  const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Strategy 1: Look for Pokemon name patterns
  // Pokemon names are usually:
  // - First or second line
  // - All caps or Title Case
  // - Not numbers
  // - Not "HP", "Attack", etc.
  
  const skipWords = ['HP', 'ATTACK', 'ABILITY', 'POKEMON', 'POKÉMON', 'ENERGY', 'RETREAT', 'WEAKNESS', 'RESISTANCE', 'DAMAGE', 'EVOLVES', 'FROM'];
  const skipPatterns = [/^\d+\/\d+$/, /^\d+$/, /^HP$/, /^ATTACK$/i, /^ABILITY$/i, /^\d+\s*HP$/i, /HP\s*\d+/i, /^NO\.\s*\d+/i, /^HT\./i, /^WT\s*\d+/i];
  const cardTypeWords = ['BASIC', 'STAGE', 'STAGE1', 'STAGE2', 'VMAX', 'VSTAR', 'V-UNION', 'TRAINER', 'SUPPORTER', 'ITEM', 'STADIUM', 'ENERGY', 'SIC']; // "SIC" is often OCR misread of "BASIC"
  
  // Check first few lines (card name is usually at the top)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    let line = lines[i];
    
    // Handle cases where card type and name are on the same line (e.g., "BASI Drowzee" or "BASIC Drowzee")
    // Extract just the Pokemon name part
    // Also handle partial matches like "BASI" (incomplete "BASIC")
    for (const cardType of cardTypeWords) {
      const typePattern = new RegExp(`^${cardType}\\s+`, 'i');
      if (typePattern.test(line)) {
        line = line.replace(typePattern, '').trim();
        break;
      }
    }
    // Handle partial card type matches (e.g., "BASI" instead of "BASIC")
    if (/^BASI\s+/i.test(line)) {
      line = line.replace(/^BASI\s+/i, '').trim();
    }
    
    // Skip card type words (BASIC, STAGE, etc.) - these are not the card name
    const isCardType = cardTypeWords.some(type => line.toUpperCase().trim() === type || line.toUpperCase().startsWith(type + ' '));
    if (isCardType) {
      // If this is a card type, check subsequent lines for the actual card name
      // Skip multiple consecutive card types (e.g., "Item" then "TRAINER" then "Grabber")
      let nextLineIndex = i + 1;
      while (nextLineIndex < Math.min(i + 4, lines.length)) {
        const nextLine = lines[nextLineIndex].trim();
        
        // Check if this line is also a card type - if so, skip it and continue
        const isNextLineCardType = cardTypeWords.some(type => 
          nextLine.toUpperCase().trim() === type || 
          nextLine.toUpperCase().startsWith(type + ' ')
        );
        
        if (isNextLineCardType) {
          console.log(`⏭️ Skipping card type "${nextLine}" on line ${nextLineIndex}, checking next line...`);
          nextLineIndex++;
          continue;
        }
        
        // If next line looks like a card name (not a number, not empty, not a card type), use it
        if (nextLine.length >= 3 && nextLine.length <= 30 && !/^\d+$/.test(nextLine) && (nextLine.match(/[A-Za-z]/g) || []).length >= 2) {
          let cleaned = nextLine
            .replace(/[|]/g, 'I')
            .replace(/GI([a-z])/g, 'Gl$1')
            .replace(/GI([A-Z])/g, 'Gl$1')
            .replace(/[0O]/g, 'O')
            .replace(/[1Il]/g, 'I')
            .replace(/[^A-Za-z0-9\s\-'\.]/g, '')
            .trim();
          
          cleaned = cleaned.replace(/\bGI([a-z]+)\b/g, (match, rest) => {
            if (rest.length > 0 && rest[0].match(/[aeiou]/i)) {
              return 'Gl' + rest;
            }
            return match;
          });
          
          if (cleaned.length >= 3 && (cleaned.match(/[A-Za-z]/g) || []).length >= 2) {
            console.log(`✅ Extracted card name from line ${nextLineIndex} (skipped card type(s) starting at line ${i}): "${cleaned}"`);
            return cleaned;
          }
        }
        
        // If we didn't find a valid name, break and continue to next iteration
        break;
      }
      continue; // Skip this line
    }
    
    // Remove "STAGE" prefix (common in Pokemon cards)
    line = line.replace(/^STAGE\s+/i, '').trim();
    
    // Remove "Evolves from X" pattern
    line = line.replace(/^Evolves\s+from\s+.+$/i, '').trim();
    
    // Skip if it matches skip patterns
    if (skipPatterns.some(pattern => pattern.test(line))) continue;
    if (skipWords.some(word => line.toUpperCase().includes(word))) continue;
    
    // Skip if it's mostly numbers or special characters
    const alphaCount = (line.match(/[A-Za-z]/g) || []).length;
    if (alphaCount < 2) continue; // Need at least 2 letters
    
    // Check if it looks like a Pokemon name
    // Usually 3-30 characters, may contain spaces, hyphens, apostrophes
    if (line.length >= 3 && line.length <= 30 && alphaCount >= 2) {
      // Remove common OCR errors and fix common mistakes
      let cleaned = line
        .replace(/[|]/g, 'I') // | often misread as I
        .replace(/GI([a-z])/g, 'Gl$1') // Fix "GIoom" -> "Gloom" (common OCR error)
        .replace(/GI([A-Z])/g, 'Gl$1') // Fix uppercase version
        .replace(/[0O]/g, 'O') // Normalize 0 and O (but be careful)
        .replace(/[^A-Za-z0-9\s\-'\.]/g, '') // Remove special chars except hyphens and apostrophes
        .trim();
      
      // Fix common OCR character substitutions
      // "GIoom" -> "Gloom" (uppercase I misread as lowercase l)
      cleaned = cleaned.replace(/\bGI([a-z]+)\b/g, (match, rest) => {
        // If it looks like it should be "Gl" (like "Gloom"), fix it
        if (rest.length > 0 && rest[0].match(/[aeiou]/i)) {
          return 'Gl' + rest;
        }
        return match;
      });
      
      // Store original for comparison
      const beforeCorrection = cleaned;
      
      // Fix "ckI" -> "ckl" FIRST (common OCR error in names like "Shuckle")
      // This catches "ShuckIe" -> "Shuckle" before the general "Ie" -> "le" rule
      cleaned = cleaned.replace(/ckI([a-z])/gi, (match, letter) => {
        console.log(`🔧 OCR correction: "${match}" -> "ckl${letter}"`);
        return 'ckl' + letter;
      });
      
      // Fix "Ie" at end of words (common OCR error: lowercase "l" misread as uppercase "I")
      // Examples: "ShuckIe" -> "Shuckle" (but "ckI" rule above should catch this first)
      // More aggressive: fix any "Ie" ending after consonants
      cleaned = cleaned.replace(/([bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]+)Ie$/gi, (match, prefix) => {
        // Fix if prefix ends with consonant(s) - common pattern for Pokemon names
        if (prefix.length >= 3) {
          console.log(`🔧 OCR correction: "${match}" -> "${prefix}le"`);
          return prefix + 'le';
        }
        return match;
      });
      
      // Fix standalone "I" in middle of words that should be "l"
      // Pattern: consonant + I + vowel (likely should be "l")
      cleaned = cleaned.replace(/([bcdfghjkmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ])I([aeiouAEIOU])/gi, (match, consonant, vowel) => {
        console.log(`🔧 OCR correction: "${match}" -> "${consonant}l${vowel}"`);
        return consonant + 'l' + vowel;
      });
      
      // Log if any corrections were made
      if (cleaned !== beforeCorrection) {
        console.log(`🔧 OCR corrections applied: "${beforeCorrection}" -> "${cleaned}"`);
      }
      
      if (cleaned.length >= 3 && (cleaned.match(/[A-Za-z]/g) || []).length >= 2) {
        // Log if correction was applied
        if (cleaned !== line) {
          console.log(`✅ Extracted card name from line ${i}: "${cleaned}" (original: "${lines[i]}", corrected from: "${line}")`);
        } else {
          console.log(`✅ Extracted card name from line ${i}: "${cleaned}" (original: "${lines[i]}")`);
        }
        return cleaned;
      }
    }
  }
  
  // Strategy 2: Look for longest meaningful word/phrase
  const meaningfulLines = lines.filter(line => {
    if (line.length < 3) return false;
    if (skipPatterns.some(pattern => pattern.test(line))) return false;
    if (skipWords.some(word => line.toUpperCase().includes(word))) return false;
    // Skip card type words (BASIC, STAGE, etc.)
    const isCardType = cardTypeWords.some(type => line.toUpperCase().trim() === type || line.toUpperCase().startsWith(type + ' '));
    if (isCardType) return false;
    const alphaCount = (line.match(/[A-Za-z]/g) || []).length;
    return alphaCount >= 2; // Need at least 2 letters
  });
  
  if (meaningfulLines.length > 0) {
    // Return the longest meaningful line (likely the card name)
    meaningfulLines.sort((a, b) => b.length - a.length);
    let cleaned = meaningfulLines[0]
      .replace(/^STAGE\s+/i, '') // Remove STAGE prefix
      .replace(/^Evolves\s+from\s+.+$/i, '') // Remove "Evolves from X"
      .replace(/[|]/g, 'I')
      .replace(/GI([a-z])/g, 'Gl$1') // Fix "GIoom" -> "Gloom"
      .replace(/GI([A-Z])/g, 'Gl$1')
      .replace(/[0O]/g, 'O')
      .replace(/[1Il]/g, 'I')
      .replace(/[^A-Za-z0-9\s\-'\.]/g, '')
      .trim();
    
    // Fix common OCR character substitutions
    cleaned = cleaned.replace(/\bGI([a-z]+)\b/g, (match, rest) => {
      if (rest.length > 0 && rest[0].match(/[aeiou]/i)) {
        return 'Gl' + rest;
      }
      return match;
    });
    
    if (cleaned.length >= 3 && (cleaned.match(/[A-Za-z]/g) || []).length >= 2) {
      console.log(`✅ Extracted card name from longest line: "${cleaned}"`);
      return cleaned;
    }
  }
  
  console.log('⚠️ Could not extract card name from OCR text');
  console.log('📝 OCR text preview:', ocrText.substring(0, 200));
  return null;
}

/**
 * Extract HP from OCR text
 */
export function extractHP(ocrText) {
  if (!ocrText) return null;
  
  // Look for "HP" followed by numbers
  const hpPatterns = [
    /HP\s*[:\-]?\s*(\d+)/i,
    /(\d+)\s*HP/i,
    /HP\s*(\d+)/i
  ];
  
  for (const pattern of hpPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      const hp = parseInt(match[1], 10);
      if (hp > 0 && hp <= 999) {
        return hp;
      }
    }
  }
  
  return null;
}

/**
 * Extract card number from OCR text (e.g., "001/102")
 */
export function extractCardNumber(ocrText) {
  if (!ocrText) return null;
  
  // Look for patterns like "001/102", "1/102", "001", etc.
  const numberPatterns = [
    /(\d{1,3})\/(\d{1,3})/, // "001/102" format
    /^(\d{1,3})$/,           // Just a number
  ];
  
  for (const pattern of numberPatterns) {
    const match = ocrText.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * Extract attack damage from OCR text
 */
export function extractAttackDamage(ocrText) {
  if (!ocrText) return [];
  
  // Look for damage patterns like "20", "20+", "20x", etc.
  const damagePatterns = [
    /(\d+)\s*[+\-x×]/i,  // "20+", "20x"
    /(\d+)\s*damage/i,   // "20 damage"
    /damage[:\-]?\s*(\d+)/i, // "damage: 20"
  ];
  
  const damages = [];
  for (const pattern of damagePatterns) {
    const matches = ocrText.matchAll(new RegExp(pattern.source, 'gi'));
    for (const match of matches) {
      const damage = parseInt(match[1], 10);
      if (damage > 0 && damage <= 999) {
        damages.push(damage);
      }
    }
  }
  
  // Return unique damages, sorted
  return [...new Set(damages)].sort((a, b) => b - a);
}

/**
 * Extract energy type from OCR text
 */
export function extractEnergyType(ocrText) {
  if (!ocrText) return null;
  
  const energyTypes = [
    'Fire', 'Water', 'Grass', 'Lightning', 'Psychic', 
    'Fighting', 'Darkness', 'Metal', 'Fairy', 'Dragon', 'Colorless'
  ];
  
  const text = ocrText.toUpperCase();
  for (const type of energyTypes) {
    if (text.includes(type.toUpperCase())) {
      return type;
    }
  }
  
  return null;
}

/**
 * Perform OCR on card image with improved preprocessing
 * Uses Google Cloud Vision API if available, falls back to Tesseract
 */
export async function performImprovedOCR(imageDataUrl) {
  try {
    // ONLY use Google Vision API - no fallbacks
    const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
    const hasApiKey = !!apiKey;
    
    // Debug: Log environment variable status
    console.log('🔍 Starting OCR (Google Vision only)...', {
      provider: 'Google Cloud Vision API',
      hasApiKey: hasApiKey,
      apiKeyLength: apiKey ? apiKey.length : 0,
      apiKeyPreview: apiKey ? apiKey.substring(0, 10) + '...' : 'none',
      envKeys: Object.keys(import.meta.env).filter(k => k.includes('GOOGLE') || k.includes('VISION'))
    });
    
    if (!hasApiKey) {
      throw new Error('Google Cloud Vision API key not configured. Please add VITE_GOOGLE_CLOUD_VISION_API_KEY to .env file and restart the server.');
    }
    
    // Use Google Vision API
    const { googleVisionOCR } = await import('./ocrProviders');
    console.log('🔍 Using Google Cloud Vision API for OCR...');
    
    // Add timeout for Google Vision API (15 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    let ocrResult;
    try {
      ocrResult = await Promise.race([
        googleVisionOCR(imageDataUrl),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Google Vision API timeout')), 15000)
        )
      ]);
      clearTimeout(timeoutId);
      console.log('✅ Google Vision OCR completed:', {
        textLength: ocrResult.text?.length || 0,
        confidence: ocrResult.confidence || 0
      });
      
      // Log full OCR text for debugging
      if (ocrResult.text && ocrResult.text.trim().length > 0) {
        console.log('📝 Full OCR text (first 500 chars):', ocrResult.text.substring(0, 500));
        console.log('📝 OCR text lines:', ocrResult.text.split('\n').filter(l => l.trim().length > 0).slice(0, 10));
      } else {
        console.warn('⚠️ OCR returned empty text!');
      }
    } catch (timeoutError) {
      clearTimeout(timeoutId);
      
      // Check if it's a permission/billing error
      if (timeoutError.message.includes('permission') || timeoutError.message.includes('billing') || 
          timeoutError.message.includes('resourcemanager')) {
        throw new Error(`Google Cloud Vision API Setup Required:\n\n${timeoutError.message}\n\nPlease:\n1. Visit: https://console.cloud.google.com/apis/library/vision.googleapis.com\n2. Enable Cloud Vision API for your project\n3. Enable billing (free tier: 1,000 requests/month)\n4. Verify API key permissions\n\nOr use "Search Manually" button for now.`);
      }
      
      throw new Error(`Google Vision API failed: ${timeoutError.message}`);
    }
    
    // Extract structured information
    const cardName = extractCardName(ocrResult.text);
    const hp = extractHP(ocrResult.text);
    const cardNumber = extractCardNumber(ocrResult.text);
    const attackDamages = extractAttackDamage(ocrResult.text) || [];
    const energyType = extractEnergyType(ocrResult.text);
    
    // Log OCR results for debugging
    console.log('📊 OCR extraction results:', {
      cardName: cardName || 'NOT FOUND',
      hp: hp || 'NOT FOUND',
      cardNumber: cardNumber || 'NOT FOUND',
      attackDamages: Array.isArray(attackDamages) && attackDamages.length > 0 ? attackDamages : 'NOT FOUND',
      energyType: energyType || 'NOT FOUND',
      confidence: ocrResult.confidence?.toFixed(2),
      textLength: ocrResult.text?.length || 0,
      textPreview: ocrResult.text?.substring(0, 100) || ''
    });
    
    return {
      text: ocrResult.text,
      cardName,
      hp,
      cardNumber,
      attackDamages,
      energyType,
      confidence: ocrResult.confidence,
      provider: ocrResult.provider,
      rawWords: ocrResult.words || []
    };
  } catch (error) {
    console.error('OCR error:', error);
    throw error;
  }
}

