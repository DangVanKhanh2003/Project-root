/**
 * Downloader State - Public API
 * Central export point for all state modules
 */

// ==========================================
// Core State Management
// ==========================================
export {
  getState,
  setState,
  setRenderCallback,
  resetState,
  getInitialState
} from './state-manager';

// ==========================================
// Types
// ==========================================
export type {
  AppState,
  StateChangeCallback,
  PartialState,
  InputType,
  CoreUIState,
  SuggestionsState,
  SearchResultsState,
  SearchPagination,
  ViewingItem,
  MediaDetailState,
  VideoDetail,
  VideoMeta,
  GalleryDetail,
  GalleryMeta,
  GalleryItem,
  DetailType,
  DownloadState,
  DownloadTask,
  DownloadTaskStatus,
  DownloadCounts,
  ActiveTab,
  ConversionState,
  ConversionTask,
  ConversionTaskState,
  ConversionStatus,
  ActiveConversion,
  MultifileState,
  MultifileSession,
  MultifileSessionState,
  MultifileProgress,
  MultifileReuseState,
  RecentDownload,
  ReuseStatus
} from './types';

// ==========================================
// Core State Functions
// ==========================================
export * from './core-state';
export * from './suggestions-state';
export * from './search-results-state';
export * from './media-detail-state';
export * from './download-state';
export * from './conversion-state';
export * from './multifile-state';
export * from './multifile-reuse-state';
