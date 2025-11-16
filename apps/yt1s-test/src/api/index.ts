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

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.example.com';
const API_TIMEOUT = 30000;

// 1. Create HTTP Client
const httpClient = createHttpClient({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
};

// 2. Create Core Services
const coreServices = {
  search: createSearchService(httpClient, apiConfig),
  media: createMediaService(httpClient, apiConfig),
  conversion: createConversionService(httpClient, apiConfig),
  playlist: createPlaylistService(httpClient, apiConfig),
  decrypt: createDecryptService(httpClient, apiConfig),
  feedback: createFeedbackService(httpClient, apiConfig),
  searchV2: createSearchV2Service(httpClient, apiConfig),
  queue: createQueueService(httpClient, apiConfig),
  youtubeDownload: createYouTubeDownloadService(httpClient, apiConfig),
  multifile: createMultifileService(httpClient, apiConfig),
  youtubePublicApi: createYouTubePublicApiService(httpClient, apiConfig),
};

// 3. Create JWT Store (namespaced to prevent collision)
const jwtStore = new LocalStorageJwtStore(
  createNamespacedKey('yt1s-test', 'downloader')
);

// 4. Create Verifier
const verifier = createVerifier({
  jwtStore,
  policies: DEFAULT_POLICIES,
  verbose: true, // Enable logging in development
});

// 5. Create Verified Services (Main API)
export const api = createVerifiedServices(coreServices, verifier);

// Export for debugging/advanced use
export { coreServices, verifier, jwtStore };
