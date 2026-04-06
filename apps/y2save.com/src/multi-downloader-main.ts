/**
 * Multi Downloader Entry Point
 * Entry point for youtube-multi-downloader.html
 */

// === CSS Import ===
import './styles/index.css';

import { applyInitialVisibility } from './features/widget-level-manager';
import { STORAGE_KEYS } from './utils/storage-keys';
import { initHeroFeatureLinks } from './features/hero-feature-links';
import { showTipMessageWidget } from './features/tip-message/tip-message-widget';

// Import services and renderers
import { multiDownloadService } from './features/downloader/logic/multiple-download/services/multi-download-service';
import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { VideoItemSettings } from './features/downloader/state/multiple-download-types';
import { parseYouTubeURLs } from './features/downloader/logic/multiple-download/url-parser';
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';
import { syncCustomVideoGroupDropdown } from './features/downloader/ui-render/video-group-dropdown';
import { MaterialPopup } from './ui-components/material-popup/material-popup';
import { confirmRedirectPopup } from '@downloader/ui-shared';
import { shouldPromptPlaylistRedirectForMulti, getUrlRedirectTarget, FEATURE_KEYS } from '@downloader/core';
import { evaluateFeatureAccessAsync, initAllowedFeatures } from './features/allowed-features';
import { recordStartUsage, hasLicenseKey, checkDailyItemQuota, recordDailyItemsUsage } from './features/download-limit';
import { showPaywall } from './features/paywall-popup';


/**
 * Initialize mobile menu functionality
 */
function initMobileMenu() {
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const closeDrawerBtn = document.getElementById('close-drawer-btn');
    const mobileDrawer = document.getElementById('mobile-drawer');

    if (!mobileMenuBtn || !mobileDrawer) return;

    mobileDrawer.removeAttribute('hidden');

    const openDrawer = () => {
        mobileDrawer.classList.add('open');
        document.body.style.overflow = 'hidden';
    };

    const closeDrawer = () => {
        mobileDrawer.classList.remove('open');
        document.body.style.overflow = '';
    };

    mobileMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openDrawer();
    });

    if (closeDrawerBtn) {
        closeDrawerBtn.addEventListener('click', closeDrawer);
    }

    mobileDrawer.addEventListener('click', (e) => {
        if (e.target === mobileDrawer) {
            closeDrawer();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
            closeDrawer();
        }
    });
}

/**
 * Save current format/quality to localStorage
 */
function saveFormatPreferences() {
    try {
        const settings = getCurrentSettings();
        const prefs = {
            selectedFormat: settings.format || 'mp4',
            videoQuality: settings.videoQuality || '720p',
            audioFormat: settings.audioFormat || 'mp3',
            audioBitrate: settings.audioBitrate || '',
            timestamp: Date.now()
        };
        localStorage.setItem(STORAGE_KEYS.FORMAT_PREFERENCES, JSON.stringify(prefs));
    } catch (e) { }
}

/**
 * Initialize format toggle
 */
function initFormatToggle() {
    const formatBtns = document.querySelectorAll('.multi-format-toggle .multi-format-btn');
    const qualitySelectMp3 = document.getElementById('multi-quality-select-mp3') as HTMLSelectElement | null;
    const qualitySelectMp4 = document.getElementById('multi-quality-select-mp4') as HTMLSelectElement | null;

    if (!qualitySelectMp3 || !qualitySelectMp4) return;

    const syncVideoDropdown = () => {
        syncCustomVideoGroupDropdown(qualitySelectMp4, {
            valueMode: 'dash',
            dropdownClassName: 'multi-video-group-dropdown',
            wrapperGroupedClass: 'multi-quality-dropdown-wrapper--grouped',
        });
    };

    syncVideoDropdown();

    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            formatBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const format = btn.getAttribute('data-format');
            document.documentElement.dataset.format = format || 'mp4';
            saveFormatPreferences();
        });
    });

    qualitySelectMp3.addEventListener('change', () => saveFormatPreferences());
    qualitySelectMp4.addEventListener('change', () => {
        saveFormatPreferences();
        syncVideoDropdown();
    });
}

/**
 * Get current format settings from UI elements
 */
function getCurrentSettings(): Partial<VideoItemSettings> {
    const activeFormatBtn = document.querySelector('.multi-format-toggle .multi-format-btn.active');
    const qualitySelectMp3 = document.getElementById('multi-quality-select-mp3') as HTMLSelectElement | null;
    const qualitySelectMp4 = document.getElementById('multi-quality-select-mp4') as HTMLSelectElement | null;
    const audioTrackValue = document.getElementById('multi-audio-track-value') as HTMLInputElement | null;

    const format = (activeFormatBtn?.getAttribute('data-format') || 'mp4') as 'mp3' | 'mp4';

    let quality = '720p';
    let audioFormat: string | undefined;
    let audioBitrate: string | undefined;
    let videoQuality: string | undefined;
    const audioTrack = audioTrackValue?.value || 'original';

    if (format === 'mp3' && qualitySelectMp3) {
        const val = qualitySelectMp3.value; // e.g. 'mp3-128', 'wav'
        if (val.startsWith('mp3-')) {
            audioFormat = 'mp3';
            audioBitrate = val.split('-')[1] || '128';
            quality = `${audioBitrate}kbps`;
        } else {
            audioFormat = val;
            audioBitrate = '128';
            quality = `${val.toUpperCase()} - 128kbps`;
        }
    } else if (qualitySelectMp4) {
        const val = qualitySelectMp4.value; // e.g. 'mp4-720', 'webm-720', 'mkv-1080'
        const match = val.match(/^(mp4|webm|mkv)-(\d+)$/);
        if (match) {
            const container = match[1];
            const resolution = `${match[2]}p`;
            videoQuality = container === 'mp4' ? resolution : `${container}-${resolution}`;
            quality = videoQuality;
        }
    }

    return {
        format,
        quality,
        audioFormat,
        audioBitrate,
        videoQuality,
        audioTrack,
    };
}

/**
 * Update the convert button text/label with the number of URLs
 */
function updateConvertButtonCount(btn: HTMLElement, rawText: string): void {
    const count = rawText
        .trim()
        .split(/[\n\s,]+/)
        .filter(Boolean)
        .length;

    const label = count > 0 ? `Download (${count})` : 'Download';
    const originalTextSpan = btn.querySelector('span');
    if (originalTextSpan) {
        originalTextSpan.textContent = label;
    } else {
        btn.textContent = label;
    }
}

function normalizeUrlsText(rawText: string, addTrailingNewline = false): string {
    let formatted = rawText.split(/[\s,]+/).filter(Boolean).join('\n');
    if (addTrailingNewline && formatted && !formatted.endsWith('\n')) {
        formatted += '\n';
    }
    return formatted;
}

function setErrorMessage(errorMessage: HTMLElement | null, message: string): void {
    if (!errorMessage) return;
    errorMessage.textContent = message;
    errorMessage.style.display = message ? 'block' : 'none';
}

function updateInputActionButton(button: HTMLButtonElement | null, rawText: string): void {
    if (!button) return;

    const hasContent = rawText.trim().length > 0;
    const pasteIcon = button.querySelector('.paste-icon');
    const pasteText = button.querySelector('.btn-state--paste');
    const clearIcon = button.querySelector('.clear-icon');
    const clearText = button.querySelector('.btn-state--clear');

    if (hasContent) {
        button.dataset.action = 'clear';
        button.setAttribute('aria-label', 'Clear');
        pasteIcon?.classList.add('hidden');
        pasteText?.classList.add('hidden');
        clearIcon?.classList.remove('hidden');
        clearText?.classList.remove('hidden');
        return;
    }

    button.dataset.action = 'paste';
    button.setAttribute('aria-label', 'Paste');
    pasteIcon?.classList.remove('hidden');
    pasteText?.classList.remove('hidden');
    clearIcon?.classList.add('hidden');
    clearText?.classList.add('hidden');
}

function initMultiDownloadForm() {
    const urlsInput = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    const addUrlsBtn = document.getElementById('addUrlsBtn');
    const errorMessage = document.getElementById('error-message');
    const inputActionBtn = document.getElementById('input-action-button') as HTMLButtonElement | null;

    if (!urlsInput || !addUrlsBtn) {
        console.error('[Multi Downloader] Required elements not found');
        return;
    }

    // Enable button now that JS has loaded
    addUrlsBtn.removeAttribute('disabled');

    // Initial count
    updateConvertButtonCount(addUrlsBtn, urlsInput.value);
    updateInputActionButton(inputActionBtn, urlsInput.value);

    // Ctrl+Enter to Submit
    urlsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            addUrlsBtn.click();
        }
    });

    // Auto-Enter on Paste
    urlsInput.addEventListener('paste', () => {
        setTimeout(() => {
            const val = urlsInput.value;
            const formatted = normalizeUrlsText(val, true);

            if (formatted !== val) {
                urlsInput.value = formatted;
                urlsInput.scrollTop = urlsInput.scrollHeight;
            }
            updateConvertButtonCount(addUrlsBtn, urlsInput.value);
            updateInputActionButton(inputActionBtn, urlsInput.value);
        }, 0);
    });

    urlsInput.addEventListener('input', () => {
        updateConvertButtonCount(addUrlsBtn, urlsInput.value);
        updateInputActionButton(inputActionBtn, urlsInput.value);
    });

    if (inputActionBtn) {
        inputActionBtn.addEventListener('click', () => {
            const action = inputActionBtn.dataset.action;
            urlsInput.focus();

            if (action === 'clear') {
                urlsInput.value = '';
                updateConvertButtonCount(addUrlsBtn, urlsInput.value);
                updateInputActionButton(inputActionBtn, urlsInput.value);
                setErrorMessage(errorMessage, '');
                return;
            }

            if (!navigator.clipboard || !navigator.clipboard.readText) {
                setErrorMessage(errorMessage, 'Clipboard API not supported in this browser');
                return;
            }

            navigator.clipboard.readText()
                .then((text) => {
                    const trimmed = text.trim();
                    if (!trimmed) {
                        setErrorMessage(errorMessage, 'Clipboard is empty. Please copy a YouTube URL first.');
                        return;
                    }

                    urlsInput.value = normalizeUrlsText(trimmed, true);
                    urlsInput.scrollTop = urlsInput.scrollHeight;
                    updateConvertButtonCount(addUrlsBtn, urlsInput.value);
                    updateInputActionButton(inputActionBtn, urlsInput.value);
                    setErrorMessage(errorMessage, '');
                })
                .catch(() => {
                    setErrorMessage(errorMessage, 'Failed to read clipboard. Please paste manually.');
                });
        });
    }

    addUrlsBtn.addEventListener('click', async () => {
        const rawText = urlsInput.value.trim();

        if (!rawText) {
            setErrorMessage(errorMessage, 'Please paste at least one URL');
            return;
        }

        // Clear error
        setErrorMessage(errorMessage, '');

        // Set button to loading state
        addUrlsBtn.classList.add('loading');
        addUrlsBtn.setAttribute('disabled', 'true');

        showTipMessageWidget();

        // Check feature access for multiple download (country-tier-aware)
        const access = await evaluateFeatureAccessAsync(FEATURE_KEYS.BATCH_DOWNLOAD);
        if (!access.allowed) {
            addUrlsBtn.classList.remove('loading');
            addUrlsBtn.removeAttribute('disabled');

            const dailyStart = access.limitsResolved?.startPerDay;
            const title = typeof dailyStart === 'number'
                ? `Multi Download Start Limit: ${dailyStart}/day`
                : 'Multi Download Limit Reached';
            showPaywall('download_multi', { title });
            return;
        }

        addUrlsBtn.classList.remove('loading');
        addUrlsBtn.removeAttribute('disabled');

        const parsed = parseYouTubeURLs(rawText);

        // Per-convert item limit (country-aware)
        const itemsToConvert = parsed.length;
        const maxLimit = access.limitsResolved?.maxItemsPerConvert || 0;
        const remainingItemQuota = checkDailyItemQuota(FEATURE_KEYS.BATCH_DOWNLOAD, maxLimit, itemsToConvert);

        if (!remainingItemQuota.allowed) {
            showPaywall(FEATURE_KEYS.BATCH_DOWNLOAD, {
                title: `Daily limit: ${maxLimit} items/day`,
                noCountdown: true,
            });
            return;
        }

        // Single URL: check for channel or playlist redirect
        const singleToken = rawText.trim().split(/[\n\s,]+/).filter(Boolean);
        if (singleToken.length === 1) {
            const redirectTarget = getUrlRedirectTarget(singleToken[0]);
            if (redirectTarget) {
                const go = await confirmRedirectPopup({ popup: MaterialPopup, target: redirectTarget, cancelText: 'Continue' });
                if (go) {
                    window.location.href = redirectTarget === 'channel'
                        ? '/download-youtube-channel'
                        : '/youtube-playlist-downloader';
                    return;
                }
            }
        } else if (shouldPromptPlaylistRedirectForMulti(rawText)) {
            const go = await confirmRedirectPopup({ popup: MaterialPopup, target: 'playlist', cancelText: 'Continue' });
            if (go) {
                window.location.href = '/youtube-playlist-downloader';
                return;
            }
        }

        // Set button to loading state again for processing
        addUrlsBtn.classList.add('loading');
        addUrlsBtn.setAttribute('disabled', 'true');

        // Clear input after user submits
        urlsInput.value = '';
        updateConvertButtonCount(addUrlsBtn, urlsInput.value);
        updateInputActionButton(inputActionBtn, urlsInput.value);

        console.log('[Multi] calling multipleDownloadRenderer.show()');
        multipleDownloadRenderer.show();

        try {
            const settings = getCurrentSettings();

            // Add URLs through the service (store-driven — renderer auto-updates)
            await multiDownloadService.addUrls(rawText, settings);

            // Auto-start download
            multiDownloadService.startAllDownloads();
            recordStartUsage(FEATURE_KEYS.BATCH_DOWNLOAD);
            recordDailyItemsUsage(FEATURE_KEYS.BATCH_DOWNLOAD, itemsToConvert);

        } catch (error) {
            console.error('[Multi Downloader] Error adding URLs:', error);
            setErrorMessage(errorMessage, error instanceof Error ? error.message : 'Failed to process URLs');
        } finally {
            addUrlsBtn.classList.remove('loading');
            addUrlsBtn.removeAttribute('disabled');
        }
    });
}

/**
 * Initialize language selector dropdown
 */
function initLangSelector() {
    const langSelector = document.querySelector('.lang-selector');
    const langButton = document.querySelector('.lang-button');

    if (!langSelector || !langButton) return;

    langButton.addEventListener('click', (e) => {
        e.stopPropagation();
        langSelector.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (!langSelector.contains(e.target as Node)) {
            langSelector.classList.remove('active');
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            langSelector.classList.remove('active');
        }
    });
}

/**
 * Initialize drawer language selector dropdown
 */
function initDrawerLangSelector() {
    const drawerLangSelector = document.querySelector('.drawer-lang-selector');
    const drawerLangButton = document.querySelector('.drawer-lang-button');

    if (!drawerLangSelector || !drawerLangButton) return;

    drawerLangButton.addEventListener('click', (e) => {
        e.stopPropagation();
        drawerLangSelector.classList.toggle('active');
    });

    const mobileDrawer = document.getElementById('mobile-drawer');
    if (mobileDrawer) {
        mobileDrawer.addEventListener('click', (e) => {
            if (!drawerLangSelector.contains(e.target as Node)) {
                drawerLangSelector.classList.remove('active');
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            drawerLangSelector.classList.remove('active');
        }
    });
}

function initFeedbackWidget(): void {
    setTimeout(() => {
        import('./features/feedback/feedback-widget')
            .then(({ initFeedbackWidget: init }) => init())
            .catch(() => { });
    }, 5000);
}

/**
 * Initialize app
 */
async function init() {
    console.log('[Multi Downloader] Initializing...');

    initAllowedFeatures();
    await applyInitialVisibility();
    // Initialize UI components
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initHeroFeatureLinks();
    initFormatToggle();
    initAudioDropdown({ dropdownId: 'multi-audio-track-dropdown', hiddenInputId: 'multi-audio-track-value' });

    // Initialize the renderer (batch strategy by default)
    multipleDownloadRenderer.useBatchStrategy();
    multipleDownloadRenderer.init();

    // Initialize mobile ZIP listener (auto-add items to ZIP session when complete)
    const { initMobileSaveZipListener } = await import('./features/downloader/logic/multiple-download/mobile-save-zip-manager');
    initMobileSaveZipListener();
    // Initialize form handlers
    initMultiDownloadForm();
    initFeedbackWidget();

    console.log('[Multi Downloader] Initialized');
}

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init().catch(err => console.error('Failed to init multi downloader:', err));
    });
} else {
    init().catch(err => console.error('Failed to init multi downloader:', err));
}
