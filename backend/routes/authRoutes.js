const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { requireAuth, requireAdmin } = require('../middleware/authMiddleware');

// Public routes
router.post('/register-user', authController.registerUser);

// Protected routes (require authentication)
router.get('/profile', requireAuth, authController.getProfile);
router.get('/user-info', requireAuth, authController.getUserInfo);
router.get('/check-admin', requireAuth, authController.checkAdmin);
router.delete('/delete-user', requireAuth, authController.deleteUser);

// Admin routes (require admin privileges)
router.get('/users', requireAuth, requireAdmin, authController.getUsers);
router.post('/toggle-admin/:userId', requireAuth, requireAdmin, authController.toggleAdmin);
router.post('/settings', requireAuth, requireAdmin, authController.updateSettings);

module.exports = router; 