/**
 * YouTube Preview State Management (NEW FLOW)
 * Manages simple preview data for YouTube videos before extraction
 */

import { setState, getState } from './state-manager';
import type { YouTubePreview } from './types';

// ==========================================
// Setters
// ==========================================

/**
 * Set YouTube preview data
 */
export function setYouTubePreview(preview: YouTubePreview): void {
  setState({ youtubePreview: preview });
}

/**
 * Update YouTube preview loading state
 */
export function setYouTubePreviewLoading(isLoading: boolean): void {
  const state = getState();
  if (state.youtubePreview) {
    setState({
      youtubePreview: {
        ...state.youtubePreview,
        isLoading
      }
    });
  }
}

/**
 * Update YouTube preview title and author (after metadata API returns)
 */
export function updateYouTubePreviewMetadata(title: string, author: string): void {
  const state = getState();
  if (state.youtubePreview) {
    setState({
      youtubePreview: {
        ...state.youtubePreview,
        title,
        author,
        isLoading: false
      }
    });
  }
}

/**
 * Clear YouTube preview data
 */
export function clearYouTubePreview(): void {
  setState({ youtubePreview: null });
}

// ==========================================
// Getters
// ==========================================

/**
 * Get current YouTube preview
 */
export function getYouTubePreview(): YouTubePreview | null {
  return getState().youtubePreview;
}
