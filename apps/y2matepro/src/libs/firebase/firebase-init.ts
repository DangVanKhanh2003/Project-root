/**
 * Firebase Initialization
 *
 * This file is lazy-loaded, so static imports are OK here.
 * Handles Safari Private Mode and graceful degradation.
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

    // Initialize Analytics
    analyticsInstance = getAnalytics(app);

    if (isDev) {
      console.log('[Firebase] Initialized successfully');
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
