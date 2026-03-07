/**
 * Environment Configuration for Downloader Project
 * Centralized configuration management
 */

// Environment detection
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isProduction = !isDevelopment;

// Constants
const IOS_STREAM_MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150MB in bytes

// Type definitions
interface TimeoutConfig {
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
    // V3 API timeouts
    v3CreateJob: number;
    v3GetStatus: number;
    v3PollingInterval: number;
    v3MaxPollingDuration: number;
    zipDownload: number;
}

interface ExpiryConfig {
    static: number;
    downloadLink: number;
}

interface ApiConfig {
    baseUrl: string;
    baseUrlV1: string;
    baseUrlV2: string;
    baseUrlV3: string;
    ytMetaBaseUrl: string;
    searchV2BaseUrl: string;
    youtubeStreamApiUrl: string;
    youtubeStreamApiEndpoint: string;
    v2ApiUrl: string;
    mutiDownloadBaseUrl: string;
    queueApiUrl: string;
    supporterApiBaseUrl: string;
    searchEndpoint: string;
    timeout: TimeoutConfig;
    expiry: ExpiryConfig;
}

interface CaptchaProviderConfig {
    siteKey: string;
    enabled: boolean;
}

interface CaptchaConfig {
    provider: 'cloudflare' | 'google';
    cloudflare: CaptchaProviderConfig;
    google: CaptchaProviderConfig;
}

interface AppConfig {
    webName: string;
    name: string;
    version: string;
}

interface FeatureFlags {
    enableSuggestions: boolean;
    enablePlaylistSupport: boolean;
    enableCaptcha: boolean;
    enableDebugLogging: boolean;
}

interface DevConfig {
    enableVerboseLogging: boolean;
    mockApiCalls: boolean;
    bypassCaptcha: boolean;
}

interface Environment {
    isDev: boolean;
    isProd: boolean;
    mode: 'development' | 'production';
    api: ApiConfig;
    captcha: CaptchaConfig;
    app: AppConfig;
    features: FeatureFlags;
    dev: DevConfig;
}

// Base configuration object
const environment: Environment = {
    // Environment info
    isDev: isDevelopment,
    isProd: isProduction,
    mode: isDevelopment ? 'development' : 'production',

    // API Configuration
    api: {
        // V1 API Base URL (old API endpoint)
        baseUrlV1: import.meta.env.VITE_API_BASE_URL_V1 || 'https://api.yt1s.cx/api/v1',

        // V2 API Base URL (new API endpoint - current default)
        baseUrlV2: import.meta.env.VITE_API_BASE_URL_V2 || 'https://hub.y2mp3.co',

        // V3 API Base URL (YouTube Download API)
        baseUrlV3: import.meta.env.VITE_API_BASE_URL_V3 || 'https://hub.ytconvert.org',

        // YT Meta API Base URL (playlist metadata)
        ytMetaBaseUrl: import.meta.env.VITE_YT_META_BASE_URL || 'https://yt-meta.ytconvert.org',

        // Main API (currently uses V1 - for extract, convert, playlist, etc.)
        // Both dev and prod use production API (no local backend)
        baseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.yt1s.cx/api/v1',

        // Search V2 API (YouTube search) - separate domain
        // Both dev and prod use production API (no local backend)
        searchV2BaseUrl: import.meta.env.VITE_SEARCH_V2_BASE_URL || 'https://search.ytconvert.org',

        // YouTube Stream API (new service endpoint)
        // Both dev and prod use production API (no local backend)
        youtubeStreamApiUrl: import.meta.env.VITE_YOUTUBE_STREAM_API_URL || 'https://api.yt1s.cx',

        // YouTube Stream API endpoint path
        youtubeStreamApiEndpoint: '',

        // V2 API (extract, search) - same as baseUrlV2 but without /api/v2 suffix
        // Both dev and prod use production API (no local backend)
        v2ApiUrl: 'https://hub.y2mp3.co',

        // Queue API (YouTube add queue)
        // Both dev and prod use production API (no local backend)
        queueApiUrl: 'https://hub.y2mp3.co',

        // ZIP Download API
        mutiDownloadBaseUrl: 'https://muti-download.ytconvert.org',

        // Supporter API (license key check)
        supporterApiBaseUrl: import.meta.env.VITE_SUPPORTER_API_BASE_URL || 'https://ytmp3-supporter.ytmp3.gg',

        // Search endpoint (specific for search functionality)
        searchEndpoint: '/index.php',

        // Request timeouts (in milliseconds)
        timeout: {
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
            // V3 API timeouts
            v3CreateJob: 60 * 60 * 1000, // 1 hour for create job
            v3GetStatus: 20000,
            v3PollingInterval: 1000, // 1 second delay between polls
            v3MaxPollingDuration: 5 * 60 * 60 * 1000, // 5 hours max polling
            zipDownload: 30000, // 30 seconds for ZIP download creation
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
 * Get API base URL with fallback (currently V2)
 * @returns API base URL
 */
export function getApiBaseUrl(): string {
    return environment.api.baseUrl;
}

/**
 * Get API V1 base URL
 * @returns API V1 base URL
 */
export function getApiBaseUrlV1(): string {
    return environment.api.baseUrlV1;
}

/**
 * Get API V2 base URL
 * @returns API V2 base URL
 */
export function getApiBaseUrlV2(): string {
    return environment.api.baseUrlV2;
}

/**
 * Get API V3 base URL
 * @returns API V3 base URL
 */
export function getApiBaseUrlV3(): string {
    return environment.api.baseUrlV3;
}

/**
 * Get Muti-download API base URL
 * @returns Muti-download base URL
 */
export function getMutiDownloadBaseUrl(): string {
    return environment.api.mutiDownloadBaseUrl;
}

/**
 * Get Supporter API base URL (license key check)
 */
export function getSupporterApiBaseUrl(): string {
    return environment.api.supporterApiBaseUrl;
}

/**
 * Get YT Meta API base URL (playlist metadata)
 * @returns YT Meta base URL
 */
export function getYtMetaBaseUrl(): string {
    return environment.api.ytMetaBaseUrl;
}

/**
 * Get Search V2 API base URL
 * @returns Search V2 API base URL
 */
export function getSearchV2BaseUrl(): string {
    return environment.api.searchV2BaseUrl;
}

/**
 * Get complete API endpoint URL
 * @param endpoint - API endpoint path
 * @returns Complete URL
 */
export function getApiUrl(endpoint: string): string {
    const baseUrl = getApiBaseUrl();
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${baseUrl}${cleanEndpoint}`;
}

/**
 * Get search endpoint URL
 * @returns Search endpoint URL
 */
export function getSearchUrl(): string {
    return getApiUrl(environment.api.searchEndpoint);
}

/**
 * Get YouTube Stream API base URL
 * @returns YouTube Stream API base URL
 */
export function getYouTubeStreamApiUrl(): string {
    return environment.api.youtubeStreamApiUrl;
}

/**
 * Get V2 API base URL
 * @returns V2 API base URL
 */
export function getV2ApiUrl(): string {
    return environment.api.v2ApiUrl;
}

/**
 * Get Queue API base URL
 * @returns Queue API base URL
 */
export function getQueueApiUrl(): string {
    return environment.api.queueApiUrl;
}

/**
 * Get YouTube Stream API endpoint path
 * @returns YouTube Stream API endpoint path
 */
export function getYouTubeStreamApiEndpoint(): string {
    return environment.api.youtubeStreamApiEndpoint;
}

interface CaptchaConfigResult {
    provider: 'cloudflare' | 'google';
    config: CaptchaProviderConfig;
    enabled: boolean;
}

/**
 * Get CAPTCHA configuration for current provider
 * @returns CAPTCHA config
 */
export function getCaptchaConfig(): CaptchaConfigResult {
    const provider = environment.captcha.provider;
    return {
        provider,
        config: environment.captcha[provider],
        enabled: environment.features.enableCaptcha
    };
}

/**
 * Check if feature is enabled
 * @param featureName - Name of feature to check
 * @returns Whether feature is enabled
 */
export function isFeatureEnabled(featureName: keyof FeatureFlags): boolean {
    return environment.features[featureName] || false;
}

/**
 * Get request timeout for specific operation
 * @param operation - Operation name (extract, search, etc.)
 * @returns Timeout in milliseconds
 */
export function getTimeout(operation: keyof TimeoutConfig): number {
    return environment.api.timeout[operation] || environment.api.timeout.default;
}

/**
 * Get expiry time for specific data type
 * @param dataType - Data type (static, downloadLink, etc.)
 * @returns Expiry time in milliseconds
 */
export function getExpiryTime(dataType: keyof ExpiryConfig): number {
    return environment.api.expiry[dataType] || 0;
}

/**
 * Get iOS stream max size threshold (150MB)
 * @returns Size in bytes
 */
export function getIOSStreamMaxSize(): number {
    return IOS_STREAM_MAX_SIZE_BYTES;
}

/**
 * Log environment info (development only)
 */
export function logEnvironmentInfo(): void {
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
