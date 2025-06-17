// Configuration for different environments
const config = {
  // Development environment (local Docker)
  development: {
    browser: 'http://localhost:3000',
    mobile: 'http://192.168.0.211:3000'  // Your local network IP for mobile
  },
  // Production environment (your actual backend server)
  production: {
    browser: 'https://spice-it-up-api.onrender.com',
    mobile: 'https://spice-it-up-api.onrender.com'
  }
};

// Improved Capacitor detection for mobile
const isCapacitor = !!(window.Capacitor && (window.Capacitor.isNative || window.Capacitor.platform !== 'web'));

// Get the current environment
const getCurrentEnvironment = () => {
  // Use development environment for now since we're using Docker
  console.log('🌐 Using development environment for all platforms');
  return 'development';
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