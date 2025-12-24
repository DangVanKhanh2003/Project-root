/**
 * Main Entry Point - TypeScript
 * Y2matePro - Rebuilt from webclone.html
 */

// === I18n Import (Phase 2) ===
import { initI18n, loadTranslations, locales } from '@downloader/i18n';

// === CSS Import ===
// Single entry point for all styles (Phase 2: CSS Refactor)
import './styles/index.css';

// Import UI components CSS
import './ui-components/format-selector/format-selector.css';
import './ui-components/language-switcher/language-switcher.css';

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
  // Get mobile menu elements from demo HTML structure
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');

  // Check if required elements exist
  if (!mobileMenuBtn || !mobileDrawer) {
    return;
  }

  const openDrawer = () => {
    mobileDrawer.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeDrawer = () => {
    mobileDrawer.classList.remove('open');
    document.body.style.overflow = ''; // Restore scrolling
  };

  // Open mobile menu when hamburger icon is clicked
  mobileMenuBtn.addEventListener('click', function(e) {
    e.preventDefault();
    openDrawer();
  });

  // Close mobile menu when close button is clicked
  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeDrawer);
  }

  // Close mobile menu when clicking on overlay
  mobileDrawer.addEventListener('click', function(e) {
    if (e.target === mobileDrawer) {
      closeDrawer();
    }
  });

  // Close mobile menu when clicking on menu links
  const drawerLinks = document.querySelectorAll('.drawer-link, .drawer-sublink');
  drawerLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });

  // Add keyboard support - close menu with Escape key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
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
 * Initialize header scroll effect
 */
function initHeaderScroll() {
  const header = document.getElementById('main-header');
  if (!header) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

/**
 * Initialize language switcher
 */
async function initLanguageSwitcher() {
  try {
    const { renderLanguageSwitcher } = await import('./ui-components/language-switcher/language-switcher');
    renderLanguageSwitcher('language-switcher-container');
  } catch (err) {
    console.error('[App] Failed to initialize language switcher:', err);
  }
}

/**
 * Initialize app
 */
function loadFeatures() {
  initHeaderScroll(); // Initialize header scroll effect
  initMobileMenu(); // Initialize mobile menu
  initLanguageSwitcher(); // Initialize language switcher
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
