import * as utils from './utils.js';

// Core service for Backend API interaction
export { createService } from './service.js';
export { createVerifiedService } from './verifier.js';

// YouTube Public API (oEmbed)
export { createYouTubePublicApiService } from './youtube-public-api.js';

// HTTP client (if needed separately)
export { createClient } from './httpClient.js';

// Normalizers
export { normalizeStreamResponse, normalizeYouTubeOembed } from './normalizers.js';

// Export all utility functions for convenience
export const DownloaderUtils = utils;
