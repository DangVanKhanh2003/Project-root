/**
 * Firebase Analytics Lazy Loader
 *
 * Loads Firebase Analytics using Idle Callback strategy to avoid performance impact.
 *
 * Loading Strategy:
 * 1. Wait for browser to be idle (requestIdleCallback)
 * 2. Maximum 5s timeout (load anyway if browser stays busy)
 * 3. Fallback to setTimeout for Safari < 16.4
 *
 * Performance Impact:
 * - No impact on LCP (loads after critical render)
 * - No impact on TBT (loads when browser is idle)
 * - No impact on CLS (no UI changes)
 * - Firebase SDK loaded separately from main bundle
 *
 * Timeline (typical):
 * - Fast devices (80%): Load at ~1-2s when browser idle
 * - Medium devices (15%): Load at ~2-3s when browser idle
 * - Slow devices (5%): Load at 5s timeout
 */

/**
 * Load Firebase Analytics when browser is idle
 *
 * Uses requestIdleCallback to ensure Firebase loading doesn't block
 * critical rendering or user interactions.
 */
export function loadFirebaseWhenIdle() {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  // Check if browser supports requestIdleCallback
  if ('requestIdleCallback' in window) {
    // Modern browsers: Load when idle, max 5s timeout
    requestIdleCallback(
      (deadline) => {
        if (isDev) {
        }

        loadFirebase(isDev);
      },
      {
        timeout: 5000, // Maximum 5s delay for slow devices
      }
    );
  } else {
    // Fallback for Safari < 16.4 and older browsers
    if (isDev) {
    }

    // Load after 2s delay (safe fallback)
    setTimeout(() => {
      loadFirebase(isDev);
    }, 2000);
  }
}

/**
 * Dynamic import and initialize Firebase
 *
 * @param {boolean} isDev - Development mode flag for logging
 */
function loadFirebase(isDev) {
  import('./firebase-init.js')
    .then(({ initializeFirebase }) => {
      return initializeFirebase();
    })
    .then((result) => {
      if (result && isDev) {
      } else if (!result && isDev) {
      }
    })
    .catch((error) => {
      // Silent fail - app continues to work without analytics
    });
}
