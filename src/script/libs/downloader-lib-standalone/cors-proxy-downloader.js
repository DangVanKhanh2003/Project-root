/**
 * CORS Proxy Downloader
 * Uses public CORS proxy services when backend proxy unavailable
 */

import { getTimeout } from '../../environment.js';

// List of reliable CORS proxy services
const CORS_PROXIES = [
    'https://cors-anywhere.herokuapp.com/',
    'https://api.allorigins.win/raw?url=',
    'https://corsproxy.io/?',
    'https://cors-proxy.fringe.zone/'
];

/**
 * WHY: Use CORS proxy when backend proxy unavailable
 * CONTRACT: (url:string, onProgress:function, signal:AbortSignal?) → Promise<Blob>
 * PRE: Valid stream URL, at least one CORS proxy working
 * POST: Returns Blob via CORS proxy, progress callbacks fired
 * EDGE: All proxies fail → throw CorsProxyError; AbortSignal → throw AbortError
 * USAGE: const blob = await downloadViaCorsProxy(url, (progress) => updateUI(progress));
 */
export async function downloadViaCorsProxy(streamUrl, onProgress, signal = null) {
    if (!streamUrl || typeof streamUrl !== 'string') {
        throw new Error('Invalid stream URL provided to CORS proxy');
    }

    if (typeof onProgress !== 'function') {
        throw new Error('onProgress callback is required');
    }


    const timeoutMs = getTimeout('streamDownload');
    const errors = [];

    // Try each CORS proxy in sequence
    for (let i = 0; i < CORS_PROXIES.length; i++) {
        const proxyBase = CORS_PROXIES[i];
        const proxyUrl = proxyBase + encodeURIComponent(streamUrl);


        try {
            const blob = await attemptCorsProxyDownload(proxyUrl, onProgress, signal, timeoutMs);
            return blob;

        } catch (error) {
            errors.push(`${proxyBase}: ${error.message}`);

            // If user cancelled, don't try other proxies
            if (error.name === 'AbortError') {
                throw error;
            }

            // Continue to next proxy
            continue;
        }
    }

    // All proxies failed
    const corsProxyError = new Error('CORS_PROXY_FAILED');
    corsProxyError.details = errors;
    throw corsProxyError;
}

/**
 * Attempt download with specific CORS proxy
 */
async function attemptCorsProxyDownload(proxyUrl, onProgress, signal, timeoutMs) {
    const timeoutController = new AbortController();

    const timeoutId = setTimeout(() => {
        timeoutController.abort();
    }, timeoutMs);

    try {
        // Setup fetch options with combined abort signals
        const fetchOptions = {
            method: 'GET',
            headers: {
                'Accept': 'application/octet-stream, */*',
                'User-Agent': 'Mozilla/5.0 (compatible; VideoDownloader/1.0)'
            }
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
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Check if proxy returned an error page instead of the file
        const contentType = response.headers.get('Content-Type');
        if (contentType && contentType.includes('text/html')) {
            throw new Error('Proxy returned HTML error page');
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

        // Re-throw abort errors
        if (error.name === 'AbortError') {
            throw error;
        }

        // Handle network and other errors
        throw new Error(`CORS proxy failed: ${error.message}`);
    }
}

/**
 * Calculate progress object from bytes
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