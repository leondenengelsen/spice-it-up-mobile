// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Save or verify user in database
router.post('/', userController.saveUser);

// Get user by Firebase UID
router.get('/:firebaseUid', userController.getUserByFirebaseId);

module.exports = router;
