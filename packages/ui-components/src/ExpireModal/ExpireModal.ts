/**
 * Expire Modal - Reusable component
 * Modal for showing expired download links with retry functionality
 *
 * @module @downloader/ui-components/ExpireModal
 */

export interface ExpireModalOptions {
  videoTitle?: string;
  message?: string;
  onTryAgain?: () => void | Promise<void>;
  onCancel?: () => void;
  modalId?: string;
}

/**
 * ExpireModal class - Manages expired link modal UI
 *
 * WHY: Reusable component for showing link expiration across all apps
 * CONTRACT: Constructor(options) creates modal, show() displays it
 * PRE: Valid DOM environment
 * POST: Modal rendered and event listeners attached
 * EDGE: Handles missing options gracefully
 * USAGE: const modal = new ExpireModal({ videoTitle, onTryAgain }); modal.show();
 */
export class ExpireModal {
  private options: ExpireModalOptions;
  private modalElement: HTMLElement | null = null;
  private overlayElement: HTMLElement | null = null;
  private modalId: string;

  constructor(options: ExpireModalOptions = {}) {
    this.options = options;
    this.modalId = options.modalId || 'expire-modal-overlay';
  }

  /**
   * Create modal HTML structure
   */
  private createModal(): void {
    // Check if modal already exists
    if (document.getElementById(this.modalId)) {
      this.overlayElement = document.getElementById(this.modalId);
      this.modalElement = this.overlayElement?.querySelector('.expire-modal') as HTMLElement;
      return;
    }

    const message = this.options.message || (
      this.options.videoTitle
        ? `The download link for "${this.options.videoTitle}" has expired.`
        : 'The download link has expired.'
    );

    const modalHTML = `
      <div id="${this.modalId}" class="expire-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="expire-modal-title">
        <div class="expire-modal">
          <div class="expire-modal-header">
            <h2 id="expire-modal-title" class="expire-modal-title">Link Expired</h2>
            <button class="expire-modal-close-btn" aria-label="Close modal">&times;</button>
          </div>
          <div class="expire-modal-body">
            <span class="expire-modal-icon">⚠️</span>
            <p>${this.escapeHtml(message)}</p>
          </div>
          <div class="expire-modal-footer">
            <button class="expire-modal-btn expire-modal-btn-primary">Try Again</button>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    this.overlayElement = document.getElementById(this.modalId);
    this.modalElement = this.overlayElement?.querySelector('.expire-modal') as HTMLElement;

    this.attachEventListeners();
  }

  /**
   * Attach event listeners to modal buttons
   */
  private attachEventListeners(): void {
    if (!this.overlayElement) return;

    // Close button
    const closeBtn = this.overlayElement.querySelector('.expire-modal-close-btn');
    closeBtn?.addEventListener('click', () => this.handleCancel());

    // Try Again button
    const tryAgainBtn = this.overlayElement.querySelector('.expire-modal-btn-primary');
    tryAgainBtn?.addEventListener('click', () => this.handleTryAgain());

    // Overlay click (close on backdrop click)
    this.overlayElement.addEventListener('click', (e) => {
      if (e.target === this.overlayElement) {
        this.handleCancel();
      }
    });

    // ESC key to close
    this.handleEscKey = this.handleEscKey.bind(this);
    document.addEventListener('keydown', this.handleEscKey);
  }

  /**
   * Handle ESC key press
   */
  private handleEscKey(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      this.handleCancel();
    }
  }

  /**
   * Handle Try Again button click
   */
  private async handleTryAgain(): Promise<void> {
    if (this.options.onTryAgain) {
      const result = this.options.onTryAgain();
      if (result instanceof Promise) {
        try {
          await result;
        } catch (error) {
          console.error('[ExpireModal] Try again callback error:', error);
        }
      }
    }
    this.hide();
  }

  /**
   * Handle Cancel/Close
   */
  private handleCancel(): void {
    if (this.options.onCancel) {
      this.options.onCancel();
    }
    this.hide();
  }

  /**
   * Show modal
   */
  show(): void {
    this.createModal();

    if (this.overlayElement) {
      // Force reflow for animation
      void this.overlayElement.offsetHeight;
      this.overlayElement.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Hide modal
   */
  hide(): void {
    if (this.overlayElement) {
      this.overlayElement.classList.remove('visible');
      document.body.style.overflow = '';
    }

    // Remove ESC key listener
    document.removeEventListener('keydown', this.handleEscKey);
  }

  /**
   * Destroy modal and cleanup
   */
  destroy(): void {
    this.hide();

    if (this.overlayElement) {
      this.overlayElement.remove();
    }

    this.overlayElement = null;
    this.modalElement = null;
  }

  /**
   * Escape HTML to prevent XSS
   */
  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

/**
 * Convenience function to show expire modal
 * @param options - Modal options
 * @returns Promise that resolves when modal is closed
 */
export function showExpireModal(options: ExpireModalOptions | string): Promise<void> {
  return new Promise((resolve) => {
    // Support legacy string parameter
    const modalOptions: ExpireModalOptions = typeof options === 'string'
      ? { videoTitle: options }
      : options;

    const modal = new ExpireModal({
      ...modalOptions,
      onTryAgain: () => {
        if (modalOptions.onTryAgain) {
          const result = modalOptions.onTryAgain();
          if (result instanceof Promise) {
            return result.then(() => resolve());
          }
        }
        resolve();
      },
      onCancel: () => {
        if (modalOptions.onCancel) {
          modalOptions.onCancel();
        }
        resolve();
      }
    });

    modal.show();
  });
}
