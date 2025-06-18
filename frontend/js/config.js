// Configuration for different environments
const config = {
  // Development environment (local Docker)
  development: {
    browser: 'http://localhost:3000',
    mobile: 'http://192.168.0.211:3000'  // Your local network IP for mobile
  },
  // Production environment (your actual backend server)
  production: {
    browser: 'https://spice-it-up-mobile-production.up.railway.app',
    mobile: 'https://spice-it-up-mobile-production.up.railway.app'
  }
};

// Improved Capacitor detection for mobile
const isCapacitor = !!(window.Capacitor && (window.Capacitor.isNative || window.Capacitor.platform !== 'web'));

// Get the current environment
const getCurrentEnvironment = () => {
  // Use production if on Netlify or a non-localhost domain
  if (window.location.hostname === 'localhost' || window.location.hostname.startsWith('192.168.')) {
    return 'development';
  }
  return 'production';
};

// Export the configuration
export const getApiUrl = () => {
  const env = getCurrentEnvironment();
  const platform = isCapacitor ? 'mobile' : 'browser';
  const url = config[env][platform];
  // Commented out for production:
  // console.log(`🔗 Using API URL: ${url} (env: ${env}, platform: ${platform})`);
  return url;
};

// Export other useful environment checks
export const isNativeApp = isCapacitor; 