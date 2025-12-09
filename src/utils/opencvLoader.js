// OpenCV.js loader - loads OpenCV.js dynamically
// OpenCV.js is a large library (~8MB), so we load it on-demand

let cvLoaded = false;
let cvLoadPromise = null;

/**
 * Load OpenCV.js library
 * @returns {Promise} Resolves when OpenCV is loaded
 */
export const loadOpenCV = () => {
  if (cvLoaded) {
    return Promise.resolve(window.cv);
  }
  
  if (cvLoadPromise) {
    return cvLoadPromise;
  }
  
  cvLoadPromise = new Promise((resolve, reject) => {
    // Check if OpenCV is already loaded
    if (window.cv && window.cv.Mat) {
      cvLoaded = true;
      resolve(window.cv);
      return;
    }
    
    // Load OpenCV.js from CDN (using jsdelivr for better reliability)
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/opencv-js@1.2.1/dist/opencv.js';
    script.async = true;
    script.onload = () => {
      // Wait for OpenCV to initialize
      if (window.cv && window.cv.onRuntimeInitialized) {
        window.cv.onRuntimeInitialized = () => {
          cvLoaded = true;
          console.log('✅ OpenCV.js loaded successfully');
          resolve(window.cv);
        };
      } else if (window.cv && window.cv.Mat) {
        // Already initialized
        cvLoaded = true;
        console.log('✅ OpenCV.js already initialized');
        resolve(window.cv);
      } else {
        // Wait a bit for initialization
        setTimeout(() => {
          if (window.cv && window.cv.Mat) {
            cvLoaded = true;
            resolve(window.cv);
          } else {
            reject(new Error('OpenCV failed to initialize'));
          }
        }, 1000);
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load OpenCV.js'));
    };
    document.head.appendChild(script);
  });
  
  return cvLoadPromise;
};

/**
 * Check if OpenCV is loaded
 */
export const isOpenCVLoaded = () => cvLoaded;

