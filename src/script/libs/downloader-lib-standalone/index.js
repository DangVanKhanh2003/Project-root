/**
 * Downloader Library - Main Entry Point
 * Clean architecture with layered modules
 */

// API Layer - Backend communication
export { createService, createVerifiedService, createClient } from './api/index.js';

// YouTube Integration
export { createYouTubePublicApiService, extractYouTubeVideoId } from './api/youtube/index.js';

// Transfer Layer - Data transfer mechanisms
export { downloadStreamToRAM } from './transfer/index.js';

// Orchestration Layer - Download flow coordination
export { startSequentialDownload, createMultifileOrchestrator } from './orchestration/index.js';

// UI Components (reusable)
export { ProgressBarManager } from './components/progress-bar.js';

// Utilities
export * as DownloaderUtils from './utils/common.js';
