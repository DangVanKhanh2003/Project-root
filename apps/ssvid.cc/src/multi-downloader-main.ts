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
            // Remove active from all
            formatBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
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
 * Get current format settings
 */
function getCurrentSettings() {
    const activeFormatBtn = document.querySelector('.multi-format-toggle .multi-format-btn.active');

    // Get visible quality selector
    const qualitySelectMp3 = document.getElementById('multi-quality-select-mp3') as HTMLSelectElement | null;
    const qualitySelectMp4 = document.getElementById('multi-quality-select-mp4') as HTMLSelectElement | null;

    const format = activeFormatBtn?.getAttribute('data-format') || 'mp4';

    let qualityValue = 'mp4-720';
    if (format === 'mp3' && qualitySelectMp3) {
        qualityValue = qualitySelectMp3.value;
    } else if (qualitySelectMp4) {
        qualityValue = qualitySelectMp4.value;
    }

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

    // Ctrl+Enter to Submit
    urlsInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault();
            addUrlsBtn.click();
        }
    });

    // Auto-Enter on Paste
    urlsInput.addEventListener('paste', (e) => {
        // Allow default paste first, then format
        setTimeout(() => {
            const val = urlsInput.value;
            // 1. Format: Replace multiple spaces/commas with newlines
            let formatted = val.split(/[\s,]+/).filter(Boolean).join('\n');
            
            // 2. Ensure trailing newline for next input (convenience)
            if (formatted && !formatted.endsWith('\n')) {
                formatted += '\n';
            }

            if (formatted !== val) {
                urlsInput.value = formatted;
                // Scroll to bottom
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

            // Auto-start download (mimic ytmp3.gg flow)
            await multiDownloadService.startDownload();

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
    initAudioDropdown({ dropdownId: 'multi-audio-track-dropdown', hiddenInputId: 'multi-audio-track-value' });

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
