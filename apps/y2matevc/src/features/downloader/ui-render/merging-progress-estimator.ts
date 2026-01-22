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

  const MAX_PROGRESS = 98; // CSS will animate to this over 50s

  function start(onProgress: (progress: number) => void): void {
    if (running) return;

    running = true;
    currentProgress = MAX_PROGRESS;
    onProgressCallback = onProgress;

    // Set target immediately - CSS handles the 50s animation
    onProgress(MAX_PROGRESS);
  }

  function stop(): void {
    running = false;
    onProgressCallback = null;
  }

  function complete(): void {
    // Jump to 100% when API returns complete
    currentProgress = 100;
    if (onProgressCallback) {
      onProgressCallback(100);
    }
    stop();
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
