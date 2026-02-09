/**
 * Playlist Downloader Entry Point
 * Entry point for youtube-playlist-downloader.html
 */

// === CSS Import ===
import './styles/index.css';

// Import API and services
import { api } from './api';
import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { setMultipleDownloadMode, addVideoItems } from './features/downloader/state/multiple-download-actions';
import { VideoItem } from './features/downloader/state/multiple-download-types';
import { isPlaylistUrl, extractPlaylistId, PlaylistDto, VerifiedResult } from '@downloader/core';
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
 * Initialize format toggle
 */
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
            if (format === 'mp3') {
                qualitySelectMp3.style.display = 'block';
                qualitySelectMp4.style.display = 'none';
            } else {
                qualitySelectMp3.style.display = 'none';
                qualitySelectMp4.style.display = 'block';
            }
        });
    });
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
 * Get current format settings
 */
function getCurrentSettings() {
    const activeFormatBtn = document.querySelector('.multi-format-toggle .multi-format-btn.active');

    const qualitySelectMp3 = document.getElementById('multi-quality-select-mp3') as HTMLSelectElement | null;
    const qualitySelectMp4 = document.getElementById('multi-quality-select-mp4') as HTMLSelectElement | null;

    const format = activeFormatBtn?.getAttribute('data-format') || 'mp4';

    let qualityValue = 'mp4-720';
    if (format === 'mp3' && qualitySelectMp3) {
        qualityValue = qualitySelectMp3.value;
    } else if (qualitySelectMp4) {
        qualityValue = qualitySelectMp4.value;
    }

    let quality = '720p';
    if (qualityValue.includes('-')) {
        quality = qualityValue.split('-')[1] + (format === 'mp4' ? 'p' : 'kbps');
    }

    return { format: format as 'mp3' | 'mp4', quality };
}

/**
 * Initialize playlist download form
 */
function initPlaylistForm() {
    const playlistUrlInput = document.getElementById('playlistUrl') as HTMLInputElement | null;
    const fetchPlaylistBtn = document.getElementById('fetchPlaylistBtn');
    const errorMessage = document.getElementById('error-message');
    const playlistInfoSection = document.getElementById('playlist-info-section');
    const playlistInfo = document.getElementById('playlist-info');

    if (!playlistUrlInput || !fetchPlaylistBtn) {
        console.error('[Playlist Downloader] Required elements not found');
        return;
    }

    fetchPlaylistBtn.addEventListener('click', async () => {
        const url = playlistUrlInput.value.trim();

        if (!url) {
            if (errorMessage) {
                errorMessage.textContent = 'Please paste a YouTube playlist URL';
                errorMessage.style.display = 'block';
            }
            return;
        }

        // Validate playlist URL
        if (!isPlaylistUrl(url)) {
            if (errorMessage) {
                errorMessage.textContent = 'Please enter a valid YouTube playlist URL';
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

        try {
            const playlistId = extractPlaylistId(url);
            if (!playlistId) {
                throw new Error('Could not extract playlist ID');
            }

            // Fetch playlist using V3 API
            const result = await api.playlistV3.extractPlaylist(playlistId);

            if (!result.ok || !result.data) {
                throw new Error(result.message || 'Failed to fetch playlist');
            }

            const playlist = result.data as PlaylistDto;

            // Show playlist info
            if (playlistInfoSection && playlistInfo) {
                playlistInfoSection.style.display = 'block';
                playlistInfo.innerHTML = `
          <div class="playlist-info-content">
            <img src="${playlist.thumbnail || '/placeholder-playlist.png'}" alt="${playlist.title}" class="playlist-thumbnail">
            <div class="playlist-details">
              <h3 class="playlist-title">${playlist.title}</h3>
              <p class="playlist-meta">${playlist.items?.length || 0} videos</p>
            </div>
          </div>
        `;
            }

            // Enable playlist mode
            setMultipleDownloadMode(true, 'playlist');

            // Get current format settings
            const settings = getCurrentSettings();

            // Convert playlist videos to VideoItems
            const videoItems: VideoItem[] = (playlist.items || []).map((video: any, index: number) => ({
                id: video.id || `video-${index}`,
                url: `https://www.youtube.com/watch?v=${video.id}`,
                meta: {
                    videoId: video.id,
                    title: video.title || 'Unknown Title',
                    thumbnail: video.thumbnail || '',
                    duration: video.duration || 0,
                    author: video.author || 'Unknown',
                    originalUrl: `https://www.youtube.com/watch?v=${video.id}`,
                    status: 'ready',
                },
                status: 'ready' as const,
                progress: 0,
                settings: {
                    format: settings.format,
                    quality: settings.quality,
                },
                isSelected: true,
            }));

            // Add videos to state
            addVideoItems(videoItems);

            // Re-render
            multipleDownloadRenderer.render();

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
 * Initialize app
 */
function init() {
    console.log('[Playlist Downloader] Initializing...');

    // Initialize UI components
    initMobileMenu();
    initFormatToggle();
    initInputActions();
    initAudioDropdown({ dropdownId: 'multi-audio-track-dropdown', hiddenInputId: 'multi-audio-track-value' });

    // Initialize the renderer
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
