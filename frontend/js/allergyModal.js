// Allergy modal functionality
import { getApiUrl, isNativeApp } from './config.js';

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
            
            <div class="dietary-section">
              <h4>Dietary Restrictions</h4>
              <div class="dietary-checkboxes">
                <label class="lowfodmap-checkbox">
                  <input type="checkbox" id="lowfodmap-checkbox" 
                         ${this.selectedAllergies.has('lowfodmap') ? 'checked' : ''}>
                  <span class="lowfodmap-label">Low FODMAP (IBS)</span>
                </label>
                <label class="vegetarian-checkbox">
                  <input type="checkbox" id="vegetarian-checkbox" 
                         ${this.selectedAllergies.has('vegetarian') ? 'checked' : ''}>
                  <span class="vegetarian-label">Vegetarian</span>
                </label>
              </div>
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
      { value: 'gluten', label: 'Gluten' },
      { value: 'dairy', label: 'All Dairy' },
      { value: 'eggs', label: 'Eggs' },
      { value: 'peanuts', label: 'Peanuts' },
      { value: 'tree_nuts', label: 'Tree Nuts' },
      { value: 'soy', label: 'Soy' },
      { value: 'wheat', label: 'Wheat' },
      { value: 'fish', label: 'Fish' },
      { value: 'shellfish', label: 'Shellfish' },
      { value: 'sesame', label: 'Sesame' },
      { value: 'cowmilk', label: 'Cow Milk' },
      { value: 'mustard', label: 'Mustard' },
      { value: 'celery', label: 'Celery' },
      { value: 'lupin', label: 'Lupin' },
      { value: 'sulfites', label: 'Sulfites' },
      { value: 'nightshades', label: 'Nightshades' },
      { value: 'corn', label: 'Corn' },
      { value: 'lactose', label: 'Lactose' },
      { value: 'vegan', label: 'Vegan' }
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

    // Handle Low FODMAP checkbox separately
    const lowfodmapCheckbox = this.modal.querySelector('#lowfodmap-checkbox');
    if (lowfodmapCheckbox) {
      lowfodmapCheckbox.addEventListener('change', () => {
        if (lowfodmapCheckbox.checked) {
          this.selectedAllergies.add('lowfodmap');
        } else {
          this.selectedAllergies.delete('lowfodmap');
        }
      });
    }

    // Handle Vegetarian checkbox separately
    const vegetarianCheckbox = this.modal.querySelector('#vegetarian-checkbox');
    if (vegetarianCheckbox) {
      vegetarianCheckbox.addEventListener('change', () => {
        if (vegetarianCheckbox.checked) {
          this.selectedAllergies.add('vegetarian');
        } else {
          this.selectedAllergies.delete('vegetarian');
        }
      });
    }
  }

  async save() {
    const selectedAllergies = Array.from(this.selectedAllergies);
    // Commented out for production:
    // console.log('[AllergyModal] Save button pressed', selectedAllergies);
    try {
      // Just call the onSave callback and close the modal
      this.onSave(selectedAllergies);
      this.close();
    } catch (error) {
      // Commented out for production:
      // console.error('Error in AllergyModal save callback:', error);
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