// filepath: /Users/leondenengelsen/Library/CloudStorage/Dropbox/WEBSITES/Github/spice-It-Up/frontend/js/favorites.js
// Favorites page functionality

// Import Firebase modules
import { auth } from './firebase/init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getApiUrl } from './config.js';
import { processRecipeDisplay } from './emojiUtils.js';

// Global variables for authenticated user state
let currentUserId = null;

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
    gluten: 'Gluten',
    dairy: 'All Dairy',
    eggs: 'Eggs',
    peanuts: 'Peanuts',
    tree_nuts: 'Tree Nuts',
    soy: 'Soy',
    wheat: 'Wheat',
    fish: 'Fish',
    shellfish: 'Shellfish',
    sesame: 'Sesame',
    cowmilk: 'Cow Milk',
    mustard: 'Mustard',
    celery: 'Celery',
    lupin: 'Lupin',
    sulfites: 'Sulfites',
    nightshades: 'Nightshades',
    corn: 'Corn',
    lactose: 'Lactose',
    vegan: 'Vegan',
    vegetarian: 'Vegetarian'
  };

  // Filter out lowfodmap and vegetarian from regular allergies display
  const regularAllergies = allergies.filter(allergy => 
    allergy !== 'lowfodmap' && allergy !== 'vegetarian'
  );
  const hasLowFodmap = allergies.includes('lowfodmap');
  const hasVegetarian = allergies.includes('vegetarian');

  const displayAllergies = regularAllergies.map(allergy => 
    allergyLabels[allergy] || allergy
  ).join(', ');

  // Create allergy note parts
  const parts = [];
  if (displayAllergies) {
    parts.push(`${displayAllergies} | allergy-friendly`);
  }
  if (hasLowFodmap) {
    parts.push('Low FODMAP friendly');
  }
  if (hasVegetarian) {
    parts.push('Vegetarian');
  }

  return parts.join(' • ');
}

// Export only the functions needed by other modules
export { addToFavorites, getCurrentUser, showFullRecipe, backToFavorites, removeFavorite };

// Make functions available on window for HTML onclick handlers
window.showFullRecipe = showFullRecipe;
window.backToFavorites = backToFavorites;
window.removeFavorite = removeFavorite;

// Function to get current user info from API
async function getCurrentUser() {
  try {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      throw new Error('No authentication token available');
    }

    const apiUrl = `${getApiUrl()}/api/auth/user-info`;
    console.log('API URL for user info:', apiUrl);
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to get user info');
    }

    const userInfo = await response.json();
    currentUserId = userInfo.id;
    console.log('✅ Current user ID:', currentUserId);
    return userInfo;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}

// Helper to detect favorites page robustly
function isFavoritesPage() {
  const path = window.location.pathname.replace(/^\//, ''); // Remove leading slash if present
  return (
    path === 'favorites' ||
    path === 'favorites.html' ||
    window.location.pathname.endsWith('/favorites') ||
    window.location.pathname.endsWith('/favorites.html')
  );
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('[favorites.js] DOMContentLoaded fired. Current path:', window.location.pathname);
  // Initialize auth state listener
  onAuthStateChanged(auth, async (user) => {
    console.log('[favorites.js] onAuthStateChanged user:', user);
    if (user) {
      console.log('[favorites.js] User authenticated:', user.email);
      try {
        // Get internal user ID from the API
        await getCurrentUser();
        // Initialize favorites page only if we're on the favorites page
        if (isFavoritesPage()) {
          console.log('[favorites.js] Path matches favorites page, initializing favorites page.');
          initializeFavoritesPage();
        } else {
          console.log('[favorites.js] Path does NOT match favorites page, not initializing favorites page.');
        }
      } catch (error) {
        console.error('[favorites.js] Error getting user info:', error);
        if (isFavoritesPage()) {
          showError('Failed to load user information. Please try again.');
        }
      }
    } else {
      console.log('[favorites.js] No authenticated user');
      currentUserId = null;
      // Redirect to login page only for protected pages that require auth
      const currentPath = window.location.pathname;
      if (
        isFavoritesPage() ||
        currentPath.endsWith('/admin.html') ||
        currentPath.endsWith('/account-settings.html')
      ) {
        window.location.href = '/login.html';
      }
    }
  });
  
  // Navigation (only on favorites page to avoid conflicts with app.js)
  if (isFavoritesPage()) {
    console.log('[favorites.js] Setting up hamburger navigation for favorites page.');
    const hamburger = document.getElementById('hamburger');
    if (hamburger) {
      hamburger.onclick = () => {
        window.location.href = 'options.html';
      };
    }
  }
});

function initializeFavoritesPage() {
  console.log('[favorites.js] initializeFavoritesPage called');
  loadFavorites();
}

function loadFavorites() {
  console.log('[favorites.js] loadFavorites called');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const favoritesGrid = document.getElementById('favorites-grid');
  
  // Show loading state
  if (loadingState) loadingState.style.display = 'block';
  if (emptyState) emptyState.style.display = 'none';
  if (favoritesGrid) favoritesGrid.style.display = 'none';
  
  // Fetch favorites from database
  fetchFavoritesFromDatabase();
}

async function fetchFavoritesFromDatabase() {
  console.log('[favorites.js] fetchFavoritesFromDatabase called');
  const loadingState = document.getElementById('loading-state');
  const emptyState = document.getElementById('empty-state');
  const favoritesGrid = document.getElementById('favorites-grid');
  
  try {
    // Get Firebase token for authentication
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.log('[favorites.js] No firebaseToken found in localStorage');
      showError('Please log in to view your favorites.');
      return;
    }

    const apiUrl = `${getApiUrl()}/api/favorites`;
    console.log('[favorites.js] API URL for favorites:', apiUrl);
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      const favorites = result.favorites || [];
      console.log('[favorites.js] Fetched favorites:', favorites);
      
      if (favorites.length === 0) {
        // Show empty state
        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'block';
        if (favoritesGrid) favoritesGrid.style.display = 'none';
      } else {
        // Show favorites
        if (loadingState) loadingState.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (favoritesGrid) favoritesGrid.style.display = 'block';
        renderFavorites(favorites);
      }
    } else {
      console.error('[favorites.js] Failed to fetch favorites:', response.statusText);
      showError('Failed to load favorites. Please try again.');
    }
  } catch (error) {
    console.error('[favorites.js] Error fetching favorites:', error);
    showError('Error loading favorites. Please try again.');
  }
}

function showError(message) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

function renderFavorites(favorites) {
  const favoritesGrid = document.getElementById('favorites-grid');
  if (!favoritesGrid) {
    console.error('[favorites.js] Could not find #favorites-grid in DOM!');
    return;
  }
  favoritesGrid.innerHTML = favorites.map((favorite, index) => {
    // Process recipe title for display using frontend utilities
    const displayData = processRecipeDisplay(favorite);
    const { emoji, cleanTitle } = displayData;
    const { recipe_id } = favorite;
    
    // Create a short description from the title, similar to recipe ideas
    // Remove the emoji and create a descriptive sentence
    const shortDescription = cleanTitle ? 
      `A delicious ${cleanTitle.toLowerCase()} recipe with creative twists and fresh flavors.` :
      'A creative recipe variation with unique ingredients and techniques.';
    
    return `
      <div class="recipe-idea-box" onclick="showFullRecipe(${recipe_id})">
        <div class="title-row">
          <span class="recipe-emoji">${emoji}</span>
          <span class="recipe-title"><b>${cleanTitle}</b></span>
          <button class="favorite-btn favorited" 
            onclick="event.stopPropagation(); removeFavorite(${recipe_id})" 
            aria-label="Remove from favorites">
            <span class="heart-icon">❤️</span>
          </button>
        </div>
        <div class="recipe-desc">${shortDescription}</div>
        <div class="recipe-meta">
          <small>Saved: ${formatDate(favorite.favorited_at)}</small>
        </div>
      </div>
    `;
  }).join('');
  
  // Store favorites globally for access in event handlers
  window.currentFavorites = favorites;
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

async function removeFavorite(recipeId) {
  try {
    // Get Firebase token for authentication
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      showFeedback('Please log in to remove favorites');
      return;
    }

    // Show immediate visual feedback
    const favoriteBtn = document.querySelector(`[onclick="removeFavorite(${recipeId})"]`);
    if (favoriteBtn) {
      const heartIcon = favoriteBtn.querySelector('.heart-icon');
      if (heartIcon) {
        heartIcon.textContent = '♡';
        favoriteBtn.classList.remove('favorited');
      }
    }
    
    // Show feedback message
    showFeedback('Removing from favorites...');
    
    const apiUrl = `${getApiUrl()}/api/favorites/recipe/${recipeId}`;
    const response = await fetch(apiUrl, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to remove favorite');
    }
    
    // Show success feedback
    showFeedback('Removed from favorites!');
    
    // Refresh the favorites list immediately
    loadFavorites();
    
  } catch (error) {
    console.error('Error removing favorite:', error);
    showFeedback('Error removing favorite');
    
    // Revert the heart icon on error
    const favoriteBtn = document.querySelector(`[onclick="removeFavorite(${recipeId})"]`);
    if (favoriteBtn) {
      const heartIcon = favoriteBtn.querySelector('.heart-icon');
      if (heartIcon) {
        heartIcon.textContent = '❤️';
        favoriteBtn.classList.add('favorited');
      }
    }
  }
}

function showFeedback(message) {
  // Remove existing feedback
  const existingFeedback = document.querySelector('.favorite-feedback');
  if (existingFeedback) {
    existingFeedback.remove();
  }
  
  // Create and show feedback
  const feedback = document.createElement('div');
  feedback.className = 'favorite-feedback';
  feedback.textContent = message;
  document.body.appendChild(feedback);
  
  // Remove after 2 seconds
  setTimeout(() => {
    feedback.style.opacity = '0';
    setTimeout(() => {
      if (feedback.parentNode) {
        feedback.parentNode.removeChild(feedback);
      }
    }, 500);
  }, 2000);
}

async function showFullRecipe(recipeId) {
  try {
    const apiUrl = `${getApiUrl()}/api/recipes/${recipeId}`;
    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch recipe');
    }
    
    const data = await response.json();
    if (!data.success || !data.recipe) {
      throw new Error('Invalid recipe data received');
    }
    
    const recipe = data.recipe;
    
    // Get user allergies for display
    const allergies = await getUserAllergies();
    const allergyNote = formatAllergyNote(allergies);
    const allergyHtml = allergyNote ? `<div class="allergy-note">${allergyNote}</div>` : '';
    
    // Process recipe title for display
    const displayData = processRecipeDisplay(recipe);
    const { emoji, cleanTitle } = displayData;
    
    // Create the recipe content
    const section = document.getElementById('favorites-grid');
    section.innerHTML = `
      <div class="full-recipe-modal">
        <div class="recipe-header">
          <h2 class="recipe-title">${emoji} ${cleanTitle}</h2>
          <button class="favorite-btn favorited" id="favorite-recipe" aria-label="Remove from favorites">
            <span class="heart-icon">❤️</span>
          </button>
        </div>
        ${allergyHtml}
        <div class="full-recipe-content">
          ${renderRecipeContent(recipe)}
        </div>
        <button id="back-to-ideas" class="back-button">← Back to favorites</button>
      </div>
    `;
    
    // Add event listener to the back button
    document.getElementById('back-to-ideas').addEventListener('click', () => {
      // Reload favorites to show the grid again
      loadFavorites();
    }, { once: true });
    
    // Add event listener to the favorite button
    const favoriteBtn = document.getElementById('favorite-recipe');
    if (favoriteBtn) {
      favoriteBtn.addEventListener('click', () => removeFavorite(recipeId));
    }
    
  } catch (error) {
    console.error('Error showing full recipe:', error);
    showError('Failed to load recipe details');
  }
}

// Helper function to render recipe content with structured data
function renderRecipeContent(recipe) {
  // If we have structured data, use it
  if (recipe.ingredients || recipe.steps) {
    let content = '';
    
    // Add ingredients section if available
    if (recipe.ingredients) {
      content += '<p><strong>Ingredients:</strong></p><br>\n<ul>';
      try {
        // Parse ingredients if it's a string, otherwise use as is
        const ingredients = typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients) 
          : recipe.ingredients;

        ingredients.forEach(ing => {
          // Skip empty ingredients
          if (!ing || (!ing.name && !ing.text)) return;

          // Handle section headers
          if (
            (ing.type === 'header' && ing.text) || // New format
            (ing.name && ing.name.match(/^\*\*.*\*\*$/)) || // Old format with **text**
            (ing.type === 'ingredient' && ing.name && ing.name.includes('**')) // Mixed format
          ) {
            const headerText = ing.text || ing.name.replace(/^\*\*|\*\*$/g, '');
            if (headerText.toLowerCase().includes('ingredients:')) return; // Skip main ingredients header
            content += `</ul>\n<p><strong>${headerText}</strong></p>\n<ul>`;
            return;
          }
          
          // Format the ingredient line
          const parts = [];
          if (ing.quantity) {
            // Handle fractions (e.g., "1/2" -> "½")
            const quantity = ing.quantity
              .replace('1/2', '½')
              .replace('1/3', '⅓')
              .replace('2/3', '⅔')
              .replace('1/4', '¼')
              .replace('3/4', '¾')
              .replace('1/8', '⅛')
              .replace('3/8', '⅜')
              .replace('5/8', '⅝')
              .replace('7/8', '⅞');
            parts.push(quantity);
          }
          if (ing.unit) {
            // Clean up the unit
            const unit = ing.unit
              .replace(/^frozen\s+/, '') // Remove 'frozen' prefix
              .replace(/\s+.*$/, ''); // Remove anything after the unit
            parts.push(unit);
          }
          if (ing.name) {
            // Clean up the ingredient name
            let name = ing.name
              .replace(/^[-*•]\s*/, '') // Remove bullet points
              .replace(/^\d+\/\d+\s*/, '') // Remove fractions at the start
              .replace(/^[A-Za-z]+\s+/, '') // Remove units at the start
              .trim();
            
            // If the unit got split (like "tablespoons sriracha"), combine it back
            if (ing.unit && ing.unit.includes(' ')) {
              const unitParts = ing.unit.split(' ');
              name = unitParts.slice(1).join(' ') + ' ' + name;
            }
            
            parts.push(name);
          }
          
          const ingredientText = parts.join(' ').trim();
          if (ingredientText) {
            content += `<li>${ingredientText}</li>`;
          }
        });
      } catch (error) {
        console.error('Error parsing ingredients:', error);
        // Fallback: display raw ingredients if parsing fails
        content += `<li>${recipe.ingredients}</li>`;
      }
      content += '</ul>\n\n';
    }
    
    // Add instructions section if available
    if (recipe.instructions) {
      content += '<p><strong>Instructions:</strong></p><br>\n';
      content += recipe.instructions.replace(/\n/g, '<br>') + '\n\n';
    }
    
    // Add steps section if available and different from instructions
    if (recipe.steps && (!recipe.instructions || recipe.steps.length > 0)) {
      try {
        // Parse steps if it's a string, otherwise use as is
        const steps = typeof recipe.steps === 'string'
          ? JSON.parse(recipe.steps)
          : recipe.steps;

        if (!recipe.instructions && steps.length > 0) {
          content += '<p><strong>Instructions:</strong></p><br>\n<ol>';
          steps.forEach(step => {
            // Skip empty steps or formatting
            if (step && !step.startsWith('*') && !step.startsWith('Tips')) {
              content += `<li>${step}</li>`;
            }
          });
          content += '</ol>\n\n';
        }
      } catch (error) {
        console.error('Error parsing steps:', error);
      }
    }
    
    return content;
  }
  
  // Fallback to using description/content if no structured data
  return recipe.content ? recipe.content.replace(/\n/g, '<br>') : recipe.description.replace(/\n/g, '<br>');
}

function backToFavorites() {
  const modal = document.querySelector('.full-recipe-modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
}

// Helper function to add a favorite (can be called from other pages)
async function addToFavorites(recipe) {
  if (!recipe.recipe_id) {
    console.log('⚠️ No recipe_id provided, cannot save to database');
    return false;
  }

  try {
    // Get Firebase token for authentication
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.error('❌ No authentication token found');
      return false;
    }

    // Save to database
    console.log('🔄 Saving favorite to database:', {
      recipe_id: recipe.recipe_id
    });
    
    const apiUrl = `${getApiUrl()}/api/favorites`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        recipe_id: recipe.recipe_id
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Failed to save to database:', errorData);
      return false;
    }

    const result = await response.json();
    console.log('✅ Favorite saved to database successfully:', result);
    return true;
    
  } catch (error) {
    console.error('❌ Error saving favorite:', error);
    return false;
  }
}

// Add event listener for escape key to close modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    backToFavorites();
  }
});