/**
 * Shared Configuration Constants
 * Contains shared constants and configuration used across all apps
 *
 * NOTE: Extracted from apps/.../src/environment.ts
 * Only includes non-app-specific configuration (timeouts, expiry, constants)
 * App-specific config (API URLs, captcha, feature flags) stays in apps
 */

// Constants
export const IOS_STREAM_MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150MB in bytes

// Type definitions
export interface TimeoutConfig {
    default: number;
    extract: number;
    searchTitle: number;
    searchV2: number;
    playlist: number;
    convert: number;
    checkTask: number;
    pollingV2: number;
    suggest: number;
    decode: number;
    multifileStart: number;
    streamDownload: number;
    addQueue: number;
}

export interface ExpiryConfig {
    static: number;
    downloadLink: number;
}

// Request timeouts (in milliseconds) - shared across all apps
export const TIMEOUT_CONFIG: TimeoutConfig = {
    default: 15000,
    extract: 20000,
    searchTitle: 20000,
    searchV2: 20000, // 20 seconds for Search V2 API
    playlist: 25000,
    convert: 20000,
    checkTask: 30000,
    pollingV2: 950, // 950ms for V2 polling progress checks
    suggest: 7000,
    decode: 60000, // 60 seconds for URL decryption
    multifileStart: 15000, // 15 seconds for multifile start request
    streamDownload: 30 * 60 * 1000, // 30 minutes for stream downloads to RAM
    addQueue: 5000, // 5 seconds for queue API (fire-and-forget)
};

// Data expiry times (in milliseconds) - shared across all apps
export const EXPIRY_CONFIG: ExpiryConfig = {
    static: 25 * 60 * 1000,      // 25 minutes for static extract data
    downloadLink: 25 * 60 * 1000, // 25 minutes for download links
};

/**
 * Get request timeout for specific operation
 * @param operation - Operation name (extract, search, etc.)
 * @returns Timeout in milliseconds
 *
 * NOTE: Extracted from apps/ytmp3-clone-3/src/environment.ts:315-317
 */
export function getTimeout(operation: keyof TimeoutConfig): number {
    return TIMEOUT_CONFIG[operation] || TIMEOUT_CONFIG.default;
}

/**
 * Get expiry time for specific data type
 * @param dataType - Data type (static, downloadLink, etc.)
 * @returns Expiry time in milliseconds
 *
 * NOTE: Extracted from apps/ytmp3-clone-3/src/environment.ts:324-326
 */
export function getExpiryTime(dataType: keyof ExpiryConfig): number {
    return EXPIRY_CONFIG[dataType] || 0;
}

/**
 * Get iOS stream max size threshold (150MB)
 * @returns Size in bytes
 *
 * NOTE: Extracted from apps/ytmp3-clone-3/src/environment.ts:332-334
 */
export function getIOSStreamMaxSize(): number {
    return IOS_STREAM_MAX_SIZE_BYTES;
}
