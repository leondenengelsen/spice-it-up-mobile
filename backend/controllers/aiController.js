// controllers/aiController.js

const genAI = require('../utils/geminiClient');
const db = require('../db');
const { storeRecipe, storeSuggestions } = require('../utils/storeRecipe');
const { generateGeminiResponse } = require('../utils/geminiHelpers');
const { getSystemMessage } = require('../utils/systemMessages');
const { getUserAllergies, getUserAdventurenessValue } = require('./userOptionsController');

// Memory cache for last responses per prompt
const lastResponses = new Map();

/**
 * Generate recipe suggestions using Gemini AI
 */
exports.generateSuggestions = async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    if (!prompt) return res.status(400).send("Missing prompt");

    // Get portions, mode, and detailed recipe flag from request
    const portions = req.body.portions || 4;
    const mode = req.body.mode || 'general'; // 'general', 'vegan', 'healthy'
    const isDetailedRecipe = req.body.isDetailedRecipe || false;
    const recipeIdea = req.body.recipeIdea || null; // For detailed recipe from specific idea
    const userId = req.user.id; // Get internal user ID from authenticated user

    console.log("🟢 Sending prompt to Gemini:", prompt);
    console.log("🟢 Portions:", portions);
    console.log("🟢 Mode:", mode);
    console.log("🟢 Is Detailed Recipe:", isDetailedRecipe);
    console.log("🟢 Recipe Idea:", recipeIdea);
    console.log("🟢 User ID:", userId);

    // Get user allergies and adventurousness
    const allergies = await getUserAllergies(userId);
    const adventurousness = await getUserAdventurenessValue(userId);
    
    console.log("🎯 USER PREFERENCES FETCHED:");
    console.log("   - Allergies:", allergies || "None");
    console.log("   - Allergies type:", typeof allergies);
    console.log("   - Allergies length:", allergies ? allergies.length : 0);
    console.log("   - Adventurousness:", adventurousness);
    console.log("   - Is Detailed Recipe:", isDetailedRecipe);
    
    // Get the complete system message with user preferences
    const systemMessage = getSystemMessage(mode, portions, isDetailedRecipe, adventurousness, allergies, recipeIdea);

    console.log("🔧 SYSTEM MESSAGE CONSTRUCTED:");
    console.log("   - Base message type:", isDetailedRecipe ? "DETAILED RECIPE" : "RECIPE IDEAS");
    console.log("   - Mode:", mode);
    console.log("   - Final system message length:", systemMessage.length, "characters");
    console.log("   - System message preview:", systemMessage.substring(0, 200) + "...");

    const seed = Math.floor(Math.random() * 100000);
    const fullPrompt = `${systemMessage}\n\nUser request: ${prompt}\n(session variation: ${seed})`;

    console.log("📤 SENDING TO GEMINI:");
    console.log("   - Full prompt length:", fullPrompt.length, "characters");
    console.log("   - User prompt:", prompt);
    console.log("   - Session seed:", seed);

    let responseText;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        responseText = await generateGeminiResponse(fullPrompt, "gemini-1.5-flash");

        if (responseText === lastResponses.get(prompt) && retryCount < maxRetries) {
          console.log("🔁 Duplicate detected, retrying...");
          retryCount++;
          continue;
        }

        lastResponses.set(prompt, responseText);

        // Parse suggestions from response
        const suggestions = responseText
          .split(/\n+/)
          .filter(line => line.trim() && line.includes('**'))
          .map(line => line.trim())
          .slice(0, 3);

        if (suggestions.length >= 3) {
          // Store suggestions in database using internal user ID
          try {
            // Convert mode to database format
            const dbMode = mode === 'general' ? 'spice-it-up' : mode === 'vegan' ? 'veganize' : 'healthify';
            await storeSuggestions(prompt, suggestions, dbMode, userId);
          } catch (dbError) {
            console.error("⚠️ Failed to store suggestions:", dbError);
          }
        }

        console.log("✅ Gemini response received");
        console.log("📥 RESPONSE DETAILS:");
        console.log("   - Response length:", responseText.length, "characters");
        console.log("   - Response preview:", responseText.substring(0, 150) + "...");
        console.log("   - Request type:", isDetailedRecipe ? "DETAILED RECIPE" : "RECIPE IDEAS");
        console.log("   - For user ID:", userId);
        return res.json({
          message: responseText,
          model: "gemini-1.5-flash"
        });
      } catch (apiError) {
        console.error("🔴 API error on attempt", retryCount + 1, ":", apiError.message);
        retryCount++;
        if (retryCount > maxRetries) throw apiError;
      }
    }

    res.json({ message: responseText });

  } catch (error) {
    console.error("🔴 Gemini Request Failed:", error);
    if (error.response) {
      console.error("🟠 Error details:", error.response.status, error.response.data);
    }
    res.status(500).send("Gemini request failed");
  }
};

/**
 * Save a recipe suggestion to the database
 */
exports.saveSuggestion = async (req, res) => {
  console.log('🚀 /save-suggestion endpoint called');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      title, 
      description, 
      ingredients,
      instructions,
      steps,
      portions, 
      mode
    } = req.body;
    
    const userId = req.user.id; // Get internal user ID from authenticated user
    
    // Log parsed data
    console.log('Parsed recipe data:', {
      hasTitle: Boolean(title),
      hasDescription: Boolean(description),
      ingredientsLength: ingredients ? ingredients.length : 0,
      instructionsLength: instructions ? instructions.length : 0,
      stepsLength: steps ? steps.length : 0,
      portions,
      mode,
      userId
    });
    
    if (!title || !description) {
      console.log('🔴 VALIDATION FAILED:', {
        hasTitle: Boolean(title),
        titleValue: title,
        hasDescription: Boolean(description),
        descriptionLength: description ? description.length : 0
      });
      return res.status(400).json({
        success: false,
        message: "Missing title or description"
      });
    }

    // Get user's options using internal user ID
    const [optionsRows] = await db.query(
      'SELECT portions, adventurousness, allergies FROM options WHERE user_id = ?',
      [userId]
    );

    // Use options from database or fallback to defaults/provided values
    const userOptions = optionsRows[0] || {};
    const finalPortions = portions || userOptions.portions || 4;
    const adventurousness = userOptions.adventurousness || 1;
    const userAllergies = userOptions.allergies;

    console.log("🔄 Processing recipe save:", {
      title,
      userId,
      portions: finalPortions,
      adventurousness,
      mode: mode || 'general',
      hasIngredients: Boolean(ingredients),
      hasInstructions: Boolean(instructions),
      hasSteps: Boolean(steps)
    });
    
    // Store the recipe with all the gathered information
    const isVegan = mode === 'vegan';
    const isHealthy = mode === 'healthy';
    
    const recipeId = await storeRecipe(
      title,
      description,
      adventurousness,
      finalPortions,
      isVegan,
      isHealthy,
      userId,
      ingredients,
      instructions,
      steps
    );

    console.log('✅ Recipe stored with ID:', recipeId);

    res.json({
      success: true,
      message: "Recipe saved successfully",
      recipe_id: recipeId
    });

  } catch (error) {
    console.error("🔴 Failed to save recipe:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save recipe",
      error: error.message
    });
  }
};

async function generateRecipe(req, res) {
  const { prompt, portions, mode, isDetailedRecipe, recipeIdea } = req.body;
  const userId = req.user.id;

  try {
    // Keep only essential logs for debugging production issues
    console.log("🟢 Generating recipe for user:", userId);
    console.log("🟢 Mode:", mode, "Detailed:", isDetailedRecipe);

    // Get user preferences
    const [userPreferences] = await db.query(
      'SELECT allergies, adventurousness FROM user_options WHERE user_id = ?',
      [userId]
    );

    const { allergies, adventurousness } = userPreferences[0] || {};

    // Keep important preference logs for debugging
    console.log("🎯 User preferences - Allergies:", allergies ? allergies.length : 0, "Adventurousness:", adventurousness);

    // Construct system message
    const systemMessage = constructSystemMessage(mode, isDetailedRecipe, allergies, adventurousness);
    
    // Remove verbose message construction logs
    const fullPrompt = constructFullPrompt(prompt, systemMessage, portions, mode, isDetailedRecipe, recipeIdea);
    const seed = Math.floor(Math.random() * 1000000);

    // Keep API call logs for debugging
    console.log("📤 Sending to Gemini - Prompt length:", fullPrompt.length);

    let retryCount = 0;
    const maxRetries = 3;
    let responseText;

    while (retryCount < maxRetries) {
      try {
        // ... existing code ...
        console.log("✅ Gemini response received - Length:", responseText.length);
        break;
      } catch (apiError) {
        retryCount++;
        console.error("🔴 API error on attempt", retryCount, ":", apiError.message);
        if (retryCount === maxRetries) throw apiError;
        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
      }
    }

    // Store suggestions
    try {
      await storeRecipeSuggestions(responseText, userId, isDetailedRecipe);
    } catch (dbError) {
      console.error("⚠️ Failed to store suggestions:", dbError);
      // Continue even if storage fails
    }

    res.json({ response: responseText });
  } catch (error) {
    console.error("❌ Recipe generation error:", error);
    res.status(500).json({ error: 'Failed to generate recipe' });
  }
}
