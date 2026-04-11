/**
 * Main Entry Point - TypeScript
 * Y2matePro - Rebuilt from webclone.html
 */


// === CSS Import ===
// Single entry point for all styles (Phase 2: CSS Refactor)
import './styles/index.css';
import { recordPageLoad } from './utils/page-freshness';
import { initAllowedFeatures } from './features/allowed-features';

// Import UI components CSS
import './ui-components/format-selector/format-selector.css';
import './ui-components/language-switcher/language-switcher.css';

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
 * Preload EzConv intro images and popup module
 */
function preloadEzConvIntro() {
  type EzConvIntroWindow = Window & {
    EzConvIntro?: {
      preloadPopup?: () => void;
    };
  };

  const images = [
    'https://mp3fast.net/desktop_ezconv_intro_goggle.png',
    'https://mp3fast.net/mobile_ezconv_intro_goggle.png',
    'https://mp3fast.net/ezconv_exp.png',
  ];
  images.forEach(src => {
    const img = new Image();
    img.src = src;
  });

  // Preload popup so it's ready on first download click
  const ezConvIntro = (window as EzConvIntroWindow).EzConvIntro;
  ezConvIntro?.preloadPopup?.();
}

function initFeedbackWidget(): void {
  setTimeout(() => {
    import('./features/feedback/feedback-widget')
      .then(({ initFeedbackWidget: init }) => init())
      .catch(() => { });
  }, 5000);
}

/**
 * Initialize app
 */
function loadFeatures() {
  recordPageLoad();
  initAllowedFeatures(); // Pre-warm country cache for priority extract routing
  initMobileMenu(); // Initialize mobile menu
  initLanguageSwitcher(); // Initialize language switcher
  initDownloaderUI();
  initLogoClickHandler(); // Prevent logo reload issue
  preloadEzConvIntro(); // Preload EzConv intro images & popup
  initFeedbackWidget(); // Initialize Feedback Widget (lazy loaded after 5s)
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  // DOM already loaded
  loadFeatures();
}

