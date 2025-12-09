// API URL utility - automatically detects the correct API URL
// Priority: Environment variable > Production API > Auto-detect

const getApiUrl = () => {
  // 1. Check for environment variable (for production builds)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 2. Check if we're running in the browser
  if (typeof window === 'undefined') {
    return 'http://localhost:3002';
  }

  // 3. For mobile apps (Capacitor), use production API or detect
  // Check if running in Capacitor
  const isCapacitor = window.Capacitor || window.CapacitorWeb || 
    (window.location.protocol === 'capacitor:' || 
     window.location.protocol === 'file:');

  if (isCapacitor) {
    // For production mobile app, you should set VITE_API_URL
    // For development/testing, you can use your computer's IP
    // Example: return 'http://192.168.1.100:3002';
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      return apiUrl;
    }
    // Default to a placeholder that will show an error
    // User needs to configure VITE_API_URL for mobile
    console.error('⚠️ API URL not configured for mobile! Set VITE_API_URL environment variable.');
    return 'http://localhost:3002'; // This won't work, but prevents crash
  }

  const hostname = window.location.hostname;
  
  // 4. If accessing from localhost, use localhost for API
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3002';
  }
  
  // 5. If accessing from Vercel (deployed PWA), require environment variable
  if (hostname.includes('vercel.app') || hostname.includes('vercel.com')) {
    // For Vercel deployments, API URL must be set via environment variable
    // This should point to your deployed API server
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) {
      return apiUrl;
    }
    console.error('⚠️ API URL not configured for production! Set VITE_API_URL environment variable in Vercel.');
    // Return a placeholder that will show an error
    return 'https://api.cardstax.app'; // Placeholder - user needs to configure
  }
  
  // 6. If accessing from network IP, use the same IP for API
  // This allows mobile devices to connect to the API server
  return `http://${hostname}:3002`;
};

export const API_URL = getApiUrl();

// Log the API URL in development
if (import.meta.env.DEV) {
  console.log('🔗 API URL:', API_URL);
  console.log('🔗 Current hostname:', typeof window !== 'undefined' ? window.location.hostname : 'server-side');
  console.log('🔗 Current protocol:', typeof window !== 'undefined' ? window.location.protocol : 'server-side');
}

