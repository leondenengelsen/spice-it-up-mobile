// Swipe Navigation System for Separate Pages
class SwipeNavigation {
  constructor() {
    this.startX = 0;
    this.startY = 0;
    this.currentX = 0;
    this.isDragging = false;
    this.threshold = 50; // Minimum swipe distance
    this.pages = ['index.html', 'veganize.html', 'healthify.html'];
    this.currentPageIndex = this.getCurrentPageIndex();
    
    console.log('SwipeNavigation initialized:', {
      currentPageIndex: this.currentPageIndex,
      pages: this.pages,
      currentPath: window.location.pathname
    });
    
    this.init();
  }

  getCurrentPageIndex() {
    const currentPath = window.location.pathname;
    const currentUrl = window.location.href;
    
    // More robust page detection
    if (currentPath.includes('veganize.html') || currentUrl.includes('veganize.html')) {
      return 1;
    }
    if (currentPath.includes('healthify.html') || currentUrl.includes('healthify.html')) {
      return 2;
    }
    // Default to index (0) for any other case
    return 0;
  }

  init() {
    // Add touch listeners to the body
    this.addTouchListeners();
  }

  addTouchListeners() {
    // Touch events
    document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
    
    // Mouse events for desktop testing
    document.addEventListener('mousedown', (e) => this.handleMouseStart(e), { passive: false });
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e), { passive: false });
    document.addEventListener('mouseup', (e) => this.handleMouseEnd(e), { passive: false });
  }

  handleTouchStart(e) {
    // Don't interfere with input fields or buttons
    if (this.shouldIgnoreEvent(e.target)) return;
    
    this.startX = e.touches[0].clientX;
    this.startY = e.touches[0].clientY;
    this.currentX = this.startX; // Ensure currentX is initialized
    this.isDragging = true;
  }

  handleTouchMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    
    this.currentX = e.touches[0].clientX;
    const deltaX = this.currentX - this.startX;
    const deltaY = Math.abs(e.touches[0].clientY - this.startY);
    
    // Only allow horizontal swipes
    if (deltaY > Math.abs(deltaX)) {
      this.isDragging = false;
      return;
    }
    
    // Add visual feedback
    this.updateSwipeFeedback(deltaX);
  }

  handleTouchEnd(e) {
    if (!this.isDragging) return;
    
    const deltaX = this.currentX - this.startX;
    this.isDragging = false;
    
    // Reset visual feedback
    this.resetSwipeFeedback();
    
    // Determine swipe direction
    if (Math.abs(deltaX) > this.threshold) {
      console.log('Swipe detected:', {
        deltaX: deltaX,
        currentPageIndex: this.currentPageIndex,
        canGoLeft: this.currentPageIndex < this.pages.length - 1,
        canGoRight: this.currentPageIndex > 0
      });
      
      if (deltaX > 0) {
        // Swipe right - go to previous page (with circular navigation)
        let targetIndex = this.currentPageIndex - 1;
        if (targetIndex < 0) {
          targetIndex = this.pages.length - 1; // Loop to last page
        }
        console.log('Navigating right to page:', targetIndex);
        this.navigateToPage(targetIndex);
      } else if (deltaX < 0) {
        // Swipe left - go to next page (with circular navigation)
        let targetIndex = this.currentPageIndex + 1;
        if (targetIndex >= this.pages.length) {
          targetIndex = 0; // Loop to first page
        }
        console.log('Navigating left to page:', targetIndex);
        this.navigateToPage(targetIndex);
      }
    }
  }

  handleMouseStart(e) {
    // Don't interfere with input fields or buttons
    if (this.shouldIgnoreEvent(e.target)) return;
    
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.currentX = this.startX; // Ensure currentX is initialized
    this.isDragging = true;
  }

  handleMouseMove(e) {
    if (!this.isDragging) return;
    e.preventDefault();
    
    this.currentX = e.clientX;
    const deltaX = this.currentX - this.startX;
    const deltaY = Math.abs(e.clientY - this.startY);
    
    // Only allow horizontal swipes
    if (deltaY > Math.abs(deltaX)) {
      this.isDragging = false;
      return;
    }
    
    // Add visual feedback
    this.updateSwipeFeedback(deltaX);
  }

  handleMouseEnd(e) {
    if (!this.isDragging) return;
    
    const deltaX = this.currentX - this.startX;
    this.isDragging = false;
    
    // Reset visual feedback
    this.resetSwipeFeedback();
    
    // Determine swipe direction
    if (Math.abs(deltaX) > this.threshold) {
      console.log('Mouse swipe detected:', {
        deltaX: deltaX,
        currentPageIndex: this.currentPageIndex,
        canGoLeft: this.currentPageIndex < this.pages.length - 1,
        canGoRight: this.currentPageIndex > 0
      });
      
      if (deltaX > 0) {
        // Swipe right - go to previous page (with circular navigation)
        let targetIndex = this.currentPageIndex - 1;
        if (targetIndex < 0) {
          targetIndex = this.pages.length - 1; // Loop to last page
        }
        console.log('Navigating right to page:', targetIndex);
        this.navigateToPage(targetIndex);
      } else if (deltaX < 0) {
        // Swipe left - go to next page (with circular navigation)
        let targetIndex = this.currentPageIndex + 1;
        if (targetIndex >= this.pages.length) {
          targetIndex = 0; // Loop to first page
        }
        console.log('Navigating left to page:', targetIndex);
        this.navigateToPage(targetIndex);
      }
    }
  }

  shouldIgnoreEvent(target) {
    // Don't trigger swipes on interactive elements
    const interactiveSelectors = [
      'input', 'textarea', 'button', 'a', 
      '.chili-btn', '.restart-btn', '.header-btn',
      '.menu-icon', '.ingredient-input'
    ];
    
    return interactiveSelectors.some(selector => 
      target.matches(selector) || target.closest(selector)
    );
  }

  updateSwipeFeedback(deltaX) {
    const body = document.body;
    const opacity = Math.min(Math.abs(deltaX) / 100, 0.3);
    const direction = deltaX > 0 ? 1 : -1;
    
    body.style.transform = `translateX(${deltaX * 0.1}px)`;
    body.style.opacity = 1 - opacity;
  }

  resetSwipeFeedback() {
    const body = document.body;
    body.style.transform = '';
    body.style.opacity = '';
  }

  navigateToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= this.pages.length) {
      console.log('Invalid page index:', pageIndex);
      return;
    }
    
    const targetPage = this.pages[pageIndex];
    console.log('Navigating to:', targetPage);
    
    // Add transition effect
    document.body.style.transition = 'opacity 0.2s ease';
    document.body.style.opacity = '0';
    
    // Navigate after fade out
    setTimeout(() => {
      window.location.href = targetPage;
    }, 200);
  }
}

// Initialize swipe navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SwipeNavigation();
});

export default SwipeNavigation; 