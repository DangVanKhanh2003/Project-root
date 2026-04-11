/**
 * Multifile State Functions
 * Manages multifile download sessions, progress tracking, and state transitions
 */

import type {
  MultifileSession,
  MultifileSessionState,
  MultifileProgress
} from './types';
import { getState, setState } from './state-manager';

/**
 * Set multifile session data
 * @param sessionData - Session data from API
 */
export function setMultifileSession(sessionData: Omit<MultifileSession, 'state' | 'progress'>): void {
  setState({
    multifileSession: {
      ...sessionData,
      state: 'PREPARING' as MultifileSessionState, // Initial state
      progress: {
        decrypt: 0,
        download: 0,
        zip: 0,
        overall: 0
      }
    }
  });
}

/**
 * Update multifile session progress
 * @param progressData - Progress data from SSE
 */
export function updateMultifileProgress(progressData: Partial<MultifileProgress>): void {
  const current = getState().multifileSession;
  if (!current) return;

  setState({
    multifileSession: {
      ...current,
      progress: {
        ...current.progress,
        ...progressData
      }
    }
  });
}

/**
 * Update multifile session state
 * @param state - New state
 */
export function setMultifileState(state: MultifileSessionState): void {
  const current = getState().multifileSession;
  if (!current) return;

  setState({
    multifileSession: {
      ...current,
      state
    }
  });
}

/**
 * Set multifile download URL and expire time
 * @param downloadUrl - Download URL from complete event
 * @param expireTime - Timestamp when link expires
 */
export function setMultifileDownloadUrl(downloadUrl: string, expireTime: number): void {
  const current = getState().multifileSession;
  if (!current) return;

  setState({
    multifileSession: {
      ...current,
      downloadUrl,
      expireTime,
      state: 'READY'
    }
  });
}

/**
 * Set multifile session error
 * @param error - Error message
 */
export function setMultifileError(error: string): void {
  const current = getState().multifileSession;
  if (!current) return;

  setState({
    multifileSession: {
      ...current,
      error,
      state: 'ERROR'
    }
  });
}

/**
 * Mark multifile session as expired
 */
export function setMultifileExpired(): void {
  const current = getState().multifileSession;
  if (!current) return;

  setState({
    multifileSession: {
      ...current,
      state: 'EXPIRED'
    }
  });
}

/**
 * Clear multifile session
 * @param silent - If true, clear without triggering setState (prevents render cycle)
 */
export function clearMultifileSession(silent: boolean = false): void {
  if (silent) {
    // Direct state modification without triggering renders
    // Note: This is a special case for cleanup scenarios
    // Access to currentState needs to be handled carefully
    const currentState = getState() as any;
    currentState.multifileSession = null;
  } else {
    // Normal clear with UI update
    setState({
      multifileSession: null
    });
  }
}

/**
 * Get multifile session data
 * @returns Current multifile session
 */
export function getMultifileSession(): MultifileSession | null {
  return getState().multifileSession;
}
