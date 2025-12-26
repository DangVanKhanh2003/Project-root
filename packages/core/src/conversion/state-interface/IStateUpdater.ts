/**
 * State Updater Interface
 *
 * Apps implement this interface to connect core conversion strategies
 * with their app-specific state management.
 *
 * This interface provides decoupling between core business logic (strategies)
 * and app-specific infrastructure (state management).
 */

/**
 * State update data - partial updates to conversion task
 */
export interface StateUpdate {
  state?: string;               // Task state: 'idle', 'extracting', 'polling', 'success', 'failed', etc.
  statusText?: string;          // Status text to display to user
  progress?: number;            // Progress percentage (0-100)
  downloadUrl?: string;         // Final download URL (when success)
  error?: string;               // Error message (when failed)
  completedAt?: number;         // Timestamp when task completed
  showProgressBar?: boolean;    // Whether to show progress bar in UI
  ramBlob?: Blob;               // RAM blob for iOS download
  filename?: string;            // Filename for download
  [key: string]: any;           // Allow app-specific extensions
}

/**
 * Minimal task data that strategies need to read
 */
export interface TaskData {
  id: string;                   // Task/format identifier
  state: string;                // Current state
  abortController: AbortController;  // Abort controller for cancellation
  [key: string]: any;           // Allow app-specific fields
}

/**
 * State Updater Interface
 *
 * Apps must implement this to provide state management for strategies.
 */
export interface IStateUpdater {
  /**
   * Update conversion task state
   *
   * @param formatId - Format identifier (unique task ID)
   * @param updates - Partial updates to apply to task
   *
   * @example
   * ```typescript
   * stateUpdater.updateTask('audio|mp3-320kbps', {
   *   state: 'polling',
   *   progress: 50,
   *   statusText: 'Converting... 50%'
   * });
   * ```
   */
  updateTask(formatId: string, updates: StateUpdate): void;

  /**
   * Get conversion task data
   *
   * Used by strategies to:
   * - Check abort signal status
   * - Read current task state
   *
   * @param formatId - Format identifier
   * @returns Task data or null if not found
   *
   * @example
   * ```typescript
   * const task = stateUpdater.getTask('audio|mp3-320kbps');
   * if (task?.abortController.signal.aborted) {
   *   return; // Task was cancelled
   * }
   * ```
   */
  getTask(formatId: string): TaskData | null;
}
