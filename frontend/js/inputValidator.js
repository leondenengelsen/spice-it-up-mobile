/**
 * Input Length Validator Module
 * Validates input length and shows toast notifications for validation errors
 */

class InputValidator {
  constructor(options = {}) {
    this.maxLength = options.maxLength || 1000;
    this.inputSelector = options.inputSelector || '#user-input';
    this.toastDuration = options.toastDuration || 4000;
    this.toastClass = options.toastClass || 'input-validator-toast';
    
    this.init();
  }

  init() {
    // Initialize validation on DOM load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupValidation());
    } else {
      this.setupValidation();
    }
  }

  setupValidation() {
    const inputField = document.querySelector(this.inputSelector);
    if (!inputField) {
      // Commented out for production:
      // console.warn(`InputValidator: Input field with selector "${this.inputSelector}" not found`);
      return;
    }

    // Add real-time character count feedback
    this.addCharacterCounter(inputField);
    
    // Add input event listener for real-time validation
    inputField.addEventListener('input', (e) => this.validateInput(e.target));
    
    // Add paste event listener to handle pasted content
    inputField.addEventListener('paste', (e) => {
      setTimeout(() => this.validateInput(e.target), 10);
    });
  }

  addCharacterCounter(inputField) {
    // Create character counter element
    const counter = document.createElement('div');
    counter.className = 'input-character-counter';
    counter.textContent = `0 / ${this.maxLength}`;
    
    // Insert counter after the input field
    const inputContainer = inputField.closest('.input-container') || inputField.parentNode;
    inputContainer.appendChild(counter);
    
    // Update counter on input
    const updateCounter = () => {
      const currentLength = inputField.value.length;
      counter.textContent = `${currentLength} / ${this.maxLength}`;
      
      // Add warning styling when approaching limit
      if (currentLength > this.maxLength * 0.9) {
        counter.classList.add('warning');
      } else {
        counter.classList.remove('warning');
      }
      
      // Add error styling when over limit
      if (currentLength > this.maxLength) {
        counter.classList.add('error');
      } else {
        counter.classList.remove('error');
      }
    };
    
    inputField.addEventListener('input', updateCounter);
    inputField.addEventListener('paste', () => setTimeout(updateCounter, 10));
  }

  preventLongInputSubmission(inputField) {
    // Find all submit buttons and forms that could trigger submission
    const forms = document.querySelectorAll('form');
    const submitButtons = document.querySelectorAll('button[type="submit"], .chili-btn, #talk-btn, #send-btn');
    
    // Prevent form submission
    forms.forEach(form => {
      form.addEventListener('submit', (e) => {
        if (this.isInputTooLong(inputField)) {
          e.preventDefault();
          this.showToast();
          return false;
        }
      });
    });
    
    // Prevent button clicks that would submit
    submitButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        if (this.isInputTooLong(inputField)) {
          e.preventDefault();
          e.stopPropagation();
          this.showToast();
          return false;
        }
      });
    });
  }

  validateInput(inputElement) {
    if (this.isInputTooLong(inputElement)) {
      inputElement.classList.add('input-error');
      return false;
    } else {
      inputElement.classList.remove('input-error');
      return true;
    }
  }

  isInputTooLong(inputElement) {
    return inputElement.value.length > this.maxLength;
  }

  showToast(message = null) {
    const toastMessage = message || `Your input is too long. Please shorten it to under ${this.maxLength} characters.`;
    
    // Remove any existing toasts
    this.removeExistingToasts();
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = this.toastClass;
    toast.textContent = toastMessage;
    
    // Add toast to body
    document.body.appendChild(toast);
    
    // Trigger show animation
    setTimeout(() => toast.classList.add('show'), 10);
    
    // Auto-remove toast after duration
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, this.toastDuration);
    
    return toast;
  }

  removeExistingToasts() {
    const existingToasts = document.querySelectorAll(`.${this.toastClass}`);
    existingToasts.forEach(toast => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    });
  }

  // Public method to manually validate
  validate() {
    const inputField = document.querySelector(this.inputSelector);
    if (inputField) {
      return this.validateInput(inputField);
    }
    return true;
  }

  // Public method to get current character count
  getCharacterCount() {
    const inputField = document.querySelector(this.inputSelector);
    return inputField ? inputField.value.length : 0;
  }

  // Public method to check if input is valid
  isValid() {
    const inputField = document.querySelector(this.inputSelector);
    return inputField ? !this.isInputTooLong(inputField) : true;
  }
}

// Auto-initialize with default settings
const recipeInputValidator = new InputValidator({
  maxLength: 1000,
  inputSelector: '#user-input'
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InputValidator;
}

export { InputValidator, recipeInputValidator };
