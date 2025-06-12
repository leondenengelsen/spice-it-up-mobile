const { verifyToken, isDevelopment, mockUser } = require('../utils/firebase');
const db = require('../db'); // Assuming this is your database connection

const authController = {
  // Register a new user in our database
  async registerUser(req, res) {
    const connection = await db.getConnection();
    
    try {
      console.log('\n📝 Starting user registration process');
      console.log('Headers:', JSON.stringify(req.headers, null, 2));
      console.log('Body:', JSON.stringify(req.body, null, 2));
      
      const { authorization } = req.headers;
      if (!authorization) {
        console.error('❌ No authorization header provided');
        return res.status(401).json({ error: 'No authorization header' });
      }
      
      const token = authorization.split('Bearer ')[1];
      if (!token) {
        console.error('❌ Invalid authorization format');
        return res.status(401).json({ error: 'Invalid authorization format' });
      }
      
      console.log('🔑 Verifying Firebase token...');
      let decodedToken;
      try {
        decodedToken = await verifyToken(token);
        console.log('✅ Firebase token verified:', { uid: decodedToken.uid, email: decodedToken.email });
      } catch (tokenError) {
        console.error('❌ Token verification failed:', tokenError);
        return res.status(401).json({ error: `Token verification failed: ${tokenError.message}` });
      }
      
      const { username } = req.body;
      const firebase_uid = decodedToken.uid;
      const email = decodedToken.email;
      
      if (!username || !firebase_uid || !email) {
        console.error('❌ Missing required fields:', { username, firebase_uid, email });
        return res.status(400).json({ error: 'Missing required fields' });
      }
      
      console.log('📝 Processing registration:', { firebase_uid, email, username });
      
      // Start transaction
      await connection.beginTransaction();
      
      // Check if user exists
      console.log('🔍 Checking for existing user...');
      const [existingUsers] = await connection.query(
        'SELECT * FROM users WHERE firebase_uid = ? OR email = ? OR username = ?',
        [firebase_uid, email, username]
      );
      
      console.log('🔍 Existing users query result:', existingUsers.length > 0 
        ? `Found ${existingUsers.length} user(s)` 
        : 'No existing users found');
      
      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        console.log('👤 Found existing user:', {
          id: existingUser.id,
          firebase_uid: existingUser.firebase_uid,
          email: existingUser.email,
          username: existingUser.username
        });
        
        if (existingUser.firebase_uid !== firebase_uid) {
          await connection.rollback();
          return res.status(409).json({ error: 'Email or username already in use' });
        }
        
        // Update username if different
        if (username && username !== existingUser.username) {
          console.log('✏️ Updating username...');
          await connection.query(
            'UPDATE users SET username = ? WHERE firebase_uid = ?',
            [username, firebase_uid]
          );
          
          const [updatedUser] = await connection.query(
            'SELECT * FROM users WHERE firebase_uid = ?',
            [firebase_uid]
          );
          
          await connection.commit();
          console.log('✅ Username updated:', updatedUser[0]);
          return res.json(updatedUser[0]);
        }
        
        await connection.commit();
        return res.json(existingUser);
      }
      
      // Create new user
      console.log('👤 Creating new user...');
      const [result] = await connection.query(
        'INSERT INTO users (firebase_uid, email, username, created_at) VALUES (?, ?, ?, NOW())',
        [firebase_uid, email, username]
      );
      
      // Get the created user
      const [newUser] = await connection.query(
        'SELECT * FROM users WHERE id = ?',
        [result.insertId]
      );
      
      await connection.commit();
      console.log('✅ New user created successfully:', newUser[0]);
      
      res.status(201).json(newUser[0]);
      
    } catch (error) {
      console.error('❌ Registration error:', error);
      await connection.rollback();
      res.status(500).json({ 
        error: `Registration failed: ${error.message}`,
        details: isDevelopment ? error.stack : undefined
      });
    } finally {
      connection.release();
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
      res.json({ isAdmin: !!req.user.is_admin });
    } catch (error) {
      console.error('Error checking admin status:', error);
      res.status(500).json({ error: 'Server error' });
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
    try {
      console.log('🔄 Starting user deletion process');
      
      const { authorization } = req.headers;
      if (!authorization) {
        console.error('❌ No authorization header provided');
        return res.status(401).json({ error: 'No authorization header' });
      }
      
      const token = authorization.split('Bearer ')[1];
      console.log('🔑 Got token:', token.substring(0, 20) + '...');
      
      // Verify Firebase token
      console.log('🔄 Verifying Firebase token...');
      const decodedToken = await verifyToken(token);
      console.log('✅ Token verified for user:', decodedToken.email);
      
      const firebase_uid = decodedToken.uid;
      console.log('👤 Firebase UID:', firebase_uid);

      // Start a transaction
      console.log('🔄 Starting database transaction');
      const connection = await db.getConnection();
      await connection.beginTransaction();

      try {
        // Get user ID first
        console.log('🔍 Looking up user in database');
        const [userRows] = await connection.query('SELECT id FROM users WHERE firebase_uid = ?', [firebase_uid]);
        
        if (userRows.length === 0) {
          console.error('❌ User not found in database');
          await connection.rollback();
          connection.release();
          return res.status(404).json({ error: 'User not found in database' });
        }
        
        const userId = userRows[0].id;
        console.log('✅ Found user with ID:', userId);

        // Delete user's favorites
        console.log('🔄 Deleting user favorites');
        await connection.query('DELETE FROM favorites WHERE user_id = ?', [userId]);
        console.log('✅ Deleted user favorites');

        // Delete user's options
        console.log('🔄 Deleting user options');
        await connection.query('DELETE FROM options WHERE user_id = ?', [userId]);
        console.log('✅ Deleted user options');

        // Delete user's recipe suggestions
        console.log('🔄 Deleting user recipe suggestions');
        await connection.query('DELETE FROM recipe_suggestions WHERE user_id = ?', [userId]);
        console.log('✅ Deleted user recipe suggestions');

        // Delete user's recipes
        console.log('🔄 Deleting user recipes');
        await connection.query('DELETE FROM recipes WHERE user_id = ?', [userId]);
        console.log('✅ Deleted user recipes');

        // Finally, delete the user
        console.log('🔄 Deleting user account');
        const [result] = await connection.query('DELETE FROM users WHERE id = ?', [userId]);
        
        if (result.affectedRows === 0) {
          console.error('❌ Failed to delete user');
          await connection.rollback();
          connection.release();
          return res.status(500).json({ error: 'Failed to delete user' });
        }

        // Commit the transaction
        console.log('✅ All deletions successful, committing transaction');
        await connection.commit();
        connection.release();
        console.log('✅ Successfully deleted user and all related data');
        
        res.json({ success: true });
        
      } catch (error) {
        console.error('❌ Error during deletion transaction:', error);
        await connection.rollback();
        connection.release();
        throw error;
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      res.status(500).json({ error: `Failed to delete user: ${error.message}` });
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