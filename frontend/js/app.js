// Main app logic for Spice It Up

// Import favorites functions
import { addToFavorites, getCurrentUser } from './favorites.js';
import { getApiUrl } from './config.js';

// ========================
// UTILITY FUNCTIONS
// ========================

/**
 * Fetch user allergies from options endpoint
 * @returns {Promise<Array>} Array of allergies or empty array
 */
async function getUserAllergies() {
  try {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.log('🔍 No Firebase token found for getUserAllergies');
      return [];
    }

    const response = await fetch(`${getApiUrl()}/api/options/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch user allergies:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      return [];
    }
    
    const options = await response.json();
    console.log('✅ User options fetched:', options);
    // Check both locations for allergies, like the options page does
    return options.allergies || (options.other_settings && options.other_settings.allergies) || [];
  } catch (error) {
    console.error('❌ Error fetching user allergies:', error);
    return [];
  }
}

/**
 * Format allergy note for display
 * @param {Array} allergies - Array of allergy strings
 * @returns {string} Formatted allergy note or empty string
 */
function formatAllergyNote(allergies) {
  if (!allergies || allergies.length === 0) {
    return '';
  }

  // Map allergy values to display labels
  const allergyLabels = {
    milk: 'Milk',
    eggs: 'Eggs', 
    peanuts: 'Peanuts',
    tree_nuts: 'Tree Nuts',
    soy: 'Soy',
    wheat: 'Wheat',
    fish: 'Fish',
    shellfish: 'Shellfish',
    sesame: 'Sesame',
    gluten: 'Gluten',
    mustard: 'Mustard',
    celery: 'Celery',
    lupin: 'Lupin',
    sulfites: 'Sulfites',
    nightshades: 'Nightshades',
    corn: 'Corn',
    meat: 'Meat',
    dairy: 'All Dairy',
    vegan: 'Vegan',
    vegetarian: 'Vegetarian'
  };

  const displayAllergies = allergies.map(allergy => 
    allergyLabels[allergy] || allergy
  ).join(', ');

  return `${displayAllergies} | allergy-friendly`;
}

/**
 * Robust recipe idea parser that handles various AI response formats
 * @param {string} ideaText - Raw idea text from AI
 * @param {number} idx - Index for debugging
 * @returns {Object} Parsed idea with emoji, title, desc
 */
function parseRecipeIdea(ideaText, idx = 0) {
  // Clean up the input
  const cleanText = ideaText.trim();
  
  // Default values
  let emoji = '';
  let title = '';
  let desc = '';
  
  // Step 1: Extract emoji using centralized utility
  emoji = window.EmojiUtils.extractEmoji(cleanText);
  
  // Step 2: Remove emoji and get remaining text using centralized pattern
  const withoutEmoji = cleanText.replace(window.EmojiUtils.EMOJI_CONFIG.cleanTitlePattern, '').trim();
  
  // Step 3: Try multiple patterns to find title and description separator
  const dashPatterns = [
    /^(.*?)\s*[—–−]\s*(.*)$/,  // Em dash, en dash, minus
    /^(.*?)\s*[-]\s*(.*)$/,     // Regular hyphen
    /^(.*?)\s*[–]\s*(.*)$/,     // En dash specifically
    /^(.*?)\s*[—]\s*(.*)$/,     // Em dash specifically
    /^(.*?)\s*--\s*(.*)$/       // Double hyphen
  ];
  
  let titleDescMatch = null;
  for (const pattern of dashPatterns) {
    titleDescMatch = withoutEmoji.match(pattern);
    if (titleDescMatch) break;
  }
  
  if (titleDescMatch) {
    // Found title-desc separator
    title = titleDescMatch[1].trim();
    desc = titleDescMatch[2].trim();
    
    // Clean up title - remove bold markers if present
    title = title.replace(/^\*\*(.*)\*\*$/, '$1').trim();
    title = title.replace(/^\*(.*)\*$/, '$1').trim();
    
    // Handle multi-line descriptions - take only first line for card display
    if (desc.includes('\n')) {
      desc = desc.split('\n')[0].trim();
    }
  } else {
    // No clear separator found - use fallback strategy
    const lines = withoutEmoji.split('\n').filter(line => line.trim());
    
    if (lines.length >= 2) {
      // Multi-line format: first line is title, rest is description
      title = lines[0].trim();
      desc = lines.slice(1).join(' ').trim();
    } else if (lines.length === 1) {
      // Single line - try to extract meaningful parts
      const singleLine = lines[0].trim();
      
      // Try to find bold text as title
      const boldMatch = singleLine.match(/\*\*(.*?)\*\*/);
      if (boldMatch) {
        title = boldMatch[1].trim();
        desc = singleLine.replace(/\*\*.*?\*\*/, '').trim();
        // Clean up description
        desc = desc.replace(/^[—–−-]\s*/, '').trim();
      } else {
        // No bold text found - use first few words as title
        const words = singleLine.split(' ');
        if (words.length > 6) {
          title = words.slice(0, 4).join(' ');
          desc = words.slice(4).join(' ');
        } else {
          title = singleLine;
          desc = 'Creative recipe variation';
        }
      }
    } else {
      // Fallback for empty or problematic content
      title = `Recipe Idea ${idx + 1}`;
      desc = 'Creative recipe variation';
    }
  }
  
  // Final cleanup and validation
  title = title || `Recipe Idea ${idx + 1}`;
  desc = desc || 'Creative recipe variation';
  
  // Limit lengths to prevent layout issues
  if (title.length > 80) {
    title = title.substring(0, 77) + '...';
  }
  if (desc.length > 200) {
    desc = desc.substring(0, 197) + '...';
  }
  
  // Remove any remaining markdown-style formatting
  title = title.replace(/[*_`]/g, '').trim();
  desc = desc.replace(/[*_`]/g, '').trim();
  
  return { emoji, title, desc };
}

// Make parseRecipeIdea available globally
window.parseRecipeIdea = parseRecipeIdea;

/**
 * Escape HTML characters to prevent layout issues
 * @param {string} text - Text to escape
 * @returns {string} HTML-escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Make escapeHtml available globally
window.escapeHtml = escapeHtml;

// ========================
// MAIN APP LOGIC
// ========================

// Function to handle generating recipes - defined once, outside DOMContentLoaded
async function generateRecipes(showLoading = false) {
  console.log('generateRecipes called with showLoading:', showLoading);
  const promptInput = document.getElementById('user-input');
  if (!promptInput) {
    console.log('No input field found');
    return;
  }
  const prompt = promptInput.value;
  if (!prompt) {
    console.log('No prompt text found');
    return;
  }
  console.log('Generating recipes for prompt:', prompt);
  
  const section = document.getElementById('recipes-section');
  if (!section) {
    console.log('No recipes section found');
    return;
  }
  
  // Show loading state if requested
  if (showLoading) {
    console.log('Showing loading state');
    section.innerHTML = '<div class="full-recipe-loading">Loading ideas...</div>';
  }

  try {
    // Get portions from localStorage
    const portions = localStorage.getItem('portions') || 4;
    console.log('Using portions:', portions);

    // Get Firebase token for authentication
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.log('No Firebase token found');
      showEmptyState('Please log in to generate recipes.');
      return;
    }

    // Get current page mode
    const mode = window.PageContext ? window.PageContext.getCurrentPageMode() : 'general';
    console.log('Using mode:', mode);

    // Make the API call
    console.log('Making API call to generate recipes...');
    const res = await fetch(`${getApiUrl()}/api/generate/`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ 
        prompt,
        portions: parseInt(portions),
        mode,
        isDetailedRecipe: false
      })
    });

    if (!res.ok) {
      console.error('API call failed:', res.status, res.statusText);
      throw new Error('Server error');
    }

    const data = await res.json();
    console.log('📥 Received response from server:', data);
    console.log('📝 Raw response text:', data.message);

    if (data.message) {
      // Clean up any leaked system instructions before parsing
      let cleanedText = data.message
        .replace(/INTERNAL GUIDANCE.*?RESPOND ONLY WITH THE 3 RECIPE IDEAS.*?:/gs, '')
        .replace(/ADVENTUROUSNESS SCALE.*?\n/g, '')
        .replace(/INSPIRATION LEVEL:.*?\n/g, '')
        .replace(/User adventurousness level:.*?\n/g, '')
        .replace(/Adjust your suggestions accordingly:.*?\n/g, '')
        .replace(/RESPOND ONLY WITH THE 3 RECIPE IDEAS.*?\n/g, '')
        .trim();
      
      console.log('🧹 Cleaned text:', cleanedText);
      
      // Split into ideas (each idea is separated by two newlines)
      const ideas = cleanedText.trim().split(/\n\s*\n/).filter(Boolean);
      console.log('📋 Found ideas:', ideas);
      
      try {
        // Render the recipes
        await renderRecipes(cleanedText);
      } catch (renderError) {
        console.error('❌ Error rendering recipes:', renderError);
        console.error('Error details:', {
          name: renderError.name,
          message: renderError.message,
          stack: renderError.stack,
          ideas: ideas
        });
        showEmptyState('Error displaying recipes. Please try again.');
      }
    } else {
      console.error('❌ Invalid response format:', data);
      showEmptyState('Received invalid response from server. Please try again.');
    }
  } catch (error) {
    console.error('❌ Error generating recipes:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    showEmptyState('Failed to generate recipes. Please try again.');
  }
}

// Make generateRecipes available globally
window.generateRecipes = generateRecipes;

// Function to handle empty state or errors
function showEmptyState(message = 'No recipes to display.') {
  const section = document.getElementById('recipes-section');
  if (!section) {
    console.error('No recipes section found for showEmptyState');
    return;
  }
  section.innerHTML = `<div style="color: var(--color-error); text-align: center; margin-top: 2em;">${message}</div>`;
  toggleInputContainer(true);
  toggleRestartButton(false);
  toggleHeadline(true);
}

// Render recipes (simple Markdown bold support)
async function renderRecipes(text) {
  const section = document.getElementById('recipes-section');
  if (!section) {
    console.error('No recipes section found for renderRecipes');
    return;
  }
  section.innerHTML = '';
  if (!text) {
    showEmptyState('No recipes to display.');
    return;
  }
  
  // Clean up any leaked system instructions before parsing
  let cleanedText = text
    .replace(/INTERNAL GUIDANCE.*?RESPOND ONLY WITH THE 3 RECIPE IDEAS.*?:/gs, '')
    .replace(/ADVENTUROUSNESS SCALE.*?\n/g, '')
    .replace(/INSPIRATION LEVEL:.*?\n/g, '')
    .replace(/User adventurousness level:.*?\n/g, '')
    .replace(/Adjust your suggestions accordingly:.*?\n/g, '')
    .replace(/RESPOND ONLY WITH THE 3 RECIPE IDEAS.*?\n/g, '')
    .trim();
  
  // Ensure chili button is visible
  toggleChiliButton(true);
  
  // Hide headline when showing recipes
  toggleHeadline(false);
  
  // Hide input container and show restart button when displaying recipes
  toggleInputContainer(false);
  toggleRestartButton(true);
  
  // Store the original text for back button functionality
  section.setAttribute('data-original-text', cleanedText);
  
  // Split into ideas (each idea is separated by two newlines)
  const ideas = cleanedText.trim().split(/\n\s*\n/).filter(Boolean);
  ideas.forEach((idea, idx) => {
    const parsed = parseRecipeIdea(idea, idx);
    const recipeBox = document.createElement('div');
    recipeBox.className = 'recipe-idea-box';
    recipeBox.onclick = () => handleRecipeClick(idx, parsed);
    recipeBox.innerHTML = `
      <div class="title-row">
        <span class="recipe-emoji">${parsed.emoji}</span>
        <span class="recipe-title"><b>${escapeHtml(parsed.title)}</b></span>
      </div>
      <div class="recipe-desc">${escapeHtml(parsed.desc)}</div>
    `;
    section.appendChild(recipeBox);
  });
}

// Make functions available globally
window.renderRecipes = renderRecipes;
window.showEmptyState = showEmptyState;

// Function to toggle chili button visibility
function toggleChiliButton(show) {
  const chiliWrap = document.getElementById('chili-wrap');
  if (chiliWrap) {
    chiliWrap.style.display = show ? 'flex' : 'none';
  }
}

// Function to toggle headline visibility
function toggleHeadline(show) {
  const headline = document.getElementById('headline-section');
  if (headline) {
    headline.style.display = show ? 'block' : 'none';
  }
}

// Function to toggle input container visibility
function toggleInputContainer(show) {
  const inputContainer = document.getElementById('input-container');
  if (inputContainer) {
    inputContainer.style.display = show ? 'block' : 'none';
  }
}

// Function to toggle restart button visibility
function toggleRestartButton(show) {
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.style.display = show ? 'block' : 'none';
  }
}

// Make toggle functions available globally
window.toggleChiliButton = toggleChiliButton;
window.toggleHeadline = toggleHeadline;
window.toggleInputContainer = toggleInputContainer;
window.toggleRestartButton = toggleRestartButton;

document.addEventListener('DOMContentLoaded', () => {
  // Navigation
  const mainPage = document.getElementById('main-page');
  const favoritesPage = document.getElementById('favorites-page');
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.onclick = () => {
      window.location.href = 'options.html';
    };
  }
  const closeFavoritesBtn = document.getElementById('close-favorites');
  if (closeFavoritesBtn) {
    closeFavoritesBtn.onclick = () => {
      if (favoritesPage && mainPage) {
        favoritesPage.style.display = 'none';
        mainPage.style.display = '';
      }
    };
  }

  // Toggle mode button
  let mode = 'veganize';
  const toggleBtn = document.getElementById('toggle-mode');
  if (toggleBtn) {
    toggleBtn.onclick = () => {
      mode = mode === 'veganize' ? 'healthify' : 'veganize';
      toggleBtn.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
    };
  }

  // Send prompt to Gemini
  const sendBtn = document.getElementById('send-btn');
  if (sendBtn) {
    sendBtn.addEventListener('click', (e) => {
      // Check input validation before proceeding
      if (window.recipeInputValidator && !window.recipeInputValidator.isValid()) {
        window.recipeInputValidator.showToast();
        return;
      }
      generateRecipes();
    });
  }

  // Main chili button acts as send/display button
  const chiliBtn = document.getElementById('talk-btn');
  if (chiliBtn) {
    chiliBtn.addEventListener('click', (e) => {
      e.preventDefault();
      // Check input validation before proceeding
      if (window.recipeInputValidator && !window.recipeInputValidator.isValid()) {
        window.recipeInputValidator.showToast();
        return;
      }
      generateRecipes(true);
    });
  }

  // Handle Enter key in input field
  const inputField = document.getElementById('user-input');
  if (inputField) {
    inputField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        // Check input validation before proceeding
        if (window.recipeInputValidator && !window.recipeInputValidator.isValid()) {
          window.recipeInputValidator.showToast();
          return;
        }
        generateRecipes(true);
      }
    });
  }

  // Restart button functionality
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.onclick = (e) => {
      e.preventDefault();
      // Clear recipes and show the initial state
      document.getElementById('recipes-section').innerHTML = '';
      toggleInputContainer(true);
      toggleRestartButton(false);
      toggleHeadline(true);
      
      // Clear the input field
      const inputField = document.getElementById('user-input');
      if (inputField) {
        inputField.value = '';
        inputField.focus();
      }
    };
  }

  // Handle click on a recipe idea box
  async function handleRecipeClick(idx, idea) {
    const section = document.getElementById('recipes-section');
    
    // Save current scroll position
    const scrollPosition = window.scrollY;
    
    // Hide chili button and restart button when showing full recipe
    toggleChiliButton(false);
    toggleRestartButton(false);
    
    // Clear the recipe section and show loading state
    section.innerHTML = `
      <div class="full-recipe-modal">
        <div class="recipe-header">
          <h2 class="recipe-title">${idea.emoji} ${idea.title}</h2>
        </div>
        <div class="full-recipe-loading">Creating detailed recipe...</div>
      </div>
    `;
    
    try {
      // Get portions from localStorage for detailed recipe generation
      const portions = localStorage.getItem('portions') || 4;
      
      // Get Firebase token for authentication
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        section.innerHTML = `
          <div class="full-recipe-modal">
            <div class="recipe-header">
              <h2 class="recipe-title">${idea.emoji} ${idea.title}</h2>
            </div>
            <div class="full-recipe-content">Please log in to view detailed recipes.</div>
            <button id="back-to-ideas" class="back-button">← Back to ideas</button>
          </div>
        `;
        return;
      }
      
      const res = await fetch(`${getApiUrl()}/api/generate/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          prompt: `Generate detailed recipe for: ${idea.title}`,
          portions: parseInt(portions),
          mode: window.PageContext ? window.PageContext.getCurrentPageMode() : 'general',
          isDetailedRecipe: true,
          recipeIdea: {
            emoji: idea.emoji,
            title: idea.title,
            desc: idea.desc
          }
        })
      });
      
      if (!res.ok) throw new Error('Server error');
      const data = await res.json();
      
      if (data.message && !/I cannot provide a full recipe|my purpose is to generate three/i.test(data.message)) {
        // Get user allergies for display
        const allergies = await getUserAllergies();
        const allergyNote = formatAllergyNote(allergies);
        const allergyHtml = allergyNote ? `<div class="allergy-note">${allergyNote}</div>` : '';
        
        // Create the recipe content
        section.innerHTML = `
          <div class="full-recipe-modal">
            <div class="recipe-header">
              <h2 class="recipe-title">${idea.emoji} ${idea.title}</h2>
              <button class="favorite-btn" id="favorite-recipe" aria-label="Add to favorites">
                <span class="heart-icon">♡</span>
              </button>
            </div>
            ${allergyHtml}
            <div class="full-recipe-content">${data.message.replace(/\n/g, '<br>')}</div>
            <button id="back-to-ideas" class="back-button">← Back to ideas</button>
          </div>
        `;
        
        // Save the recipe to the database with the already-generated content
        let savedRecipeId = null;
        try {
          // Parse the recipe content into sections
          const recipeContent = data.message;
          
          // Extract ingredients section
          const ingredientsMatch = recipeContent.match(/ingredients:?([\s\S]*?)(?:instructions|directions|method|steps|preparation)/i);
          const ingredients = ingredientsMatch ? ingredientsMatch[1].trim().split('\n')
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
            }) : [];

          // Extract instructions/steps section
          const stepsMatch = recipeContent.match(/(?:instructions|directions|method|steps|preparation):?([\s\S]*?)(?:(?:tips|notes|variations):|$)/i);
          const steps = stepsMatch ? stepsMatch[1].trim().split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.trim().replace(/^[\d#*•.\-]+\s*/, '').trim()) : [];

          // Extract tips section if it exists
          const tipsMatch = recipeContent.match(/(?:tips|notes|variations):?([\s\S]*?)$/i);
          const tips = tipsMatch ? tipsMatch[1].trim() : '';

          // Get current page mode for saving
          const mode = window.PageContext ? window.PageContext.getCurrentPageMode() : 'general';
          
          // Log the parsed data

          
          // Create the request body
          const requestBody = {
            title: `${idea.emoji} ${idea.title}`,
            description: recipeContent,
            ingredients: JSON.stringify(ingredients),
            instructions: stepsMatch ? stepsMatch[1].trim() : '',
            steps: JSON.stringify(steps),
            portions: parseInt(localStorage.getItem('portions') || '4'),
            mode: mode
          };
          

          
          const saveResponse = await fetch(`${getApiUrl()}/api/save-suggestion`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(requestBody)
          });
          
          if (!saveResponse.ok) {
            throw new Error('Failed to save recipe');
          }

          const saveResult = await saveResponse.json();
          if (saveResult.success && saveResult.recipe_id) {
            savedRecipeId = saveResult.recipe_id;
          }
        } catch (saveError) {
          console.error('Failed to save recipe to database:', saveError);
        }
        
        // Add event listener to the back button
        document.getElementById('back-to-ideas').addEventListener('click', () => {
          const originalText = section.getAttribute('data-original-text');
          if (originalText) {
            renderRecipes(originalText);
            window.scrollTo(0, scrollPosition);
          }
        }, { once: true });
        
        // Add event listener to the favorite button
        const favoriteBtn = document.getElementById('favorite-recipe');
        if (favoriteBtn) {
          favoriteBtn.addEventListener('click', async () => {
            try {
              // Disable button during request
              favoriteBtn.disabled = true;
              favoriteBtn.style.opacity = '0.6';

              const isFavorited = favoriteBtn.classList.contains('favorited');
              
              if (isFavorited) {
                // Remove from favorites


                const response = await fetch(`/api/favorites/recipe/${savedRecipeId}`, {
                  method: 'DELETE',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  }
                });

                if (!response.ok) {
                  throw new Error('Failed to remove from favorites');
                }

                // Update UI to show unfavorited state
                const heartIcon = favoriteBtn.querySelector('.heart-icon');
                heartIcon.textContent = '♡';
                favoriteBtn.classList.remove('favorited');
                favoriteBtn.setAttribute('aria-label', 'Add to favorites');

                // Show feedback
                const feedbackDiv = document.createElement('div');
                feedbackDiv.className = 'favorite-feedback';
                feedbackDiv.textContent = 'Removed from favorites!';
                document.querySelector('.full-recipe-modal').appendChild(feedbackDiv);

                // Remove feedback after a few seconds
                setTimeout(() => {
                  feedbackDiv.style.opacity = '0';
                  setTimeout(() => feedbackDiv.remove(), 500);
                }, 2000);
              } else {
                // Add to favorites
                const recipeData = {
                  emoji: idea.emoji,
                  title: idea.title,
                  description: idea.desc,
                  fullRecipe: data.message,
                  recipe_id: savedRecipeId
                };
                
                const success = await addToFavorites(recipeData);
                
                if (success) {
                  
                  // Change the heart icon to show it's been favorited
                  const heartIcon = favoriteBtn.querySelector('.heart-icon');
                  heartIcon.textContent = '❤️';
                  favoriteBtn.classList.add('favorited');
                  favoriteBtn.setAttribute('aria-label', 'Remove from favorites');
                  
                  // Show feedback
                  const feedbackDiv = document.createElement('div');
                  feedbackDiv.className = 'favorite-feedback';
                  feedbackDiv.textContent = 'Added to favorites!';
                  document.querySelector('.full-recipe-modal').appendChild(feedbackDiv);
                  
                  // Remove feedback after a few seconds
                  setTimeout(() => {
                    feedbackDiv.style.opacity = '0';
                    setTimeout(() => feedbackDiv.remove(), 500);
                  }, 2000);
                } else {
                  throw new Error('Recipe already exists in favorites or failed to add');
                }
              }

              // Re-enable button after operation completes
              favoriteBtn.disabled = false;
              favoriteBtn.style.opacity = '1';
              
            } catch (error) {
              console.error('❌ Error managing favorites:', error);
              
              // Re-enable button on error
              favoriteBtn.disabled = false;
              favoriteBtn.style.opacity = '1';
              
              alert('Failed to update favorites. Please try again.');
            }
          });
        }
      } else {
        section.innerHTML = `
          <div class="full-recipe-modal">
            <div class="recipe-header">
              <h2 class="recipe-title">${idea.emoji} ${idea.title}</h2>
            </div>
            <div class="full-recipe-error">Sorry, I couldn't create a detailed recipe. Please try another suggestion.</div>
            <button id="back-to-ideas" class="back-button">← Back to ideas</button>
          </div>
        `;
        
        // Add event listener to the back button - use once:true to prevent multiple triggers
        document.getElementById('back-to-ideas').addEventListener('click', () => {
          const originalText = section.getAttribute('data-original-text');
          if (originalText) {
            renderRecipes(originalText);
            // Restore scroll position
            window.scrollTo(0, scrollPosition);
          }
        }, { once: true });
      }
    } catch (err) {
      section.innerHTML = `
        <div class="full-recipe-modal">
          <div class="recipe-header">
            <h2 class="recipe-title">${idea.emoji} ${idea.title}</h2>
          </div>
          <div class="full-recipe-error">Sorry, there was an error while creating this recipe. Please try again later.</div>
          <button id="back-to-ideas" class="back-button">← Back to ideas</button>
        </div>
      `;
      
      // Add event listener to the back button - use once:true to prevent multiple triggers
      document.getElementById('back-to-ideas').addEventListener('click', () => {
        const originalText = section.getAttribute('data-original-text');
        if (originalText) {
          renderRecipes(originalText);
          // Restore scroll position
          window.scrollTo(0, scrollPosition);
        }
      }, { once: true });
      
      console.error('Full recipe fetch error:', err);
    }
  }
  // Only run options logic if on options page
  // (No options logic here)

  // TODO: Wire up favorites and login if needed
});

