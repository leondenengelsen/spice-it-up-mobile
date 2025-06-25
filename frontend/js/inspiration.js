import { processRecipeDisplay } from './emojiUtils.js';
import { parseRecipeIdea } from './app.js';

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

function renderIdeas(ideas) {
  ideasContainer.innerHTML = ideas.map((idea, idx) => {
    // Use parseRecipeIdea to split emoji, title, desc from idea.title
    const parsed = parseRecipeIdea(idea.title, idx);
    return `
      <div class="recipe-idea-box">
        <div class="title-row">
          <span class="recipe-emoji">${parsed.emoji}</span>
          <span class="recipe-title"><b>${parsed.title}</b></span>
        </div>
        ${parsed.desc ? `<div class="recipe-desc">${parsed.desc}</div>` : ''}
      </div>
    `;
  }).join('');
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
    const res = await fetch('/api/recipes/recipe-suggestions/random?count=3');
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