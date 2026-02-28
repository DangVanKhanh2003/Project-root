/**
 * Widget Level Manager
 * WHY: Centralize widget visibility rules based on user download level.
 * CONTRACT: Orchestrates Trustpilot widget and supporter state via lifecycle hooks.
 *
 * Based on: ytmp3.gg/src/script/features/supporter-level-manager.js
 */

import {
    showTrustpilotWidget,
    hideTrustpilotWidget
} from './trustpilot/trustpilot-widget';
import {
    showTipMessageWidget,
    hideTipMessageWidget
} from './tip-message/tip-message-widget';
import {
    clearStoredLicenseKey,
    getLicenseStorageKey,
    getStoredLicenseKey,
    hasStoredLicenseKey
} from './license-selector';
import {
    getSupporterUsageSummary,
    recordSuccessfulConvert,
    type DownloadMethod
} from './download-limit';

const MULTI_PLAYLIST_BANNER_WRAPPER_ID = 'multi-playlist-banner-wrapper';
const MULTI_PLAYLIST_BANNER_PUBLIC_URL = '/assest/banner/multi-playlist-banner.js';
const TIP_MESSAGE_LINK_URL = 'https://ko-fi.com/Ezconv';
const LICENSE_BUTTON_SELECTOR = '[data-license-button], #license-button, .license-button';
const LICENSE_TRIGGER_SELECTOR = '[data-license-trigger]';

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

function getHeroCard(): HTMLElement | null {
    return document.querySelector('.hero-card') as HTMLElement | null;
}

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
    wrapper.style.marginTop = '50px';
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
    const heroCard = getHeroCard();
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
    },
    'license-button': {
        timing: 'always',
        levels: { 1: false, 2: true, 3: true }
    }
};

// ============================================================
// STATE
// ============================================================

export interface WidgetState {
    level: 1 | 2 | 3;
    downloadCount: number;
    hasLicenseKey: boolean;
    licenseKey: string | null;
    showTrustpilotWidget: boolean;
    showLicenseButton: boolean;
}

let cachedState: WidgetState | null = null;
let pendingStatePromise: Promise<WidgetState> | null = null;
let hasBoundStorageListeners = false;

declare global {
    interface WindowEventMap {
        'ezconv:supporter-state-changed': CustomEvent<WidgetState>;
    }
}

// ============================================================
// SUPPORTER STATE
// ============================================================

function invalidateState(): void {
    cachedState = null;
    pendingStatePromise = null;
}

function shouldShowByRule(elementName: string, timing: string, level: number): boolean {
    const rule = WIDGET_RULES[elementName];
    if (!rule || rule.timing !== timing) return false;
    return Boolean(rule.levels[level]);
}

function shouldShowLicenseButton(level: number, hasLicenseKey: boolean): boolean {
    if (hasLicenseKey) return true;
    return shouldShowByRule('license-button', 'always', level);
}

function updateLicenseButtonVisibility(state: WidgetState): void {
    if (typeof document === 'undefined') return;

    const buttonContainers = Array.from(document.querySelectorAll(LICENSE_BUTTON_SELECTOR)) as HTMLElement[];
    const triggers = Array.from(document.querySelectorAll(LICENSE_TRIGGER_SELECTOR)) as HTMLElement[];
    if (buttonContainers.length === 0 && triggers.length === 0) return;

    buttonContainers.forEach((button) => {
        const shouldShow = state.showLicenseButton;

        button.hidden = !shouldShow;
        button.toggleAttribute('aria-hidden', !shouldShow);
        button.classList.toggle('is-hidden', !shouldShow);
    });

    triggers.forEach((trigger) => {
        const fallbackLabel = trigger.getAttribute('data-license-default-label') || 'License';
        const labelSpan = trigger.querySelector('span:not(.license-icon)') as HTMLElement | null;

        if (labelSpan) {
            labelSpan.textContent = fallbackLabel;
        } else {
            trigger.textContent = fallbackLabel;
        }

        trigger.removeAttribute('data-license-key');
        trigger.removeAttribute('title');
    });
}

function dispatchSupporterStateChanged(state: WidgetState): void {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent('ezconv:supporter-state-changed', {
        detail: state
    }));
}

async function resolveState(forceRefresh = false): Promise<WidgetState> {
    if (cachedState && !forceRefresh) return cachedState;
    if (pendingStatePromise && !forceRefresh) return pendingStatePromise;

    pendingStatePromise = getSupporterUsageSummary()
        .then((summary) => {
            const licenseKey = getStoredLicenseKey();
            const hasLicenseKey = Boolean(licenseKey);

            const nextState: WidgetState = {
                level: summary.level,
                downloadCount: summary.totalSuccessfulDownloads,
                hasLicenseKey,
                licenseKey,
                showTrustpilotWidget: shouldShowByRule('trustpilot-widget', 'afterSubmit', summary.level),
                showLicenseButton: shouldShowLicenseButton(summary.level, hasLicenseKey)
            };

            cachedState = nextState;
            updateLicenseButtonVisibility(nextState);
            dispatchSupporterStateChanged(nextState);
            return nextState;
        })
        .finally(() => {
            pendingStatePromise = null;
        });

    return pendingStatePromise;
}

function bindStorageListeners(): void {
    if (hasBoundStorageListeners || typeof window === 'undefined') return;

    hasBoundStorageListeners = true;

    window.addEventListener('storage', (event) => {
        if (event.key && event.key !== getLicenseStorageKey()) return;
        invalidateState();
        void resolveState(true);
    });

    document.addEventListener('ezconv:license-key-changed', () => {
        invalidateState();
        void resolveState(true);
    });
}

bindStorageListeners();

export async function getWidgetState(forceRefresh = false): Promise<WidgetState> {
    return resolveState(forceRefresh);
}

export async function refreshWidgetState(): Promise<WidgetState> {
    return resolveState(true);
}

export function hasLicenseKey(): boolean {
    return hasStoredLicenseKey();
}

export function getLicenseKey(): string | null {
    return getStoredLicenseKey();
}

export function clearLicenseKey(): void {
    clearStoredLicenseKey();
}

export async function incrementDownloadCount(method: DownloadMethod = 'single', url = ''): Promise<void> {
    await recordSuccessfulConvert(method, url);
    await refreshWidgetState();
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
    showTipMessageWidget({ url: TIP_MESSAGE_LINK_URL });
    showMultiPlaylistBannerWidget();
    void resolveState();
}

/**
 * Called after successful download.
 * Shows Trustpilot widget if level rules allow.
 */
export function onAfterDownload(): void {
    void refreshWidgetState();
}

/**
 * Called when user resets (clicks "Start Over").
 * Hides all widgets.
 */
export function onReset(): void {
    hideTrustpilotWidget();
    hideTipMessageWidget();
    hideMultiPlaylistBannerWidget();
}

/**
 * Called when download fails.
 * Hides Trustpilot widget.
 */
export function onDownloadFailed(): void {
    hideTrustpilotWidget();
    hideTipMessageWidget();
    hideMultiPlaylistBannerWidget();
}
