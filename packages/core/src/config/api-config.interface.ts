/**
 * API Configuration Interface
 * Multi-site injectable configuration for downloader core package
 *
 * This config supports multiple sites with different API base URLs.
 * Example:
 * - Site projectA: v1 at api.projectA-v1.com, v2 at api.projectA-v2.com
 * - Site projectB: v1 at api.projectB-v1.com, v2 at api.projectB-v2.com
 */

/**
 * Main API Configuration
 * Injected at runtime when initializing core package
 */
export interface ApiConfig {
  /**
   * API v1 configuration (extract, convert, search...)
   * Example: { baseUrl: 'https://api.projectA-v1.com' }
   */
  v1: {
    /**
     * Full base URL for v1 API
     * @example 'https://api.projectA-v1.com'
     */
    baseUrl: string;

    /**
     * Optional default timeout for v1 requests (ms)
     * @default 15000
     */
    timeout?: number;
  };

  /**
   * API v2 configuration (YouTube Stream API)
   * Example: { baseUrl: 'https://api.projectA-v2.com' }
   */
  v2: {
    /**
     * Full base URL for v2 API
     * @example 'https://api.projectA-v2.com'
     */
    baseUrl: string;

    /**
     * Optional stream endpoint path
     * @default ''
     */
    streamEndpoint?: string;

    /**
     * Optional default timeout for v2 requests (ms)
     * @default 1000000 
     */
    timeout?: number;
  };

  /**
   * Queue API configuration (optional - analytics/tracking)
   * If omitted, queue tracking will be disabled
   */
  queue?: {
    /**
     * Full base URL for queue API
     * @example 'https://api.projectA-v2.com'
     */
    baseUrl: string;

    /**
     * Enable/disable queue tracking
     * @default true
     */
    enabled?: boolean;

    /**
     * Optional timeout for queue requests (ms)
     * @default 10000
     */
    timeout?: number;
  };

  /**
   * Search v2 API configuration (optional)
   * If omitted, uses v2.baseUrl
   */
  search?: {
    /**
     * Full base URL for search v2 API
     * @example 'https://search.projectA.com'
     */
    baseUrl: string;

    /**
     * Optional timeout for search requests (ms)
     * @default 15000
     */
    timeout?: number;
  };

  /**
   * ZIP Download API configuration (optional)
   */
  zip?: {
    /**
     * Full base URL for ZIP download API
     * @example 'https://muti-download.ytconvert.org'
     */
    baseUrl: string;

    /**
     * Optional timeout for ZIP requests (ms)
     * @default 30000
     */
    timeout?: number;
  };

  /**
   * Save ZIP API configuration (optional)
   * Server-side ZIP session for mobile batch downloads
   */
  saveZip?: {
    /**
     * Full base URL for Save ZIP API
     * @example 'https://muti-download.ytconvert.org'
     */
    baseUrl: string;

    /**
     * Optional timeout for Save ZIP requests (ms)
     * @default 15000
     */
    timeout?: number;
  };

  /**
   * Per-operation timeout overrides (optional)
   * These override the default timeouts for specific operations
   */
  timeouts?: {
    extract?: number;

    extractNonEncode?: number;

    searchTitle?: number;

    playlist?: number;

    convert?: number;

    checkTask?: number;

    suggest?: number;

    decode?: number;

    decodeList?: number;

    multifileStart?: number;

    multifileStatus?: number;

    extractV2Stream?: number;

    pollProgress?: number;

    feedback?: number;

    searchV2?: number;

    addQueue?: number;

    /** V3: Create job timeout (1 hour) */
    v3CreateJob?: number;

    /** V3: Get status timeout (55 seconds) */
    v3GetStatus?: number;

    /** Save ZIP: Init session timeout */
    saveZipInit?: number;

    /** Save ZIP: Add file timeout */
    saveZipAdd?: number;

    /** Save ZIP: Create ZIP timeout */
    saveZip?: number;

    /** Save ZIP: Poll status timeout */
    saveZipStatus?: number;
  };
}

/**
 * Default timeout values (milliseconds)
 * Used when not specified in config
 */
export const DEFAULT_TIMEOUTS = {
  default: 15000,
  extract: 200000,
  extractNonEncode: 200000,
  searchTitle: 20000,
  playlist: 25000,
  convert: 200000,
  checkTask: 300000,
  suggest: 7000,
  decode: 60000,
  decodeList: 60000,
  multifileStart: 150000,
  multifileStatus: 100000,
  extractV2Stream: 3000000, // 5 minutes for large streams
  pollProgress: 1000000,
  feedback: 10000,
  searchV2: 15000,
  addQueue: 100000,
  // V3 API timeouts
  v3CreateJob: 3600000, // 1 hour
  v3GetStatus: 55000, // 55 seconds
  // Save ZIP API timeouts (mobile)
  saveZipInit: 15000,
  saveZipAdd: 15000,
  saveZip: 15000,
  saveZipStatus: 10000,
} as const;

/**
 * Get timeout value with fallback
 * @param config - API configuration
 * @param operation - Operation name
 * @returns Timeout in milliseconds
 */
export function getTimeout(
  config: ApiConfig,
  operation: keyof typeof DEFAULT_TIMEOUTS
): number {
  return config.timeouts?.[operation] || DEFAULT_TIMEOUTS[operation];
}
