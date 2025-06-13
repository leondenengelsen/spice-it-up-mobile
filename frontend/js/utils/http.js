// Utility for making HTTP requests that work in both browser and mobile environments
export async function makeRequest(url, options = {}) {
  console.log('🔄 Making request to:', url);
  
  // Check if we're running in Capacitor
  if (window.Capacitor) {
    console.log('📱 Using Capacitor HTTP plugin');
    const { Http } = window.Capacitor.Plugins;
    
    // Convert fetch options to Capacitor HTTP options
    const capOptions = {
      url,
      headers: options.headers || {},
      method: options.method || 'GET'
    };
    
    // Handle request body
    if (options.body) {
      try {
        capOptions.data = JSON.parse(options.body);
      } catch (e) {
        capOptions.data = options.body;
      }
    }
    
    try {
      const response = await Http.request(capOptions);
      console.log('📡 Capacitor response:', response);
      
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        json: () => Promise.resolve(response.data),
        text: () => Promise.resolve(typeof response.data === 'object' ? JSON.stringify(response.data) : response.data)
      };
    } catch (error) {
      console.error('❌ Capacitor HTTP error:', error);
      throw error;
    }
  } else {
    console.log('🌐 Using browser fetch');
    return fetch(url, options);
  }
} 