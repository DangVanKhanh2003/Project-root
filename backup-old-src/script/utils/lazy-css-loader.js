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

// Section CSS mapping - mirrors original HTML script configuration
const sectionCSSMap = {
    '#platforms': loadPlatformsCSS,
    '#features': loadFeaturesCSS,
    '#how-to': loadHowToCSS,
    '#faq': loadFaqCSS,
    '#content-area': loadContentMessagesCSS
};

// Track sections to prevent duplicate loading
const observedSections = new Set();

/**
 * Load CSS for a specific section
 * @param {string} sectionSelector - CSS selector for the section
 */
async function loadSectionCSS(sectionSelector) {
    const loadFunction = sectionCSSMap[sectionSelector];

    if (!loadFunction) {
        return;
    }

    try {
        await loadFunction();
    } catch (error) {
    }
}

/**
 * Initialize lazy CSS loading with IntersectionObserver
 * Uses same timing as original HTML script (100px rootMargin)
 */
export function initLazyCSSLoading() {
    // Load section-shared CSS immediately (was preloaded in HTML)
    loadSectionSharedCSS();

    // Create IntersectionObserver with same configuration as HTML script
    const observer = new IntersectionObserver((entries) => {
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
    });

    // Start observing sections when DOM is ready
    function startObserving() {
        Object.keys(sectionCSSMap).forEach(sectionSelector => {
            const element = document.querySelector(sectionSelector);
            if (element) {
                observer.observe(element);
            } else {
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
 * @param {string} sectionSelector - CSS selector for the section
 */
export function loadCSSForSection(sectionSelector) {
    return loadSectionCSS(sectionSelector);
}

/**
 * Check if CSS for a section has been loaded
 * @param {string} sectionSelector - CSS selector for the section
 * @returns {boolean} True if section CSS loading was triggered
 */
export function isSectionCSSLoaded(sectionSelector) {
    return observedSections.has(sectionSelector);
}