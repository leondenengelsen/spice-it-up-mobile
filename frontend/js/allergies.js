// Allergy utilities and data management
import { getApiUrl } from './config.js';

// Allergy labels mapping
const ALLERGY_LABELS = {
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

/**
 * Get user allergies from localStorage
 * @returns {Array} Array of allergies or empty array
 */
export function getLocalAllergies() {
  try {
    const allergies = localStorage.getItem('allergies');
    return allergies ? JSON.parse(allergies) : [];
  } catch (error) {
    console.error('❌ Error getting local allergies:', error);
    return [];
  }
}

/**
 * Save allergies to localStorage only
 * @param {Array} allergies - Array of allergy strings to save
 */
export function saveLocalAllergies(allergies) {
  const allergiesArray = Array.isArray(allergies) ? allergies : [];
  localStorage.setItem('allergies', JSON.stringify(allergiesArray));
}

/**
 * Get user allergies from the API
 * @returns {Promise<Array>} Array of allergies or empty array
 */
export async function getUserAllergies() {
  try {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.log('🔍 No Firebase token found for getUserAllergies');
      return getLocalAllergies(); // Fallback to localStorage
    }

    const response = await fetch(`${getApiUrl()}/api/options/`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      console.error('❌ Failed to fetch user allergies:', response.status, response.statusText);
      return getLocalAllergies(); // Fallback to localStorage
    }
    
    const options = await response.json();
    console.log('✅ User options fetched:', options);
    
    // Get allergies from root level only (phasing out other_settings)
    const allergies = options.allergies || [];
    
    // Update localStorage to match database
    saveLocalAllergies(allergies);
    
    return allergies;
  } catch (error) {
    console.error('❌ Error fetching user allergies:', error);
    return getLocalAllergies(); // Fallback to localStorage
  }
}

/**
 * Format allergy note for display
 * @param {Array} allergies - Array of allergy strings
 * @returns {string} Formatted allergy note or empty string
 */
export function formatAllergyNote(allergies) {
  if (!allergies || allergies.length === 0) {
    return '';
  }

  const displayAllergies = allergies.map(allergy => 
    ALLERGY_LABELS[allergy] || allergy
  ).join(', ');

  return `${displayAllergies} | allergy-friendly`;
}

/**
 * Get all available allergies with their labels
 * @returns {Array<{value: string, label: string}>} Array of allergy objects
 */
export function getAllAvailableAllergies() {
  return Object.entries(ALLERGY_LABELS).map(([value, label]) => ({
    value,
    label
  }));
}

/**
 * Save all options to the API (called only from the main Save Changes button)
 * @param {Object} options - All options to save
 * @returns {Promise<boolean>} Success status
 */
export async function saveAllOptions(options) {
  try {
    const token = localStorage.getItem('firebaseToken');
    if (!token) {
      console.error('❌ No authentication token found');
      return false;
    }

    // Ensure allergies is an array
    const allergiesArray = Array.isArray(options.allergies) ? options.allergies : [];
    
    // Save only at root level, phasing out other_settings
    const requestBody = {
      portions: options.portions,
      adventurousness: options.adventurousness,
      allergies: allergiesArray
    };

    console.log('🔄 [ALLERGIES] Saving options to database:', requestBody);

    const response = await fetch(`${getApiUrl()}/api/options`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Failed to save options:', errorData);
      return false;
    }

    // Update localStorage to match database
    saveLocalAllergies(allergiesArray);
    localStorage.setItem('portions', options.portions);
    localStorage.setItem('adventurousness', options.adventurousness);
    
    return true;
  } catch (error) {
    console.error('❌ Error saving options:', error);
    return false;
  }
} 