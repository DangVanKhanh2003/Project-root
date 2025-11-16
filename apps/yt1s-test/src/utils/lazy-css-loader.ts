/**
 * Lazy CSS Loading Module
 * Replaces HTML inline script with JS module-based CSS loading.
 * Maintains same IntersectionObserver timing (100px rootMargin).
 */

import {
    loadPlatformsCSS,
    loadFeaturesCSS,
    loadHowToCSS,
    loadFaqCSS,
    loadContentMessagesCSS,
    loadSectionSharedCSS
} from './css-loader.js';

/**
 * Type for CSS loader functions
 */
type CSSLoaderFunction = () => Promise<void>;

/**
 * Configuration for IntersectionObserver
 */
interface ObserverConfig {
    rootMargin: string;
}

/**
 * Section CSS mapping type
 */
type SectionCSSMap = {
    [key: string]: CSSLoaderFunction;
};

// Section CSS mapping - mirrors original HTML script configuration
const sectionCSSMap: SectionCSSMap = {
    '#platforms': loadPlatformsCSS,
    '#features': loadFeaturesCSS,
    '#how-to': loadHowToCSS,
    '#faq': loadFaqCSS,
    '#content-area': loadContentMessagesCSS
};

// Track sections to prevent duplicate loading
const observedSections = new Set<string>();

/**
 * Load CSS for a specific section
 * @param sectionSelector - CSS selector for the section
 */
async function loadSectionCSS(sectionSelector: string): Promise<void> {
    const loadFunction = sectionCSSMap[sectionSelector];

    if (!loadFunction) {
        return;
    }

    try {
        await loadFunction();
    } catch (error) {
        // Graceful degradation
    }
}

/**
 * Initialize lazy CSS loading with IntersectionObserver
 * Uses same timing as original HTML script (100px rootMargin)
 */
export function initLazyCSSLoading(): void {
    // Load section-shared CSS immediately (was preloaded in HTML)
    loadSectionSharedCSS();

    // Create IntersectionObserver with same configuration as HTML script
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = '#' + entry.target.id;

                if (sectionCSSMap[sectionId] && !observedSections.has(sectionId)) {
                    observedSections.add(sectionId);
                    loadSectionCSS(sectionId);

                    // Stop observing once CSS is loaded (same as original)
                    observer.unobserve(entry.target);
                }
            }
        });
    }, {
        rootMargin: '100px 0px' // Load 100px before section enters viewport
    } as ObserverConfig);

    // Start observing sections when DOM is ready
    function startObserving(): void {
        Object.keys(sectionCSSMap).forEach((sectionSelector: string) => {
            const element = document.querySelector(sectionSelector);
            if (element) {
                observer.observe(element);
            }
        });
    }

    // Initialize observing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startObserving);
    } else {
        // DOM already loaded
        startObserving();
    }
}

/**
 * Manually trigger CSS loading for a specific section
 * Useful for dynamic content or immediate loading needs
 * @param sectionSelector - CSS selector for the section
 */
export function loadCSSForSection(sectionSelector: string): Promise<void> {
    return loadSectionCSS(sectionSelector);
}

/**
 * Check if CSS for a section has been loaded
 * @param sectionSelector - CSS selector for the section
 * @returns True if section CSS loading was triggered
 */
export function isSectionCSSLoaded(sectionSelector: string): boolean {
    return observedSections.has(sectionSelector);
}
