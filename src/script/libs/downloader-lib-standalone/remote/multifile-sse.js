/**
 * Multifile Download SSE Handler
 * Handles Server-Sent Events connection for real-time progress updates
 * UI Layer - manages SSE connection and event callbacks
 */

import { getApiBaseUrl } from '../../environment.js';
import { SSE_EVENTS, MULTIFILE_TIMEOUTS, MULTIFILE_ENDPOINTS } from '../../libs/downloader-lib-standalone/remote/multifile-constants.js';

// ============================================================
// SSE CONNECTION MANAGER
// ============================================================

/**
 * Create SSE connection manager for multifile download
 * @param {string} sessionId - Session ID from start response
 * @param {Object} callbacks - Event callbacks
 * @returns {Object} SSE manager with control methods
 */
export function createSSEManager(sessionId, callbacks = {}) {

    // Internal state
    let eventSource = null;
    let heartbeatTimer = null;
    let connectionTimeout = null;
    let isConnected = false;
    let isClosed = false;

    // Build stream URL
    const streamUrl = `${getApiBaseUrl()}${MULTIFILE_ENDPOINTS.STREAM}/${sessionId}`;

    /**
     * Start SSE connection
     */
    function connect() {
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
            handleError(error);
        }
    }

    /**
     * Setup all SSE event listeners
     */
    function setupEventListeners() {
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
    function handleOpen() {
        clearTimeout(connectionTimeout);
    }

    /**
     * Handle connected event from server
     */
    function handleConnected(event) {
        isConnected = true;
        clearTimeout(connectionTimeout);

        try {
            const data = JSON.parse(event.data);

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
    function handleDecryptProgress(event) {
        try {
            const data = JSON.parse(event.data);

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
    function handleDownloadProgress(event) {
        try {
            const data = JSON.parse(event.data);

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
    function handleZipProgress(event) {
        try {
            const data = JSON.parse(event.data);

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
    function handleComplete(event) {
        try {
            const data = JSON.parse(event.data);

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
    function handleEventError(event) {
        // Some browsers emit the connection error event as a plain Event without data.
        // Guard against missing/invalid payloads so we don't throw on JSON.parse.
        const rawData = typeof event?.data === 'string'
            ? event.data.trim()
            : String(event?.data ?? '').trim();

        if (!rawData || rawData === 'undefined') {
            handleError(new Error('Unknown server error'));
            setTimeout(() => close(), 1000);
            return;
        }

        try {
            const data = JSON.parse(rawData);

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
    function handleConnectionError(event) {

        // Check if connection was ever established
        if (!isConnected) {
            handleError(new Error('Failed to establish connection'));
            close();
        } else {
            // Auto-reconnect will be handled by browser
        }
    }

    /**
     * Handle error and trigger callback
     */
    function handleError(error) {

        if (typeof callbacks.onError === 'function') {
            callbacks.onError(error);
        }
    }

    /**
     * Reset heartbeat timer
     */
    function resetHeartbeat() {
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
    function close() {
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
    function isActive() {
        return isConnected && !isClosed;
    }

    // Auto-connect on creation
    connect();

    // Return public API
    return {
        close,
        isActive,
        isConnected: () => isConnected,
        isClosed: () => isClosed
    };
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Create default callbacks with logging
 * @returns {Object} Default callback functions
 */
export function createDefaultCallbacks() {
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
        }
    };
}
