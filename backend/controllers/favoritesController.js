const db = require('../db');

// Add a recipe to user's favorites
async function addFavorite(req, res) {
  try {
    const { recipe_id } = req.body;
    const user_id = req.user.id; // Get from authenticated user
    
    // Validate required fields
    if (!recipe_id) {
      return res.status(400).json({
        success: false,
        message: 'recipe_id is required'
      });
    }
    
    // Check if the favorite already exists
    const [existingFavorite] = await db.query(
      'SELECT id FROM favorites WHERE user_id = ? AND recipe_id = ?',
      [user_id, recipe_id]
    );
    
    if (existingFavorite.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Recipe is already in favorites'
      });
    }
    
    // Insert the new favorite
    const [result] = await db.query(
      'INSERT INTO favorites (user_id, recipe_id) VALUES (?, ?)',
      [user_id, recipe_id]
    );
    
    console.log(`✅ Added recipe ${recipe_id} to user ${user_id}'s favorites`);
    
    res.status(201).json({
      success: true,
      message: 'Recipe added to favorites successfully',
      favorite_id: result.insertId
    });
    
  } catch (error) {
    console.error('❌ Error adding favorite:', error);
    
    // Handle specific database errors
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe_id - referenced record does not exist'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Internal server error while adding favorite'
    });
  }
}

// Get user's favorites
async function getFavorites(req, res) {
  try {
    const user_id = req.user.id; // Get from authenticated user
    
    const [favorites] = await db.query(`
      SELECT 
        f.id as favorite_id,
        f.created_at as favorited_at,
        r.id as recipe_id,
        r.title,
        CASE 
          WHEN LENGTH(r.description) > 200 THEN CONCAT(SUBSTRING(r.description, 1, 200), '...')
          ELSE r.description
        END as description
      FROM favorites f
      JOIN recipes r ON f.recipe_id = r.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `, [user_id]);
    
    // Return raw data - let frontend handle emoji processing
    res.json({
      success: true,
      favorites: favorites
    });
    
  } catch (error) {
    console.error('❌ Error getting favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while fetching favorites'
    });
  }
}

// Remove a favorite
async function removeFavorite(req, res) {
  try {
    const { recipe_id } = req.params;
    const user_id = req.user.id; // Get from authenticated user
    
    if (!recipe_id) {
      return res.status(400).json({
        success: false,
        message: 'recipe_id is required'
      });
    }
    
    const [result] = await db.query(
      'DELETE FROM favorites WHERE user_id = ? AND recipe_id = ?',
      [user_id, recipe_id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Favorite not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Favorite removed successfully'
    });
    
  } catch (error) {
    console.error('❌ Error removing favorite:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while removing favorite'
    });
  }
}

// Clear all favorites for a user
async function clearAllFavorites(req, res) {
  try {
    const user_id = req.user.id; // Get from authenticated user
    
    // Delete all favorites for the user
    const [result] = await db.query(
      'DELETE FROM favorites WHERE user_id = ?',
      [user_id]
    );
    
    console.log('✅ Cleared all favorites for user:', {
      user_id,
      affectedRows: result.affectedRows
    });
    
    res.json({
      success: true,
      message: 'All favorites cleared successfully',
      affectedRows: result.affectedRows
    });
    
  } catch (error) {
    console.error('❌ Error clearing favorites:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error while clearing favorites'
    });
  }
}

module.exports = {
  addFavorite,
  getFavorites,
  removeFavorite,
  clearAllFavorites
};