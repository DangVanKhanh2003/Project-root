/**
 * Conversion Modal - TypeScript
 * Modal for displaying conversion progress and status
 */

import { ProgressBarManager } from '../progress-bar/progress-bar-manager';

interface ModalState {
  status: 'CONVERTING' | 'SUCCESS' | 'ERROR' | 'EXPIRED';
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
  private wrapper: HTMLElement | null = null;
  private wrapperSelector: string = '';
  private state: ModalState | null = null;
  private timers: number[] = [];
  private boundHandleClick: ((e: Event) => void) | null = null;
  private boundHandleEscape: ((e: KeyboardEvent) => void) | null = null;
  private boundHandleOverlayClick: ((e: MouseEvent) => void) | null = null;

  constructor(wrapperSelector: string) {
    console.log('[ConversionModal] 🏗️  Constructor called with selector:', wrapperSelector);
    this.wrapperSelector = wrapperSelector;
    this.wrapper = document.querySelector(wrapperSelector);
    console.log('[ConversionModal] 🔍 Wrapper element found?', !!this.wrapper, this.wrapper);

    if (!this.wrapper) {
      console.error('[ConversionModal] ❌ Wrapper element not found!');
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
    console.log('[ConversionModal] 🚀 open() called with options:', options);

    if (!this.wrapper) {
      console.error('[ConversionModal] ❌ Cannot open - wrapper element not found!');
      return;
    }

    // Support opening directly in specific states (SUCCESS, EXPIRED, etc.)
    const initialStatus = options.initialStatus || 'CONVERTING';
    const skipProgressBar = initialStatus !== 'CONVERTING';

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

    console.log('[ConversionModal] 📊 State created:', this.state);

    // Render modal HTML
    this.render();

    // Initialize progress bar if in CONVERTING state
    if (this.state.status === 'CONVERTING' && !skipProgressBar) {
      this.startProgress();
    }

    // Show modal
    this.show();

    // Dispatch modal opened event
    this.dispatchEvent('conversion:modal-opened', {
      formatId: this.state.formatId,
      status: this.state.status,
      videoTitle: this.state.videoTitle
    });

    console.log('[ConversionModal] ✅ Modal opened successfully');
  }

  async close(): Promise<void> {
    console.log('[ConversionModal] 🚪 close() called');

    const formatId = this.state?.formatId;

    // Abort all API calls
    if (this.abortController) {
      console.log('[ConversionModal] ⚠️  Aborting API calls...');
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

    console.log('[ConversionModal] ✅ Modal closed');
  }

  transitionToSuccess(downloadUrl?: string): void {
    console.log('[ConversionModal] ✅ transitionToSuccess called with URL:', downloadUrl);

    // Zombie guard
    if (!this.state) {
      console.warn('[ConversionModal] ⚠️  Cannot transition - state is null (modal closed)');
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
    console.log('[ConversionModal] ❌ transitionToError called with message:', errorMessage);

    // Zombie guard
    if (!this.state) {
      console.warn('[ConversionModal] ⚠️  Cannot transition - state is null (modal closed)');
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
    console.log('[ConversionModal] ⏰ transitionToExpired called');

    // Zombie guard
    if (!this.state) {
      console.warn('[ConversionModal] ⚠️  Cannot transition - state is null (modal closed)');
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

  showDownloadButton(url: string, options: any = {}): void {
    console.log('[ConversionModal] 📥 showDownloadButton called with URL:', url);

    // Zombie guard
    if (!this.state) {
      console.warn('[ConversionModal] ⚠️  Cannot show download button - state is null');
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
  }

  // ============= PRIVATE: RENDERING =============

  private render(): void {
    if (!this.state || !this.wrapper) {
      console.error('[ConversionModal] ❌ Cannot render - state or wrapper is null');
      return;
    }

    console.log('[ConversionModal] 🎨 render() - Rendering full modal');

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

    console.log('[ConversionModal] 🎨 renderFullModal() - Creating full modal HTML');

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

    console.log('[ConversionModal] 🔄 updateBodyContent() - Updating body to status:', this.state.status);

    const bodyContainer = this.wrapper.querySelector('.conversion-modal-body');
    if (bodyContainer) {
      let bodyContent = '';
      switch (this.state.status) {
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
      : `https://yt1s.cx${loc.pathname}${loc.search}${loc.hash}`;
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

  private renderConverting(): string {
    return `
      <div class="conversion-state conversion-state--converting">
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

  private renderSuccess(): string {
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

    console.log('[ConversionModal] 🔗 Attaching event listeners');

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

    console.log('[ConversionModal] 🔓 Removing event listeners');

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

    console.log('[ConversionModal] 🖱️  Click handler - action:', action);

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
      console.log('[ConversionModal] 🖱️  Overlay clicked - triggering pulse effect');
      this.triggerPulseEffect();
    }
  }

  private handleEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      console.log('[ConversionModal] ⌨️  ESC key pressed - closing modal');
      this.handleCancel();
    }
  }

  private handleCancel(): void {
    console.log('[ConversionModal] ❌ handleCancel - closing modal');
    this.close();
  }

  private handleDownload(): void {
    if (this.state?.status !== 'SUCCESS') return;

    console.log('[ConversionModal] 📥 handleDownload - dispatching download event');

    // Dispatch event - let external handler manage download logic
    this.dispatchEvent('conversion:download', {
      formatId: this.state.formatId,
      downloadUrl: this.state.downloadUrl
    });
  }

  private handleRetry(): void {
    if (!this.state) return;

    console.log('[ConversionModal] 🔄 handleRetry - dispatching retry event');

    // Dispatch event - let external handler manage retry logic
    this.dispatchEvent('conversion:retry', {
      formatId: this.state.formatId,
      previousError: this.state.errorMessage
    });
  }

  // ============= PRIVATE: LIFECYCLE =============

  private cleanup(): void {
    console.log('[ConversionModal] 🧹 cleanup() - Cleaning up resources');

    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer));
    this.timers = [];

    // Cleanup progress bar
    this.cleanupProgress();

    // Remove event listeners
    this.removeEventListeners();
  }

  private startProgress(): void {
    console.log('[ConversionModal] 📊 startProgress() - Initializing progress bar');

    // Create progress bar manager
    const progressSelector = `${this.wrapperSelector} .conversion-progress`;
    this.progressBarManager = new ProgressBarManager({ wrapper: progressSelector });

    // Show progress bar
    this.progressBarManager.show();

    // Start extract phase (target 28% for YouTube, 95% for social media)
    const isYouTube = this.state?.provider === 'youtube';
    const targetPercent = isYouTube ? 28 : 95;

    this.progressBarManager.startExtractPhase(targetPercent);
  }

  private cleanupProgress(): void {
    if (this.progressBarManager) {
      console.log('[ConversionModal] 🧹 cleanupProgress() - Stopping and resetting progress bar');
      this.progressBarManager.stop();
      this.progressBarManager.reset();
      this.progressBarManager = null;
    }
  }

  private show(): void {
    if (!this.wrapper) return;

    console.log('[ConversionModal] 👁️  show() - Making modal visible');

    this.wrapper.style.visibility = 'visible';
    this.wrapper.style.opacity = '1';

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  }

  private hide(): void {
    if (!this.wrapper) return;

    console.log('[ConversionModal] 🙈 hide() - Hiding modal');

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

    console.log('[ConversionModal] 💓 Triggering pulse effect');

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

    // Dispatch on wrapper element
    if (this.wrapper) {
      this.wrapper.dispatchEvent(event);
    }

    // Also dispatch globally for easy listening
    window.dispatchEvent(event);

    console.log('[ConversionModal] 📡 Event dispatched:', eventName, detail);
  }
}

let modalInstance: ConversionModal | null = null;

export function getConversionModal(): ConversionModal {
  console.log('[getConversionModal] 📞 Called, modalInstance exists?', !!modalInstance);
  if (!modalInstance) {
    console.log('[getConversionModal] 🏗️  Creating new ConversionModal instance...');
    modalInstance = new ConversionModal('#progressBarWrapper');
    console.log('[getConversionModal] ✅ Instance created:', modalInstance);
  }
  console.log('[getConversionModal] 📤 Returning instance');
  return modalInstance;
}
