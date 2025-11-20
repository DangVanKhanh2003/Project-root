/**
 * Progress Bar Manager - TypeScript
 * Simplified version for conversion modal progress tracking
 */

const DEFAULTS = {
  UPDATE_INTERVAL: 500,
  EXTRACT_TARGET_YOUTUBE: 28,
  EXTRACT_TARGET_SOCIAL: 95,
  EXTRACT_DURATION: 3000,
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
  private targetPercent: number = 100;
  private startTime: number = 0;
  private estimatedDuration: number = 0;
  private onCompleteCallback: (() => void) | null = null;
  private extractCompleteCallback: (() => void) | null = null;

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
        <div class="main-status-text">Processing… 0%</div>
        <div class="progress-detail-text"></div>
      </div>
    `;

    // Inject into .progress-bar-content instead of overwriting wrapper
    contentBox.innerHTML = html;

    // Re-query elements after render
    this.queryElements();
  }

  private updateVisualProgress(percent: number): void {
    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const roundedPercent = Math.round(clampedPercent);

    this.currentProgress = roundedPercent;

    if (this.elements.mainStatusText) {
      const percentText = roundedPercent + '%';
      this.elements.mainStatusText.textContent = `Processing… ${percentText}`;
    }
  }

  private calculateEaseOutProgress(elapsedMs: number): number {
    const totalDuration = this.estimatedDuration * 1000;
    const progress = Math.min(elapsedMs / totalDuration, 1);
    return Easing.easeOutCubic(progress) * this.targetPercent;
  }

  private startProgressAnimation(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.isRunningFlag = true;
    this.startTime = Date.now();
    this.currentProgress = 0;
    this.updateVisualProgress(0);

    this.intervalId = window.setInterval(() => {
      if (!this.isRunningFlag) return;

      const elapsedMs = Date.now() - this.startTime;
      const newProgress = this.calculateEaseOutProgress(elapsedMs);

      if (newProgress >= this.targetPercent) {
        this.currentProgress = this.targetPercent;
        this.updateVisualProgress(this.currentProgress);
        this.stopProgressAnimation();
        return;
      }

      this.updateVisualProgress(newProgress);
    }, DEFAULTS.UPDATE_INTERVAL);
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
    this.extractCompleteCallback = null;
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
      this.updateVisualProgress(this.currentProgress);

      if (progress < 1) {
        this.animationFrameId = requestAnimationFrame(animate);
      } else {
        this.currentProgress = targetProgress;
        this.updateVisualProgress(this.currentProgress);
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

    // Show the progress content (elements are already visible by default)
    // No need to manipulate display - modal handles visibility
  }

  hide(): void {
    // Progress bar visibility is controlled by modal
    // Just reset the progress
    this.reset();
  }

  reset(): void {
    this.clearAllTimers();
    this.currentProgress = 0;
    this.targetPercent = 100;
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

  startExtractPhase(targetPercent: number = DEFAULTS.EXTRACT_TARGET_YOUTUBE, onComplete?: () => void): void {

    this.targetPercent = targetPercent;
    this.estimatedDuration = DEFAULTS.EXTRACT_DURATION / 1000; // Convert to seconds
    this.extractCompleteCallback = onComplete || null;

    this.startProgressAnimation();
  }

  completeExtractToFull(onCompleteCallback?: () => void): void {

    this.stopProgressAnimation();

    this.tweenToProgress(100, DEFAULTS.COMPLETE_DURATION, () => {
      onCompleteCallback?.();
    });
  }

  resumeToDownloadPhase(type: string, options: any = {}): void {

    this.stopProgressAnimation();

    if (type === 'stream' && options.onProgress) {
      // iOS RAM download - call onProgress callback with (loaded, total) signature
      const onProgressCallback = (loaded: number, total: number) => {
        const progressPercent = total > 0 ? (loaded / total) * 100 : 0;
        // Map download progress (0-100%) to remaining progress bar space
        const remainingSpace = 100 - this.currentProgress;
        const newProgress = this.currentProgress + (progressPercent / 100) * remainingSpace;
        this.updateVisualProgress(newProgress);
      };

      options.onProgress(onProgressCallback).then(() => {
        options.onComplete?.();
      });
    } else if (type === 'polling') {
      // Polling - progress will be updated via updatePollingProgress
      // Just store callbacks
      if (options.onProgress) {
        // Polling progress callback (not used directly, updated via updatePollingProgress)
      }
      if (options.onComplete) {
        this.onCompleteCallback = options.onComplete;
      }
    } else {
      // Default - complete to 100%
      this.tweenToProgress(100, DEFAULTS.TWEEN_DURATION, options.onComplete);
    }
  }

  setPollingProgress(progress: number, statusText?: string): void {

    this.updateVisualProgress(progress);

    if (statusText && this.elements.mainStatusText) {
      const fullText = `${statusText} ${Math.floor(progress)}%`;
      this.elements.mainStatusText.textContent = fullText;
    } else {
    }
  }

  updatePollingProgress(apiData: any, phase: string): void {

    const { videoProgress, audioProgress, status } = apiData;

    // Calculate display progress based on phase
    let displayProgress = 0;
    let statusText = 'Processing…';

    if (phase === 'processing') {
      // Processing phase: 0-50% based on video/audio progress
      const avgProgress = (videoProgress + audioProgress) / 2;
      displayProgress = avgProgress * 0.5; // Map 0-100% to 0-50%
      statusText = 'Processing video…';
    } else if (phase === 'merging') {
      // Merging phase: 50-100%
      const avgProgress = (videoProgress + audioProgress) / 2;
      displayProgress = 50 + avgProgress * 0.5; // Map 0-100% to 50-100%
      statusText = 'Merging files…';
    }

    this.setPollingProgress(displayProgress, statusText);
  }

  completePollingProgress(): void {
    this.tweenToProgress(100, DEFAULTS.COMPLETE_DURATION, () => {
      this.onCompleteCallback?.();
    });
  }

  getCurrentProgress(): number {
    return this.currentProgress;
  }

  isRunning(): boolean {
    return this.isRunningFlag;
  }

  // Stub methods for compatibility
  updateProgress(videoProgress: number, audioProgress: number, message?: string): void {
    // Not used in current implementation
  }

  setText(message: string): void {
    if (this.elements.mainStatusText) {
      this.elements.mainStatusText.textContent = message;
    }
  }

  setIndeterminate(indeterminate: boolean): void {
    // Not implemented - would show/hide spinner
  }
}
