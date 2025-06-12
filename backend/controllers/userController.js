// controllers/userController.js

const db = require('../db');

/**
 * Save or verify a user in the database
 * Called when a user logs in or signs up
 */
exports.saveUser = async (req, res) => {
  const { userId, email, username } = req.body;
  
  if (!userId || !email) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing userId or email" 
    });
  }

  // Log all inputs for debugging
  console.log('🔍 User data received:', { 
    userId, 
    email, 
    username: username || '(not provided)' 
  });

  try {
    console.log('🔍 Checking if user exists:', userId);
    // Check if user already exists
    const [existingUsers] = await db.query(
      "SELECT id, username FROM users WHERE firebase_uid = ?", 
      [userId]
    );
    
    if (existingUsers.length === 0) {
      console.log('➕ Creating new user record for:', userId);
      
      // Ensure we have a valid username
      const usernameToUse = username && username.trim() !== '' 
        ? username 
        : email.split('@')[0];
        
      console.log('👤 Using username for new user:', usernameToUse);
      
      const [result] = await db.query(
        "INSERT INTO users (firebase_uid, email, username, created_at) VALUES (?, ?, ?, NOW())",
        [userId, email, usernameToUse]
      );
      
      console.log('✅ User created with internal ID:', result.insertId);
      return res.status(201).json({ 
        success: true, 
        message: "User created successfully",
        userId: result.insertId
      });
    } else {
      console.log('✅ User already exists with internal ID:', existingUsers[0].id);
      
      // Check if we need to update the username (if it's changed in Firebase)
      if (username && username.trim() !== '') {
        const [userDetails] = await db.query(
          "SELECT id, username FROM users WHERE firebase_uid = ?",
          [userId]
        );
        
        if (userDetails.length > 0) {
          if (userDetails[0].username !== username) {
            console.log('🔄 Updating username from', userDetails[0].username, 'to', username);
            await db.query(
              "UPDATE users SET username = ? WHERE firebase_uid = ?",
              [username, userId]
            );
            
            console.log('✅ Username updated for user ID:', userDetails[0].id);
          } else {
            console.log('ℹ️ Username unchanged:', username);
          }
        } else {
          console.log('⚠️ Could not find user details for ID update');
        }
      } else {
        console.log('ℹ️ No valid username provided for existing user');
      }
      
      return res.status(200).json({ 
        success: true, 
        message: "User already exists",
        userId: existingUsers[0].id
      });
    }
  } catch (error) {
    console.error('❌ Error saving user:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to save user",
      error: error.message
    });
  }
};

/**
 * Get user by Firebase UID
 */
exports.getUserByFirebaseId = async (req, res) => {
  const { firebaseUid } = req.params;
  
  if (!firebaseUid) {
    return res.status(400).json({ 
      success: false, 
      message: "Missing Firebase user ID" 
    });
  }

  try {
    const [users] = await db.query(
      "SELECT id, firebase_uid, email, username, created_at FROM users WHERE firebase_uid = ?", 
      [firebaseUid]
    );
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      user: users[0]
    });
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch user",
      error: error.message
    });
  }
};
