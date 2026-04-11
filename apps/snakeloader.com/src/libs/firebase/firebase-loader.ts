/**
 * Firebase Analytics Lazy Loader
 *
 * Loads Firebase Analytics using Idle Callback strategy to avoid performance impact.
 * Zero blocking on page load - Firebase only loads when browser is idle.
 */

import type { Analytics } from 'firebase/analytics';

// Module state
let analyticsInstance: Analytics | null = null;
let isLoading = false;
let isLoaded = false;

// Promise-based API for async access
let resolveAnalyticsPromise: (analytics: Analytics | null) => void;
const analyticsPromise = new Promise<Analytics | null>(resolve => {
  resolveAnalyticsPromise = resolve;
});

// Callback queue for legacy support
const readyCallbacks: Array<(analytics: Analytics | null) => void> = [];

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/**
 * Returns a promise that resolves with the Firebase Analytics instance.
 * Use this for async/await patterns.
 */
export function getAnalyticsInstance(): Promise<Analytics | null> {
  return analyticsPromise;
}

/**
 * Check if analytics is ready (synchronous)
 */
export function isAnalyticsReady(): boolean {
  return isLoaded && analyticsInstance !== null;
}

/**
 * Register a callback to be called when analytics is ready
 * Callbacks are processed in order of registration
 */
export function onAnalyticsReady(callback: (analytics: Analytics | null) => void): void {
  if (isLoaded) {
    // Already loaded - call immediately
    callback(analyticsInstance);
  } else {
    // Queue for later
    readyCallbacks.push(callback);
  }
}

/**
 * Load Firebase Analytics when browser is idle
 *
 * Uses requestIdleCallback to ensure Firebase loading doesn't block
 * critical rendering or user interactions.
 */
export function loadFirebaseWhenIdle(): void {
  if (isLoading || isLoaded) {
    return; // Already loading or loaded
  }

  isLoading = true;
  const isDev = isDevelopment();

  // Check if browser supports requestIdleCallback
  if ('requestIdleCallback' in window) {
    // Modern browsers: Load when idle, max 10s timeout
    requestIdleCallback(
      () => {
        if (isDev) {
          console.log('[Firebase] Loading via requestIdleCallback');
        }
        loadFirebase(isDev);
      },
      {
        timeout: 10000 // Maximum 10s delay for slow devices
      }
    );
  } else {
    // Fallback for Safari < 16.4 and older browsers
    if (isDev) {
      console.log('[Firebase] requestIdleCallback not supported, using setTimeout fallback');
    }

    // Load after 2s delay (safe fallback)
    setTimeout(() => {
      loadFirebase(isDev);
    }, 2000);
  }
}

/**
 * Dynamic import and initialize Firebase
 */
async function loadFirebase(isDev: boolean): Promise<void> {
  try {
    const { initializeFirebase } = await import('./firebase-init');
    const result = await initializeFirebase();

    if (result) {
      analyticsInstance = result.analytics;
      isLoaded = true;

      if (isDev) {
        console.log('[Firebase] Analytics loaded successfully');
      }

      // Resolve promise
      resolveAnalyticsPromise(analyticsInstance);

      // Call all registered callbacks
      readyCallbacks.forEach(callback => {
        try {
          callback(analyticsInstance);
        } catch (err) {
          // Silent fail for individual callbacks
        }
      });
      readyCallbacks.length = 0; // Clear callbacks

    } else {
      isLoaded = true;
      resolveAnalyticsPromise(null);

      if (isDev) {
        console.log('[Firebase] Analytics not available (returned null)');
      }

      // Notify callbacks with null
      readyCallbacks.forEach(callback => callback(null));
      readyCallbacks.length = 0;
    }

  } catch (error) {
    // Silent fail - app continues to work without analytics
    isLoaded = true;
    resolveAnalyticsPromise(null);

    if (isDev) {
      console.warn('[Firebase] Failed to load:', error);
    }

    readyCallbacks.forEach(callback => callback(null));
    readyCallbacks.length = 0;
  }
}
