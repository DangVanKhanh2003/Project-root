/**
 * CAPTCHA Modal UI Component
 * Handles UI aspects of CAPTCHA: modal creation, display, user interactions
 * Uses captcha-provider for business logic
 */

import { getCaptchaToken, CaptchaResult, CaptchaCallbacks } from './captcha-provider';

export interface CaptchaModalOptions {
  modalId?: string;
  containerId?: string;
  onComplete?: (result: CaptchaResult) => void;
  onCancel?: () => void;
}

/**
 * CAPTCHA Modal Manager
 * Handles modal UI and CAPTCHA workflow
 */
export class CaptchaModal {
  private modalId: string;
  private containerId: string;
  private modalElement: HTMLElement | null = null;
  private currentResolve: ((result: CaptchaResult) => void) | null = null;
  private currentReject: ((error: Error) => void) | null = null;

  constructor(options: CaptchaModalOptions = {}) {
    this.modalId = options.modalId || 'recaptcha-modal';
    this.containerId = options.containerId || 'recaptcha-widget-container';
  }

  /**
   * Creates and injects the reCAPTCHA modal into the DOM.
   */
  private createModal(): void {
    if (document.getElementById(this.modalId)) return;

    const modalHTML = `
      <div id="${this.modalId}" class="captcha-modal" role="dialog" aria-modal="true" aria-labelledby="recaptcha-modal-title">
        <div class="captcha-modal-overlay"></div>
        <div class="captcha-modal-content">
          <div class="captcha-modal-header">
            <h2 id="recaptcha-modal-title" class="captcha-modal-title">Please Verify You Are Human</h2>
            <button id="recaptcha-close-btn" class="captcha-modal-close-btn" aria-label="Close verification modal">&times;</button>
          </div>
          <div class="captcha-modal-body">
            <p>To continue, please complete the challenge below.</p>
            <div id="${this.containerId}" class="recaptcha-container">
              <!-- reCAPTCHA widget will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Set up close button handler
    const closeBtn = document.getElementById('recaptcha-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
        if (this.currentReject) {
          this.currentReject(new Error('User closed the reCAPTCHA challenge.'));
        }
      });
    }

    this.modalElement = document.getElementById(this.modalId);
  }

  /**
   * Shows the reCAPTCHA modal.
   */
  private show(): void {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.add('visible');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * Hides the reCAPTCHA modal.
   */
  hide(): void {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.classList.remove('visible');
      document.body.style.overflow = '';
    }
  }

  /**
   * Removes the modal from DOM
   */
  destroy(): void {
    const modal = document.getElementById(this.modalId);
    if (modal) {
      modal.remove();
    }
    this.modalElement = null;
  }

  /**
   * Get CAPTCHA token with UI handling
   * Automatically shows modal if reCAPTCHA is needed
   */
  async getCaptchaToken(): Promise<CaptchaResult> {
    return new Promise(async (resolve, reject) => {
      this.currentResolve = resolve;
      this.currentReject = reject;

      const callbacks: CaptchaCallbacks = {
        onRecaptchaNeeded: () => {
          // Show modal when reCAPTCHA is needed (Turnstile failed)
          this.createModal();
          this.show();
        },
        onSuccess: () => {
          // Hide modal on success
          this.hide();
        },
        onError: () => {
          // Hide modal on error
          this.hide();
        },
      };

      try {
        const result = await getCaptchaToken(callbacks);
        resolve(result);
      } catch (error) {
        this.hide();
        reject(error instanceof Error ? error : new Error(String(error)));
      } finally {
        this.currentResolve = null;
        this.currentReject = null;
      }
    });
  }
}

/**
 * Create and show CAPTCHA modal (convenience function)
 */
export async function showCaptchaModal(
  options: CaptchaModalOptions = {}
): Promise<CaptchaResult> {
  const modal = new CaptchaModal(options);
  try {
    const result = await modal.getCaptchaToken();
    if (options.onComplete) {
      options.onComplete(result);
    }
    return result;
  } catch (error) {
    if (options.onCancel) {
      options.onCancel();
    }
    throw error;
  }
}
