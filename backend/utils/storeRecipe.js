/**
 * Helper function to store a recipe in the database
 * @param {string} title - The recipe title
 * @param {string} description - The full recipe content
 * @param {number} adventurousness - Adventurousness level (1-100)
 * @param {number} userPortions - User-specified number of portions (optional)
 * @param {boolean} isVegan - Whether the recipe is vegan
 * @param {boolean} isHealthy - Whether the recipe is healthy
 * @param {number} userId - The ID of the user creating the recipe
 * @param {string} [ingredients] - JSON string of parsed ingredients
 * @param {string} [instructions] - Raw instructions text
 * @param {string} [steps] - JSON string of parsed steps
 * @returns {Promise<number>} - The recipe ID
 */
const db = require('../db');

async function storeRecipe(
  title, 
  description, 
  adventurousness = 1, 
  userPortions = null, 
  isVegan = false, 
  isHealthy = false, 
  userId = null,
  ingredients = null,
  instructions = null,
  steps = null
) {
  // Set default user ID if not provided (should be a valid user in the users table)
  if (!userId) {
    console.warn('⚠️ No user ID provided, using default user (4)');
    userId = 4; // Default to a valid user in the users table
  }

  try {
    console.log('🔄 Storing recipe:', { 
      title, 
      contentPreview: description.slice(0, 100), 
      adventurousness, 
      userPortions,
      isVegan,
      isHealthy,
      userId,
      hasIngredients: Boolean(ingredients),
      hasInstructions: Boolean(instructions),
      hasSteps: Boolean(steps)
    });

    // Check if a similar recipe already exists for this user
    console.log('🔍 Checking for existing recipe with title:', title);
    const [existingRecipes] = await db.query(
      'SELECT id FROM recipes WHERE title = ? AND user_id = ?',
      [title, userId]
    );
    
    console.log('🔍 Existing recipes result:', existingRecipes);

    // Convert boolean flags to database format
    const veganFlag = isVegan ? 1 : 0;
    const healthyFlag = isHealthy ? 1 : 0;

    // Determine portions (prioritize user-specified portions)
    let portions = userPortions || 4;
    if (!userPortions) {
      const portionsMatch = description.match(/serves\s+(\d+)/i) || description.match(/for\s+(\d+)\s+people/i);
      if (portionsMatch && portionsMatch[1]) {
        portions = Math.min(8, Math.max(1, parseInt(portionsMatch[1])));
      }
    }

    // Extract potential allergies (common ones)
    const allergensToCheck = ['nuts', 'peanuts', 'gluten', 'dairy', 'shellfish', 'soy', 'eggs'];
    const foundAllergens = allergensToCheck.filter(allergen =>
      description.toLowerCase().includes(allergen)
    );
    const allergies = foundAllergens.length > 0 ? JSON.stringify(foundAllergens) : null;

    // Use provided structured data or extract from content
    let finalIngredients = ingredients;
    let finalInstructions = instructions;
    let finalSteps = steps;

    if (!finalIngredients) {
      const ingredientsSection = description.match(/ingredients:?([\s\S]*?)(?:instructions|directions|method|steps|preparation)/i);
      if (ingredientsSection && ingredientsSection[1]) {
        const ingredientLines = ingredientsSection[1].trim().split('\n')
          .filter(line => line.trim().length > 0)
          .map(line => {
            const match = line.trim().match(/^[-*•]?\s*(?:(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?)?\s*(.+)$/);
            if (match) {
              return {
                quantity: match[1] || null,
                unit: match[2] || null,
                name: match[3].trim()
              };
            }
            return { name: line.trim() };
          });
        finalIngredients = JSON.stringify(ingredientLines);
      }
    }

    if (!finalInstructions || !finalSteps) {
      const stepsSection = description.match(/(?:instructions|directions|method|steps|preparation):?([\s\S]*?)(?:notes|$)/i);
      if (stepsSection && stepsSection[1]) {
        // Store the raw instructions text
        finalInstructions = stepsSection[1].trim();
        
        // Process the steps text into an array if not provided
        if (!finalSteps) {
          const stepLines = stepsSection[1].trim().split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.trim().replace(/^[\d#*•.\-]+\s*/, '').trim());
          finalSteps = JSON.stringify(stepLines);
        }
      }
    }

    // If it doesn't exist, insert it
    if (existingRecipes.length === 0) {
      try {
        console.log('🔄 Inserting recipe into database...');
        console.log('SQL Values:', {
          user_id: userId,
          title: title,
          content_length: description.length,
          veganFlag: veganFlag,
          portions: portions,
          healthyFlag: healthyFlag,
          allergies: allergies ? 'present' : 'null',
          adventurousness: adventurousness,
          ingredients: finalIngredients ? 'present' : 'null',
          instructions: finalInstructions ? 'present' : 'null',
          steps: finalSteps ? 'present' : 'null'
        });

        const [result] = await db.query(
          `INSERT INTO recipes (user_id, title, description, is_vegan, portions,
            is_healthy, allergies, adventurousness, ingredients, instructions, steps)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [userId, title, description, veganFlag, portions, healthyFlag, allergies, adventurousness, finalIngredients, finalInstructions, finalSteps]
        );
        console.log('✅ Recipe stored:', {
          title,
          id: result.insertId,
          userId,
          vegan: isVegan,
          healthy: isHealthy,
          portions,
          adventurousness,
          hasIngredients: Boolean(finalIngredients),
          hasInstructions: Boolean(finalInstructions),
          hasSteps: Boolean(finalSteps)
        });
        // Return the recipe ID
        return result.insertId;
      } catch (insertError) {
        console.error('❌ Failed to insert recipe:', {
          error: insertError,
          title,
          userId,
          contentLength: description.length
        });
        throw insertError;
      }
    } else {
      console.log(`⚠️ Recipe already exists for user ${userId}: "${title}" with ID ${existingRecipes[0].id}`);
      // Return the existing recipe ID
      return existingRecipes[0].id;
    }
  } catch (error) {
    console.error("❌ Database error:", error);
    throw error;
  }
}

/**
 * Store recipe suggestions in the database
 * @param {string} input_ingredients - The original ingredients/prompt
 * @param {string[]} suggestions - Array of 3 recipe suggestions
 * @param {string} mode - The mode used (spice-it-up, healthify, veganize)
 * @param {number} userId - The internal user ID
 * @returns {Promise<number>} - The suggestion ID
 */
async function storeSuggestions(input_ingredients, suggestions, mode, userId) {
  try {
    console.log('🔄 Storing suggestions for user ID:', userId);

    // Insert into recipe_suggestions table
    const [result] = await db.query(
      `INSERT INTO recipe_suggestions 
        (user_id, input_ingredients, suggestion_1, suggestion_2, suggestion_3, mode) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, input_ingredients, suggestions[0], suggestions[1], suggestions[2], mode]
    );

    console.log('✅ Suggestions stored with ID:', result.insertId);
    return result.insertId;
  } catch (error) {
    console.error('❌ Failed to store suggestions:', error);
    throw error;
  }
}

module.exports = {
  storeRecipe,
  storeSuggestions
};
