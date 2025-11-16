history.scrollRestoration = 'manual';

// ========================================
// TIER 1: CRITICAL CSS - Static imports (Above-the-fold)
// Bundled together, loaded immediately, render-blocking
// Target: ~10KB for fast initial render
// ========================================
import '../styles/reset.css';
import '../styles/base.css';
import '../styles/reusable-packages/package-root.css';
import '../styles/reusable-packages/skeleton/skeleton.css';
import '../styles/common.css';
import '../styles/critical/hero.css';
import '../styles/critical/download-layout.css';
import '../styles/features/section-shared.css';
import '../styles/features/download-options.css';

// ========================================
// TIER 2: FEATURE CSS - Dynamic imports (Below-the-fold sections)
// Loaded via prefetchFeatureCSS() after critical render
// Aggressive prefetch, ready before user scrolls
// ========================================

// ========================================
// TIER 2.5: INTERACTION CSS - Prefetch (User interactions)
// Prefetched into cache via preloadInteractionCSS()
// Applied on-demand when user clicks/interacts
// Files: conversion-modal.css, mobile-download.css, gallery.css
// ========================================

// Force Vite to build all assets (images, icons) regardless of current usage
import './utils/asset-loader.js';

// Removed: old infinite scroller cloning mechanism for platforms list

/**
 * WHY: Lazy load downloader UI to reduce initial bundle size
 * CONTRACT: Load downloader-ui module only when needed (immediate but async)
 * PRE: DOM ready, critical CSS loaded
 * POST: Downloader UI initialized and functional
 * EDGE: Runs in parallel with CSS prefetching for fastest interactivity
 * USAGE: Called in loadFeatures() after DOMContentLoaded
 */
async function initDownloaderUI() {
    try {
        const { init } = await import('./features/downloader/downloader-ui.js');
        await init(); // Await init to ensure critical UI is ready before prefetch

        // Load feature CSS after downloader UI is ready
        // This won't block initial render since it runs after critical functionality
        loadFeatureCSS();
    } catch (err) {
    }
}

/**
 * WHY: Load feature CSS after downloader UI is ready
 * CONTRACT: Defer CSS loading to avoid blocking critical render
 * PRE: Downloader UI loaded, initial render complete
 * POST: All section CSS available for when user scrolls
 * EDGE: Non-blocking, loads in background after interaction ready
 * USAGE: Called after initDownloaderUI() completes
 */
async function loadFeatureCSS() {
    // Load feature CSS in background - won't block initial render
    const featureModules = [
        import('../styles/features/platforms.css'),
        import('../styles/features/features-section.css'),
        import('../styles/features/how-to.css'),
        import('../styles/features/faq.css'),
        import('../styles/features/footer.css'),
        import('../styles/features/content-messages.css'),
        // download-options.css moved to TIER 1 critical CSS
        // Updated: Use reusable packages for portability
        import('../styles/reusable-packages/search-results/search-results.css'),
        import('../styles/reusable-packages/suggestions/suggestions.css'),
        import('../styles/reusable-packages/conversion-modal/conversion-modal.css'),
        import('../styles/features/mobile-download.css'),
        import('../styles/features/gallery.css'),
    ];

    try {
        await Promise.all(featureModules);
    } catch (err) {
    }
}

/**
 * Initialize all features with optimized CSS loading strategy
 */
function loadFeatures() {
    window.scrollTo(0, 0);

    try {
        // Initialize core UI features
        initDownloaderUI();

        // CSS prefetching disabled - Critters plugin handles CSS loading
        // Critical CSS is inlined in HTML, non-critical CSS is lazy-loaded via <link media="print">
        // No need for JS to duplicate CSS loading

    } catch (err) {
    }
}

// Ensure the DOM is fully loaded before initializing UI-dependent scripts.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
    // DOMContentLoaded has already fired
    loadFeatures();
}
