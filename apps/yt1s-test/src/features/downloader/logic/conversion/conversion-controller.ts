/**
 * Conversion Controller
 * Wires ConversionModal events to business logic
 *
 * This is the ONLY file that needs customization when reusing ConversionModal
 * in different projects. The modal itself is fully reusable via events.
 */

import * as ConvertLogic from './convert-logic.js';

// Type definitions for custom events
interface ConversionCancelEventDetail {
    formatId: string;
}

interface ConversionDownloadEventDetail {
    formatId: string;
}

interface ConversionRetryEventDetail {
    formatId: string;
}

interface ConversionModalOpenedEventDetail {
    formatId: string;
    status: string;
    videoTitle: string;
}

interface ConversionModalClosedEventDetail {
    formatId: string;
}

declare global {
    interface WindowEventMap {
        'conversion:cancel': CustomEvent<ConversionCancelEventDetail>;
        'conversion:download': CustomEvent<ConversionDownloadEventDetail>;
        'conversion:retry': CustomEvent<ConversionRetryEventDetail>;
        'conversion:modal-opened': CustomEvent<ConversionModalOpenedEventDetail>;
        'conversion:modal-closed': CustomEvent<ConversionModalClosedEventDetail>;
    }
}

// Named event handlers to prevent duplicates
const handleCancelEvent = async (event: CustomEvent<ConversionCancelEventDetail>) => {
    const { formatId } = event.detail;

    if (formatId) {
        ConvertLogic.cancelConversion(formatId);
    }
};

const handleDownloadEvent = async (event: CustomEvent<ConversionDownloadEventDetail>) => {
    const { formatId } = event.detail;

    if (formatId) {
        try {
            await ConvertLogic.downloadConvertedFile(formatId);
            // Modal will be updated by convert-logic (transition to EXPIRED or close)
        } catch (error) {
            // Error handling is done inside convert-logic
        }
    }
};

const handleRetryEvent = async (event: CustomEvent<ConversionRetryEventDetail>) => {
    const { formatId } = event.detail;

    if (formatId) {
        try {
            await ConvertLogic.reConvert(formatId);
            // Modal will be updated by convert-logic
        } catch (error) {
            // Error handling is done inside convert-logic
        }
    }
};

// Guard to prevent duplicate initialization
let isInitialized = false;

/**
 * Initialize conversion controller
 * Sets up event listeners to wire modal events → business logic
 *
 * WHY: Prevent duplicate event listeners that cause multiple API calls
 * CONTRACT: () → void - idempotent, safe to call multiple times
 * PRE: None
 * POST: Event listeners attached exactly once, isInitialized = true
 * EDGE: Called multiple times → only first call has effect
 * USAGE: initConversionController(); // Safe to call in module init
 */
export function initConversionController(): void {
    // Prevent duplicate initialization
    if (isInitialized) {
        return;
    }
    isInitialized = true;

    // Remove existing listeners first (defensive)
    window.removeEventListener('conversion:cancel', handleCancelEvent as EventListener);
    window.removeEventListener('conversion:download', handleDownloadEvent as EventListener);
    window.removeEventListener('conversion:retry', handleRetryEvent as EventListener);

    // Add fresh listeners
    window.addEventListener('conversion:cancel', handleCancelEvent as EventListener);
    window.addEventListener('conversion:download', handleDownloadEvent as EventListener);
    window.addEventListener('conversion:retry', handleRetryEvent as EventListener);

    // Optional: Log modal lifecycle for debugging
    window.addEventListener('conversion:modal-opened', (event) => {
        const { formatId, status, videoTitle } = event.detail;
    });

    window.addEventListener('conversion:modal-closed', (event) => {
        const { formatId } = event.detail;
    });
}
