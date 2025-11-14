/**
 * Conversion Controller
 * Wires ConversionModal events to business logic
 *
 * This is the ONLY file that needs customization when reusing ConversionModal
 * in different projects. The modal itself is fully reusable via events.
 */

import * as ConvertLogic from './convert-logic.js';

/**
 * Initialize conversion controller
 * Sets up event listeners to wire modal events → business logic
 */
export function initConversionController() {
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
                console.error('Download failed:', error);
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
                console.error('Retry failed:', error);
                // Error handling is done inside convert-logic
            }
        }
    });

    // Optional: Log modal lifecycle for debugging
    window.addEventListener('conversion:modal-opened', (event) => {
        const { formatId, status, videoTitle } = event.detail;
        console.log(`[ConversionController] Modal opened: ${videoTitle} (${formatId}) - ${status}`);
    });

    window.addEventListener('conversion:modal-closed', (event) => {
        const { formatId } = event.detail;
        console.log(`[ConversionController] Modal closed: ${formatId}`);
    });
}
