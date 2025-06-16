//options routes

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/authMiddleware');
const { getUserAdventurousness } = require('../controllers/userOptionsController');

// Save or update user options
router.post('/', requireAuth, async (req, res) => {
  try {
    const { portions, adventurousness } = req.body;
    const user_id = req.user.id;
    // Only update portions and adventurousness, do not touch allergies
    // If the row exists, update portions and adventurousness; if not, insert with default allergies
    const [rows] = await db.query('SELECT allergies FROM options WHERE user_id = ?', [user_id]);
    let allergies = [];
    if (rows.length > 0) {
      allergies = rows[0].allergies;
      if (typeof allergies === 'string') {
        try { allergies = JSON.parse(allergies); } catch { allergies = []; }
      }
    }
    await db.query(
      `REPLACE INTO options (user_id, portions, adventurousness, allergies)
       VALUES (?, ?, ?, ?)` ,
      [user_id, portions, adventurousness, JSON.stringify(allergies || [])]
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
    const user_id = req.user.id;
    console.log('[OPTIONS PATCH] user_id:', user_id, 'body:', req.body);
    // Fetch current options
    const [rows] = await db.query('SELECT * FROM options WHERE user_id = ?', [user_id]);
    let current = rows[0] || {};
    // Build update fields dynamically
    const fields = [];
    const values = [];
    if (typeof req.body.portions !== 'undefined') {
      fields.push('portions=?');
      values.push(req.body.portions);
    }
    if (typeof req.body.adventurousness !== 'undefined') {
      fields.push('adventurousness=?');
      values.push(req.body.adventurousness);
    }
    if (typeof req.body.allergies !== 'undefined') {
      let allergies = req.body.allergies;
      if (typeof allergies === 'string') {
        try { allergies = JSON.parse(allergies); } catch { allergies = []; }
      }
      fields.push('allergies=?');
      values.push(JSON.stringify(allergies || []));
    }
    if (fields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }
    fields.push('updated_at=NOW()');
    const sql = `UPDATE options SET ${fields.join(', ')} WHERE user_id=?`;
    values.push(user_id);
    await db.query(sql, values);
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

// New endpoint to update only allergies
router.post('/allergies', requireAuth, async (req, res) => {
  try {
    const { allergies } = req.body;
    const user_id = req.user.id;
    console.log(`[ALLERGIES] user_id: ${user_id}, allergies:`, allergies);
    await db.query(
      `INSERT INTO options (user_id, allergies) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE allergies = VALUES(allergies)`,
      [user_id, JSON.stringify(allergies || [])]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error updating allergies:', err);
    res.status(500).json({ error: 'Failed to update allergies' });
  }
});

module.exports = router;
