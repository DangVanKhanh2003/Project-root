/**
 * Multifile Download Orchestrator (Core Business Logic)
 * Manages multifile download sessions, SSE connections, and state flow
 * NO DOM manipulation - all UI updates via callbacks
 * NO direct state.js imports - state management via callbacks
 */

import { createSSEManager, SSECallbacks, SSEProgressData, SSECompleteData } from './sse-manager';
import {
  MULTIFILE_STATES,
  MULTIFILE_TIMEOUTS,
  UI_MESSAGES,
  ERROR_MESSAGES,
  validateUrlCount,
  calculateOverallProgress,
  isExpired,
  MultifileState,
} from './constants';

// ============================================================
// TYPES
// ============================================================

export interface SessionData {
  sessionId: string;
  streamUrl: string;
  downloadUrl?: string;
  expiresAt: number;
  state: MultifileState;
}

export interface StateChangeData {
  state: MultifileState;
  message: string;
  phase?: string;
  details?: any;
  progress?: number;
  session: SessionData | null;
}

export interface ProgressUpdateData {
  decrypt?: number;
  download?: number;
  zip?: number;
  overall: number;
}

export interface CompleteData {
  downloadUrl?: string;
  expiresAt: number;
  selectedUrls: string[];
}

export interface OrchestratorCallbacks {
  onSessionUpdate?: (session: SessionData) => void;
  onProgressUpdate?: (progress: ProgressUpdateData) => void;
  onStateChange?: (data: StateChangeData) => void;
  onError?: (message: string) => void;
  onComplete?: (data: CompleteData) => void;
  onExpired?: () => void;
}

export interface MultifileService {
  startMultifileSession: (urls: string[]) => Promise<{
    ok: boolean;
    message: string;
    data?: {
      session_id: string;
      stream_url: string;
      expires_at: number;
    };
  }>;
}

export interface OrchestratorConfig {
  service: MultifileService;
  apiBaseUrl: string;
  streamPath: string;
}

export interface MultifileOrchestrator {
  startSession: (encryptedUrls: string[]) => Promise<void>;
  retry: () => Promise<void>;
  cancel: () => void;
  cleanup: () => void;
  getSession: () => SessionData | null;
  getSelectedUrls: () => string[];
}

// ============================================================
// ORCHESTRATOR
// ============================================================

/**
 * Create multifile download orchestrator
 */
export function createMultifileOrchestrator(
  config: OrchestratorConfig,
  callbacks: OrchestratorCallbacks = {}
): MultifileOrchestrator {
  const { service, apiBaseUrl, streamPath } = config;
  const { onSessionUpdate, onProgressUpdate, onStateChange, onError, onComplete, onExpired } = callbacks;

  // Internal state
  let sseManager: ReturnType<typeof createSSEManager> | null = null;
  let countdownTimer: ReturnType<typeof setInterval> | null = null;
  let selectedUrls: string[] = [];
  let sessionData: SessionData | null = null;

  /**
   * Start multifile download session
   */
  async function startSession(encryptedUrls: string[]): Promise<void> {
    // Validate
    const validation = validateUrlCount(encryptedUrls.length);
    if (!validation.valid) {
      notifyError(validation.error || ERROR_MESSAGES.INVALID_URL_COUNT);
      return;
    }

    // Store URLs
    selectedUrls = encryptedUrls;

    // Notify preparing state
    notifyStateChange(MULTIFILE_STATES.PREPARING, {
      message: `Preparing ${encryptedUrls.length} files...`,
    });

    try {
      const result = await service.startMultifileSession(encryptedUrls);


      if (!result.ok) {
        notifyError(result.message);
        return;
      }

      // Store session data

      // Handle nested API response: { success, data: { session_id, ... } }
      const responseData = result.data as any;
      const innerData = responseData.data || responseData; // Support both wrapped and unwrapped
      const { session_id, stream_url, expires_at } = innerData;


      sessionData = {
        sessionId: session_id,
        streamUrl: stream_url,
        expiresAt: expires_at,
        state: MULTIFILE_STATES.PREPARING,
      };


      // Notify session created
      if (onSessionUpdate) {
        onSessionUpdate(sessionData);
      }

      // Connect SSE
      connectSSE(session_id);
    } catch (error) {
      notifyError(error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }

  /**
   * Connect SSE for real-time progress
   */
  function connectSSE(sessionId: string): void {
    if (sseManager) {
      sseManager.close();
    }

    const sseCallbacks: SSECallbacks = {
      onConnected: handleConnected,
      onDecryptProgress: handleDecryptProgress,
      onDownloadProgress: handleDownloadProgress,
      onZipProgress: handleZipProgress,
      onComplete: handleComplete,
      onError: handleSSEError,
    };

    sseManager = createSSEManager(sessionId, apiBaseUrl, streamPath, sseCallbacks);
  }

  function handleConnected(data: any): void {
    notifyStateChange(MULTIFILE_STATES.PREPARING, {
      message: data?.message,
      phase: 'connected',
    });
  }

  function handleDecryptProgress(data: SSEProgressData): void {
    const overall = calculateOverallProgress(data.progress ?? 0, 0, 0);

    // Notify progress update
    if (onProgressUpdate) {
      onProgressUpdate({
        decrypt: data.progress ?? 0,
        overall,
      });
    }

    notifyStateChange(MULTIFILE_STATES.PREPARING, {
      message: data?.message,
      phase: 'decrypt',
      details: data?.details,
      progress: overall,
    });
  }

  function handleDownloadProgress(data: SSEProgressData): void {
    const overall = calculateOverallProgress(100, data.progress ?? 0, 0);

    // Notify progress update
    if (onProgressUpdate) {
      onProgressUpdate({
        download: data.progress ?? 0,
        overall,
      });
    }

    // Transform message: treat download phase as "Preparing"
    const msg = formatPreparingMessage(data?.details, data?.progress, data?.message);

    notifyStateChange(MULTIFILE_STATES.CONVERTING, {
      message: msg,
      phase: 'download',
      details: data?.details,
      progress: overall,
    });
  }

  function handleZipProgress(data: SSEProgressData): void {
    const overall = calculateOverallProgress(100, 100, data.progress ?? 0);

    // Notify progress update
    if (onProgressUpdate) {
      onProgressUpdate({
        zip: data.progress ?? 0,
        overall,
      });
    }

    notifyStateChange(MULTIFILE_STATES.ZIPPING, {
      message: data?.message,
      phase: 'zip',
      details: data?.details,
      progress: overall,
    });
  }

  function handleComplete(data: SSECompleteData): void {
    const { downloadUrl } = data || {};
    const expireTime = Date.now() + MULTIFILE_TIMEOUTS.DOWNLOAD_LINK_EXPIRE;

    // Update session data
    if (downloadUrl) {
      sessionData = {
        ...sessionData!,
        downloadUrl,
        expiresAt: expireTime,
        state: MULTIFILE_STATES.READY,
      };

      // Notify session update
      if (onSessionUpdate) {
        onSessionUpdate(sessionData);
      }
    }

    // Notify complete
    if (onComplete) {
      onComplete({
        downloadUrl,
        expiresAt: expireTime,
        selectedUrls,
      });
    }

    notifyStateChange(MULTIFILE_STATES.READY, {
      message: UI_MESSAGES[MULTIFILE_STATES.READY],
    });

    // Start countdown timer
    startCountdownTimer(expireTime);

    // Close SSE
    if (sseManager) {
      sseManager.close();
      sseManager = null;
    }
  }

  function handleSSEError(error: Error): void {
    notifyError(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
  }

  /**
   * Countdown timer for download link expiration
   */
  function startCountdownTimer(expireTime: number): void {
    if (countdownTimer) {
      clearInterval(countdownTimer);
    }

    checkExpiration(expireTime);

    countdownTimer = setInterval(() => {
      checkExpiration(expireTime);
    }, MULTIFILE_TIMEOUTS.COUNTDOWN_CHECK_INTERVAL);
  }

  function checkExpiration(expireTime: number): void {
    if (isExpired(expireTime)) {
      // Update session state
      if (sessionData) {
        sessionData.state = MULTIFILE_STATES.EXPIRED;
      }

      // Notify expired
      if (onExpired) {
        onExpired();
      }

      notifyStateChange(MULTIFILE_STATES.EXPIRED, {
        message: UI_MESSAGES[MULTIFILE_STATES.EXPIRED],
      });

      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }
  }

  /**
   * Helper to format preparing messages
   */
  function formatPreparingMessage(details: any, progress: any, fallbackMsg: any): string {
    const pct = typeof progress === 'number' ? Math.max(0, Math.min(100, Math.round(progress))) : undefined;

    if (details && typeof details.current === 'number' && typeof details.total === 'number') {
      if (typeof pct === 'number') {
        return `Preparing files... ${details.current}/${details.total} (${pct}%)`;
      }
      return `Preparing files... ${details.current}/${details.total}`;
    }

    if (typeof pct === 'number') {
      return `Preparing... ${pct}%`;
    }

    if (fallbackMsg && typeof fallbackMsg === 'string') {
      return fallbackMsg.replace(/^Downloading/i, 'Preparing');
    }

    return 'Preparing...';
  }

  /**
   * Notify state change
   */
  function notifyStateChange(state: MultifileState, extra: Partial<StateChangeData> = {}): void {
    if (sessionData) {
      sessionData.state = state;
    }

    if (onStateChange) {
      onStateChange({
        state,
        message: extra.message || UI_MESSAGES[state] || state,
        phase: extra.phase,
        details: extra.details,
        progress: extra.progress,
        session: sessionData,
      });
    }
  }

  /**
   * Notify error
   */
  function notifyError(message: string): void {
    if (sessionData) {
      sessionData.state = MULTIFILE_STATES.ERROR;
    }

    if (onError) {
      onError(message);
    }

    notifyStateChange(MULTIFILE_STATES.ERROR, {
      message,
    });
  }

  /**
   * Retry download
   */
  async function retry(): Promise<void> {
    if (selectedUrls.length === 0) {
      return;
    }

    cleanup();
    await startSession(selectedUrls);
  }

  /**
   * Cancel download
   */
  function cancel(): void {
    cleanup();
  }

  /**
   * Cleanup resources
   */
  function cleanup(): void {
    if (sseManager) {
      sseManager.close();
      sseManager = null;
    }

    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  /**
   * Get current session data
   */
  function getSession(): SessionData | null {
    return sessionData;
  }

  /**
   * Get selected URLs
   */
  function getSelectedUrls(): string[] {
    return [...selectedUrls];
  }

  // Return public API
  return {
    startSession,
    retry,
    cancel,
    cleanup,
    getSession,
    getSelectedUrls,
  };
}
