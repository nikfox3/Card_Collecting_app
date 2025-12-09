import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
// OCR removed - using image matching only
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';
import { API_URL } from '../utils/api';
// Removed image matching imports - using OCR only
import { startAutoDetection, quickDetectCard } from '../utils/autoCardDetection';
import ProUpgradeModal from './ProUpgradeModal';
import ScanResultPopover from './ScanResultPopover';
import userDatabase from '../services/userDatabase';

const CardScanner = ({ onScanComplete, onClose }) => {
  const { isDark } = useTheme();
  const { user } = useUser();
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null); // Original color image for display
  const [processedImgSrc, setProcessedImgSrc] = useState(null); // Processed grayscale for OCR
  const [scanning, setScanning] = useState(false);
  const [recognizing, setRecognizing] = useState(false);
  const [recognizedText, setRecognizedText] = useState('');
  const [matchedCards, setMatchedCards] = useState([]);
  const [error, setError] = useState(null);
  const [searchStatus, setSearchStatus] = useState(''); // Show what's being searched
  const [currentSearchQuery, setCurrentSearchQuery] = useState(''); // Current search attempt
  const [manualSearchQuery, setManualSearchQuery] = useState(''); // Manual search input
  const [showManualInput, setShowManualInput] = useState(false); // Show manual search input
  const [extractedCardInfo, setExtractedCardInfo] = useState(null); // Store extracted HP, attack damage, etc.
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const [flashOn, setFlashOn] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [showProUpgradeModal, setShowProUpgradeModal] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const [hasCountedThisScan, setHasCountedThisScan] = useState(false);
  // Always auto-crop based on edge detection
  const [recognitionStrategy, setRecognitionStrategy] = useState('auto'); // 'auto', 'ocr-only', 'full-image'
  const [autoDetect, setAutoDetect] = useState(true); // Auto-detection mode - enabled by default
  const [detectionStatus, setDetectionStatus] = useState(null); // Current detection status
  const autoDetectStopRef = useRef(null); // Ref to stop auto-detection
  // Auto-add functionality state
  const [selectedCollectionId, setSelectedCollectionId] = useState(null);
  const [availableCollections, setAvailableCollections] = useState([]);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [autoAddEnabled, setAutoAddEnabled] = useState(true); // Enable auto-add by default
  const [showScanResultPopover, setShowScanResultPopover] = useState(false);
  const [addedCard, setAddedCard] = useState(null);
  const [allMatches, setAllMatches] = useState([]); // Store all matches for review
  
  const SCAN_LIMIT = 30; // Limit for non-pro users
  const isPro = user?.isPro === true;

  // Debug logging function - logs to console only
  const addDebugLog = useCallback((message, data = {}) => {
    console.log(message, data);
  }, []);

  // Load scan count from localStorage on mount
  useEffect(() => {
    const loadScanCount = () => {
      if (isPro) {
        // Pro users have unlimited scans, reset count
        setScanCount(0);
        return;
      }
      
      // Load scan count from localStorage
      const stored = localStorage.getItem('cardScanner_scanCount');
      const count = stored ? parseInt(stored, 10) : 0;
      setScanCount(count);
    };
    
    loadScanCount();
  }, [isPro]);

  // Load collections on mount
  useEffect(() => {
    const loadCollections = () => {
      const userData = userDatabase.getUserData();
      if (userData && userData.collections) {
        setAvailableCollections(userData.collections);
        // Set default collection (first one, or last selected)
        const defaultCollectionId = localStorage.getItem('scanner_selectedCollection') || 
                                   (userData.collections.length > 0 ? userData.collections[0].id : null);
        setSelectedCollectionId(defaultCollectionId);
      }
    };
    
    loadCollections();
  }, []);

  // Save selected collection to localStorage
  useEffect(() => {
    if (selectedCollectionId) {
      localStorage.setItem('scanner_selectedCollection', selectedCollectionId);
    }
  }, [selectedCollectionId]);

  // Detect card boundaries and crop image (optional)
  // Simplified approach: Use center crop with card aspect ratio
  const detectAndCropCard = (imageSrc, shouldCrop = true) => {
    return new Promise((resolve) => {
      // If cropping is disabled, return original image
      if (!shouldCrop) {
        resolve(imageSrc);
        return;
      }
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Use center crop - less aggressive (85% of image)
        const cropPercent = 0.85;
        const cropWidth = Math.floor(width * cropPercent);
        const cropHeight = Math.floor(height * cropPercent);
        
        // Standard card aspect ratio is approximately 2.5:3.5 (or 5:7)
        const cardAspectRatio = 5 / 7;
        
        // Calculate dimensions maintaining aspect ratio
        let finalCropWidth = cropWidth;
        let finalCropHeight = Math.floor(cropWidth / cardAspectRatio);
        
        // If calculated height exceeds available space, adjust width
        if (finalCropHeight > cropHeight) {
          finalCropHeight = cropHeight;
          finalCropWidth = Math.floor(cropHeight * cardAspectRatio);
        }
        
        // Ensure we don't exceed image bounds
        finalCropWidth = Math.min(finalCropWidth, width);
        finalCropHeight = Math.min(finalCropHeight, height);
        
        // Center the crop
        const left = Math.floor((width - finalCropWidth) / 2);
        const top = Math.floor((height - finalCropHeight) / 2);
        
        // Crop the image
        const croppedCanvas = document.createElement('canvas');
        croppedCanvas.width = finalCropWidth;
        croppedCanvas.height = finalCropHeight;
        const croppedCtx = croppedCanvas.getContext('2d');
        
        // Draw cropped portion with better quality
        croppedCtx.imageSmoothingEnabled = true;
        croppedCtx.imageSmoothingQuality = 'high';
        croppedCtx.drawImage(
          canvas,
          left, top, finalCropWidth, finalCropHeight,
          0, 0, finalCropWidth, finalCropHeight
        );
        
        // Convert to base64
        const croppedImageSrc = croppedCanvas.toDataURL('image/jpeg', 0.95);
        resolve(croppedImageSrc);
      };
      img.src = imageSrc;
    });
  };

  // Preprocess image for better OCR with multiple strategies
  const preprocessImageForOCR = (imageSrc, strategy = 'light') => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image
        ctx.drawImage(img, 0, 0);
        
        // Get image data
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const width = canvas.width;
        const height = canvas.height;
        
        if (strategy === 'light') {
          // Light preprocessing: Just contrast and brightness adjustment (preserves color)
          for (let i = 0; i < data.length; i += 4) {
            // Light contrast boost
            const contrast = 1.3;
            data[i] = Math.min(255, Math.max(0, ((data[i] - 128) * contrast) + 128));     // R
            data[i + 1] = Math.min(255, Math.max(0, ((data[i + 1] - 128) * contrast) + 128)); // G
            data[i + 2] = Math.min(255, Math.max(0, ((data[i + 2] - 128) * contrast) + 128)); // B
            
            // Slight brightness
            const brightness = 10;
            data[i] = Math.min(255, data[i] + brightness);
            data[i + 1] = Math.min(255, data[i + 1] + brightness);
            data[i + 2] = Math.min(255, data[i + 2] + brightness);
          }
          ctx.putImageData(imageData, 0, 0);
        } else if (strategy === 'enhanced') {
          // Enhanced preprocessing: Grayscale + histogram equalization + sharpening
          // Step 1: Convert to grayscale
          const grayscale = [];
          for (let i = 0; i < data.length; i += 4) {
            const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
            grayscale.push(gray);
          }
          
          // Step 2: Histogram equalization
          const histogram = new Array(256).fill(0);
          grayscale.forEach(gray => histogram[gray]++);
          
          const cdf = new Array(256);
          let sum = 0;
          for (let i = 0; i < 256; i++) {
            sum += histogram[i];
            cdf[i] = sum;
          }
          
          const cdfMin = Math.min(...cdf.filter(v => v > 0));
          const cdfMax = cdf[255];
          const cdfRange = cdfMax - cdfMin;
          
          // Step 3: Apply enhancement
          let idx = 0;
          for (let i = 0; i < data.length; i += 4) {
            const gray = grayscale[idx];
            const normalized = cdfRange > 0 
              ? Math.round(((cdf[gray] - cdfMin) / cdfRange) * 255)
              : gray;
            
            const contrast = 1.6;
            const enhanced = Math.min(255, Math.max(0, ((normalized - 128) * contrast) + 128));
            const brightness = 12;
            const final = Math.min(255, Math.max(0, enhanced + brightness));
            
            data[i] = final;
            data[i + 1] = final;
            data[i + 2] = final;
            idx++;
          }
          
          // Step 4: Sharpening (only if large enough)
          if (width >= 3 && height >= 3) {
            const sharpenedData = new Uint8ClampedArray(data);
            for (let y = 1; y < height - 1; y++) {
              for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const center = data[idx];
                const top = data[((y - 1) * width + x) * 4];
                const bottom = data[((y + 1) * width + x) * 4];
                const left = data[(y * width + (x - 1)) * 4];
                const right = data[(y * width + (x + 1)) * 4];
                
                const sharpened = Math.min(255, Math.max(0, center * 5 - (top + bottom + left + right)));
                sharpenedData[idx] = sharpened;
                sharpenedData[idx + 1] = sharpened;
                sharpenedData[idx + 2] = sharpened;
              }
            }
            ctx.putImageData(new ImageData(sharpenedData, canvas.width, canvas.height), 0, 0);
          } else {
            ctx.putImageData(imageData, 0, 0);
          }
        } else {
          // No preprocessing - return original
          resolve(imageSrc);
          return;
        }
        
        // Convert to base64
        const processedImageSrc = canvas.toDataURL('image/jpeg', 0.95);
        resolve(processedImageSrc);
      };
      img.src = imageSrc;
    });
  };

  // Capture photo from webcam (can be called manually or automatically)
  const capture = useCallback(async (imageDataUrl = null) => {
    if (!webcamRef.current && !imageDataUrl) return;

    const originalImageSrc = imageDataUrl || webcamRef.current.getScreenshot();
    
    try {
      // Step 1: Always crop card from image using edge detection
      const croppedImage = await detectAndCropCard(originalImageSrc, true);
      
      // Step 2: Store original color image for display
      setImgSrc(croppedImage);
      
      // Step 3: Process image for OCR (try light preprocessing first)
      // Use lighter preprocessing to preserve more detail
      const processedImage = await preprocessImageForOCR(croppedImage, 'light');
      setProcessedImgSrc(processedImage);
      
      setScanning(false);
      setHasCountedThisScan(false); // Reset flag for new capture
      
      // DON'T stop auto-detection after capture - let it continue for next scan
      // Only stop if user manually disables it
      // The detection loop will continue running in the background
    } catch (error) {
      console.error('Error processing image:', error);
      // Fallback: use original image if cropping fails
      setImgSrc(originalImageSrc);
      
      const processedImage = await preprocessImageForOCR(originalImageSrc);
      setProcessedImgSrc(processedImage);
      setScanning(false);
      setHasCountedThisScan(false);
    }
  }, [webcamRef, autoDetect]);

  // Process image using ONLY image matching (no OCR)
  // Can accept imageData (data URL) or use current imgSrc
  const processImage = async (imageData = null) => {
    const imageToProcess = imageData || imgSrc;
    setRecognizing(true);
    setError(null);
    setRecognizedText('');
    setMatchedCards([]);
    setSearchStatus('Matching card image...');
    setCurrentSearchQuery('');
    setShowManualInput(false);

    try {
      console.log('🔍 Starting image-based card matching...');
      
      // Use the provided image or fall back to imgSrc
      const scannedImage = imageToProcess;
      
      if (!scannedImage) {
        setError('No image captured. Please try scanning again.');
        setRecognizing(false);
        return;
      }
      
      console.log('📸 Using image for matching');
      setSearchStatus('Detecting card boundaries...');
      
      // Step 1: Detect card boundaries and extract card using perspective correction
      let extractedCard = scannedImage;
      let cardExtractionSuccess = false;
      try {
        const { detectCardBoundaries } = await import('../utils/cardBoundaryDetection.js');
        const boundaryResult = await detectCardBoundaries(scannedImage, {
          minArea: 5000,
          cardWidth: 330,
          cardHeight: 440
        });
        
        if (boundaryResult.success && boundaryResult.warpedCard) {
          extractedCard = boundaryResult.warpedCard;
          cardExtractionSuccess = true;
          console.log('✅ Card boundary detected and extracted');
          console.log('📐 Extracted card dimensions:', {
            imageUrl: extractedCard.substring(0, 50) + '...',
            isDataUrl: extractedCard.startsWith('data:image')
          });
        } else {
          console.log('⚠️ Card boundary detection failed, using original image');
          console.log('📐 Original image will be used:', {
            imageUrl: scannedImage.substring(0, 50) + '...',
            isDataUrl: scannedImage.startsWith('data:image')
          });
        }
      } catch (boundaryError) {
        console.warn('⚠️ Boundary detection failed, using original image:', boundaryError);
        // Continue with original image if boundary detection fails
      }
      
      // DEBUG: Log which image is being used for hashing
      console.log('🔍 Image used for hashing:', {
        extractionSuccess: cardExtractionSuccess,
        usingExtractedCard: cardExtractionSuccess,
        imageType: extractedCard.startsWith('data:image') ? 'data URL' : 'URL',
        imageLength: extractedCard.length
      });
      
      setSearchStatus('Preprocessing image for better accuracy...');
      
      // Step 2: Preprocess image for better matching accuracy
      // TEMPORARILY DISABLED: Brightness/contrast normalization was making all cards look similar
      // This was causing all scans to return the same matches
      // The stored images from Pokemon TCG API are already high-quality, so we don't need normalization
      let preprocessedImage = extractedCard;
      
      // DEBUG: Skip normalization to see if that's causing the issue
      // If card extraction succeeded, use extracted card directly
      // If card extraction failed, we might need to try extraction again or use manual crop
      addDebugLog('⚠️ Skipping brightness/contrast normalization');
      addDebugLog('📸 Using extracted card directly for hashing');
      
      // TODO: Re-enable normalization once we confirm card extraction is working properly
      /*
      try {
        const { normalizeBrightnessContrast } = await import('../utils/imagePreprocessing.js');
        preprocessedImage = await normalizeBrightnessContrast(extractedCard);
        console.log('✅ Image normalization complete');
      } catch (preprocessError) {
        console.warn('⚠️ Preprocessing failed, using extracted card:', preprocessError);
      }
      */
      
      setSearchStatus('Analyzing card image...');
      
      // Add overall timeout for the entire matching process (45 seconds)
      const overallTimeout = setTimeout(() => {
        console.error('⏱️ Card matching timed out after 45 seconds');
        setError('Card matching timed out. Please try again.');
        setSearchStatus('Timeout - please try again');
        setRecognizing(false);
      }, 45000);
      
      try {
        // SIMPLIFIED: Only use Google Vision OCR for text-based search
        const { performImprovedOCR } = await import('../utils/improvedOCR');
        const { findCardsByOCR } = await import('../utils/ocrCardMatcher');
        
        console.log('🔍 Performing OCR with Google Vision...');
        setSearchStatus('Searching for card...');
        
        // Perform OCR
        const ocrData = await performImprovedOCR(preprocessedImage);
        
        console.log('✅ OCR completed:', {
          cardName: ocrData.cardName || 'NOT FOUND',
          hp: ocrData.hp || 'NOT FOUND',
          cardNumber: ocrData.cardNumber || 'NOT FOUND',
          confidence: ocrData.confidence?.toFixed(2)
        });
        
        if (!ocrData.cardName) {
          throw new Error('Could not extract card name from image. Please ensure:\n• Card is clearly visible\n• Good lighting\n• Card fills the frame\n• Text is readable');
        }
        
        // Search for cards using OCR results
        console.log('🔍 Searching for cards using OCR text...');
        setSearchStatus('Searching database...');
        
        const matches = await findCardsByOCR(ocrData);
        
        clearTimeout(overallTimeout);
        
        if (matches && matches.length > 0) {
          console.log(`✅ Found ${matches.length} matches via OCR search`);
          console.log('📊 Top matches:', matches.slice(0, 10).map(m => ({
            name: m.cleanName || m.name,
            product_id: m.product_id,
            ocrScore: m.ocrScore?.toFixed(1),
            matchType: m.matchType
          })));
          
          setMatchedCards(matches);
          setAllMatches(matches); // Store all matches for review
          setError(null);
          setSearchStatus(`Found ${matches.length} match${matches.length > 1 ? 'es' : ''}`);
          setRecognizing(false);
          
          // Auto-add top match if enabled and collection selected
          if (autoAddEnabled && selectedCollectionId && matches.length > 0) {
            const topMatch = matches[0];
            await handleAutoAddCard(topMatch);
            
            // After auto-add, reset to capture mode (don't show results)
            setTimeout(() => {
              setImgSrc(null);
              setProcessedImgSrc(null);
              setMatchedCards([]);
              setError(null);
              setRecognizedText('');
              setExtractedCardInfo(null);
              setSearchStatus('');
              setRecognizing(false);
              setHasCountedThisScan(false);
            }, 500); // Small delay to show popover briefly
          }
          
          return; // Success!
        } else {
          console.log('⚠️ No matches found');
          clearTimeout(overallTimeout);
          const errorMsg = `No matching cards found for "${ocrData.cardName}".\n\nTry:\n• Check spelling of card name\n• Use "Search Manually" button\n• Ensure card is in database`;
          setError(errorMsg);
          setRecognizing(false);
          return;
        }
      } catch (ocrError) {
        clearTimeout(overallTimeout);
        console.error('❌ OCR error:', ocrError);
        setError(`OCR failed: ${ocrError.message}\n\nPlease ensure:\n• Google Vision API key is configured\n• Card is clearly visible\n• Good lighting\n• Try "Search Manually" button`);
        setRecognizing(false);
        return;
      }
    } catch (err) {
      clearTimeout(overallTimeout);
      console.error('❌ Processing error:', err);
      setError(`Failed to process card: ${err.message}. Try "Search Manually" or improve lighting.`);
      setRecognizing(false);
    }
  };

  // Extract dominant colors from image and map to Pokemon energy types
  const analyzeCardColors = async (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Sample pixels with focus on center region (where card usually is)
        // Use adaptive sampling: more samples in center, fewer at edges
        const colorMap = new Map();
        const sampleRate = 8; // More frequent sampling for better accuracy
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const centerRadius = Math.min(canvas.width, canvas.height) * 0.4; // Focus on center 40%
        
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
          const pixelIndex = i / 4;
          const x = pixelIndex % canvas.width;
          const y = Math.floor(pixelIndex / canvas.width);
          
          // Calculate distance from center
          const distFromCenter = Math.sqrt(
            Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
          );
          
          // Prefer center pixels, but still sample edges occasionally
          const isInCenter = distFromCenter < centerRadius;
          const shouldSample = isInCenter || Math.random() < 0.3; // 30% chance for edge pixels
          
          if (!shouldSample) continue;
          
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Skip very dark or very light pixels (likely background/border)
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 240) continue;
          
          // Skip pixels that are too gray (likely background, not card art)
          const maxChannel = Math.max(r, g, b);
          const minChannel = Math.min(r, g, b);
          const saturation = maxChannel - minChannel;
          if (saturation < 20 && brightness > 100 && brightness < 200) {
            // Very low saturation gray pixels in mid-brightness range = likely background
            continue;
          }
          
          // Quantize colors to reduce noise (finer quantization for better accuracy)
          const quantizedR = Math.floor(r / 24) * 24; // Finer quantization
          const quantizedG = Math.floor(g / 24) * 24;
          const quantizedB = Math.floor(b / 24) * 24;
          const colorKey = `${quantizedR},${quantizedG},${quantizedB}`;
          
          // Weight center pixels more heavily
          const weight = isInCenter ? 2 : 1;
          colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + weight);
        }
        
        // Get top 5 dominant colors
        const sortedColors = Array.from(colorMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([colorKey]) => {
            const [r, g, b] = colorKey.split(',').map(Number);
            return { r, g, b };
          });
        
        console.log('🎨 Dominant colors:', sortedColors);
        
            // Map colors to Pokemon energy types
            // Based on actual Pokemon TCG card colors and energy symbols
            const energyTypeMap = {
              Psychic: [
                // Psychic cards are typically bright pink/magenta - prioritize this!
                { r: [200, 255], g: [50, 150], b: [150, 255] },   // Bright Pink/Magenta (most common)
                { r: [180, 255], g: [0, 120], b: [180, 255] },    // Deep Pink/Purple
                { r: [150, 220], g: [0, 100], b: [150, 220] },    // Purple
                { r: [220, 255], g: [100, 200], b: [200, 255] },  // Light Pink
                { r: [200, 255], g: [80, 180], b: [200, 255] }    // Pink with slight blue
              ],
              Fairy: [
                // Fairy is lighter, softer pink than Psychic
                { r: [220, 255], g: [180, 240], b: [220, 255] },  // Light Pink
                { r: [200, 255], g: [150, 220], b: [200, 255] },  // Soft Pink
                { r: [240, 255], g: [200, 255], b: [240, 255] }   // Very Light Pink
              ],
              Fire: [
                { r: [200, 255], g: [50, 150], b: [0, 100] },     // Red/Orange
                { r: [220, 255], g: [100, 200], b: [0, 80] },     // Bright Orange
                { r: [180, 255], g: [30, 120], b: [0, 60] }       // Deep Red
              ],
              Water: [
                { r: [0, 100], g: [100, 200], b: [150, 255] },    // Blue
                { r: [50, 150], g: [150, 255], b: [200, 255] },   // Cyan/Blue
                { r: [0, 80], g: [120, 220], b: [180, 255] }       // Deep Blue
              ],
              Grass: [
                // Grass cards are predominantly green - prioritize high G values
                { r: [0, 120], g: [150, 255], b: [0, 150] },      // Bright Green (most common)
                { r: [0, 100], g: [180, 255], b: [0, 180] },      // Light Green
                { r: [50, 150], g: [160, 255], b: [50, 160] },    // Medium Green
                { r: [0, 80], g: [120, 255], b: [0, 120] },       // Deep Green
                { r: [0, 60], g: [100, 255], b: [0, 100] },       // Very Deep Green
                { r: [20, 140], g: [140, 255], b: [20, 140] }     // Balanced Green (all channels similar but G dominant)
              ],
              Electric: [
                { r: [200, 255], g: [200, 255], b: [0, 100] },    // Yellow
                { r: [220, 255], g: [220, 255], b: [50, 150] },   // Light Yellow
                { r: [240, 255], g: [240, 255], b: [100, 200] }   // Very Light Yellow
              ],
              Fighting: [
                { r: [150, 255], g: [80, 180], b: [0, 100] },     // Brown/Orange
                { r: [120, 200], g: [60, 150], b: [0, 80] },      // Dark Orange/Brown
                { r: [100, 180], g: [50, 120], b: [0, 60] }       // Deep Brown
              ],
              Darkness: [
                // Darkness cards are very dark/black - should NOT match green
                // All channels must be LOW (dark colors)
                { r: [0, 60], g: [0, 60], b: [0, 60] },           // Very Dark/Black (all channels low)
                { r: [0, 80], g: [0, 80], b: [0, 80] },           // Dark Gray (all channels low and balanced)
                { r: [50, 120], g: [0, 80], b: [80, 150] }        // Dark Purple (low G, distinct from Psychic and Grass)
              ],
              Metal: [
                // Metal is neutral gray - should NOT match pink/purple
                { r: [150, 220], g: [150, 220], b: [150, 220] },  // Gray/Silver (balanced RGB)
                { r: [180, 240], g: [180, 240], b: [180, 240] },  // Light Gray (balanced RGB)
                { r: [120, 180], g: [120, 180], b: [120, 180] }   // Medium Gray (balanced RGB)
              ]
            };
        
        // Score each energy type based on color matches
        // Use weighted scoring: more dominant colors (earlier in sortedColors) get higher weight
        const energyScores = {};
        for (const [energyType, colorRanges] of Object.entries(energyTypeMap)) {
          let score = 0;
          for (let i = 0; i < sortedColors.length; i++) {
            const color = sortedColors[i];
            const weight = sortedColors.length - i; // First color gets highest weight (5, 4, 3, 2, 1)
            
            for (const range of colorRanges) {
              if (color.r >= range.r[0] && color.r <= range.r[1] &&
                  color.g >= range.g[0] && color.g <= range.g[1] &&
                  color.b >= range.b[0] && color.b <= range.b[1]) {
                score += weight * 2; // Weighted score (more weight for dominant colors)
                break; // Only count once per color per type
              }
            }
          }
          if (score > 0) {
            energyScores[energyType] = score;
          }
        }
        
        // Special handling: Check for dominant color types
        // 1. Green dominance = Grass (high G, lower R and B)
        // 2. Pink/purple dominance = Psychic (high R and B, low G)
        // 3. Balanced gray = Metal (all channels similar)
        let greenCount = 0;
        let pinkPurpleCount = 0;
        let totalSaturation = 0;
        
        for (const color of sortedColors) {
          const maxChannel = Math.max(color.r, color.g, color.b);
          const minChannel = Math.min(color.r, color.g, color.b);
          const saturation = maxChannel - minChannel;
          totalSaturation += saturation;
          
          // Check for green (high G, lower R and B)
          // More lenient: green is when G is the dominant channel
          const gHigh = color.g > 120; // Lower threshold
          const gDominant = color.g > color.r && color.g > color.b; // G is highest channel
          const gMuchHigher = color.g > Math.max(color.r, color.b) + 20; // G is significantly higher
          const isGreen = gHigh && (gDominant || gMuchHigher);
          
          // Check for pink/purple (high R and B, low G)
          const rHigh = color.r > 170;
          const bHigh = color.b > 140;
          const gLow = color.g < 160;
          const isPinkPurple = rHigh && bHigh && gLow;
          
          if (isGreen) {
            greenCount++;
          }
          if (isPinkPurple) {
            pinkPurpleCount++;
          }
        }
        
        const avgSaturation = totalSaturation / sortedColors.length;
        const hasGreen = greenCount > 0;
        const hasPinkPurple = pinkPurpleCount > 0;
        const hasHighSaturation = avgSaturation > 40;
        
        console.log('🎨 Color analysis details:', {
          greenCount,
          pinkPurpleCount,
          avgSaturation: avgSaturation.toFixed(1),
          hasGreen,
          hasPinkPurple,
          hasHighSaturation,
          colors: sortedColors.map(c => `rgb(${c.r},${c.g},${c.b})`)
        });
        
        // Boost Grass if we detect green colors
        if (hasGreen) {
          const boostAmount = greenCount * 30; // Very strong boost for green
          energyScores.Grass = (energyScores.Grass || 0) + boostAmount;
          // Heavily penalize non-Grass types if we have green
          energyScores.Psychic = Math.max(0, (energyScores.Psychic || 0) - 20);
          energyScores.Darkness = Math.max(0, (energyScores.Darkness || 0) - 20);
          energyScores.Metal = Math.max(0, (energyScores.Metal || 0) - 20);
          
          console.log('🌿 Applying green boost:', {
            boostAmount,
            newGrassScore: energyScores.Grass,
            newPsychicScore: energyScores.Psychic,
            newDarknessScore: energyScores.Darkness
          });
        }
        
        // Boost Psychic if we detect pink/purple (but only if no green)
        if (hasPinkPurple && !hasGreen) {
          const boostAmount = pinkPurpleCount * 20 + (hasHighSaturation ? 15 : 0);
          energyScores.Psychic = (energyScores.Psychic || 0) + boostAmount;
          energyScores.Metal = Math.max(0, (energyScores.Metal || 0) - 20); // Heavy penalty
          
          console.log('⚡ Applying pink/purple boost:', {
            boostAmount,
            newPsychicScore: energyScores.Psychic,
            newMetalScore: energyScores.Metal
          });
        }
        
        // Check for balanced gray colors (Metal type) - but ONLY if no pink/purple AND no green
        if (!hasPinkPurple && !hasGreen && !hasHighSaturation) {
          const hasBalancedGray = sortedColors.some(color => {
            const maxChannel = Math.max(color.r, color.g, color.b);
            const minChannel = Math.min(color.r, color.g, color.b);
            const balance = maxChannel - minChannel;
            // Gray: balanced RGB, medium brightness, NOT green (G shouldn't be dominant)
            const isGray = balance < 25 && color.r > 120 && color.r < 240 && 
                          !(color.g > color.r && color.g > color.b); // Exclude green-tinted grays
            return isGray;
          });
          
          if (hasBalancedGray) {
            // Boost Metal score if we have gray but no pink/purple and no green
            energyScores.Metal = (energyScores.Metal || 0) + 10;
          }
        } else {
          // If we have pink/purple, green, or high saturation, Metal should be very unlikely
          if (hasGreen) {
            energyScores.Metal = Math.max(0, (energyScores.Metal || 0) - 20);
          } else {
            energyScores.Metal = Math.max(0, (energyScores.Metal || 0) - 15);
          }
        }
        
        // Penalize Darkness if we have green (they shouldn't coexist)
        if (hasGreen) {
          energyScores.Darkness = Math.max(0, (energyScores.Darkness || 0) - 25);
        }
        
        // Distinguish Fairy from Psychic: Fairy is lighter and has higher G component
        const hasLightPink = sortedColors.some(color => {
          const rHigh = color.r > 200;
          const gMedium = color.g > 150 && color.g < 240;
          const bHigh = color.b > 200;
          const isLightPink = rHigh && gMedium && bHigh;
          return isLightPink;
        });
        
        if (hasLightPink && !hasPinkPurple) {
          // Boost Fairy if we have light pink but not deep pink/purple
          energyScores.Fairy = (energyScores.Fairy || 0) + 5;
        }
        
        // Find the best matching energy type
        const sortedEnergyTypes = Object.entries(energyScores)
          .sort((a, b) => b[1] - a[1]);
        
        // Only return detected type if score is above threshold (avoid false positives)
        const detectedType = sortedEnergyTypes.length > 0 && sortedEnergyTypes[0][1] >= 4
          ? sortedEnergyTypes[0][0]
          : null;
        
        console.log('⚡ Detected energy type:', detectedType, 'Scores:', energyScores);
        
        resolve({
          dominantColors: sortedColors,
          energyType: detectedType,
          energyScores
        });
      };
      img.onerror = () => {
        console.warn('Failed to load image for color analysis');
        resolve({ dominantColors: [], energyType: null, energyScores: {} });
      };
      img.src = imageSrc;
    });
  };

  // Extract card name and number from OCR text
  const extractCardInfo = (text) => {
    console.log('🔍 Raw OCR text:', text);
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    console.log('🔍 OCR lines:', lines);
    
    let cardName = '';
    let cardNumber = '';
    let hp = null;
    let attackName = '';
    let attackDamage = null;
    const allWords = [];
    
    // Extract HP - prioritize top lines (HP is usually at top right of card)
    // Look for patterns: "HP 80", "80 HP", "HP: 80", etc.
    // HP is usually 30-400 for Pokemon cards
    const hpPatterns = [
      /HP[:\s]+(\d{2,3})/i,  // "HP 80" or "HP: 80"
      /(\d{2,3})[:\s]*HP/i,   // "80 HP" or "80HP"
      /^HP\s*(\d{2,3})$/i,    // Line is just "HP 80"
      /^(\d{2,3})\s*HP$/i     // Line is just "80 HP"
    ];
    
    // Check first 5 lines (HP is usually at the top)
    const hpTopLines = lines.slice(0, 5);
    for (const line of hpTopLines) {
      const trimmed = line.trim();
      
      for (const pattern of hpPatterns) {
        const hpMatch = trimmed.match(pattern);
        if (hpMatch) {
          const potentialHP = parseInt(hpMatch[1] || hpMatch[2]);
          // Validate HP range (Pokemon cards typically have 30-400 HP)
          if (potentialHP >= 30 && potentialHP <= 400) {
            hp = potentialHP;
            console.log('💚 Found HP:', hp, 'from line:', trimmed);
            break;
          }
        }
      }
      if (hp) break;
    }
    
    // Fallback: if HP not found in top lines, check all lines but be more strict
    if (!hp) {
      for (const line of lines) {
        const trimmed = line.trim();
        // Only match if line contains "HP" explicitly
        if (!trimmed.toLowerCase().includes('hp')) continue;
        
        const hpMatch = trimmed.match(/HP[:\s]+(\d{2,3})|(\d{2,3})[:\s]*HP/i);
        if (hpMatch) {
          const potentialHP = parseInt(hpMatch[1] || hpMatch[2]);
          if (potentialHP >= 30 && potentialHP <= 400) {
            hp = potentialHP;
            console.log('💚 Found HP (fallback):', hp, 'from line:', trimmed);
            break;
          }
        }
      }
    }
    
    // Try to find card number pattern (e.g., "001/102", "25/165", "123", "025")
    const numberPattern = /(\d{1,4}\/?\d{0,4})/g;
    for (const line of lines) {
      const match = line.match(numberPattern);
      if (match) {
        // Prefer numbers that look like card numbers (e.g., "25/165", "001/102")
        const cardNumberMatch = match.find(m => m.includes('/') || m.length >= 2);
        if (cardNumberMatch) {
          cardNumber = cardNumberMatch;
        } else {
          cardNumber = match[match.length - 1];
        }
      }
      
      // Collect all words (excluding pure numbers and very short OCR artifacts)
      const words = line.split(/\s+/).filter(word => {
        const trimmed = word.trim();
        // Exclude pure numbers
        if (trimmed.match(/^\d+\/?\d*$/)) return false;
        // Exclude very short words that are likely OCR artifacts (1-2 chars)
        if (trimmed.length <= 2 && !trimmed.match(/^[A-Z]{2}$/)) return false;
        // Exclude single characters
        if (trimmed.length === 1) return false;
        return true;
      });
      allWords.push(...words);
    }
    
    // Extract attack name and damage
    // Attack damage is usually in parentheses: "Tackle (30)" or at end: "Tackle 30"
    // Attack damage is typically 10-250 (smaller than HP)
    // Skip lines that contain HP to avoid confusion
    // Attacks are usually after the card name (skip first 2-3 lines)
    const attackLines = lines.slice(2); // Skip first 2 lines (usually card name/HP area)
    
    for (const line of attackLines) {
      const trimmed = line.trim();
      
      // Skip lines that are clearly HP or card number
      if (trimmed.match(/^HP/i) || trimmed.match(/^\d+\/?\d*$/)) continue;
      // Skip lines that contain HP label
      if (trimmed.toLowerCase().includes('hp') && trimmed.match(/\d{2,3}/)) continue;
      
      // Priority 1: Damage in parentheses - most reliable pattern
      const parenMatch = trimmed.match(/\((\d{1,3})\)/);
      if (parenMatch) {
        const potentialDamage = parseInt(parenMatch[1]);
        // Attack damage validation: 10-250 (usually smaller than HP)
        if (potentialDamage >= 10 && potentialDamage <= 250) {
          // Make sure it's not the HP value we already found
          if (!hp || potentialDamage !== hp) {
            attackDamage = potentialDamage;
            // Extract attack name - everything before the parentheses
            attackName = trimmed
              .substring(0, parenMatch.index)
              .replace(/[^\w\s-]/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            
            // Clean up attack name
            if (attackName.length < 3) {
              // Try to find capitalized words
              const words = attackName.split(/\s+/);
              const capitalizedWords = words.filter(w => 
                w.length > 2 && w[0] === w[0].toUpperCase() && w[0].match(/[A-Z]/)
              );
              if (capitalizedWords.length > 0) {
                attackName = capitalizedWords.join(' ');
              }
            }
            
            console.log('⚔️ Found attack (parentheses):', { attackName, attackDamage });
            break;
          }
        }
      }
    }
    
    // Priority 2: If no parentheses match, look for damage at end of line
    if (!attackDamage) {
      for (const line of attackLines) {
        const trimmed = line.trim();
        
        // Skip HP lines
        if (trimmed.match(/^HP/i) || trimmed.toLowerCase().includes('hp')) continue;
        
        // Look for number at end: "Tackle 30" or "Tackle 30+"
        const endMatch = trimmed.match(/\s+(\d{1,3})\s*\+?\s*$/);
        if (endMatch) {
          const potentialDamage = parseInt(endMatch[1]);
          if (potentialDamage >= 10 && potentialDamage <= 250) {
            // Make sure it's not HP
            if (!hp || potentialDamage !== hp) {
              attackDamage = potentialDamage;
              attackName = trimmed
                .substring(0, endMatch.index)
                .replace(/[^\w\s-]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
              
              console.log('⚔️ Found attack (end):', { attackName, attackDamage });
              break;
            }
          }
        }
      }
    }
    
    // Log what we found
    if (hp) {
      console.log('✅ Final HP:', hp);
    }
    if (attackDamage) {
      console.log('✅ Final Attack Damage:', attackDamage);
      console.log('✅ Final Attack Name:', attackName || '(not found)');
    } else {
      console.log('⚠️ No attack damage found');
    }

    // Try to find card name - improved strategy
    // Card names are usually:
    // - At the top of the card (first few lines)
    // - Fully capitalized or start with capital letter
    // - Longer than 3 characters
    // - Not numbers, HP values, or attack names
    
    // First, prioritize top lines (card name is usually at top)
    const nameTopLines = lines.slice(0, 5);
    const remainingLines = lines.slice(5);
    
    // Filter lines that could be card names
    const potentialCardNames = [];
    
    // Check top lines first (highest priority)
    for (const line of nameTopLines) {
      const trimmed = line.trim();
      
      // Skip if it's clearly not a card name
      if (trimmed.match(/^\d+\/?\d*$/)) continue; // Card number
      if (trimmed.match(/^HP/i)) continue; // HP line
      if (trimmed.match(/^\d+\s*HP/i)) continue; // HP value
      if (trimmed.length < 3) continue; // Too short
      if (trimmed.match(/^[A-Z]{1,2}$/)) continue; // Single/double letter (OCR artifact)
      
      // Check if it looks like a Pokemon name
      const words = trimmed.split(/\s+/);
      const hasCapitalizedWord = words.some(w => 
        w.length > 2 && w[0] === w[0].toUpperCase() && w[0].match(/[A-Z]/)
      );
      
      // Skip if it contains attack patterns (damage in parentheses, etc.)
      if (trimmed.match(/\((\d+)\)/)) continue; // Attack damage
      if (trimmed.match(/\d+\s*\+?\s*$/)) continue; // Number at end (likely damage)
      
      // Skip if it's mostly numbers
      const numberCount = trimmed.match(/\d/g)?.length || 0;
      if (numberCount > trimmed.length / 2) continue;
      
      if (hasCapitalizedWord || words.length > 0) {
        potentialCardNames.push({
          text: trimmed,
          priority: 10, // High priority for top lines
          wordCount: words.length,
          length: trimmed.length,
          hasCapitalized: hasCapitalizedWord
        });
      }
    }
    
    // Check remaining lines (lower priority)
    for (const line of remainingLines) {
      const trimmed = line.trim();
      
      // Same filters as above
      if (trimmed.match(/^\d+\/?\d*$/)) continue;
      if (trimmed.match(/^HP/i)) continue;
      if (trimmed.length < 4) continue; // Require longer for lower lines
      if (trimmed.match(/\((\d+)\)/)) continue;
      if (trimmed.match(/\d+\s*\+?\s*$/)) continue;
      
      const words = trimmed.split(/\s+/);
      const hasCapitalizedWord = words.some(w => 
        w.length > 2 && w[0] === w[0].toUpperCase() && w[0].match(/[A-Z]/)
      );
      
      if (hasCapitalizedWord) {
        potentialCardNames.push({
          text: trimmed,
          priority: 5, // Lower priority for lower lines
          wordCount: words.length,
          length: trimmed.length,
          hasCapitalized: hasCapitalizedWord
        });
      }
    }
    
    // Sort by priority, then by length, then by word count
    potentialCardNames.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      if (b.length !== a.length) return b.length - a.length;
      return b.wordCount - a.wordCount;
    });
    
    if (potentialCardNames.length > 0) {
      cardName = potentialCardNames[0].text;
      
      // Clean up card name - remove OCR artifacts
      const words = cardName.split(/\s+/);
      const cleanedWords = words.filter((word, index) => {
        const trimmed = word.trim();
        
        // Remove very short words at the start (OCR artifacts)
        if (index === 0 && trimmed.length <= 2 && !trimmed.match(/^[A-Z]{2,}$/)) {
          return false;
        }
        
        // Remove pure numbers
        if (trimmed.match(/^\d+$/)) {
          return false;
        }
        
        // Remove single characters
        if (trimmed.length === 1) {
          return false;
        }
        
        return true;
      });
      
      // If we have cleaned words, use them
      if (cleanedWords.length > 0) {
        // If first word was removed and we have multiple words, prefer the longest
        if (words[0]?.trim().length <= 2 && cleanedWords.length > 1) {
          const longestWord = cleanedWords.reduce((a, b) => a.length > b.length ? a : b);
          if (longestWord.length >= 5) {
            cardName = longestWord;
          } else {
            cardName = cleanedWords.join(' ');
          }
        } else {
          cardName = cleanedWords.join(' ');
        }
      } else {
        // Fallback: use original if cleaning removed everything
        cardName = potentialCardNames[0].text;
      }
      
      // Final cleanup
      cardName = cardName
        .replace(/^(pokemon|pokémon|poké)\s*/i, '')
        .replace(/\s*(pokemon|pokémon|poké)$/i, '')
        .replace(/^Je\s+/i, '') // Remove "Je" prefix
        .replace(/^Th\s+/i, '') // Remove "Th" prefix
        .replace(/^Tha\s+/i, '') // Remove "Tha" prefix
        .replace(/^The\s+/i, '') // Remove "The" prefix
        .replace(/[^\w\s-]/g, ' ') // Remove special characters except hyphens
        .replace(/\s+/g, ' ') // Normalize whitespace
        .trim();
      
      // Fix common OCR mistakes in card names
      if (cardName.length > 2) {
        cardName = cardName
          .replace(/Char1zard/gi, 'Charizard')
          .replace(/P1kachu/gi, 'Pikachu')
          .replace(/Blast0ise/gi, 'Blastoise')
          .replace(/Venusaur/gi, 'Venusaur')
          .replace(/Mewtw0/gi, 'Mewtwo')
          .trim();
      }
    }

    // If we still don't have a card name, try using the longest word/phrase
    if (!cardName && allWords.length > 0) {
      // Find the longest meaningful word/phrase
      const meaningfulWords = allWords.filter(w => w.length > 2 && !['the', 'and', 'or', 'for'].includes(w.toLowerCase()));
      if (meaningfulWords.length > 0) {
        cardName = meaningfulWords.slice(0, 3).join(' '); // Take first 3 words
      }
    }

    console.log('🔍 Extracted card info:', { 
      cardName, 
      cardNumber, 
      hp, 
      attackName, 
      attackDamage,
      allWords: allWords.slice(0, 10) 
    });
    return { cardName, cardNumber, hp, attackName, attackDamage, allWords };
  };

  // Search for matching cards in database with multiple fallback strategies
  const searchMatchingCards = async (cardInfo) => {
    try {
      const searchStrategies = [];
      
      // Build query parameters for filtering
      const queryParams = new URLSearchParams();
      queryParams.append('q', cardInfo.cardName || '');
      
      // Add HP filter if found
      if (cardInfo.hp) {
        queryParams.append('hp', cardInfo.hp.toString());
      }
      
      // Add attack damage filter if found
      if (cardInfo.attackDamage) {
        queryParams.append('damage', cardInfo.attackDamage.toString());
      }
      
      // Add energy type filter if detected from color analysis
      if (detectedEnergyType) {
        queryParams.append('energyType', detectedEnergyType);
      }
      
      // Strategy 1: Full query with card name, HP, damage, and energy type (most specific)
      if (cardInfo.cardName && cardInfo.cardNumber && cardInfo.hp && cardInfo.attackDamage && detectedEnergyType) {
        const params = new URLSearchParams(queryParams);
        params.set('q', `${cardInfo.cardName} ${cardInfo.cardNumber}`);
        searchStrategies.push({ query: `${cardInfo.cardName} ${cardInfo.cardNumber}`, params });
      }
      
      // Strategy 1a: Card name with HP, damage, and energy type (no card number)
      if (cardInfo.cardName && cardInfo.hp && cardInfo.attackDamage && detectedEnergyType) {
        const params = new URLSearchParams(queryParams);
        params.set('q', cardInfo.cardName);
        searchStrategies.push({ query: cardInfo.cardName, params });
      }
      
      // Strategy 2: Card name with HP and damage
      if (cardInfo.cardName && cardInfo.hp && cardInfo.attackDamage) {
        const params = new URLSearchParams(queryParams);
        params.set('q', cardInfo.cardName);
        // Remove energy type if not available
        if (!detectedEnergyType) params.delete('energyType');
        searchStrategies.push({ query: cardInfo.cardName, params });
      }
      
      // Strategy 2a: Card name with HP and energy type
      if (cardInfo.cardName && cardInfo.hp && detectedEnergyType) {
        const params = new URLSearchParams(queryParams);
        params.set('q', cardInfo.cardName);
        params.delete('damage'); // Remove damage if not available
        searchStrategies.push({ query: cardInfo.cardName, params });
      }
      
      // Strategy 2b: Card name with damage and energy type
      if (cardInfo.cardName && cardInfo.attackDamage && detectedEnergyType) {
        const params = new URLSearchParams(queryParams);
        params.set('q', cardInfo.cardName);
        params.delete('hp'); // Remove HP if not available
        searchStrategies.push({ query: cardInfo.cardName, params });
      }
      
      // Strategy 3: Card name with HP only
      if (cardInfo.cardName && cardInfo.hp) {
        const params = new URLSearchParams(queryParams);
        params.set('q', cardInfo.cardName);
        params.delete('damage'); // Remove damage if not available
        searchStrategies.push({ query: cardInfo.cardName, params });
      }
      
      // Strategy 4: Card name with damage only
      if (cardInfo.cardName && cardInfo.attackDamage) {
        const params = new URLSearchParams(queryParams);
        params.set('q', cardInfo.cardName);
        params.delete('hp'); // Remove HP if not available
        searchStrategies.push({ query: cardInfo.cardName, params });
      }
      
      // Strategy 5: Full query with card name and number (no filters)
      if (cardInfo.cardName && cardInfo.cardNumber) {
        const params = new URLSearchParams();
        params.append('q', `${cardInfo.cardName} ${cardInfo.cardNumber}`);
        searchStrategies.push({ query: `${cardInfo.cardName} ${cardInfo.cardNumber}`, params });
      }
      
      // Strategy 6: Just card name
      if (cardInfo.cardName) {
        const params = new URLSearchParams();
        params.append('q', cardInfo.cardName);
        searchStrategies.push({ query: cardInfo.cardName, params });
        
        // Strategy 6a: First word of card name (common Pokemon names are single words)
        const firstWord = cardInfo.cardName.split(/\s+/)[0];
        if (firstWord && firstWord.length > 2) {
          const params = new URLSearchParams();
          params.append('q', firstWord);
          searchStrategies.push({ query: firstWord, params });
        }
      }
      
      // Strategy 7: Just card number (if we have it)
      if (cardInfo.cardNumber) {
        const params = new URLSearchParams();
        params.append('q', cardInfo.cardNumber);
        searchStrategies.push({ query: cardInfo.cardNumber, params });
      }
      
      // Strategy 8: Try individual words from OCR (prioritize longer words, exclude OCR artifacts)
      if (cardInfo.allWords && cardInfo.allWords.length > 0) {
        const meaningfulWords = cardInfo.allWords
          .filter(w => {
            const trimmed = w.trim();
            // Exclude very short words (OCR artifacts)
            if (trimmed.length <= 2) return false;
            // Exclude common stop words
            if (['the', 'and', 'or', 'for', 'pokemon', 'pokémon', 'je', 'th'].includes(trimmed.toLowerCase())) return false;
            // Exclude pure numbers
            if (trimmed.match(/^\d+$/)) return false;
            return true;
          })
          .sort((a, b) => b.length - a.length) // Longer words first (more likely to be card names)
          .slice(0, 5); // Try more words
        meaningfulWords.forEach(word => {
          // Clean up word
          const cleanWord = word.replace(/[^\w]/g, '').trim();
          if (cleanWord.length > 3) { // Require at least 3 chars
            const params = new URLSearchParams();
            params.append('q', cleanWord);
            // Check if this word is already in strategies
            const alreadyExists = searchStrategies.some(s => s.query === cleanWord);
            if (!alreadyExists) {
              searchStrategies.push({ query: cleanWord, params });
            }
          }
        });
      }
      
      // Strategy 9: Try partial card name (first 2-3 words)
      if (cardInfo.cardName) {
        const words = cardInfo.cardName.split(/\s+/);
        if (words.length > 1) {
          // Try first 2 words
          const twoWords = words.slice(0, 2).join(' ');
          const alreadyExists = searchStrategies.some(s => s.query === twoWords);
          if (!alreadyExists) {
            const params = new URLSearchParams();
            params.append('q', twoWords);
            searchStrategies.push({ query: twoWords, params });
          }
          // Try first word only (if not already added)
          if (words[0] && words[0].length > 3) {
            const alreadyExists = searchStrategies.some(s => s.query === words[0]);
            if (!alreadyExists) {
              const params = new URLSearchParams();
              params.append('q', words[0]);
              searchStrategies.push({ query: words[0], params });
            }
          }
        }
      }
      
      console.log('🔍 Search strategies:', searchStrategies.map(s => ({
        query: s.query,
        hp: s.params.get('hp'),
        damage: s.params.get('damage')
      })));
      
      // Try each search strategy until we find results
      for (let i = 0; i < searchStrategies.length; i++) {
        const strategy = searchStrategies[i];
        if (!strategy.query || strategy.query.trim().length === 0) continue;
        
        // Update UI to show current search
        const searchDesc = strategy.params.get('hp') || strategy.params.get('damage') 
          ? `"${strategy.query}" (HP: ${strategy.params.get('hp') || '?'}, Damage: ${strategy.params.get('damage') || '?'})`
          : `"${strategy.query}"`;
        setCurrentSearchQuery(strategy.query);
        setSearchStatus(`Searching: ${searchDesc} (${i + 1}/${searchStrategies.length})...`);
        
        // Build the API URL with all parameters
        const apiPath = `${API_URL}/api/cards/search`;
        const fullUrl = `${apiPath}?${strategy.params.toString()}&limit=20`;
        
        console.log(`🔍 Trying search: "${strategy.query}"`);
        console.log(`🔗 Search params:`, Object.fromEntries(strategy.params));
        console.log(`🔗 Full URL: ${fullUrl}`);
        
        const response = await fetch(
          fullUrl,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'omit'
          }
        ).catch(fetchError => {
          console.error('❌ Fetch error:', fetchError);
          console.error('❌ Fetch error details:', {
            name: fetchError.name,
            message: fetchError.message,
            stack: fetchError.stack
          });
          throw new Error(`Network error: ${fetchError.message}. Check if the API server is running and accessible.`);
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error');
          console.error(`❌ Search failed for "${strategy.query}":`, response.status, errorText);
          continue;
        }

        const data = await response.json();
        
        console.log(`📦 API Response for "${strategy.query}":`, {
          success: data.success,
          hasData: !!data.data,
          dataLength: data.data?.length || 0,
          dataType: Array.isArray(data.data) ? 'array' : typeof data.data,
          sample: data.data?.[0]
        });
        
        // Handle different response formats
        const cards = data.data || data.cards || [];
        
        if (data.success && cards.length > 0) {
          console.log(`✅ Found ${cards.length} matches for "${strategy.query}"`);
          console.log(`✅ Sample match:`, cards[0]);
          setMatchedCards(cards);
          setError(null);
          setSearchStatus(`Found ${cards.length} match${cards.length > 1 ? 'es' : ''} for ${searchDesc}`);
          if (!recognizedText) {
            setRecognizedText(strategy.query); // Show what was searched
          }
          return; // Success! Stop trying other strategies
        } else {
          console.log(`⚠️ No results for "${strategy.query}". Response structure:`, {
            success: data.success,
            hasData: !!data.data,
            hasCards: !!data.cards,
            keys: Object.keys(data)
          });
          setSearchStatus(`No results for ${searchDesc}... trying next search`);
        }
      }
      
      // If we get here, no strategies worked
      console.warn('⚠️ No matches found with any search strategy');
      setSearchStatus('No matches found with any search strategy');
      setError(`No matching cards found. Try "Search Manually" or scan again with better lighting.`);
    } catch (err) {
      console.error('❌ Search error:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        apiUrl: API_URL,
        hostname: typeof window !== 'undefined' ? window.location.hostname : 'server-side'
      });
      setError(`Failed to search for card: ${err.message}. Please check your connection and try again.`);
    }
  };

  // Cleanup auto-detection on unmount
  useEffect(() => {
    return () => {
      if (autoDetectStopRef.current) {
        autoDetectStopRef.current();
        autoDetectStopRef.current = null;
      }
    };
  }, []);

  // Auto-add card to collection
  const handleAutoAddCard = useCallback(async (card) => {
    if (!selectedCollectionId || !card) {
      console.warn('⚠️ Cannot auto-add: no collection selected or no card');
      return;
    }

    try {
      addDebugLog('🔄 Auto-adding card to collection...', { cardName: card.name, collectionId: selectedCollectionId });
      
      // Prepare card data for adding
      const cardData = {
        id: card.product_id || card.cardId || card.id,
        name: card.name || card.cleanName,
        imageUrl: card.imageUrl || card.images?.small || card.images?.large,
        set_name: card.set_name || card.clean_set_name,
        ext_number: card.ext_number,
        ext_rarity: card.ext_rarity,
        current_value: card.current_value || card.price || card.current_value || 0
      };

      // Add card to collection with default values
      const success = userDatabase.addCardToCollection(
        selectedCollectionId,
        cardData,
        1, // quantity
        'Near Mint', // condition
        'Normal', // variant
        null, // grade
        null, // gradingService
        null, // pricePaid
        '' // notes
      );

      if (success) {
        addDebugLog('✅ Card auto-added successfully', { cardName: card.name });
        setAddedCard(card);
        setShowScanResultPopover(true);
        
        // Auto-dismiss popover after 5 seconds if user doesn't interact
        setTimeout(() => {
          setShowScanResultPopover(false);
        }, 5000);
      } else {
        addDebugLog('❌ Failed to auto-add card', { cardName: card.name });
      }
    } catch (error) {
      console.error('Error auto-adding card:', error);
      addDebugLog('❌ Error auto-adding card', { error: error.message });
    }
  }, [selectedCollectionId, addDebugLog]);

  // Handle capture button click
  const handleCapture = () => {
    // Check scan limit for non-pro users
    if (!isPro && scanCount >= SCAN_LIMIT) {
      setShowProUpgradeModal(true);
      return;
    }
    
    capture();
  };

  // Handle retake
  const handleRetake = () => {
    setImgSrc(null);
    setProcessedImgSrc(null);
    setRecognizedText('');
    setMatchedCards([]);
    setError(null);
    setExtractedCardInfo(null);
    setShowManualInput(false);
    setManualSearchQuery('');
    setHasCountedThisScan(false); // Allow scan count to be incremented again
    
    // If auto-detect was enabled, restart it if it stopped
    if (autoDetect && webcamRef.current?.video && hasPermission && !autoDetectStopRef.current) {
      console.log('🔄 Restarting auto-detection after retake...');
      const videoElement = webcamRef.current.video;
      autoDetectStopRef.current = startAutoDetection(
        videoElement,
        async (capturedImage, detectionInfo) => {
          console.log('🎯 Card auto-detected!', detectionInfo);
          // Auto-capture
          await capture(capturedImage);
          // Wait for imgSrc to be set, then auto-process
          let retries = 0;
          const maxRetries = 20; // 1 second max wait
          const checkAndProcess = () => {
            retries++;
            // Use the captured image directly if imgSrc isn't set yet
            const imageToUse = imgSrc || capturedImage;
            if (imageToUse || retries >= maxRetries) {
              if (imageToUse) {
                processImage(imageToUse);
              } else {
                console.warn('⚠️ Could not get image for processing');
              }
            } else {
              // Retry after a short delay
              setTimeout(checkAndProcess, 50);
            }
          };
          setTimeout(checkAndProcess, 200);
        },
        {
          detectionInterval: 500,
          minConfidence: 0.5,
          minArea: 20000,
          stabilizationFrames: 2,
          onDetectionUpdate: (status) => {
            console.log('🔄 Updating detection status:', status);
            setDetectionStatus(status);
          }
        }
      );
    }
  };

  // Handle card selection
  const handleCardSelect = (card) => {
    if (onScanComplete) {
      onScanComplete(card);
    }
    onClose();
  };

  // Handle manual entry - show search modal
  const handleManualEntry = () => {
    // Close scanner and trigger search with recognized text (even if garbled)
    // The parent component will handle showing the search modal
    if (onScanComplete) {
      onScanComplete({
        name: recognizedText.split('\n')[0] || '',
        manualEntry: true,
        searchQuery: recognizedText
      });
    }
    onClose();
  };

  // Handle manual search button (always available)
  const handleManualSearch = () => {
    // Close scanner and let user search manually
    if (onScanComplete) {
      onScanComplete({
        name: '',
        manualEntry: true,
        searchQuery: ''
      });
    }
    onClose();
  };

  // Mobile-friendly video constraints
  const videoConstraints = {
    facingMode: facingMode,
    // Don't specify exact dimensions - let browser choose best available
    // Mobile devices often don't support 1280x720
    width: { ideal: 1280, min: 640 },
    height: { ideal: 720, min: 480 },
    // Additional mobile-friendly settings
    aspectRatio: { ideal: 16/9 },
    // Flash/torch support
    torch: flashOn
  };

  // Handle camera errors
  const handleUserMediaError = useCallback((error) => {
    console.error('Camera error:', error);
    setCameraError(error.message || 'Failed to access camera');
    setHasPermission(false);
    
    // Provide helpful error messages
    const errorMessage = error.message || error.toString() || '';
    
    if (errorMessage.includes('not implemented') || errorMessage.includes('getUserMedia')) {
      // This usually means HTTP instead of HTTPS
      const protocol = window.location.protocol;
      if (protocol === 'http:') {
        setError('Camera access requires HTTPS. Please access the app via HTTPS or use a browser that allows camera access over HTTP (like Chrome on Android with proper permissions).');
      } else {
        setError('Camera API not supported in this browser. Please use a modern browser like Chrome, Safari, or Firefox.');
      }
    } else if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
      setError('Camera permission denied. Please allow camera access in your browser settings.');
    } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      setError('No camera found. Please ensure your device has a camera.');
    } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      setError('Camera is already in use by another application.');
    } else {
      setError(`Camera error: ${error.message || 'Unknown error'}`);
    }
  }, []);

  // Check camera API support on mount
  useEffect(() => {
    // Check if getUserMedia is available
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) ||
                            !!(navigator.getUserMedia) ||
                            !!(navigator.webkitGetUserMedia) ||
                            !!(navigator.mozGetUserMedia) ||
                            !!(navigator.msGetUserMedia);
    
    if (!hasGetUserMedia) {
      const protocol = window.location.protocol;
      let errorMsg = 'Camera API not supported in this browser.';
      
      if (protocol === 'http:') {
        errorMsg = 'Camera access requires HTTPS. Many browsers block camera access over HTTP for security. Please access the app via HTTPS or use Chrome on Android which may allow camera access over HTTP with proper permissions.';
      }
      
      setError(errorMsg);
      setHasPermission(false);
      setCameraError('Camera API not supported');
    } else {
      // Check if we're on HTTP and warn
      if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
        console.warn('⚠️ Camera access may be blocked on HTTP. Consider using HTTPS or localhost.');
      }
    }
  }, []);

  // Process image when captured (image matching only, no OCR)
  useEffect(() => {
    if (processedImgSrc) {
      // Increment scan count only once per capture (for non-pro users)
      if (!isPro && !hasCountedThisScan) {
        const newCount = scanCount + 1;
        setScanCount(newCount);
        localStorage.setItem('cardScanner_scanCount', newCount.toString());
        setHasCountedThisScan(true); // Mark this scan as counted
      }
      
      // Process image using image matching only
      processImage(processedImgSrc);
    }
  }, [processedImgSrc, isPro, scanCount, hasCountedThisScan]);

  // Get selected collection name
  const selectedCollection = availableCollections.find(c => c.id === selectedCollectionId);
  const selectedCollectionName = selectedCollection?.name || 'No Collection Selected';

  // Handle popover actions
  const handleEditCard = () => {
    setShowScanResultPopover(false);
    // Trigger the add card modal with the added card and all matches for review
    if (onScanComplete && addedCard) {
      onScanComplete({
        ...addedCard,
        allMatches: allMatches, // Include all matches for review toggle
        showMatchesToggle: true // Flag to show matches toggle in edit modal
      });
    }
  };

  const handleReviewMatches = () => {
    setShowScanResultPopover(false);
    // Show all matches for user to select
    setMatchedCards(allMatches);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black z-[10005] flex flex-col">
      {/* Header - Fixed at top */}
      <div className={`${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-md px-4 py-3 flex items-center justify-between border-b ${isDark ? 'border-gray-800' : 'border-gray-200'} z-10`}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Scan Card
          </h2>
          {/* Collection Selector */}
          <div className="relative flex-1 max-w-xs collection-selector">
            <button
              onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}
              className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                isDark 
                  ? 'bg-gray-800 border-gray-700 text-white hover:bg-gray-700' 
                  : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50'
              } flex items-center justify-between gap-2`}
            >
              <span className="truncate">{selectedCollectionName}</span>
              <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${showCollectionDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showCollectionDropdown && (
              <div className={`absolute top-full left-0 right-0 mt-1 max-h-60 overflow-y-auto rounded-lg shadow-lg border z-20 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'
              }`}>
                {availableCollections.length > 0 ? (
                  availableCollections.map((collection) => (
                    <button
                      key={collection.id}
                      onClick={() => {
                        setSelectedCollectionId(collection.id);
                        setShowCollectionDropdown(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-500 hover:text-white transition-colors ${
                        selectedCollectionId === collection.id
                          ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900'
                          : isDark ? 'text-gray-300' : 'text-gray-900'
                      }`}
                    >
                      {collection.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500 text-center">
                    No collections available. Create one first.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'} transition-colors`}
        >
          <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Camera/Image Preview - Fullscreen */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {!imgSrc ? (
          <>
            {cameraError || error ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white z-30 bg-black">
                <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-semibold mb-2 text-center">Camera Access Required</p>
                <p className="text-sm text-gray-300 text-center mb-4 px-4 max-w-md">
                  {error || cameraError || 'Unable to access camera'}
                </p>
                {window.location.protocol === 'http:' && (
                  <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 mb-4 max-w-md">
                    <p className="text-xs text-yellow-200 text-center mb-2">
                      <strong>Note:</strong> Camera access requires HTTPS. You're currently using HTTP.
                    </p>
                    <div className="text-xs text-yellow-200 space-y-2">
                      <p><strong>Option 1:</strong> Use Chrome with insecure origins enabled:</p>
                      <code className="bg-black/30 px-2 py-1 rounded block text-left text-[10px] break-all">
                        chrome://flags/#unsafely-treat-insecure-origin-as-secure
                      </code>
                      <p className="text-[10px]">Add your IP: <code className="bg-black/30 px-1 rounded">http://192.168.x.x:3000</code></p>
                      <p className="mt-2"><strong>Option 2:</strong> Use localhost instead of IP (Chrome allows HTTP on localhost):</p>
                      <code className="bg-black/30 px-2 py-1 rounded block text-left text-[10px]">
                        http://localhost:3000
                      </code>
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setCameraError(null);
                      setError(null);
                      setHasPermission(null);
                      // Trigger re-mount of Webcam component
                      window.location.reload();
                    }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleManualSearch}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
                  >
                    Search Manually
                  </button>
                </div>
              </div>
            ) : (
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="absolute inset-0 w-full h-full object-cover"
                key={`webcam-${facingMode}-${flashOn}`}
                onUserMedia={(stream) => {
                  console.log('✅ Camera access granted');
                  setHasPermission(true);
                  setCameraError(null);
                  
                      // Start auto-detection if enabled
                      if (autoDetect && webcamRef.current?.video) {
                        const videoElement = webcamRef.current.video;
                        console.log('🚀 Starting auto-detection from onUserMedia', {
                          videoWidth: videoElement.videoWidth,
                          videoHeight: videoElement.videoHeight,
                          readyState: videoElement.readyState
                        });
                        autoDetectStopRef.current = startAutoDetection(
                          videoElement,
                          (capturedImage, detectionInfo) => {
                            console.log('🎯 Card auto-detected!', detectionInfo);
                            capture(capturedImage);
                          },
                          {
                            detectionInterval: 500,
                            minConfidence: 0.5,
                            minArea: 20000,
                            stabilizationFrames: 2,
                            onDetectionUpdate: (status) => {
                              console.log('🔄 Updating detection status:', status);
                              setDetectionStatus(status);
                              // Debug logging
                              if (status.detected && status.state !== 'scanning') {
                                console.log('📊 Detection status:', {
                                  state: status.state,
                                  confidence: Math.round(status.confidence * 100),
                                  hasEdges: !!status.edges,
                                  corners: status.edges?.corners?.length || 0
                                });
                              }
                            }
                          }
                        );
                      }
                }}
                  onUserMediaError={handleUserMediaError}
                // Force re-render when facingMode changes
                key={facingMode}
              />
            )}
            {/* Scanning overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                <div className="text-white text-lg font-semibold">Scanning...</div>
              </div>
            )}
            {/* Dynamic edge detection overlay - replaces fixed guide box */}
            {autoDetect ? (
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Darkened overlay */}
                <div className="absolute inset-0 bg-black/30"></div>
                
                {/* Draw detected card edges - Green outline when detected */}
                {detectionStatus?.edges?.corners && detectionStatus.state !== 'scanning' && webcamRef.current?.video && (
                  <svg 
                    className="absolute inset-0 w-full h-full" 
                    style={{ pointerEvents: 'none' }}
                    viewBox={`0 0 ${webcamRef.current.video.videoWidth || 1280} ${webcamRef.current.video.videoHeight || 720}`}
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <polygon
                      points={detectionStatus.edges.corners.map(c => `${c[0]},${c[1]}`).join(' ')}
                      fill="none"
                      stroke={detectionStatus.state === 'found' ? '#10b981' : '#ffffff'}
                      strokeWidth={detectionStatus.state === 'found' ? 4 : 2}
                      strokeDasharray={detectionStatus.state === 'unstable' ? '10,5' : '0'}
                      opacity={detectionStatus.state === 'found' ? 1 : 0.5}
                      className="transition-all duration-300"
                    />
                    {/* Corner markers - Green when found */}
                    {detectionStatus.edges.corners.map((corner, idx) => (
                      <circle
                        key={idx}
                        cx={corner[0]}
                        cy={corner[1]}
                        r={detectionStatus.state === 'found' ? 10 : 8}
                        fill={detectionStatus.state === 'found' ? '#10b981' : '#ffffff'}
                        className="transition-all duration-300"
                      />
                    ))}
                  </svg>
                )}
              </div>
            ) : (
              // Fixed guide overlay (when auto-detect is off)
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="relative">
                  <div className="border-2 border-white/70 rounded-lg shadow-lg" style={{ width: '280px', height: '390px' }}>
                    <div className="absolute -top-2 -left-2 w-6 h-6 border-l-2 border-t-2 border-white rounded-tl-lg"></div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 border-r-2 border-t-2 border-white rounded-tr-lg"></div>
                    <div className="absolute -bottom-2 -left-2 w-6 h-6 border-l-2 border-b-2 border-white rounded-bl-lg"></div>
                    <div className="absolute -bottom-2 -right-2 w-6 h-6 border-r-2 border-b-2 border-white rounded-br-lg"></div>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <img src={imgSrc} alt="Captured card" className="w-full h-full object-contain" />
          </div>
        )}
      </div>

      {/* Controls - Fixed at bottom */}
      <div className={`${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-md px-6 py-6 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} z-10`}>
        {!imgSrc ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center justify-center gap-6">
              {/* Camera flip button */}
              <button
                onClick={() => setFacingMode(facingMode === 'user' ? 'environment' : 'user')}
                className={`p-3 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
              >
                <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>

              {/* Capture button - Always available for manual capture */}
              <button
                onClick={handleCapture}
                className="w-20 h-20 rounded-full bg-blue-500 hover:bg-blue-600 border-4 border-white shadow-2xl transition-all hover:scale-105 active:scale-95"
              >
                <div className="w-full h-full rounded-full bg-blue-500"></div>
              </button>

              {/* Flash button */}
              <button
                onClick={() => setFlashOn(!flashOn)}
                className={`p-3 rounded-full ${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
              >
                <svg className={`w-6 h-6 ${flashOn ? 'text-yellow-400' : isDark ? 'text-white' : 'text-gray-900'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">

            {/* Error message */}
            {error && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-800'} text-sm`}>
                {error}
              </div>
            )}

            {/* Search status - shows what's being searched */}
            {searchStatus && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-200 border border-blue-700/50' : 'bg-blue-50 text-blue-800 border border-blue-200'} text-sm`}>
                <div className="flex items-center gap-2">
                  {recognizing && (
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  <span>{searchStatus}</span>
                </div>
              </div>
            )}

            {/* Show recognized text and extracted info for user feedback */}
            {recognizedText && (
              <div className={`p-2 rounded text-xs ${isDark ? 'bg-gray-800/50 text-gray-400' : 'bg-gray-100 text-gray-600'} max-h-24 overflow-y-auto mb-2`}>
                <strong>Recognized Text:</strong> {recognizedText.substring(0, 150)}
                {recognizedText.length > 150 && '...'}
              </div>
            )}
            
            {/* Show extracted card attributes */}
            {extractedCardInfo && (extractedCardInfo.cardName || extractedCardInfo.cardNumber || extractedCardInfo.hp || extractedCardInfo.attackDamage) && (
              <div className={`p-2 rounded text-xs ${isDark ? 'bg-green-900/20 text-green-200 border border-green-700/50' : 'bg-green-50 text-green-800 border border-green-200'} mb-2`}>
                <strong>Extracted Attributes:</strong>
                <div className="mt-1 space-y-1">
                  {extractedCardInfo.cardName && (
                    <div>📛 Card Name: {extractedCardInfo.cardName}</div>
                  )}
                  {extractedCardInfo.cardNumber && (
                    <div>🔢 Card Number: {extractedCardInfo.cardNumber}</div>
                  )}
                  {extractedCardInfo.hp && (
                    <div>💚 HP: {extractedCardInfo.hp}</div>
                  )}
                  {extractedCardInfo.attackDamage && (
                    <div>⚔️ Attack Damage: {extractedCardInfo.attackDamage}</div>
                  )}
                  {extractedCardInfo.attackName && (
                    <div>📝 Attack: {extractedCardInfo.attackName}</div>
                  )}
                </div>
              </div>
            )}
            

            {/* Matched cards */}
            {matchedCards.length > 0 && (
              <div className="space-y-2">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'} text-center`}>
                  Found {matchedCards.length} matching card{matchedCards.length > 1 ? 's' : ''}:
                  {matchedCards[0]?.similarity && (
                    <span className={`ml-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      (Top match: {Math.round(matchedCards[0].similarity * 100)}% similar)
                    </span>
                  )}
                </h3>
                <div className="max-h-[40vh] overflow-y-auto space-y-2">
                  {matchedCards.map((card, index) => {
                    const cardId = card.product_id || card.id || `card-${index}`;
                    const cardName = card.clean_name || card.name || 'Unknown Card';
                    const cardImage = card.image_url || card.images?.small || card.images?.large;
                    const setName = card.clean_set_name || card.set_name;
                    const cardNumber = card.ext_number || card.number;
                    
                    console.log(`📋 Rendering card ${index}:`, { cardId, cardName, hasImage: !!cardImage });
                    
                    return (
                      <button
                        key={cardId}
                        onClick={() => handleCardSelect(card)}
                        className={`w-full p-3 rounded-lg border-2 ${isDark ? 'bg-gray-800/90 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'} transition-colors text-left`}
                      >
                        <div className="flex items-center gap-3">
                          {cardImage && (
                            <img 
                              src={cardImage} 
                              alt={cardName}
                              className="w-16 h-20 object-contain rounded"
                              onError={(e) => {
                                console.warn(`Failed to load image for ${cardName}:`, cardImage);
                                e.target.style.display = 'none';
                              }}
                            />
                          )}
                          <div className="flex-1">
                            <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {cardName}
                            </div>
                            {setName && (
                              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {setName}
                              </div>
                            )}
                            {cardNumber && (
                              <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                                #{cardNumber}
                              </div>
                            )}
                            {card.similarity && (
                              <div className={`text-xs ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>
                                {Math.round(card.similarity * 100)}% match
                                {card.matchReasons && (
                                  <span className={`ml-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                                    ({card.matchReasons})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            
            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRetake}
                className={`flex-1 py-3 px-4 rounded-lg font-medium ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-900'} transition-colors`}
              >
                Retake Photo
              </button>
              <button
                onClick={handleManualSearch}
                className={`flex-1 py-3 px-4 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors`}
              >
                Search Manually
              </button>
            </div>
            
            {/* Manual search input */}
            {showManualInput && (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800/90 border border-gray-700' : 'bg-white border border-gray-200'} space-y-2`}>
                <label className={`block text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Enter card name or number:
                </label>
                <input
                  type="text"
                  value={manualSearchQuery}
                  onChange={(e) => setManualSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleManualSearchSubmit()}
                  placeholder="e.g., Charizard, Pikachu VMAX, 25/102"
                  className={`w-full px-3 py-2 rounded-lg border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleManualSearchSubmit}
                    disabled={!manualSearchQuery.trim() || recognizing}
                    className="flex-1 py-2 px-4 rounded-lg font-medium bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 disabled:opacity-50 text-white transition-colors"
                  >
                    Search
                  </button>
                  <button
                    onClick={() => {
                      setShowManualInput(false);
                      setManualSearchQuery('');
                    }}
                    className="py-2 px-4 rounded-lg font-medium bg-gray-500 hover:bg-gray-600 text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Info about OCR limitations */}
            {recognizedText && matchedCards.length === 0 && !showManualInput && (
              <div className={`mt-3 p-3 rounded-lg ${isDark ? 'bg-yellow-900/20 text-yellow-200 border border-yellow-700/50' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'} text-xs`}>
                <strong>💡 Tip:</strong> OCR may not work well on trading cards. Use "Search Manually" to type the card name instead. The recognized text above can help you type it correctly.
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Scan Result Popover */}
      <ScanResultPopover
        card={addedCard}
        collectionName={selectedCollectionName}
        onEdit={handleEditCard}
        onReviewMatches={handleReviewMatches}
        onDismiss={() => setShowScanResultPopover(false)}
        isVisible={showScanResultPopover}
      />
      
      {/* Scan limit indicator */}
      {!isPro && (
        <div className={`${isDark ? 'bg-black/80' : 'bg-white/80'} backdrop-blur-md px-4 py-2 border-t ${isDark ? 'border-gray-800' : 'border-gray-200'} text-center`}>
          <div className="flex items-center justify-center gap-3">
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Scans remaining: <span className={`font-semibold ${scanCount >= SCAN_LIMIT ? 'text-red-500' : isDark ? 'text-white' : 'text-gray-900'}`}>
                {Math.max(0, SCAN_LIMIT - scanCount)}
              </span> / {SCAN_LIMIT}
            </p>
            {scanCount > 0 && (
              <button
                onClick={() => {
                  setScanCount(0);
                  localStorage.removeItem('cardScanner_scanCount');
                  setHasCountedThisScan(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-400 underline"
                title="Reset scan count"
              >
                Reset
              </button>
            )}
          </div>
          {scanCount >= SCAN_LIMIT && (
            <button
              onClick={() => setShowProUpgradeModal(true)}
              className="mt-2 text-blue-500 hover:text-blue-400 text-sm font-medium underline"
            >
              Upgrade to Pro for unlimited scans
            </button>
          )}
        </div>
      )}
      
      {/* Pro Upgrade Modal */}
      <ProUpgradeModal
        isOpen={showProUpgradeModal}
        onClose={() => setShowProUpgradeModal(false)}
        feature="scanner"
        limit={SCAN_LIMIT}
        current={scanCount}
      />
      
    </div>
  );
};

export default CardScanner;

