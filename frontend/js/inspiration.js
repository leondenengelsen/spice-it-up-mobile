import { processRecipeDisplay } from './emojiUtils.js';
import { getApiUrl } from './config.js';

const ideasContainer = document.getElementById('ideas-container');
const shuffleBtn = document.getElementById('shuffle-btn');

function stripHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

function truncate(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function showLoading() {
  ideasContainer.innerHTML = '<div class="loading-state">Loading recipes...</div>';
}

function showError(msg) {
  ideasContainer.innerHTML = `<div class="error-message">${msg}</div>`;
}

function renderRecipeTitles(recipes) {
  ideasContainer.innerHTML = recipes.map(recipe => {
    const displayData = processRecipeDisplay(recipe);
    const { emoji, cleanTitle } = displayData;
    return `
      <div class="recipe-idea-box" data-recipe-id="${recipe.id}">
        <div class="title-row">
          <span class="recipe-emoji">${emoji || '🍽️'}</span>
          <span class="recipe-title"><b>${cleanTitle || recipe.title}</b></span>
        </div>
        <div class="recipe-desc">${recipe.description ? recipe.description.replace(/\n/g, ' ').slice(0, 120) : ''}</div>
      </div>
    `;
  }).join('');

  // Add click listeners
  document.querySelectorAll('.recipe-idea-box').forEach(box => {
    box.addEventListener('click', async (e) => {
      const recipeId = box.getAttribute('data-recipe-id');
      if (recipeId) showFullRecipe(recipeId);
    });
  });
}

async function fetchRandomRecipes() {
  showLoading();
  try {
    const res = await fetch(`${getApiUrl()}/api/recipes/random?count=5`);
    if (!res.ok) throw new Error('Failed to fetch recipes');
    const data = await res.json();
    if (!data.success || !data.recipes) throw new Error('No recipes found');
    renderRecipeTitles(data.recipes);
  } catch (err) {
    showError('Could not load recipes. Please try again later.');
  }
}

// Render full recipe modal (logic adapted from favorites.js)
function renderRecipeContent(recipe) {
  if (recipe.ingredients || recipe.steps) {
    let content = '';
    if (recipe.ingredients) {
      content += '<p><strong>Ingredients:</strong></p>\n<ul>';
      try {
        const ingredients = typeof recipe.ingredients === 'string' 
          ? JSON.parse(recipe.ingredients) 
          : recipe.ingredients;
        ingredients.forEach(ing => {
          if (!ing || (!ing.name && !ing.text)) return;
          if (
            (ing.type === 'header' && ing.text) ||
            (ing.name && ing.name.match(/^\*\*.*\*\*$/)) ||
            (ing.type === 'ingredient' && ing.name && ing.name.includes('**'))
          ) {
            const headerText = ing.text || ing.name.replace(/^\*\*|\*\*$/g, '');
            if (headerText.toLowerCase().includes('ingredients:')) return;
            content += `</ul>\n<p><strong>${headerText}</strong></p>\n<ul>`;
            return;
          }
          const parts = [];
          if (ing.quantity) parts.push(ing.quantity);
          if (ing.unit) parts.push(ing.unit);
          if (ing.name) parts.push(ing.name);
          const ingredientText = parts.join(' ').trim();
          if (ingredientText) content += `<li>${ingredientText}</li>`;
        });
      } catch (error) {
        content += `<li>${recipe.ingredients}</li>`;
      }
      content += '</ul>\n\n';
    }
    if (recipe.instructions) {
      content += '<p><strong>Instructions:</strong></p>\n';
      content += recipe.instructions.replace(/\n/g, '<br>') + '<br>\n\n';
    }
    if (recipe.steps && (!recipe.instructions || recipe.steps.length > 0)) {
      try {
        const steps = typeof recipe.steps === 'string'
          ? JSON.parse(recipe.steps)
          : recipe.steps;
        if (!recipe.instructions && steps.length > 0) {
          content += '<p><strong>Instructions:</strong></p>\n';
          content += steps.map(step => step && !step.startsWith('*') && !step.startsWith('Tips') ? `${step}<br>` : '').join('') + '\n\n';
        }
      } catch (error) {}
    }
    return content;
  }
  return recipe.content ? recipe.content.replace(/\n/g, '<br>') : recipe.description.replace(/\n/g, '<br>');
}

async function showFullRecipe(recipeId) {
  try {
    const res = await fetch(`${getApiUrl()}/api/recipes/${recipeId}`);
    if (!res.ok) throw new Error('Failed to fetch recipe');
    const data = await res.json();
    if (!data.success || !data.recipe) throw new Error('Invalid recipe data received');
    const recipe = data.recipe;
    const displayData = processRecipeDisplay(recipe);
    const { emoji, cleanTitle } = displayData;
    // Hide shuffle button in full recipe view
    if (shuffleBtn) shuffleBtn.style.display = 'none';
    ideasContainer.innerHTML = `
      <div class="full-recipe-modal">
        <div class="recipe-header">
          <h2 class="recipe-title">${emoji || '🍽️'} ${cleanTitle || recipe.title}</h2>
        </div>
        <div class="full-recipe-content">
          ${renderRecipeContent(recipe)}
        </div>
        <button id="back-to-list" class="back-button">← Back to list</button>
      </div>
    `;
    document.getElementById('back-to-list').addEventListener('click', () => {
      if (shuffleBtn) shuffleBtn.style.display = '';
      fetchRandomRecipes();
    });
  } catch (error) {
    showError('Failed to load recipe details');
  }
}

if (shuffleBtn) {
  shuffleBtn.addEventListener('click', fetchRandomRecipes);
}

document.addEventListener('DOMContentLoaded', () => {
  // Hamburger navigation to options page
  const hamburger = document.getElementById('hamburger');
  if (hamburger) {
    hamburger.onclick = () => {
      window.location.href = 'options.html';
    };
  }
  fetchRandomRecipes();
}); 