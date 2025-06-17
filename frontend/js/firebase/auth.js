import { auth } from './init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getApiUrl } from '../config.js';

// Show/hide UI elements based on auth state
function updateUI(isLoggedIn) {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const logoutBtn = document.getElementById('logout-btn');
  const message = document.getElementById('message');
  
  if (isLoggedIn) {
    if (loginForm) loginForm.style.display = 'none';
    if (signupForm) signupForm.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'block';
    if (message) message.textContent = 'You are logged in!';
  } else {
    if (loginForm) loginForm.style.display = 'block';
    if (signupForm) signupForm.style.display = 'block';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (message) message.textContent = '';
  }
}

// Handle login
async function handleLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    showMessage('Login successful!');
    updateUI(true);
  } catch (error) {
    console.error('Login error:', error);
    showMessage(error.message, true);
  }
}

// Handle signup
async function handleSignup(email, password, username) {
  try {
    console.log('🔄 Starting signup process...', { email, username });
    
    // Create Firebase user
    console.log('🔄 Creating Firebase user...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Firebase user created:', { uid: user.uid, email: user.email });
    
    // Set display name
    console.log('🔄 Setting display name:', username);
    try {
      localStorage.setItem('user_display_name', username);
      await updateProfile(user, { displayName: username });
      await user.reload();
    } catch (profileError) {
      console.error('❌ Error setting display name:', profileError);
    }
    
    // Send verification email
    try {
      console.log('🔄 Sending verification email...');
      await sendEmailVerification(user);
      console.log('✅ Verification email sent successfully to:', email);
    } catch (emailError) {
      console.error('❌ Error sending verification email:', emailError);
      throw emailError; // Re-throw to handle in main catch block
    }

    // Setup user options
    try {
      // Fetch Firebase token
      const token = await user.getIdToken();
      console.log('✅ Fetched Firebase token for options setup');

      // POST to backend to setup options
      const response = await fetch(`${getApiUrl()}/api/options/setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          portions: 1,
          adventure: 2,
          allergies: []
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Failed to setup options:', errorText);
      } else {
        console.log('✅ Default options setup for new user');
      }
    } catch (setupError) {
      console.error('❌ Error during options setup:', setupError);
      // Don't throw here as this is not critical for signup
    }
    
    // Sign out the user until they verify their email
    await signOut(auth);
    showMessage('Account created! Please check your email to verify your account before logging in.');
    
    // Redirect to verify email page
    window.location.href = '/verify-email.html';
  } catch (error) {
    console.error('❌ Signup error:', error);
    showMessage(error.message, true);
  }
}

// Handle logout
async function handleLogout() {
  try {
    console.log('🔄 Logging out user...');
    await signOut(auth);
    
    // Clear all cached user data
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('hasVisited');
    localStorage.removeItem('dbUserId');
    
    // Clear global variables
    window.loggedInUserId = null;
    window.dbUserId = null;
    
    console.log('✅ User logged out successfully');
    showMessage('Logged out successfully!');
    updateUI(false);
    
    // Explicitly redirect to login page after cleanup
    window.location.href = '/login.html';
  } catch (error) {
    console.error('❌ Logout error:', error);
    showMessage(error.message, true);
  }
}

// Show message to user
function showMessage(text, isError = false) {
  const message = document.getElementById('message');
  if (message) {
    message.textContent = text;
    message.className = isError ? 'error' : 'success';
  }
}

// Check auth state on page load
auth.onAuthStateChanged((user) => {
  updateUI(!!user);
});

export { handleSignup, handleLogin, handleLogout }; 