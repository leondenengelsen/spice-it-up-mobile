import { generateRecipes } from './app.js';
import { recipeInputValidator } from './inputValidator.js';

class InterfaceManager {
    constructor() {
        this.talkBtn = document.getElementById('talk-btn');
        this.inputField = document.getElementById('user-input');
        this.pressTimer = null;
        this.SHORT_PRESS_DURATION = 100; // milliseconds
        this.isRecording = false;
        this.isPressed = false;
        this.wasLongPress = false;  // Track if this was a long press
        
        // Bind methods
        this.handlePressStart = this.handlePressStart.bind(this);
        this.handlePressEnd = this.handlePressEnd.bind(this);
        this.handlePressCancel = this.handlePressCancel.bind(this);
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Touch events
        this.talkBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handlePressStart(e);
        });
        this.talkBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePressEnd(e);
        });
        this.talkBtn.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            this.handlePressCancel(e);
        });

        // Mouse events (for testing)
        this.talkBtn.addEventListener('mousedown', this.handlePressStart);
        this.talkBtn.addEventListener('mouseup', this.handlePressEnd);
        this.talkBtn.addEventListener('mouseleave', this.handlePressCancel);
    }

    handlePressStart(e) {
        console.log('Press start - isPressed:', this.isPressed, 'isRecording:', this.isRecording);
        if (this.isPressed) return;
        
        this.isPressed = true;
        this.wasLongPress = false;  // Reset long press state
        this.talkBtn.classList.add('button-pressed');
        
        // Start a timer to detect long press
        this.pressTimer = setTimeout(() => {
            console.log('Long press detected - starting recording');
            this.isRecording = true;
            this.wasLongPress = true;  // Mark this as a long press
            window.dispatchEvent(new CustomEvent('startRecording'));
        }, this.SHORT_PRESS_DURATION);
    }

    handlePressEnd(e) {
        console.log('Press end - isPressed:', this.isPressed, 'isRecording:', this.isRecording, 'wasLongPress:', this.wasLongPress);
        if (!this.isPressed) return;
        
        this.isPressed = false;
        this.talkBtn.classList.remove('button-pressed');
        
        // Clear the press timer
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
            
            // Handle short press - directly call generateRecipes
            const inputField = document.getElementById('user-input');
            if (inputField && inputField.value.trim()) {
                console.log('Handling short press - generating recipes');
                // Check input validation before proceeding
                if (recipeInputValidator && !recipeInputValidator.isValid()) {
                    recipeInputValidator.showToast();
                    return;
                }
                // Call generateRecipes directly
                generateRecipes(true);
            }
        }
        
        // Only stop recording if this was a long press
        if (this.isRecording && this.wasLongPress) {
            console.log('Stopping recording from button release (long press)');
            this.isRecording = false;
            this.wasLongPress = false;
            window.dispatchEvent(new CustomEvent('stopRecording'));
        }
    }

    handlePressCancel(e) {
        console.log('Press cancel - isPressed:', this.isPressed, 'isRecording:', this.isRecording, 'wasLongPress:', this.wasLongPress);
        if (!this.isPressed) return;
        
        this.isPressed = false;
        this.talkBtn.classList.remove('button-pressed');
        
        // Clear timer if it exists
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        }
        
        // Only stop recording if this was a long press
        if (this.isRecording && this.wasLongPress) {
            console.log('Stopping recording from press cancel (long press)');
            this.isRecording = false;
            this.wasLongPress = false;
            window.dispatchEvent(new CustomEvent('stopRecording'));
        }
    }
}

// Initialize the interface manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new InterfaceManager();
}); 