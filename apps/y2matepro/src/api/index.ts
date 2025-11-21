/**
 * API Setup - @downloader/core Integration
 * Follows DOMAIN_LAYER_GUIDE.md pattern
 */

import {
  // HTTP Client
  createHttpClient,

  // Core Services Factory Functions
  createSearchService,
  createMediaService,
  createConversionService,
  createPlaylistService,
  createDecryptService,
  createFeedbackService,
  createSearchV2Service,
  createQueueService,
  createYouTubeDownloadService,
  createMultifileService,
  createYouTubePublicApiService,

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

// API V2 HTTP Client (YouTube download)
const apiV2HttpClient = createHttpClient({
  baseUrl: API_V2_BASE_URL,  // https://yt-extractor.y2mp3.co
  timeout: API_TIMEOUT,
});

// Search V2 HTTP Client (separate domain for YouTube search)
const searchV2HttpClient = createHttpClient({
  baseUrl: SEARCH_V2_BASE_URL,  // https://yt-extractor.y2mp3.co
  timeout: getTimeout('searchV2'),
});

// Queue HTTP Client (separate domain for queue API)
const queueHttpClient = createHttpClient({
  baseUrl: QUEUE_API_BASE_URL,  // https://yt-extractor.y2mp3.co
  timeout: getTimeout('addQueue'),
});

const apiConfig = {
  baseUrl: API_BASE_URL,
  timeout: API_TIMEOUT,
};

const apiV2Config = {
  baseUrl: API_V2_BASE_URL,
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
  createNamespacedKey('y2matepro', 'downloader')
);

// 3. Create Core Services (JWT handling moved to Domain Layer - Verifier)
const coreServices = {
  // Services using Main API (V1)
  search: createSearchService(httpClient, apiConfig),
  media: createMediaService(httpClient, apiConfig),
  conversion: createConversionService(httpClient, apiConfig),
  playlist: createPlaylistService(httpClient, apiConfig),
  decrypt: createDecryptService(httpClient, apiConfig),
  feedback: createFeedbackService(httpClient, apiConfig),
  multifile: createMultifileService(httpClient, apiConfig),
  youtubePublicApi: createYouTubePublicApiService(httpClient, apiConfig),

  // YouTube Download using API V2
  youtubeDownload: createYouTubeDownloadService(apiV2HttpClient, apiV2Config),

  // Search V2 using separate HTTP client (different domain)
  searchV2: createSearchV2Service(searchV2HttpClient, searchV2ApiConfig),

  // Queue API using separate HTTP client (different domain)
  queue: createQueueService(queueHttpClient, queueApiConfig),
};

// 4. Create Verifier (handles JWT extraction and storage)
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
