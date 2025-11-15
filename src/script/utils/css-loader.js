/**
 * CSS Dynamic Loading Module
 * Provides centralized CSS loading functions with automatic Vite chunking.
 * Each function returns a Promise for dynamic CSS import.
 */

// Track loaded CSS to prevent duplicate loading
const loadedCSS = new Set();

/**
 * Generic CSS loader with error handling
 * @param {string} cssPath - Path to CSS file
 * @param {string} identifier - Unique identifier for tracking
 * @returns {Promise} Promise that resolves when CSS is loaded
 */
async function loadCSS(cssPath, identifier) {
    if (loadedCSS.has(identifier)) {
        return Promise.resolve(); // Already loaded
    }

    try {
        await import(/* @vite-ignore */ cssPath);
        loadedCSS.add(identifier);
    } catch (error) {
        // Graceful degradation - app continues to function
    }
}

// Section-based CSS loaders (lazy-loaded on scroll)
export const loadPlatformsCSS = () =>
    loadCSS('../../styles/features/platforms.css', 'platforms');

export const loadFeaturesCSS = () =>
    loadCSS('../../styles/features/features-section.css', 'features');

export const loadHowToCSS = () =>
    loadCSS('../../styles/features/how-to.css', 'how-to');

export const loadFaqCSS = () =>
    loadCSS('../../styles/features/faq.css', 'faq');

export const loadContentMessagesCSS = () =>
    loadCSS('../../styles/features/content-messages.css', 'content-messages');

// Interactive feature CSS loaders (triggered by user actions)
export const loadDownloadOptionsCSS = () =>
    loadCSS('../../styles/features/download-options.css', 'download-options');

export const loadSearchResultsCSS = () =>
    loadCSS('../../styles/reusable-packages/search-results/search-results.css', 'search-results');

export const loadSuggestionsCSS = () =>
    loadCSS('../../styles/reusable-packages/suggestions/suggestions.css', 'suggestions');

// Additional feature CSS
export const loadSectionSharedCSS = () =>
    loadCSS('../../styles/features/section-shared.css', 'section-shared');

export const loadCaptchaModalCSS = () =>
    loadCSS('../../styles/reusable-packages/captcha-modal/captcha-modal.css', 'captcha-modal');

export const loadConvertIndicatorCSS = () =>
    loadCSS('../../styles/features/convert-indicator.css', 'convert-indicator');

export const loadConvertSidebarCSS = () =>
    loadCSS('../../styles/features/convert-sidebar.css', 'convert-sidebar');

export const loadGalleryCSS = () =>
    loadCSS('../../styles/features/gallery.css', 'gallery');

export const loadConversionModalCSS = () =>
    loadCSS('../../styles/reusable-packages/conversion-modal/conversion-modal.css', 'conversion-modal');

export const loadSmoothProgressCSS = () =>
    loadCSS('../../styles/features/smooth-progress.css', 'smooth-progress');

export const loadMobileDownloadCSS = () =>
    loadCSS('../../styles/features/mobile-download.css', 'mobile-download');

/**
 * Utility function to check if CSS is already loaded
 * @param {string} identifier - CSS identifier
 * @returns {boolean} True if CSS is loaded
 */
export const isCSSLoaded = (identifier) => loadedCSS.has(identifier);

/**
 * Reset loaded CSS tracking (useful for testing)
 */
export const resetLoadedCSS = () => loadedCSS.clear();