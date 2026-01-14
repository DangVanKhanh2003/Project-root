/**
 * Conversion State Functions
 * Manages concurrent conversion tasks and legacy active conversion state
 */

import type {
  ConversionTask,
  ConversionTaskState,
  ConversionStatus,
  ActiveConversion
} from './types';
import { getState, setState } from './state-manager';

// ==========================================
// Concurrent Conversion Task Management
// ==========================================

/**
 * Create or update a conversion task
 * @param formatId - Unique format identifier
 * @param taskData - Conversion task data
 */
export function setConversionTask(formatId: string, taskData: Partial<ConversionTask>): void {
  if (!formatId || !taskData) {
    return;
  }

  const currentState = getState();
  const updatedTasks: Record<string, ConversionTask> = {
    ...currentState.conversionTasks,
    [formatId]: {
      id: formatId,
      state: 'Idle',
      statusText: 'Ready to convert',
      showProgressBar: false,
      downloadUrl: null,
      error: null,
      createdAt: Date.now(),
      abortController: new AbortController(),
      ...taskData
    } as ConversionTask
  };

  setState({ conversionTasks: updatedTasks });
}

/**
 * Update specific conversion task state
 * @param formatId - Format identifier
 * @param updates - Partial updates to apply
 */
export function updateConversionTask(formatId: string, updates: Partial<ConversionTask>): void {
  if (!formatId || !updates) {
    return;
  }

  const currentState = getState();
  const existingTask = currentState.conversionTasks[formatId];

  if (!existingTask) {
    return;
  }

  const updatedTask: ConversionTask = { ...existingTask, ...updates };
  const updatedTasks: Record<string, ConversionTask> = {
    ...currentState.conversionTasks,
    [formatId]: updatedTask
  };

  setState({ conversionTasks: updatedTasks });
}

/**
 * Get conversion task by formatId
 * @param formatId - Format identifier
 * @returns Conversion task or null if not found
 */
export function getConversionTask(formatId: string): ConversionTask | null {
  const state = getState();
  return state.conversionTasks[formatId] || null;
}

/**
 * Remove conversion task
 * @param formatId - Format identifier
 */
export function removeConversionTask(formatId: string): void {
  if (!formatId) return;

  const currentState = getState();
  const { [formatId]: removed, ...remainingTasks } = currentState.conversionTasks;

  setState({ conversionTasks: remainingTasks });
}

/**
 * Get all conversion tasks
 * @returns All conversion tasks object
 */
export function getConversionTasks(): Record<string, ConversionTask> {
  const state = getState();
  return state.conversionTasks;
}

/**
 * Get all conversion tasks by state
 * @param taskState - Task state to filter by
 * @returns Array of conversion tasks
 */
export function getConversionTasksByState(taskState: ConversionTaskState): ConversionTask[] {
  const currentState = getState();
  return Object.values(currentState.conversionTasks).filter(task => task.state === taskState);
}

/**
 * Get conversion tasks status summary
 * @returns Status summary
 */
export function getConversionStatus(): ConversionStatus {
  const currentState = getState();
  const tasks = Object.values(currentState.conversionTasks);

  return {
    total: tasks.length,
    idle: tasks.filter(task => task.state === 'Idle').length,
    converting: tasks.filter(task => task.state === 'Converting').length,
    success: tasks.filter(task => task.state === 'Success').length,
    failed: tasks.filter(task => task.state === 'Failed').length,
    canceled: tasks.filter(task => task.state === 'Canceled').length
  };
}

/**
 * Clear all conversion tasks and abort active conversions
 */
export function clearConversionTasks(): void {
  const currentState = getState();
  const tasks = Object.values(currentState.conversionTasks);

  // Abort all active conversions to stop polling
  tasks.forEach(task => {
    if (task.abortController && !task.abortController.signal.aborted) {
      task.abortController.abort();
    }
  });

  setState({ conversionTasks: {} });
}

/**
 * Clear a single conversion task by formatId
 * @param formatId - Format identifier to clear
 */
export function clearConversionTask(formatId: string): void {
  if (!formatId) return;

  const currentState = getState();
  const task = currentState.conversionTasks[formatId];

  // Abort if active
  if (task?.abortController && !task.abortController.signal.aborted) {
    task.abortController.abort();
  }

  // Remove from tasks
  const { [formatId]: _, ...remainingTasks } = currentState.conversionTasks;
  setState({ conversionTasks: remainingTasks });
}

// ==========================================
// Legacy Active Conversion Management
// ==========================================

/**
 * Starts a new conversion process (legacy single conversion)
 * @param data - Conversion data
 */
export function startConversion(data: {
  videoTitle: string;
  format: string;
  quality: string;
  vid: string;
  key: string;
  encryptedUrl: string;
}): void {
  setState({
    activeConversion: {
      isConverting: true,
      error: null,
      downloadUrl: null,
      progress: 0,
      statusText: 'Starting…',
      videoTitle: data.videoTitle,
      format: data.format,
      quality: data.quality,
      vid: data.vid,
      key: data.key,
      encryptedUrl: data.encryptedUrl
    }
  });
}

/**
 * Updates the progress of the active conversion
 * @param progress - The new progress value (0-100)
 * @param statusText - The text to display
 */
export function updateConversionProgress(progress: number, statusText: string): void {
  const currentState = getState();
  if (!currentState.activeConversion) return;

  const newConversionState: ActiveConversion = {
    ...currentState.activeConversion,
    progress,
    statusText
  };
  setState({ activeConversion: newConversionState });
}

/**
 * Sets the active conversion to a success state
 * @param downloadUrl - The final download URL
 */
export function setConversionSuccess(downloadUrl: string): void {
  const currentState = getState();
  if (!currentState.activeConversion) return;

  const newConversionState: ActiveConversion = {
    ...currentState.activeConversion,
    isConverting: false,
    progress: 100,
    statusText: 'Completed',
    downloadUrl
  };
  setState({ activeConversion: newConversionState });
}

/**
 * Sets the active conversion to an error state
 * @param error - The error message
 */
export function setConversionError(error: string): void {
  const currentState = getState();
  if (!currentState.activeConversion) return;

  const newConversionState: ActiveConversion = {
    ...currentState.activeConversion,
    isConverting: false,
    error
  };
  setState({ activeConversion: newConversionState });
}

/**
 * Clears the active conversion, hiding the UI
 */
export function clearConversion(): void {
  setState({ activeConversion: null });
}
