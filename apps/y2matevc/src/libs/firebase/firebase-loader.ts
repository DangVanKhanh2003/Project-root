/**
 * Firebase Lazy Loader
 *
 * Smart scheduler that loads Firebase when browser is idle.
 * Uses requestIdleCallback with setTimeout fallback for older browsers.
 *
 * Performance Strategy:
 * - Never blocks initial page render
 * - Waits for browser idle before loading
 * - Provides Promise-based API for analytics access
 * - Analytics requests use 0ms timeout (fire-and-forget)
 */
import type { Analytics } from 'firebase/analytics';

// Module state
let analyticsPromise: Promise<Analytics | null> | null = null;
let analyticsInstance: Analytics | null = null;
let analyticsReady = false;

// Callback queue for when analytics becomes ready
type AnalyticsCallback = (analytics: Analytics | null) => void;
const readyCallbacks: AnalyticsCallback[] = [];

/**
 * Check if running in development environment
 */
function isDevelopment(): boolean {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Load Firebase when browser is idle
 *
 * Uses requestIdleCallback to defer loading until browser has spare capacity.
 * Fallback to setTimeout(2000) for Safari < 16.4 and older browsers.
 */
export function loadFirebaseWhenIdle(): void {
  // Prevent duplicate loading
  if (analyticsPromise) {
    return;
  }

  const isDev = isDevelopment();

  analyticsPromise = new Promise<Analytics | null>((resolve) => {
    const loadFirebase = async (): Promise<void> => {
      try {
        if (isDev) {
          console.log('[Firebase Loader] Loading Firebase...');
        }

        // Dynamic import - keeps Firebase out of main bundle
        const { initializeFirebase } = await import('./firebase-init');
        analyticsInstance = await initializeFirebase();
        analyticsReady = true;

        // Notify all waiting callbacks
        readyCallbacks.forEach(callback => callback(analyticsInstance));
        readyCallbacks.length = 0;

        if (isDev) {
          console.log('[Firebase Loader] Firebase loaded successfully (fire-and-forget mode)');
        }

        resolve(analyticsInstance);
      } catch (error) {
        // Silent fail
        if (isDev) {
          console.warn('[Firebase Loader] Failed to load Firebase:', error);
        }
        analyticsReady = true; // Mark as ready (with null) to unblock waiters
        readyCallbacks.forEach(callback => callback(null));
        readyCallbacks.length = 0;
        resolve(null);
      }
    };

    // Use requestIdleCallback if available (95% of browsers)
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        () => {
          // Use setTimeout(0) for additional deferral
          setTimeout(loadFirebase, 0);
        },
        { timeout: 10000 } // Max 10s wait
      );
    } else {
      // Fallback for Safari < 16.4 and older browsers
      // 2s delay ensures initial render is complete
      setTimeout(loadFirebase, 2000);
    }
  });
}

/**
 * Get Analytics instance when ready
 *
 * Returns a Promise that resolves when Firebase is loaded.
 * Safe to call before Firebase is loaded - will wait.
 */
export function getAnalyticsWhenReady(): Promise<Analytics | null> {
  // Start loading if not already started
  if (!analyticsPromise) {
    loadFirebaseWhenIdle();
  }
  return analyticsPromise!;
}

/**
 * Check if Analytics is ready (synchronous)
 */
export function isAnalyticsReady(): boolean {
  return analyticsReady;
}

/**
 * Get Analytics instance (synchronous, may be null)
 */
export function getAnalyticsSync(): Analytics | null {
  return analyticsInstance;
}

/**
 * Register a callback to be called when Analytics is ready
 *
 * If already ready, callback is invoked immediately.
 */
export function onAnalyticsReady(callback: AnalyticsCallback): void {
  if (analyticsReady) {
    callback(analyticsInstance);
  } else {
    readyCallbacks.push(callback);
  }
}
