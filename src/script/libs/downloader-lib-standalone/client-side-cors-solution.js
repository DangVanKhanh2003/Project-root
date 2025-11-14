/**
 * Client-Side CORS Solutions
 * Multiple client-only approaches to handle CORS without backend changes
 */

import { downloadViaCorsProxy } from './cors-proxy-downloader.js';
import { getTimeout } from '../../environment.js';

// Reliable CORS proxy services (updated list)
const WORKING_CORS_PROXIES = [
    {
        name: 'AllOrigins',
        url: 'https://api.allorigins.win/raw?url=',
        reliable: true
    },
    {
        name: 'CORS Proxy IO',
        url: 'https://corsproxy.io/?',
        reliable: true
    },
    {
        name: 'Proxy CORS',
        url: 'https://proxy-cors.isomorphic-git.org/',
        reliable: false // Backup
    }
];

/**
 * WHY: Client-side CORS solution without backend modification
 * CONTRACT: (url:string, filename:string, onProgress:function, signal:AbortSignal?) → Promise<Blob|null>
 * PRE: Valid stream URL, browser supports fetch API
 * POST: Returns Blob if successful, null if fallback needed, progress callbacks fired
 * EDGE: All proxies fail → return null; AbortSignal → throw AbortError
 * USAGE: const blob = await clientSideCorsDownload(url, filename, (progress) => updateUI(progress));
 */
export async function clientSideCorsDownload(streamUrl, filename, onProgress, signal = null) {

    // Method 1: Try reliable CORS proxies first
    for (const proxy of WORKING_CORS_PROXIES.filter(p => p.reliable)) {
        try {
            onProgress({
                status: 'trying_proxy',
                proxy: proxy.name,
                message: `Trying ${proxy.name} proxy...`
            });

            const blob = await downloadWithProxy(streamUrl, proxy, onProgress, signal);

            return blob;

        } catch (error) {

            if (error.name === 'AbortError') {
                throw error; // User cancelled
            }
            // Continue to next proxy
        }
    }

    // Method 2: Try backup proxies
    for (const proxy of WORKING_CORS_PROXIES.filter(p => !p.reliable)) {
        try {
            onProgress({
                status: 'trying_backup',
                proxy: proxy.name,
                message: `Trying backup ${proxy.name}...`
            });

            const blob = await downloadWithProxy(streamUrl, proxy, onProgress, signal);

            return blob;

        } catch (error) {

            if (error.name === 'AbortError') {
                throw error; // User cancelled
            }
            // Continue to next proxy
        }
    }

    // Method 3: Try iframe download (works for some cases)
    try {
        onProgress({
            status: 'trying_iframe',
            message: 'Trying alternative download method...'
        });

        const success = await tryIframeDownload(streamUrl, filename);
        if (success) {
            onProgress({
                status: 'iframe_success',
                message: 'Download started via alternative method'
            });
            return 'IFRAME_DOWNLOAD'; // Special indicator
        }

    } catch (error) {
    }

    // All methods failed - return null to indicate fallback needed
    return null;
}

/**
 * Download using specific CORS proxy
 */
async function downloadWithProxy(streamUrl, proxy, onProgress, signal) {
    const proxyUrl = proxy.url + encodeURIComponent(streamUrl);
    const timeoutMs = getTimeout('streamDownload');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
        // Combine signals
        let finalSignal = controller.signal;
        if (signal) {
            const combinedController = new AbortController();
            signal.addEventListener('abort', () => combinedController.abort());
            controller.signal.addEventListener('abort', () => combinedController.abort());
            finalSignal = combinedController.signal;
        }

        const response = await fetch(proxyUrl, {
            signal: finalSignal,
            headers: {
                'Accept': '*/*',
                'User-Agent': 'Mozilla/5.0 (compatible; VideoDownloader/1.0)'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // Check if we got HTML error page
        const contentType = response.headers.get('Content-Type') || '';
        if (contentType.includes('text/html')) {
            throw new Error('Proxy returned error page');
        }

        const contentLength = response.headers.get('Content-Length');
        const totalBytes = contentLength ? parseInt(contentLength, 10) : null;

        const reader = response.body.getReader();
        const chunks = [];
        let receivedBytes = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            chunks.push(value);
            receivedBytes += value.length;

            // Progress callback
            onProgress({
                status: 'downloading',
                proxy: proxy.name,
                loaded: receivedBytes,
                total: totalBytes,
                loadedMB: receivedBytes / (1024 * 1024),
                totalMB: totalBytes ? totalBytes / (1024 * 1024) : null,
                percentage: totalBytes ? (receivedBytes / totalBytes) * 100 : null
            });
        }

        clearTimeout(timeoutId);
        return new Blob(chunks);

    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

/**
 * Try iframe download method (works for some URLs)
 */
async function tryIframeDownload(streamUrl, filename) {
    return new Promise((resolve) => {
        try {
            // Create hidden iframe
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.style.position = 'absolute';
            iframe.style.left = '-9999px';

            // Set up download
            iframe.src = streamUrl;

            // Add to DOM
            document.body.appendChild(iframe);

            // Cleanup after timeout
            setTimeout(() => {
                try {
                    document.body.removeChild(iframe);
                } catch (e) {
                    // Ignore cleanup errors
                }
                resolve(true); // Assume it worked
            }, 3000);

        } catch (error) {
            resolve(false);
        }
    });
}

/**
 * Improved direct download with better UX
 */
export function improvedDirectDownload(streamUrl, filename, onFallback) {

    // Create download link with better UX
    const link = document.createElement('a');
    link.href = streamUrl;
    link.download = filename;
    link.style.display = 'none';

    // Add to DOM temporarily
    document.body.appendChild(link);

    try {
        // Trigger download
        link.click();

        // Show user-friendly message
        if (onFallback) {
            onFallback({
                type: 'direct_download',
                message: 'Ready to download If it doesn\'t work, the link will open in a new tab.',
                action: 'Your browser will handle the download'
            });
        }

        // Fallback: open in new tab after delay
        setTimeout(() => {
            window.open(streamUrl, '_blank');
        }, 2000);

    } finally {
        // Cleanup
        setTimeout(() => {
            try {
                document.body.removeChild(link);
            } catch (e) {
                // Ignore cleanup errors
            }
        }, 100);
    }
}

/**
 * Test which CORS proxies are currently working
 */
export async function testCorsProxies() {
    const testUrl = 'https://httpbin.org/json';
    const workingProxies = [];

    for (const proxy of WORKING_CORS_PROXIES) {
        try {
            const proxyUrl = proxy.url + encodeURIComponent(testUrl);
            const response = await fetch(proxyUrl, {
                method: 'GET',
                timeout: 5000
            });

            if (response.ok) {
                workingProxies.push(proxy.name);
            }
        } catch (error) {
        }
    }

    return workingProxies;
}