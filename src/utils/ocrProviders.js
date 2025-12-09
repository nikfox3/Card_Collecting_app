// OCR Provider utilities - supports multiple OCR backends
// Currently supports: Tesseract.js (local) and Google Cloud Vision API (cloud)

/**
 * Google Cloud Vision API OCR
 * More accurate than Tesseract, especially for card text
 * Requires: GOOGLE_CLOUD_VISION_API_KEY in environment
 */
export const googleVisionOCR = async (imageDataUrl) => {
  const apiKey = import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
  
  if (!apiKey) {
    throw new Error('Google Cloud Vision API key not configured');
  }

  // Convert data URL to base64
  const base64Image = imageDataUrl.split(',')[1];

  try {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: 'TEXT_DETECTION',
                  maxResults: 10,
                },
              ],
              imageContext: {
                // Optimize for card text recognition
                languageHints: ['en'],
              },
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      const errorMessage = error.error?.message || 'Unknown error';
      
      // Check for permission/billing errors
      if (errorMessage.includes('permission') || errorMessage.includes('billing') || 
          errorMessage.includes('resourcemanager') || response.status === 403) {
        throw new Error(`Google Cloud Vision API permission error. Please:\n1. Enable Cloud Vision API: https://console.cloud.google.com/apis/library/vision.googleapis.com\n2. Enable billing for your project\n3. Verify API key has Cloud Vision API enabled\n\nError: ${errorMessage}`);
      }
      
      throw new Error(`Google Vision API error: ${errorMessage}`);
    }

    const data = await response.json();
    
    if (data.responses?.[0]?.textAnnotations?.[0]) {
      const fullText = data.responses[0].textAnnotations[0].description;
      const words = data.responses[0].textAnnotations.slice(1).map(annotation => ({
        text: annotation.description,
        boundingBox: annotation.boundingPoly,
      }));
      
      return {
        text: fullText,
        words: words,
        confidence: 0.95, // Google Vision is generally very accurate
        provider: 'google-vision',
      };
    }

    return {
      text: '',
      words: [],
      confidence: 0,
      provider: 'google-vision',
    };
  } catch (error) {
    console.error('Google Vision API error:', error);
    throw error;
  }
};

/**
 * Tesseract.js OCR (local, free, but less accurate)
 */
export const tesseractOCR = async (imageDataUrl, worker) => {
  if (!worker) {
    throw new Error('Tesseract worker not initialized');
  }

  try {
    const { data } = await worker.recognize(imageDataUrl, {
      rectangle: undefined,
    });

    return {
      text: data.text,
      words: data.words || [],
      confidence: data.confidence || 0.5,
      provider: 'tesseract',
    };
  } catch (error) {
    console.error('Tesseract OCR error:', error);
    throw error;
  }
};

/**
 * Smart OCR selector - uses Google Vision if available, falls back to Tesseract
 */
export const smartOCR = async (imageDataUrl, tesseractWorker) => {
  const hasGoogleVision = !!import.meta.env.VITE_GOOGLE_CLOUD_VISION_API_KEY;
  
  if (hasGoogleVision) {
    try {
      console.log('🔍 Using Google Cloud Vision API for OCR...');
      return await googleVisionOCR(imageDataUrl);
    } catch (error) {
      console.warn('⚠️ Google Vision failed, falling back to Tesseract:', error.message);
      // Fall through to Tesseract
    }
  }

  console.log('🔍 Using Tesseract.js for OCR...');
  return await tesseractOCR(imageDataUrl, tesseractWorker);
};

