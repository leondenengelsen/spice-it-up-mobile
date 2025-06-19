// Info page functionality

document.addEventListener('DOMContentLoaded', function() {
  console.log('Info page loaded');

  // Terms & Conditions button (placeholder)
  const termsBtn = document.getElementById('terms-btn');
  if (termsBtn) {
    termsBtn.addEventListener('click', function() {
      console.log('Terms & Conditions clicked');
      alert('Terms & Conditions - Coming soon!');
    });
  }

  // Contact Us button (placeholder)
  const contactBtn = document.getElementById('contact-btn');
  if (contactBtn) {
    contactBtn.addEventListener('click', function() {
      console.log('Contact Us clicked');
      alert('Contact Us - Coming soon!');
    });
  }
}); 