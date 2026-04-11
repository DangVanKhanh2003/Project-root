/**
 * Firebase Analytics API Wrapper
 *
 * Performance-optimized event logging with:
 * - Event queuing before Firebase is ready (max 100 events)
 * - Double-defer technique to avoid blocking INP
 * - Batch processing during idle time
 * - Silent failures (never throws)
 */
import { logEvent as fbLogEvent } from 'firebase/analytics';
import {
  getAnalyticsWhenReady,
  isAnalyticsReady,
  getAnalyticsSync
} from './firebase-loader';

// ============================================================================
// Types
// ============================================================================

interface QueuedEvent {
  eventName: string;
  eventParams: Record<string, unknown>;
  timestamp: number;
}

// ============================================================================
// Configuration
// ============================================================================

const MAX_QUEUE_SIZE = 100;
const BATCH_SIZE = 5;
const BATCH_TIMEOUT = 5000;

// ============================================================================
// State
// ============================================================================

const eventQueue: QueuedEvent[] = [];
let isProcessingQueue = false;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Check if running in development environment
 */
function isDevelopment(): boolean {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1';
}

/**
 * Execute analytics event with double-defer to avoid blocking INP
 *
 * ⚡ PERFORMANCE: Double-deferred fire-and-forget pattern
 *
 * Problem: Firebase SDK creates microtasks synchronously when calling fbLogEvent()
 * - Microtasks run BEFORE next paint (blocking presentation)
 * - Even inside requestIdleCallback, microtasks still block!
 *
 * Solution: Defer TWICE to push microtasks to next event loop cycle
 * 1. First defer: requestIdleCallback (wait for browser idle)
 * 2. Second defer: setTimeout(0) around fbLogEvent (push to macrotask queue, after paint)
 */
function executeEvent(eventName: string, eventParams: Record<string, unknown>): void {
  const executeTracking = (): void => {
    const analytics = getAnalyticsSync();
    if (!analytics) return;

    // ⚡ CRITICAL: Defer fbLogEvent() call with setTimeout(0)
    // This pushes Firebase microtasks to NEXT event loop cycle (after paint)
    setTimeout(() => {
      try {
        fbLogEvent(analytics, eventName, eventParams);

        if (isDevelopment()) {
          console.log(`[Analytics] Event: ${eventName}`, eventParams);
        }
      } catch {
        // Silent fail - analytics should never break the app
      }
    }, 0);
  };

  // Use requestIdleCallback for modern browsers (defers to idle time)
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(executeTracking, { timeout: 3000 });
  } else {
    // Safari < 16.4 fallback - double setTimeout for same effect
    setTimeout(() => {
      setTimeout(executeTracking, 0);
    }, 0);
  }
}

/**
 * Process queued events in batches during idle time
 */
async function processEventQueue(): Promise<void> {
  if (isProcessingQueue || eventQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  // Wait for analytics to be ready
  const analytics = await getAnalyticsWhenReady();

  if (!analytics) {
    // Analytics not available, clear queue
    eventQueue.length = 0;
    isProcessingQueue = false;
    return;
  }

  const processBatch = (): void => {
    // Process a batch of events
    const batch = eventQueue.splice(0, BATCH_SIZE);

    batch.forEach(({ eventName, eventParams }) => {
      executeEvent(eventName, eventParams);
    });

    // Continue processing if more events in queue
    if (eventQueue.length > 0) {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(processBatch, { timeout: BATCH_TIMEOUT });
      } else {
        setTimeout(processBatch, 100);
      }
    } else {
      isProcessingQueue = false;
    }
  };

  // Start processing during idle time
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(processBatch, { timeout: BATCH_TIMEOUT });
  } else {
    setTimeout(processBatch, 100);
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Log an analytics event
 *
 * Safe to call anytime - events are queued if Firebase isn't ready yet.
 * Never blocks the main thread or throws errors.
 *
 * @param eventName - Name of the event (e.g., 'download_started')
 * @param eventParams - Optional event parameters
 *
 * @example
 * logEvent('download_started', { platform: 'youtube', format: 'mp3' });
 */
export function logEvent(
  eventName: string,
  eventParams: Record<string, unknown> = {}
): void {
  // If analytics is ready, execute immediately (with defer)
  if (isAnalyticsReady() && getAnalyticsSync()) {
    executeEvent(eventName, eventParams);
    return;
  }

  // Queue event for later processing
  eventQueue.push({
    eventName,
    eventParams,
    timestamp: Date.now()
  });

  // Prevent queue overflow - remove oldest events
  if (eventQueue.length > MAX_QUEUE_SIZE) {
    eventQueue.shift();

    if (isDevelopment()) {
      console.warn('[Analytics] Event queue overflow, oldest event dropped');
    }
  }

  // Start processing queue
  if (!isProcessingQueue) {
    processEventQueue();
  }
}

/**
 * Log a page view event
 *
 * @param pageName - Name/title of the page
 * @param pagePath - URL path of the page
 */
export function logPageView(pageName: string, pagePath: string): void {
  logEvent('page_view', {
    page_title: pageName,
    page_path: pagePath
  });
}

/**
 * Log a search event
 *
 * @param query - Search query
 * @param platform - Detected platform (youtube, tiktok, etc.)
 */
export function logSearch(query: string, platform: string): void {
  logEvent('search', {
    search_term: query,
    platform
  });
}

/**
 * Log download started event
 *
 * @param platform - Source platform
 * @param format - Download format (mp3, mp4, etc.)
 * @param quality - Quality setting
 */
export function logDownloadStarted(
  platform: string,
  format: string,
  quality: string
): void {
  logEvent('download_started', {
    platform,
    format,
    quality
  });
}

/**
 * Log download completed event
 *
 * @param platform - Source platform
 * @param format - Download format
 * @param quality - Quality setting
 * @param durationMs - Time taken in milliseconds
 */
export function logDownloadCompleted(
  platform: string,
  format: string,
  quality: string,
  durationMs: number
): void {
  logEvent('download_completed', {
    platform,
    format,
    quality,
    duration_ms: durationMs
  });
}

/**
 * Log download failed event
 *
 * @param platform - Source platform
 * @param format - Download format
 * @param errorType - Type of error
 */
export function logDownloadFailed(
  platform: string,
  format: string,
  errorType: string
): void {
  logEvent('download_failed', {
    platform,
    format,
    error_type: errorType
  });
}

/**
 * Log format selection event
 *
 * @param format - Selected format
 * @param quality - Selected quality
 */
export function logFormatSelected(format: string, quality: string): void {
  logEvent('format_selected', {
    format,
    quality
  });
}
