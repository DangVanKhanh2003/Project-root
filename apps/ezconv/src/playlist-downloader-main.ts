/**
 * Playlist Downloader Entry Point
 * Entry point for download-mp3-youtube-playlist.html
 */

import './styles/index.css';

import { multiDownloadService } from './features/downloader/logic/multiple-download/services/multi-download-service';
import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { isPlaylistUrl, extractVideoId } from '@downloader/core';
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';
import { initMobileMenu, initLangSelector, initDrawerLangSelector } from './features/shared/init/common-init';
import { getCurrentSettings, initFormatToggle } from './features/shared/form/format-settings';

function initInputActions() {
    const inputActionBtn = document.getElementById('input-action-button');
    const playlistUrlInput = document.getElementById('playlistUrl') as HTMLInputElement | null;

    if (!inputActionBtn || !playlistUrlInput) return;

    const updateButtonState = () => {
        const hasValue = playlistUrlInput.value.trim().length > 0;
        inputActionBtn.querySelector('.paste-icon')?.classList.toggle('hidden', hasValue);
        inputActionBtn.querySelector('.clear-icon')?.classList.toggle('hidden', !hasValue);
        inputActionBtn.querySelector('.btn-state--paste')?.classList.toggle('hidden', hasValue);
        inputActionBtn.querySelector('.btn-state--clear')?.classList.toggle('hidden', !hasValue);
        inputActionBtn.setAttribute('data-action', hasValue ? 'clear' : 'paste');
    };

    playlistUrlInput.addEventListener('input', updateButtonState);

    inputActionBtn.addEventListener('click', async () => {
        if (inputActionBtn.getAttribute('data-action') === 'paste') {
            try {
                playlistUrlInput.value = await navigator.clipboard.readText();
                playlistUrlInput.dispatchEvent(new Event('input'));
            } catch (_) {}
        } else {
            playlistUrlInput.value = '';
            playlistUrlInput.dispatchEvent(new Event('input'));
            playlistUrlInput.focus();
        }
    });
}

function initPlaylistForm() {
    const playlistUrlInput = document.getElementById('playlistUrl') as HTMLInputElement | null;
    const fetchPlaylistBtn = document.getElementById('fetchPlaylistBtn');
    const errorMessage = document.getElementById('error-message');

    if (!playlistUrlInput || !fetchPlaylistBtn) return;

    fetchPlaylistBtn.addEventListener('click', async () => {
        const url = playlistUrlInput.value.trim();
        if (!url) {
            if (errorMessage) { errorMessage.textContent = 'Please paste a YouTube URL'; errorMessage.style.display = 'block'; }
            return;
        }
        const isPlaylist = isPlaylistUrl(url);
        const videoId = extractVideoId(url);
        if (!isPlaylist && !videoId) {
            if (errorMessage) { errorMessage.textContent = 'Please enter a valid YouTube URL'; errorMessage.style.display = 'block'; }
            return;
        }
        if (errorMessage) { errorMessage.textContent = ''; errorMessage.style.display = 'none'; }

        fetchPlaylistBtn.classList.add('loading');
        fetchPlaylistBtn.setAttribute('disabled', 'true');
        const originalText = fetchPlaylistBtn.textContent;
        fetchPlaylistBtn.innerHTML = '<span>Loading...</span>';
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
            if (errorMessage) { errorMessage.textContent = error instanceof Error ? error.message : 'Failed to fetch playlist'; errorMessage.style.display = 'block'; }
        } finally {
            fetchPlaylistBtn.classList.remove('loading');
            fetchPlaylistBtn.removeAttribute('disabled');
            fetchPlaylistBtn.innerHTML = `<span>${originalText}</span>`;
        }
    });
}

function init() {
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initFormatToggle();
    initInputActions();
    initAudioDropdown({ dropdownId: 'multi-audio-track-dropdown', hiddenInputId: 'multi-audio-track-value' });
    multipleDownloadRenderer.usePlaylistStrategy();
    multipleDownloadRenderer.init();
    initPlaylistForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
