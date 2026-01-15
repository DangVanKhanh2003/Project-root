/**
 * Multifile Reuse State Functions
 * Manages URL selection tracking and download reuse logic
 */

import type { RecentDownload, ReuseStatus } from './types';
import { getState, setState } from './state-manager';

// ==========================================
// Utility Functions
// ==========================================

/**
 * Validate URL array
 * @param urls - Array to validate
 * @param context - Context for error messages
 */
function validateUrlArray(urls: any, context: string): void {
  if (!Array.isArray(urls)) {
    throw new Error(`${context}: Expected array, got ${typeof urls}`);
  }

  if (urls.some(url => typeof url !== 'string' || !url.trim())) {
    throw new Error(`${context}: Array contains invalid URLs`);
  }
}

/**
 * Check if arrays have same elements (order-independent)
 * @param arr1 - First array
 * @param arr2 - Second array
 * @returns True if arrays contain same elements
 */
function arraysHaveSameElements(arr1: readonly string[], arr2: readonly string[]): boolean {
  if (arr1.length !== arr2.length) return false;

  const sorted1 = [...arr1].sort();
  const sorted2 = [...arr2].sort();

  return sorted1.every((val, idx) => val === sorted2[idx]);
}

/**
 * Check if recent download can be reused
 * @param currentUrls - Currently selected URLs
 * @param recentDownload - Recent download data
 * @returns Reuse status
 */
function canReuseDownload(
  currentUrls: readonly string[],
  recentDownload: RecentDownload | null
): Omit<ReuseStatus, 'currentUrls' | 'recentDownload' | 'hasCurrentSelection' | 'hasRecentDownload'> {
  // No recent download
  if (!recentDownload) {
    return {
      canReuse: false,
      reason: 'No recent download available'
    };
  }

  // Check expiration
  const isExpired = Date.now() >= recentDownload.expireTime;
  if (isExpired) {
    return {
      canReuse: false,
      reason: 'Recent download has expired',
      isExpired: true
    };
  }

  // No current selection
  if (!currentUrls || currentUrls.length === 0) {
    return {
      canReuse: false,
      reason: 'No current URL selection'
    };
  }

  // Check if URLs match
  const urlsMatch = arraysHaveSameElements(currentUrls, recentDownload.listUrl);

  if (!urlsMatch) {
    return {
      canReuse: false,
      reason: 'URL selection has changed'
    };
  }

  // All conditions met
  return {
    canReuse: true,
    reason: 'Can reuse recent download'
  };
}

// ==========================================
// State Management Functions
// ==========================================

/**
 * Update currently selected URLs
 * @param urls - Array of encrypted URLs
 */
export function updateCurrentSelection(urls: string[]): void {
  try {
    // Validate input
    validateUrlArray(urls, 'updateCurrentSelection');

    // Immutable state update
    setState({
      listCurrentUrl: Object.freeze([...urls]) as readonly string[] // Immutable copy
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Save recent download data after successful completion
 * @param listUrl - URLs that were downloaded
 * @param downloadUrl - ZIP download URL
 * @param expireTime - When the download link expires
 */
export function saveRecentDownload(listUrl: string[], downloadUrl: string, expireTime: number): void {
  try {
    // Validate inputs
    validateUrlArray(listUrl, 'saveRecentDownload.listUrl');

    if (typeof downloadUrl !== 'string' || !downloadUrl.trim()) {
      throw new Error('saveRecentDownload: Invalid download URL');
    }

    if (typeof expireTime !== 'number' || expireTime <= Date.now()) {
      throw new Error('saveRecentDownload: Invalid expire time');
    }

    // Immutable state update
    setState({
      recentDownload: Object.freeze({
        listUrl: Object.freeze([...listUrl]) as readonly string[],
        url: downloadUrl,
        expireTime: expireTime
      }) as RecentDownload
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Clear recent download data
 */
export function clearRecentDownload(): void {
  setState({
    recentDownload: null
  });
}

/**
 * Get comparison data for reuse decision
 * @returns Comparison data and reuse status
 */
export function getRecentDownloadStatus(): ReuseStatus {
  const state = getState();
  const { listCurrentUrl, recentDownload } = state;

  const status = canReuseDownload(listCurrentUrl, recentDownload);

  return {
    ...status,
    currentUrls: listCurrentUrl,
    recentDownload: recentDownload,
    hasCurrentSelection: Array.isArray(listCurrentUrl) && listCurrentUrl.length > 0,
    hasRecentDownload: Boolean(recentDownload?.url)
  };
}
