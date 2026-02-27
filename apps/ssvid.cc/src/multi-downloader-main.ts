/**
 * Multi Downloader Entry Point
 * Entry point for youtube-multi-downloader.html
 */

// === CSS Import ===
import './styles/index.css';

// Import services and renderers
import { multiDownloadService } from './features/downloader/logic/multiple-download/services/multi-download-service';
import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { VideoItemSettings } from './features/downloader/state/multiple-download-types';
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';
import { MaterialPopup } from './ui-components/material-popup/material-popup';
import { extractVideoId, extractPlaylistId, isYouTubeUrl } from '@downloader/core';

function shouldPromptPlaylistRedirectForMulti(rawText: string): boolean {
    const tokens = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .trim()
        .split(/[\n\s,]+/)
        .filter(Boolean)
        .filter(token => isYouTubeUrl(token));

    if (tokens.length === 0) return false;

    const hasVideoUrl = tokens.some(token => !!extractVideoId(token));
    const hasPlaylistOnlyUrl = tokens.some(token => !extractVideoId(token) && !!extractPlaylistId(token));

    return hasPlaylistOnlyUrl && !hasVideoUrl;
}

async function confirmPlaylistRedirect(): Promise<boolean> {
    return new Promise((resolve) => {
        let settled = false;
        const settle = (goToPlaylistPage: boolean) => {
            if (settled) return;
            settled = true;
            resolve(goToPlaylistPage);
        };

        MaterialPopup.show({
            title: 'Go to playlist page',
            message: 'Would you like to download a playlist instead? Go to the playlist downloader page.',
            type: 'info',
            confirmText: 'Playlist page',
            cancelText: 'Continue',
            buttonLayout: 'row',
            onConfirm: () => settle(true),
            onCancel: () => settle(false)
        });
    });
}

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
        const audioFmt = settings.audioFormat || 'mp3';
        const prefs = {
            selectedFormat: settings.format || 'mp4',
            videoQuality: settings.videoQuality ? settings.videoQuality + 'p' : '720p',
            audioFormat: audioFmt,
            audioBitrate: audioFmt === 'mp3' ? (settings.audioBitrate || '128') : '',
            timestamp: Date.now()
        };
        // Normalize videoQuality: avoid double 'p' (e.g. '720pp')
        if (prefs.videoQuality === 'webmp' || prefs.videoQuality === 'mkvp') {
            prefs.videoQuality = settings.videoQuality!;
        }
        localStorage.setItem('ssvid_format_preferences', JSON.stringify(prefs));
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
    qualitySelectMp4.addEventListener('change', () => saveFormatPreferences());
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
        const val = qualitySelectMp3.value; // e.g. 'mp3-128', 'ogg', 'wav'
        if (val.includes('-')) {
            audioFormat = val.split('-')[0]; // 'mp3'
            audioBitrate = val.split('-')[1]; // '128'
            quality = audioBitrate + 'kbps';
        } else {
            audioFormat = val; // 'ogg', 'wav', 'opus', 'm4a'
            audioBitrate = undefined;
            quality = val;
        }
    } else if (qualitySelectMp4) {
        const val = qualitySelectMp4.value; // e.g. 'mp4-720', 'webm', 'mkv'
        if (val.includes('-')) {
            videoQuality = val.split('-')[1];
            quality = videoQuality + 'p';
        } else {
            videoQuality = val;
            quality = val;
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
 * Initialize multi-download form
 */
function initMultiDownloadForm() {
    const urlsInput = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    const addUrlsBtn = document.getElementById('addUrlsBtn');
    const errorMessage = document.getElementById('error-message');

    if (!urlsInput || !addUrlsBtn) {
        console.error('[Multi Downloader] Required elements not found');
        return;
    }

    // Ctrl+Enter to Submit
    urlsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            addUrlsBtn.click();
        }
    });

    // Auto-Enter on Paste
    urlsInput.addEventListener('paste', (e) => {
        setTimeout(() => {
            const val = urlsInput.value;
            let formatted = val.split(/[\s,]+/).filter(Boolean).join('\n');

            if (formatted && !formatted.endsWith('\n')) {
                formatted += '\n';
            }

            if (formatted !== val) {
                urlsInput.value = formatted;
                urlsInput.scrollTop = urlsInput.scrollHeight;
            }
        }, 0);
    });

    addUrlsBtn.addEventListener('click', async () => {
        const rawText = urlsInput.value.trim();

        if (!rawText) {
            if (errorMessage) {
                errorMessage.textContent = 'Please paste at least one YouTube URL';
                errorMessage.style.display = 'block';
            }
            return;
        }

        // Clear error
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }

        if (shouldPromptPlaylistRedirectForMulti(rawText)) {
            const shouldRedirectToPlaylist = await confirmPlaylistRedirect();
            if (shouldRedirectToPlaylist) {
                window.location.href = '/download-mp3-youtube-playlist';
                return;
            }
        }

        // Set button to loading state
        addUrlsBtn.classList.add('loading');
        addUrlsBtn.setAttribute('disabled', 'true');

        // Clear input after user submits
        urlsInput.value = '';

        try {
            const settings = getCurrentSettings();

            // Add URLs through the service (store-driven — renderer auto-updates)
            await multiDownloadService.addUrls(rawText, settings);

            // Auto-start download
            multiDownloadService.startAllDownloads();

        } catch (error) {
            console.error('[Multi Downloader] Error adding URLs:', error);
            if (errorMessage) {
                errorMessage.textContent = error instanceof Error ? error.message : 'Failed to process URLs';
                errorMessage.style.display = 'block';
            }
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

/**
 * Initialize app
 */
function init() {
    console.log('[Multi Downloader] Initializing...');

    // Initialize UI components
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initFormatToggle();
    initAudioDropdown({ dropdownId: 'multi-audio-track-dropdown', hiddenInputId: 'multi-audio-track-value' });

    // Initialize the renderer (batch strategy by default)
    multipleDownloadRenderer.useBatchStrategy();
    multipleDownloadRenderer.init();

    // Initialize form handlers
    initMultiDownloadForm();

    console.log('[Multi Downloader] Initialized');
}

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
