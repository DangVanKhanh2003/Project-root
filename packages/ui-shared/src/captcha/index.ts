/**
 * CAPTCHA Module - Token acquisition and UI
 *
 * @module @downloader/ui-shared/captcha
 *
 * This module provides CAPTCHA token acquisition (Turnstile + reCAPTCHA)
 * and modal UI for reCAPTCHA challenges.
 *
 * NOTE: JWT handling is in @downloader/core - this module only provides
 * CAPTCHA tokens that can be passed to protected API calls.
 */

export {
  configureCaptcha,
  getCaptchaConfig,
  getTurnstileToken,
  getRecaptchaToken,
  getCaptchaToken,
} from './captcha-provider';

export type {
  CaptchaConfig,
  CaptchaCallbacks,
  CaptchaResult,
} from './captcha-provider';

export {
  CaptchaModal,
  showCaptchaModal,
} from './captcha-modal';

export type {
  CaptchaModalOptions,
} from './captcha-modal';
