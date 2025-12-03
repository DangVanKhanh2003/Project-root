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

export class PollingStrategy extends BaseStrategy {
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

  constructor(context: StrategyContext) {
    super(context);
    this.format = context.formatData.format || context.formatData.type || 'mp4';
    this.isAudio = isAudioFormat(this.format);

    // Initialize PollingProgressMapper with format and size
    const sizeMB = context.extractResult.size ? Math.round(context.extractResult.size / (1024 * 1024)) : 200;
    PollingProgressMapper.reset(this.format, sizeMB);

    // Phase 2: Initialize timing
    this.lastDisplayProgressUpdateTime = Date.now();
    this.currentThreshold = this.calculateThreshold();
    log('[Phase2] Initial threshold:', this.currentThreshold + 'ms');
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

    // Phase 2: Reset timer after initial animation completes
    this.lastDisplayProgressUpdateTime = Date.now();
    log('[Phase2] Initial animation complete, timer reset at', INITIAL_ANIMATION_TARGET + '%');
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
    log('🔄 CALLING PollingProgressMapper.mapProgress()...');
    const displayProgress = PollingProgressMapper.mapProgress(apiData);

    log('🔄 CALLING PollingProgressMapper.getStatusText()...');
    const statusText = PollingProgressMapper.getStatusText(apiData);

    log('📊 PollingProgressMapper RESULTS:', {
      displayProgress: Math.round(displayProgress) + '%',
      statusText,
      lastPercent: this.lastPercent + '%',
      format: this.format,
      isAudio: this.isAudio,
      currentPhase: PollingProgressMapper.getCurrentPhase()
    });

    // Phase 2: Check if progress is stuck
    const timeSinceLastUpdate = Date.now() - this.lastDisplayProgressUpdateTime;

    // Never backwards rule + Phase 2 fake progress
    if (displayProgress > this.lastPercent) {
      log('');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('✅ REAL PROGRESS UPDATE');
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('Progress:', this.lastPercent + '% → ' + Math.round(displayProgress) + '%');
      log('Status:', statusText);

      // Save previous percent BEFORE updating (needed for transition check)
      const previousPercent = this.lastPercent;

      // ✅ REAL PROGRESS: Update UI and reset timers
      this.lastPercent = displayProgress;
      this.lastDisplayProgressUpdateTime = Date.now(); // Phase 2: Reset timer
      this.currentThreshold = this.calculateThreshold(); // Phase 2: New threshold
      this.stuckStartTime = 0; // Phase 2: Reset stuck timer

      log('[Phase2] Timer reset, new threshold:', this.currentThreshold + 'ms');

      // Note: Progress bar manager appends "X%" automatically
      log('🎨 Calling updateProgress()...');
      this.updateProgress(displayProgress, statusText);
      log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      log('');

      // Phase 3: Check if we've transitioned to merging phase
      const currentPhase = PollingProgressMapper.getCurrentPhase();
      log('🔍 Checking merging transition:', {
        currentPhase,
        hasTransitionedToMerging: this.hasTransitionedToMerging,
        shouldTransition: currentPhase === 'merging' && !this.hasTransitionedToMerging
      });

      if (currentPhase === 'merging' && !this.hasTransitionedToMerging) {
        log('');
        log('═══════════════════════════════════════════════════════');
        log('🔄 MERGING PHASE TRANSITION DETECTED');
        log('═══════════════════════════════════════════════════════');
        log('[Phase3] displayProgress:', displayProgress + '%');
        log('[Phase3] previousPercent:', previousPercent + '%');
        log('[Phase3] Setting hasTransitionedToMerging = true');
        this.hasTransitionedToMerging = true;

        // Delay showing merging spinner to allow progress bar animation to complete
        // Check if JUST reached 100% (need delay) vs already at 100% (no delay)
        // IMPORTANT: Use previousPercent (before update), not this.lastPercent (after update)
        const justReached100 = displayProgress >= 100 && previousPercent < 100;
        const animationDelay = justReached100 ? 300 : 0; // 300ms for UI to display 100%
        log('[Phase3] ⏱️ Animation delay:', animationDelay + 'ms');
        log('[Phase3] Reason:', justReached100 ? 'Just reached 100%, waiting for UI to show completion' : 'Already at 100%, no delay');

        setTimeout(async () => {
          if (this.checkAborted()) {
            log('[Phase3] ❌ Aborted during merging transition delay');
            return;
          }

          log('');
          log('🎬 SHOWING MERGING SPINNER (after delay)');
          this.mergingStartTime = Date.now(); // Start merging timer
          this.lastMergingStatusIndex = 0; // Initialize status index
          log('[Phase3] mergingStartTime set to:', this.mergingStartTime);
          log('[Phase3] lastMergingStatusIndex initialized to: 0');

          // Update title to indicate final phase - preparing for download
          log('[Phase3] 🏷️ Updating title to "Preparing Your Download..."');
          this.getModal().updateConversionTitle('Preparing Your Download...');

          // Show merging spinner (2 quarter circles, no text)
          const circularProgress = this.getModal().getCircularProgress();
          if (circularProgress) {
            log('[Phase3] 🔄 Calling circularProgress.startMergingMode()...');
            circularProgress.startMergingMode();
            log('[Phase3] ✅ Merging spinner activated');
          }

          // Show first merging status
          log('[Phase3] 📝 Getting first merging status text...');
          const initialStatus = this.getStatusTextForMergingPhase();
          log('[Phase3] 📝 First status (index 0):', initialStatus);
          log('[Phase3] 🎨 Calling updateProgress(100, "' + initialStatus + '")...');
          this.updateProgress(100, initialStatus);
          log('═══════════════════════════════════════════════════════');
          log('✅ MERGING MODE FULLY ACTIVATED');
          log('═══════════════════════════════════════════════════════');
          log('');
        }, animationDelay);
      }

    } else if (displayProgress < this.lastPercent) {
      // ⚠️ BACKWARD: API progress < lastPercent (likely due to fake progress overtaking API)
      log('⚠️ API progress went backwards (or fake progress overtook API):', {
        previous: this.lastPercent,
        current: displayProgress,
        reason: 'Likely fake progress already incremented while API was stuck'
      });

      // Don't update UI with backwards progress, but still check if we should fake progress
      // Fall through to stuck handling below
    }

    // Handle stuck progress (both backwards and equal cases)
    if (displayProgress <= this.lastPercent) {
      const currentPhase = PollingProgressMapper.getCurrentPhase();

      log('[Phase2] ⏸️ STUCK or BACKWARD detected:', {
        displayProgress: displayProgress + '%',
        lastPercent: this.lastPercent + '%',
        isBackward: displayProgress < this.lastPercent,
        isStuck: displayProgress === this.lastPercent
      });

      // Phase 3: Special handling for merging phase with progressive timing
      if (currentPhase === 'merging' && this.hasTransitionedToMerging) {
        // Merging phase: Rotate status with progressive timing (5s, 6s, 7s, ...)
        const elapsedSinceMerging = Date.now() - this.mergingStartTime;
        const currentStatusIndex = this.getCurrentMergingStatusIndex(elapsedSinceMerging);

        log('[Phase3] Merging phase stuck check:', {
          elapsed: elapsedSinceMerging + 'ms',
          currentStatusIndex,
          lastMergingStatusIndex: this.lastMergingStatusIndex,
          shouldUpdate: currentStatusIndex > this.lastMergingStatusIndex
        });

        // Check if we've moved to a new status (progressive timing)
        if (currentStatusIndex > this.lastMergingStatusIndex) {
          log('[Phase3] 🔄 Time to rotate status! Index:', this.lastMergingStatusIndex, '→', currentStatusIndex);
          this.lastMergingStatusIndex = currentStatusIndex;

          const rotatingStatus = this.getStatusTextForMergingPhase();
          log('[Phase3] 📝 New status:', rotatingStatus);
          this.updateProgress(100, rotatingStatus);
        } else {
          log('[Phase3] No rotation needed yet');
        }
      } else {
        // Phase 2: Processing phase stuck handling (fake progress or status rotation)
        log('[Phase2] Time since last update:', timeSinceLastUpdate + 'ms', '/ threshold:', this.currentThreshold + 'ms');

        // Check if we should apply fake progress or rotate status
        if (timeSinceLastUpdate > this.currentThreshold) {
          if (this.lastPercent < MAX_FAKE_PERCENT) {
            // Case 1: <90% → fake +1%
            this.applyFakeProgress();
          } else {
            // Case 2: ≥90% → rotate status text only (2s interval)
            if (this.stuckStartTime === 0) {
              this.stuckStartTime = Date.now();
              log('[Phase2] Started stuck timer at ≥90%');
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
      log('[Phase2] At max fake percent (90%), skipping fake progress');
      return;
    }

    // Fake +1%
    const newPercent = Math.min(this.lastPercent + 1, MAX_FAKE_PERCENT);
    log('[Phase2] 🎭 FAKE PROGRESS:', this.lastPercent + '% → ' + newPercent + '%');

    this.lastPercent = newPercent;
    this.lastDisplayProgressUpdateTime = Date.now();

    // Calculate new threshold for next fake
    this.currentThreshold = this.calculateThreshold();
    log('[Phase2] New threshold:', this.currentThreshold + 'ms');

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
    const status = statuses[statusIndex % statuses.length];
    log('[Phase2] 🔄 Rotating status at ≥90%:', status, '(elapsed:', elapsedSinceStuck + 'ms)');
    return status;
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
    const status = statuses[statusIndex % statuses.length];
    const cumulativeTime = this.getCumulativeTimeForStatusIndex(statusIndex);
    const nextCumulativeTime = this.getCumulativeTimeForStatusIndex(statusIndex + 1);
    const intervalDuration = nextCumulativeTime - cumulativeTime;

    log('[Phase3] 🔄 Merging status rotation:', {
      status,
      statusIndex,
      elapsed: elapsedSinceMerging + 'ms',
      cumulativeTime: cumulativeTime + 'ms',
      intervalDuration: intervalDuration + 'ms'
    });

    return status;
  }

  /**
   * Update progress UI (both circular and text)
   */
  private updateProgress(percent: number, statusText: string): void {
    // Phase 3: Check if we're in merging phase to control % suffix
    const currentPhase = PollingProgressMapper.getCurrentPhase();
    const appendPercent = currentPhase !== 'merging'; // Don't append % in merging phase

    log('🎨 updateProgress() CALLED:', {
      percent: Math.round(percent) + '%',
      statusText,
      currentPhase,
      appendPercent,
      willShowPercentSuffix: appendPercent ? 'YES (will append %)' : 'NO (text only)'
    });

    // Use new unified progress update method (updates both circular + text)
    this.getModal().updateConversionProgress(percent, statusText, false, undefined, undefined, appendPercent);

    log('✅ updateConversionProgress() called with appendPercent =', appendPercent);
  }

  /**
   * Simple delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
