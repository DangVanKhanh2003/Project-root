/**
 * Multifile Download Orchestrator (Core Business Logic)
 * Manages multifile download sessions, SSE connections, and state flow
 * NO DOM manipulation - all UI updates via callbacks
 * NO direct state.js imports - state management via callbacks
 */

import { createSSEManager } from './sse-manager.js';
import {
    MULTIFILE_STATES,
    MULTIFILE_TIMEOUTS,
    UI_MESSAGES,
    ERROR_MESSAGES,
    validateUrlCount,
    calculateOverallProgress,
    isExpired
} from './constants.js';

/**
 * Create multifile download orchestrator
 * @param {Object} config - Configuration
 * @param {Object} config.service - API service instance
 * @param {Object} callbacks - Event callbacks for state/UI updates
 * @returns {Object} Orchestrator instance with control methods
 */
export function createMultifileOrchestrator(config, callbacks = {}) {
    const { service } = config;
    const {
        onSessionUpdate,
        onProgressUpdate,
        onStateChange,
        onError,
        onComplete,
        onExpired
    } = callbacks;

    // Internal state
    let sseManager = null;
    let countdownTimer = null;
    let selectedUrls = [];
    let sessionData = null;

    /**
     * Start multifile download session
     * @param {string[]} encryptedUrls - Array of encrypted URLs
     * @returns {Promise<void>}
     */
    async function startSession(encryptedUrls) {
        // Validate
        const validation = validateUrlCount(encryptedUrls.length);
        if (!validation.valid) {
            notifyError(validation.message || ERROR_MESSAGES.INVALID_URL_COUNT);
            return;
        }

        // Store URLs
        selectedUrls = encryptedUrls;

        // Notify preparing state
        notifyStateChange(MULTIFILE_STATES.PREPARING, {
            message: `Preparing ${encryptedUrls.length} files...`
        });

        try {
            const result = await service.startMultifileSession(encryptedUrls);

            if (!result.ok) {
                notifyError(result.message);
                return;
            }

            // Store session data
            const { session_id, stream_url, expires_at } = result.data;
            sessionData = {
                sessionId: session_id,
                streamUrl: stream_url,
                expiresAt: expires_at,
                state: MULTIFILE_STATES.PREPARING
            };

            // Notify session created
            if (onSessionUpdate) {
                onSessionUpdate(sessionData);
            }

            // Connect SSE
            connectSSE(session_id);

        } catch (error) {
            notifyError(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
        }
    }

    /**
     * Connect SSE for real-time progress
     */
    function connectSSE(sessionId) {
        if (sseManager) {
            sseManager.close();
        }

        sseManager = createSSEManager(sessionId, {
            onConnected: handleConnected,
            onDecryptProgress: handleDecryptProgress,
            onDownloadProgress: handleDownloadProgress,
            onZipProgress: handleZipProgress,
            onComplete: handleComplete,
            onError: handleSSEError
        });
    }

    function handleConnected(data) {
        notifyStateChange(MULTIFILE_STATES.PREPARING, {
            message: data?.message,
            phase: 'connected'
        });
    }

    function handleDecryptProgress(data) {
        const overall = calculateOverallProgress(data.progress ?? 0, 0, 0);

        // Notify progress update
        if (onProgressUpdate) {
            onProgressUpdate({
                decrypt: data.progress ?? 0,
                overall
            });
        }

        notifyStateChange(MULTIFILE_STATES.PREPARING, {
            message: data?.message,
            phase: 'decrypt',
            details: data?.details,
            progress: overall
        });
    }

    function handleDownloadProgress(data) {
        const overall = calculateOverallProgress(100, data.progress ?? 0, 0);

        // Notify progress update
        if (onProgressUpdate) {
            onProgressUpdate({
                download: data.progress ?? 0,
                overall
            });
        }

        // Transform message: treat download phase as "Preparing"
        const msg = formatPreparingMessage(data?.details, data?.progress, data?.message);

        notifyStateChange(MULTIFILE_STATES.CONVERTING, {
            message: msg,
            phase: 'download',
            details: data?.details,
            progress: overall
        });
    }

    function handleZipProgress(data) {
        const overall = calculateOverallProgress(100, 100, data.progress ?? 0);

        // Notify progress update
        if (onProgressUpdate) {
            onProgressUpdate({
                zip: data.progress ?? 0,
                overall
            });
        }

        notifyStateChange(MULTIFILE_STATES.ZIPPING, {
            message: data?.message,
            phase: 'zip',
            details: data?.details,
            progress: overall
        });
    }

    function handleComplete(data) {
        const { downloadUrl } = data || {};
        const expireTime = Date.now() + MULTIFILE_TIMEOUTS.DOWNLOAD_LINK_EXPIRE;

        // Update session data
        if (downloadUrl) {
            sessionData = {
                ...sessionData,
                downloadUrl,
                expiresAt: expireTime,
                state: MULTIFILE_STATES.READY
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
                selectedUrls
            });
        }

        notifyStateChange(MULTIFILE_STATES.READY, {
            message: UI_MESSAGES[MULTIFILE_STATES.READY]
        });

        // Start countdown timer
        startCountdownTimer(expireTime);

        // Close SSE
        if (sseManager) {
            sseManager.close();
            sseManager = null;
        }
    }

    function handleSSEError(error) {
        notifyError(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    }

    /**
     * Countdown timer for download link expiration
     */
    function startCountdownTimer(expireTime) {
        if (countdownTimer) {
            clearInterval(countdownTimer);
        }

        checkExpiration(expireTime);

        countdownTimer = setInterval(() => {
            checkExpiration(expireTime);
        }, MULTIFILE_TIMEOUTS.COUNTDOWN_CHECK_INTERVAL);
    }

    function checkExpiration(expireTime) {
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
                message: UI_MESSAGES[MULTIFILE_STATES.EXPIRED]
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
    function formatPreparingMessage(details, progress, fallbackMsg) {
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
    function notifyStateChange(state, extra = {}) {
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
                session: sessionData
            });
        }
    }

    /**
     * Notify error
     */
    function notifyError(message) {
        if (sessionData) {
            sessionData.state = MULTIFILE_STATES.ERROR;
        }

        if (onError) {
            onError(message);
        }

        notifyStateChange(MULTIFILE_STATES.ERROR, {
            message
        });
    }

    /**
     * Retry download
     */
    async function retry() {
        if (selectedUrls.length === 0) {
            return;
        }

        cleanup();
        await startSession(selectedUrls);
    }

    /**
     * Cancel download
     */
    function cancel() {
        cleanup();
    }

    /**
     * Cleanup resources
     */
    function cleanup() {
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
    function getSession() {
        return sessionData;
    }

    /**
     * Get selected URLs
     */
    function getSelectedUrls() {
        return [...selectedUrls];
    }

    // Return public API
    return {
        startSession,
        retry,
        cancel,
        cleanup,
        getSession,
        getSelectedUrls
    };
}
