/**
 * V3 Conversion Types
 * Simplified types for V3 API flow
 */

import type { TaskState } from '../types';
import type { ExtractedMediaInfo } from './extract-media-info';

// Re-export TaskState for V3 consumers
export { TaskState } from '../types';

/**
 * V3 Conversion Task
 */
export interface V3ConversionTask {
  /** Job ID from API */
  jobId: string;

  /** Format ID for UI state management */
  formatId: string;

  /** Current task state */
  state: TaskState;

  /** Progress 0-100 */
  progress: number;

  /** Download URL (when completed) */
  downloadUrl: string | null;

  /** Filename for download */
  filename: string | null;

  /** Error message (when failed) */
  error: string | null;

  /** Video title */
  title: string;

  /** Video duration in seconds */
  duration: number;

  /** Abort controller for cancellation */
  abortController: AbortController;

  /** Timestamp when task started */
  startedAt: number;

  /** Timestamp when task completed */
  completedAt: number | null;
}

/**
 * Conversion params from UI
 */
export interface V3ConversionParams {
  formatId: string;
  videoUrl: string;
  videoTitle: string;
  maxJobAttempts?: number; // Total attempts (initial + retries)
  onExtracted?: (info: ExtractedMediaInfo) => void;
  extractV2Options: {
    downloadMode?: 'video' | 'audio';
    videoQuality?: string;
    youtubeVideoContainer?: string;
    audioBitrate?: string;
    audioFormat?: string;
    trackId?: string;
    trimStart?: number;
    trimEnd?: number;
  };
}
