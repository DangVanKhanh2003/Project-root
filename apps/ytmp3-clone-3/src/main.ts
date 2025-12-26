/**
 * Main Entry Point - TypeScript
 * Y2matePro - Rebuilt from webclone.html
 */

// === I18n Import ===
import { initI18n, loadTranslations, locales } from '@downloader/i18n';

// === CSS Import ===
// Single entry point for all styles (Phase 2: CSS Refactor)
import './styles/index.css';

// Import UI components CSS
import './ui-components/format-selector/format-selector.css';

// Import theme toggle
import { initThemeToggle } from './features/theme-toggle/theme-toggle';

// ==========================================
// Initialize I18n System
// ==========================================

// Initialize i18n with default language
initI18n({
  defaultLanguage: 'en',
  fallbackLanguage: 'en',
  debug: true // Enable debug mode for development
});

// Load all locale data
Object.entries(locales).forEach(([lang, data]) => {
  loadTranslations(lang as any, data as any);
});

console.log('[App] I18n initialized with 19 languages');

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

  const openDrawer = () => {
    document.body.classList.add('drawer-open');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeDrawer = () => {
    document.body.classList.remove('drawer-open');
    document.body.style.overflow = ''; // Restore scrolling
  };

  // Toggle mobile menu when hamburger icon is clicked
  mobileMenuToggle.addEventListener('click', function(e) {
    e.preventDefault();
    openDrawer();
  });

  // Close mobile menu when close button is clicked (if element exists)
  if (mobileCloseBtn) {
    mobileCloseBtn.addEventListener('click', closeDrawer);
  }

  // Close mobile menu when clicking outside the menu content
  mobileMenuOverlay.addEventListener('click', function(e) {
    if (e.target === mobileMenuOverlay) {
      closeDrawer();
    }
  });

  // Close mobile menu when clicking on menu links (for better UX)
  const mobileMenuLinks = document.querySelectorAll('.drawer-link');
  mobileMenuLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Add keyboard support - close menu with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.body.classList.contains('drawer-open')) {
      closeDrawer();
    }
  });
}

/**
 * Prevents full page reload when clicking the logo on the homepage.
 */
function initLogoClickHandler() {
  const logoLinks = document.querySelectorAll('a.logo[href="/"]');
  logoLinks.forEach(logo => {
    logo.addEventListener('click', (event) => {
      // If we are on the homepage
      if (window.location.pathname === '/') {
        event.preventDefault(); // Prevent page reload

        // If the drawer is open, close it
        if (document.body.classList.contains('drawer-open')) {
          document.body.classList.remove('drawer-open');
          document.body.style.overflow = '';
        }
        
        // Optional: Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      // If not on the homepage, the link will work as normal
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
  initLogoClickHandler(); // Prevent logo reload issue
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  // DOM already loaded
  loadFeatures();
}
