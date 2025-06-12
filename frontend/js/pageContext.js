/**
 * Page Context Detection Module
 * Automatically detects which page the user is on and provides the appropriate mode
 */

/**
 * Get the current page mode based on the URL or page context
 * @returns {string} The current mode: 'general', 'vegan', or 'healthy'
 */
function getCurrentPageMode() {
  const currentPath = window.location.pathname;
  const currentPage = currentPath.split('/').pop() || 'index.html';
  
  // Remove file extension for comparison
  const pageName = currentPage.replace('.html', '');
  
  switch (pageName) {
    case 'veganize':
      return 'vegan';
    case 'healthify':
      return 'healthy';
    case 'index':
    case '':
    default:
      return 'general';
  }
}

/**
 * Get mode-specific messaging for the UI
 * @param {string} mode - The current mode
 * @returns {object} UI messages for the mode
 */
function getModeMessages(mode) {
  const messages = {
    general: {
      title: "Spice It Up!",
      subtitle: "Transform your everyday ingredients into exciting dishes",
      placeholder: "What ingredients do you have? (e.g., chicken, rice, broccoli)",
      buttonText: "Get Creative Ideas"
    },
    vegan: {
      title: "Veganize It!",
      subtitle: "Transform any dish into delicious plant-based alternatives",
      placeholder: "What dish would you like to make vegan? (e.g., spaghetti bolognese, chicken curry)",
      buttonText: "Get Vegan Ideas"
    },
    healthy: {
      title: "Healthify It!",
      subtitle: "Make any dish healthier while keeping it delicious",
      placeholder: "What dish would you like to make healthier? (e.g., pizza, mac and cheese, fried rice)",
      buttonText: "Get Healthy Ideas"
    }
  };
  
  return messages[mode] || messages.general;
}

/**
 * Update the page UI based on the current mode
 */
function updatePageUI() {
  const mode = getCurrentPageMode();
  const messages = getModeMessages(mode);
  
  // Update page elements if they exist (title is now hardcoded in HTML)
  // const titleElement = document.querySelector('h1');
  // if (titleElement) {
  //   titleElement.textContent = messages.title;
  // }
  
  // Subtitle is now hardcoded in HTML
  // const subtitleElement = document.querySelector('.subtitle, .hero p');
  // if (subtitleElement) {
  //   subtitleElement.textContent = messages.subtitle;
  // }
  
  const inputElement = document.querySelector('#ingredients-input');
  if (inputElement) {
    inputElement.placeholder = messages.placeholder;
  }
  
  const buttonElement = document.querySelector('#generate-btn');
  if (buttonElement) {
    buttonElement.textContent = messages.buttonText;
  }
  
  // Add mode-specific CSS class to body
  document.body.className = document.body.className.replace(/mode-\w+/g, '');
  document.body.classList.add(`mode-${mode}`);
  
  console.log(`🎯 Page mode detected: ${mode}`);
  return mode;
}

/**
 * Initialize page context when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
  updatePageUI();
});

// Export functions for use in other modules
window.PageContext = {
  getCurrentPageMode,
  getModeMessages,
  updatePageUI
};
