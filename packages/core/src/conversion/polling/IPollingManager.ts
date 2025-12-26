/**
 * IPollingManager Interface
 *
 * Dependency injection interface for polling manager.
 * Allows PollingStrategy to work without direct dependency on infrastructure.
 */

export interface PollingOptions {
  progressUrl: string;
  onProgressUpdate: (data: PollingProgressData) => void;
  onStatusUpdate: (result: PollingStatusResult) => void;
}

export interface PollingProgressData {
  videoProgress: number;
  audioProgress: number;
  status: string;
  mergedUrl?: string;
}

export interface PollingStatusResult {
  mergedUrl?: string;
  [key: string]: any;
}

/**
 * Polling manager interface for DI
 */
export interface IPollingManager {
  /**
   * Start polling for a task
   */
  startPolling(taskId: string, options: PollingOptions): void;

  /**
   * Stop polling for a task
   */
  stopPolling(taskId: string): void;
}
