/**
 * API Setup - @downloader/core Integration
 * Follows DOMAIN_LAYER_GUIDE.md pattern
 */

import {
  // HTTP Client
  createHttpClient,

  // Core Services Factory Functions
  createFeedbackService,
  createSearchV2Service,
  createQueueService,
  createYouTubePublicApiService,
  createV3PlaylistService,
  createV3DownloadService,

  // Domain Layer
  createVerifier,
  createVerifiedServices,
  LocalStorageJwtStore,
  createNamespacedKey,
  DEFAULT_POLICIES,
} from '@downloader/core';

// Import centralized environment configuration
import { getApiBaseUrl, getApiBaseUrlV2, getSearchV2BaseUrl, getQueueApiUrl, getTimeout } from '../environment';

// Import CAPTCHA dependencies
import { CaptchaModal } from '@downloader/ui-shared';
import { loadCaptchaModalCSS } from '../loaders/css-loader';

// API Configuration from environment.ts
const API_BASE_URL = getApiBaseUrl();
const API_V2_BASE_URL = getApiBaseUrlV2();
const SEARCH_V2_BASE_URL = getSearchV2BaseUrl();
const QUEUE_API_BASE_URL = getQueueApiUrl();
const API_TIMEOUT = getTimeout('default');

// 1. Create HTTP Clients
// Main API HTTP Client (media extraction, conversion)
const httpClient = createHttpClient({
  baseUrl: API_BASE_URL,  // https://api.yt1s.cx/api/v1
  timeout: API_TIMEOUT,
});

// Search V2 HTTP Client (separate domain for YouTube search)
const searchV2HttpClient = createHttpClient({
  baseUrl: SEARCH_V2_BASE_URL,
  timeout: getTimeout('searchV2'),
});

// Queue HTTP Client (separate domain for queue API)
const queueHttpClient = createHttpClient({
  baseUrl: QUEUE_API_BASE_URL,
  timeout: getTimeout('addQueue'),
});

const apiConfig = {
  baseUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
};

const searchV2ApiConfig = {
  baseUrl: SEARCH_V2_BASE_URL,
  timeout: getTimeout('searchV2'),
};

const queueApiConfig = {
  baseUrl: QUEUE_API_BASE_URL,
  timeout: getTimeout('addQueue'),
};

// 2. Create JWT Store (namespaced to prevent collision) - MUST be created before verifier
const jwtStore = new LocalStorageJwtStore(
  createNamespacedKey('ssvid', 'downloader')
);

// 3. Create Core Services (JWT handling moved to Domain Layer - Verifier)
// Only includes services that match CoreServices interface
const coreServices = {
  // Feedback service
  feedback: createFeedbackService(httpClient, apiConfig),

  // YouTube Public API
  youtubePublicApi: createYouTubePublicApiService(httpClient, apiConfig),

  // Search V2 using separate HTTP client (different domain)
  searchV2: createSearchV2Service(searchV2HttpClient, searchV2ApiConfig),

  // Queue API using separate HTTP client (different domain)
  queue: createQueueService(queueHttpClient, queueApiConfig),

  // Playlist V3
  playlistV3: createV3PlaylistService(httpClient, apiConfig),

  // Download V3
  downloadV3: createV3DownloadService(httpClient, apiConfig),
};

// 4. Create Verifier (Domain Layer)
const verifier = createVerifier({
    jwtStore,
    policies: DEFAULT_POLICIES,
    verbose: true, // Enable logging in development
  });

  // 5. Create CAPTCHA Handler (Dependency Injection)
  const captchaHandler = async () => {
    // Lazy-load CAPTCHA modal CSS
    await loadCaptchaModalCSS();

    // Show CAPTCHA modal and get token
    const captchaModal = new CaptchaModal();
    const result = await captchaModal.getCaptchaToken();

    return {
      token: result.token,
      type: result.type,
    };
  };

  // 6. Create Verified Services with CAPTCHA handler
  // Domain Layer (Verifier) handles JWT extraction and storage automatically
  export const api = createVerifiedServices(coreServices, verifier, captchaHandler);

  // Export for debugging/advanced use
  export { coreServices, verifier, jwtStore };
