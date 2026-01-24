/**
 * Main Entry Point - TypeScript
 * Y2matePro - Rebuilt from webclone.html
 */
import './firebase';

// === I18n Import ===
import { initI18n, loadTranslations, locales, getLanguage, t } from '@downloader/i18n';

// === Utils Import ===
import { initPreferencesSync } from './utils/preferences-sync';
import { initAnalytics } from './utils/analytics-loader';

// Import Core Styles (From @downloader/core)
import '@downloader/core/styles/ripple-effect.css';

// Import UI Components CSS (From @downloader/ui-components)
import '@downloader/ui-components/ExpireModal/expire-modal.css';
import '@downloader/ui-components/SkeletonCard/skeleton.css';
import '@downloader/ui-components/PreviewCardSkeleton/preview-card-skeleton.css';
import '@downloader/ui-components/SearchResultCard/search-result-card.css';
import '@downloader/ui-components/SuggestionDropdown/suggestion-dropdown.css';

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
import './styles/reusable-packages/yt-preview-card/yt-preview-card.css';
import './styles/reusable-packages/captcha-modal/captcha-modal.css';
import './styles/reusable-packages/conversion-status/conversion-status.css';

// Import UI components CSS
import './ui-components/format-selector/format-selector.css';

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

console.log('[App] HTML lang attribute:', document.documentElement.getAttribute('lang'));
console.log('[App] Detected language:', getLanguage());

// Debug: Expose i18n to window for testing
if (typeof window !== 'undefined') {
  (window as any).__i18n__ = {
    getLanguage,
    t
  };
  console.log('[App] i18n exposed to window.__i18n__ for debugging');
}

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
 * Fix scroll restoration on page navigation
 */
function fixScrollRestoration() {
  // Tell the browser to handle scroll restoration manually
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // On every page display (including back/forward navigation), scroll to the top.
  window.addEventListener('pageshow', () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });

  // A fallback for older browsers that might not support 'pageshow' or 'scrollRestoration'
  window.addEventListener('load', () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });

  // A fallback for DOMContentLoaded
  document.addEventListener('DOMContentLoaded', () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  });
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
 * Initialize language dropdown toggle
 */
function initLanguageDropdown(): void {
  const languageItem = document.querySelector('.navbar.language');
  if (!languageItem) {
    return;
  }

  const toggle = languageItem.querySelector('a');
  const menu = languageItem.querySelector('.dropdown-menu');
  const mobileToggle = document.querySelector('.mobile-language-toggle');
  const mobileMenu = document.querySelector('.mobile-lang-menu');

  if (!toggle || !menu) {
    return;
  }

  const currentLangRaw = (document.documentElement.getAttribute('lang') || 'en').toLowerCase();
  const currentLang = currentLangRaw.split('-')[0];
  const currentLink = menu.querySelector(`a[data-lang="${currentLang}"]`);
  const currentMobileLink = mobileMenu?.querySelector(`a[data-lang="${currentLang}"]`);

  if (currentLink) {
    currentLink.classList.add('active');
    currentLink.setAttribute('aria-current', 'true');

    const shape = toggle.querySelector('.shape') || document.createElement('span');
    shape.className = 'shape';
    const label = (currentLink.textContent || 'English').trim();
    toggle.textContent = label;
    toggle.appendChild(shape);
  }
  if (currentMobileLink) {
    currentMobileLink.classList.add('active');
    currentMobileLink.setAttribute('aria-current', 'true');
  }

  toggle.setAttribute('aria-haspopup', 'true');
  toggle.setAttribute('aria-expanded', 'false');

  const closeMenu = () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    menu.classList.add('open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  toggle.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();

    if (menu.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  const menuLinks = menu.querySelectorAll('a');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  document.addEventListener('click', event => {
    if (!languageItem.contains(event.target as Node)) {
      closeMenu();
    }
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  });

  if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', event => {
      event.preventDefault();
      const isOpen = mobileMenu.classList.toggle('open');
      mobileToggle.setAttribute('aria-expanded', String(isOpen));
    });

    const mobileLinks = mobileMenu.querySelectorAll('a');
    mobileLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }
}

/**
 * Initialize app
 */
function loadFeatures() {
  fixScrollRestoration(); // Fix scroll restoration issue
  initPreferencesSync(); // Sync user preferences from localStorage
  initAnalytics(); // Lazy load Google Analytics
  initMobileMenu(); // Initialize mobile menu first
  initLanguageDropdown();
  initDownloaderUI();
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  // DOM already loaded
  loadFeatures();
}
