import { auth } from './init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getApiUrl } from '../config.js';

class AuthStateManager {
  constructor() {
    // Pages configuration
    this.pages = {
      main: '/index.html',
      login: '/login.html',
      signup: '/signup.html',
      admin: '/admin.html',
      verifyEmail: '/verify-email.html'
    };
    
    // Initialize auth state listener
    this.initAuthStateListener();
  }

  initAuthStateListener() {
    onAuthStateChanged(auth, (user) => {
      this.handleAuthStateChange(user);
    });
  }

  async handleAuthStateChange(user) {
    const currentPath = window.location.pathname;
    
    if (user) {
      // Block unverified users
      // if (!user.emailVerified) {
      //   console.warn('User email not verified. Redirecting to verify-email page.');
      //   window.location.href = this.pages.verifyEmail;
      //   return;
      // }
      // User is signed in
      // Commented out for production:
      // console.log('👤 Auth state changed - User signed in:', {
      //   uid: user.uid,
      //   email: user.email,
      //   displayName: user.displayName
      // });
      
      // Get token
      const token = await user.getIdToken();
      localStorage.setItem('firebaseToken', token);
      
      // Get the username with fallback logic
      let username = user.displayName;
      
      // If Firebase displayName is empty, try to get from localStorage
      if (!username || username.trim() === '') {
        username = localStorage.getItem('user_display_name');
        // Commented out for production:
        // console.log('📋 Using username from localStorage:', username);
      }
      
      // If still empty, fall back to email username part
      if (!username || username.trim() === '') {
        username = user.email.split('@')[0];
        // Commented out for production:
        // console.log('📧 Falling back to email username:', username);
      }
      
      // Set a global variable for username
      window.userDisplayName = username;
      
      // Save/verify user in our backend
      try {
        // Commented out for production:
        // console.log('🔄 Saving/verifying user in backend:', { 
        //   uid: user.uid, 
        //   email: user.email,
        //   username: username
        // });
        
        const response = await fetch(`${getApiUrl()}/api/users`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ 
            userId: user.uid, 
            email: user.email,
            username: username
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Commented out for production:
            // console.log("User verified in backend:", data);
            window.dbUserId = data.userId;
            localStorage.setItem('dbUserId', data.userId);
          }
        } else {
          // Commented out for production:
          // console.error("Failed to verify user in backend:", await response.text());
        }
      } catch (error) {
        // Commented out for production:
        // console.error("Error verifying user in backend:", error);
      }
      
      // Ensure default options are set for every user (only once per user)
      const defaultOptionsKey = `defaultOptionsSet_${user.uid}`;
      if (!localStorage.getItem(defaultOptionsKey)) {
        try {
          const response = await fetch(`${getApiUrl()}/api/options`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              portions: 4,
              adventurousness: 1
            })
          });
          if (response.ok) {
            localStorage.setItem(defaultOptionsKey, 'true');
            // Commented out for production:
            // console.log('✅ Default options initialized');
          } else {
            // Commented out for production:
            // console.error('❌ Failed to initialize default options:', await response.text());
          }
        } catch (err) {
          // Commented out for production:
          // console.error('❌ Error initializing default options:', err);
        }
      }
      
      if (currentPath === this.pages.login || currentPath === this.pages.signup || currentPath === this.pages.verifyEmail) {
        // Redirect to main page if on auth pages
        window.location.href = this.pages.main;
      } else if (currentPath === this.pages.admin && !await this.checkIfAdmin(token)) {
        // Redirect non-admin users away from admin page
        window.location.href = this.pages.main;
      }
      
      // Update UI for logged-in state
      this.updateAuthUI(true, await this.checkIfAdmin(token));
      
    } else {
      // User is signed out
      localStorage.removeItem('firebaseToken');
      
      // Only handle redirects if not already on an auth page
      if (currentPath !== this.pages.login && 
          currentPath !== this.pages.signup && 
          !currentPath.includes('logout')) {
        
        // Handle redirects for protected pages
        if (currentPath === this.pages.main || currentPath === this.pages.verifyEmail) {
          // First-time users see signup, returning users see login
          const hasVisited = localStorage.getItem('hasVisited');
          window.location.href = hasVisited ? this.pages.login : this.pages.signup;
        } else if (currentPath === this.pages.admin) {
          window.location.href = this.pages.login;
        }
      }
      
      // Update UI for logged-out state
      this.updateAuthUI(false, false);
    }
  }

  async checkIfAdmin(token) {
    if (!token) {
      // Commented out for production:
      // console.error('No token provided for admin check');
      return false;
    }

    try {
      const apiUrl = `${getApiUrl()}/api/auth/check-admin`;
      // Commented out for production:
      // console.log('🔄 Checking admin status at:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Commented out for production:
        // console.error('❌ Admin check failed:', response.status, errorText);
        return false;
      }

      const data = await response.json();
      // Commented out for production:
      // console.log('✅ Admin check result:', data);
      return data.isAdmin;
    } catch (error) {
      // Commented out for production:
      // console.error('❌ Error checking admin status:', error);
      // Don't throw the error, just return false for non-admin
      return false;
    }
  }

  updateAuthUI(isLoggedIn, isAdmin) {
    // Update navigation
    const authLink = document.getElementById('auth-link');
    const adminLink = document.getElementById('admin-link');
    
    if (authLink) {
      if (isLoggedIn) {
        authLink.textContent = 'Logout';
        authLink.onclick = () => auth.signOut();
      } else {
        authLink.textContent = 'Login';
        authLink.href = this.pages.login;
      }
    }
    
    if (adminLink) {
      adminLink.style.display = isAdmin ? 'block' : 'none';
    }
    
    // Set first visit flag
    if (!localStorage.getItem('hasVisited')) {
      localStorage.setItem('hasVisited', 'true');
    }
  }
}

// Create and export a single instance
const authManager = new AuthStateManager();
export default authManager; 