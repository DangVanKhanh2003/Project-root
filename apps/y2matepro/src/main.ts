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
import './styles/reusable-packages/video-info-card/video-info-card.css';
import './styles/reusable-packages/suggestions/suggestions.css';
import './styles/reusable-packages/conversion-modal/conversion-modal.css';
import './styles/reusable-packages/captcha-modal/captcha-modal.css';
import './styles/reusable-packages/expire-modal/expire-modal.css';


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
 * Get current language from <html lang> or URL path
 */
function getCurrentLanguage(): string {
  // Try from <html lang> attribute
  const htmlLang = document.documentElement.getAttribute('lang');
  if (htmlLang) return htmlLang.toLowerCase();

  // Fallback: detect from URL path (e.g., /vi/youtube-to-mp4)
  const pathMatch = window.location.pathname.match(/^\/([a-z]{2})\//);
  if (pathMatch) return pathMatch[1];

  // Default to English
  return 'en';
}

/**
 * Initialize language dropdown toggle
 */
function initLanguageDropdown() {
  document.addEventListener('DOMContentLoaded', function() {
    const currentLang = getCurrentLanguage();

    // Desktop language dropdown
    const languageNav = document.querySelector('.navbar.language > a');
    const dropdownMenu = document.querySelector('.navbar.language .dropdown-menu');
    const desktopLangOptions = document.querySelectorAll('.lang-menu .lang-option, .lang-menu a');

    if (languageNav && dropdownMenu) {
      // Update active language for desktop
      desktopLangOptions.forEach(option => {
        const optionLang = option.getAttribute('data-lang');
        if (optionLang === currentLang) {
          option.classList.add('active');
        } else {
          option.classList.remove('active');
        }
      });

      // Toggle dropdown on click
      languageNav.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        dropdownMenu.classList.toggle('open');
      });

      // Close dropdown when clicking outside
      document.addEventListener('click', function(e) {
        const target = e.target as HTMLElement;
        if (!target.closest('.navbar.language')) {
          dropdownMenu.classList.remove('open');
        }
      });

      // Close dropdown on ESC key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          dropdownMenu.classList.remove('open');
        }
      });
    }

    // Mobile language dropdown
    const mobileLangButton = document.querySelector('.mobile-lang-button');
    const mobileLangDropdown = document.querySelector('.mobile-lang-dropdown');
    const mobileLangCurrent = document.querySelector('.mobile-lang-current');
    const mobileLangOptions = document.querySelectorAll('.mobile-lang-option');

    if (mobileLangButton && mobileLangDropdown) {
      // Update active language display for mobile
      function updateMobileActiveLanguage() {

        mobileLangOptions.forEach(option => {
          const optionLang = option.getAttribute('data-lang');
          if (optionLang === currentLang) {
            option.classList.add('active');
            // Update button text
            if (mobileLangCurrent) {
              mobileLangCurrent.textContent = option.textContent;
            }
          } else {
            option.classList.remove('active');
          }
        });
      }

      // Initialize active language for mobile
      updateMobileActiveLanguage();

      // Toggle dropdown
      mobileLangButton.addEventListener('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const isOpen = mobileLangButton.getAttribute('aria-expanded') === 'true';

        if (isOpen) {
          mobileLangButton.setAttribute('aria-expanded', 'false');
          mobileLangDropdown.classList.remove('open');
        } else {
          mobileLangButton.setAttribute('aria-expanded', 'true');
          mobileLangDropdown.classList.add('open');
        }
      });

      // Close mobile dropdown when clicking outside
      document.addEventListener('click', function(e) {
        const target = e.target as HTMLElement;
        if (!target.closest('.mobile-language-selector')) {
          mobileLangButton.setAttribute('aria-expanded', 'false');
          mobileLangDropdown.classList.remove('open');
        }
      });
    }
  });
}

/**
 * Initialize app
 */
function loadFeatures() {
  initMobileMenu(); // Initialize mobile menu first
  initLanguageDropdown(); // Initialize language dropdown
  initDownloaderUI();
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  // DOM already loaded
  loadFeatures();
}
