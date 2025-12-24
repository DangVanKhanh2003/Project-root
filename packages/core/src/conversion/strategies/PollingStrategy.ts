/**
 * PollingStrategy - Case 3 & 4: Polling-based Download
 *
 * iOS large streams + Windows MP4: Server-side processing with polling.
 * Uses PollingProgressMapper for sophisticated progress calculation.
 * Extracted from apps/ytmp3-clone-3/src/features/downloader/logic/conversion/
 *
 * Key Changes:
 * - Receives IStateUpdater and IPollingManager via constructor (DI pattern)
 * - Removed console.log statements (apps can add their own logging)
 * - Uses PollingProgressMapper from progress module
 */

import { BaseStrategy } from './BaseStrategy';
import type { IStateUpdater } from '../state-interface/IStateUpdater';
import type { IConversionStrategy, StrategyContext, StrategyResult } from './IConversionStrategy';
import type { IPollingManager } from '../polling/IPollingManager';
import {
  TaskState,
  createApiProgressData,
  isAudioFormat
} from '../types';
import { PollingProgressMapper } from '../progress/PollingProgressMapper';

// Constants
const INITIAL_ANIMATION_TARGET = 5;
const INITIAL_ANIMATION_DURATION = 200; // ms
const NO_DOWNLOAD_MAX = 10;

// Phase 2: Fake progress constants
const MAX_FAKE_PERCENT = 90; // Never fake beyond 90%
const THRESHOLD_BELOW_75_MIN = 2700; // 2.7s in ms
const THRESHOLD_BELOW_75_MAX = 3300; // 3.3s in ms
const THRESHOLD_75_TO_90_MIN = 3500; // 3.5s in ms
const THRESHOLD_75_TO_90_MAX = 4500; // 4.5s in ms
const STATUS_ROTATION_INTERVAL = 2000; // 2s for status text rotation at ≥90%

// Phase 3: Merging phase constants - Progressive timing (5s, 6s, 7s, ...)
const MERGING_STATUS_BASE_INTERVAL = 5000; // Base: 5s
const MERGING_STATUS_INCREMENT = 1000; // Increment: +1s each time

export class PollingStrategy extends BaseStrategy implements IConversionStrategy {
  private readonly pollingManager: IPollingManager;
  private resolvePromise: ((result: StrategyResult) => void) | null = null;
  private lastPercent: number = 0;
  private format: string;
  private isAudio: boolean;

  // Phase 2: Fake progress tracking
  private lastDisplayProgressUpdateTime: number = 0;
  private currentThreshold: number = 0;
  private stuckStartTime: number = 0; // When progress first stuck at ≥90%

  // Phase 3: Merging phase tracking
  private hasTransitionedToMerging: boolean = false;
  private mergingStartTime: number = 0; // When merging phase started
  private lastMergingStatusIndex: number = -1; // Track which status was shown last

  constructor(
    context: StrategyContext,
    stateUpdater: IStateUpdater,
    pollingManager: IPollingManager
  ) {
    super(context, stateUpdater);
    this.pollingManager = pollingManager;
    this.format = context.formatData.format || context.formatData.type || 'mp4';
    this.isAudio = isAudioFormat(this.format);

    // Initialize PollingProgressMapper with format and size
    const sizeMB = context.extractResult.size ? Math.round(context.extractResult.size / (1024 * 1024)) : 200;
    PollingProgressMapper.reset(this.format, sizeMB);

    // Phase 2: Initialize timing
    this.lastDisplayProgressUpdateTime = Date.now();
    this.currentThreshold = this.calculateThreshold();
  }

  getName(): string {
    return 'PollingStrategy';
  }

  async execute(): Promise<StrategyResult> {
    if (this.checkAborted()) {
      return this.cancelledResult();
    }

    const { progressUrl } = this.ctx.extractResult;

    if (!progressUrl) {
      const error = 'No progressUrl - polling not supported';
      this.markFailed(error);
      return this.failureResult(error);
    }

    // Update state
    this.updateTask({
      state: TaskState.POLLING,
      statusText: 'Converting...',
      showProgressBar: true
    });

    // Start polling IMMEDIATELY (don't wait for animation)
    // Layer 1: Initial animation 0→5% (runs in parallel with polling)
    this.playInitialAnimation(); // Don't await - run in parallel

    return new Promise<StrategyResult>((resolve) => {
      this.resolvePromise = resolve;

      this.pollingManager.startPolling(this.ctx.formatId, {
        progressUrl,
        onProgressUpdate: (data) => this.handleProgress(data),
        onStatusUpdate: (result) => {
          if (result.mergedUrl) {
            this.handleComplete(result.mergedUrl);
          }
        }
      });
    });
  }

  cancel(): void {
    super.cancel();
    this.pollingManager.stopPolling(this.ctx.formatId);

    if (this.resolvePromise) {
      this.resolvePromise(this.cancelledResult());
      this.resolvePromise = null;
    }
  }

  /**
   * Layer 1: Initial animation 0→5% in 200ms
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

    // Phase 2: Reset timer after initial animation completes
    this.lastDisplayProgressUpdateTime = Date.now();
  }

  /**
   * Handle progress updates from polling
   */
  private handleProgress(rawData: { videoProgress: number; audioProgress: number; status: string; mergedUrl?: string }): void {
    if (this.checkAborted()) {
      return;
    }

    // Layer 2: no_download handling - server not ready yet
    if (rawData.status === 'no_download') {
      this.handleNoDownload();
      return;
    }

    // Layer 3: Real progress from API (using PollingProgressMapper)
    const apiData = createApiProgressData({
      videoProgress: rawData.videoProgress,
      audioProgress: rawData.audioProgress,
      status: rawData.status,
      mergedUrl: rawData.mergedUrl ?? null
    });

    // Use PollingProgressMapper for sophisticated progress calculation
    const displayProgress = PollingProgressMapper.mapProgress(apiData);
    const statusText = PollingProgressMapper.getStatusText(apiData);

    // Phase 2: Check if progress is stuck
    const timeSinceLastUpdate = Date.now() - this.lastDisplayProgressUpdateTime;

    // Never backwards rule + Phase 2 fake progress
    if (displayProgress > this.lastPercent) {
      // Save previous percent BEFORE updating (needed for transition check)
      const previousPercent = this.lastPercent;

      // ✅ REAL PROGRESS: Update UI and reset timers
      this.lastPercent = displayProgress;
      this.lastDisplayProgressUpdateTime = Date.now(); // Phase 2: Reset timer
      this.currentThreshold = this.calculateThreshold(); // Phase 2: New threshold
      this.stuckStartTime = 0; // Phase 2: Reset stuck timer

      this.updateProgress(displayProgress, statusText);

      // Phase 3: Check if we've transitioned to merging phase
      const currentPhase = PollingProgressMapper.getCurrentPhase();

      if (currentPhase === 'merging' && !this.hasTransitionedToMerging) {
        this.hasTransitionedToMerging = true;

        // Delay showing merging spinner to allow progress bar animation to complete
        // Check if JUST reached 100% (need delay) vs already at 100% (no delay)
        const justReached100 = displayProgress >= 100 && previousPercent < 100;
        const animationDelay = justReached100 ? 500 : 0; // 500ms for UI to display 100%

        setTimeout(async () => {
          if (this.checkAborted()) {
            return;
          }

          this.mergingStartTime = Date.now(); // Start merging timer
          this.lastMergingStatusIndex = 0; // Initialize status index

          // Show first merging status
          const initialStatus = this.getStatusTextForMergingPhase();
          this.updateProgress(100, initialStatus);
        }, animationDelay);
      }

    } else if (displayProgress < this.lastPercent) {
      // ⚠️ BACKWARD: API progress < lastPercent (likely due to fake progress overtaking API)
      // Don't update UI with backwards progress, but still check if we should fake progress
      // Fall through to stuck handling below
    }

    // Handle stuck progress (both backwards and equal cases)
    if (displayProgress <= this.lastPercent) {
      const currentPhase = PollingProgressMapper.getCurrentPhase();

      // Phase 3: Special handling for merging phase with progressive timing
      if (currentPhase === 'merging' && this.hasTransitionedToMerging) {
        // Merging phase: Rotate status with progressive timing (5s, 6s, 7s, ...)
        const elapsedSinceMerging = Date.now() - this.mergingStartTime;
        const currentStatusIndex = this.getCurrentMergingStatusIndex(elapsedSinceMerging);

        // Check if we've moved to a new status (progressive timing)
        if (currentStatusIndex > this.lastMergingStatusIndex) {
          this.lastMergingStatusIndex = currentStatusIndex;

          const rotatingStatus = this.getStatusTextForMergingPhase();
          this.updateProgress(100, rotatingStatus);
        }
      } else {
        // Phase 2: Processing phase stuck handling (fake progress or status rotation)
        // Check if we should apply fake progress or rotate status
        if (timeSinceLastUpdate > this.currentThreshold) {
          if (this.lastPercent < MAX_FAKE_PERCENT) {
            // Case 1: <90% → fake +1%
            this.applyFakeProgress();
          } else {
            // Case 2: ≥90% → rotate status text only (2s interval)
            if (this.stuckStartTime === 0) {
              this.stuckStartTime = Date.now();
            }
            const rotatingStatus = this.getStatusTextForStuckProgress();
            this.updateProgress(this.lastPercent, rotatingStatus);
            // Update timer for next rotation
            this.lastDisplayProgressUpdateTime = Date.now();
          }
        }
      }
    }

    // Check completion
    if (apiData.mergedUrl) {
      this.handleComplete(apiData.mergedUrl);
    }
  }

  /**
   * Layer 2: no_download handling
   * Increment 1% per poll when server hasn't started yet (5→10%)
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
    if (this.checkAborted()) {
      return;
    }

    this.pollingManager.stopPolling(this.ctx.formatId);

    // Final animation to 100%
    this.updateProgress(100, 'Ready');

    // Wait for 100% to paint (double RAF + 150ms delay for CSS transition)
    // CSS transition for final 100% is 50ms (0.05s with .completing-final class)
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Add 150ms delay to ensure CSS transition completes (50ms transition + safety buffer)
          setTimeout(() => {
            resolve();
          }, 150);
        });
      });
    });

    if (this.checkAborted()) {
      return;
    }

    // Mark success
    this.markSuccess(mergedUrl);

    if (this.resolvePromise) {
      this.resolvePromise(this.successResult(mergedUrl));
      this.resolvePromise = null;
    }
  }

  /**
   * Phase 2: Calculate dynamic threshold based on current progress
   */
  private calculateThreshold(): number {
    const currentPercent = this.lastPercent;

    if (currentPercent < 75) {
      // Random between 2.7s - 3.3s
      const threshold = THRESHOLD_BELOW_75_MIN + Math.random() * (THRESHOLD_BELOW_75_MAX - THRESHOLD_BELOW_75_MIN);
      return Math.round(threshold);
    } else if (currentPercent < 90) {
      // Random between 3.5s - 4.5s
      const threshold = THRESHOLD_75_TO_90_MIN + Math.random() * (THRESHOLD_75_TO_90_MAX - THRESHOLD_75_TO_90_MIN);
      return Math.round(threshold);
    } else {
      // ≥90%: No fake progress, return large number (won't be used for fake %)
      return Infinity;
    }
  }

  /**
   * Phase 2: Apply fake +1% progress when stuck
   */
  private applyFakeProgress(): void {
    // Don't fake beyond 90%
    if (this.lastPercent >= MAX_FAKE_PERCENT) {
      return;
    }

    // Fake +1%
    const newPercent = Math.min(this.lastPercent + 1, MAX_FAKE_PERCENT);

    this.lastPercent = newPercent;
    this.lastDisplayProgressUpdateTime = Date.now();

    // Calculate new threshold for next fake
    this.currentThreshold = this.calculateThreshold();

    // Update UI with fake progress
    this.updateProgress(newPercent, 'Converting...');
  }

  /**
   * Phase 2: Get rotating status text when stuck at ≥90%
   */
  private getStatusTextForStuckProgress(): string {
    const elapsedSinceStuck = Date.now() - this.stuckStartTime;
    const statusIndex = Math.floor(elapsedSinceStuck / STATUS_ROTATION_INTERVAL);

    const statuses = [
      'Finalizing…',
      'Finishing up…',
      'Almost done…',
      'Completing the final step…'
    ];

    // Cycle through statuses
    return statuses[statusIndex % statuses.length];
  }

  /**
   * Phase 3: Calculate cumulative time for progressive intervals
   * Progressive timing: 5s, 6s, 7s, 8s, ...
   *
   * Returns the cumulative time at which status index N should appear
   * Formula: cumulative_time(n) = n * BASE + INCREMENT * n * (n-1) / 2
   */
  private getCumulativeTimeForStatusIndex(index: number): number {
    if (index === 0) return 0;

    // cumulative = 5*n + 1*(0+1+2+...+(n-1))
    //            = 5000*n + 1000 * n*(n-1)/2
    return MERGING_STATUS_BASE_INTERVAL * index +
           MERGING_STATUS_INCREMENT * index * (index - 1) / 2;
  }

  /**
   * Phase 3: Get current status index based on elapsed time with progressive intervals
   */
  private getCurrentMergingStatusIndex(elapsedTime: number): number {
    // Find which status index we should be at based on elapsed time
    // We need to find the largest index where cumulative_time(index) <= elapsedTime

    let index = 0;
    while (this.getCumulativeTimeForStatusIndex(index + 1) <= elapsedTime) {
      index++;
      if (index >= 9) break; // Max 10 statuses (0-9)
    }

    return index;
  }

  /**
   * Phase 3: Get rotating status text during merging phase
   *
   * Psychology-based messages with progressive timing (5s, 6s, 7s, ...):
   * - Progress perception: Show activity to make time feel faster
   * - Uncertainty reduction: Specific messages reduce anxiety
   * - Goal gradient effect: Messages build toward completion
   * - Positive framing: Emphasize value and quality
   * - Progressive timing: Longer intervals as time goes → natural waiting feeling
   */
  private getStatusTextForMergingPhase(): string {
    const elapsedSinceMerging = Date.now() - this.mergingStartTime;
    const statusIndex = this.getCurrentMergingStatusIndex(elapsedSinceMerging);

    // 10 psychology-optimized status messages
    const statuses = [
      'Merging files…',              // t=0s: Direct, informative
      'Finalizing your video…',      // t=5s: Personal ownership (+5s)
      'Optimizing quality…',         // t=11s: Value proposition (+6s)
      'Almost ready…',               // t=18s: Goal gradient effect (+7s)
      'Applying final touches…',     // t=26s: Craftsmanship (+8s)
      'Preparing your download…',    // t=35s: Anticipation (+9s)
      'Processing complete…',        // t=45s: Achievement (+10s)
      'Getting everything ready…',   // t=56s: Comprehensive (+11s)
      'Just a moment longer…',       // t=68s: Empathy (+12s)
      'Nearly there…'                // t=81s+: Proximity to goal (+13s)
    ];

    // Cycle through statuses
    return statuses[statusIndex % statuses.length];
  }

  /**
   * Update progress UI (both circular and text)
   */
  private updateProgress(percent: number, statusText: string): void {
    // Phase 3: Check if we're in merging phase to control % suffix
    const currentPhase = PollingProgressMapper.getCurrentPhase();
    const appendPercent = currentPhase !== 'merging'; // Don't append % in merging phase

    // Build final status text with percent (if needed)
    const finalStatusText = appendPercent
      ? `${statusText} ${Math.round(percent)}%`
      : statusText;

    // Update conversion task state (this will trigger UI update via subscription)
    this.updateTask({
      progress: percent,
      statusText: finalStatusText,
      showProgressBar: true
    });
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
