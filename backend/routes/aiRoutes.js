//aiRoutes.js

const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware').requireAuth;
const aiController = require('../controllers/aiController');

// Main generate route that handles recipe idea generation - now protected
router.post('/generate', requireAuth, aiController.generateSuggestions);

// Save a full recipe to the database - now protected
router.post('/save-suggestion', requireAuth, aiController.saveSuggestion);

module.exports = router;
