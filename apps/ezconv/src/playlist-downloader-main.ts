/**
 * Playlist Downloader Entry Point
 * Entry point for download-mp3-youtube-playlist.html
 */

// === CSS Import ===
import './styles/index.css';

// Import API and services
import { multiDownloadService } from './features/downloader/logic/multiple-download/services/multi-download-service';
import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { VideoItemSettings } from './features/downloader/state/multiple-download-types';
import { isPlaylistUrl, extractVideoId } from '@downloader/core';
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';

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
        localStorage.setItem('Ezconv_format_preferences', JSON.stringify(prefs));
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
 * Initialize paste/clear button for input
 */
function initInputActions() {
    const inputActionBtn = document.getElementById('input-action-button');
    const playlistUrlInput = document.getElementById('playlistUrl') as HTMLInputElement | null;

    if (!inputActionBtn || !playlistUrlInput) return;

    const updateButtonState = () => {
        const hasValue = playlistUrlInput.value.trim().length > 0;
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

    playlistUrlInput.addEventListener('input', updateButtonState);

    inputActionBtn.addEventListener('click', async () => {
        const action = inputActionBtn.getAttribute('data-action');

        if (action === 'paste') {
            try {
                const text = await navigator.clipboard.readText();
                playlistUrlInput.value = text;
                playlistUrlInput.dispatchEvent(new Event('input'));
            } catch (err) {
                console.error('Failed to read clipboard:', err);
            }
        } else {
            playlistUrlInput.value = '';
            playlistUrlInput.dispatchEvent(new Event('input'));
            playlistUrlInput.focus();
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
 * Initialize playlist download form
 */
function initPlaylistForm() {
    const playlistUrlInput = document.getElementById('playlistUrl') as HTMLInputElement | null;
    const fetchPlaylistBtn = document.getElementById('fetchPlaylistBtn');
    const errorMessage = document.getElementById('error-message');

    if (!playlistUrlInput || !fetchPlaylistBtn) {
        console.error('[Playlist Downloader] Required elements not found');
        return;
    }

    fetchPlaylistBtn.addEventListener('click', async () => {
        const url = playlistUrlInput.value.trim();

        if (!url) {
            if (errorMessage) {
                errorMessage.textContent = 'Please paste a YouTube URL';
                errorMessage.style.display = 'block';
            }
            return;
        }

        // Validate: must be playlist or single video URL
        const isPlaylist = isPlaylistUrl(url);
        const videoId = extractVideoId(url);
        if (!isPlaylist && !videoId) {
            if (errorMessage) {
                errorMessage.textContent = 'Please enter a valid YouTube URL';
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
        fetchPlaylistBtn.classList.add('loading');
        fetchPlaylistBtn.setAttribute('disabled', 'true');
        const originalText = fetchPlaylistBtn.textContent;
        fetchPlaylistBtn.innerHTML = '<span>Loading...</span>';

        // Clear input after user submits
        playlistUrlInput.value = '';
        playlistUrlInput.dispatchEvent(new Event('input'));

        try {
            const settings = getCurrentSettings();

            if (isPlaylist) {
                await multiDownloadService.addPlaylist(url, settings);
            } else {
                await multiDownloadService.addSingleVideoAsGroup(url, settings);
            }

        } catch (error) {
            console.error('[Playlist Downloader] Error fetching playlist:', error);
            if (errorMessage) {
                errorMessage.textContent = error instanceof Error ? error.message : 'Failed to fetch playlist';
                errorMessage.style.display = 'block';
            }
        } finally {
            fetchPlaylistBtn.classList.remove('loading');
            fetchPlaylistBtn.removeAttribute('disabled');
            fetchPlaylistBtn.innerHTML = `<span>${originalText}</span>`;
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
    console.log('[Playlist Downloader] Initializing...');

    // Initialize UI components
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initFormatToggle();
    initInputActions();
    initAudioDropdown({ dropdownId: 'multi-audio-track-dropdown', hiddenInputId: 'multi-audio-track-value' });

    // Initialize the renderer with playlist strategy
    multipleDownloadRenderer.usePlaylistStrategy();
    multipleDownloadRenderer.init();

    // Initialize form handlers
    initPlaylistForm();

    console.log('[Playlist Downloader] Initialized');
}

// DOM Ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
