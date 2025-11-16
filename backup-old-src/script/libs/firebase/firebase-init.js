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

import { initializeApp } from 'firebase/app';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDlbiIYVGqJ4dGv70KwbgtPTPAzFcOPcjI",
  authDomain: "ytmp3-5af1c.firebaseapp.com",
  projectId: "ytmp3-5af1c",
  storageBucket: "ytmp3-5af1c.firebasestorage.app",
  messagingSenderId: "638260951003",
  appId: "1:638260951003:web:89c50434be60f33a5819fe",
  measurementId: "G-XSP681CDWC"
};

/**
 * Initialize Firebase app and analytics
 *
 * @returns {Promise<{app: FirebaseApp, analytics: Analytics}|null>}
 *          Returns Firebase instances or null if initialization fails
 */
export async function initializeFirebase() {
  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  try {
    // Check if analytics is supported (Safari private mode returns false)
    const analyticsSupported = await isSupported();

    if (!analyticsSupported) {
      if (isDev) {
      }
      return null;
    }

    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);

    // Initialize Analytics (auto-tracking enabled by default)
    const analytics = getAnalytics(app);

    if (isDev) {
    }

    return { app, analytics };

  } catch (error) {
    // Silent fail - app continues to work without analytics
    return null;
  }
}
