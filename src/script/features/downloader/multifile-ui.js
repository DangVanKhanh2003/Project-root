/**
 * Multifile Download UI Adapter (Feature Layer)
 * Slim adapter that connects multifile-orchestrator to UI/State layer
 * Handles: DOM updates, state.js integration, UI callbacks
 */

import { createVerifiedService } from '../../libs/downloader-lib-standalone/index.js';
import { createMultifileOrchestrator } from '../../libs/downloader-lib-standalone/orchestration/index.js';
import { getApiBaseUrl, getTimeout } from '../../environment.js';
import { triggerDownload } from '../../utils.js';
import { withCaptchaProtection } from '../../libs/captcha-core/captcha-ui.js';
import {
    setMultifileSession,
    updateMultifileProgress,
    setMultifileState,
    setMultifileDownloadUrl,
    setMultifileError,
    setMultifileExpired,
    clearMultifileSession,
    getMultifileSession,
    saveRecentDownload,
    setState
} from './state.js';
import {
    MULTIFILE_STATES,
    UI_MESSAGES
} from '../../libs/downloader-lib-standalone/remote/multifile-constants.js';
import { isMobileDevice } from '../../utils.js';
import { startSequentialDownload } from '../../libs/downloader-lib-standalone/sequential-downloader.js';
import { showExpireModal } from '../../ui-components/modal/expire-modal.js';

// ============================================================
// MODULE STATE
// ============================================================

let orchestrator = null;
let uiCallback = null; // Callback to update gallery UI

// Initialize verified service with CAPTCHA protection
const service = createVerifiedService({
    apiBaseUrl: getApiBaseUrl(),
    timeout: getTimeout('default')
}, {}, withCaptchaProtection);

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Start multifile download
 * @param {string[]} encryptedUrls - Array of encrypted URLs
 * @param {Function} onStateChange - Callback for UI updates
 * @returns {Promise<void>}
 */
export async function startMultifileDownload(encryptedUrls, onStateChange) {
    // Store UI callback
    uiCallback = onStateChange;

    if (isMobileDevice()) {
        // --- MOBILE/TABLET FLOW (Sequential Downloads) ---
        await handleMobileFlow(encryptedUrls);
    } else {
        // --- DESKTOP FLOW (ZIP via SSE) ---
        await handleDesktopFlow(encryptedUrls);
    }
}

/**
 * Handle mobile flow with sequential downloads
 */
async function handleMobileFlow(encryptedUrls) {
    try {
        // Prepare file objects
        const files = encryptedUrls.map((url, index) => {
            const urlParts = url.split('/');
            const potentialName = urlParts[urlParts.length - 1].split('?')[0];
            return {
                id: `file-${index}`,
                name: potentialName || `file-${index + 1}`,
                url: url,
            };
        });

        // Start sequential download
        await startSequentialDownload(files, {
            onProgress: (progress) => {
                if (typeof uiCallback === 'function') {
                    const progressMessage = `Downloading ${progress.completed} of ${progress.total}...`;
                    uiCallback({
                        state: 'DOWNLOADING_INDIVIDUAL',
                        message: progressMessage,
                    });
                }
            },
            onComplete: () => {
                notifyUI(MULTIFILE_STATES.IDLE);
            },
            onError: (error) => {
                handleError(error.message || 'Download failed');
            },
            shouldCancel: () => false
        });

    } catch (error) {
        handleError(error.message || 'Download failed');
    }
}

/**
 * Handle desktop flow with orchestrator
 */
async function handleDesktopFlow(encryptedUrls) {
    // Create orchestrator with callbacks
    orchestrator = createMultifileOrchestrator(
        { service },
        {
            onSessionUpdate: (session) => {
                // Update state.js with session data
                setMultifileSession({
                    sessionId: session.sessionId,
                    streamUrl: session.streamUrl,
                    expiresAt: session.expiresAt
                });
            },
            onProgressUpdate: (progress) => {
                // Update state.js with progress
                updateMultifileProgress(progress);
            },
            onStateChange: (data) => {
                // Update state.js
                setMultifileState(data.state);

                // Notify UI
                notifyUI(data.state, {
                    message: data.message,
                    phase: data.phase,
                    details: data.details,
                    progress: data.progress
                });
            },
            onError: (message) => {
                handleError(message);
            },
            onComplete: (data) => {
                // Save to state.js
                if (data.downloadUrl) {
                    setMultifileDownloadUrl(data.downloadUrl, data.expiresAt);
                }

                // Save recent download for reuse
                if (data.selectedUrls && data.selectedUrls.length > 0 && data.downloadUrl) {
                    try {
                        saveRecentDownload(data.selectedUrls, data.downloadUrl, data.expiresAt);
                    } catch (error) {
                        // Non-fatal: continue even if save fails
                    }
                }
            },
            onExpired: () => {
                // Update state.js
                setMultifileExpired();

                // Show expire modal
                showExpireModal({ onTryAgain: retryMultifileDownload });
            }
        }
    );

    // Start session
    await orchestrator.startSession(encryptedUrls);
}

/**
 * Retry download with same URLs
 */
export async function retryMultifileDownload() {
    if (orchestrator) {
        await orchestrator.retry();
    }
}

/**
 * Cancel download
 * @param {boolean} silent - If true, don't show toast notification and skip UI updates
 */
export function cancelMultifileDownload(silent = false) {
    if (orchestrator) {
        orchestrator.cleanup();
        orchestrator = null;
    }

    // Clear state.js (pass silent parameter)
    clearMultifileSession(silent);

    if (!silent) {
        notifyUI(MULTIFILE_STATES.IDLE);
    }
}

/**
 * Trigger ZIP download
 */
export function downloadZipFile() {
    const session = getMultifileSession();
    if (!session || !session.downloadUrl) {
        return;
    }
    triggerDownload(session.downloadUrl);
}

/**
 * Get current multifile state (for UI)
 */
export function getMultifileState() {
    const session = getMultifileSession();
    if (!session) {
        return {
            state: MULTIFILE_STATES.IDLE,
            message: '',
            canDownload: false,
            canRetry: false
        };
    }

    return {
        state: session.state,
        message: UI_MESSAGES[session.state] || session.state,
        canDownload: session.state === MULTIFILE_STATES.READY,
        canRetry: session.state === MULTIFILE_STATES.ERROR || session.state === MULTIFILE_STATES.EXPIRED,
        progress: session.progress
    };
}

// ============================================================
// UI NOTIFICATION HELPERS
// ============================================================

/**
 * Notify UI of state change
 * @param {string} state - New state
 * @param {Object} extra - Extra data
 */
function notifyUI(state, extra = {}) {
    const session = getMultifileSession();
    const message = typeof extra.message === 'string' && extra.message.trim().length > 0
        ? extra.message
        : (UI_MESSAGES[state] || state);

    // Notify gallery UI callback
    if (typeof uiCallback === 'function') {
        uiCallback({
            state,
            message,
            session,
            phase: extra.phase,
            details: extra.details,
            progress: extra.progress
        });
    }

    // Update inline progress text within gallery-bulk-controls
    updateBulkProgressUI(state, message, extra, session);
}

/**
 * Update bulk controls progress UI
 */
function updateBulkProgressUI(state, message, extra, session) {
    try {
        const controls = document.querySelector('.gallery-bulk-controls');
        const progressEl = controls ? controls.querySelector('.bulk-progress-info') : null;
        const inProgress = (
            state === MULTIFILE_STATES.PREPARING ||
            state === MULTIFILE_STATES.CONVERTING ||
            state === MULTIFILE_STATES.ZIPPING ||
            state === 'DOWNLOADING_INDIVIDUAL'
        );

        if (progressEl) {
            if (inProgress) {
                // Compose display text
                const percent = Math.max(0, Math.min(100, Number(extra?.progress ?? session?.progress?.overall ?? 0)));
                let text = message;

                // Add percentage if not already in message
                if (text && !/\d+%/.test(text)) {
                    text = `${text} ${percent}%`;
                }

                // Add file count if available
                if (extra?.details && typeof extra.details.current === 'number' && typeof extra.details.total === 'number') {
                    const { current, total } = extra.details;
                    const hasRatio = /(\b\d+\/\d+\b)/.test(text);
                    if (!hasRatio) {
                        text = `${text} (${current}/${total})`;
                    }
                }

                progressEl.textContent = String(text);
                progressEl.style.display = '';
            } else {
                progressEl.textContent = '';
                progressEl.style.display = 'none';
            }
        }

        // Hide error line when not in error
        if (state !== MULTIFILE_STATES.ERROR) {
            const statusEl = document.querySelector('.bulk-status-message');
            if (statusEl) {
                statusEl.textContent = '';
                statusEl.style.display = 'none';
            }
        }
    } catch (e) {
        // Ignore if DOM unavailable
    }
}

/**
 * Handle error
 */
function handleError(message) {
    setMultifileError(message);
    notifyUI(MULTIFILE_STATES.ERROR);

    // Display error message through state
    setState({ error: message });

    // Inject inline error message into gallery bulk controls
    try {
        const statusEl = document.querySelector('.bulk-status-message');
        if (statusEl) {
            statusEl.textContent = String(message || 'An error occurred');
            statusEl.style.display = '';
        }
    } catch (e) {
        // Non-fatal: DOM might not be available
    }
}
