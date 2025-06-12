const admin = require('firebase-admin');

let firebaseApp = null;

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development';

// Mock user for development
const mockUser = {
  uid: 'dev-user-123',
  email: 'dev@example.com',
  name: 'Development User'
};

function initializeFirebase() {
  try {
    // Always initialize with the real Firebase config
    console.log(`🔥 Initializing Firebase in ${isDevelopment ? 'development' : 'production'} mode`);
    const serviceAccount = require('../secrets/gen-lang-client-0251517490-firebase-adminsdk-fbsvc-2562b31be4.json');
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    if (!isDevelopment) {
      console.error('❌ Cannot proceed without Firebase in production mode');
      process.exit(1);
    }
    
    // In development, fall back to mock mode
    console.log('⚠️ Falling back to mock Firebase mode');
    firebaseApp = admin.initializeApp({
      projectId: 'mock-project-id'
    }, 'mock');
  }
}

// Initialize Firebase
initializeFirebase();

// Verify Firebase token
async function verifyToken(token) {
  try {
    // In development mode with a specific test token, return mock user
    if (isDevelopment && token === 'test-token') {
      console.log('✅ Using mock user in development mode');
      return mockUser;
    }

    // Try to verify the real token
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log('✅ Token verified for user:', decodedToken.email);
      return decodedToken;
    } catch (verifyError) {
      // Only use mock data in development
      if (isDevelopment) {
        console.log('⚠️ Token verification failed, using mock data in development');
        return mockUser;
      }
      throw verifyError;
    }
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    throw new Error('Invalid token');
  }
}

module.exports = {
  admin,
  verifyToken,
  isDevelopment,
  mockUser
}; 