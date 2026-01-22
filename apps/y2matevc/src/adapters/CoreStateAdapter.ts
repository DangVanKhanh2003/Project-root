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

    updateConversionTask(formatId, {
      state: updates.state as any, // Type cast for compatibility
      statusText: updates.statusText,
      progress: updates.progress,
      downloadUrl: updates.downloadUrl,
      error: updates.error,
      completedAt: updates.completedAt,
      showProgressBar: updates.showProgressBar,
      ramBlob: updates.ramBlob,
      filename: updates.filename,
      // Pass through any custom fields
      ...updates
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
