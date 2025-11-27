/**
 * PollingStrategy - Case 3 & 4: Polling-based Download
 *
 * iOS large streams + Windows MP4: Server-side processing với polling.
 *
 * Progress 4 Layers:
 * - Layer 1: 0→5% (200ms) - Initial animation, instant feedback
 * - Layer 2: 5→10% - no_download handling, +1%/poll
 * - Layer 3: 10→95% - Real progress từ API
 * - Layer 4: →100% - Final animation khi có mergedUrl
 */

import { BaseStrategy } from './BaseStrategy';
import type { StrategyContext, StrategyResult } from './IConversionStrategy';
import {
  TaskState,
  createApiProgressData,
  calculateDisplayProgress,
  isAudioFormat
} from '../../types';

// Direct imports
import { getPollingManager } from '../../../concurrent-polling';

// Debug logger
const LOG_PREFIX = '[PollingStrategy]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

// Constants
const INITIAL_ANIMATION_TARGET = 5;
const INITIAL_ANIMATION_DURATION = 200; // ms
const NO_DOWNLOAD_MAX = 10;
const MERGING_START_PERCENT = 95;
const MP3_MERGING_DURATION = 60000; // 60s estimate for MP3 merging

export class PollingStrategy extends BaseStrategy {
  private resolvePromise: ((result: StrategyResult) => void) | null = null;
  private lastPercent: number = 0;
  private format: string;
  private isAudio: boolean;
  private isMergingPhase: boolean = false;
  private mergingIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(context: StrategyContext) {
    super(context);
    this.format = context.formatData.format || context.formatData.type || 'mp4';
    this.isAudio = isAudioFormat(this.format);
  }

  getName(): string {
    return 'PollingStrategy';
  }

  async execute(): Promise<StrategyResult> {
    log('=== EXECUTE START ===');
    log('formatId:', this.ctx.formatId);
    log('format:', this.format);
    log('isAudio:', this.isAudio);
    log('extractResult:', JSON.stringify(this.ctx.extractResult, null, 2));

    if (this.checkAborted()) {
      log('Already aborted, returning cancelled');
      return this.cancelledResult();
    }

    const { progressUrl } = this.ctx.extractResult;
    log('progressUrl:', progressUrl);

    if (!progressUrl) {
      const error = 'No progressUrl - polling not supported';
      log('ERROR:', error);
      this.markFailed(error);
      this.getModal().transitionToError(error);
      return this.failureResult(error);
    }

    // Update state
    log('Updating task state to POLLING');
    this.updateTask({
      state: TaskState.POLLING,
      showProgressBar: true
    });

    // Start polling IMMEDIATELY (don't wait for animation)
    log('Starting polling with progressUrl:', progressUrl);

    // Layer 1: Initial animation 0→5% (runs in parallel with polling)
    log('Layer 1: Playing initial animation 0→5% (parallel)');
    this.playInitialAnimation(); // Don't await - run in parallel

    return new Promise<StrategyResult>((resolve) => {
      this.resolvePromise = resolve;

      getPollingManager().startPolling(this.ctx.formatId, {
        progressUrl,
        onProgressUpdate: (data) => this.handleProgress(data),
        onStatusUpdate: (result) => {
          log('onStatusUpdate:', JSON.stringify(result));
          if (result.mergedUrl) {
            this.handleComplete(result.mergedUrl);
          }
        }
      });
    });
  }

  cancel(): void {
    super.cancel();
    this.stopMergingAnimation();
    getPollingManager().stopPolling(this.ctx.formatId);

    if (this.resolvePromise) {
      this.resolvePromise(this.cancelledResult());
      this.resolvePromise = null;
    }
  }

  /**
   * Layer 1: Initial animation 0→5% trong 200ms
   * Provides instant feedback to user
   */
  private async playInitialAnimation(): Promise<void> {
    const stepDelay = INITIAL_ANIMATION_DURATION / INITIAL_ANIMATION_TARGET;

    for (let i = 1; i <= INITIAL_ANIMATION_TARGET; i++) {
      if (this.checkAborted()) return;
      this.updateProgress(i, 'Converting...');
      await this.delay(stepDelay);
    }
    this.lastPercent = INITIAL_ANIMATION_TARGET;
  }

  /**
   * Handle progress updates from polling
   */
  private handleProgress(rawData: { videoProgress: number; audioProgress: number; status: string; mergedUrl?: string }): void {
    log('handleProgress:', JSON.stringify(rawData));

    if (this.checkAborted()) {
      log('Aborted in handleProgress');
      return;
    }

    // Layer 2: no_download handling - server chưa sẵn sàng
    if (rawData.status === 'no_download') {
      log('Layer 2: no_download status');
      this.handleNoDownload();
      return;
    }

    // Check if entering merging phase (both video and audio at 100%)
    const isProcessingComplete = rawData.videoProgress >= 100 && rawData.audioProgress >= 100;
    if (isProcessingComplete && !rawData.mergedUrl && !this.isMergingPhase) {
      log('Entering merging phase');
      this.startMergingPhase();
      return;
    }

    // If already in merging phase, let it continue until mergedUrl arrives
    if (this.isMergingPhase && !rawData.mergedUrl) {
      log('In merging phase, waiting for mergedUrl');
      return;
    }

    // Layer 3: Real progress từ API
    log('Layer 3: Real progress from API');
    const apiData = createApiProgressData({
      videoProgress: rawData.videoProgress,
      audioProgress: rawData.audioProgress,
      status: rawData.status,
      mergedUrl: rawData.mergedUrl ?? null
    });

    const display = calculateDisplayProgress(apiData, this.format, this.lastPercent);
    log('Calculated display:', display, 'lastPercent:', this.lastPercent);

    // Never backwards rule
    if (display.percent > this.lastPercent) {
      this.lastPercent = display.percent;
      // Note: Progress bar manager appends "X%" automatically
      this.updateProgress(display.percent, 'Converting...');
      log('Updated progress to:', display.percent);
    }

    // Check completion
    if (apiData.mergedUrl) {
      log('mergedUrl received:', apiData.mergedUrl);
      this.handleComplete(apiData.mergedUrl);
    }
  }

  /**
   * Layer 2: no_download handling
   * Tăng 1% mỗi poll khi server chưa bắt đầu (5→10%)
   */
  private handleNoDownload(): void {
    if (this.lastPercent < NO_DOWNLOAD_MAX) {
      this.lastPercent = Math.min(this.lastPercent + 1, NO_DOWNLOAD_MAX);
      this.updateProgress(this.lastPercent, 'Converting...');
    }
  }

  /**
   * Start MP3 merging phase with time-based progress
   * MP3 encoding is slow (60-150s), so we fake progress
   */
  private startMergingPhase(): void {
    this.isMergingPhase = true;

    // For MP4, merging is instant - just set to 95% and wait
    if (!this.isAudio) {
      this.lastPercent = MERGING_START_PERCENT;
      this.updateProgress(MERGING_START_PERCENT, 'Converting...');
      return;
    }

    // For MP3, animate progress over estimated time
    const startPercent = Math.max(this.lastPercent, 60);
    const targetPercent = MERGING_START_PERCENT;
    const range = targetPercent - startPercent;
    const steps = range;
    const stepInterval = MP3_MERGING_DURATION / steps;

    let currentStep = 0;
    this.mergingIntervalId = setInterval(() => {
      if (this.checkAborted() || currentStep >= steps) {
        this.stopMergingAnimation();
        return;
      }

      currentStep++;
      const newPercent = startPercent + currentStep;
      if (newPercent > this.lastPercent) {
        this.lastPercent = newPercent;
        this.updateProgress(newPercent, 'Converting...');
      }
    }, stepInterval);
  }

  /**
   * Stop merging animation
   */
  private stopMergingAnimation(): void {
    if (this.mergingIntervalId) {
      clearInterval(this.mergingIntervalId);
      this.mergingIntervalId = null;
    }
  }

  /**
   * Layer 4: Complete - animate to 100%
   */
  private handleComplete(mergedUrl: string): void {
    log('=== HANDLE COMPLETE ===');
    log('mergedUrl:', mergedUrl);

    if (this.checkAborted()) {
      log('Aborted in handleComplete');
      return;
    }

    this.stopMergingAnimation();
    getPollingManager().stopPolling(this.ctx.formatId);

    // Final animation to 100%
    log('Setting progress to 100%');
    this.updateProgress(100, 'Converting...');

    // Mark success
    log('Marking success in state');
    this.markSuccess(mergedUrl);

    // Show download button
    log('Showing download button');
    this.getModal().showDownloadButton(mergedUrl);

    if (this.resolvePromise) {
      log('Resolving promise with success');
      this.resolvePromise(this.successResult(mergedUrl));
      this.resolvePromise = null;
    }
  }

  /**
   * Update progress UI (both circular and text)
   */
  private updateProgress(percent: number, statusText: string): void {
    // Use new unified progress update method (updates both circular + text)
    this.getModal().updateConversionProgress(percent, statusText);
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
