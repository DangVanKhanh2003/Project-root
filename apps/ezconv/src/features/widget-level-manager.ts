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
    showTipMessageWidgetWithPricing,
    hideTipMessageWidget
} from './tip-message/tip-message-widget';
import {
    hasValidLicense,
    getStoredRawKey,
    clearLicenseToken,
    getLicenseTokenStorageKey,
    getLicenseInfo,
    computeDaysRemaining,
} from './license-token';
import {
    getSupporterUsageSummary,
    recordSuccessfulConvert,
    type DownloadMethod
} from './download-limit';

const MULTI_PLAYLIST_BANNER_WRAPPER_ID = 'multi-playlist-banner-wrapper';
const MULTI_PLAYLIST_BANNER_PUBLIC_URL = '/assest/banner/multi-playlist-banner.js';
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

function getLicenseButtonLabel(state: WidgetState): string | null {
    if (!state.hasLicenseKey) return null;

    const info = getLicenseInfo();
    if (!info) return null;

    // Lifetime → show "Lifetime"
    if (info.planType === 'lifetime' || !info.expiresAt) {
        return 'Lifetime';
    }

    // Time-limited → show "X days"
    const days = computeDaysRemaining(info.expiresAt);
    if (days !== null && days > 0) {
        return `${days} day${days !== 1 ? 's' : ''}`;
    }

    return null;
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

    const planLabel = getLicenseButtonLabel(state);
    const info = state.hasLicenseKey ? getLicenseInfo() : null;

    triggers.forEach((trigger) => {
        const fallbackLabel = trigger.getAttribute('data-license-default-label') || 'License';
        const label = planLabel || fallbackLabel;
        const labelSpan = trigger.querySelector('span:not(.license-icon)') as HTMLElement | null;

        if (labelSpan) {
            labelSpan.textContent = label;
        } else {
            trigger.textContent = label;
        }

        if (planLabel) {
            trigger.setAttribute('title', `Plan: ${planLabel}`);
        } else {
            trigger.removeAttribute('title');
        }
        trigger.removeAttribute('data-license-key');
    });

    // Populate dropdown status bars
    const statusBars = Array.from(document.querySelectorAll('[data-license-status]')) as HTMLElement[];
    statusBars.forEach((bar) => {
        bar.hidden = false;
        bar.dataset.licenseState = info ? 'active' : 'none';

        const planEl = bar.querySelector('[data-license-plan-label]') as HTMLElement | null;
        const daysEl = bar.querySelector('[data-license-days-label]') as HTMLElement | null;

        if (planEl) {
            if (!info) {
                planEl.textContent = 'none';
            } else {
                const planMap: Record<string, string> = {
                    lifetime: 'Lifetime', yearly: 'Yearly', monthly: 'Monthly', weekly: 'Weekly',
                };
                planEl.textContent = planMap[info.planType.toLowerCase()] || info.planType;
            }
        }

        if (daysEl) {
            if (!info) {
                daysEl.textContent = 'none';
            } else if (!info.expiresAt) {
                daysEl.textContent = '∞ (Lifetime)';
            } else {
                const days = computeDaysRemaining(info.expiresAt);
                if (days !== null && days > 0) {
                    daysEl.textContent = `${days} day${days !== 1 ? 's' : ''}`;
                } else {
                    daysEl.textContent = 'Last day';
                }
            }

            if (!info || !info.expiresAt) {
                daysEl.textContent = 'none';
            }
        }
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
            const licenseKey = getStoredRawKey();
            const hasLicenseKey = hasValidLicense();

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
        if (event.key && event.key !== getLicenseTokenStorageKey()) return;
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
    return hasValidLicense();
}

export function getLicenseKey(): string | null {
    return getStoredRawKey();
}

export function clearLicenseKey(): void {
    clearLicenseToken();
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
    showTipMessageWidgetWithPricing();
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
