/**
 * Main Entry Point - TypeScript
 * Phase 4B: Full downloader feature integration
 */

// Import critical CSS
import './styles/reset.css';
import './styles/base.css';
import './styles/reusable-packages/package-root.css';
import './styles/reusable-packages/skeleton/skeleton.css';
import './styles/common.css';
import './styles/critical/hero.css';
import './styles/critical/download-layout.css';

// Import feature CSS
import './styles/features/content-messages.css';

// Import reusable packages CSS
import './styles/reusable-packages/search-results/search-results.css';
import './styles/reusable-packages/suggestions/suggestions.css';
import './styles/reusable-packages/conversion-modal/conversion-modal.css';

console.log('🚀 Yt1s Test App loaded (TypeScript)');

/**
 * Initialize downloader UI (lazy loaded)
 */
async function initDownloaderUI() {
  try {
    const { init } = await import('./features/downloader/downloader-ui');
    await init();
    console.log('✅ Downloader UI ready');
  } catch (err) {
    console.error('❌ Failed to initialize downloader UI:', err);
  }
}

/**
 * Initialize app
 */
function loadFeatures() {
  console.log('✅ DOM ready - initializing features');
  initDownloaderUI();
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  // DOM already loaded
  loadFeatures();
}
