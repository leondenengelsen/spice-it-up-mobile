import { processRecipeDisplay } from './emojiUtils.js';
import { parseRecipeIdea } from './app.js';
import { getApiUrl } from './config.js';
import { addToFavorites, removeFavorite, showFullRecipe } from './favorites.js';

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

// Helper to fetch user allergies (copied from favorites.js)
async function getUserAllergies() {
  try {
    const token = localStorage.getItem('firebaseToken');
    if (!token) return [];
    const response = await fetch(`${getApiUrl()}/api/options/`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) return [];
    const options = await response.json();
    return options.allergies || (options.other_settings && options.other_settings.allergies) || [];
  } catch {
    return [];
  }
}

function formatAllergyNote(allergies) {
  if (!allergies || allergies.length === 0) return '';
  const allergyLabels = {
    gluten: 'Gluten', dairy: 'All Dairy', eggs: 'Eggs', peanuts: 'Peanuts', tree_nuts: 'Tree Nuts', soy: 'Soy', wheat: 'Wheat', fish: 'Fish', shellfish: 'Shellfish', sesame: 'Sesame', cowmilk: 'Cow Milk', mustard: 'Mustard', celery: 'Celery', lupin: 'Lupin', sulfites: 'Sulfites', nightshades: 'Nightshades', corn: 'Corn', lactose: 'Lactose', vegan: 'Vegan', vegetarian: 'Vegetarian'
  };
  const regularAllergies = allergies.filter(a => a !== 'lowfodmap' && a !== 'vegetarian');
  const hasLowFodmap = allergies.includes('lowfodmap');
  const hasVegetarian = allergies.includes('vegetarian');
  const displayAllergies = regularAllergies.map(a => allergyLabels[a] || a).join(', ');
  const parts = [];
  if (displayAllergies) parts.push(`${displayAllergies} | allergy-friendly`);
  if (hasLowFodmap) parts.push('Low FODMAP friendly');
  if (hasVegetarian) parts.push('Vegetarian');
  return parts.join(' • ');
}

function renderIdeas(ideas) {
  ideasContainer.innerHTML = ideas.map((idea, idx) => {
    const parsed = parseRecipeIdea(idea.title, idx);
    return `
      <div class="recipe-idea-box" data-idx="${idx}" data-recipe-id="${idea.recipe_id}">
        <div class="title-row">
          <span class="recipe-emoji">${parsed.emoji}</span>
          <span class="recipe-title"><b>${parsed.title}</b></span>
        </div>
        ${parsed.desc ? `<div class="recipe-desc">${parsed.desc}</div>` : ''}
      </div>
    `;
  }).join('');
  // Attach click handlers for opening full recipe modal (use showFullRecipe from favorites.js)
  Array.from(document.getElementsByClassName('recipe-idea-box')).forEach((box) => {
    const recipeId = box.getAttribute('data-recipe-id');
    if (recipeId) {
      box.onclick = () => showFullRecipe(recipeId);
    }
  });
}

function showLoading() {
  ideasContainer.innerHTML = '<div class="loading-state">Loading inspiration...</div>';
}

function showError(msg) {
  ideasContainer.innerHTML = `<div class="error-message">${msg}</div>`;
}

async function fetchRandomIdeas() {
  showLoading();
  try {
    const apiUrl = `${getApiUrl()}/api/recipes/recipe-suggestions/random?count=3`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error('Failed to fetch ideas');
    const data = await res.json();
    if (!data.success || !data.recipes) throw new Error('No ideas found');
    renderIdeas(data.recipes);
  } catch (err) {
    showError('Could not load inspiration. Please try again later.');
  }
}

// Debounce to prevent rapid double-clicks
let shuffleTimeout = null;
if (shuffleBtn) {
  shuffleBtn.addEventListener('click', () => {
    if (shuffleTimeout) return;
    fetchRandomIdeas();
    shuffleBtn.disabled = true;
    shuffleTimeout = setTimeout(() => {
      shuffleBtn.disabled = false;
      shuffleTimeout = null;
    }, 700);
  });
}

document.addEventListener('DOMContentLoaded', fetchRandomIdeas); 