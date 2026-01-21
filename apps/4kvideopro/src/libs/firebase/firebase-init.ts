/**
 * Firebase Analytics Initialization
 *
 * Handles Firebase app initialization and analytics setup.
 * Uses modular SDK for minimal bundle size (app + analytics only).
 *
 * Auto-tracking events (no custom events):
 * - page_view: Automatic page views
 * - session_start: User sessions
 * - user_engagement: Scroll, clicks, time on page
 * - first_visit: New users
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { firebaseConfig } from './firebase-config';

// Module-level instances
let firebaseApp: FirebaseApp | null = null;
let analyticsInstance: Analytics | null = null;

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/**
 * Initialize Firebase app and analytics
 *
 * @returns Firebase instances or null if initialization fails
 */
export async function initializeFirebase(): Promise<{ app: FirebaseApp; analytics: Analytics } | null> {
  const isDev = isDevelopment();

  try {
    // Check if analytics is supported (Safari private mode returns false)
    const analyticsSupported = await isSupported();

    if (!analyticsSupported) {
      if (isDev) {
        console.log('[Firebase] Analytics not supported (private mode?)');
      }
      return null;
    }

    // Initialize Firebase app
    firebaseApp = initializeApp(firebaseConfig);

    // Initialize Analytics (auto-tracking enabled by default)
    analyticsInstance = getAnalytics(firebaseApp);

    if (isDev) {
      console.log('[Firebase] Initialized successfully');
    }

    return { app: firebaseApp, analytics: analyticsInstance };

  } catch (error) {
    // Silent fail - app continues to work without analytics
    if (isDev) {
      console.warn('[Firebase] Initialization failed:', error);
    }
    return null;
  }
}

/**
 * Get Firebase app instance
 */
export function getFirebaseApp(): FirebaseApp | null {
  return firebaseApp;
}

/**
 * Get Analytics instance (synchronous - may be null)
 */
export function getAnalyticsSync(): Analytics | null {
  return analyticsInstance;
}
