/**
 * History Item - Represents a single conversion history entry
 */
export interface HistoryItem {
  /** Unique identifier (timestamp-based) */
  id: string;
  /** Original video/content URL */
  url: string;
  /** Video/content title */
  title: string;
  /** Video/content author/channel name */
  author?: string;
  /** Thumbnail URL */
  thumbnail: string;
  /** Output format */
  format: 'mp3' | 'mp4';
  /** Quality setting (e.g., '720p', '128kbps') */
  quality: string;
  /** Audio format for mp3 (e.g., 'mp3', 'wav', 'm4a') */
  audioFormat?: string;
  /** Source platform */
  platform: 'youtube' | 'tiktok' | 'facebook' | 'instagram' | 'twitter' | 'other';
  /** Timestamp when item was created */
  createdAt: number;
}

/**
 * History Storage Data Structure
 */
export interface HistoryData {
  items: HistoryItem[];
  version: number;
}

/**
 * History Display Configuration
 */
export interface HistoryDisplayConfig {
  /** Initial number of items to show */
  initialCount: number;
  /** Number of items to load when clicking "View more" */
  loadMoreCount: number;
  /** Maximum items to store in localStorage */
  maxStorageItems: number;
  /** localStorage key */
  storageKey: string;
}

/**
 * Default configuration
 */
export const DEFAULT_HISTORY_CONFIG: HistoryDisplayConfig = {
  initialCount: 5,
  loadMoreCount: 10,
  maxStorageItems: 100,
  storageKey: 'downloader_history'
};

/**
 * Callback when user clicks on a history item
 */
export type OnHistoryItemClick = (item: HistoryItem) => void;

/**
 * Callback when history is updated
 */
export type OnHistoryUpdate = (items: HistoryItem[]) => void;
