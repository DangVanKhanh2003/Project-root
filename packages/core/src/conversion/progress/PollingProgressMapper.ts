/**
 * Polling Progress Mapper - Phase 3 Architecture
 *
 * Maps polling API data to UI progress with 2-phase architecture:
 * - Processing: 0% → 100% based on real API progress
 * - Merging: 100% constant (UI shows spinner instead of progress bar)
 * - Success: mergedUrl received → show checkmark
 *
 * Extracted from apps/ytmp3-clone-3/src/features/downloader/logic/conversion/
 *
 * Key Changes:
 * - Removed console.log statements (apps can add their own logging)
 * - Uses isAudioFormat from types module
 */

import { isAudioFormat } from '../types';

export class PollingProgressMapper {
  // Phase 3: Processing reaches 100%, then merging spinner
  private static readonly VIDEO_WEIGHT = 0.6;  // 60% weight for video in processing
  private static readonly AUDIO_WEIGHT = 0.4;  // 40% weight for audio in processing

  private static currentPhase: 'processing' | 'merging' = 'processing';
  private static mergingStartTime: number = 0;
  private static lastProgressValue: number = 0;
  private static currentFormat: string = 'mp4'; // Track current format

  /**
   * Map API polling data to UI progress (0-100%)
   *
   * Phase 3 Architecture:
   * - Processing: 0% → 100% based on real API progress
   * - Merging: Return 100% constant (UI shows spinner)
   * - mergedUrl received: Return 100% (ready for success)
   */
  static mapProgress(apiData: {
    videoProgress: number | null;
    audioProgress: number | null;
    status: string;
    mergedUrl?: string | null;
  }): number {
    const { videoProgress, audioProgress, mergedUrl } = apiData;

    // If mergedUrl exists → conversion completed (100%)
    if (mergedUrl) {
      this.lastProgressValue = 100;
      return 100;
    }

    // Default to 0 for null progress values
    const videoProg = videoProgress ?? 0;
    const audioProg = audioProgress ?? 0;

    // Check if should transition to merging phase
    // Condition: Audio-only needs only audioProgress; Video needs both
    const isProcessingComplete = isAudioFormat(this.currentFormat)
      ? audioProg >= 100
      : videoProg >= 100 && audioProg >= 100;

    if (isProcessingComplete && this.currentPhase === 'processing') {
      // Phase 3: Transition: Processing (100%) → Merging (100% + spinner)
      this.currentPhase = 'merging';
      this.mergingStartTime = Date.now();
      this.lastProgressValue = 100;
      return 100;
    }

    if (this.currentPhase === 'merging') {
      // Phase 3: Merging phase - stay at 100% (UI will show spinner)
      this.lastProgressValue = 100;
      return 100;
    }

    // Processing phase - real API progress mapped to 0-100%
    // Phase 3: Full range 0-100% for processing
    let displayProgress: number;

    if (isAudioFormat(this.currentFormat)) {
      // Audio-only: Map audioProgress 0-100 → display 0-100
      displayProgress = audioProg;
    } else {
      // Video: Weighted average of audio (40%) and video (60%)
      displayProgress = (audioProg * this.AUDIO_WEIGHT) + (videoProg * this.VIDEO_WEIGHT);
    }

    this.lastProgressValue = displayProgress;
    return displayProgress;
  }

  /**
   * Get status text for current phase
   *
   * Phase 3: Simple status for processing, merging handled by spinner UI
   */
  static getStatusText(apiData: {
    videoProgress: number | null;
    audioProgress: number | null;
    status: string;
    mergedUrl?: string | null;
  }): string {
    const { mergedUrl } = apiData;

    // Completed
    if (mergedUrl) {
      return 'Ready';
    } else if (this.currentPhase === 'merging') {
      // Phase 3: Merging phase - text will be shown with spinner
      return 'Merging...';
    } else {
      // Processing phase - simple status without detailed progress
      return 'Processing...';
    }
  }

  /**
   * Reset phase state (call when starting new conversion)
   *
   * Phase 3: Simple reset for processing → merging flow
   */
  static reset(format: string = 'mp4', fileSizeMB: number = 200): void {
    this.currentPhase = 'processing';
    this.mergingStartTime = 0;
    this.lastProgressValue = 0;
    this.currentFormat = format;
  }

  /**
   * Get current phase
   */
  static getCurrentPhase(): 'processing' | 'merging' {
    return this.currentPhase;
  }

  /**
   * Get last recorded progress value
   */
  static get lastProgress(): number {
    return this.lastProgressValue;
  }

  /**
   * Manually start merging phase (for testing or manual control)
   *
   * Phase 3: Transition to merging at 100%
   */
  static startMergingPhase(): number {
    this.currentPhase = 'merging';
    this.mergingStartTime = Date.now();
    this.lastProgressValue = 100;
    return 100;
  }
}
