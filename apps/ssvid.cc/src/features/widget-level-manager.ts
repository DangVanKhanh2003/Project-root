/**
 * Widget Level Manager
 * WHY: Centralize widget visibility rules based on user download level.
 * CONTRACT: Orchestrates Trustpilot widget via lifecycle hooks.
 *
 * Based on: ytmp3.gg/src/script/features/supporter-level-manager.js
 * Simplified: No license/supporter system, uses localStorage for download counting.
 */

import {
    showTrustpilotWidget,
    hideTrustpilotWidget
} from './trustpilot/trustpilot-widget';

const MULTI_PLAYLIST_BANNER_WRAPPER_ID = 'multi-playlist-banner-wrapper';
const MULTI_PLAYLIST_BANNER_PUBLIC_URL = '/assest/banner/multi-playlist-banner.js';

type MultiPlaylistBannerModule = {
    initMultiPlaylistBanner: (
        target: string | HTMLElement,
        options?: {
            multiPath?: string;
            playlistPath?: string;
            multiParams?: Record<string, string>;
            playlistParams?: Record<string, string>;
        }
    ) => HTMLElement | null;
};

let multiPlaylistBannerModulePromise: Promise<MultiPlaylistBannerModule> | null = null;
let multiPlaylistBannerShowTimeoutId: ReturnType<typeof setTimeout> | null = null;

const MULTI_PLAYLIST_BANNER_RETRY_DELAY_MS = 250;
const MULTI_PLAYLIST_BANNER_MAX_RETRIES = 20;

function loadMultiPlaylistBannerModule(): Promise<MultiPlaylistBannerModule> {
    if (!multiPlaylistBannerModulePromise) {
        multiPlaylistBannerModulePromise = fetch(MULTI_PLAYLIST_BANNER_PUBLIC_URL)
            .then((response) => {
                if (!response.ok) {
                    throw new Error('Failed to load multi-playlist banner module');
                }
                return response.text();
            })
            .then((code) => {
                const blob = new Blob([code], { type: 'text/javascript' });
                const blobUrl = URL.createObjectURL(blob);

                return import(/* @vite-ignore */ blobUrl)
                    .then((module) => module as MultiPlaylistBannerModule)
                    .finally(() => {
                        URL.revokeObjectURL(blobUrl);
                    });
            });
    }
    return multiPlaylistBannerModulePromise;
}

function ensureMultiPlaylistBannerWrapper(host: HTMLElement): HTMLElement {
    let wrapper = document.getElementById(MULTI_PLAYLIST_BANNER_WRAPPER_ID) as HTMLElement | null;
    if (wrapper) return wrapper;

    wrapper = document.createElement('div');
    wrapper.id = MULTI_PLAYLIST_BANNER_WRAPPER_ID;
    wrapper.style.marginTop = '16px';
    wrapper.style.width = '100%';
    host.appendChild(wrapper);

    return wrapper;
}

function buildBannerLinkOptions() {
    return {
        multiPath: '/youtube-multi-downloader',
        playlistPath: '/download-mp3-youtube-playlist',
        multiParams: {},
        playlistParams: {}
    };
}

function tryShowMultiPlaylistBannerWidget(retryCount = 0): void {
    const heroCard = document.querySelector('.hero-card') as HTMLElement | null;
    if (!heroCard) {
        if (retryCount < MULTI_PLAYLIST_BANNER_MAX_RETRIES) {
            multiPlaylistBannerShowTimeoutId = setTimeout(() => {
                tryShowMultiPlaylistBannerWidget(retryCount + 1);
            }, MULTI_PLAYLIST_BANNER_RETRY_DELAY_MS);
        }
        return;
    }

    const host = heroCard.parentElement || heroCard;
    const wrapper = ensureMultiPlaylistBannerWrapper(host);
    if (!wrapper.parentElement || wrapper.previousElementSibling !== heroCard) {
        heroCard.insertAdjacentElement('afterend', wrapper);
    }

    wrapper.innerHTML = '';
    wrapper.style.display = '';

    loadMultiPlaylistBannerModule()
        .then(({ initMultiPlaylistBanner }) => {
            initMultiPlaylistBanner(wrapper, buildBannerLinkOptions());
        })
        .catch(() => {
            // Cleanup wrapper if module load fails
            wrapper.remove();
        });
}

function showMultiPlaylistBannerWidget(): void {
    if (multiPlaylistBannerShowTimeoutId) {
        clearTimeout(multiPlaylistBannerShowTimeoutId);
        multiPlaylistBannerShowTimeoutId = null;
    }

    tryShowMultiPlaylistBannerWidget();
}

function hideMultiPlaylistBannerWidget(): void {
    if (multiPlaylistBannerShowTimeoutId) {
        clearTimeout(multiPlaylistBannerShowTimeoutId);
        multiPlaylistBannerShowTimeoutId = null;
    }

    const wrapper = document.getElementById(MULTI_PLAYLIST_BANNER_WRAPPER_ID);
    if (wrapper) wrapper.remove();
}

// ============================================================
// CONFIGURATION CONSTANTS
// ============================================================

/**
 * Widget rules mapped by element name and timing.
 * Easy to extend: just add new entries for future widgets.
 */
const WIDGET_RULES: Record<string, { timing: string; levels: Record<number, boolean> }> = {
    'trustpilot-widget': {
        timing: 'afterSubmit',
        levels: { 1: true, 2: true, 3: true }
    }
};

/**
 * Download-level thresholds for users.
 * level 1: 0-1 downloads, level 2: 2-6 downloads, level 3: 7+ downloads
 */
const DOWNLOAD_LEVEL_THRESHOLDS = {
    level1Max: 1,
    level2Max: 6
};

const STORAGE_KEY = 'ssvid_download_count';

// ============================================================
// STATE
// ============================================================

interface WidgetState {
    level: 1 | 2 | 3;
    downloadCount: number;
    showTrustpilotWidget: boolean;
}

let cachedState: WidgetState | null = null;

// ============================================================
// DOWNLOAD COUNTING (localStorage)
// ============================================================

/**
 * Get total download count from localStorage.
 */
function getDownloadCount(): number {
    try {
        const count = localStorage.getItem(STORAGE_KEY);
        return count ? parseInt(count, 10) || 0 : 0;
    } catch {
        return 0;
    }
}

/**
 * Increment download count. Call on each successful download.
 */
export function incrementDownloadCount(): void {
    try {
        const current = getDownloadCount();
        localStorage.setItem(STORAGE_KEY, String(current + 1));
        // Invalidate cached state so next resolveState() recalculates
        cachedState = null;
    } catch {
        // Silent fallback - localStorage may be unavailable
    }
}

// ============================================================
// LEVEL DETECTION
// ============================================================

/**
 * Resolve level from download count.
 */
function getLevel(count: number): 1 | 2 | 3 {
    if (count <= DOWNLOAD_LEVEL_THRESHOLDS.level1Max) return 1;
    if (count <= DOWNLOAD_LEVEL_THRESHOLDS.level2Max) return 2;
    return 3;
}

/**
 * Check if a rule allows showing an element at a timing and level.
 */
function shouldShowByRule(elementName: string, timing: string, level: number): boolean {
    const rule = WIDGET_RULES[elementName];
    if (!rule || rule.timing !== timing) return false;
    return Boolean(rule.levels[level]);
}

/**
 * Resolve and cache current state.
 */
function resolveState(forceRefresh = false): WidgetState {
    if (cachedState && !forceRefresh) return cachedState;

    const downloadCount = getDownloadCount();
    const level = getLevel(downloadCount);

    cachedState = {
        level,
        downloadCount,
        showTrustpilotWidget: shouldShowByRule('trustpilot-widget', 'afterSubmit', level)
    };

    return cachedState;
}

// ============================================================
// LIFECYCLE HOOKS
// ============================================================

/**
 * Called after form submit (extract start).
 * Always shows Trustpilot widget immediately.
 */
export function onAfterSubmit(): void {
    showTrustpilotWidget();
    showMultiPlaylistBannerWidget();
}

/**
 * Called after successful download.
 * Shows Trustpilot widget if level rules allow.
 */
export function onAfterDownload(): void {
    // no-op: Trustpilot widget is shown on submit, not after download
}

/**
 * Called when user resets (clicks "Start Over").
 * Hides all widgets.
 */
export function onReset(): void {
    hideTrustpilotWidget();
    hideMultiPlaylistBannerWidget();
}

/**
 * Called when download fails.
 * Hides Trustpilot widget.
 */
export function onDownloadFailed(): void {
    hideTrustpilotWidget();
    hideMultiPlaylistBannerWidget();
}
