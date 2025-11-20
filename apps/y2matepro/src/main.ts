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
 * Initialize app
 */
function loadFeatures() {
  initDownloaderUI();
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  // DOM already loaded
  loadFeatures();
}
