// Logic for the options page
import { handleLogout } from './firebase/auth.js';
import { AllergyModal } from './allergyModal.js';
import { getApiUrl, isNativeApp } from './config.js';

// Function to load options from database
async function loadOptionsFromDatabase() {
  console.log('🔄 [OPTIONS] Starting to load options from database');
  console.log('📱 [OPTIONS] Is native app:', isNativeApp);
  console.log('🔗 [OPTIONS] API URL:', getApiUrl());
  console.log('🌐 [OPTIONS] Full API endpoint:', `${getApiUrl()}/api/options/`);
  
  try {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.log('❌ [OPTIONS] No authentication token found');
      return false;
    }
    console.log('✅ [OPTIONS] Found auth token:', token.substring(0, 10) + '...');

    console.log('🔄 [OPTIONS] Making fetch request to:', `${getApiUrl()}/api/options/`);
    const response = await fetch(`${getApiUrl()}/api/options/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('📡 [OPTIONS] Response status:', response.status);
    console.log('📡 [OPTIONS] Response status text:', response.statusText);

    if (!response.ok) {
      console.error('❌ [OPTIONS] Failed to fetch options:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('❌ [OPTIONS] Error response:', errorText);
      return false;
    }

    const options = await response.json();
    console.log('✅ [OPTIONS] Successfully loaded options:', JSON.stringify(options, null, 2));
    console.log('🔍 [OPTIONS] Has other_settings:', !!options.other_settings);
    console.log('🔍 [OPTIONS] Has allergies:', !!(options.other_settings && options.other_settings.allergies));

    // Update UI with database values
    const portionSlider = document.getElementById('portion-slider');
    const portionValue = document.getElementById('portion-value');
    const adventureSlider = document.getElementById('adventure-slider');
    const adventureValue = document.getElementById('adventure-value');
    const allergySummary = document.getElementById('allergy-summary');

    console.log('🔄 [OPTIONS] Updating UI with database values');
    
    if (options.portions) {
      console.log('📊 [OPTIONS] Setting portions to:', options.portions);
      portionSlider.value = options.portions;
      portionValue.textContent = options.portions;
      localStorage.setItem('portions', options.portions);
    }

    if (options.adventurousness) {
      console.log('🎯 [OPTIONS] Setting adventurousness to:', options.adventurousness);
      adventureSlider.value = options.adventurousness;
      adventureValue.textContent = options.adventurousness;
      updateAdventureText(options.adventurousness);
      localStorage.setItem('adventurousness', options.adventurousness);
    }

    // Handle allergies from either location
    const allergies = options.allergies || (options.other_settings && options.other_settings.allergies) || [];
    console.log('⚠️ [OPTIONS] Setting allergies to:', allergies);
    localStorage.setItem('allergies', JSON.stringify(allergies));
    updateAllergySummary(allergies);

    console.log('✅ [OPTIONS] Finished updating UI with database values');
    return true;
  } catch (error) {
    console.error('❌ [OPTIONS] Error loading options:', error);
    console.error('❌ [OPTIONS] Error stack:', error.stack);
    return false;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🔄 [OPTIONS] DOM Content Loaded');
  console.log('📱 [OPTIONS] Is native app:', isNativeApp);
  console.log('🔗 [OPTIONS] API URL:', getApiUrl());
  
  const portionSlider = document.getElementById('portion-slider');
  const portionValue = document.getElementById('portion-value');
  const adventureSlider = document.getElementById('adventure-slider');
  const adventureValue = document.getElementById('adventure-value');
  
  // Initialize allergy modal
  const allergyModal = new AllergyModal();
  const editAllergiesBtn = document.getElementById('edit-allergies');
  const allergySummary = document.getElementById('allergy-summary');

  console.log('🔄 [OPTIONS] Starting to load options from database');
  const databaseLoadSuccess = await loadOptionsFromDatabase();
  
  // Only load from localStorage if database load failed
  if (!databaseLoadSuccess) {
    console.log('⚠️ [OPTIONS] Database load failed, using localStorage values');
    // Fallback to localStorage if database values aren't available
    const savedPortions = localStorage.getItem('portions');
    if (savedPortions && !portionSlider.value) {
      console.log('📊 [OPTIONS] Using localStorage fallback for portions:', savedPortions);
      portionSlider.value = savedPortions;
      portionValue.textContent = savedPortions;
    }

    const savedAdventure = localStorage.getItem('adventurousness');
    if (savedAdventure && !adventureSlider.value) {
      console.log('🎯 [OPTIONS] Using localStorage fallback for adventurousness:', savedAdventure);
      adventureSlider.value = savedAdventure;
      adventureValue.textContent = savedAdventure;
      updateAdventureText(savedAdventure);
    }

    // Only load allergies from localStorage if we didn't get them from the database
    const savedAllergies = JSON.parse(localStorage.getItem('allergies') || '[]');
    if (savedAllergies.length > 0) {
      console.log('⚠️ [OPTIONS] Using localStorage fallback for allergies:', savedAllergies);
      updateAllergySummary(savedAllergies);
    }
  }

  portionSlider.oninput = () => {
    portionValue.textContent = portionSlider.value;
    localStorage.setItem('portions', portionSlider.value);
  };

  adventureSlider.oninput = () => {
    adventureValue.textContent = adventureSlider.value;
    updateAdventureText(adventureSlider.value);
    localStorage.setItem('adventurousness', adventureSlider.value);
  };

  // Handle edit button click
  if (editAllergiesBtn) {
    editAllergiesBtn.onclick = () => {
      const currentAllergies = JSON.parse(localStorage.getItem('allergies') || '[]');
      allergyModal.init(currentAllergies, (updatedAllergies) => {
        localStorage.setItem('allergies', JSON.stringify(updatedAllergies));
        updateAllergySummary(updatedAllergies);
      });
      allergyModal.show();
    };
  }

  document.getElementById('options-form').onsubmit = async (e) => {
    e.preventDefault();
    console.log('🔄 [OPTIONS] Form submitted');
    
    // Get Firebase token
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
      console.log('🔄 [OPTIONS] Saving options to database');
      console.log('🔗 [OPTIONS] Using API URL:', getApiUrl());
      
      // Save to localStorage
      localStorage.setItem('portions', portionSlider.value);
      
      // Get selected allergies from localStorage
      const allergies = JSON.parse(localStorage.getItem('allergies') || '[]');
      
      const requestBody = {
        portions: parseInt(portionSlider.value),
        adventurousness: parseInt(adventureSlider.value),
        allergies: allergies  // Send allergies at root level
      };
      console.log('📦 [OPTIONS] Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(`${getApiUrl()}/api/options`, {
        method: 'POST',
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

      console.log('✅ [OPTIONS] Successfully saved settings');
      // Redirect immediately after successful save
      window.location.href = '/index.html';
      
    } catch (error) {
      console.error('❌ [OPTIONS] Error saving options:', error);
      console.error('❌ [OPTIONS] Error stack:', error.stack);
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

  // Handle logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.onclick = handleLogout;
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

  const tags = allergies.map(allergy => 
    `<span class="allergy-tag">${allergyLabels[allergy] || allergy}</span>`
  ).join('');

  summaryElement.innerHTML = `<div class="allergy-tags">${tags}</div>`;
}
