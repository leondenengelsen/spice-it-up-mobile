const { verifyToken, isDevelopment, mockUser } = require('../utils/firebase');
const db = require('../db'); // Assuming this is your database connection
const admin = require('firebase-admin');

const authController = {
  // Register a new user in our database
  async registerUser(req, res) {
    // 🚫 Registration is temporarily disabled
    return res.status(403).json({ error: 'Registration is temporarily disabled. Please try again later.' });
    try {
      // Keep only essential auth logs
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.error('❌ No authorization header provided');
        return res.status(401).json({ error: 'No authorization header' });
      }

      const token = authHeader.split(' ')[1];
      if (!token) {
        console.error('❌ Invalid authorization format');
        return res.status(401).json({ error: 'Invalid authorization format' });
      }

      // Verify Firebase token
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
        console.log('✅ Firebase token verified for:', decodedToken.email);
      } catch (tokenError) {
        console.error('❌ Token verification failed:', tokenError.message);
        return res.status(401).json({ error: 'Invalid token' });
      }

      const { username, firebase_uid, email } = req.body;
      if (!username || !firebase_uid || !email) {
        console.error('❌ Missing required fields');
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Check for existing user
      const [existingUsers] = await db.query(
        'SELECT * FROM users WHERE firebase_uid = ? OR email = ?',
        [firebase_uid, email]
      );

      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.username !== username) {
          // Update username if it changed
          const [updatedUser] = await db.query(
            'UPDATE users SET username = ? WHERE id = ?',
            [username, existingUser.id]
          );
          console.log('✅ Updated username for user:', existingUser.id);
        }
        return res.json({ user: existingUser });
      }

      // Create new user
      const [newUser] = await db.query(
        'INSERT INTO users (username, firebase_uid, email) VALUES (?, ?, ?)',
        [username, firebase_uid, email]
      );
      console.log('✅ Created new user:', newUser.insertId);

      res.status(201).json({ user: { id: newUser.insertId, username, email } });
    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  },

  // Get user profile
  async getProfile(req, res) {
    try {
      const { firebase_uid } = req.user;
      const [rows] = await db.query(
        'SELECT id, username, email, created_at FROM users WHERE firebase_uid = ?',
        [firebase_uid]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting user profile:', error);
      res.status(500).json({ error: 'Failed to get user profile' });
    }
  },

  // Check if user is admin
  async checkAdmin(req, res) {
    try {
      if (!req.user) {
        console.error('❌ No user object in request');
        return res.status(401).json({ error: 'User not authenticated' });
      }

      // Log the check for debugging
      console.log('🔄 Checking admin status for user:', {
        id: req.user.id,
        email: req.user.email,
        is_admin: !!req.user.is_admin
      });

      res.json({ 
        isAdmin: !!req.user.is_admin,
        userId: req.user.id
      });
    } catch (error) {
      console.error('❌ Error checking admin status:', error);
      res.status(500).json({ error: 'Server error checking admin status' });
    }
  },

  // Get all users (admin only)
  async getUsers(req, res) {
    try {
      const result = await db.query(
        'SELECT id, username, email, created_at, is_admin FROM users ORDER BY created_at DESC'
      );
      
      res.json(result[0]);
    } catch (error) {
      console.error('Error getting users:', error);
      res.status(500).json({ error: 'Failed to get users' });
    }
  },

  // Toggle admin status for a user (admin only)
  async toggleAdmin(req, res) {
    try {
      const { userId } = req.params;
      
      // Get current admin status
      const userResult = await db.query(
        'SELECT is_admin FROM users WHERE id = ?',
        [userId]
      );
      
      if (userResult[0].length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const newAdminStatus = !userResult[0][0].is_admin;
      
      // Update admin status
      await db.query(
        'UPDATE users SET is_admin = ? WHERE id = ?',
        [newAdminStatus, userId]
      );
      
      res.json({ success: true, isAdmin: newAdminStatus });
    } catch (error) {
      console.error('Error toggling admin status:', error);
      res.status(500).json({ error: 'Failed to update admin status' });
    }
  },

  // Update app settings (admin only)
  async updateSettings(req, res) {
    try {
      const { maxRecipes, requireVerification } = req.body;
      
      // Store settings in database
      await db.query(
        'INSERT INTO settings (max_recipes, require_verification, updated_by) VALUES (?, ?, ?) ' +
        'ON DUPLICATE KEY UPDATE max_recipes = VALUES(max_recipes), require_verification = VALUES(require_verification)',
        [maxRecipes, requireVerification, req.user.id]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  },

  // Delete user from database
  async deleteUser(req, res) {
    console.log('🛑 Entered deleteUser endpoint');
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.error('❌ No authorization header provided');
        return res.status(401).json({ error: 'No authorization header' });
      }
      console.log('🔑 Authorization header found');

      const token = authHeader.split(' ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const firebase_uid = decodedToken.uid;
      console.log('✅ Token verified for user:', firebase_uid);

      // Start transaction
      const connection = await db.getConnection();
      await connection.beginTransaction();
      console.log('🔄 Began DB transaction');

      try {
        // Get user ID
        const [users] = await connection.query(
          'SELECT id FROM users WHERE firebase_uid = ?',
          [firebase_uid]
        );
        console.log('🔍 User lookup result:', users);

        if (users.length === 0) {
          console.error('❌ User not found in database');
          await connection.rollback();
          return res.status(404).json({ error: 'User not found' });
        }

        const userId = users[0].id;
        console.log('🔄 Deleting user data for ID:', userId);

        // Delete all related data
        await connection.query('DELETE FROM favorites WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM options WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM recipe_suggestions WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM recipes WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);

        await connection.commit();
        console.log('✅ Successfully deleted user and all related data');

        // Delete Firebase user
        await admin.auth().deleteUser(firebase_uid);
        console.log('✅ Firebase user deleted');
        
        res.json({ message: 'User deleted successfully' });
      } catch (error) {
        await connection.rollback();
        console.error('❌ Error during deletion:', error);
        throw error;
      } finally {
        connection.release();
        console.log('🔓 DB connection released');
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      res.status(500).json({ error: 'Failed to delete user' });
    }
  },
  
  // User info endpoint - returns user information based on Firebase ID
  async getUserInfo(req, res) {
    try {
      // The user is already fetched by the requireAuth middleware
      const userInfo = {
        id: req.user.id,
        firebase_uid: req.user.firebase_uid,
        email: req.user.email,
        username: req.user.username,
        created_at: req.user.created_at
      };
      
      console.log('✅ User info found:', userInfo);
      
      return res.json(userInfo);
      
    } catch (error) {
      console.error('❌ Error getting user info:', error);
      return res.status(500).json({ error: `Failed to get user info: ${error.message}` });
    }
  }
};

module.exports = authController;