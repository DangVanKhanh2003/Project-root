/**
 * Progress Bar Manager - TypeScript
 * New 2-Phase Architecture for conversion modal progress tracking
 * Phase 1: EXTRACTING (no progress bar - handled by modal spinner)
 * Phase 2: DOWNLOADING (RAM) or POLLING (with real/estimated progress)
 */

const DEFAULTS = {
  UPDATE_INTERVAL: 500,
  COMPLETE_DURATION: 800,
  TWEEN_DURATION: 350,
};

const Easing = {
  easeOutCubic: (t: number) => 1 - Math.pow(1 - t, 3),
  easeOutSine: (t: number) => Math.sin((t * Math.PI) / 2),
};

interface ProgressBarElements {
  wrapper: HTMLElement | null;
  container: HTMLElement | null;
  mainStatusText: HTMLElement | null;
  progressDetailText: HTMLElement | null;
}

export class ProgressBarManager {
  private elements: ProgressBarElements = {
    wrapper: null,
    container: null,
    mainStatusText: null,
    progressDetailText: null,
  };
  private wrapperSelector: string;
  private currentProgress: number = 0;
  private isRunningFlag: boolean = false;
  private intervalId: number | null = null;
  private animationFrameId: number | null = null;
  private onCompleteCallback: (() => void) | null = null;

  constructor(options: { wrapper: string }) {
    if (!options || !options.wrapper) {
      throw new Error('Progress bar manager requires a wrapper element selector.');
    }
    this.wrapperSelector = options.wrapper;
  }

  private queryElements(): boolean {
    this.elements.wrapper = document.querySelector(this.wrapperSelector);
    if (!this.elements.wrapper) {
      return false;
    }

    // Query elements within the content box
    const contentBox = this.elements.wrapper.querySelector('.progress-bar-content');
    if (!contentBox) {
      return false;
    }

    this.elements.container = contentBox.querySelector('.status-text-container');
    this.elements.mainStatusText = contentBox.querySelector('.main-status-text');
    this.elements.progressDetailText = contentBox.querySelector('.progress-detail-text');

    return true;
  }

  private renderProgressHTML(): void {
    if (!this.elements.wrapper) return;

    // Find .progress-bar-content container (modal provides this)
    const contentBox = this.elements.wrapper.querySelector('.progress-bar-content');
    if (!contentBox) {
      return;
    }

    const html = `
      <div class="status-text-container">
        <div class="main-status-text">Processing 0%</div>
        <div class="progress-detail-text"></div>
      </div>
    `;

    // Inject into .progress-bar-content instead of overwriting wrapper
    contentBox.innerHTML = html;

    // Re-query elements after render
    this.queryElements();
  }

  private updateVisualProgress(percent: number, statusText?: string): void {
    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const roundedPercent = Math.round(clampedPercent);

    this.currentProgress = roundedPercent;

    // Only update status text if explicitly provided
    // This allows different phases to set their own status messages
    if (statusText && this.elements.mainStatusText) {
      this.elements.mainStatusText.textContent = statusText;
    }
  }

  private stopProgressAnimation(): void {
    this.isRunningFlag = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private clearAllTimers(): void {
    this.stopProgressAnimation();
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.onCompleteCallback = null;
  }

  private tweenToProgress(targetProgress: number, duration: number, callback?: () => void): void {
    const startProgress = this.currentProgress;
    const startTime = Date.now();
    const delta = targetProgress - startProgress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = Easing.easeOutCubic(progress);
      this.currentProgress = startProgress + delta * easedProgress;

      // Update visual without changing status text (preserve existing text)
      if (this.elements.mainStatusText) {
        const currentText = this.elements.mainStatusText.textContent || '';
        const baseText = currentText.replace(/\s+\d+%$/, ''); // Remove existing percentage
        this.elements.mainStatusText.textContent = `${baseText} ${Math.round(this.currentProgress)}%`;
      }

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.currentProgress = targetProgress;
        if (this.elements.mainStatusText) {
          const currentText = this.elements.mainStatusText.textContent || '';
          const baseText = currentText.replace(/\s+\d+%$/, '');
          this.elements.mainStatusText.textContent = `${baseText} ${Math.round(targetProgress)}%`;
        }
        callback?.();
      }
    };

    animate();
  }

  // ============= PUBLIC METHODS =============

  show(): void {
    if (!this.queryElements()) {
      return;
    }

    this.renderProgressHTML();
  }

  hide(): void {
    this.reset();
  }

  reset(): void {
    this.clearAllTimers();
    this.currentProgress = 0;
    this.updateVisualProgress(0);
  }

  stop(): void {
    this.clearAllTimers();
  }

  complete(callback?: () => void): void {
    this.stopProgressAnimation();
    this.tweenToProgress(100, DEFAULTS.COMPLETE_DURATION, () => {
      callback?.();
    });
  }

  /**
   * Start downloading phase with real progress (RAM download)
   * Progress: 0% → 100% with real-time size updates
   *
   * WHY: RAM download shows actual download progress with MB/GB display
   * CONTRACT: (options:object) → void - starts download phase with progress callback
   * PRE: Valid totalSize, onProgress callback returns Promise
   * POST: Progress bar animates from 0% to 100% with real-time updates
   * EDGE: totalSize = 0 → show indeterminate progress
   * USAGE: progressBar.startDownloadingPhase({ totalSize, onProgress, onComplete });
   */
  startDownloadingPhase(options: {
    totalSize: number;
    onProgress: (callback: (loaded: number, total: number) => void) => Promise<void>;
    onComplete?: () => void;
  }): void {
    // Reset to 0%
    this.currentProgress = 0;

    // Display initial state with total size
    const totalMB = Math.max(1, Math.ceil(options.totalSize / (1024 * 1024)));
    const totalDisplay = options.totalSize >= 1024 * 1024 * 1024
      ? `${Math.max(1, Math.ceil(options.totalSize / (1024 * 1024 * 1024)))} GB`
      : `${totalMB} MB`;

    this.updateVisualProgress(0, `Converting... 0 MB / ${totalDisplay}`);

    // Start real download progress
    const onProgressCallback = (loaded: number, total: number) => {
      // Use options.totalSize as fallback if fetch doesn't provide content-length
      const actualTotal = total > 0 ? total : options.totalSize;
      const progressPercent = actualTotal > 0 ? (loaded / actualTotal) * 100 : 0;
      this.currentProgress = progressPercent;

      // Format loaded size
      const loadedMB = Math.ceil(loaded / (1024 * 1024));
      const loadedSize = loaded >= 1024 * 1024 * 1024
        ? `${Math.ceil(loaded / (1024 * 1024 * 1024))} GB`
        : `${loadedMB} MB`;

      // Handle unknown total size (no content-length header AND no size from extract)
      if (actualTotal === 0) {
        // Indeterminate progress - show only loaded size
        this.updateVisualProgress(0, `Converting... ${loadedSize}`);
        return;
      }

      // Known total size - show progress without percentage
      const totalMB = Math.max(1, Math.ceil(actualTotal / (1024 * 1024)));
      const totalSize = actualTotal >= 1024 * 1024 * 1024
        ? `${Math.max(1, Math.ceil(actualTotal / (1024 * 1024 * 1024)))} GB`
        : `${totalMB} MB`;

      this.updateVisualProgress(progressPercent, `Converting... ${loadedSize} / ${totalSize}`);
    };

    options.onProgress(onProgressCallback).then(() => {
      this.currentProgress = 100;
      this.updateVisualProgress(100, 'Download complete 100%');
      options.onComplete?.();
    }).catch((error) => {
      // Error handling is done by caller
    });
  }

  /**
   * Start polling phase with 2 sub-phases
   * Sub-phase 1 (Processing): 0% → 60% (real API progress)
   * Sub-phase 2 (Merging): 60% → 100% (estimated)
   *
   * WHY: Initialize polling phase with clean 0% state
   * CONTRACT: () → void - resets progress and prepares for polling updates
   * PRE: None
   * POST: Progress at 0%, status text set to 'Processing...'
   * EDGE: Can be called multiple times (resets each time)
   * USAGE: progressBar.startPollingPhase();
   */
  startPollingPhase(): void {
    // Reset to 0%
    this.currentProgress = 0;
    this.updateVisualProgress(0, 'Processing 0%');
  }

  /**
   * Update polling progress (called from convert-logic when API data arrives)
   * Uses PollingProgressMapper to calculate display progress
   *
   * WHY: Update progress bar with polling data from API with smooth animation
   * CONTRACT: (displayProgress:number, statusText:string) → void
   * PRE: displayProgress in range [0, 100], statusText is non-empty
   * POST: Progress bar smoothly animates to displayProgress with statusText
   * EDGE: displayProgress > 100 → clamped to 100; animates from current to target
   * USAGE: progressBar.updatePollingProgress(45, 'Processing');
   */
  updatePollingProgress(displayProgress: number, statusText: string): void {
    const targetProgress = Math.min(Math.max(displayProgress, 0), 100);

    // Cancel any existing animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Only animate if progress is moving forward
    if (targetProgress <= this.currentProgress) {
      // No animation for backward/same progress
      const roundedProgress = Math.round(targetProgress);
      this.updateVisualProgress(targetProgress, `${statusText} ${roundedProgress}%`);
      return;
    }

    // Smooth animation from current to target (duration based on distance)
    const progressDelta = targetProgress - this.currentProgress;
    const duration = Math.min(progressDelta * 30, 1000); // Max 1s animation

    this.tweenToProgressWithStatus(targetProgress, duration, statusText);
  }

  private tweenToProgressWithStatus(targetProgress: number, duration: number, statusText: string): void {
    const startProgress = this.currentProgress;
    const startTime = Date.now();
    const delta = targetProgress - startProgress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = Easing.easeOutCubic(progress);
      this.currentProgress = startProgress + delta * easedProgress;

      // Update visual with current progress
      const roundedProgress = Math.round(this.currentProgress);
      if (this.elements.mainStatusText) {
        this.elements.mainStatusText.textContent = `${statusText} ${roundedProgress}%`;
      }

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.currentProgress = targetProgress;
        const finalRounded = Math.round(targetProgress);
        if (this.elements.mainStatusText) {
          this.elements.mainStatusText.textContent = `${statusText} ${finalRounded}%`;
        }
      }
    };

    animate();
  }

  /**
   * Update download progress for RAM download (iOS audio)
   * Shows: "Converting... X MB / Y MB" without appending %
   *
   * WHY: RAM download shows bytes progress, not percentage
   * CONTRACT: (percent, statusText) → void
   * PRE: Valid percent (0-100), statusText with MB info
   * POST: Progress bar updated, statusText shown as-is (no % appended)
   * USAGE: progressBar.updateDownloadProgress(44, 'Converting... 12 MB / 26 MB');
   */
  updateDownloadProgress(displayProgress: number, statusText: string): void {
    const targetProgress = Math.min(Math.max(displayProgress, 0), 100);

    // Cancel any existing animation
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Update visual directly (no % appended)
    this.currentProgress = targetProgress;
    this.updateVisualProgress(targetProgress, statusText);
  }

  /**
   * Complete polling to 100% (when mergedUrl received)
   *
   * WHY: Animate final completion of polling phase
   * CONTRACT: (onComplete?:function) → void - tweens to 100% and calls callback
   * PRE: None
   * POST: Progress animated to 100%, callback invoked
   * EDGE: Already at 100% → still animates and calls callback
   * USAGE: progressBar.completePollingPhase(() => showDownloadButton());
   */
  completePollingPhase(onComplete?: () => void): void {
    this.tweenToProgress(100, DEFAULTS.COMPLETE_DURATION, () => {
      if (this.elements.mainStatusText) {
        this.elements.mainStatusText.textContent = 'Ready 100%';
      }
      onComplete?.();
    });
  }

  getCurrentProgress(): number {
    return this.currentProgress;
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }

  // Legacy method for compatibility
  setText(message: string): void {
    if (this.elements.mainStatusText) {
      this.elements.mainStatusText.textContent = message;
    }
  }

  setIndeterminate(indeterminate: boolean): void {
    // Not implemented - would show/hide spinner
  }
}
