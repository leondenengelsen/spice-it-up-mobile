// Logic for the options page
import { handleLogout } from './firebase/auth.js';
import { AllergyModal } from './allergyModal.js';

document.addEventListener('DOMContentLoaded', () => {
  const portionSlider = document.getElementById('portion-slider');
  const portionValue = document.getElementById('portion-value');
  
  // Load saved value from localStorage if available
  const savedPortions = localStorage.getItem('portions');
  if (savedPortions) {
    portionSlider.value = savedPortions;
    portionValue.textContent = savedPortions;
  }
  
  portionSlider.oninput = () => {
    portionValue.textContent = portionSlider.value;
    localStorage.setItem('portions', portionSlider.value);
  };

  const adventureSlider = document.getElementById('adventure-slider');
  const adventureValue = document.getElementById('adventure-value');
  
  // Load saved adventure value from localStorage if available
  const savedAdventure = localStorage.getItem('adventurousness');
  if (savedAdventure) {
    adventureSlider.value = savedAdventure;
    adventureValue.textContent = savedAdventure;
    updateAdventureText(savedAdventure);
  }
  
  adventureSlider.oninput = () => {
    adventureValue.textContent = adventureSlider.value;
    updateAdventureText(adventureSlider.value);
    localStorage.setItem('adventurousness', adventureSlider.value);
  };

  // Initialize allergy modal
  const allergyModal = new AllergyModal();
  const editAllergiesBtn = document.getElementById('edit-allergies');
  const allergySummary = document.getElementById('allergy-summary');

  // Load and display saved allergies
  const savedAllergies = JSON.parse(localStorage.getItem('allergies') || '[]');
  updateAllergySummary(savedAllergies);

  // Handle edit button click
  if (editAllergiesBtn) {
    editAllergiesBtn.onclick = () => {
      allergyModal.init(savedAllergies, (updatedAllergies) => {
        localStorage.setItem('allergies', JSON.stringify(updatedAllergies));
        updateAllergySummary(updatedAllergies);
      });
      allergyModal.show();
    };
  }

  document.getElementById('options-form').onsubmit = async (e) => {
    e.preventDefault();
    
    // Get Firebase token
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
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
      // Save to localStorage
      localStorage.setItem('portions', portionSlider.value);
      
      // Get selected allergies from localStorage
      const allergies = JSON.parse(localStorage.getItem('allergies') || '[]');
      
      const response = await fetch('/api/options', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          portions: parseInt(portionSlider.value),
          adventurousness: parseInt(adventureSlider.value),
          other_settings: { 
            allergies: allergies
          }
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      // Redirect immediately after successful save
      window.location.href = '/index.html';
      
    } catch (error) {
      console.error('Error saving options:', error);
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
