/**
 * CoreStateAdapter
 *
 * Adapter that bridges @downloader/core strategies to app's state management.
 * Implements IStateUpdater interface for dependency injection.
 *
 * Phase 3A Integration - ytmp3-clone-3
 */

import type { IStateUpdater, StateUpdate, TaskData } from '@downloader/core/conversion';
import {
  updateConversionTask,
  getConversionTask
} from '../features/downloader/state';
import type { ConversionTaskState } from '../features/downloader/state/types';

/**
 * Adapter: Core strategies → App state management
 *
 * This adapter receives updates from core strategies and forwards them
 * to the app's state management system.
 */
export class CoreStateAdapter implements IStateUpdater {
  /**
   * Update task state
   *
   * Core strategies call this method to update progress, status, etc.
   * We forward these updates to the app's state.
   */
  updateTask(formatId: string, updates: StateUpdate): void {
    // Map core updates to app state
    // Core uses lowercase: 'idle', 'success', 'failed'
    // App uses lowercase too, so no conversion needed

    // Destructure to separate state from other fields
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { state, ...otherUpdates } = updates;

    // Only include state if it's explicitly provided (not undefined)
    // This prevents overwriting existing state during progress updates
    const stateUpdate = state !== undefined
      ? { state: state as ConversionTaskState }
      : {};

    updateConversionTask(formatId, {
      ...stateUpdate,
      statusText: otherUpdates.statusText,
      progress: otherUpdates.progress,
      downloadUrl: otherUpdates.downloadUrl,
      error: otherUpdates.error,
      completedAt: otherUpdates.completedAt,
      showProgressBar: otherUpdates.showProgressBar,
      ramBlob: otherUpdates.ramBlob,
      filename: otherUpdates.filename,
      // Pass through any custom fields (excluding state which is handled above)
      ...otherUpdates
    });
  }

  /**
   * Get task data
   *
   * Core strategies call this to check task status and abort signal.
   * Return null if task doesn't exist.
   */
  getTask(formatId: string): TaskData | null {
    const task = getConversionTask(formatId);
    if (!task) return null;

    return {
      id: formatId,
      state: task.state, // Already lowercase
      abortController: task.abortController
    };
  }
}
