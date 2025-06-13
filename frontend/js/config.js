// Configuration for different environments
const config = {
  // Development environment (local)
  development: {
    browser: 'http://localhost:3000',
    mobile: 'http://192.168.0.211:3000'  // Your local network IP
  },
  // Production environment (your actual backend server)
  production: {
    browser: 'https://your-backend-server.com',
    mobile: 'https://your-backend-server.com'
  }
};

// Improved Capacitor detection for mobile
const isCapacitor = !!(window.Capacitor && (window.Capacitor.isNative || window.Capacitor.platform !== 'web'));

// Get the current environment
const getCurrentEnvironment = () => {
  // For mobile, always use development for now
  if (isCapacitor) {
    console.log('📱 Running in Capacitor (mobile)');
    return 'development';
  }
  // For web, check if we're on localhost
  const env = window.location.hostname === 'localhost' ? 'development' : 'production';
  console.log('🌐 Running in browser, environment:', env);
  return env;
};

// Export the configuration
export const getApiUrl = () => {
  const env = getCurrentEnvironment();
  const platform = isCapacitor ? 'mobile' : 'browser';
  const url = isCapacitor ? config[env].mobile : config[env].browser;
  console.log(`🔗 Using API URL: ${url} (env: ${env}, platform: ${platform})`);
  return url;
};

// Export other useful environment checks
export const isNativeApp = isCapacitor; 