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
      await updateProfile(auth.currentUser, { displayName: username });
      await auth.currentUser.reload();
    } catch (profileError) {
      console.error('❌ Error setting display name:', profileError);
    }
    
    // Send verification email
    try {
      console.log('🔄 Sending verification email...');
      await sendEmailVerification(user, {
        url: window.location.origin + '/index.html',
        handleCodeInApp: false
      });
      console.log('✅ Verification email sent successfully to:', email);
      
      // Sign out the user until they verify their email
      await signOut(auth);
      showMessage('Account created! Please check your email to verify your account before logging in.');
      return;
    } catch (verificationError) {
      console.error('❌ Error sending verification email:', verificationError);
      showMessage('Account created, but there was an issue sending the verification email. Please check your spam folder or try again later.');
      await signOut(auth);
      return;
    }
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