//options routes

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');
const { getUserAdventurousness } = require('../controllers/userOptionsController');

// Save or update user options
router.post('/', requireAuth, async (req, res) => {
  try {
    const { portions, adventurousness, other_settings } = req.body;
    const user_id = req.user.id;
    
    // Extract allergies from other_settings
    const allergies = other_settings?.allergies || [];
    
    // Use REPLACE INTO to handle both insert and update
    await db.query(
      `REPLACE INTO options (user_id, portions, adventurousness, allergies)
       VALUES (?, ?, ?, ?)`,
      [user_id, portions, adventurousness, JSON.stringify(allergies)]
    );
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving options:', err);
    res.status(500).json({ error: 'Failed to save options' });
  }
});

// Update user options (PATCH)
router.patch('/', requireAuth, async (req, res) => {
  try {
    const { spice_level, vegan_only, preferred_cuisine, other_settings } = req.body;
    const user_id = req.user.id; // Get user ID from authenticated user
    
    await db.query(
      `UPDATE options SET spice_level=?, vegan_only=?, preferred_cuisine=?, other_settings=?, updated_at=NOW() 
       WHERE user_id=?`,
      [spice_level, vegan_only, preferred_cuisine, JSON.stringify(other_settings), user_id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating options:', err);
    res.status(500).json({ error: 'Failed to update options' });
  }
});

// Get user options
router.get('/', requireAuth, async (req, res) => {
  try {
    const user_id = req.user.id;
    const [rows] = await db.query('SELECT * FROM options WHERE user_id = ?', [user_id]);
    
    if (rows.length === 0) {
      // Return default options if none exist
      return res.json({
        portions: 4,
        adventurousness: 1,
        allergies: []
      });
    }
    
    // Handle allergies field (MySQL auto-deserializes JSON)
    const options = rows[0];
    
    // MySQL already deserializes JSON columns, so we just need to ensure it's an array
    if (Array.isArray(options.allergies)) {
      // Already an array, keep as is
    } else if (typeof options.allergies === 'string') {
      try {
        options.allergies = JSON.parse(options.allergies);
      } catch (parseError) {
        console.error('Failed to parse allergies string:', parseError);
        options.allergies = [];
      }
    } else {
      options.allergies = [];
    }
    res.json(options);
  } catch (err) {
    console.error('❌ OPTIONS GET - Error:', err);
    console.error('❌ OPTIONS GET - Stack:', err.stack);
    res.status(500).json({ error: 'Failed to get options' });
  }
});

// Get user adventurousness only
router.get("/adventurousness", requireAuth, getUserAdventurousness);

module.exports = router;
