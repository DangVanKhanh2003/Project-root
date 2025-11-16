/**
 * CAPTCHA Provider (Pure Token Acquisition Logic)
 * Handles Cloudflare Turnstile and Google reCAPTCHA token acquisition
 * This module provides token acquisition only - JWT handling is in @downloader/core
 */

// --- Configuration ---
export interface CaptchaConfig {
  turnstileSiteKey: string;
  recaptchaSiteKey: string;
  turnstileScriptUrl?: string;
  recaptchaScriptUrl?: string;
}

export interface CaptchaCallbacks {
  onSuccess?: (token: string) => void;
  onError?: (error: Error) => void;
  onExpired?: (error: Error) => void;
  onRecaptchaNeeded?: () => void;
}

export interface CaptchaResult {
  token: string;
  type: 'turnstile' | 'recaptcha';
}

// Default configuration
const DEFAULT_CONFIG: CaptchaConfig = {
  turnstileSiteKey: '1x00000000000000000000BB', // Standard Turnstile placeholder
  recaptchaSiteKey: '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI', // Standard reCAPTCHA placeholder
  turnstileScriptUrl: 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback',
  recaptchaScriptUrl: 'https://www.google.com/recaptcha/api.js?onload=onloadRecaptchaCallback&render=explicit',
};

// --- State ---
let config: CaptchaConfig = { ...DEFAULT_CONFIG };
let turnstileScriptLoaded = false;
let recaptchaScriptLoaded = false;

/**
 * Configure CAPTCHA provider with custom site keys
 */
export function configureCaptcha(customConfig: Partial<CaptchaConfig>): void {
  config = { ...DEFAULT_CONFIG, ...customConfig };
}

/**
 * Get current configuration
 */
export function getCaptchaConfig(): Readonly<CaptchaConfig> {
  return { ...config };
}

/**
 * Dynamically loads a script and returns a promise.
 */
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = () => {
      reject(new Error(`Failed to load script: ${src}`));
    };
    document.head.appendChild(script);
  });
}

/**
 * Runs the invisible Cloudflare Turnstile challenge.
 */
export async function getTurnstileToken(
  callbacks: CaptchaCallbacks = {}
): Promise<string> {
  const { onSuccess, onError } = callbacks;

  return new Promise(async (resolve, reject) => {
    try {
      if (!turnstileScriptLoaded) {
        (window as any).onloadTurnstileCallback = () => {
          turnstileScriptLoaded = true;
          renderTurnstile(resolve, reject, onSuccess, onError);
        };
        await loadScript(config.turnstileScriptUrl!, 'turnstile-script');
      } else {
        renderTurnstile(resolve, reject, onSuccess, onError);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) onError(err);
      reject(err);
    }
  });
}

function renderTurnstile(
  resolve: (value: string) => void,
  reject: (reason: Error) => void,
  onSuccess?: (token: string) => void,
  onError?: (error: Error) => void
): void {
  if (!document.getElementById('turnstile-widget-container')) {
    const turnstileContainer = document.createElement('div');
    turnstileContainer.id = 'turnstile-widget-container';
    turnstileContainer.style.display = 'none';
    document.body.appendChild(turnstileContainer);
  }

  (window as any).turnstile.render('#turnstile-widget-container', {
    sitekey: config.turnstileSiteKey,
    mode: 'invisible',
    callback: function (token: string) {
      if (onSuccess) onSuccess(token);
      resolve(token);
    },
    'error-callback': function () {
      const error = new Error('Cloudflare Turnstile challenge failed.');
      if (onError) onError(error);
      reject(error);
    },
  });
  // Since it's invisible, we need to explicitly execute it
  (window as any).turnstile.execute();
}

/**
 * Runs the Google reCAPTCHA v2 challenge.
 * NOTE: Requires UI modal to be shown by caller (this is pure logic)
 */
export async function getRecaptchaToken(
  containerId: string,
  callbacks: CaptchaCallbacks = {}
): Promise<string> {
  const { onSuccess, onError, onExpired } = callbacks;

  return new Promise(async (resolve, reject) => {
    try {
      if (!recaptchaScriptLoaded) {
        (window as any).onloadRecaptchaCallback = () => {
          recaptchaScriptLoaded = true;
          renderRecaptcha(containerId, resolve, reject, onSuccess, onError, onExpired);
        };
        await loadScript(config.recaptchaScriptUrl!, 'recaptcha-script');
      } else {
        renderRecaptcha(containerId, resolve, reject, onSuccess, onError, onExpired);
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (onError) onError(err);
      reject(err);
    }
  });
}

function renderRecaptcha(
  containerId: string,
  resolve: (value: string) => void,
  reject: (reason: Error) => void,
  onSuccess?: (token: string) => void,
  onError?: (error: Error) => void,
  onExpired?: (error: Error) => void
): void {
  (window as any).grecaptcha.render(containerId, {
    sitekey: config.recaptchaSiteKey,
    callback: (token: string) => {
      if (onSuccess) onSuccess(token);
      resolve(token);
    },
    'expired-callback': () => {
      const error = new Error('reCAPTCHA challenge expired.');
      if (onExpired) onExpired(error);
      if (onError) onError(error);
      reject(error);
    },
    'error-callback': () => {
      const error = new Error('reCAPTCHA challenge failed to load.');
      if (onError) onError(error);
      reject(error);
    },
  });
}

/**
 * Orchestrates the captcha flow: Turnstile first, then reCAPTCHA as a fallback.
 * NOTE: For reCAPTCHA, caller must handle modal UI
 */
export async function getCaptchaToken(
  callbacks: CaptchaCallbacks = {}
): Promise<CaptchaResult> {
  const { onRecaptchaNeeded } = callbacks;
  const recaptchaContainerId = callbacks.onRecaptchaNeeded
    ? 'recaptcha-widget-container'
    : 'recaptcha-widget-container';

  try {
    const turnstileToken = await getTurnstileToken(callbacks);
    return { token: turnstileToken, type: 'turnstile' };
  } catch (turnstileError) {
    // Notify caller that reCAPTCHA UI is needed
    if (onRecaptchaNeeded) {
      onRecaptchaNeeded();
    }

    try {
      const recaptchaToken = await getRecaptchaToken(recaptchaContainerId, callbacks);
      return { token: recaptchaToken, type: 'recaptcha' };
    } catch (recaptchaError) {
      throw new Error('Captcha verification failed.');
    }
  }
}
