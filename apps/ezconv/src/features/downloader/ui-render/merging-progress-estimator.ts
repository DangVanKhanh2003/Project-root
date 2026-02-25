/**
 * Merging Progress Estimator
 *
 * CSS handles smooth animation from 0% → 98% in 50s
 * JS only sets target once, no continuous updates needed
 *
 * - Start: set 98% immediately, CSS animates over 50s
 * - Complete: add completing class, set 100%
 */

export interface MergingEstimator {
  start: (onProgress: (progress: number) => void) => void;
  stop: () => void;
  complete: () => void;
  getProgress: () => number;
  isRunning: () => boolean;
}

/**
 * Create a merging progress estimator
 */
export function createMergingEstimator(): MergingEstimator {
  let currentProgress = 0;
  let running = false;
  let onProgressCallback: ((progress: number) => void) | null = null;
  let intervalId: number | null = null;
  let startTime = 0;

  function start(onProgress: (progress: number) => void): void {
    if (running) return;

    running = true;
    currentProgress = 0;
    onProgressCallback = onProgress;
    startTime = Date.now();

    // Initial update
    onProgress(0);

    // Tick every 100ms
    intervalId = window.setInterval(() => {
      const elapsed = (Date.now() - startTime) / 1000; // seconds

      let target = 0;
      if (elapsed <= 15) {
        // Phase 1: 0 -> 50% in 15s (Linear)
        target = (elapsed / 15) * 50;
      } else if (elapsed <= 40) {
        // Phase 2: 50 -> 98% in 25s (Linear)
        const phase2Elapsed = elapsed - 15;
        target = 50 + (phase2Elapsed / 25) * 48;
      } else {
        // Cap at 98%
        target = 98;
      }

      // Ensure we don't go backwards or exceed 98
      target = Math.min(98, Math.max(currentProgress, target));
      
      const rounded = Math.round(target);
      if (Math.round(currentProgress) !== rounded) {
         currentProgress = target; // Update internal float
         if (onProgressCallback) {
            onProgressCallback(rounded);
         }
      } else {
         currentProgress = target; // Just update internal float
      }

    }, 100);
  }

  function stop(): void {
    running = false;
    onProgressCallback = null;
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
  }

  function complete(): void {
    // Jump to 100% when API returns complete
    stop(); // Stop the interval
    currentProgress = 100;
    // We don't callback here because download-rendering handles the final success state manually
    // via status--success class and explicit text update if needed, 
    // but semantically the estimator is done.
  }

  function getProgress(): number {
    return Math.round(currentProgress);
  }

  function isRunning(): boolean {
    return running;
  }

  return {
    start,
    stop,
    complete,
    getProgress,
    isRunning
  };
}

// Singleton instance per formatId
const estimators = new Map<string, MergingEstimator>();

/**
 * Get or create merging estimator for a format
 */
export function getMergingEstimator(formatId: string): MergingEstimator {
  let estimator = estimators.get(formatId);
  if (!estimator) {
    estimator = createMergingEstimator();
    estimators.set(formatId, estimator);
  }
  return estimator;
}

/**
 * Clear merging estimator for a format
 */
export function clearMergingEstimator(formatId: string): void {
  const estimator = estimators.get(formatId);
  if (estimator) {
    estimator.stop();
    estimators.delete(formatId);
  }
}

/**
 * Clear all merging estimators
 */
export function clearAllMergingEstimators(): void {
  estimators.forEach(estimator => estimator.stop());
  estimators.clear();
}
