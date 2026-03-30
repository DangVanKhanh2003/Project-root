/**
 * Main Entry Point - TypeScript
 * YTBDown - Video Downloader
 */

// === CSS Import ===
// Single entry point for all styles (Phase 2: CSS Refactor)
import './styles/index.css';

import { applyInitialVisibility } from './features/widget-level-manager';
import { initLicenseOnPageLoad } from './features/license/license-token';
import { initHeroFeatureLinks } from './features/hero-feature-links';
import { recordPageLoad } from './utils/page-freshness';



if (typeof window !== 'undefined') {
  // Debug: Expose conversion state functions for testing merging UI
  import('./features/downloader/state/conversion-state').then(conversionState => {
    (window as any).__conversionState__ = conversionState;
    console.log('[App] Conversion state exposed to window.__conversionState__ for debugging');
  });
}

/**
 * Initialize downloader UI
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


  // Prevent initial flash before CSS loads.
  mobileDrawer.removeAttribute('hidden');
  const openDrawer = () => {
    mobileDrawer.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  };

  const closeDrawer = () => {
    mobileDrawer.classList.remove('open');
    document.body.style.overflow = ''; // Restore scrolling
  };

  // Open mobile menu when hamburger icon is clicked
  mobileMenuBtn.addEventListener('click', function (e) {
    e.preventDefault();
    openDrawer();
  });

  // Close mobile menu when close button is clicked
  if (closeDrawerBtn) {
    closeDrawerBtn.addEventListener('click', closeDrawer);
  }

  // Close mobile menu when clicking on overlay
  mobileDrawer.addEventListener('click', function (e) {
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
  document.addEventListener('keydown', function (e) {
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
 * Initialize language selector dropdown
 */
function initLangSelector() {
  const langSelector = document.querySelector('.lang-selector');
  const langButton = document.querySelector('.lang-button');

  if (!langSelector || !langButton) return;

  // Toggle dropdown on button click
  langButton.addEventListener('click', (e) => {
    e.stopPropagation();
    langSelector.classList.toggle('active');
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!langSelector.contains(e.target as Node)) {
      langSelector.classList.remove('active');
    }
  });

  // Close dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      langSelector.classList.remove('active');
    }
  });
}

/**
 * Initialize drawer language selector dropdown
 */
function initDrawerLangSelector() {
  const drawerLangSelector = document.querySelector('.drawer-lang-selector');
  const drawerLangButton = document.querySelector('.drawer-lang-button');

  if (!drawerLangSelector || !drawerLangButton) return;

  // Toggle dropdown on button click
  drawerLangButton.addEventListener('click', (e) => {
    e.stopPropagation();
    drawerLangSelector.classList.toggle('active');
  });

  // Close dropdown when clicking outside (within drawer)
  const mobileDrawer = document.getElementById('mobile-drawer');
  if (mobileDrawer) {
    mobileDrawer.addEventListener('click', (e) => {
      if (!drawerLangSelector.contains(e.target as Node)) {
        drawerLangSelector.classList.remove('active');
      }
    });
  }

  // Close dropdown on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      drawerLangSelector.classList.remove('active');
    }
  });
}

/**
 * Initialize Firebase Analytics (lazy loaded)
 *
 * Strategy: Load Firebase after 5s delay to ensure:
 * 1. Critical rendering is complete
 * 2. User interactions are not blocked
 * 3. INP metrics are not affected
 */
function initFirebaseAnalytics(): void {
  // Delay 5s before even starting to load Firebase
  setTimeout(() => {
    import('./libs/firebase/firebase-loader')
      .then(({ loadFirebaseWhenIdle }) => {
        // Load when browser is idle (requestIdleCallback)
        loadFirebaseWhenIdle();
      })
      .catch(() => {
        // Silent fail - app works without analytics
      });
  }, 5000);
}

/**
 * Initialize Feedback Widget (lazy loaded)
 */
function initFeedbackWidget(): void {
  setTimeout(() => {
    import('./features/feedback/feedback-widget')
      .then(({ initFeedbackWidget: init }) => {
        init();
      })
      .catch(() => {
        // Silent fail - app works without feedback widget
      });
  }, 5000);
}

/**
 * Initialize app
 */
async function loadFeatures() {
  recordPageLoad();                  // Record page load timestamp for stale-page detection
  await applyInitialVisibility();   // Initialize license button + supporter badge
  initLicenseOnPageLoad();          // Background revalidation if cache is stale (fire-and-forget)
  initMobileMenu(); // Initialize mobile menu
  initLangSelector(); // Initialize language selector dropdown
  initDrawerLangSelector(); // Initialize drawer language selector dropdown
  initHeroFeatureLinks(); // Initialize hero feature link buttons (mobile)
  initDownloaderUI(); // Initialize downloader (async/lazy loaded)
  initLogoClickHandler(); // Prevent logo reload issue
  initFirebaseAnalytics(); // Initialize Firebase Analytics (lazy loaded after 5s)
  initFeedbackWidget(); // Initialize Feedback Widget (lazy loaded after 5s)

  // Initialize custom audio dropdown
  import('./features/downloader/ui-render/dropdown-logic').then(({ initAudioDropdown }) => {
    initAudioDropdown();
  });
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadFeatures().catch(err => console.error('Failed to load features:', err));
  });
} else {
  // DOM already loaded
  loadFeatures().catch(err => console.error('Failed to load features:', err));
}

