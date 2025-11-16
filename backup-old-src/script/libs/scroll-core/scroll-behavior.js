/**
 * ScrollBehavior Module
 * Modern form submission scrolling using centralized ScrollManager.
 * Replaces hardcoded logic with responsive, unified scroll management.
 */

// Import centralized scroll manager
import scrollManager from './scroll-manager.js';

/**
 * Finds the immediate scroll target for searches, with smart desktop/mobile logic.
 * @param {string} searchType - 'url', 'keyword', or 'playlist'
 * @returns {HTMLElement|null} The target element to scroll to.
 */
function findScrollTarget(searchType) {
    let targetElement = null;

    if (searchType === 'keyword') {
        // For keyword searches, always scroll to input field
        targetElement = document.querySelector('#videoUrl');
    } else if (searchType === 'url' || searchType === 'playlist') {
        // Desktop: scroll to input-container for URL submission
        if (scrollManager.isDesktop()) {
            targetElement = document.querySelector('.input-container') ||
                           document.querySelector('#videoUrl') ||
                           document.querySelector('#content-area');

        } else {
            // Mobile: use original logic
            targetElement = document.querySelector('.video-details');
        }
    }

    return targetElement;
}

/**
 * Get scroll offset based on search type and viewport
 * @param {string} searchType - Type of search operation
 * @returns {string|number} Scroll offset ('auto' for dynamic calculation or number for fixed)
 */
function getScrollOffset(searchType) {
    // Use 'auto' for responsive navbar height calculation
    if (searchType === 'keyword') {
        return 'auto'; // Use standard navbar offset
    } else if (searchType === 'url' || searchType === 'playlist') {
        // Desktop URL submission: moderate offset for input-container
        if (scrollManager.isDesktop()) {
            return scrollManager.getNavbarHeight() + 30;
        } else {
            // Mobile: standard offset
            return 'auto';
        }
    }

    return 'auto'; // Default to responsive calculation
}

/**
 * Check if scroll should be performed based on search type and viewport
 * @param {string} searchType - Type of search operation
 * @returns {boolean} Whether to perform scroll
 */
function shouldScroll(searchType) {
    // On desktop, don't scroll for keyword searches (legacy behavior)
    if (searchType === 'keyword' && scrollManager.isDesktop()) {
        return false;
    }

    // Always scroll on mobile, and for URL/playlist on all devices
    return true;
}

/**
 * Enhanced scroll behavior with accessibility support and element waiting
 * @param {HTMLElement} targetElement - Element to scroll to
 * @param {Object} options - Scroll options
 */
function performEnhancedScroll(targetElement, options = {}) {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const scrollOptions = {
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        offset: 'auto',
        onStart: () => {
            // Log scroll action for debugging
        },
        onComplete: () => {
            // Optional callback when scroll completes
            if (options.onComplete) {
                options.onComplete();
            }
        },
        ...options
    };

    return scrollManager.scrollToElement(targetElement, scrollOptions);
}

/**
 * Main function to initialize immediate scroll behavior on submit.
 * Uses modern ScrollManager for responsive, unified scrolling.
 *
 * @param {string} searchType - 'url', 'keyword', or 'playlist'
 * @param {Object} options - Additional scroll options
 * @returns {Promise} Promise that resolves when scroll completes
 */
export function initImmediateScroll(searchType, options = {}) {
    try {
        // Check if scroll should be performed
        if (!shouldScroll(searchType)) {
            return Promise.resolve();
        }

        // Standard scroll behavior for all cases
        const targetElement = findScrollTarget(searchType);
        if (!targetElement) {
            return Promise.resolve();
        }

        // Calculate appropriate offset
        const offset = getScrollOffset(searchType);

        // Perform scroll with enhanced options
        const scrollOptions = {
            offset,
            customOffset: options.customOffset || null,
            onComplete: options.onComplete,
            ...options
        };

        return performEnhancedScroll(targetElement, scrollOptions);

    } catch (error) {
        return Promise.resolve(); // Graceful fallback
    }
}

/**
 * Legacy API compatibility - accepts old parameters
 * @deprecated Use initImmediateScroll with options object instead
 */
export function scrollToInput() {
    return initImmediateScroll('keyword');
}

/**
 * Scroll to top of page using ScrollManager
 * @param {Object} options - Scroll options
 * @returns {Promise} Promise that resolves when scroll completes
 */
export function scrollToTop(options = {}) {
    return scrollManager.scrollToTop(options);
}

/**
 * Force update scroll calculations (useful after dynamic content changes)
 */
export function forceUpdateScrollCalculations() {
    scrollManager.forceUpdateNavbarHeight();
}