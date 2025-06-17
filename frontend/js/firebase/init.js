// Import Firebase configuration
import getFirebaseConfig from '../config/firebase.js';
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

// Initialize Firebase with configuration
const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);

export { auth }; 