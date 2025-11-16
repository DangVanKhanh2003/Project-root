/**
 * Card Utilities
 * Helper functions for search result card rendering
 */

import { generateYoutubeThumbnail as generateThumbnail } from '../../utils.js';

/**
 * Format view count for responsive display
 * Mobile: "2.3M" | Desktop: "2.3M views"
 *
 * @param {string} displayViews - View count text from API
 * @returns {string} Formatted view count
 */
export function formatViewsForDisplay(displayViews) {
    if (!displayViews) return '';

    // Mobile: Remove " views" suffix (e.g., "2.3M views" → "2.3M")
    // Desktop: Keep full text (e.g., "2.3M views")
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
        return displayViews.replace(' views', '');
    }

    return displayViews;
}

/**
 * Generate YouTube thumbnail fallback URL
 * Re-exported from utils.js for convenience
 *
 * @param {string} videoId - YouTube video ID
 * @returns {string} Thumbnail URL
 */
export function generateYoutubeThumbnail(videoId) {
    return generateThumbnail(videoId);
}

/**
 * Escape HTML to prevent XSS
 *
 * @param {string} str - String to escape
 * @returns {string} Escaped HTML string
 */
export function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
