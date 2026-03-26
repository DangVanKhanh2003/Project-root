/**
 * Widget Level Manager
 * WHY: Centralize widget visibility rules based on user download level.
 * CONTRACT: Orchestrates Trustpilot widget via lifecycle hooks.
 *
 * Based on: ytmp3.gg/src/script/features/supporter-level-manager.js
 */

import { STORAGE_KEYS } from '../utils/storage-keys';
import {
    showTrustpilotWidget,
    showTrustpilotCard,
    hideTrustpilotWidget
} from './trustpilot/trustpilot-widget';
import {
    showTipMessageWidget,
    hideTipMessageWidget
} from './tip-message/tip-message-widget';
import { hasLicenseKey } from './download-limit';
import { initLicenseSelector } from './license/license-selector';
import { init as initSupporterTag, show as showSupporterTag, hide as hideSupporterTag } from './license/supporter-tag';
import { apiLogger } from '../libs/api-logger/api-logger';

const EZCONV_INTRO_BANNER_WRAPPER_ID = 'ezconv-intro-banner-wrapper';
const EZCONV_INTRO_BANNER_PUBLIC_URL = '/intro_oganic_ezconv.js?v=1';

const MULTI_PLAYLIST_BANNER_WRAPPER_ID = 'multi-playlist-banner-wrapper';
const MULTI_PLAYLIST_BANNER_PUBLIC_URL = '/assest/banner/multi-playlist-banner.js';

type EzConvIntroModule = {
    injectBanner: (container: HTMLElement, options?: Record<string, unknown>) => void;
    showPopup: (options?: Record<string, unknown>) => void;
    hidePopup: () => void;
    preloadPopup: (options?: Record<string, unknown>) => void;
};

let ezconvIntroBannerModulePromise: Promise<EzConvIntroModule> | null = null;
let ezconvIntroBannerShowTimeoutId: ReturnType<typeof setTimeout> | null = null;

const EZCONV_INTRO_BANNER_RETRY_DELAY_MS = 250;
const EZCONV_INTRO_BANNER_MAX_RETRIES = 20;

function loadEzConvIntroBannerModule(): Promise<EzConvIntroModule> {
    if (!ezconvIntroBannerModulePromise) {
        // Check if already loaded (e.g. via static <script>)
        const existing = (globalThis as unknown as Record<string, EzConvIntroModule>).EzConvIntro;
        if (existing) {
            ezconvIntroBannerModulePromise = Promise.resolve(existing);
            return ezconvIntroBannerModulePromise;
        }

        ezconvIntroBannerModulePromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = EZCONV_INTRO_BANNER_PUBLIC_URL;
            script.onload = () => {
                const mod = (globalThis as unknown as Record<string, EzConvIntroModule>).EzConvIntro;
                if (mod) {
                    resolve(mod);
                } else {
                    reject(new Error('EzConvIntro not found on globalThis'));
                }
            };
            script.onerror = () => reject(new Error('Failed to load ezconv intro banner script'));
            document.head.appendChild(script);
        });
    }
    return ezconvIntroBannerModulePromise;
}

function ensureEzConvSlot(): HTMLElement | null {
    const existing = document.getElementById(EZCONV_INTRO_BANNER_WRAPPER_ID);
    if (existing) {
        return (existing.querySelector('.container') as HTMLElement) || existing;
    }

    const heroSection = document.querySelector('.hero-section') as HTMLElement | null;
    if (!heroSection || !heroSection.parentElement) return null;

    // Full-width section with .container inside for consistent width
    const section = document.createElement('section');
    section.id = EZCONV_INTRO_BANNER_WRAPPER_ID;
    section.style.marginTop = '50px';

    const container = document.createElement('div');
    container.className = 'container';
    section.appendChild(container);

    // Insert after hero-section as a sibling section
    heroSection.insertAdjacentElement('afterend', section);

    return container;
}

function tryShowEzConvIntroBanner(retryCount = 0): void {
    const wrapper = ensureEzConvSlot();
    if (!wrapper) {
        if (retryCount < EZCONV_INTRO_BANNER_MAX_RETRIES) {
            ezconvIntroBannerShowTimeoutId = setTimeout(() => {
                tryShowEzConvIntroBanner(retryCount + 1);
            }, EZCONV_INTRO_BANNER_RETRY_DELAY_MS);
        }
        return;
    }

    wrapper.innerHTML = '';
    wrapper.style.display = '';

    loadEzConvIntroBannerModule()
        .then(({ injectBanner }) => {
            injectBanner(wrapper);
        })
        .catch(() => {
            wrapper.remove();
        });
}

function showEzConvIntroBanner(): void {
    if (ezconvIntroBannerShowTimeoutId) {
        clearTimeout(ezconvIntroBannerShowTimeoutId);
        ezconvIntroBannerShowTimeoutId = null;
    }

    tryShowEzConvIntroBanner();
}

function hideEzConvIntroBanner(): void {
    if (ezconvIntroBannerShowTimeoutId) {
        clearTimeout(ezconvIntroBannerShowTimeoutId);
        ezconvIntroBannerShowTimeoutId = null;
    }

    const section = document.getElementById(EZCONV_INTRO_BANNER_WRAPPER_ID);
    if (section) section.remove();
}

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

type MainContentBelowContainerSlotOptions = {
    className?: string;
    marginTop?: string;
    marginBottom?: string;
};

function ensureMainContentBelowContainerSlot(
    id: string,
    options: MainContentBelowContainerSlotOptions = {}
): HTMLElement | null {
    let wrapper = document.getElementById(id) as HTMLElement | null;

    // Try .main-content first (ytmp4-style layout)
    const mainContent = document.querySelector('.main-content') as HTMLElement | null;
    if (mainContent) {
        const mainContentCard = mainContent.querySelector('.main-content-card') as HTMLElement | null;

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = id;
        }

        wrapper.classList.add('main-content-below-container-slot');
        if (options.className) {
            wrapper.classList.add(...options.className.split(/\s+/).filter(Boolean));
        }
        wrapper.style.width = '100%';

        if (options.marginTop) {
            wrapper.style.marginTop = options.marginTop;
        } else {
            wrapper.style.removeProperty('margin-top');
        }

        if (options.marginBottom) {
            wrapper.style.marginBottom = options.marginBottom;
        } else {
            wrapper.style.removeProperty('margin-bottom');
        }

        if (mainContentCard) {
            if (wrapper.parentElement !== mainContent || wrapper.nextElementSibling !== mainContentCard) {
                mainContentCard.insertAdjacentElement('beforebegin', wrapper);
            }
        } else if (wrapper.parentElement !== mainContent || wrapper !== mainContent.lastElementChild) {
            mainContent.appendChild(wrapper);
        }

        return wrapper;
    }

    // Fallback: insert after .hero-section (ssvid.cc layout)
    const heroSection = document.querySelector('.hero-section') as HTMLElement | null;
    if (!heroSection || !heroSection.parentElement) return null;

    // Already exists — return .container child inside
    if (wrapper) {
        return (wrapper.querySelector('.container') as HTMLElement) || wrapper;
    }

    // Full-width section with .container inside for consistent width
    const section = document.createElement('section');
    section.id = id;

    if (options.marginTop) {
        section.style.marginTop = options.marginTop;
    }

    const container = document.createElement('div');
    container.className = 'container';
    section.appendChild(container);

    // Insert after the last banner slot or after hero-section
    const ezconvSlot = document.getElementById(EZCONV_INTRO_BANNER_WRAPPER_ID);
    const insertAfter = ezconvSlot || heroSection;
    insertAfter.insertAdjacentElement('afterend', section);

    return container;
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

function buildBannerLinkOptions() {
    return {
        multiPath: '/multi-youtube-downloader',
        playlistPath: '/download-mp3-youtube-playlist',
        multiParams: {},
        playlistParams: {}
    };
}

function tryShowMultiPlaylistBannerWidget(retryCount = 0): void {
    const wrapper = ensureMainContentBelowContainerSlot(MULTI_PLAYLIST_BANNER_WRAPPER_ID, {
        marginTop: '50px'
    });
    if (!wrapper) {
        if (retryCount < MULTI_PLAYLIST_BANNER_MAX_RETRIES) {
            multiPlaylistBannerShowTimeoutId = setTimeout(() => {
                tryShowMultiPlaylistBannerWidget(retryCount + 1);
            }, MULTI_PLAYLIST_BANNER_RETRY_DELAY_MS);
        }
        return;
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

/**
 * Widget rules mapped by element name and timing.
 * 'supporter' key = override for license holders.
 */
const WIDGET_RULES: Record<string, { timing: string; levels: Record<number | string, boolean> }> = {
    'license-button': {
        timing: 'pageLoad',
        levels: { 1: false, 2: false, 3: false, supporter: true }
    },
    'trustpilot-widget': {
        timing: 'afterSubmit',
        levels: { 1: true, 2: true, 3: true, supporter: true }
    },
    'supporter-badge': {
        timing: 'pageLoad',
        levels: { 1: false, 2: false, 3: false, supporter: false }
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

const STORAGE_KEY = STORAGE_KEYS.DOWNLOAD_COUNT;

// ============================================================
// STATE
// ============================================================

interface WidgetState {
    level: 1 | 2 | 3;
    isSupporter: boolean;
    downloadCount: number;
    showTrustpilotWidget: boolean;
    showLicenseButton: boolean;
    showSupporterBadge: boolean;
}

let cachedState: WidgetState | null = null;

// ============================================================
// DOWNLOAD COUNTING (localStorage)
// ============================================================

/**
 * Get total download count from IndexedDB logs.
 */
async function getDownloadCount(): Promise<number> {
    try {
        // The user specifically wants to get the count from IndexedDB (apiLogger worker)
        // This ensures the count persists even if localStorage is cleared (e.g. in incognito)
        return await apiLogger.getCountSuccess();
    } catch {
        return 0;
    }
}

/**
 * Increment download count. Call on each successful download.
 */
export function incrementDownloadCount(): void {
    try {
        const currentCountStr = localStorage.getItem(STORAGE_KEY);
        const currentCount = currentCountStr ? parseInt(currentCountStr, 10) || 0 : 0;
        localStorage.setItem(STORAGE_KEY, String(currentCount + 1));

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
function shouldShowByRule(elementName: string, timing: string, level: number, isSupporter = false): boolean {
    const rule = WIDGET_RULES[elementName];
    if (!rule || rule.timing !== timing) return false;
    if (isSupporter && Object.prototype.hasOwnProperty.call(rule.levels, 'supporter')) {
        return Boolean(rule.levels['supporter']);
    }
    return Boolean(rule.levels[level]);
}

/**
 * Resolve and cache current state.
 */
async function resolveState(forceRefresh = false): Promise<WidgetState> {
    if (cachedState && !forceRefresh) return cachedState;

    const isSupporter = hasLicenseKey();
    const downloadCount = isSupporter ? 999 : await getDownloadCount();
    const level = isSupporter ? 3 : getLevel(downloadCount);

    cachedState = {
        level,
        isSupporter,
        downloadCount,
        showTrustpilotWidget: shouldShowByRule('trustpilot-widget', 'afterSubmit', level, isSupporter),
        showLicenseButton: shouldShowByRule('license-button', 'pageLoad', level, isSupporter),
        showSupporterBadge: shouldShowByRule('supporter-badge', 'pageLoad', level, isSupporter),
    };

    return cachedState;
}

// ============================================================
// LIFECYCLE HOOKS
// ============================================================

/**
 * Called on page load. Applies license button + supporter badge visibility.
 * Add this to loadFeatures() in main.ts.
 */
export async function applyInitialVisibility(): Promise<void> {
    const state = await resolveState();

    // License buttons visibility (Level 2+)
    const licenseContainers = document.querySelectorAll('[data-license-button]');
    licenseContainers.forEach((container) => {
        const el = container as HTMLElement;
        if (state.showLicenseButton) {
            el.hidden = false;
            el.removeAttribute('aria-hidden');
            el.style.removeProperty('display');
        } else {
            el.hidden = true;
            el.setAttribute('aria-hidden', 'true');
            el.style.display = 'none'; // inline style overrides author CSS (e.g. .license-menu { display: flex })
        }
    });

    // Init license dropdown interactions
    if (state.showLicenseButton) {
        initLicenseSelector();
    }

    // Supporter badge on logo
    if (state.showSupporterBadge) {
        initSupporterTag('.header-logo');
        showSupporterTag();
    } else {
        hideSupporterTag();
    }
}

/**
 * Called after form submit (extract start).
 */
export function onAfterSubmit(): void {
    showTrustpilotWidget();
    showTipMessageWidget();
    showEzConvIntroBanner();          // #1 — ezconv intro banner
    showMultiPlaylistBannerWidget();  // #2 — multi/playlist banner
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
    hideTipMessageWidget();
    hideEzConvIntroBanner();
    hideMultiPlaylistBannerWidget();
}

/**
 * Called when download fails.
 * Hides Trustpilot widget.
 */
export function onDownloadFailed(): void {
    hideTrustpilotWidget();
    hideTipMessageWidget();
    hideEzConvIntroBanner();
    hideMultiPlaylistBannerWidget();
}
