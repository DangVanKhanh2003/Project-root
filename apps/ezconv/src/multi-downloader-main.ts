/**
 * Multi Downloader Entry Point
 * Entry point for youtube-multi-downloader.html
 */

import './styles/index.css';

import { multiDownloadService } from './features/downloader/logic/multiple-download/services/multi-download-service';
import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { initAudioDropdown } from './features/downloader/ui-render/dropdown-logic';
import { initMobileMenu, initLangSelector, initDrawerLangSelector } from './features/shared/init/common-init';
import { getCurrentSettings, initFormatToggle } from './features/shared/form/format-settings';

function initMultiDownloadForm() {
    const urlsInput = document.getElementById('urlsInput') as HTMLTextAreaElement | null;
    const addUrlsBtn = document.getElementById('addUrlsBtn');
    const errorMessage = document.getElementById('error-message');

    if (!urlsInput || !addUrlsBtn) return;

    urlsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            addUrlsBtn.click();
        }
    });

    urlsInput.addEventListener('paste', () => {
        setTimeout(() => {
            const val = urlsInput.value;
            let formatted = val.split(/[\s,]+/).filter(Boolean).join('\n');
            if (formatted && !formatted.endsWith('\n')) formatted += '\n';
            if (formatted !== val) {
                urlsInput.value = formatted;
                urlsInput.scrollTop = urlsInput.scrollHeight;
            }
        }, 0);
    });

    addUrlsBtn.addEventListener('click', async () => {
        const rawText = urlsInput.value.trim();
        if (!rawText) {
            if (errorMessage) { errorMessage.textContent = 'Please paste at least one YouTube URL'; errorMessage.style.display = 'block'; }
            return;
        }
        if (errorMessage) { errorMessage.textContent = ''; errorMessage.style.display = 'none'; }
        addUrlsBtn.classList.add('loading');
        addUrlsBtn.setAttribute('disabled', 'true');
        urlsInput.value = '';
        try {
            const groupId = await multiDownloadService.addUrls(rawText, getCurrentSettings());
            if (groupId) {
                multiDownloadService.startGroupDownloads(groupId);
            }
        } catch (error) {
            if (errorMessage) { errorMessage.textContent = error instanceof Error ? error.message : 'Failed to process URLs'; errorMessage.style.display = 'block'; }
        } finally {
            addUrlsBtn.classList.remove('loading');
            addUrlsBtn.removeAttribute('disabled');
        }
    });
}

function init() {
    initMobileMenu();
    initLangSelector();
    initDrawerLangSelector();
    initFormatToggle();
    initAudioDropdown({ dropdownId: 'multi-audio-track-dropdown', hiddenInputId: 'multi-audio-track-value' });
    multipleDownloadRenderer.useBatchStrategy();
    multipleDownloadRenderer.init();
    initMultiDownloadForm();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
