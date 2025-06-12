const { verifyToken } = require('../utils/firebase');
const db = require('../db');

// Middleware to require authentication
async function requireAuth(req, res, next) {
  try {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authorization.split('Bearer ')[1];
    
    // Verify Firebase token
    const decodedToken = await verifyToken(token);
    
    // For delete-user endpoint, we only need the Firebase token verification
    if (req.path === '/delete-user' && req.method === 'DELETE') {
      req.user = { firebase_uid: decodedToken.uid };
      return next();
    }
    
    // For all other endpoints, get user from database
    const result = await db.query(
      'SELECT * FROM users WHERE firebase_uid = ?',
      [decodedToken.uid]
    );

    if (result[0].length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Add user to request object
    req.user = result[0][0];
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Middleware to require admin privileges
async function requireAdmin(req, res, next) {
  try {
    // Check if user exists and is admin
    if (!req.user || !req.user.is_admin) {
      return res.status(403).json({ error: 'Admin privileges required' });
    }
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  requireAuth,
  requireAdmin
}; 