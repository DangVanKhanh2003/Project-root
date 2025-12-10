/**
 * Main Entry Point - TypeScript
 * Y2matePro - Rebuilt from webclone.html
 */

// Import CSS - Proper order: reset -> base -> common -> sections -> packages
import './styles/reset.css';
import './styles/base.css';
import './styles/common.css';

// Import section CSS files
import './styles/sections/header.css';
import './styles/sections/hero.css';
import './styles/sections/content.css';
import './styles/sections/instructions.css';
import './styles/sections/features.css';
import './styles/sections/faq.css';
import './styles/sections/tips.css';
import './styles/sections/footer.css';

// Import reusable packages CSS (for downloader functionality)
import './styles/reusable-packages/package-root.css';
import './styles/reusable-packages/skeleton/skeleton.css';
import './styles/reusable-packages/search-results/search-results.css';
import './styles/reusable-packages/yt-preview-card/yt-preview-card.css';
import './styles/reusable-packages/suggestions/suggestions.css';
import './styles/reusable-packages/captcha-modal/captcha-modal.css';
import './styles/reusable-packages/expire-modal/expire-modal.css';
import './styles/reusable-packages/conversion-status/conversion-status.css';

// Import UI components CSS
import './ui-components/format-selector/format-selector.css';


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
  initMobileMenu(); // Initialize mobile menu first
  initDownloaderUI();
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  // DOM already loaded
  loadFeatures();
}
