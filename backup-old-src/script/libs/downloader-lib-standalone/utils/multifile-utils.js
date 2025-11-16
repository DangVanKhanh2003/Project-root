/**
 * Multifile Download Utilities
 * Pure functions for comparing and validating multifile data
 */

/**
 * Validate URL array with defensive programming
 * @param {any} urls - Input to validate
 * @param {string} context - Context for error messages
 * @returns {boolean} True if valid
 * @throws {Error} If validation fails
 */
export function validateUrlArray(urls, context = 'unknown') {
    if (!Array.isArray(urls)) {
        throw new Error(`${context}: Expected array, got ${typeof urls}`);
    }

    if (urls.length === 0) {
        throw new Error(`${context}: URL array cannot be empty`);
    }

    if (urls.length > 20) { // Business rule from multifile-constants
        throw new Error(`${context}: Too many URLs (max 20, got ${urls.length})`);
    }

    urls.forEach((url, index) => {
        if (typeof url !== 'string' || !url.trim()) {
            throw new Error(`${context}: Invalid URL at index ${index}`);
        }
    });

    return true;
}

/**
 * Compare two URL arrays for equality (order-independent)
 * @param {string[]} arr1 - First array
 * @param {string[]} arr2 - Second array
 * @returns {boolean} True if arrays contain same URLs
 */
export function arraysEqual(arr1, arr2) {
    if (!Array.isArray(arr1) || !Array.isArray(arr2)) {
        return false;
    }

    if (arr1.length !== arr2.length) {
        return false;
    }

    // Sort both arrays for order-independent comparison
    const sorted1 = [...arr1].sort();
    const sorted2 = [...arr2].sort();

    return sorted1.every((url, index) => url === sorted2[index]);
}

/**
 * Check if download link is expired
 * @param {number} expireTime - Timestamp when link expires
 * @returns {boolean} True if expired
 */
export function isExpired(expireTime) {
    return !expireTime || Date.now() > expireTime;
}

/**
 * Determine if recent download can be reused
 * @param {string[]} currentUrls - Currently selected URLs
 * @param {Object|null} recentDownload - Recent download data
 * @returns {Object} { canReuse: boolean, reason: string }
 */
export function canReuseDownload(currentUrls, recentDownload) {
    try {
        
        // Validate current selection
        if (!validateUrlArray(currentUrls, 'current-selection')) {
            return { canReuse: false, reason: 'invalid-current-selection' };
        }

        // Check if recent download exists
        if (!recentDownload || !recentDownload.listUrl || !recentDownload.url) {
            return { canReuse: false, reason: 'no-recent-download' };
        }

        // Validate recent download data
        if (!validateUrlArray(recentDownload.listUrl, 'recent-download')) {
            return { canReuse: false, reason: 'invalid-recent-data' };
        }

        // Compare URL arrays
        if (!arraysEqual(currentUrls, recentDownload.listUrl)) {
            return { canReuse: false, reason: 'different-selection' };
        }

        // Check expiration
        if (isExpired(recentDownload.expireTime)) {
            return { canReuse: false, reason: 'expired', isExpired: true };
        }

        return { canReuse: true, reason: 'valid' };

    } catch (error) {
        return { canReuse: false, reason: 'comparison-error', error };
    }
}