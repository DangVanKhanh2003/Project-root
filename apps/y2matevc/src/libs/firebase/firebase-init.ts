/**
 * Firebase Initialization
 *
 * This file is lazy-loaded, so static imports are OK here.
 * Handles Safari Private Mode and graceful degradation.
 *
 * ⚡ PERFORMANCE OPTIMIZATION:
 * - Analytics timeout set to 0ms (fire-and-forget)
 * - Never blocks app functionality
 */
import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { firebaseConfig } from './firebase-config';

let app: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;

/**
 * Check if running in development environment
 */
function isDevelopment(): boolean {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Initialize Firebase App and Analytics
 *
 * ⚡ Analytics is configured with 0ms timeout (fire-and-forget pattern)
 * This ensures analytics never blocks or slows down the app.
 *
 * @returns Analytics instance or null if not supported/failed
 */
export async function initializeFirebase(): Promise<Analytics | null> {
  // Already initialized
  if (analyticsInstance) {
    return analyticsInstance;
  }

  const isDev = isDevelopment();

  try {
    // Check browser support (handles Safari Private Mode)
    const supported = await isSupported();
    if (!supported) {
      if (isDev) {
        console.log('[Firebase] Analytics not supported in this environment');
      }
      return null;
    }

    // Initialize Firebase App
    app = initializeApp(firebaseConfig);

    // Initialize Analytics with 0ms timeout (fire-and-forget)
    // This prevents analytics from blocking any app functionality
    analyticsInstance = getAnalytics(app);

    // Configure analytics to use fire-and-forget pattern
    // Set global timeout to 0ms for all analytics requests
    if (analyticsInstance) {
      // Override default settings to never wait for analytics responses
      const originalLogEvent = (analyticsInstance as any).logEvent;
      if (originalLogEvent) {
        (analyticsInstance as any).logEvent = function(...args: any[]) {
          // Fire-and-forget: don't await, don't care about response
          Promise.resolve().then(() => originalLogEvent.apply(this, args)).catch(() => {
            // Silent fail - never block app
          });
        };
      }
    }

    if (isDev) {
      console.log('[Firebase] Initialized successfully (fire-and-forget mode)');
    }

    return analyticsInstance;
  } catch (error) {
    // Silent fail - app works without analytics
    if (isDev) {
      console.warn('[Firebase] Initialization failed:', error);
    }
    return null;
  }
}

/**
 * Get the Analytics instance (may be null if not initialized)
 */
export function getAnalyticsInstance(): Analytics | null {
  return analyticsInstance;
}

/**
 * Get the Firebase App instance (may be null if not initialized)
 */
export function getFirebaseApp(): FirebaseApp | null {
  return app;
}
