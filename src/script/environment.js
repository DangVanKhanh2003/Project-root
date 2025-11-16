/**
 * Environment Configuration for Downloader Project
 * Centralized configuration management
 */

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = !isDevelopment;

// Constants
const IOS_STREAM_MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150MB in bytes

// Base configuration object
const environment = {
    // Environment info
    isDev: isDevelopment,
    isProd: isProduction,
    mode: isDevelopment ? 'development' : 'production',

    // API Configuration
    api: {
        baseUrl: isDevelopment
            ? 'https://api.yt1s.cx/api/v1'
            : 'https://api.yt1s.cx/api/v1',

        // YouTube Stream API (new service endpoint)
        youtubeStreamApiUrl: isDevelopment
            ? 'https://api.yt1s.cx'
            : 'https://api.yt1s.cx',

        // YouTube Stream API endpoint path
        youtubeStreamApiEndpoint: '',

        // V2 API (extract, search)
        v2ApiUrl: isDevelopment
            ? 'https://sv-190.y2mp3.co'
            : 'https://sv-190.y2mp3.co',

        // Queue API (YouTube add queue)
        queueApiUrl: isDevelopment
            ? 'https://sv-190.y2mp3.co'
            : 'https://sv-190.y2mp3.co',

        // Search endpoint (specific for search functionality)
        searchEndpoint: '/index.php',

        // Request timeouts (in milliseconds)
        timeout: {
            default: 15000,
            extract: 20000,
            searchTitle: 20000,
            playlist: 25000,
            convert: 20000,
            checkTask: 30000,
            suggest: 7000,
            decode: 60000, // 60 seconds for URL decryption
            multifileStart: 15000, // 15 seconds for multifile start request
            streamDownload: 30 * 60 * 1000, // 30 minutes for stream downloads to RAM
        },

        // Data expiry times (in milliseconds)
        expiry: {
            static: 25 * 60 * 1000, // 25 minutes for static extract data
            downloadLink: 25 * 60 * 1000, // 60 minutes for download links
        }
    },

    // CAPTCHA Configuration
    captcha: {
        // Default provider: "cloudflare" or "google"
        provider: 'cloudflare',

        // Cloudflare Turnstile configuration
        cloudflare: {
            siteKey: '1x00000000000000000000AA',
            enabled: true
        },

        // Google reCAPTCHA configuration
        google: {
            siteKey: 'avv',
            enabled: true
        }
    },

    // Application Configuration
    app: {
        // Identifier for multi-site backend configs
        webName: 'default',

        // Application metadata
        name: 'Video Downloader',
        version: '1.0.0'
    },

    // Feature flags
    features: {
        enableSuggestions: true,
        enablePlaylistSupport: true,
        enableCaptcha: true,
        enableDebugLogging: isDevelopment
    },

    // Development-specific settings
    dev: {
        enableVerboseLogging: isDevelopment,
        mockApiCalls: false,
        bypassCaptcha: isDevelopment
    }
};

/**
 * Get API base URL with fallback
 * @returns {string} API base URL
 */
export function getApiBaseUrl() {
    return environment.api.baseUrl;
}

/**
 * Get complete API endpoint URL
 * @param {string} endpoint - API endpoint path
 * @returns {string} Complete URL
 */
export function getApiUrl(endpoint) {
    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Get search endpoint URL
 * @returns {string} Search endpoint URL
 */
export function getSearchUrl() {
    return getApiUrl(environment.api.searchEndpoint);
}

/**
 * Get YouTube Stream API base URL
 * @returns {string} YouTube Stream API base URL
 */
export function getYouTubeStreamApiUrl() {
    return environment.api.youtubeStreamApiUrl;
}

/**
 * Get V2 API base URL
 * @returns {string} V2 API base URL
 */
export function getV2ApiUrl() {
    return environment.api.v2ApiUrl;
}

/**
 * Get Queue API base URL
 * @returns {string} Queue API base URL
 */
export function getQueueApiUrl() {
    return environment.api.queueApiUrl;
}

/**
 * Get YouTube Stream API endpoint path
 * @returns {string} YouTube Stream API endpoint path
 */
export function getYouTubeStreamApiEndpoint() {
    return environment.api.youtubeStreamApiEndpoint;
}

/**
 * Get CAPTCHA configuration for current provider
 * @returns {Object} CAPTCHA config
 */
export function getCaptchaConfig() {
    const provider = environment.captcha.provider;
    return {
        provider,
        config: environment.captcha[provider],
        enabled: environment.features.enableCaptcha
    };
}

/**
 * Check if feature is enabled
 * @param {string} featureName - Name of feature to check
 * @returns {boolean} Whether feature is enabled
 */
export function isFeatureEnabled(featureName) {
    return environment.features[featureName] || false;
}

/**
 * Get request timeout for specific operation
 * @param {string} operation - Operation name (extract, search, etc.)
 * @returns {number} Timeout in milliseconds
 */
export function getTimeout(operation) {
    return environment.api.timeout[operation] || environment.api.timeout.default;
}

/**
 * Get expiry time for specific data type
 * @param {string} dataType - Data type (static, downloadLink, etc.)
 * @returns {number} Expiry time in milliseconds
 */
export function getExpiryTime(dataType) {
    return environment.api.expiry[dataType] || 0;
}

/**
 * Get iOS stream max size threshold (150MB)
 * @returns {number} Size in bytes
 */
export function getIOSStreamMaxSize() {
    return IOS_STREAM_MAX_SIZE_BYTES;
}

/**
 * Log environment info (development only)
 */
export function logEnvironmentInfo() {
    if (environment.dev.enableVerboseLogging) {
    }
}

// Auto-log on import in development
if (isDevelopment) {
    logEnvironmentInfo();
}

// Export main environment object
export default environment;

// Named exports for convenience
export const {
    api: apiConfig,
    captcha: captchaConfig,
    app: appConfig,
    features: featureFlags,
    dev: devConfig
} = environment;