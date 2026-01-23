/**
 * Google Analytics Lazy Loader
 * Improves performance by deferring GA loading until user interaction or page idle
 */

let analyticsLoaded = false;

/**
 * Load Google Analytics script
 */
function loadGoogleAnalytics(): void {
  if (analyticsLoaded) return;

  analyticsLoaded = true;

  // Create and inject GA script
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=G-ZWPL9SR6P6';
  document.head.appendChild(script);

  // Initialize GA
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: any[]) {
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', 'G-ZWPL9SR6P6');

  console.log('[Analytics] Google Analytics loaded');
}

/**
 * Initialize lazy loading strategy for Google Analytics
 * Loads on first user interaction or after page is idle
 */
export function initAnalytics(): void {
  // Strategy 1: Load when page is idle (best for performance)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(loadGoogleAnalytics, { timeout: 2000 });
  } else {
    // Fallback: load after 2 seconds
    setTimeout(loadGoogleAnalytics, 2000);
  }

  // Strategy 2: Also load on first user interaction (for immediate tracking)
  const userInteractionEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
  const loadOnInteraction = () => {
    loadGoogleAnalytics();
    // Remove listeners after first interaction
    userInteractionEvents.forEach(event => {
      document.removeEventListener(event, loadOnInteraction);
    });
  };

  userInteractionEvents.forEach(event => {
    document.addEventListener(event, loadOnInteraction, { once: true, passive: true });
  });
}

// Type augmentation for Window
declare global {
  interface Window {
    dataLayer: any[];
  }
}
