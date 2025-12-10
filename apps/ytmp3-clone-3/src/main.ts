/**
 * Main Entry Point - TypeScript
 * Y2matePro - Rebuilt from webclone.html
 */

// === CSS Import ===
// Single entry point for all styles (Phase 2: CSS Refactor)
import './styles/index.css';

// Import UI components CSS
import './ui-components/format-selector/format-selector.css';

// Import theme toggle
import { initThemeToggle } from './features/theme-toggle/theme-toggle';

/**
 * Initialize downloader UI (lazy loaded)
 */
async function initDownloaderUI() {
  try {
    const { init } = await import('./features/downloader/downloader-ui');
    await init();
  } catch (err) {
    console.error('Failed to initialize downloader UI:', err);
  }
}

/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
  // Mobile Menu Functionality
  document.addEventListener('DOMContentLoaded', function() {
    // Get mobile menu elements
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
    const mobileCloseBtn = document.getElementById('mobileCloseBtn');

    // Check if all required elements exist before adding event listeners
    if (!mobileMenuToggle || !mobileMenuOverlay) {
      // Only warn if we're on a page that should have mobile menu
      if (document.querySelector('.navbar-toggler')) {
        console.warn('Mobile menu elements not found on this page');
      }
      return;
    }

    // Toggle mobile menu when hamburger icon is clicked
    mobileMenuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      mobileMenuOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    });

    // Close mobile menu when close button is clicked (if element exists)
    if (mobileCloseBtn) {
      mobileCloseBtn.addEventListener('click', function() {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
      });
    }

    // Close mobile menu when clicking outside the menu content
    mobileMenuOverlay.addEventListener('click', function(e) {
      if (e.target === mobileMenuOverlay) {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
      }
    });

    // Close mobile menu when clicking on menu links (for better UX)
    const mobileMenuLinks = document.querySelectorAll('.mobile-menu a');
    mobileMenuLinks.forEach(link => {
      link.addEventListener('click', function() {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
      });
    });

    // Add keyboard support - close menu with Escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && mobileMenuOverlay.classList.contains('active')) {
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = '';
      }
    });
  });
}

/**
 * Initialize app
 */
function loadFeatures() {
  initThemeToggle(); // Initialize theme toggle first (before any rendering)
  initMobileMenu(); // Initialize mobile menu
  initDownloaderUI();
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  // DOM already loaded
  loadFeatures();
}
