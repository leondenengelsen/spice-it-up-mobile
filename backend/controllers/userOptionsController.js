const db = require('../db');

/**
 * Get user allergies from the options table
 * @param {number} userId - The internal MySQL user ID
 * @returns {string} - The formatted allergies string or empty string if not found
 */
async function getUserAllergies(userId) {
  try {
    const [rows] = await db.query(
      'SELECT allergies FROM options WHERE user_id = ?',
      [userId]
    );
    
    const allergies = rows[0]?.allergies;
    
    // If no allergies found, return empty string
    if (!allergies) {
      return '';
    }
    
    // If allergies is an array, join them with commas
    if (Array.isArray(allergies)) {
      return allergies.length > 0 ? allergies.join(', ') : '';
    }
    
    // If allergies is a string, try to parse it as JSON
    if (typeof allergies === 'string') {
      try {
        const parsedAllergies = JSON.parse(allergies);
        if (Array.isArray(parsedAllergies)) {
          return parsedAllergies.length > 0 ? parsedAllergies.join(', ') : '';
        }
        // If it's not an array after parsing, return the string as-is
        return allergies;
      } catch (parseError) {
        // If parsing fails, return the string as-is
        return allergies;
      }
    }
    
    // For any other type, convert to string
    return String(allergies);
  } catch (err) {
    console.error('Error fetching allergies:', err);
    return '';
  }
}

/**
 * Get user adventurousness value from the options table (helper function)
 * @param {number} userId - The internal MySQL user ID
 * @returns {number} - The adventurousness value or 1 if not found
 */
async function getUserAdventurenessValue(userId) {
  try {
    console.log("🔍 FETCHING ADVENTUROUSNESS for user ID:", userId);
    const [rows] = await db.query(
      'SELECT adventurousness FROM options WHERE user_id = ?',
      [userId]
    );
    const adventurousness = rows[0]?.adventurousness || 1;
    console.log("✅ ADVENTUROUSNESS RESULT:", {
      userId,
      foundRows: rows.length,
      value: adventurousness,
      isDefault: !rows[0]?.adventurousness
    });
    return adventurousness;
  } catch (err) {
    console.error('❌ Error fetching adventurousness value:', err);
    console.log("🔄 RETURNING DEFAULT ADVENTUROUSNESS (1) due to error");
    return 1;
  }
}

/**
 * Get user adventurousness from the options table
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 */
async function getUserAdventurousness(req, res) {
  try {
    const result = await db.query("SELECT adventurousness FROM options WHERE user_id = ?", [req.user.id]);
    if (result.length === 0) return res.status(404).json({ error: "Options not found" });
    res.json({ adventurousness: result[0].adventurousness });
  } catch (error) {
    console.error("Error fetching adventurousness:", error);
    res.status(500).json({ error: "Server error" });
  }
}

module.exports = { getUserAllergies, getUserAdventurousness, getUserAdventurenessValue }; 