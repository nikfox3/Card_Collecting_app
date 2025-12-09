// API URL utility - automatically detects the correct API URL
// Priority: Environment variable > Production API > Auto-detect

const getApiUrl = () => {
  // 1. Check for environment variable (for production builds)
  // VITE_ prefixed variables are available at build time
  const envApiUrl = import.meta.env.VITE_API_URL;
  if (envApiUrl && envApiUrl.trim() !== '') {
    console.log('✅ Using VITE_API_URL from environment:', envApiUrl);
    return envApiUrl;
  }

  // 2. Check if we're running in the browser
  if (typeof window === 'undefined') {
    return 'http://localhost:3002';
  }

  const hostname = window.location.hostname;
  
  // 3. For mobile apps (Capacitor), use production API or detect
  // Check if running in Capacitor
  const isCapacitor = window.Capacitor || window.CapacitorWeb || 
    (window.location.protocol === 'capacitor:' || 
     window.location.protocol === 'file:');

  if (isCapacitor) {
    // For production mobile app, you should set VITE_API_URL
    // For development/testing, you can use your computer's IP
    // Example: return 'http://192.168.1.100:3002';
    if (envApiUrl && envApiUrl.trim() !== '') {
      return envApiUrl;
    }
    // Default to a placeholder that will show an error
    // User needs to configure VITE_API_URL for mobile
    console.error('⚠️ API URL not configured for mobile! Set VITE_API_URL environment variable.');
    return 'http://localhost:3002'; // This won't work, but prevents crash
  }
  
  // 4. If accessing from localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  
  // 5. If accessing from Vercel (deployed PWA), require environment variable
  if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
    // For Vercel deployments, API URL must be set via environment variable
    // This should point to your deployed API server
    if (envApiUrl && envApiUrl.trim() !== '') {
      return envApiUrl;
    }
    console.error('⚠️ API URL not configured for production! Set VITE_API_URL environment variable in Vercel.');
    console.error('⚠️ Current hostname:', hostname);
    console.error('⚠️ VITE_API_URL value:', envApiUrl);
    // Return production API as fallback
    return 'https://card-collecting-app.onrender.com';
  }
  
  // 6. If accessing from network IP, use the same IP for API
  // This allows mobile devices to connect to the API server
  // BUT: Don't use this for production domains
  if (hostname.match(/^\d+\.\d+\.\d+\.\d+$/)) {
    // This is an IP address (like 192.168.1.240)
    return `http://${hostname}:3002`;
  }
  
  // 7. Fallback: use production API for any other domain
  console.warn('⚠️ Unknown hostname, using production API as fallback:', hostname);
  return 'https://card-collecting-app.onrender.com';
};

export const API_URL = getApiUrl();

// Always log the API URL (not just in dev) to help debug
console.log('🔗 API URL:', API_URL);
console.log('🔗 Environment VITE_API_URL:', import.meta.env.VITE_API_URL || '(not set)');
console.log('🔗 Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
console.log('🔗 Current protocol:', typeof window !== 'undefined' ? window.location.protocol : 'server-side');

