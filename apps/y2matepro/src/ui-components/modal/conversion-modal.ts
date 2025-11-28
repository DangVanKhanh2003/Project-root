/**
 * Conversion Modal - TypeScript
 * Modal for displaying conversion progress and status
 */

import { ProgressBarManager } from '../progress-bar/progress-bar-manager';
import { CircularProgress } from '../circular-progress/circular-progress';

interface ModalState {
  status: 'EXTRACTING' | 'CONVERTING' | 'SUCCESS' | 'ERROR' | 'EXPIRED';
  provider: string;
  startTime: number;
  progress: number;
  formatId?: string;
  formatData?: any;
  downloadUrl?: string | null;
  errorMessage?: string | null;
  videoTitle: string;
  videoUrl?: string | null;
}

export class ConversionModal {
  private isOpenFlag: boolean = false;
  private abortController: AbortController | null = null;
  private progressBarManager: ProgressBarManager | null = null;
  private circularProgress: CircularProgress | null = null;
  private wrapper: HTMLElement | null = null;
  private wrapperSelector: string = '';
  private state: ModalState | null = null;
  private timers: number[] = [];
  private boundHandleClick: ((e: Event) => void) | null = null;
  private boundHandleEscape: ((e: KeyboardEvent) => void) | null = null;
  private boundHandleOverlayClick: ((e: MouseEvent) => void) | null = null;

  constructor(wrapperSelector: string) {
    this.wrapperSelector = wrapperSelector;
    this.wrapper = document.querySelector(wrapperSelector);

    if (!this.wrapper) {
    }

    // Bind event handlers
    this.boundHandleClick = this.handleClick.bind(this);
    this.boundHandleEscape = this.handleEscape.bind(this);
    this.boundHandleOverlayClick = this.handleOverlayClick.bind(this);

    // Progress bar manager will be created when needed
    this.progressBarManager = null;
  }

  get isOpen(): boolean {
    return this.isOpenFlag;
  }

  async open(options: any = {}): Promise<void> {

    if (!this.wrapper) {
      return;
    }

    // Support opening directly in specific states (SUCCESS, EXPIRED, EXTRACTING, etc.)
    // Default to EXTRACTING as this is the first phase of conversion flow
    const initialStatus = options.initialStatus || 'EXTRACTING';
    const skipProgressBar = initialStatus !== 'CONVERTING' && initialStatus !== 'EXTRACTING';

    this.isOpenFlag = true;
    this.abortController = new AbortController();

    // Create fresh state
    this.state = {
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


    // Render modal HTML
    this.render();

    // Initialize circular progress component
    this.circularProgress = new CircularProgress('#circular-progress-container');

    // Start extracting mode if in EXTRACTING state
    if (this.state.status === 'EXTRACTING') {
      this.circularProgress.startExtractingMode();
    }

    // Initialize progress bar if in CONVERTING state (Phase 2)
    // Note: EXTRACTING state (Phase 1) has no progress bar
    if (this.state.status === 'CONVERTING' && !skipProgressBar) {
      const progressSelector = `${this.wrapperSelector} .conversion-progress`;
      this.progressBarManager = new ProgressBarManager({ wrapper: progressSelector });
      this.progressBarManager.show();
      // Note: We don't auto-start any animation here
      // The convert-logic will call startDownloadingPhase() or startPollingPhase()

      // Start progress mode for circular
      this.circularProgress?.startProgressMode();
    }

    // Show modal
    this.show();

    // Dispatch modal opened event
    this.dispatchEvent('conversion:modal-opened', {
      formatId: this.state.formatId,
      status: this.state.status,
      videoTitle: this.state.videoTitle
    });

  }

  async close(): Promise<void> {

    const formatId = this.state?.formatId;

    // Abort all API calls
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    // Cleanup
    this.cleanup();

    // Destroy state
    this.state = null;
    this.isOpenFlag = false;

    // Hide modal
    this.hide();

    // Dispatch modal closed event
    this.dispatchEvent('conversion:modal-closed', { formatId });

  }

  transitionToConverting(): void {
    // Zombie guard
    if (!this.state) {
      return;
    }

    // Update state
    this.state = {
      ...this.state,
      status: 'CONVERTING',
      progress: 0 // Reset progress to 0% for phase 2
    };

    // Re-render body content to show progress bar
    this.updateBodyContent();

    // Recreate circular progress (container is new after updateBodyContent)
    this.circularProgress?.destroy();
    this.circularProgress = new CircularProgress('#circular-progress-container');
    this.circularProgress.startProgressMode(); // Start in progress mode with 0%

    // Initialize progress bar for phase 2
    // Note: We don't auto-start any animation here
    // The convert-logic will call startDownloadingPhase() or startPollingPhase()
    if (!this.progressBarManager) {
      const progressSelector = `${this.wrapperSelector} .conversion-progress`;
      this.progressBarManager = new ProgressBarManager({ wrapper: progressSelector });
      this.progressBarManager.show();
    }
  }

  /**
   * Transition to CONVERTING directly (no animation)
   * Used for cases 2, 3, 4 (iOS RAM, iOS Polling, Windows Polling)
   *
   * WHY: Direct transition from extract spinner to progress display
   * CONTRACT: () → Promise<void> - instantly updates to CONVERTING
   * PRE: Must be in EXTRACTING state
   * POST: Modal in CONVERTING state, circular in progress mode, ProgressBarManager ready
   * USAGE: await modal.transitionToConvertingWithAnimation();
   */
  async transitionToConvertingWithAnimation(): Promise<void> {
    // Zombie guard
    if (!this.state) {
      return;
    }

    // Update state to CONVERTING
    this.state = {
      ...this.state,
      status: 'CONVERTING',
      progress: 0
    };

    // Re-render body content to show progress section
    this.updateBodyContent();

    // Recreate circular progress (container is new after updateBodyContent)
    this.circularProgress?.destroy();
    this.circularProgress = new CircularProgress('#circular-progress-container');
    this.circularProgress.startProgressMode(); // Start in progress mode with 0%

    // Initialize progress bar for text display
    if (!this.progressBarManager) {
      const progressSelector = `${this.wrapperSelector} .conversion-progress`;
      this.progressBarManager = new ProgressBarManager({ wrapper: progressSelector });
      this.progressBarManager.show();
    }
  }

  transitionToSuccess(downloadUrl?: string): void {

    // Zombie guard
    if (!this.state) {
      return;
    }

    // Update state
    this.state = {
      ...this.state,
      status: 'SUCCESS',
      downloadUrl: downloadUrl,
      progress: 100
    };

    // Re-render body content
    this.updateBodyContent();
  }

  transitionToError(errorMessage: string): void {

    // Zombie guard
    if (!this.state) {
      return;
    }

    // Update state
    this.state = {
      ...this.state,
      status: 'ERROR',
      errorMessage: errorMessage || 'An unknown error occurred'
    };

    // Re-render body content
    this.updateBodyContent();
  }

  transitionToExpired(videoTitle?: string): void {

    // Zombie guard
    if (!this.state) {
      return;
    }

    // Update state
    this.state = {
      ...this.state,
      status: 'EXPIRED',
      videoTitle: videoTitle || this.state.videoTitle
    };

    // Re-render body content
    this.updateBodyContent();
  }

  getAbortSignal(): AbortSignal | null {
    return this.abortController?.signal || null;
  }

  getProgressBarManager(): ProgressBarManager | null {
    return this.progressBarManager;
  }

  showDownloadButton(url: string, _options: any = {}): void {

    // Zombie guard
    if (!this.state) {
      return;
    }

    // Update state to SUCCESS with download URL
    this.state = {
      ...this.state,
      status: 'SUCCESS',
      downloadUrl: url
    };

    // Re-render body content
    this.updateBodyContent();

    // Recreate circular progress (container is new after updateBodyContent)
    this.circularProgress?.destroy();
    this.circularProgress = new CircularProgress('#circular-progress-container');

    // Render success indicator (green circle + tick)
    this.circularProgress.renderSuccessState();
  }

  /**
   * Update conversion progress (coordinates circular + text display)
   * Called by strategies to update both visual components
   *
   * WHY: Single method to sync circular progress and text progress display
   * CONTRACT: (percent, statusText, isDownload?, loadedBytes?, totalBytes?) → void
   * PRE: Must be in CONVERTING state, valid percent (0-100)
   * POST: Both circular and text progress updated
   * EDGE: Handles both polling (%) and download (MB) modes
   * USAGE:
   *   Polling: modal.updateConversionProgress(45, 'Converting...');
   *   Download: modal.updateConversionProgress(0, 'Downloading...', true, 12*1024*1024, 26*1024*1024);
   */
  updateConversionProgress(
    percent: number,
    statusText: string,
    isDownload: boolean = false,
    loadedBytes?: number,
    totalBytes?: number
  ): void {
    if (!this.state || this.state.status !== 'CONVERTING') {
      return;
    }

    // Update circular progress
    if (isDownload && loadedBytes !== undefined && totalBytes !== undefined) {
      // Download mode: calculate % from bytes
      this.circularProgress?.updateProgressFromBytes(loadedBytes, totalBytes);
    } else {
      // Polling mode: use % directly
      this.circularProgress?.updateProgress(percent);
    }

    // Update text progress below
    if (isDownload) {
      // Download mode: statusText already contains MB info, no % appended
      this.progressBarManager?.updateDownloadProgress(percent, statusText);
    } else {
      // Polling mode: % will be appended by manager
      this.progressBarManager?.updatePollingProgress(percent, statusText);
    }
  }

  // ============= PRIVATE: RENDERING =============

  private render(): void {
    if (!this.state || !this.wrapper) {
      return;
    }


    // Check if modal content already exists
    const existingContent = this.wrapper.querySelector('.conversion-modal-content');

    if (!existingContent) {
      // Initial render - create full modal
      this.renderFullModal();
    } else {
      // Update only the body content
      this.updateBodyContent();
    }
  }

  private renderFullModal(): void {
    if (!this.wrapper || !this.state) return;


    // Remove old event listeners before re-rendering
    this.removeEventListeners();

    const header = this.renderHeader();
    const body = this.renderBody();
    const footer = this.renderFooter();

    const modalHTML = `
      <div class="conversion-modal-content">
        ${header}
        ${body}
        ${footer}
      </div>
    `;

    this.wrapper.innerHTML = modalHTML;

    // Attach event listeners after initial render
    setTimeout(() => {
      this.attachEventListeners();
    }, 10);
  }

  private updateBodyContent(): void {
    if (!this.wrapper || !this.state) return;


    const bodyContainer = this.wrapper.querySelector('.conversion-modal-body');
    if (bodyContainer) {
      let bodyContent = '';
      switch (this.state.status) {
        case 'EXTRACTING':
          bodyContent = this.renderExtracting();
          break;
        case 'CONVERTING':
          bodyContent = this.renderConverting();
          break;
        case 'SUCCESS':
          bodyContent = this.renderSuccess();
          break;
        case 'ERROR':
          bodyContent = this.renderError();
          break;
        case 'EXPIRED':
          bodyContent = this.renderExpired();
          break;
        default:
          bodyContent = '<p>Unknown state</p>';
      }

      bodyContainer.innerHTML = bodyContent;
    } else {
      // Body container not found, re-render full modal
      this.renderFullModal();
    }
  }

  private renderHeader(): string {
    if (!this.state) return '';

    const title = this.escapeHtml(this.state.videoTitle || 'Video');

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

  private renderBody(): string {
    if (!this.state) return '';

    let bodyContent = '';

    switch (this.state.status) {
      case 'EXTRACTING':
        bodyContent = this.renderExtracting();
        break;
      case 'CONVERTING':
        bodyContent = this.renderConverting();
        break;
      case 'SUCCESS':
        bodyContent = this.renderSuccess();
        break;
      case 'ERROR':
        bodyContent = this.renderError();
        break;
      case 'EXPIRED':
        bodyContent = this.renderExpired();
        break;
      default:
        bodyContent = '<p>Unknown state</p>';
    }

    return `<div class="conversion-modal-body">${bodyContent}</div>`;
  }

  private renderFooter(): string {
    if (!this.state) return '';

    // Build share URL
    const loc = window.location;
    const canonicalEl = document.querySelector('link[rel="canonical"]');
    const shareUrlRaw = canonicalEl?.getAttribute('href')
      ? canonicalEl.getAttribute('href')
      : `https://y2matepro.com${loc.pathname}${loc.search}${loc.hash}`;
    const encodedUrl = encodeURIComponent(shareUrlRaw || '');
    const title = encodeURIComponent(this.state.videoTitle || document.title || 'Check this out!');

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

  private renderExtracting(): string {
    return `
      <div class="conversion-state conversion-state--extracting">
        <div class="loading-spinner-container" aria-hidden="true">
          <div id="circular-progress-container"></div>
        </div>

        <h3 class="conversion-title">Extracting...</h3>
        <p class="conversion-message">Preparing your download</p>

        <!-- NO PROGRESS BAR - just circular spinner -->
      </div>
    `;
  }

  private renderConverting(): string {
    return `
      <div class="conversion-state conversion-state--converting">
        <div class="loading-spinner-container" aria-hidden="true">
          <div id="circular-progress-container"></div>
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

  private renderSuccess(): string {
    return `
      <div class="conversion-state conversion-state--success">
        <div class="loading-spinner-container" aria-hidden="true">
          <div id="circular-progress-container"></div>
        </div>

        <p class="conversion-message">Ready to Download</p>

        <div class="conversion-actions">
          <button type="button" class="btn-download" data-action="download">
            Download
          </button>
        </div>
      </div>
    `;
  }

  private renderError(): string {
    if (!this.state) return '';

    return `
      <div class="conversion-state conversion-state--error">
        <h3 class="conversion-title">Conversion Failed</h3>
        <p class="conversion-message conversion-message--error">${this.escapeHtml(this.state.errorMessage || 'An error occurred')}</p>

        <div class="conversion-actions">
          <button type="button" class="btn-retry" data-action="retry">
            Retry
          </button>
        </div>
      </div>
    `;
  }

  private renderExpired(): string {
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

  private attachEventListeners(): void {
    if (!this.wrapper) return;


    // Click delegation on wrapper content
    const content = this.wrapper.querySelector('.conversion-modal-content');
    if (content && this.boundHandleClick) {
      content.removeEventListener('click', this.boundHandleClick);
      content.addEventListener('click', this.boundHandleClick);
    }

    // Overlay click (click on wrapper itself, not content)
    if (this.boundHandleOverlayClick) {
      this.wrapper.addEventListener('click', this.boundHandleOverlayClick);
    }

    // Escape key
    if (this.boundHandleEscape) {
      document.addEventListener('keydown', this.boundHandleEscape);
    }
  }

  private removeEventListeners(): void {
    if (!this.wrapper) return;


    const content = this.wrapper.querySelector('.conversion-modal-content');
    if (content && this.boundHandleClick) {
      content.removeEventListener('click', this.boundHandleClick);
    }

    if (this.boundHandleOverlayClick) {
      this.wrapper.removeEventListener('click', this.boundHandleOverlayClick);
    }

    if (this.boundHandleEscape) {
      document.removeEventListener('keydown', this.boundHandleEscape);
    }
  }

  private handleClick(event: Event): void {
    const actionElement = (event.target as HTMLElement).closest('[data-action]');
    const action = actionElement?.getAttribute('data-action');


    switch (action) {
      case 'cancel':
        this.handleCancel();
        break;
      case 'download':
        this.handleDownload();
        break;
      case 'retry':
        this.handleRetry();
        break;
    }
  }

  private handleOverlayClick(event: MouseEvent): void {
    // Only handle click on wrapper itself (backdrop), not on content
    if (event.target === this.wrapper) {
      this.triggerPulseEffect();
    }
  }

  private handleEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.handleCancel();
    }
  }

  private handleCancel(): void {
    // Dispatch cancel event BEFORE closing to allow cleanup
    if (this.state?.formatId) {
      this.dispatchEvent('conversion:cancel', {
        formatId: this.state.formatId
      });
    }
    this.close();
  }

  private handleDownload(): void {
    if (this.state?.status !== 'SUCCESS') return;


    // Dispatch event - let external handler manage download logic
    this.dispatchEvent('conversion:download', {
      formatId: this.state.formatId,
      downloadUrl: this.state.downloadUrl
    });
  }

  private handleRetry(): void {
    if (!this.state) return;


    // Dispatch event - let external handler manage retry logic
    this.dispatchEvent('conversion:retry', {
      formatId: this.state.formatId,
      previousError: this.state.errorMessage
    });
  }

  // ============= PRIVATE: LIFECYCLE =============

  private cleanup(): void {

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];

    // Cleanup progress components
    this.cleanupProgress();

    // Remove event listeners
    this.removeEventListeners();
  }


  private cleanupProgress(): void {
    // Cleanup circular progress
    if (this.circularProgress) {
      this.circularProgress.abort();
      this.circularProgress.destroy();
      this.circularProgress = null;
    }

    // Cleanup progress bar
    if (this.progressBarManager) {
      this.progressBarManager.stop();
      this.progressBarManager.reset();
      this.progressBarManager = null;
    }
  }

  private show(): void {
    if (!this.wrapper) return;


    this.wrapper.style.visibility = 'visible';
    this.wrapper.style.opacity = '1';

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  private hide(): void {
    if (!this.wrapper) return;


    this.wrapper.style.visibility = 'hidden';
    this.wrapper.style.opacity = '0';

    // Restore body scroll
    document.body.style.overflow = '';

    // Clear content after transition
    const timer = window.setTimeout(() => {
      if (this.wrapper) {
        this.wrapper.innerHTML = '';
      }
    }, 300);

    this.timers.push(timer);
  }

  // ============= UTILITIES =============

  private triggerPulseEffect(): void {
    if (!this.wrapper) return;

    const content = this.wrapper.querySelector('.conversion-modal-content');
    if (!content) return;

    // If the animation is already running, don't do anything
    if (content.classList.contains('pulse')) return;


    // Add pulse class to trigger animation
    content.classList.add('pulse');

    // Use 'animationend' event to remove the class automatically
    content.addEventListener('animationend', () => {
      content.classList.remove('pulse');
    }, { once: true });
  }

  private escapeHtml(text: string | null | undefined): string {
    if (typeof text !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private dispatchEvent(eventName: string, detail: any = {}): void {

    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true
    });

    // ONLY dispatch on window (not on wrapper to avoid duplicate)
    // Event listeners are on window, so this is sufficient
    window.dispatchEvent(event);

  }
}

let modalInstance: ConversionModal | null = null;

export function getConversionModal(): ConversionModal {
  if (!modalInstance) {
    modalInstance = new ConversionModal('#progressBarWrapper');
  }
  return modalInstance;
}
