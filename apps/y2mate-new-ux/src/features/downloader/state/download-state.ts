/**
 * Download State Functions
 * Manages download task states and download status tracking
 */

import type { DownloadTask, DownloadTaskStatus, DownloadCounts } from './types';
import { getState, setState } from './state-manager';

/**
 * Update download task state for a specific format
 * @param formatId - Unique format identifier
 * @param taskState - Task state object
 */
export function updateTaskState(
  formatId: string,
  taskState: { status: DownloadTaskStatus; message?: string }
): void {
  if (!formatId || !taskState || !taskState.status) {
    return;
  }

  const validStatuses: DownloadTaskStatus[] = ['idle', 'loading', 'downloaded', 'error'];
  if (!validStatuses.includes(taskState.status)) {
    return;
  }

  const currentState = getState();
  const updatedTasks: Record<string, DownloadTask> = {
    ...currentState.downloadTasks,
    [formatId]: {
      status: taskState.status,
      message: taskState.message || null,
      timestamp: new Date().toISOString()
    }
  };

  setState({ downloadTasks: updatedTasks });
}

/**
 * Get download task state for a specific format
 * @param formatId - Unique format identifier
 * @returns Task state object or default idle state
 */
export function getTaskState(formatId: string): DownloadTask {
  const state = getState();
  return state.downloadTasks[formatId] || { status: 'idle', message: null, timestamp: '' };
}

/**
 * Check if any downloads are currently in progress
 * @returns True if any download is loading
 */
export function hasActiveDownloads(): boolean {
  const state = getState();
  return Object.values(state.downloadTasks).some(task => task.status === 'loading');
}

/**
 * Get count of downloads by status
 * @returns Count object
 */
export function getDownloadCounts(): DownloadCounts {
  const state = getState();
  const counts: DownloadCounts = { idle: 0, loading: 0, downloaded: 0, error: 0 };

  Object.values(state.downloadTasks).forEach(task => {
    if (counts.hasOwnProperty(task.status)) {
      counts[task.status]++;
    }
  });

  return counts;
}

/**
 * Clear all download states (reset download tasks)
 */
export function clearDownloadStates(): void {
  setState({
    downloadTasks: {}
  });
}
