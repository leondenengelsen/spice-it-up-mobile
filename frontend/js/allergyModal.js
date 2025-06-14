// Allergy modal functionality
import { getApiUrl, isNativeApp } from './config.js';
import { getAllAvailableAllergies } from './allergies.js';

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
    const allergies = getAllAvailableAllergies();
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

  save() {
    try {
      console.log('🔄 [ALLERGY MODAL] Starting save process');
      const allergies = Array.from(this.selectedAllergies);
      console.log('🔄 [ALLERGY MODAL] Selected allergies:', allergies);
      
      // ONLY update localStorage
      localStorage.setItem('allergies', JSON.stringify(allergies));
      console.log('✅ [ALLERGY MODAL] Updated localStorage with allergies');
      
      // Call the onSave callback to update UI
      this.onSave(allergies);
      console.log('✅ [ALLERGY MODAL] Called onSave callback');
      
      // Show success notification
      Toastify({
        text: "Allergy preferences updated (click Save Changes to save to account)",
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
      console.error('Error updating allergies:', error);
      Toastify({
        text: "Failed to update allergies. Please try again.",
        duration: 3000,
        gravity: "bottom",
        position: "center",
        style: {
          background: "#e74c3c",
          color: "white"
        }
      }).showToast();
    }
  }

  close() {
    if (this.modal && this.modal.parentNode) {
      this.modal.parentNode.removeChild(this.modal);
    }
    this.modal = null;
  }

  show() {
    if (this.modal) {
      this.modal.style.display = 'block';
    }
  }
} 