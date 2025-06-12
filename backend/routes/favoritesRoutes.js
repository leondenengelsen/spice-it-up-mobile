const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware').requireAuth;
const { addFavorite, getFavorites, removeFavorite, clearAllFavorites } = require('../controllers/favoritesController');

// Routes mounted at /api/favorites - all routes now protected by requireAuth
router.post('/', requireAuth, addFavorite);                    // POST /api/favorites
router.get('/', requireAuth, getFavorites);                     // GET /api/favorites (user identified by token)
router.delete('/recipe/:recipe_id', requireAuth, removeFavorite); // DELETE /api/favorites/recipe/:recipe_id
router.delete('/clear', requireAuth, clearAllFavorites);        // DELETE /api/favorites/clear

module.exports = router;