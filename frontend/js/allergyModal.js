// Allergy modal functionality
export class AllergyModal {
  constructor() {
    this.modal = null;
    this.selectedAllergies = new Set();
    this.onSave = null;
  }

  init(currentAllergies = [], onSave = () => {}) {
    this.selectedAllergies = new Set(currentAllergies);
    this.onSave = onSave;
    this.createModal();
  }

  createModal() {
    // Create modal HTML
    const modalHtml = `
      <div class="modal-overlay">
        <div class="allergy-modal">
          <div class="modal-header">
            <h3>Select Allergies & Dietary Restrictions</h3>
            <button class="close-modal" aria-label="Close">×</button>
          </div>
          <div class="modal-content">
            <div class="allergies-grid">
              ${this.getAllergyCheckboxes()}
            </div>
          </div>
          <div class="modal-footer">
            <button class="modal-btn secondary" id="cancel-allergies">Cancel</button>
            <button class="modal-btn primary" id="save-allergies">Save</button>
          </div>
        </div>
      </div>
    `;

    // Create modal element
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    this.modal = modalElement.firstElementChild;
    document.body.appendChild(this.modal);

    // Add event listeners
    this.addEventListeners();
  }

  getAllergyCheckboxes() {
    const allergies = [
      { value: 'milk', label: 'Milk' },
      { value: 'eggs', label: 'Eggs' },
      { value: 'peanuts', label: 'Peanuts' },
      { value: 'tree_nuts', label: 'Tree Nuts' },
      { value: 'soy', label: 'Soy' },
      { value: 'wheat', label: 'Wheat' },
      { value: 'fish', label: 'Fish' },
      { value: 'shellfish', label: 'Shellfish' },
      { value: 'sesame', label: 'Sesame' },
      { value: 'gluten', label: 'Gluten' },
      { value: 'mustard', label: 'Mustard' },
      { value: 'celery', label: 'Celery' },
      { value: 'lupin', label: 'Lupin' },
      { value: 'sulfites', label: 'Sulfites' },
      { value: 'nightshades', label: 'Nightshades' },
      { value: 'corn', label: 'Corn' },
      { value: 'meat', label: 'Meat' },
      { value: 'dairy', label: 'All Dairy' },
      { value: 'vegan', label: 'Vegan' },
      { value: 'vegetarian', label: 'Vegetarian' }
    ];

    return allergies.map(allergy => `
      <label class="allergy-checkbox">
        <input type="checkbox" name="modal-allergies" 
               value="${allergy.value}"
               ${this.selectedAllergies.has(allergy.value) ? 'checked' : ''}>
        <span class="checkbox-label">${allergy.label}</span>
      </label>
    `).join('');
  }

  addEventListeners() {
    // Close button
    this.modal.querySelector('.close-modal').addEventListener('click', () => this.close());
    
    // Cancel button
    this.modal.querySelector('#cancel-allergies').addEventListener('click', () => this.close());
    
    // Save button
    this.modal.querySelector('#save-allergies').addEventListener('click', () => this.save());
    
    // Close on overlay click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // Update selected allergies when checkboxes change
    this.modal.querySelectorAll('input[name="modal-allergies"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.selectedAllergies.add(checkbox.value);
        } else {
          this.selectedAllergies.delete(checkbox.value);
        }
      });
    });
  }

  async save() {
    try {
      const allergies = Array.from(this.selectedAllergies);
      
      // Get current settings from localStorage
      const currentSettings = {
        portions: parseInt(localStorage.getItem('portions') || '4'),
        adventurousness: parseInt(localStorage.getItem('adventurousness') || '1')
      };

      // Get Firebase token
      const token = localStorage.getItem('firebaseToken');
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      // Call the API to save options
      const response = await fetch(`${getApiUrl()}/api/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          portions: currentSettings.portions,
          adventurousness: currentSettings.adventurousness,
          other_settings: {
            allergies: allergies
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save allergies');
      }

      // Call the onSave callback with selected allergies
      this.onSave(allergies);
      
      // Show success notification
      Toastify({
        text: "Allergy preferences saved ✅",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "var(--suggestion-bg)",
          color: "var(--suggestion-text)"
        }
      }).showToast();

      this.close();
    } catch (error) {
      console.error('Error saving allergies:', error);
      Toastify({
        text: error.message === 'Not authenticated' 
          ? "Please log in to save preferences" 
          : "Failed to save allergies. Please try again.",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "#e74c3c",
          color: "white"
        }
      }).showToast();

      // If not authenticated, redirect to login
      if (error.message === 'Not authenticated') {
        setTimeout(() => {
          window.location.href = '/login.html';
        }, 2000);
      }
    }
  }

  close() {
    this.modal.remove();
    this.modal = null;
  }

  show() {
    if (!this.modal) {
      this.createModal();
    }
  }
} 