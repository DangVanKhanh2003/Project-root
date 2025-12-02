/**
 * PollingStrategy - Case 3 & 4: Polling-based Download
 *
 * iOS large streams + Windows MP4: Server-side processing với polling.
 * Uses PollingProgressMapper for sophisticated progress calculation.
 */

import { BaseStrategy } from './BaseStrategy';
import type { StrategyContext, StrategyResult } from './IConversionStrategy';
import {
  TaskState,
  createApiProgressData,
  isAudioFormat
} from '../../types';
import { PollingProgressMapper } from '../../polling-progress-mapper';

// Direct imports
import { getPollingManager } from '../../../concurrent-polling';

// Debug logger
const LOG_PREFIX = '[PollingStrategy]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

// Constants
const INITIAL_ANIMATION_TARGET = 5;
const INITIAL_ANIMATION_DURATION = 200; // ms
const NO_DOWNLOAD_MAX = 10;

export class PollingStrategy extends BaseStrategy {
  private resolvePromise: ((result: StrategyResult) => void) | null = null;
  private lastPercent: number = 0;
  private format: string;
  private isAudio: boolean;

  constructor(context: StrategyContext) {
    super(context);
    this.format = context.formatData.format || context.formatData.type || 'mp4';
    this.isAudio = isAudioFormat(this.format);

    // Initialize PollingProgressMapper with format and size
    const sizeMB = context.extractResult.size ? Math.round(context.extractResult.size / (1024 * 1024)) : 200;
    PollingProgressMapper.reset(this.format, sizeMB);
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

    // Layer 3: Real progress từ API (using PollingProgressMapper)
    log('Layer 3: Real progress from API using PollingProgressMapper');
    const apiData = createApiProgressData({
      videoProgress: rawData.videoProgress,
      audioProgress: rawData.audioProgress,
      status: rawData.status,
      mergedUrl: rawData.mergedUrl ?? null
    });

    // Debug logging to understand the issue
    log('Raw API data:', {
      videoProgress: rawData.videoProgress,
      audioProgress: rawData.audioProgress,
      status: rawData.status,
      mergedUrl: rawData.mergedUrl
    });

    // Use PollingProgressMapper for sophisticated progress calculation
    const displayProgress = PollingProgressMapper.mapProgress(apiData);
    const statusText = PollingProgressMapper.getStatusText(apiData);

    log('PollingProgressMapper result:', {
      displayProgress,
      statusText,
      lastPercent: this.lastPercent,
      format: this.format,
      isAudio: this.isAudio,
      currentPhase: PollingProgressMapper.getCurrentPhase()
    });

    // Never backwards rule
    if (displayProgress > this.lastPercent) {
      this.lastPercent = displayProgress;
      // Note: Progress bar manager appends "X%" automatically
      this.updateProgress(displayProgress, statusText);
      log('Updated progress to:', displayProgress, 'with status:', statusText);
    } else if (displayProgress < this.lastPercent) {
      log('WARNING: Progress went backwards!', {
        previous: this.lastPercent,
        current: displayProgress,
        rawData: apiData
      });
    } else {
      log('Progress unchanged at:', displayProgress);
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
   * Layer 4: Complete - animate to 100%
   */
  private async handleComplete(mergedUrl: string): Promise<void> {
    log('=== HANDLE COMPLETE ===');
    log('mergedUrl:', mergedUrl);
    log('timestamp:', performance.now().toFixed(2) + 'ms');

    if (this.checkAborted()) {
      log('Aborted in handleComplete');
      return;
    }

    getPollingManager().stopPolling(this.ctx.formatId);

    // Final animation to 100%
    log('⚠️ FORCE: Setting progress to 100% at timestamp:', performance.now().toFixed(2) + 'ms');
    this.updateProgress(100, 'Ready');

    // Wait for 100% to paint (double RAF + 150ms delay for CSS transition)
    // CSS transition for final 100% is 50ms (0.05s with .completing-final class)
    log('⚠️ WAIT: Starting double RAF + 150ms delay to ensure CSS transition completes');
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        log('⚠️ RAF #1 callback at timestamp:', performance.now().toFixed(2) + 'ms');
        requestAnimationFrame(() => {
          log('⚠️ RAF #2 callback at timestamp:', performance.now().toFixed(2) + 'ms');
          // Add 150ms delay to ensure CSS transition completes (50ms transition + safety buffer)
          setTimeout(() => {
            log('⚠️ Delay 150ms complete at timestamp:', performance.now().toFixed(2) + 'ms');
            log('✅ 100% ANIMATION COMPLETE - safe to show success now');
            resolve();
          }, 150);
        });
      });
    });

    if (this.checkAborted()) {
      log('Aborted during RAF wait');
      return;
    }

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
