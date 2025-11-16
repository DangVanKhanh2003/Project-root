/**
 * Multifile Download UI Adapter (Feature Layer)
 * Slim adapter that connects multifile-orchestrator to UI/State layer
 * Handles: DOM updates, state.js integration, UI callbacks
 */

import {
    createMultifileOrchestrator,
    MULTIFILE_STATES,
    UI_MESSAGES
} from '@downloader/core';
import { api } from '../../../api';
import { triggerDownload, isMobileDevice } from '../../../utils';
import { getApiBaseUrl } from '../../../environment';
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
} from '../state';
import { showExpireModal } from '../../../ui-components/modal/expire-modal.js';

// Type definitions
type StateChangeCallback = (data: {
    state: string;
    message: string;
    session?: any;
    phase?: string;
    details?: any;
    progress?: number;
}) => void;

interface FileObject {
    id: string;
    name: string;
    url: string;
}

interface ProgressData {
    completed: number;
    total: number;
}

interface SessionData {
    sessionId: string;
    streamUrl: string;
    expiresAt: number;
}

interface StateChangeData {
    state: string;
    message?: string;
    phase?: string;
    details?: any;
    progress?: number;
}

interface CompleteData {
    downloadUrl?: string;
    expiresAt?: number;
    selectedUrls?: string[];
}

// ============================================================
// MODULE STATE
// ============================================================

let orchestrator: any | null = null;
let uiCallback: StateChangeCallback | null = null; // Callback to update gallery UI

// Create multifile service wrapper from api
const multifileService = {
    startMultifileSession: async (urls: string[]) => {
        console.log('🔍 [Multifile] Calling API with URLs:', urls);
        const result = await api.startMultifileSession({ urls });
        console.log('🔍 [Multifile] API Full Response:', result);
        console.log('🔍 [Multifile] Response.ok:', result.ok);
        console.log('🔍 [Multifile] Response.data:', result.data);
        console.log('🔍 [Multifile] Session ID:', result.data?.session_id);
        console.log('🔍 [Multifile] SessionId:', result.data?.sessionId);
        return result;
    }
};

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Start multifile download
 * @param encryptedUrls - Array of encrypted URLs
 * @param onStateChange - Callback for UI updates
 * @returns Promise<void>
 */
export async function startMultifileDownload(encryptedUrls: string[], onStateChange: StateChangeCallback): Promise<void> {
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
 * TODO: Implement sequential download for mobile devices
 */
async function handleMobileFlow(encryptedUrls: string[]): Promise<void> {
    // TODO: Implement mobile sequential download
    // For now, fallback to desktop flow
    await handleDesktopFlow(encryptedUrls);
}

/**
 * Handle desktop flow with orchestrator
 */
async function handleDesktopFlow(encryptedUrls: string[]): Promise<void> {
    // Create orchestrator with callbacks
    orchestrator = createMultifileOrchestrator(
        {
            service: multifileService as any,
            apiBaseUrl: getApiBaseUrl().replace(/\/api\/v1$/, ''), // Remove /api/v1 suffix
            streamPath: '/api/v1/multifile/stream'
        },
        {
            onSessionUpdate: (session: SessionData) => {
                console.log('🔍 [Multifile] onSessionUpdate received:', session);
                console.log('🔍 [Multifile] SessionId from callback:', session.sessionId);
                console.log('🔍 [Multifile] StreamUrl from callback:', session.streamUrl);

                // Update state.js with session data
                setMultifileSession({
                    sessionId: session.sessionId,
                    streamUrl: session.streamUrl,
                    expiresAt: session.expiresAt
                });
            },
            onProgressUpdate: ((progress: any) => {
                // Update state.js with progress
                updateMultifileProgress(progress as any);
            }) as any,
            onStateChange: (data: StateChangeData) => {
                // Update state.js
                setMultifileState(data.state as any);

                // Notify UI
                notifyUI(data.state, {
                    message: data.message,
                    phase: data.phase,
                    details: data.details,
                    progress: data.progress
                });
            },
            onError: (message: string) => {
                handleError(message);
            },
            onComplete: (data: CompleteData) => {
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
export async function retryMultifileDownload(): Promise<void> {
    if (orchestrator) {
        await orchestrator.retry();
    }
}

/**
 * Cancel download
 * @param silent - If true, don't show toast notification and skip UI updates
 */
export function cancelMultifileDownload(silent: boolean = false): void {
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
export function downloadZipFile(): void {
    const session = getMultifileSession();
    if (!session || !session.downloadUrl) {
        return;
    }
    triggerDownload(session.downloadUrl);
}

/**
 * Get current multifile state (for UI)
 */
export function getMultifileState(): {
    state: string;
    message: string;
    canDownload: boolean;
    canRetry: boolean;
    progress?: number;
} {
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
        message: UI_MESSAGES[session.state as any] || session.state,
        canDownload: (session.state as any) === MULTIFILE_STATES.READY,
        canRetry: (session.state as any) === MULTIFILE_STATES.ERROR || (session.state as any) === MULTIFILE_STATES.EXPIRED,
        progress: session.progress as any
    };
}

// ============================================================
// UI NOTIFICATION HELPERS
// ============================================================

/**
 * Notify UI of state change
 * @param state - New state
 * @param extra - Extra data
 */
function notifyUI(state: string, extra: Partial<StateChangeData> = {}): void {
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
function updateBulkProgressUI(state: string, message: string, extra: Partial<StateChangeData>, session: any): void {
    try {
        const controls = document.querySelector('.gallery-bulk-controls');
        const progressEl = controls ? controls.querySelector('.bulk-progress-info') as HTMLElement : null;
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
            const statusEl = document.querySelector('.bulk-status-message') as HTMLElement;
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
function handleError(message: string): void {
    setMultifileError(message);
    notifyUI(MULTIFILE_STATES.ERROR);

    // Display error message through state
    setState({ error: message });

    // Inject inline error message into gallery bulk controls
    try {
        const statusEl = document.querySelector('.bulk-status-message') as HTMLElement;
        if (statusEl) {
            statusEl.textContent = String(message || 'An error occurred');
            statusEl.style.display = '';
        }
    } catch (e) {
        // Non-fatal: DOM might not be available
    }
}
