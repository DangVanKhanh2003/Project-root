/**
 * Media Detail State Functions
 * Manages video and gallery detail data, including format updates
 */

import type { VideoDetail, GalleryDetail, DetailType, VideoMeta, ActiveTab } from './types';
import { getState, setState } from './state-manager';

/**
 * Get default active tab based on current page
 * - Pages with "mp3" or "audio" in pathname → 'audio' tab
 * - All other pages → 'video' tab
 */
function getDefaultActiveTab(): ActiveTab {
  const pathname = window.location.pathname.toLowerCase();

  // Check if current page is audio-focused (mp3, audio converter pages)
  if (pathname.includes('mp3') || pathname.includes('audio')) {
    return 'audio';
  }

  return 'video';
}

/**
 * Set video detail data (single media content)
 * @param data - Video detail data from API
 */
export function setVideoDetail(data: Omit<VideoDetail, 'completedAt'>): void {
  // Add completedAt timestamp for expiration tracking
  const videoDetailWithTimestamp: VideoDetail = {
    ...data,
    completedAt: Date.now() // Track when API extract completed
  };

  setState({
    videoDetail: videoDetailWithTimestamp,
    galleryDetail: null, // Ensure mutual exclusion
    results: [], // Clear search results when viewing detail
    viewingItem: null, // Clear any viewing item
    activeTab: getDefaultActiveTab(), // Set tab based on current page (mp3 → audio, mp4 → video)
    downloadTasks: {} // Clear download states
  });
}

/**
 * Set gallery detail data (multiple media content)
 * @param data - Gallery detail data from API
 */
export function setGalleryDetail(data: Omit<GalleryDetail, 'completedAt'>): void {
  // Add completedAt timestamp for expiration tracking
  const galleryDetailWithTimestamp: GalleryDetail = {
    ...data,
    completedAt: Date.now() // Track when API extract completed
  };

  setState({
    galleryDetail: galleryDetailWithTimestamp,
    videoDetail: null, // Ensure mutual exclusion
    results: [], // Clear search results when viewing detail
    viewingItem: null // Clear any viewing item
  });
}

/**
 * Clear detail states (back to main view)
 */
export function clearDetailStates(): void {
  setState({
    videoDetail: null,
    galleryDetail: null,
    viewingItem: null
  });
}

/**
 * Update video detail metadata progressively (for background oEmbed updates)
 * Only updates metadata fields, preserves formats and other data
 * @param metadataUpdate - New metadata fields to update
 */
export function updateVideoDetailMetadata(metadataUpdate: Partial<VideoMeta>): void {
  const currentState = getState();

  if (!currentState.videoDetail) {
    return;
  }

  // Create updated video detail with new metadata
  const updatedVideoDetail: VideoDetail = {
    ...currentState.videoDetail,
    meta: {
      ...currentState.videoDetail.meta,
      ...metadataUpdate,
      isFakeData: false // Mark as real data after update
    }
  };

  setState({
    videoDetail: updatedVideoDetail
  });
}

/**
 * Update a specific format in videoDetail after conversion/extraction
 * Adds download URL to format so subsequent clicks don't need API calls
 * @param formatId - Format identifier (e.g., "video|720p|mp4")
 * @param formatUpdate - Fields to update (url, size, etc.)
 */
export function updateVideoDetailFormat(formatId: string, formatUpdate: any): void {
  const currentState = getState();

  if (!currentState.videoDetail || !currentState.videoDetail.formats) {
    return;
  }

  // Parse formatId to get category
  const parts = formatId.split('|');
  if (parts.length < 2) {
    return;
  }

  const category = parts[0] as 'video' | 'audio'; // 'video' or 'audio'
  const formatArray = currentState.videoDetail.formats[category];

  if (!Array.isArray(formatArray)) {
    return;
  }

  // Find and update the specific format
  const updatedFormats = formatArray.map(format => {
    // Match by comparing relevant fields (quality, format type, etc.)
    // Since fake formats might not have exact match
    const matchesQuality = formatUpdate.quality ? format.quality === formatUpdate.quality : true;
    const matchesFormat = formatUpdate.format ? format.format === formatUpdate.format : true;

    // If this format matches the update criteria, merge the update
    if (matchesQuality && matchesFormat) {
      return {
        ...format,
        ...formatUpdate
      };
    }
    return format;
  });

  // Create updated video detail with modified formats
  const updatedVideoDetail: VideoDetail = {
    ...currentState.videoDetail,
    formats: {
      ...currentState.videoDetail.formats,
      [category]: updatedFormats
    }
  };

  setState({
    videoDetail: updatedVideoDetail
  });
}

/**
 * Clear URL cache for a specific format in videoDetail
 * Used when modal closes for social media formats
 * @param formatId - Format identifier (e.g., "video|720p|mp4")
 */
export function clearVideoDetailFormat(formatId: string): void {
  const currentState = getState();

  if (!currentState.videoDetail || !currentState.videoDetail.formats) {
    return;
  }

  // Parse formatId to get category
  const parts = formatId.split('|');
  if (parts.length < 2) {
    return;
  }

  const category = parts[0] as 'video' | 'audio';
  const formatArray = currentState.videoDetail.formats[category];

  if (!Array.isArray(formatArray)) {
    return;
  }

  // Clear url and related fields from matching format
  const updatedFormats = formatArray.map(format => {
    const quality = parts[1];
    const formatType = parts[2];

    if (format.quality === quality && format.format === formatType) {
      return {
        ...format,
        url: null,
        completedAt: undefined,
        updatedAt: undefined
      };
    }
    return format;
  });

  const updatedVideoDetail: VideoDetail = {
    ...currentState.videoDetail,
    formats: {
      ...currentState.videoDetail.formats,
      [category]: updatedFormats
    }
  };

  setState({
    videoDetail: updatedVideoDetail
  });
}

/**
 * Get current detail type
 * @returns 'video', 'gallery', or null
 */
export function getCurrentDetailType(): DetailType {
  const state = getState();
  if (state.galleryDetail) return 'gallery';
  if (state.videoDetail) return 'video';
  return null;
}
