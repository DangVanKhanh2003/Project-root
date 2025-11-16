/**
 * State Type Definitions
 * Central type definitions for all state modules
 */

// Import types from @downloader/core where applicable
import type {
  MediaDto,
  FormatDto,
  SearchV2ItemDto
} from '@downloader/core';

// ==========================================
// Core UI State Types
// ==========================================
export type InputType = 'url' | 'keyword';

export interface CoreUIState {
  inputType: InputType;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  showPasteButton: boolean;
  showClearButton: boolean;
}

// ==========================================
// Suggestions State Types
// ==========================================
export interface SuggestionsState {
  suggestions: string[];
  showSuggestions: boolean;
  isLoadingSuggestions: boolean;
  query: string;
  originalQuery: string;
  highlightedIndex: number;
}

// ==========================================
// Search Results State Types
// ==========================================
export interface SearchPagination {
  nextPageToken: string | null;
  hasNextPage: boolean;
  isLoadingMore: boolean;
  loadMoreCount: number;
}

export interface ViewingItem {
  id: string;
  title: string;
}

export interface SearchResultsState {
  results: SearchV2ItemDto[];
  resultsLoading: boolean;
  viewingItem: ViewingItem | null;
  searchPagination: SearchPagination;
  isFromListItemClick: boolean;
}

// ==========================================
// Media Detail State Types
// ==========================================
export interface VideoMeta {
  title: string;
  originalUrl: string;
  status: string;
  author?: string;
  thumbnail?: string;
  duration?: string | number;
  url?: string;
  vid?: string;
  source?: string;
  isFakeData?: boolean;
  completedAt?: number;
}

export interface VideoDetail {
  meta: VideoMeta;
  formats?: {
    video?: FormatDto[];
    audio?: FormatDto[];
  };
  completedAt: number; // Timestamp for expiration tracking
}

export interface GalleryMeta {
  title: string;
  author?: string;
}

export interface GalleryItem {
  id: string;
  type: string;
  thumb?: string;
  formats: any[];
}

export interface GalleryDetail {
  meta: GalleryMeta;
  gallery: GalleryItem[];
  completedAt: number;
}

export type DetailType = 'video' | 'gallery' | null;

export interface MediaDetailState {
  videoDetail: VideoDetail | null;
  galleryDetail: GalleryDetail | null;
}

// ==========================================
// Download State Types
// ==========================================
export type DownloadTaskStatus = 'idle' | 'loading' | 'downloaded' | 'error';
export type ActiveTab = 'video' | 'audio';

export interface DownloadTask {
  status: DownloadTaskStatus;
  message: string | null;
  timestamp: string;
}

export interface DownloadState {
  activeTab: ActiveTab;
  downloadTasks: Record<string, DownloadTask>; // formatId -> task
}

export interface DownloadCounts {
  idle: number;
  loading: number;
  downloaded: number;
  error: number;
}

// ==========================================
// Conversion State Types
// ==========================================
export type ConversionTaskState =
  | 'Idle'
  | 'Converting'
  | 'Success'
  | 'Failed'
  | 'Canceled'
  | 'Extracting'
  | 'Processing'
  | 'Polling';

export interface ConversionTask {
  id: string;
  state: ConversionTaskState;
  statusText: string;
  showProgressBar: boolean;
  downloadUrl: string | null;
  error: string | null;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  abortController: AbortController;
  // Additional task-specific data
  videoTitle?: string;
  format?: string;
  quality?: string;
  vid?: string;
  key?: string;
  encryptedUrl?: string;
  formatData?: any;
  autoDownloadOnComplete?: boolean;
  // Extended properties for advanced workflows
  sourceId?: string;
  ramBlob?: Blob;
  filename?: string;
  pollingPhase?: string;
  pollingData?: any;
  streamMetadata?: any;
}

export interface ActiveConversion {
  isConverting: boolean;
  error: string | null;
  downloadUrl: string | null;
  progress: number;
  statusText: string;
  videoTitle: string;
  format: string;
  quality: string;
  vid: string;
  key: string;
  encryptedUrl: string;
}

export interface ConversionState {
  conversionTasks: Record<string, ConversionTask>; // formatId -> task
  activeConversion: ActiveConversion | null; // Legacy single conversion
}

export interface ConversionStatus {
  total: number;
  idle: number;
  converting: number;
  success: number;
  failed: number;
  canceled: number;
}

// ==========================================
// Multifile State Types
// ==========================================
export type MultifileSessionState =
  | 'IDLE'
  | 'PREPARING'
  | 'CONVERTING'
  | 'ZIPPING'
  | 'READY'
  | 'EXPIRED'
  | 'ERROR';

export interface MultifileProgress {
  decrypt: number;
  download: number;
  zip: number;
  overall: number;
}

export interface MultifileSession {
  sessionId: string;
  streamUrl: string;
  expiresAt: number;
  downloadUrl?: string;
  expireTime?: number;
  state: MultifileSessionState;
  progress: MultifileProgress;
  error?: string;
}

export interface MultifileState {
  multifileSession: MultifileSession | null;
}

// ==========================================
// Multifile Reuse State Types
// ==========================================
export interface RecentDownload {
  listUrl: readonly string[];
  url: string;
  expireTime: number;
}

export interface MultifileReuseState {
  listCurrentUrl: readonly string[];
  recentDownload: RecentDownload | null;
}

export interface ReuseStatus {
  canReuse: boolean;
  reason: string;
  isExpired?: boolean;
  currentUrls: readonly string[];
  recentDownload: RecentDownload | null;
  hasCurrentSelection: boolean;
  hasRecentDownload: boolean;
}

// ==========================================
// Complete Application State
// ==========================================
export interface AppState
  extends CoreUIState,
          SuggestionsState,
          SearchResultsState,
          MediaDetailState,
          DownloadState,
          ConversionState,
          MultifileState,
          MultifileReuseState {}

// ==========================================
// State Manager Types
// ==========================================
export type StateChangeCallback = (currentState: AppState, prevState: AppState) => void;
export type PartialState = Partial<AppState>;
