/**
 * CSS Dynamic Loading Module
 * Provides centralized CSS loading functions with automatic Vite chunking.
 * Each function returns a Promise for dynamic CSS import.
 */

// Track loaded CSS to prevent duplicate loading
const loadedCSS = new Set<string>();

/**
 * Generic CSS loader with error handling
 * @param cssPath - Path to CSS file
 * @param identifier - Unique identifier for tracking
 * @returns Promise that resolves when CSS is loaded
 */
async function loadCSS(cssPath: string, identifier: string): Promise<void> {
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
export const loadPlatformsCSS = (): Promise<void> =>
    loadCSS('../../styles/features/platforms.css', 'platforms');

export const loadFeaturesCSS = (): Promise<void> =>
    loadCSS('../../styles/features/features-section.css', 'features');

export const loadHowToCSS = (): Promise<void> =>
    loadCSS('../../styles/features/how-to.css', 'how-to');

export const loadFaqCSS = (): Promise<void> =>
    loadCSS('../../styles/features/faq.css', 'faq');

export const loadContentMessagesCSS = (): Promise<void> =>
    loadCSS('../../styles/features/content-messages.css', 'content-messages');

// Interactive feature CSS loaders (triggered by user actions)
export const loadDownloadOptionsCSS = (): Promise<void> =>
    loadCSS('../../styles/features/download-options.css', 'download-options');

export const loadSearchResultsCSS = (): Promise<void> =>
    loadCSS('../../styles/reusable-packages/search-results/search-results.css', 'search-results');

export const loadSuggestionsCSS = (): Promise<void> =>
    loadCSS('../../styles/reusable-packages/suggestions/suggestions.css', 'suggestions');

// Additional feature CSS
export const loadSectionSharedCSS = (): Promise<void> =>
    loadCSS('../../styles/features/section-shared.css', 'section-shared');

export const loadCaptchaModalCSS = (): Promise<void> =>
    loadCSS('../../styles/reusable-packages/captcha-modal/captcha-modal.css', 'captcha-modal');

export const loadConvertIndicatorCSS = (): Promise<void> =>
    loadCSS('../../styles/features/convert-indicator.css', 'convert-indicator');

export const loadConvertSidebarCSS = (): Promise<void> =>
    loadCSS('../../styles/features/convert-sidebar.css', 'convert-sidebar');

export const loadGalleryCSS = (): Promise<void> =>
    loadCSS('../../styles/features/gallery.css', 'gallery');

export const loadConversionModalCSS = (): Promise<void> =>
    loadCSS('../../styles/reusable-packages/conversion-modal/conversion-modal.css', 'conversion-modal');

export const loadSmoothProgressCSS = (): Promise<void> =>
    loadCSS('../../styles/features/smooth-progress.css', 'smooth-progress');

export const loadMobileDownloadCSS = (): Promise<void> =>
    loadCSS('../../styles/features/mobile-download.css', 'mobile-download');

/**
 * Utility function to check if CSS is already loaded
 * @param identifier - CSS identifier
 * @returns True if CSS is loaded
 */
export const isCSSLoaded = (identifier: string): boolean => loadedCSS.has(identifier);

/**
 * Reset loaded CSS tracking (useful for testing)
 */
export const resetLoadedCSS = (): void => loadedCSS.clear();
