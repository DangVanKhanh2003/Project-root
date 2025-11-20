// Entry point for legal pages (404, privacy, terms)
// Minimal functionality for static/legal pages

// Initialize navbar toggler if present
document.addEventListener('DOMContentLoaded', () => {
  const toggler = document.querySelector('.navbar-toggler');
  const modal = document.querySelector('.navbar-modal');
  const closeBtn = document.querySelector('.navbar-close');

  if (toggler && modal) {
    toggler.addEventListener('click', () => {
      modal.classList.add('show');
      document.body.style.overflow = 'hidden';
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.classList.remove('show');
      document.body.style.overflow = '';
    });
  }

  // Close on backdrop click
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
      }
    });
  }
});
