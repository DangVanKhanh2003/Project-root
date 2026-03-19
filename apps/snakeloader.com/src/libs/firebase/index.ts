/**
 * Firebase Module - Public API
 *
 * Usage:
 *   import { loadFirebaseWhenIdle, logEvent } from './libs/firebase';
 *
 *   // In main.ts - load Firebase after delay
 *   setTimeout(() => loadFirebaseWhenIdle(), 5000);
 *
 *   // Anywhere - log events (auto-queued if Firebase not ready)
 *   logEvent('button_click', { button_id: 'submit' });
 */

// Loader
export { loadFirebaseWhenIdle, getAnalyticsInstance, isAnalyticsReady, onAnalyticsReady } from './firebase-loader';

// Analytics
export {
  logEvent,
  logPageView,
  logSearch,
  logDownloadStarted,
  logDownloadCompleted,
  logDownloadFailed,
  logButtonClick
} from './firebase-analytics';

// Config (rarely needed externally)
export { firebaseConfig } from './firebase-config';
