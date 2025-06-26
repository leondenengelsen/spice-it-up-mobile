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
    // Fetch from the full recipes table, id, title, and a short description
    const [recipes] = await db.query(
      `SELECT id, title, LEFT(description, 120) AS description FROM recipes ORDER BY RAND() LIMIT ?`, [count]
    );
    res.json({ success: true, recipes });
  } catch (error) {
    console.error('Error fetching random recipes:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch random recipes' });
  }
}

/**
 * Get a list of random recipe suggestions (ideas)
 */
async function getRandomRecipeSuggestions(req, res) {
  try {
    const count = parseInt(req.query.count) || 3;
    // Fetch 10 random rows to get a good pool
    const [rows] = await db.query(
      `SELECT suggestion_1, suggestion_2, suggestion_3 FROM recipe_suggestions ORDER BY RAND() LIMIT 10`
    );
    // Flatten all suggestions into a single array
    let allIdeas = [];
    rows.forEach(row => {
      if (row.suggestion_1) allIdeas.push(row.suggestion_1);
      if (row.suggestion_2) allIdeas.push(row.suggestion_2);
      if (row.suggestion_3) allIdeas.push(row.suggestion_3);
    });
    // Shuffle and pick count ideas
    allIdeas = allIdeas.sort(() => Math.random() - 0.5);
    const selected = allIdeas.slice(0, count).map(idea => ({ title: idea, description: '' }));
    res.json({ success: true, recipes: selected });
  } catch (error) {
    console.error('Error fetching random recipe suggestions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch random recipe suggestions' });
  }
}

module.exports = {
  getRecipe,
  getRandomRecipes,
  getRandomRecipeSuggestions,
}; 