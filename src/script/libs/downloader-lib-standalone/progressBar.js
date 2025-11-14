
import { openLinkInNewTab, triggerDownload, formatMBSize, isIOS, isWindows } from '../../utils.js';

const DEFAULTS = {
  YOUTUBE_MAX_DURATION: 60,
  YOUTUBE_END_PERCENT: 98,
  YOUTUBE_UPDATE_INTERVAL: 500,  // Balanced: not too fast, not too slow
  SOCIAL_DURATION: 30,
  SOCIAL_END_PERCENT: 95,
  SOCIAL_UPDATE_INTERVAL: 500,   // Balanced: not too fast, not too slow
  PHASE_1_END: 60,
  PHASE_1_TIME_RATIO: 0.30,
  PHASE_2_END: 90,
  PHASE_2_TIME_RATIO: 0.50,
  PHASE_3_TIME_RATIO: 0.20,
  CHECKPOINT_DURATION: 350,
  FINAL_JUMP_DURATION: 300,
  COMPLETE_DELAY: 300,
  PROGRESS_PRECISION: 1,
};

const Easing = {
  easeOutCubic: t => 1 - Math.pow(1 - t, 3),
  easeOutSine: t => Math.sin((t * Math.PI) / 2),
};

export class ProgressBarManager {
  // Private fields
  #elements = {};
  #currentProgress = 0;
  #isRunning = false;
  #intervalId = null;
  #animationFrameId = null;
  #targetPercent = 100;
  #isVisible = false;
  #config = {};
  #startTime = 0;
  #estimatedDuration = 0;
  #totalSizeMB = null; // Total file size in MB
  #currentPhase = null; // 'EXTRACT' | 'DOWNLOAD' | 'POLLING'
  #onCompleteCallback = null;
  #extractCompleteCallback = null; // Extract phase completion callback
  #pollingCallbacks = {}; // Store polling-specific callbacks

  constructor(elementSelectors) {
    if (!elementSelectors || !elementSelectors.wrapper) {
      throw new Error('Progress bar manager requires a wrapper element selector.');
    }
    this.#elements.wrapperSelector = elementSelectors.wrapper;
  }

  #_queryElements() {
    this.#elements.wrapper = document.querySelector(this.#elements.wrapperSelector);
    if (!this.#elements.wrapper) {
      return false;
    }

    // Query elements within the content box
    const contentBox = this.#elements.wrapper.querySelector('.progress-bar-content');
    if (!contentBox) {
      return false;
    }

    // Text-only status elements
    this.#elements.container = contentBox.querySelector('.status-text-container');
    this.#elements.mainStatusText = contentBox.querySelector('.main-status-text');
    this.#elements.progressDetailText = contentBox.querySelector('.progress-detail-text');

    // Legacy elements for compatibility (set to null)
    this.#elements.bar = null;
    this.#elements.percentTrack = null;
    this.#elements.progressStatusText = this.#elements.mainStatusText; // Alias
    this.#elements.progressSizeText = this.#elements.progressDetailText; // Alias

    return true;
  }

  #_getProgressStatusText(percent) {
    // Always show "Processing…" for consistency
    return "Processing…";
  }

  #_updateVisualProgress(percent, smooth = true) {
    const clampedPercent = Math.min(Math.max(percent, 0), 100);
    const roundedPercent = Math.round(clampedPercent * Math.pow(10, DEFAULTS.PROGRESS_PRECISION)) / Math.pow(10, DEFAULTS.PROGRESS_PRECISION);

    // 🔍 LOG: Track all progress updates

    // 🔍 DEBUG: Track significant rollback only (not same values or tiny changes)
    const progressDrop = this.#currentProgress - roundedPercent;
    if (progressDrop > 5 && roundedPercent < 50) { // Only warn for drops >5%
    }

    // Update progress without debouncing for smooth % display
    this.#currentProgress = roundedPercent;

    // Update main status text with status + percentage
    if (this.#elements.mainStatusText) {
      const statusText = this.#_getProgressStatusText(roundedPercent);
      const percentText = Math.floor(roundedPercent) + '%';
      const fullText = `${statusText} ${percentText}`;
      this.#elements.mainStatusText.textContent = fullText;
    } else {
    }

    // Progress detail text removed - showing only status + percentage
  }

  #_getSizeDisplayText(percent) {
    if (this.#totalSizeMB === null) return '';

    const downloadedMB = (percent / 100) * this.#totalSizeMB;

    return `${formatMBSize(downloadedMB)} / ${formatMBSize(this.#totalSizeMB)}`;
  }

  #_calculateEaseOutProgress(elapsedMs) {
      const totalDuration = this.#estimatedDuration * 1000;
      const progress = Math.min(elapsedMs / totalDuration, 1);

      if (progress <= DEFAULTS.PHASE_1_TIME_RATIO) {
        const phaseProgress = progress / DEFAULTS.PHASE_1_TIME_RATIO;
        return Easing.easeOutCubic(phaseProgress) * DEFAULTS.PHASE_1_END;
      } else if (progress <= DEFAULTS.PHASE_1_TIME_RATIO + DEFAULTS.PHASE_2_TIME_RATIO) {
        const phaseStart = DEFAULTS.PHASE_1_TIME_RATIO;
        const phaseProgress = (progress - phaseStart) / DEFAULTS.PHASE_2_TIME_RATIO;
        return DEFAULTS.PHASE_1_END + (Easing.easeOutSine(phaseProgress) * (DEFAULTS.PHASE_2_END - DEFAULTS.PHASE_1_END));
      } else {
        const phaseStart = DEFAULTS.PHASE_1_TIME_RATIO + DEFAULTS.PHASE_2_TIME_RATIO;
        const phaseProgress = (progress - phaseStart) / DEFAULTS.PHASE_3_TIME_RATIO;
        return DEFAULTS.PHASE_2_END + (Easing.easeOutSine(phaseProgress) * (this.#targetPercent - DEFAULTS.PHASE_2_END));
      }
  }

  #_startProgressAnimation() {
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
    }
    this.#isRunning = true;
    this.#startTime = Date.now();
    this.#currentProgress = 0;
    this.#_updateVisualProgress(0);

    this.#intervalId = setInterval(() => {
      if (!this.#isRunning) return;
      const elapsedMs = Date.now() - this.#startTime;
      const newProgress = this.#_calculateEaseOutProgress(elapsedMs);
      this.#currentProgress = newProgress;

      if (this.#currentProgress >= this.#targetPercent) {
        this.#currentProgress = this.#targetPercent;
        this.#_updateVisualProgress(this.#currentProgress);
        this.#_stopProgressAnimation();
        return;
      }
      this.#_updateVisualProgress(this.#currentProgress);
    }, this.#config.updateInterval);

  }

  #_stopProgressAnimation() {
    this.#isRunning = false;
    if (this.#intervalId) {
      clearInterval(this.#intervalId);
      this.#intervalId = null;
    } else {
    }
  }

  #_clearAllTimers() {
    this.#_stopProgressAnimation();
    if (this.#animationFrameId) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }

    // Clear all callbacks to prevent memory leaks
    this.#onCompleteCallback = null;
    this.#extractCompleteCallback = null;
    this.#pollingCallbacks = {};

    // Reset current phase to clear any ongoing processes
    this.#currentPhase = null;
  }

  #_tweenToProgress(targetProgress, duration, callback) {
    const startProgress = this.#currentProgress;
    const startTime = Date.now();
    const delta = targetProgress - startProgress;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = Easing.easeOutCubic(progress);
      this.#currentProgress = startProgress + (delta * easedProgress);
      this.#_updateVisualProgress(this.#currentProgress);

      if (progress < 1) {
        this.#animationFrameId = requestAnimationFrame(animate);
      } else {
        this.#currentProgress = targetProgress;
        this.#_updateVisualProgress(this.#currentProgress);
        if (callback) callback();
      }
    };
    animate();
  }

  start(options = {}) {
    this.#_clearAllTimers();
    this.#currentProgress = 0;
    this.#isRunning = false;
    this.#startTime = 0;

    // Set total size if provided
    this.#totalSizeMB = options.totalSizeMB || null;

    // 🔍 DEBUG: Legacy start() method - should not be used with new extract phase system

    // Use new extract phase algorithm instead of old fake progress
    // Determine if this is a polling case (YouTube conversions) or non-polling (direct downloads)
    const isYouTube = (options.provider || 'youtube').toLowerCase() === 'youtube';
    const targetPercent = isYouTube ? 25 : 95; // YouTube → polling (25%), Others → non-polling (95%)

    // Use new extract phase system
    return this.startExtractPhase(targetPercent);
  }

  stop() {
    this.#_clearAllTimers();
    return this;
  }

  complete(callback) {
    this.#_clearAllTimers();

    // Update to 100% immediately without animation or delay
    this.#currentProgress = 100;
    this.#_updateVisualProgress(100);

    // Trigger callback immediately
    if (callback) {
      callback();
    }

    return this;
  }

  showDownload(url) {
    this.#_clearAllTimers();
    const wrapper = document.querySelector(this.#elements.wrapperSelector);
    if (!wrapper) return;

    const downloadHtml = `
        <div class="progress-download-content" style="text-align: center;">
            <h3 style="font-size: 1.2rem; margin-bottom: 8px;">Conversion Complete!</h3>
            <p style="font-size: 0.9rem; margin-bottom: 16px; color: #666;">Your file is ready to be downloaded.</p>
            <button type="button" id="progressBarDownloadBtn" class="btn-convert btn-download--idle" style="display: inline-flex; align-items: center; gap: 8px; padding: 12px 24px; border: none; background-color: var(--primary-color); color: white; border-radius: 50px; cursor: pointer; font-size: 1rem;">
            <span class="btn-text">Download Now</span>
            <svg class="btn-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path><polyline points="7 10 12 15 17 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></polyline><line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></line></svg>
            </button>
        </div>
    `;
    wrapper.innerHTML = `<div class="progress-bar-content">${downloadHtml}</div>`;

    const downloadBtn = wrapper.querySelector('#progressBarDownloadBtn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', () => {
        // Extract filename from URL or use default
        let filename = 'download';
        try {
          const urlParts = url.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          if (lastPart && lastPart.includes('.')) {
            filename = lastPart.split('?')[0]; // Remove query params
          }
        } catch (error) {
        }

        triggerDownload(url, filename);
        this.hide();
      }, { once: true });
    }
  }

  reset() {
    this.#_clearAllTimers();
    this.#currentProgress = 0;
    this.#isRunning = false;
    this.#isVisible = false;
    this.#config = {};
    this.#targetPercent = 100;
    this.#startTime = 0;
    this.#estimatedDuration = 0;
    this.#totalSizeMB = null;
    this.#currentPhase = null;
    this.#onCompleteCallback = null;
    this.#extractCompleteCallback = null;

    const wrapper = document.querySelector(this.#elements.wrapperSelector);
    if (wrapper) {
      wrapper.innerHTML = '';
      wrapper.style.visibility = 'hidden';
      wrapper.style.opacity = '0';
    }
    return this;
  }

  show() {
    const wrapper = document.querySelector(this.#elements.wrapperSelector);
    if (!wrapper) {
        return this;
    }

    const progressHtml = `
      <div class="status-text-container">
        <div class="main-status-text">Processing… 0%</div>
      </div>
    `;
    wrapper.innerHTML = `<div class="progress-bar-content">${progressHtml}</div>`;

    const elementsFound = this.#_queryElements(); // Re-query elements after setting innerHTML

    if (this.#elements.mainStatusText) {
    } else {
    }

    wrapper.style.visibility = 'visible';
    wrapper.style.opacity = '1';
    this.#isVisible = true;
    return this;
  }

  hide() {
    const wrapper = document.querySelector(this.#elements.wrapperSelector);
    if (wrapper) {
      // Reset styles for hiding
      wrapper.style.visibility = 'hidden';
      wrapper.style.opacity = '0';
      // Clear content after transition
      setTimeout(() => {
          wrapper.innerHTML = '';
      }, 300);
    }
    this.#isVisible = false;
    return this;
  }

  /**
   * Start extract phase with dynamic target based on platform
   * Polling: 0% → 20% (1s) → 25% (0.5s), Non-polling: 0% → 60% (1s) → 90% (1s) → 95% (1%/s)
   * @param {number} targetPercent - Target percentage for extract phase
   * @param {function} [onComplete] - Callback function called when extract phase completes
   */
  startExtractPhase(targetPercent = 25, onComplete = null) {
    this.#_clearAllTimers();
    this.#currentPhase = 'EXTRACT';
    this.#currentProgress = 0; // Reset to 0
    this.#targetPercent = targetPercent;
    this.#extractCompleteCallback = onComplete; // Store completion callback

    // 🔍 DEBUG: Track extract phase start

    this.show();

    const startTime = Date.now();

    this.#intervalId = setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds

      // 🔍 DEBUG: Target validation for overshoot debugging
      if (elapsed < 0.2) { // Only log once at start
      }

      let newProgress;

      if (targetPercent === 25) {
        // Polling cases: 0% → 20% → 25%
        if (elapsed <= 1.0) {
          // Phase 1: 0% → 20% trong 1s (smooth)
          newProgress = (elapsed / 1.0) * 20;
        } else if (elapsed <= 1.5) {
          // Phase 2: 20% → 25% trong 0.5s
          const segmentElapsed = elapsed - 1.0;
          newProgress = 20 + (segmentElapsed / 0.5) * 5;
          newProgress = Math.min(newProgress, 25);
        } else {
          // Pause at 25%
          newProgress = 25;
          this.#_stopProgressAnimation();
        }
      } else if (targetPercent === 28) {
        // iOS/Windows MP4 cases: 0% → 28% (gap before download phase at 30%)
        if (elapsed <= 2.0) {
          // Smooth progress to target in 2 seconds
          newProgress = (elapsed / 2.0) * targetPercent;
          newProgress = Math.min(newProgress, targetPercent);
        } else {
          // Pause at target
          newProgress = targetPercent;
          this.#_stopProgressAnimation();
        }
      } else {
        if (elapsed <= 1.0) {
          // Phase 1: 0% → 60% trong 1s (smooth)
          newProgress = (elapsed / 1.0) * 60;
        } else if (elapsed <= 2.0) {
          // Phase 2: 60% → 90% trong 1s
          const segmentElapsed = elapsed - 1.0;
          newProgress = 60 + (segmentElapsed / 1.0) * 30;
        } else {
          // Phase 3: 90% → 95%, mỗi giây tăng 1%, max 95%
          const segmentElapsed = elapsed - 2.0;
          const additionalProgress = Math.min(segmentElapsed * 1, 5); // 1%/giây, max 5%
          newProgress = 90 + additionalProgress;
          newProgress = Math.min(newProgress, 95);

          if (newProgress >= 95) {
            this.#_stopProgressAnimation();
          }
        }
      }

      this.#currentProgress = newProgress;
      this.#_updateVisualProgress(newProgress);

    }, 100); // Update every 100ms for smooth animation


    return this;
  }

  /**
   * Complete extract phase directly to final target (skip download phase)
   * Polling: smooth to 30% → show download button, Non-polling: smooth to 100% → show download button
   */
  completeExtractToFull(onCompleteCallback) {
    this.#_clearAllTimers();
    this.#currentPhase = 'EXTRACT_COMPLETE';
    this.#onCompleteCallback = onCompleteCallback;

    const currentProgress = this.#currentProgress;

    // Determine target based on extract phase
    let targetProgress;
    if (this.#targetPercent === 25) {
      // Polling case: smooth to 30%
      targetProgress = 30;
    } else if (this.#targetPercent === 28) {
      // iOS/Windows MP4 case: smooth to 32% (gap from 28% extract target)
      targetProgress = 32;
    } else {
      // Other platforms: smooth to 100%
      targetProgress = 100;
    }


    const duration = 300; // 0.3s smooth transition
    const startTime = Date.now();

    const animateToComplete = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Animation complete
        this.#currentProgress = targetProgress;
        this.#_updateVisualProgress(targetProgress);

        // Hide and trigger callback immediately after reaching target
        this.hide();
        if (this.#onCompleteCallback) {
          this.#onCompleteCallback();
        }
        return;
      }

      // Smooth easing progress to target
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentStep = currentProgress + (targetProgress - currentProgress) * easedProgress;
      this.#currentProgress = currentStep;
      this.#_updateVisualProgress(currentStep);

      requestAnimationFrame(animateToComplete);
    };

    animateToComplete();
    return this;
  }

  /**
   * Resume to download phase - Updated for 5 distinct cases with platform-aware starting points
   * YouTube Polling: 25% → 30% → 100%
   * iOS: 28% → 32% → 100%
   * Windows: 28% → 32% → 100%
   * Others: 95% → 96% → 100%
   */
  resumeToDownloadPhase(status, payload = {}) {
    // 🔧 CRITICAL: Force stop extract phase to prevent rollback conflicts
    this.#_clearAllTimers();
    this.#_stopProgressAnimation(); // Additional safety stop
    this.#currentPhase = 'DOWNLOAD';
    this.#onCompleteCallback = payload.onComplete;

    // Determine starting point based on polling vs non-polling AND platform
    let startPoint;
    const isPolling = payload.isPolling || status === 'polling';

    // Platform detection using utilities
    const isIOSDevice = isIOS();
    const isWindowsDevice = isWindows();


    // 🎯 SIMPLE & SAFE: Use consistent start points with safe gaps
    if (isPolling) {
      startPoint = 25; // YouTube polling starts from 25%
    } else if (isIOSDevice || isWindowsDevice) {
      startPoint = 32; // iOS/Windows starts from 32% (gap from 28% extract target)
    } else {
      startPoint = 95; // Others start from 95%
    }

    // For iOS/Windows, use startPoint directly (no +1) to start at 32%
    const nextProgress = (isIOSDevice || isWindowsDevice) ? startPoint : startPoint + 1;
    const currentProgress = this.#currentProgress || 0;

    // 🛡️ ANTI-ROLLBACK: Only progress forward, never backward
    this.#currentProgress = Math.max(currentProgress, nextProgress);
    this.#_updateVisualProgress(this.#currentProgress);



    // Case 1: Static content → Jump to 100% immediately
    if (status === 'static') {
      this.#jumpTo100(300); // 0.3s animation
      return this;
    }

    // Case 2: iOS RAM download → Real progress tracking
    if (payload.isIOSRAM && payload.onProgress) {
      this.#startIOSRAMProgress(payload);
      return this;
    }

    // Case 3: Polling flow → Real progress tracking with 2-phase system
    if (status === 'polling') {
      this.#startPollingProgress(payload);
      return this;
    }

    // Case 3a: iOS large stream polling (legacy fallback) → Jump to 100%
    if (payload.isPolling) {
      this.#jumpTo100(300);
      return this;
    }

    // Case 4: Windows MP4 stream → Smooth stream progress
    if (payload.downloadMode === 'windows-mp4') {
      this.#startStreamProgress(payload, 'Windows MP4');
      return this;
    }

    // Case 5: Other stream content → Default stream progress
    if (status === 'stream') {
      this.#startStreamProgress(payload, 'Stream');
      return this;
    }

    // Fallback - shouldn't happen
    this.#jumpTo100(300);
    return this;
  }

  /**
   * Jump to 100% instantly
   */
  #jumpTo100(duration = 0) {
    // Update to 100% immediately without animation or delay
    this.#currentProgress = 100;
    this.#_updateVisualProgress(100);

    // Hide and trigger callback immediately
    this.hide();
    if (this.#onCompleteCallback) {
      this.#onCompleteCallback();
    }
  }

  /**
   * Handle iOS RAM download progress (30% → 100%)
   */
  #startIOSRAMProgress(payload) {
    const { onProgress } = payload;


    // onProgress callback from downloadStreamToRAM
    // progress shape: { loaded, total, percentage, loadedMB, totalMB, isComplete }


    if (typeof onProgress === 'function') {
      let startTime = Date.now();

      onProgress((streamProgress) => {

        let overallProgress;

        // Handle progress calculation based on available data
        if (streamProgress.percentage !== null && streamProgress.percentage !== undefined) {
          // Have percentage → map from 32% to 100% (68% range)
          overallProgress = 32 + (streamProgress.percentage * 0.68);
        } else {
          // No percentage → use fake progress based on time and loaded bytes
          const elapsed = Date.now() - startTime;
          const fakeProgress = Math.min(63, Math.log(elapsed / 1000 + 1) * 22); // Adjusted for 32% start (max 95%)
          overallProgress = 32 + fakeProgress;
        }

        this.#currentProgress = overallProgress;
        this.#_updateVisualProgress(overallProgress);

        // For iOS RAM download - show Converting with percentage (as user requested)
        if (this.#elements.mainStatusText) {
          const newText = `Converting... ${Math.floor(overallProgress)}%`;
          // Always show percentage format for iOS RAM downloads
          this.#elements.mainStatusText.textContent = newText;

          // Verify DOM update by re-querying
          const verifyElement = document.querySelector(`${this.#elements.wrapperSelector} .main-status-text`);

        } else {
        }

        // Progress detail text removed - showing only status + percentage

        // When complete
        if (streamProgress.isComplete) {
          // Ensure progress reaches 100% for completion
          this.#currentProgress = 100;
          this.#_updateVisualProgress(100);

          // Complete immediately without delay
          this.hide();
          if (this.#onCompleteCallback) {
            this.#onCompleteCallback();
          }
        }
      });
    } else {
    }
  }

  /**
   * Handle stream progress for Polling and Non-polling cases
   * iOS/Windows: 32% → 100%, Others: 96% → 100%
   * Uses smooth animation since no real progress data available
   */
  #startStreamProgress(payload, streamType) {
    const { totalSize } = payload;
    const isWindowsMP4 = payload.downloadMode === 'windows-mp4';
    const isPolling = payload.isPolling;

    // Determine starting point based on platform
    let startProgress;
    if (isWindowsMP4) {
      startProgress = 32; // Windows MP4 starts from 32%
    } else if (isPolling) {
      startProgress = 26; // Polling starts from 26%
    } else {
      startProgress = 96; // Others start from 96%
    }
    const targetProgress = 100;

    // Adjust duration based on progress range
    const duration = (isWindowsMP4 || isPolling) ? 2500 : 1000; // Longer for polling cases


    const startTime = Date.now();

    const animateProgress = () => {
      const elapsed = Date.now() - startTime;
      const progress = elapsed / duration;

      if (progress >= 1) {
        // Animation complete
        this.#currentProgress = targetProgress;
        this.#_updateVisualProgress(targetProgress);

        // Progress detail text removed - showing only status + percentage

        // Complete immediately without delay
        this.hide();
        if (this.#onCompleteCallback) {
          this.#onCompleteCallback();
        }
        return;
      }

      // Smooth easing progress (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentProgress = startProgress + (targetProgress - startProgress) * easedProgress;

      this.#currentProgress = currentProgress;
      this.#_updateVisualProgress(currentProgress);

      // Progress detail text removed - showing only status + percentage

      // Continue animation
      requestAnimationFrame(animateProgress);
    };

    // Start animation
    animateProgress();
  }

  /**
   * Start polling progress with 2-phase system support
   * Handles both processing (30% → 65-90%) and merging (65-90% → 100%) phases
   */
  #startPollingProgress(payload) {
    this.#currentPhase = 'POLLING';

    // Store callbacks for external updates
    this.#pollingCallbacks = {
      onProgress: payload.onProgress,
      onPhaseTransition: payload.onPhaseTransition,
      onComplete: payload.onComplete
    };

    // Keep progress bar visible and ready for external updates
    // Progress will be updated via updatePollingProgress() method
  }

  /**
   * Update polling progress from external API data
   * Called by convert logic when polling receives progress updates
   */
  updatePollingProgress(apiData, currentPhase) {
    if (this.#currentPhase !== 'POLLING') {
      return;
    }


    // Update the visual progress bar (the actual percentage will be calculated by PollingProgressMapper)
    // For now, we'll update the status text based on the phase
    if (currentPhase === 'processing') {
      const { videoProgress, audioProgress } = apiData;

    } else if (currentPhase === 'merging') {
    }

    // Call the callback if provided
    if (this.#pollingCallbacks.onProgress) {
      this.#pollingCallbacks.onProgress(this.#currentProgress, currentPhase);
    }
  }

  /**
   * Set polling progress with smooth animation between values
   */
  setPollingProgress(progress, statusText = null) {
    if (this.#currentPhase !== 'POLLING') {
      return;
    }

    // Update status text immediately
    if (statusText && this.#elements.progressStatusText) {
      this.#elements.progressStatusText.textContent = statusText;
    }

    // Animate smoothly from current progress to new progress
    const currentProgress = this.#currentProgress;
    const targetProgress = progress;

    // Skip animation if difference is too small
    if (Math.abs(targetProgress - currentProgress) < 0.1) {
      this.#currentProgress = targetProgress;
      this.#_updateVisualProgress(targetProgress, true);
      return;
    }

    // Smooth animation between current and target
    const duration = 800; // 0.8s animation
    const startTime = Date.now();

    const animatePollingProgress = () => {
      const elapsed = Date.now() - startTime;
      const animationProgress = Math.min(elapsed / duration, 1);

      // Ease out animation
      const easedProgress = 1 - Math.pow(1 - animationProgress, 3);
      const currentStep = currentProgress + (targetProgress - currentProgress) * easedProgress;

      this.#currentProgress = currentStep;
      this.#_updateVisualProgress(currentStep, false); // No CSS transition, using JS animation

      if (animationProgress < 1) {
        requestAnimationFrame(animatePollingProgress);
      } else {
        this.#currentProgress = targetProgress;
        this.#_updateVisualProgress(targetProgress, false);
      }
    };

    animatePollingProgress();
  }

  /**
   * Complete polling progress and trigger completion
   */
  completePollingProgress() {
    // Force to 100% immediately
    this.#currentProgress = 100;
    this.#_updateVisualProgress(100);

    // Complete immediately without delay
    this.hide();

    // Trigger completion callbacks
    if (this.#pollingCallbacks.onComplete) {
      this.#pollingCallbacks.onComplete();
    }
    if (this.#onCompleteCallback) {
      this.#onCompleteCallback();
    }
  }

  getCurrentProgress = () => this.#currentProgress;
  isRunning = () => this.#isRunning;
  isVisible = () => this.#isVisible;
}
