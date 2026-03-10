/**
 * Channel Downloader Entry Point
 * Entry point for download-youtube-channel.html
 * Reuses playlist UI/UX but calls the channel API.
 */

// === CSS Import ===
import './styles/index.css';

import { applyInitialVisibility } from './features/widget-level-manager';
import { initHeroFeatureLinks } from './features/hero-feature-links';
import { showTipMessageWidget } from './features/tip-message/tip-message-widget';

// Import API and services
import { multiDownloadService } from './features/downloader/logic/multiple-download/services/multi-download-service';
import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { VideoItemSettings } from './features/downloader/state/multiple-download-types';
import { FEATURE_KEYS, getUrlRedirectTarget } from '@downloader/core';
import { confirmRedirectPopup } from '@downloader/ui-shared';
import { MaterialPopup } from './ui-components/material-popup/material-popup';
import { isChannelUrl } from './features/downloader/logic/multiple-download/url-parser';
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';
import { syncCustomVideoGroupDropdown } from './features/downloader/ui-render/video-group-dropdown';
import { evaluateFeatureAccessAsync, initAllowedFeatures } from './features/allowed-features';
import { recordStartUsage } from './features/download-limit';
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
        localStorage.setItem('ytmp4_format_preferences', JSON.stringify(prefs));
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
 * Initialize paste/clear button for input
 */
function initInputActions() {
    const inputActionBtn = document.getElementById('input-action-button');
    const urlInput = document.getElementById('playlistUrl') as HTMLInputElement | null;

    if (!inputActionBtn || !urlInput) return;

    const focusInput = () => {
        urlInput.focus();
    };

    const updateButtonState = () => {
        const hasValue = urlInput.value.trim().length > 0;
        const pasteIcon = inputActionBtn.querySelector('.paste-icon');
        const clearIcon = inputActionBtn.querySelector('.clear-icon');
        const pasteText = inputActionBtn.querySelector('.btn-state--paste');
        const clearText = inputActionBtn.querySelector('.btn-state--clear');

        if (hasValue) {
            pasteIcon?.classList.add('hidden');
            clearIcon?.classList.remove('hidden');
            pasteText?.classList.add('hidden');
            clearText?.classList.remove('hidden');
            inputActionBtn.setAttribute('data-action', 'clear');
        } else {
            pasteIcon?.classList.remove('hidden');
            clearIcon?.classList.add('hidden');
            pasteText?.classList.remove('hidden');
            clearText?.classList.add('hidden');
            inputActionBtn.setAttribute('data-action', 'paste');
        }
    };

    urlInput.addEventListener('input', updateButtonState);

    // Keep focus on input when clicking action button so Enter triggers submit.
    inputActionBtn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
    });

    inputActionBtn.addEventListener('click', async () => {
        const action = inputActionBtn.getAttribute('data-action');
        focusInput();

        if (action === 'paste') {
            try {
                const text = await navigator.clipboard.readText();
                urlInput.value = text.trim();
                urlInput.dispatchEvent(new Event('input', { bubbles: true }));
                focusInput();
            } catch (err) {
                console.error('Failed to read clipboard:', err);
            }
        } else {
            urlInput.value = '';
            urlInput.dispatchEvent(new Event('input', { bubbles: true }));
            focusInput();
        }
    });
}

/**
 * Get current format settings from UI
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
 * Initialize channel download form
 */
function initChannelForm() {
    const urlInput = document.getElementById('playlistUrl') as HTMLInputElement | null;
    const fetchBtn = document.getElementById('fetchPlaylistBtn');
    const errorMessage = document.getElementById('error-message');

    if (!urlInput || !fetchBtn) {
        console.error('[Channel Downloader] Required elements not found');
        return;
    }

    // Enable submit button now that JS handler is attached
    fetchBtn.removeAttribute('disabled');

    const submitChannel = async () => {
        if (fetchBtn.hasAttribute('disabled')) {
            return;
        }

        const url = urlInput.value.trim();

        if (!url) {
            if (errorMessage) {
                errorMessage.textContent = 'Please paste a YouTube channel URL';
                errorMessage.style.display = 'block';
            }
            return;
        }

        // If playlist-only URL, prompt redirect
        const redirectTarget = getUrlRedirectTarget(url);
        if (redirectTarget === 'playlist') {
            const go = await confirmRedirectPopup({ popup: MaterialPopup, target: 'playlist' });
            if (go) {
                window.location.href = '/multi-youtube-downloader';
                return;
            }
            if (errorMessage) {
                errorMessage.textContent = 'Please enter a valid YouTube channel URL';
                errorMessage.style.display = 'block';
            }
            return;
        }

        // Validate: must be a channel URL
        if (!isChannelUrl(url)) {
            if (errorMessage) {
                errorMessage.textContent = 'Please enter a valid YouTube channel URL (e.g. youtube.com/@channelname)';
                errorMessage.style.display = 'block';
            }
            return;
        }

        // Clear error
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }

        // Set button to loading state
        fetchBtn.classList.add('loading');
        fetchBtn.setAttribute('disabled', 'true');
        const originalText = fetchBtn.textContent;
        fetchBtn.innerHTML = '<span>Loading...</span>';

        showTipMessageWidget();

        // Clear input after user submits
        urlInput.value = '';
        urlInput.dispatchEvent(new Event('input'));

        // Feature Access Check (country-tier-aware)
        const access = await evaluateFeatureAccessAsync(FEATURE_KEYS.CHANNEL_DOWNLOAD);
        if (!access.allowed) {
            fetchBtn.classList.remove('loading');
            fetchBtn.removeAttribute('disabled');
            fetchBtn.innerHTML = `<span>${originalText}</span>`;

            const dailyStart = access.limitsResolved?.startPerDay;
            const title = typeof dailyStart === 'number'
                ? `Channel Start Limit: ${dailyStart}/day`
                : 'Channel Download Limit Reached';
            showPaywall('download_channel', { title });
            return;
        }

        multipleDownloadRenderer.show();

        try {
            const settings = getCurrentSettings();
            await multiDownloadService.addChannel(url, settings);
            recordStartUsage(FEATURE_KEYS.CHANNEL_DOWNLOAD);
        } catch (error) {
            console.error('[Channel Downloader] Error fetching channel:', error);
            const msg = error instanceof Error ? error.message : 'Failed to fetch channel';

            if (msg.includes('Channel has no videos') || msg.includes('could not be fetched')) {
                showPaywall('download_channel');
            } else if (errorMessage) {
                errorMessage.textContent = msg;
                errorMessage.style.display = 'block';
            }
        } finally {
            fetchBtn.classList.remove('loading');
            fetchBtn.removeAttribute('disabled');
            fetchBtn.innerHTML = `<span>${originalText}</span>`;
        }
    };

    fetchBtn.addEventListener('click', () => {
        submitChannel().catch((error) => {
            console.error('[Channel Downloader] Submit failed:', error);
        });
    });

    urlInput.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter') return;
        event.preventDefault();
        submitChannel().catch((error) => {
            console.error('[Channel Downloader] Submit failed:', error);
        });
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
    console.log('[Channel Downloader] Initializing...');

    initAllowedFeatures();
    await applyInitialVisibility();
    // Initialize UI components
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initHeroFeatureLinks();
    initFormatToggle();
    initInputActions();
    initAudioDropdown({ dropdownId: 'multi-audio-track-dropdown', hiddenInputId: 'multi-audio-track-value' });

    // Initialize the renderer with playlist strategy (same UX)
    multipleDownloadRenderer.usePlaylistStrategy();
    multipleDownloadRenderer.init();

    // Initialize form handlers
    initChannelForm();
    initFeedbackWidget();

    console.log('[Channel Downloader] Initialized');
}

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        init().catch(err => console.error('Failed to init channel downloader:', err));
    });
} else {
    init().catch(err => console.error('Failed to init channel downloader:', err));
}
