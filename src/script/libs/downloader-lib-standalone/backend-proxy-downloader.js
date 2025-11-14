/**
 * Backend Proxy Downloader
 * Routes stream downloads through backend to avoid CORS issues
 */

import { getApiBaseUrl, getTimeout } from '../../environment.js';

/**
 * WHY: Proxy stream download through backend to avoid CORS
 * CONTRACT: (url:string, onProgress:function, signal:AbortSignal?) → Promise<Blob>
 * PRE: Valid stream URL, backend proxy endpoint available
 * POST: Returns Blob from proxied stream, progress callbacks fired
 * EDGE: Backend errors → throw ProxyError; AbortSignal → throw AbortError
 * USAGE: const blob = await downloadViaBackendProxy(url, (progress) => updateUI(progress));
 */
export async function downloadViaBackendProxy(streamUrl, onProgress, signal = null) {
    if (!streamUrl || typeof streamUrl !== 'string') {
        throw new Error('Invalid stream URL provided to backend proxy');
    }

    if (typeof onProgress !== 'function') {
        throw new Error('onProgress callback is required');
    }


    // Create timeout abort controller
    const timeoutMs = getTimeout('streamDownload');
    const timeoutController = new AbortController();

    const timeoutId = setTimeout(() => {
        timeoutController.abort();
    }, timeoutMs);

    try {
        // Backend proxy endpoint
        const proxyUrl = `${getApiBaseUrl()}/proxy-stream`;

        // Prepare request body with stream URL
        const requestBody = JSON.stringify({
            streamUrl: streamUrl,
            webName: 'default' // From environment config
        });

        // Setup fetch options with combined abort signals
        const fetchOptions = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/octet-stream'
            },
            body: requestBody
        };

        // Handle abort signals
        if (signal && timeoutController.signal) {
            const combinedController = new AbortController();
            const abortHandler = () => combinedController.abort();

            signal.addEventListener('abort', abortHandler);
            timeoutController.signal.addEventListener('abort', abortHandler);

            fetchOptions.signal = combinedController.signal;
        } else if (signal) {
            fetchOptions.signal = signal;
        } else if (timeoutController.signal) {
            fetchOptions.signal = timeoutController.signal;
        }

        const response = await fetch(proxyUrl, fetchOptions);

        if (!response.ok) {
            // Handle backend errors
            const errorText = await response.text();

            if (response.status === 404) {
                throw new Error('PROXY_NOT_AVAILABLE');
            } else if (response.status >= 500) {
                throw new Error('PROXY_SERVER_ERROR');
            } else {
                throw new Error(`PROXY_ERROR: ${response.status}`);
            }
        }

        // Get total size from Content-Length header
        const contentLength = response.headers.get('Content-Length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : null;


        // Get readable stream
        const reader = response.body.getReader();

        // Array to accumulate chunks
        const chunks = [];
        let receivedBytes = 0;

        // Read stream in chunks
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                break;
            }

            // Accumulate chunk
            chunks.push(value);
            receivedBytes += value.length;

            // Calculate progress
            const progress = calculateProgress(receivedBytes, totalBytes);

            // Call progress callback
            try {
                onProgress(progress);
            } catch (error) {
            }
        }

        // Create Blob from accumulated chunks
        const blob = new Blob(chunks);

        // Final progress callback
        const finalProgress = calculateProgress(receivedBytes, totalBytes, true);
        onProgress(finalProgress);


        // Clear timeout
        clearTimeout(timeoutId);

        return blob;

    } catch (error) {
        // Clear timeout on error
        clearTimeout(timeoutId);

        // Handle abort
        if (error.name === 'AbortError') {
            throw error;
        }

        // Handle proxy-specific errors
        if (error.message.startsWith('PROXY_')) {
            throw error;
        }

        // Handle network errors
        throw new Error(`Proxied download failed: ${error.message}`);
    }
}

/**
 * Calculate progress object from bytes
 * @param {number} receivedBytes - Bytes received so far
 * @param {number|null} totalBytes - Total bytes (null if unknown)
 * @param {boolean} isComplete - Whether download is complete
 * @returns {Object} Progress object
 */
function calculateProgress(receivedBytes, totalBytes, isComplete = false) {
    const loadedMB = receivedBytes / (1024 * 1024);
    const totalMB = totalBytes ? totalBytes / (1024 * 1024) : null;
    const percentage = totalBytes ? (receivedBytes / totalBytes) * 100 : null;

    return {
        loaded: receivedBytes,
        total: totalBytes,
        percentage: percentage,
        loadedMB: loadedMB,
        totalMB: totalMB,
        isComplete: isComplete
    };
}