/**
 * ConversionModal - Unified modal for YouTube conversion flow
 * Handles: Converting, Success, Error, and Expired states
 *
 * Lifecycle:
 * - open() → Creates NEW state
 * - close() → DESTROYS state and cleans up resources
 */

import { openLinkInNewTab, parseSizeToMB } from '../../utils.js';
import { ProgressBarManager } from '../../libs/downloader-lib-standalone/progressBar.js';
import { loadConversionModalCSS, loadSmoothProgressCSS } from '../../utils/css-loader.js';
// Dynamic imports for convert-logic - prefetched after critical load

export class ConversionModal {
    // Private fields
    #state = null;
    #wrapper = null;
    #wrapperSelector = '';
    #timers = [];
    #progressInterval = null;
    #progressBarManager = null;
    #boundHandleClick = null;
    #boundHandleEscape = null;
    #boundHandleOverlayClick = null;

    constructor(wrapperSelector) {
        if (!wrapperSelector) {
            throw new Error('ConversionModal requires a wrapper selector');
        }
        this.#wrapperSelector = wrapperSelector;
        this.#wrapper = document.querySelector(wrapperSelector);

        if (!this.#wrapper) {
        }

        // Bind methods for event listeners
        this.#boundHandleClick = this.#handleClick.bind(this);
        this.#boundHandleEscape = this.#handleEscape.bind(this);
        this.#boundHandleOverlayClick = this.#handleOverlayClick.bind(this);
    }

    // ============= PUBLIC API =============

    async open(options = {}) {
        if (!this.#wrapper) {
            return;
        }

        // Ensure modal CSS is loaded (from cache if preloaded)
        await Promise.all([
            loadConversionModalCSS(),
            loadSmoothProgressCSS()
        ]);

        // Support opening directly in specific states (SUCCESS, EXPIRED, etc.)
        const initialStatus = options.initialStatus || 'CONVERTING';
        const skipProgressBar = initialStatus !== 'CONVERTING'; // Skip progress for all non-CONVERTING states

        // Create fresh state
        this.#state = {
            status: initialStatus,
            provider: options.provider || 'youtube',
            startTime: Date.now(),
            progress: skipProgressBar ? 100 : 0,
            formatId: options.formatId,
            formatData: options.formatData,
            downloadUrl: options.downloadUrl || null,
            errorMessage: null,
            videoTitle: options.videoTitle || 'Video',
            videoUrl: options.videoUrl || null
        };


        this.#render();

        // Only start progress if not skipping (i.e., not in SUCCESS state)
        if (!skipProgressBar) {
            this.#startProgress();
        }

        this.#show();
    }

    async close() {

        // Cancel any ongoing conversion first
        await this.#cancelOngoingConversion();

        // Then do cleanup and hide
        this.#cleanup();
        this.#state = null;
        this.#hide();

    }

    async #cancelOngoingConversion() {
        // Only cancel if we're actively converting
        if (this.#state?.status === 'CONVERTING' && this.#state.formatId) {
            try {
                const { cancelConversion } = await import('./convert-logic.js');
                cancelConversion(this.#state.formatId);
            } catch (error) {
            }
        } else {
        }
    }

    transitionToSuccess(downloadUrl) {
        if (!this.#state) {
            return;
        }

        // Complete progress animation before transitioning
        if (this.#progressBarManager && this.#progressBarManager.isRunning()) {
            this.#progressBarManager.complete(() => {
                this.#finalizeSuccessTransition(downloadUrl);
            });
        } else {
            this.#finalizeSuccessTransition(downloadUrl);
        }
    }

    #finalizeSuccessTransition(downloadUrl) {
        this.#cleanupProgress(); // Only cleanup progress, keep event listeners

        this.#state = {
            ...this.#state,
            status: 'SUCCESS',
            downloadUrl: downloadUrl,
            progress: 100
        };

        this.#render();
    }

    transitionToError(errorMessage) {
        if (!this.#state) {
            return;
        }

        this.#cleanupProgress(); // Only cleanup progress, keep event listeners

        this.#state = {
            ...this.#state,
            status: 'ERROR',
            errorMessage: errorMessage || 'An unknown error occurred'
        };

        this.#render();
    }

    transitionToExpired(videoTitle) {
        if (!this.#state) {
            return;
        }

        this.#cleanupProgress(); // Only cleanup progress, keep event listeners

        this.#state = {
            ...this.#state,
            status: 'EXPIRED',
            videoTitle: videoTitle
        };

        this.#render();
    }

    transitionToConverting() {
        if (!this.#state) {
            return;
        }

        this.#cleanupProgress(); // Only cleanup progress, keep event listeners

        this.#state = {
            ...this.#state,
            status: 'CONVERTING',
            startTime: Date.now(),
            progress: 0,
            errorMessage: null
        };

        this.#render();
        this.#startProgress();
    }

    isOpen() {
        return this.#state !== null;
    }

    getState() {
        return this.#state ? { ...this.#state } : null;
    }

    /**
     * Get the progress bar manager instance for 2-phase system
     * @returns {ProgressBarManager} Progress bar manager instance
     */
    getProgressBarManager() {
        return this.#progressBarManager;
    }

    /**
     * Show download button after conversion complete (2-phase system)
     * @param {string} url - Download URL
     * @param {object} options - Options like buttonText
     */
    showDownloadButton(url, options = {}) {
        const buttonText = options.buttonText || 'Download';

        // Stop and hide progress bar
        if (this.#progressBarManager) {
            this.#progressBarManager.stop();
            this.#progressBarManager.hide();
        }

        // Update modal body to show download button
        this.#state = {
            ...this.#state,
            status: 'SUCCESS',
            downloadUrl: url
        };

        this.#render();
    }

    // ============= PRIVATE: LIFECYCLE =============

    // Cleanup only progress-related stuff (for transitions)
    #cleanupProgress() {

        // Stop and cleanup ProgressBarManager completely
        if (this.#progressBarManager) {
            this.#progressBarManager.stop();
            this.#progressBarManager.reset(); // This clears all callbacks and processes
            this.#progressBarManager = null;
        }

        // Clear progress interval
        if (this.#progressInterval) {
            clearInterval(this.#progressInterval);
            this.#progressInterval = null;
        } else {
        }

        // Clear any external processes that might be running
        // Note: External polling/streaming cleanup is handled by ProgressBarManager.reset()
    }

    // Full cleanup including event listeners (for modal close)
    #cleanup() {

        // Progress cleanup
        this.#cleanupProgress();

        // Clear all timers
        this.#timers.forEach(timer => {
            clearTimeout(timer);
        });
        this.#timers = [];

        // Remove event listeners
        this.#removeEventListeners();

    }

    // ============= PRIVATE: RENDERING =============

    #render() {
        if (!this.#state || !this.#wrapper) return;


        // Check if modal content already exists
        const existingContent = this.#wrapper.querySelector('.conversion-modal-content');

        if (!existingContent) {
            // Initial render - create full modal
            this.#renderFullModal();
        } else {
            // Update only the body content
            this.#updateBodyContent();
        }
    }

    #renderFullModal() {
        // Remove old event listeners before re-rendering
        this.#removeEventListeners();

        const header = this.#renderHeader();
        const body = this.#renderBody();
        const footer = this.#renderFooter();

        const modalHTML = `
            <div class="conversion-modal-content">
                ${header}
                ${body}
                ${footer}
            </div>
        `;

        this.#wrapper.innerHTML = modalHTML;

        // Attach event listeners after initial render
        setTimeout(() => {
            this.#attachEventListeners();
        }, 10);
    }

    #updateBodyContent() {

        const bodyContainer = this.#wrapper.querySelector('.conversion-modal-body');
        if (bodyContainer) {
            // Get inner content without wrapper div
            let bodyContent = '';
            switch (this.#state.status) {
                case 'CONVERTING':
                    bodyContent = this.#renderConverting();
                    break;
                case 'SUCCESS':
                    bodyContent = this.#renderSuccess();
                    break;
                case 'ERROR':
                    bodyContent = this.#renderError();
                    break;
                case 'EXPIRED':
                    bodyContent = this.#renderExpired();
                    break;
                default:
                    bodyContent = '<p>Unknown state</p>';
            }

            bodyContainer.innerHTML = bodyContent;
        } else {
            this.#renderFullModal();
        }
    }

    #renderHeader() {
        const title = this.#escapeHtml(this.#state.videoTitle || 'Video');

        return `
            <div class="conversion-modal-header">
                <h3 class="modal-video-title" title="${title}">${title}</h3>
                <button type="button" class="btn-close-modal" data-action="cancel" aria-label="Close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        `;
    }

    #renderBody() {
        let bodyContent = '';

        switch (this.#state.status) {
            case 'CONVERTING':
                bodyContent = this.#renderConverting();
                break;
            case 'SUCCESS':
                bodyContent = this.#renderSuccess();
                break;
            case 'ERROR':
                bodyContent = this.#renderError();
                break;
            case 'EXPIRED':
                bodyContent = this.#renderExpired();
                break;
            default:
                bodyContent = '<p>Unknown state</p>';
        }

        return `<div class="conversion-modal-body">${bodyContent}</div>`;
    }

    #renderFooter() {
        // Build share URL: prefer canonical URL if present, else fallback to current location on production domain
        const loc = new URL(window.location.href);
        const canonicalEl = document.querySelector('link[rel="canonical"]');
        const shareUrlRaw = canonicalEl?.href
            ? canonicalEl.href
            : `https://yt1s.cx${loc.pathname}${loc.search}${loc.hash}`;
        const encodedUrl = encodeURIComponent(shareUrlRaw);
        const title = encodeURIComponent(this.#state.videoTitle || document.title || 'Check this out!');

        const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        const xShare = `https://x.com/share?text=${title}&url=${encodedUrl}`;
        const whatsappShare = `https://wa.me/?text=${title}%20${encodedUrl}`;
        const redditShare = `https://www.reddit.com/submit?url=${encodedUrl}&title=${title}`;
        const linkedinShare = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

        return `
            <div class="conversion-modal-footer">
                <div class="social-sharing-container">
                    <div class="social-sharing-text"><span>Share with others</span></div>
                    <div class="share-icons" role="group" aria-label="Share options">
                        <a href="${facebookShare}" target="_blank" rel="noopener noreferrer" aria-label="Share on Facebook">
                            <img src="/assest/social-icon/facebook.svg" alt="Facebook" width="28" height="28" />
                        </a>
                        <a href="${whatsappShare}" target="_blank" rel="noopener noreferrer" aria-label="Share on WhatsApp">
                            <img src="/assest/social-icon/whats_app.png" alt="WhatsApp" width="28" height="28" />
                        </a>
                        <a href="${xShare}" target="_blank" rel="noopener noreferrer" aria-label="Share on X">
                            <img src="/assest/social-icon/x-circal.png" alt="X" width="28" height="28" />
                        </a>
                        <a href="${redditShare}" target="_blank" rel="noopener noreferrer" aria-label="Share on Reddit">
                            <img src="/assest/social-icon/reddit.png" alt="Reddit" width="28" height="28" />
                        </a>
                        <a href="${linkedinShare}" target="_blank" rel="noopener noreferrer" aria-label="Share on LinkedIn">
                            <img src="/assest/social-icon/linkedin.png" alt="LinkedIn" width="28" height="28" />
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    #renderConverting() {
        return `
            <div class="conversion-state conversion-state--converting">
                <!-- Spinning circle loading animation -->
                <div class="loading-spinner-container" aria-hidden="true">
                    <div class="spinning-circle"></div>
                </div>

                <h3 class="conversion-title">Converting Video...</h3>

                <div class="conversion-progress">
                    <div class="progress-bar-content">
                        <!-- ProgressBarManager will inject its DOM here -->
                    </div>
                </div>
            </div>
        `;
    }

    #renderSuccess() {
        return `
            <div class="conversion-state conversion-state--success">
                <h3 class="conversion-title">Ready to Download</h3>
                <p class="conversion-message">Your file is ready to download.</p>

                <div class="conversion-actions">
                    <button type="button" class="btn-download" data-action="download">
                        Download Now
                    </button>
                </div>
            </div>
        `;
    }

    #renderError() {
        return `
            <div class="conversion-state conversion-state--error">
                <h3 class="conversion-title">Conversion Failed</h3>
                <p class="conversion-message conversion-message--error">${this.#escapeHtml(this.#state.errorMessage)}</p>

                <div class="conversion-actions">
                   
                    <button type="button" class="btn-retry" data-action="retry">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    #renderExpired() {
        return `
            <div class="conversion-state conversion-state--expired">
                <h3 class="conversion-title">Download Session Expired</h3>
                <p class="conversion-message">This link expired after 25 minutes.</p>
                <div class="conversion-actions">
                   
                    <button type="button" class="btn-retry" data-action="retry">
                        Retry
                    </button>
                </div>
            </div>
        `;
    }

    // ============= PRIVATE: EVENT HANDLING =============

    #attachEventListeners() {
        if (!this.#wrapper) {
            return;
        }

        // Click delegation on wrapper content
        const content = this.#wrapper.querySelector('.conversion-modal-content');
        if (content) {
            // Remove any existing listener first to prevent duplicates
            content.removeEventListener('click', this.#boundHandleClick);
            content.addEventListener('click', this.#boundHandleClick);
        } else {
        }

        // Overlay click (click on wrapper itself, not content)
        this.#wrapper.addEventListener('click', this.#boundHandleOverlayClick);

        // Escape key
        document.addEventListener('keydown', this.#boundHandleEscape);

    }

    #removeEventListeners() {
        if (!this.#wrapper) return;


        const content = this.#wrapper.querySelector('.conversion-modal-content');
        if (content) {
            content.removeEventListener('click', this.#boundHandleClick);
        }

        this.#wrapper.removeEventListener('click', this.#boundHandleOverlayClick);
        document.removeEventListener('keydown', this.#boundHandleEscape);

    }

    #handleClick(event) {
        const actionElement = event.target.closest('[data-action]');
        const action = actionElement?.dataset.action;
        switch (action) {
            case 'cancel':
                this.#handleCancel();
                break;
            case 'download':
                this.#handleDownload();
                break;
            case 'retry':
                this.#handleRetry();
                break;
            case 'copy-link':
                this.#handleCopyLink(event.target.closest('[data-action]'));
                break;
            default:
        }
    }

    #handleOverlayClick(event) {
        // Only handle click on wrapper itself (backdrop), not on content
        if (event.target === this.#wrapper) {
            this.#triggerPulseEffect();
        }
    }

    #handleEscape(event) {
        if (event.key === 'Escape') {
            this.#handleCancel();
        }
    }

    async #handleCancel() {
        // Cancel any ongoing conversion first
        await this.#cancelOngoingConversion();

        // Close modal and destroy state
        this.#cleanup();
        this.#state = null;
        this.#hide();
    }

    async #handleDownload() {
        if (this.#state?.status !== 'SUCCESS') return;

        try {
            const { downloadConvertedFile } = await import('./convert-logic.js');
            await downloadConvertedFile(this.#state.formatId);

            // Note: Modal might transition to EXPIRED or close in downloadConvertedFile
            // Don't close here - let convert-logic decide
        } catch (error) {
            this.transitionToError(error.message || 'Download failed');
        }
    }

    async #handleRetry() {

        if (!this.#state) {
            return;
        }


        // Transition back to converting
        this.transitionToConverting();

        // Restart conversion
        try {
            const { reConvert } = await import('./convert-logic.js');
            await reConvert(this.#state.formatId);

        } catch (error) {
            this.transitionToError(error.message || 'Retry failed');
        }
    }

    async #handleCopyLink(button) {
        if (!this.#state?.videoUrl) {
            return;
        }

        try {
            await navigator.clipboard.writeText(this.#state.videoUrl);

            // Visual feedback - change icon temporarily
            const originalContent = button.innerHTML;
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="20 6 9 17 4 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            button.setAttribute('aria-label', 'Link copied!');

            // Reset after 2 seconds
            setTimeout(() => {
                button.innerHTML = originalContent;
                button.setAttribute('aria-label', 'Copy link');
            }, 2000);

        } catch (error) {

            // Fallback for older browsers - select text
            const tempInput = document.createElement('input');
            tempInput.value = this.#state.videoUrl;
            document.body.appendChild(tempInput);
            tempInput.select();
            document.execCommand('copy');
            document.body.removeChild(tempInput);
        }
    }

    // ============= PRIVATE: PROGRESS ANIMATION =============

    #startProgress() {
        if (!this.#state) return;

        // Initialize ProgressBarManager with the conversion progress container
        const progressSelector = `${this.#wrapperSelector} .conversion-progress`;
        this.#progressBarManager = new ProgressBarManager({ wrapper: progressSelector });

        // Parse file size from formatData if available
        const totalSizeMB = this.#state.formatData?.size ? parseSizeToMB(this.#state.formatData.size) : null;

        // Configure progress options based on provider
        const progressOptions = {
            provider: this.#state.provider || 'youtube',
            vduration: this.#state.formatData?.duration || 60,
            totalSizeMB: totalSizeMB
        };


        // DISABLED: Legacy progress start - now handled by setupExtractPhase() in convert-logic.js
        // this.#progressBarManager.start(progressOptions);

        // Just show the progress bar container, extract phase will start automatically
        this.#progressBarManager.show();

        // Set up monitoring interval to sync progress with state
        this.#progressInterval = setInterval(() => {
            if (!this.#state || this.#state.status !== 'CONVERTING') {
                this.#cleanupProgress(); // Only cleanup progress, keep event listeners
                return;
            }

            if (this.#progressBarManager) {
                this.#state.progress = this.#progressBarManager.getCurrentProgress();
            }
        }, 500); // Check every 500ms to sync state
    }

    // ProgressBarManager handles all UI updates automatically

    // ============= PRIVATE: VISIBILITY =============

    #show() {
        if (!this.#wrapper) return;

        this.#wrapper.style.visibility = 'visible';
        this.#wrapper.style.opacity = '1';

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
    }

    #hide() {
        if (!this.#wrapper) return;

        this.#wrapper.style.visibility = 'hidden';
        this.#wrapper.style.opacity = '0';

        // Restore body scroll
        document.body.style.overflow = '';

        // Clear content after transition
        const timer = setTimeout(() => {
            if (this.#wrapper) {
                this.#wrapper.innerHTML = '';
            }
        }, 300);

        this.#timers.push(timer);
    }

    // ============= UTILITIES =============

    /**
     * Triggers pulse effect on modal content to draw user attention
     * Called when user clicks outside modal instead of closing it
     */
    #triggerPulseEffect() {
        if (!this.#wrapper) {
            return;
        }

        const content = this.#wrapper.querySelector('.conversion-modal-content');
        if (!content) {
            return;
        }

        // If the animation is already running, don't do anything
        if (content.classList.contains('pulse')) {
            return;
        }


        // Add pulse class to trigger animation
        content.classList.add('pulse');

        // Use 'animationend' event to remove the class automatically
        content.addEventListener('animationend', () => {
            content.classList.remove('pulse');
        }, { once: true }); // Important: Use 'once' to auto-remove the listener
    }

    #escapeHtml(text) {
        if (typeof text !== 'string') return '';

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Create and export singleton instance
let modalInstance = null;

export function getConversionModal() {
    if (!modalInstance) {
        modalInstance = new ConversionModal('#progressBarWrapper');
    }
    return modalInstance;
}
