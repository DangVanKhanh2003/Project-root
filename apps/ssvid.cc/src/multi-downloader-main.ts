/**
 * Multi Downloader Entry Point
 * Entry point for youtube-multi-downloader.html
 */

// === CSS Import ===
import './styles/index.css';

// Import services and renderers
import { multiDownloadService } from './features/downloader/logic/multiple-download/services/multi-download-service';
import { multipleDownloadRenderer } from './features/downloader/ui-render/multiple-download/multiple-download-renderer';
import { setMultipleDownloadMode } from './features/downloader/state/multiple-download-actions';

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
function initFormatToggle() {
    const formatBtns = document.querySelectorAll('.format-toggle .format-btn');
    const qualitySelect = document.getElementById('global-quality-select') as HTMLSelectElement | null;

    if (!qualitySelect) return;

    const mp4Options = `
    <option value="mp4-1080">MP4 - 1080p</option>
    <option value="mp4-720" selected>MP4 - 720p</option>
    <option value="mp4-480">MP4 - 480p</option>
    <option value="mp4-360">MP4 - 360p</option>
  `;

    const mp3Options = `
    <option value="mp3-128" selected>MP3 - 128kbps</option>
    <option value="mp3-192">MP3 - 192kbps</option>
    <option value="mp3-320">MP3 - 320kbps</option>
    <option value="ogg">OGG</option>
    <option value="wav">WAV - Lossless</option>
    <option value="opus">Opus</option>
    <option value="m4a">M4A</option>
  `;

    formatBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            formatBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');

            const format = btn.getAttribute('data-format');
            if (format === 'mp3') {
                qualitySelect.innerHTML = mp3Options;
            } else {
                qualitySelect.innerHTML = mp4Options;
            }
        });
    });
}

/**
 * Get current format settings
 */
function getCurrentSettings() {
    const activeFormatBtn = document.querySelector('.format-toggle .format-btn.active');
    const qualitySelect = document.getElementById('global-quality-select') as HTMLSelectElement | null;

    const format = activeFormatBtn?.getAttribute('data-format') || 'mp4';
    const qualityValue = qualitySelect?.value || 'mp4-720';

    // Parse quality value
    let quality = '720p';
    if (qualityValue.includes('-')) {
        quality = qualityValue.split('-')[1] + (format === 'mp4' ? 'p' : 'kbps');
    }

    return { format: format as 'mp3' | 'mp4', quality };
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

        // Set button to loading state
        addUrlsBtn.classList.add('loading');
        addUrlsBtn.setAttribute('disabled', 'true');

        try {
            // Enable multiple download mode
            setMultipleDownloadMode(true, 'batch');

            // Add URLs through the service
            await multiDownloadService.addUrls(rawText);

            // Clear input after successful add
            urlsInput.value = '';

            // Re-render the list
            multipleDownloadRenderer.render();

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
 * Initialize app
 */
function init() {
    console.log('[Multi Downloader] Initializing...');

    // Initialize UI components
    initMobileMenu();
    initFormatToggle();

    // Initialize the renderer
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
