/**
 * Multifile Download SSE Handler
 * Handles Server-Sent Events connection for real-time progress updates
 * Browser-only (uses EventSource API) but NOT DOM-dependent
 */

import { SSE_EVENTS, MULTIFILE_TIMEOUTS } from './constants';

// ============================================================
// TYPES
// ============================================================

export interface SSEProgressData {
  progress?: number;
  message?: string;
  details?: {
    current?: number;
    total?: number;
  };
}

export interface SSECompleteData {
  downloadUrl?: string;
  message?: string;
}

export interface SSEErrorData {
  error?: string;
  message?: string;
}

export interface SSECallbacks {
  onConnected?: (data: any) => void;
  onDecryptProgress?: (data: SSEProgressData) => void;
  onDownloadProgress?: (data: SSEProgressData) => void;
  onZipProgress?: (data: SSEProgressData) => void;
  onComplete?: (data: SSECompleteData) => void;
  onError?: (error: Error) => void;
}

export interface SSEManager {
  close: () => void;
  isActive: () => boolean;
  isConnected: () => boolean;
  isClosed: () => boolean;
}

// ============================================================
// SSE CONNECTION MANAGER
// ============================================================

/**
 * Create SSE connection manager for multifile download
 */
export function createSSEManager(
  sessionId: string,
  streamBaseUrl: string,
  streamPath: string,
  callbacks: SSECallbacks = {}
): SSEManager {
  // Internal state
  let eventSource: EventSource | null = null;
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null;
  let connectionTimeout: ReturnType<typeof setTimeout> | null = null;
  let isConnected = false;
  let isClosed = false;

  // Build stream URL
  const streamUrl = `${streamBaseUrl}${streamPath}/${sessionId}`;

  /**
   * Start SSE connection
   */
  function connect(): void {
    if (isConnected || isClosed) {
      return;
    }

    try {
      eventSource = new EventSource(streamUrl);

      // Set connection timeout
      connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          handleError(new Error('Connection timeout'));
          close();
        }
      }, MULTIFILE_TIMEOUTS.SSE_TIMEOUT);

      // Register event listeners
      setupEventListeners();
    } catch (error) {
      handleError(error instanceof Error ? error : new Error(String(error)));
    }
  }

  /**
   * Setup all SSE event listeners
   */
  function setupEventListeners(): void {
    if (!eventSource) return;

    // Standard events
    eventSource.addEventListener('open', handleOpen);
    eventSource.addEventListener('error', handleConnectionError);

    // Custom events
    eventSource.addEventListener(SSE_EVENTS.CONNECTED, handleConnected);
    eventSource.addEventListener(SSE_EVENTS.DECRYPT_PROGRESS, handleDecryptProgress);
    eventSource.addEventListener(SSE_EVENTS.DOWNLOAD_PROGRESS, handleDownloadProgress);
    eventSource.addEventListener(SSE_EVENTS.ZIP_PROGRESS, handleZipProgress);
    eventSource.addEventListener(SSE_EVENTS.COMPLETE, handleComplete);
    eventSource.addEventListener(SSE_EVENTS.ERROR, handleEventError);
  }

  /**
   * Handle connection open
   */
  function handleOpen(): void {
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }
  }

  /**
   * Handle connected event from server
   */
  function handleConnected(event: Event): void {
    isConnected = true;
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
    }

    try {
      const messageEvent = event as MessageEvent;
      const data = JSON.parse(messageEvent.data);

      if (typeof callbacks.onConnected === 'function') {
        callbacks.onConnected(data);
      }

      // Start heartbeat monitoring
      resetHeartbeat();
    } catch (error) {
    }
  }

  /**
   * Handle decrypt progress event
   */
  function handleDecryptProgress(event: Event): void {
    try {
      const messageEvent = event as MessageEvent;
      const data: SSEProgressData = JSON.parse(messageEvent.data);

      if (typeof callbacks.onDecryptProgress === 'function') {
        callbacks.onDecryptProgress(data);
      }

      resetHeartbeat();
    } catch (error) {
    }
  }

  /**
   * Handle download progress event
   */
  function handleDownloadProgress(event: Event): void {
    try {
      const messageEvent = event as MessageEvent;
      const data: SSEProgressData = JSON.parse(messageEvent.data);

      if (typeof callbacks.onDownloadProgress === 'function') {
        callbacks.onDownloadProgress(data);
      }

      resetHeartbeat();
    } catch (error) {
    }
  }

  /**
   * Handle ZIP progress event
   */
  function handleZipProgress(event: Event): void {
    try {
      const messageEvent = event as MessageEvent;
      const data: SSEProgressData = JSON.parse(messageEvent.data);

      if (typeof callbacks.onZipProgress === 'function') {
        callbacks.onZipProgress(data);
      }

      resetHeartbeat();
    } catch (error) {
    }
  }

  /**
   * Handle complete event
   */
  function handleComplete(event: Event): void {
    try {
      const messageEvent = event as MessageEvent;
      const data: SSECompleteData = JSON.parse(messageEvent.data);

      if (typeof callbacks.onComplete === 'function') {
        callbacks.onComplete(data);
      }

      // Close connection after completion
      setTimeout(() => close(), 1000);
    } catch (error) {
    }
  }

  /**
   * Handle error event from server
   */
  function handleEventError(event: Event): void {
    const messageEvent = event as MessageEvent;
    const rawData =
      typeof messageEvent?.data === 'string' ? messageEvent.data.trim() : String(messageEvent?.data ?? '').trim();

    if (!rawData || rawData === 'undefined') {
      handleError(new Error('Unknown server error'));
      setTimeout(() => close(), 1000);
      return;
    }

    try {
      const data: SSEErrorData = JSON.parse(rawData);

      handleError(new Error(data.error || 'Unknown server error'));

      // Close connection after error
      setTimeout(() => close(), 1000);
    } catch (error) {
      handleError(new Error('Unknown server error'));
      setTimeout(() => close(), 1000);
    }
  }

  /**
   * Handle connection error
   */
  function handleConnectionError(): void {
    // Check if connection was ever established
    if (!isConnected) {
      handleError(new Error('Failed to establish connection'));
      close();
    }
    // Auto-reconnect will be handled by browser
  }

  /**
   * Handle error and trigger callback
   */
  function handleError(error: Error): void {
    if (typeof callbacks.onError === 'function') {
      callbacks.onError(error);
    }
  }

  /**
   * Reset heartbeat timer
   */
  function resetHeartbeat(): void {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
    }

    heartbeatTimer = setTimeout(() => {
      // Don't close automatically, browser will handle reconnection
    }, MULTIFILE_TIMEOUTS.SSE_HEARTBEAT * 2);
  }

  /**
   * Close SSE connection
   */
  function close(): void {
    if (isClosed) {
      return;
    }

    isClosed = true;
    isConnected = false;

    // Clear timers
    if (connectionTimeout) {
      clearTimeout(connectionTimeout);
      connectionTimeout = null;
    }

    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer);
      heartbeatTimer = null;
    }

    // Close EventSource
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  }

  /**
   * Check if connection is active
   */
  function isActive(): boolean {
    return isConnected && !isClosed;
  }

  // Auto-connect on creation
  connect();

  // Return public API
  return {
    close,
    isActive,
    isConnected: () => isConnected,
    isClosed: () => isClosed,
  };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create default callbacks with logging
 */
export function createDefaultCallbacks(): SSECallbacks {
  return {
    onConnected: (data) => {
    },
    onDecryptProgress: (data) => {
    },
    onDownloadProgress: (data) => {
    },
    onZipProgress: (data) => {
    },
    onComplete: (data) => {
    },
    onError: (error) => {
    },
  };
}
