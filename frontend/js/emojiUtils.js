/**
 * Frontend Emoji Utilities
 * 
 * Handles emoji detection and title cleaning for recipe displays.
 * This is presentation logic that belongs in the frontend.
 */

const EMOJI_CONFIG = {
  // Fallback emoji when no emoji is detected in recipe titles
  fallbackEmoji: '🍴', // Utensils - can be easily changed here
  
  // Unicode regex pattern for detecting emojis
  emojiPattern: /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?|\p{Emoji})/u,
  
  // Pattern for cleaning titles (removes emoji and formatting)
  cleanTitlePattern: /^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?|\p{Emoji})\s*/u
};

/**
 * Extract emoji from text using Unicode detection
 * @param {string} text - Text to extract emoji from
 * @returns {string} - Detected emoji or fallback emoji
 */
function extractEmoji(text) {
  if (!text) return EMOJI_CONFIG.fallbackEmoji;
  
  const emojiMatch = text.match(EMOJI_CONFIG.emojiPattern);
  return emojiMatch ? emojiMatch[0] : EMOJI_CONFIG.fallbackEmoji;
}

/**
 * Clean title by removing emoji and formatting
 * @param {string} title - Title to clean
 * @returns {string} - Cleaned title
 */
function cleanTitle(title) {
  if (!title) return '';
  
  return title
    .replace(EMOJI_CONFIG.cleanTitlePattern, '') // Remove emoji
    .replace(/^\*+\s*/, '') // Remove asterisks
    .trim();
}

/**
 * Process recipe data for display (emoji + clean title)
 * @param {Object} recipe - Recipe object with title
 * @returns {Object} - Object with emoji and cleanTitle properties
 */
function processRecipeDisplay(recipe) {
  return {
    emoji: extractEmoji(recipe.title),
    cleanTitle: cleanTitle(recipe.title)
  };
}

// Export for use in other modules
window.EmojiUtils = {
  extractEmoji,
  cleanTitle,
  processRecipeDisplay,
  EMOJI_CONFIG
}; 