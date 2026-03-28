/**
 * Firebase Analytics Wrapper
 *
 * Provides a performance-optimized API for logging analytics events.
 * Key optimizations:
 * 1. Event Queuing: Events before Firebase loads are queued
 * 2. Double-defer: Uses requestIdleCallback + setTimeout(0) to avoid blocking INP
 * 3. Batch Processing: Queued events are processed in batches when idle
 * 4. Non-blocking: Never blocks main thread or INP metrics
 */

import { logEvent as fbLogEvent } from 'firebase/analytics';
import type { Analytics } from 'firebase/analytics';
import { getAnalyticsInstance } from './firebase-loader';

// Types
interface QueuedEvent {
  eventName: string;
  eventParams: Record<string, unknown>;
  timestamp: number;
}

// Event queue for events that happen before Firebase is loaded
let eventQueue: QueuedEvent[] = [];
let isProcessingQueue = false;
let analyticsReady = false;

// Maximum queue size to prevent memory issues
const MAX_QUEUE_SIZE = 100;

// Batch size for processing queued events
const BATCH_SIZE = 5;

/**
 * Check if running in development mode
 */
function isDevelopment(): boolean {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/**
 * Logs a custom event to Firebase Analytics with smart queuing.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Event Queuing: Events before Firebase loads are queued
 * 2. Double-defer: Uses requestIdleCallback + setTimeout to avoid blocking
 * 3. Batch Processing: Queued events are processed in batches when idle
 * 4. Non-blocking: Never blocks main thread or INP metrics
 *
 * @param eventName - The name of the event
 * @param eventParams - Optional parameters for the event
 */
export function logEvent(eventName: string, eventParams: Record<string, unknown> = {}): void {
  // If Firebase not ready, queue the event
  if (!analyticsReady) {
    eventQueue.push({
      eventName,
      eventParams,
      timestamp: Date.now()
    });

    // Limit queue size to prevent memory issues
    if (eventQueue.length > MAX_QUEUE_SIZE) {
      eventQueue.shift(); // Remove oldest event
    }

    // Try to process queue if not already processing
    if (!isProcessingQueue) {
      processEventQueue();
    }
    return;
  }

  // Firebase is ready - log directly with double-defer
  executeAnalyticsEvent(eventName, eventParams);
}

/**
 * Execute analytics event with double-defer for INP optimization
 *
 * CRITICAL PERFORMANCE PATTERN:
 *
 * Problem: Firebase SDK creates microtasks synchronously when calling fbLogEvent()
 * - Microtasks run BEFORE next paint (blocking presentation)
 * - Even inside requestIdleCallback, microtasks still block!
 *
 * Solution: Defer TWICE to push microtasks to next event loop cycle
 * 1. First defer: requestIdleCallback (wait for idle)
 * 2. Second defer: setTimeout(0) around fbLogEvent (push to macrotask queue, after paint)
 */
function executeAnalyticsEvent(eventName: string, eventParams: Record<string, unknown>): void {
  const executeTracking = (): void => {
    getAnalyticsInstance().then((analytics: Analytics | null) => {
      if (analytics) {
        // Mark as ready on first successful load
        if (!analyticsReady) {
          analyticsReady = true;
          if (isDevelopment()) {
            console.log('[Firebase Analytics] Ready - processing queued events');
          }
          processEventQueue(); // Process any queued events
        }

        // CRITICAL: Defer fbLogEvent() call with setTimeout(0)
        // This pushes Firebase microtasks to NEXT event loop cycle (after paint)
        setTimeout(() => {
          try {
            fbLogEvent(analytics, eventName, eventParams);
          } catch {
            // Silent fail - analytics should never break the app
          }
        }, 0);
      }
    }).catch(() => {
      // Silent fail
    });
  };

  // Use requestIdleCallback for modern browsers (defers to idle time)
  // Fallback to setTimeout for older browsers (defers to next tick)
  if ('requestIdleCallback' in window) {
    requestIdleCallback(executeTracking);
  } else {
    // Safari < 16.4 fallback - double setTimeout for same effect
    setTimeout(() => {
      setTimeout(executeTracking, 0);
    }, 0);
  }
}

/**
 * Process queued events when Firebase is ready
 * Processes in batches during idle time to avoid blocking
 */
function processEventQueue(): void {
  if (isProcessingQueue || eventQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  // Check if Firebase is ready
  getAnalyticsInstance().then((analytics: Analytics | null) => {
    if (analytics) {
      analyticsReady = true;

      // Process queue in idle time
      const processNextBatch = (): void => {
        if (eventQueue.length === 0) {
          isProcessingQueue = false;
          return;
        }

        // Process up to BATCH_SIZE events per batch
        const batch = eventQueue.splice(0, BATCH_SIZE);

        if ('requestIdleCallback' in window) {
          requestIdleCallback(() => {
            batch.forEach(event => {
              executeAnalyticsEvent(event.eventName, event.eventParams);
            });

            // Continue with next batch if more events
            if (eventQueue.length > 0) {
              processNextBatch();
            } else {
              isProcessingQueue = false;
            }
          });
        } else {
          // Fallback for older browsers
          setTimeout(() => {
            batch.forEach(event => {
              executeAnalyticsEvent(event.eventName, event.eventParams);
            });
            isProcessingQueue = false;
          }, 100);
        }
      };

      processNextBatch();
    } else {
      // Firebase not ready yet, try again later
      isProcessingQueue = false;
      setTimeout(() => processEventQueue(), 5000); // Retry after 5s
    }
  }).catch(() => {
    isProcessingQueue = false;
  });
}

// =====================================================
// Specialized Logging Functions (Optional - for convenience)
// =====================================================

/**
 * Log page view event
 */
export function logPageView(pageName: string, pagePath: string): void {
  logEvent('page_view', {
    page_title: pageName,
    page_path: pagePath
  });
}

/**
 * Log search event
 */
export function logSearch(query: string, inputType: 'url' | 'keyword'): void {
  logEvent('search', {
    search_term: query,
    input_type: inputType
  });
}

/**
 * Log download started event
 */
export function logDownloadStarted(format: string, quality: string): void {
  logEvent('download_started', {
    format,
    quality
  });
}

/**
 * Log download completed event
 */
export function logDownloadCompleted(format: string, quality: string, durationMs?: number): void {
  logEvent('download_completed', {
    format,
    quality,
    duration_ms: durationMs
  });
}

/**
 * Log download failed event
 */
export function logDownloadFailed(format: string, errorType: string): void {
  logEvent('download_failed', {
    format,
    error_type: errorType
  });
}

/**
 * Log button click event
 */
export function logButtonClick(buttonId: string, additionalParams?: Record<string, unknown>): void {
  logEvent('button_click', {
    button_id: buttonId,
    ...additionalParams
  });
}
