const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/authMiddleware');
const speechController = require('../controllers/speechController');

// Speech-to-text endpoint - protected by auth
router.post('/speech-to-text', requireAuth, speechController.transcribeSpeech);

module.exports = router; 