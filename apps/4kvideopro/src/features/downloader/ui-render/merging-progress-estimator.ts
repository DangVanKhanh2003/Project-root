/**
 * Merging Progress Estimator
 *
 * CSS handles smooth animation from 0% → 98% in 40s
 * - 0% → 50% in 15s (37.5%)
 * - 50% → 98% in 25s (62.5%)
 * - Complete: 100% in 0.5s
 */

export interface MergingEstimator {
  start: (onProgress: (progress: number) => void) => void;
  stop: () => void;
  complete: () => void;
  getProgress: () => number;
  isRunning: () => boolean;
}

export function createMergingEstimator(): MergingEstimator {
  let currentProgress = 0;
  let running = false;
  let onProgressCallback: ((progress: number) => void) | null = null;
  const MAX_PROGRESS = 98;

  function start(onProgress: (progress: number) => void): void {
    if (running) return;
    running = true;
    currentProgress = MAX_PROGRESS;
    onProgressCallback = onProgress;
    onProgress(MAX_PROGRESS);
  }

  function stop(): void {
    running = false;
    onProgressCallback = null;
  }

  function complete(): void {
    currentProgress = 100;
    if (onProgressCallback) onProgressCallback(100);
    stop();
  }

  function getProgress(): number {
    return Math.round(currentProgress);
  }

  function isRunning(): boolean {
    return running;
  }

  return { start, stop, complete, getProgress, isRunning };
}

const estimators = new Map<string, MergingEstimator>();

export function getMergingEstimator(formatId: string): MergingEstimator {
  let estimator = estimators.get(formatId);
  if (!estimator) {
    estimator = createMergingEstimator();
    estimators.set(formatId, estimator);
  }
  return estimator;
}

export function clearMergingEstimator(formatId: string): void {
  const estimator = estimators.get(formatId);
  if (estimator) {
    estimator.stop();
    estimators.delete(formatId);
  }
}

export function clearAllMergingEstimators(): void {
  estimators.forEach(estimator => estimator.stop());
  estimators.clear();
}
