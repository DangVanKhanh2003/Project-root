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

/**
 * Initialize conversion controller
 * Sets up event listeners to wire modal events → business logic
 */
export function initConversionController(): void {
    // Listen to cancel events
    window.addEventListener('conversion:cancel', async (event) => {
        const { formatId } = event.detail;

        if (formatId) {
            ConvertLogic.cancelConversion(formatId);
        }
    });

    // Listen to download events
    window.addEventListener('conversion:download', async (event) => {
        const { formatId } = event.detail;

        if (formatId) {
            try {
                await ConvertLogic.downloadConvertedFile(formatId);
                // Modal will be updated by convert-logic (transition to EXPIRED or close)
            } catch (error) {
                // Error handling is done inside convert-logic
            }
        }
    });

    // Listen to retry events
    window.addEventListener('conversion:retry', async (event) => {
        const { formatId } = event.detail;

        if (formatId) {
            try {
                await ConvertLogic.reConvert(formatId);
                // Modal will be updated by convert-logic
            } catch (error) {
                // Error handling is done inside convert-logic
            }
        }
    });

    // Optional: Log modal lifecycle for debugging
    window.addEventListener('conversion:modal-opened', (event) => {
        const { formatId, status, videoTitle } = event.detail;
    });

    window.addEventListener('conversion:modal-closed', (event) => {
        const { formatId } = event.detail;
    });
}
