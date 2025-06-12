/**
 * Healthify Page Specific Functionality
 * Handles health-focused AI behavior and page-specific enhancements
 */

document.addEventListener('DOMContentLoaded', function() {
  console.log('🥗 Healthify page loaded');
  
  // Ensure page mode is properly detected
  if (window.PageContext) {
    const mode = window.PageContext.getCurrentPageMode();
    console.log('🎯 Page mode detected:', mode);
  }
  
  // Page-specific enhancements can be added here
  // The core functionality is handled by app.js
});
