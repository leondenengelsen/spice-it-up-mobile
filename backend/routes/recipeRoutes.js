const express = require('express');
const router = express.Router();
const { getRecipe } = require('../controllers/recipeController');

// Routes mounted at /api/recipes
router.get('/:id', getRecipe);

module.exports = router;
