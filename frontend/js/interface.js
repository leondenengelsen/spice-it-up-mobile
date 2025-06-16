class InterfaceManager {
    constructor() {
        this.talkBtn = document.getElementById('talk-btn');
        this.inputField = document.getElementById('user-input');
        this.pressTimer = null;
        this.SHORT_PRESS_DURATION = 200; // milliseconds
        
        // Bind methods
        this.handlePressStart = this.handlePressStart.bind(this);
        this.handlePressEnd = this.handlePressEnd.bind(this);
        this.handlePressCancel = this.handlePressCancel.bind(this);
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Touch events
        this.talkBtn.addEventListener('touchstart', this.handlePressStart);
        this.talkBtn.addEventListener('touchend', this.handlePressEnd);
        this.talkBtn.addEventListener('touchcancel', this.handlePressCancel);

        // Mouse events (for testing)
        this.talkBtn.addEventListener('mousedown', this.handlePressStart);
        this.talkBtn.addEventListener('mouseup', this.handlePressEnd);
        this.talkBtn.addEventListener('mouseleave', this.handlePressCancel);
    }

    handlePressStart(e) {
        console.log('Press start');
        
        // Add pressed class for visual feedback
        this.talkBtn.classList.add('button-pressed');
        
        // Start a timer to detect long press
        this.pressTimer = setTimeout(() => {
            console.log('Long press detected');
            // Start recording
            window.dispatchEvent(new CustomEvent('startRecording'));
        }, this.SHORT_PRESS_DURATION);
    }

    handlePressEnd(e) {
        console.log('Press end');
        
        // Remove pressed class
        this.talkBtn.classList.remove('button-pressed');
        
        if (this.pressTimer) {
            // If timer exists, it was a short press
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
            
            // Handle short press (send text if there's text)
            if (this.inputField.value.trim()) {
                console.log('Handling short press');
                this.inputField.dispatchEvent(new Event('input'));
            }
        } else {
            // If no timer, it was a long press that was held
            console.log('Ending long press');
            window.dispatchEvent(new CustomEvent('stopRecording'));
        }
    }

    handlePressCancel() {
        console.log('Press canceled');
        
        // Remove pressed class
        this.talkBtn.classList.remove('button-pressed');
        
        // Clear timer if it exists
        if (this.pressTimer) {
            clearTimeout(this.pressTimer);
            this.pressTimer = null;
        } else {
            // If no timer, recording was in progress
            window.dispatchEvent(new CustomEvent('stopRecording'));
        }
    }
}

// Initialize the interface manager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.interfaceManager = new InterfaceManager();
}); 