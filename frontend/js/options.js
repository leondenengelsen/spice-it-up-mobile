// Commented out for production:
// console.log('🔄 [OPTIONS] Script starting to load - BEFORE IMPORTS');

// Logic for the options page
import { getApiUrl } from './config.js';
import { AllergyModal } from './allergyModal.js';

// Commented out for production:
// console.log('🔄 [OPTIONS] Script loaded - AFTER IMPORTS');

// Helper function to show notifications
function showNotification(message, isError = false) {
  if (typeof Toastify === 'undefined') {
    console.error('Toastify not loaded');
    alert(message);
    return;
  }
  
  Toastify({
    text: message,
    duration: 3000,
    gravity: "bottom",
    position: "center",
    style: {
      background: isError ? "#e74c3c" : "var(--suggestion-bg)",
      color: isError ? "white" : "var(--suggestion-text)"
    }
  }).showToast();
}

// Function to load options from database
async function loadOptionsFromDatabase() {
  try {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.log('❌ No authentication token found');
      return false;
    }

    const response = await fetch(`${getApiUrl()}/api/options/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch options:', response.status);
      return false;
    }

    const options = await response.json();

    // Update UI with database values
    const portionSlider = document.getElementById('portion-slider');
    const portionValue = document.getElementById('portion-value');
    const adventureSlider = document.getElementById('adventure-slider');
    const adventureValue = document.getElementById('adventure-value');
    const allergySummary = document.getElementById('allergy-summary');
    
    if (options.portions) {
      portionSlider.value = options.portions;
      portionValue.textContent = options.portions;
      localStorage.setItem('portions', options.portions);
    }

    if (options.adventurousness) {
      adventureSlider.value = options.adventurousness;
      adventureValue.textContent = options.adventurousness;
      updateAdventureText(options.adventurousness);
      localStorage.setItem('adventurousness', options.adventurousness);
    }

    // Handle allergies from either location
    const allergies = options.allergies || (options.other_settings && options.other_settings.allergies) || [];
    localStorage.setItem('allergies', JSON.stringify(allergies));
    updateAllergySummary(allergies);

    return true;
  } catch (error) {
    console.error('❌ Error loading options:', error);
    return false;
  }
}

// Add a global error handler
window.addEventListener('error', (event) => {
  console.error('❌ [OPTIONS] Global error caught:', event.error);
  console.error('❌ [OPTIONS] Error stack:', event.error?.stack);
});

// Add an unhandled rejection handler
window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ [OPTIONS] Unhandled promise rejection:', event.reason);
  console.error('❌ [OPTIONS] Error stack:', event.reason?.stack);
});

let optionsDraft = {
  portions: 4,
  adventurousness: 1,
  other_settings: { allergies: [] }
};

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const portionSlider = document.getElementById('portion-slider');
    const portionValue = document.getElementById('portion-value');
    const adventureSlider = document.getElementById('adventure-slider');
    const adventureValue = document.getElementById('adventure-value');
    
    // Initialize allergy modal
    const allergyModal = new AllergyModal();
    const editAllergiesBtn = document.getElementById('edit-allergies');
    const allergySummary = document.getElementById('allergy-summary');

    // Load options from database
    const databaseLoadSuccess = await loadOptionsFromDatabase();
    
    // Only load from localStorage if database load failed
    if (!databaseLoadSuccess) {
      // Fallback to localStorage if database values aren't available
      const savedPortions = localStorage.getItem('portions');
      if (savedPortions && !portionSlider.value) {
        portionSlider.value = savedPortions;
        portionValue.textContent = savedPortions;
      }

      const savedAdventure = localStorage.getItem('adventurousness');
      if (savedAdventure && !adventureSlider.value) {
        adventureSlider.value = savedAdventure;
        adventureValue.textContent = savedAdventure;
        updateAdventureText(savedAdventure);
      }

      // Only load allergies from localStorage if we didn't get them from the database
      const savedAllergies = JSON.parse(localStorage.getItem('allergies') || '[]');
      if (savedAllergies.length > 0) {
        updateAllergySummary(savedAllergies);
      }
    }

    // After loading options from DB, update optionsDraft
    if (databaseLoadSuccess) {
      optionsDraft.portions = parseInt(portionSlider.value);
      optionsDraft.adventurousness = parseInt(adventureSlider.value);
      optionsDraft.other_settings.allergies = JSON.parse(localStorage.getItem('allergies') || '[]');
    }

    // Set up event listeners
    portionSlider.oninput = () => {
      portionValue.textContent = portionSlider.value;
      localStorage.setItem('portions', portionSlider.value);
      optionsDraft.portions = parseInt(portionSlider.value);
    };

    adventureSlider.oninput = () => {
      adventureValue.textContent = adventureSlider.value;
      updateAdventureText(adventureSlider.value);
      localStorage.setItem('adventurousness', adventureSlider.value);
      optionsDraft.adventurousness = parseInt(adventureSlider.value);
    };

    // Handle edit button click
    if (editAllergiesBtn) {
      editAllergiesBtn.onclick = () => {
        const currentAllergies = JSON.parse(localStorage.getItem('allergies') || '[]');
        allergyModal.init(currentAllergies, (updatedAllergies) => {
          localStorage.setItem('allergies', JSON.stringify(updatedAllergies));
          updateAllergySummary(updatedAllergies);
          optionsDraft.other_settings.allergies = updatedAllergies;
        });
        allergyModal.show();
      };
    }

    document.getElementById('options-form').onsubmit = async (e) => {
      e.preventDefault();
      console.log('🔄 [OPTIONS] Form submitted');
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        console.log('❌ [OPTIONS] No auth token for form submission');
        Toastify({
          text: "Please log in to save preferences",
          duration: 3000,
          gravity: "bottom",
          position: "center",
          style: {
            background: "#e74c3c",
            color: "white"
          }
        }).showToast();
        
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 2000);
        return;
      }
      
      try {
        console.log('🔄 [OPTIONS] Saving all options to database');
        console.log('🔗 [OPTIONS] Using API URL:', getApiUrl());
        // Send portions, adventurousness, and allergies in the PATCH request
        const requestBody = {
          portions: optionsDraft.portions,
          adventurousness: optionsDraft.adventurousness,
          allergies: optionsDraft.other_settings.allergies
        };
        console.log('📦 [OPTIONS] PATCH body:', JSON.stringify(requestBody, null, 2));
        const response = await fetch(`${getApiUrl()}/api/options`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(requestBody)
        });
        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ [OPTIONS] Failed to save settings:', response.status, response.statusText);
          console.error('❌ [OPTIONS] Error response:', errorText);
          throw new Error('Failed to save settings');
        }
        const responseData = await response.json();
        console.log('✅ [OPTIONS] Successfully saved settings:', responseData);
        Toastify({
          text: "All options saved ✅",
          duration: 3000,
          gravity: "bottom",
          position: "center",
          style: {
            background: "var(--suggestion-bg)",
            color: "var(--suggestion-text)"
          }
        }).showToast();
        setTimeout(() => {
          window.location.href = '/index.html';
        }, 1000);
      } catch (error) {
        console.error('❌ [OPTIONS] Error saving options:', error);
        Toastify({
          text: "Failed to save settings. Please try again.",
          duration: 3000,
          gravity: "bottom",
          position: "center",
          style: {
            background: "#e74c3c",
            color: "white"
          }
        }).showToast();
      }
    };

    // Add event listener for adventure-slider input
    if (adventureSlider) {
      adventureSlider.addEventListener('input', (e) => updateAdventureText(e.target.value));
    }
  } catch (error) {
    console.error('❌ Error during initialization:', error);
  }
});

function updateAdventureText(value) {
  const adventureTexts = [
    "Just a little",
    "Curious",
    "Open-minded",
    "Up for a ride",
    "Chef gone wild",
    "Go ballzy"
  ];
  document.getElementById("adventure-value").textContent = adventureTexts[value - 1];
}

function updateAllergySummary(allergies) {
  const summaryElement = document.getElementById('allergy-summary');
  if (!summaryElement) return;

  if (!allergies || allergies.length === 0) {
    summaryElement.innerHTML = '<p class="no-allergies">No allergies or dietary restrictions selected</p>';
    return;
  }

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

  // Separate allergies from dietary restrictions
  const regularAllergies = allergies.filter(allergy => 
    allergy !== 'lowfodmap' && allergy !== 'vegetarian'
  );
  const hasLowFodmap = allergies.includes('lowfodmap');
  const hasVegetarian = allergies.includes('vegetarian');

  let html = '';

  // Show regular allergies
  if (regularAllergies.length > 0) {
    const allergyTags = regularAllergies.map(allergy => 
      `<span class="allergy-tag">${allergyLabels[allergy] || allergy}</span>`
    ).join('');
    html += `<div class="allergy-tags">${allergyTags}</div>`;
  }

  // Show dietary restrictions separately
  if (hasLowFodmap || hasVegetarian) {
    const dietaryTags = [];
    if (hasLowFodmap) dietaryTags.push('<span class="dietary-tag">Low FODMAP (IBS)</span>');
    if (hasVegetarian) dietaryTags.push('<span class="dietary-tag vegetarian-tag">Vegetarian</span>');
    html += `<div class="dietary-tags">${dietaryTags.join('')}</div>`;
  }

  // If nothing to show
  if (!regularAllergies.length && !hasLowFodmap && !hasVegetarian) {
    html = '<p class="no-allergies">No allergies or dietary restrictions selected</p>';
  }

  summaryElement.innerHTML = html;
}
