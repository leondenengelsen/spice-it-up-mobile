import { auth } from './init.js';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendEmailVerification,
  updateProfile
} from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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

// Handle signup
async function handleSignup(email, password, username) {
  try {
    console.log('🔄 Starting signup process...', { email, username });
    
    // Create Firebase user
    console.log('🔄 Creating Firebase user...');
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log('✅ Firebase user created:', { uid: user.uid, email: user.email });
    
    // Set display name - CRITICAL: This must be done properly
    console.log('🔄 Setting display name:', username);
    try {
      // Store the username in localStorage as a fallback mechanism
      localStorage.setItem('user_display_name', username);
      
      // Update the profile directly
      await updateProfile(auth.currentUser, { 
        displayName: username 
      });
      
      // Force reload to get the updated profile
      await auth.currentUser.reload();
      
      // Log the result to verify
      console.log('👤 Display name status:', {
        currentDisplayName: auth.currentUser.displayName,
        expectedDisplayName: username,
        match: auth.currentUser.displayName === username
      });
    } catch (profileError) {
      console.error('❌ Error setting display name:', profileError);
      // We'll rely on the localStorage fallback if this fails
    }
    
    // Send email verification with better error handling
    try {
      console.log('🔄 Sending verification email...');
      await sendEmailVerification(user, {
        url: window.location.origin + '/index.html', // Redirect to main page after verification
        handleCodeInApp: false
      });
      console.log('✅ Verification email sent successfully to:', email);
    } catch (verificationError) {
      console.error('❌ Error sending verification email:', verificationError);
      showMessage('Account created, but there was an issue sending the verification email. Please check your spam folder or try again later.');
      return;
    }
    
    // Get ID token
    console.log('🔄 Getting Firebase ID token...');
    const idToken = await user.getIdToken();
    console.log('✅ Got ID token');
    
    // Store token
    localStorage.setItem('firebaseToken', idToken);
    console.log('✅ Token stored in localStorage');
    
    // Register user in our backend
    console.log('🔄 Registering user in backend with username:', username);
    try {
      const response = await fetch('/api/auth/register-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ username })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Backend registration failed:', errorData);
        throw new Error(`Backend registration failed: ${errorData.error || response.statusText}`);
      }
      
      const userData = await response.json();
      console.log('✅ User registered in backend successfully:', userData);
      
      // Store important user data in localStorage for persistence
      localStorage.setItem('user_id', userData.id);
      localStorage.setItem('user_email', email);
      localStorage.setItem('user_display_name', username);
      
      showMessage('Signup successful! Please check your email (including spam folder) for verification.');
      updateUI(true);
    } catch (error) {
      console.error('❌ Backend registration error:', error);
      showMessage('Account created, but there was an issue with backend registration: ' + error.message);
    }
    
  } catch (error) {
    console.error('❌ Signup error:', error);
    showMessage(error.message, true);
  }
}

// Handle login
async function handleLogin(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Get token
    const idToken = await user.getIdToken();
    localStorage.setItem('firebaseToken', idToken);
    
    // Show success message
    showMessage('Login successful!');
    updateUI(true);
    
  } catch (error) {
    console.error('Login error:', error);
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