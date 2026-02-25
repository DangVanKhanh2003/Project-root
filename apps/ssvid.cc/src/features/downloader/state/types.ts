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
import { MultipleDownloadsState } from './multiple-download-types';

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
// Format Selector State Types (NEW FLOW)
// ==========================================
export type FormatType = 'mp3' | 'mp4' | 'webm' | 'mkv';
export type VideoFormatType = 'mp4' | 'webm' | 'mkv';
export type AudioFormatType = 'mp3' | 'wav' | 'm4a' | 'opus' | 'ogg' | 'flac';

export interface QualityPreferences {
  mp3: string;  // e.g., '320kbps'
  mp4: string;  // e.g., '1080p'
}

export interface FormatSelectorState {
  selectedFormat: FormatType;
  selectedQuality: string; // Deprecated - kept for backward compatibility
  qualityPreferences: QualityPreferences;

  // NEW: Separate quality tracking for each format
  videoQuality: string;      // For mp4: '1080p', '720p', '480p', '360p', etc.
  audioFormat: AudioFormatType;  // For mp3 mode: 'mp3', 'wav', 'aac', etc.
  audioBitrate: string;      // For mp3 mode: '320', '256', '192', '128', '64', etc.

  // Track if user has made a selection (for auto-fill logic)
  hasUserSelectedFormat: boolean;
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

export interface DownloadTask {
  status: DownloadTaskStatus;
  message: string | null;
  timestamp: string;
}

export interface DownloadState {
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
// Use lowercase to match TaskState enum from logic/conversion/types.ts
export type ConversionTaskState =
  | 'idle'
  | 'extracting'
  | 'processing'
  | 'polling'
  | 'downloading'
  | 'success'
  | 'failed'
  | 'canceled';

export interface ConversionTask {
  id: string;
  state: ConversionTaskState;
  statusText: string;
  showProgressBar: boolean;
  progress?: number; // 0-100 percentage for progress bar
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
  warningMessage?: string;
  extractResponse?: any;
  audioLanguageChanged?: boolean;
  availableAudioLanguages?: string[];
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
// YouTube Preview State Types (NEW FLOW)
// ==========================================
export interface YouTubePreview {
  videoId: string;
  title: string;
  author: string;
  thumbnail: string;
  url: string;
  isLoading: boolean;
  trimRangeLabel?: string;
}

export interface YouTubePreviewState {
  youtubePreview: YouTubePreview | null;
}

// ==========================================
// Complete Application State
// ==========================================
export interface AppState
  extends CoreUIState,
  FormatSelectorState,
  SuggestionsState,
  SearchResultsState,
  MediaDetailState,
  DownloadState,
  ConversionState,
  MultifileState,
  MultifileReuseState,
  YouTubePreviewState,
  MultipleDownloadsState { }

// ==========================================
// State Manager Types
// ==========================================
export type StateChangeCallback = (currentState: AppState, prevState: AppState) => void;
export type PartialState = Partial<AppState>;
