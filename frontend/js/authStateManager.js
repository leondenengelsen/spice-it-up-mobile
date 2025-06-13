import { auth } from './firebase/init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getApiUrl } from './config.js';

// Function to handle user authentication state changes
export function initAuthStateListener() {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        // Get the ID token
        const token = await user.getIdToken();
        localStorage.setItem('firebaseToken', token);

        // Call backend to verify the token and get user info
        const response = await fetch(`${getApiUrl()}/api/auth/user-info`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load user information');
        }

        const userInfo = await response.json();
        console.log('User info loaded:', userInfo);

        // Update UI for authenticated state
        document.body.classList.add('authenticated');
        document.body.classList.remove('unauthenticated');
      } catch (error) {
        console.error('Error during authentication:', error);
        // Handle error appropriately
      }
    } else {
      // Clear token when user signs out
      localStorage.removeItem('firebaseToken');
      
      // Update UI for unauthenticated state
      document.body.classList.add('unauthenticated');
      document.body.classList.remove('authenticated');
    }
  });
} 