const db = require('../db');

/**
 * Get a single recipe by ID
 */
async function getRecipe(req, res) {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Recipe ID is required'
      });
    }

    // Get recipe details including the full content from description
    const [recipes] = await db.query(`
      SELECT 
        r.id,
        r.title,
        r.description,
        r.is_vegan,
        r.is_healthy,
        r.portions,
        r.allergies,
        r.ingredients,
        r.instructions,
        r.steps,
        r.created_at
      FROM recipes r
      WHERE r.id = ?
    `, [id]);
    
    if (recipes.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    const recipe = recipes[0];
    
    // Process the recipe data with safe JSON parsing
    const processedRecipe = {
      ...recipe,
      ingredients: null,
      steps: null,
      allergies: null
    };
    
    // Try to parse JSON fields if they exist
    try {
      if (recipe.ingredients) {
        processedRecipe.ingredients = JSON.parse(recipe.ingredients);
      }
    } catch (error) {
      console.error('Error parsing ingredients:', error);
    }
    
    try {
      if (recipe.steps) {
        processedRecipe.steps = JSON.parse(recipe.steps);
      }
    } catch (error) {
      console.error('Error parsing steps:', error);
    }
    
    try {
      if (recipe.allergies) {
        processedRecipe.allergies = JSON.parse(recipe.allergies);
      }
    } catch (error) {
      console.error('Error parsing allergies:', error);
    }
    
    // If we don't have structured data (ingredients/steps), but have description
    // Use the description as the full recipe content
    if (!processedRecipe.ingredients && !processedRecipe.steps && recipe.description) {
      processedRecipe.content = recipe.description;
    }
    
    // Return raw data - let frontend handle emoji processing
    res.json({
      success: true,
      recipe: processedRecipe
    });
    
  } catch (error) {
    console.error('❌ Error getting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching recipe'
    });
  }
}

/**
 * Get a list of random recipes
 */
async function getRandomRecipes(req, res) {
  try {
    const count = parseInt(req.query.count) || 3;
    const [recipes] = await db.query(
      `SELECT id, title, description FROM recipe_ideas ORDER BY RAND() LIMIT ?`, [count]
    );
    res.json({ success: true, recipes });
  } catch (error) {
    console.error('Error fetching random recipe ideas:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch random recipe ideas' });
  }
}

/**
 * Get a list of random recipe suggestions (ideas)
 * Updated: Now returns real recipes from the recipes table for inspiration page
 */
async function getRandomRecipeSuggestions(req, res) {
  try {
    const count = parseInt(req.query.count) || 3;
    // Get random recipes from the recipes table
    const [recipes] = await db.query(
      'SELECT id as recipe_id, title, description FROM recipes ORDER BY RAND() LIMIT ?',
      [count]
    );
    res.json({ success: true, recipes });
  } catch (error) {
    console.error('Error fetching random recipes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch random recipes' });
  }
}

module.exports = {
  getRecipe,
  getRandomRecipes,
  getRandomRecipeSuggestions,
}; 