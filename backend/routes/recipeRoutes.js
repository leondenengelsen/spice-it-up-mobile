const express = require('express');
const router = express.Router();
const { getRecipe, getRandomRecipes, getRandomRecipeSuggestions } = require('../controllers/recipeController');

// Routes mounted at /api/recipes
router.get('/random', getRandomRecipes);
router.get('/:id', getRecipe);

// New route for random recipe suggestions (ideas)
router.get('/recipe-suggestions/random', getRandomRecipeSuggestions);

module.exports = router;
