/**
 * History Service Module
 * Business logic for history feature
 */

import type { HistoryItem, OnHistoryUpdate } from './types';
import { addToHistory, getAllHistory } from './history-storage';

/**
 * Detect platform from URL
 */
export function detectPlatform(url: string): HistoryItem['platform'] {
  const lowercaseUrl = url.toLowerCase();

  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) {
    return 'youtube';
  }
  if (lowercaseUrl.includes('tiktok.com')) {
    return 'tiktok';
  }
  if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.watch')) {
    return 'facebook';
  }
  if (lowercaseUrl.includes('instagram.com')) {
    return 'instagram';
  }
  if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) {
    return 'twitter';
  }

  return 'other';
}

/**
 * Format quality string for display
 */
export function formatQualityDisplay(format: 'mp3' | 'mp4', quality: string): string {
  if (format === 'mp3') {
    return quality.includes('kbps') ? quality : `${quality}kbps`;
  }
  return quality.includes('p') ? quality : `${quality}p`;
}

/**
 * Save conversion result to history
 */
export interface SaveToHistoryParams {
  url: string;
  title: string;
  author?: string;
  thumbnail: string;
  format: 'mp3' | 'mp4';
  quality: string;
  audioFormat?: string;
}

let historyUpdateListeners: OnHistoryUpdate[] = [];

/**
 * Subscribe to history updates
 */
export function onHistoryUpdate(callback: OnHistoryUpdate): () => void {
  historyUpdateListeners.push(callback);
  return () => {
    historyUpdateListeners = historyUpdateListeners.filter(cb => cb !== callback);
  };
}

/**
 * Notify all listeners of history update
 */
function notifyHistoryUpdate(): void {
  const items = getAllHistory();
  historyUpdateListeners.forEach(cb => cb(items));
}

/**
 * Save a successful conversion to history
 */
export function saveConversionToHistory(params: SaveToHistoryParams): HistoryItem {
  const platform = detectPlatform(params.url);

  const item = addToHistory({
    url: params.url,
    title: params.title,
    author: params.author,
    thumbnail: params.thumbnail,
    format: params.format,
    quality: params.quality,
    audioFormat: params.audioFormat,
    platform
  });

  notifyHistoryUpdate();

  return item;
}

/**
 * Apply History Item Configuration
 * Apps must provide these handlers to enable click-to-convert functionality
 */
export interface ApplyHistoryHandlers {
  /** Set the URL in the input field */
  setUrl: (url: string) => void;
  /** Set the format (mp3/mp4) */
  setFormat: (format: 'mp3' | 'mp4') => void;
  /** Set video quality (for mp4) */
  setVideoQuality: (quality: string) => void;
  /** Set audio bitrate (for mp3) */
  setAudioBitrate: (bitrate: string) => void;
  /** Set audio format (for mp3) */
  setAudioFormat?: (format: string) => void;
  /** Trigger the conversion */
  triggerConvert: () => void;
  /** Optional: Scroll to converter section */
  scrollToConverter?: () => void;
}

let applyHandlers: ApplyHistoryHandlers | null = null;

/**
 * Register handlers for applying history items
 * Must be called by the app during initialization
 */
export function registerApplyHandlers(handlers: ApplyHistoryHandlers): void {
  applyHandlers = handlers;
}

/**
 * Apply a history item - fills form and triggers conversion
 */
export function applyHistoryItem(item: HistoryItem): boolean {
  if (!applyHandlers) {
    console.error('[History] Apply handlers not registered. Call registerApplyHandlers() first.');
    return false;
  }

  try {
    // Scroll to converter if handler provided
    applyHandlers.scrollToConverter?.();

    // Set format first
    applyHandlers.setFormat(item.format);

    // Set quality based on format
    if (item.format === 'mp4') {
      // Extract quality number (e.g., "720p" -> "720p" or "720" -> "720p")
      const quality = item.quality.includes('p') ? item.quality : `${item.quality}p`;
      applyHandlers.setVideoQuality(quality);
    } else {
      // Extract bitrate number (e.g., "128kbps" -> "128" or "128" -> "128")
      const bitrate = item.quality.replace('kbps', '');
      applyHandlers.setAudioBitrate(bitrate);

      // Set audio format if available
      if (item.audioFormat && applyHandlers.setAudioFormat) {
        applyHandlers.setAudioFormat(item.audioFormat);
      }
    }

    // Set URL
    applyHandlers.setUrl(item.url);

    // Small delay to ensure state updates, then trigger convert
    setTimeout(() => {
      applyHandlers!.triggerConvert();
    }, 100);

    return true;
  } catch (e) {
    console.error('[History] Failed to apply history item:', e);
    return false;
  }
}

/**
 * Get relative time string (e.g., "2 hours ago")
 */
export function getRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return days === 1 ? '1 day ago' : `${days} days ago`;
  }
  if (hours > 0) {
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (minutes > 0) {
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }
  return 'Just now';
}
