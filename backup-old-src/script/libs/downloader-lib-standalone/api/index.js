/**
 * API Layer - Backend Communication
 * Exports all API-related services and utilities
 */

// Core service for Backend API interaction
export { createService } from './service.js';
export { createVerifiedService } from './verifier.js';

// HTTP client (if needed separately)
export { createClient } from './client.js';

// Normalizers
export { normalizeStreamResponse, normalizeYouTubeOembed } from './normalizers.js';

// API endpoints constants
export { API_ENDPOINTS, MULTIFILE_ENDPOINTS, SEARCH_V2_CONFIG, QUEUE_ENDPOINTS } from './endpoints.js';

// YouTube API integration
export { createYouTubePublicApiService, extractYouTubeVideoId } from './youtube/index.js';
