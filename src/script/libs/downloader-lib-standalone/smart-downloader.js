/**
 * Smart Download Orchestrator
 * Tries multiple download methods in order of preference to handle CORS issues
 */

import { downloadStreamToRAM } from './stream-downloader-to-ram.js';
import { downloadViaBackendProxy } from './backend-proxy-downloader.js';
import { downloadViaCorsProxy } from './cors-proxy-downloader.js';

/**
 * WHY: Smart download system with multiple fallbacks for CORS issues
 * CONTRACT: (url:string, filename:string, onProgress:function, signal:AbortSignal?) → Promise<Blob>
 * PRE: Valid stream URL and filename, browser supports required APIs
 * POST: Returns Blob via best available method, progress callbacks fired
 * EDGE: All methods fail → throw SmartDownloadError; AbortSignal → throw AbortError
 * USAGE: const blob = await smartDownload(url, filename, (progress) => updateUI(progress));
 */
export async function smartDownload(streamUrl, filename, onProgress, signal = null) {
    if (!streamUrl || typeof streamUrl !== 'string') {
        throw new Error('Invalid stream URL provided to smart downloader');
    }

    if (!filename || typeof filename !== 'string') {
        throw new Error('Invalid filename provided to smart downloader');
    }

    if (typeof onProgress !== 'function') {
        throw new Error('onProgress callback is required');
    }


    const downloadAttempts = [];

    // Method 1: Direct Stream Download (fastest)
    try {
        onProgress({ status: 'trying', method: 'Direct Stream', step: 1, total: 4 });

        const blob = await downloadStreamToRAM(streamUrl, onProgress, signal);

        downloadAttempts.push({ method: 'DirectStream', success: true, size: blob.size });

        return blob;

    } catch (error) {
        downloadAttempts.push({ method: 'DirectStream', success: false, error: error.message });

        // If user cancelled, don't try other methods
        if (error.name === 'AbortError') {
            throw error;
        }

        // If not CORS error, try other methods anyway
        if (error.message !== 'CORS_ERROR') {
        }
    }

    // Method 2: Backend Proxy (reliable)
    try {
        onProgress({ status: 'trying', method: 'Backend Proxy', step: 2, total: 4 });

        const blob = await downloadViaBackendProxy(streamUrl, onProgress, signal);

        downloadAttempts.push({ method: 'BackendProxy', success: true, size: blob.size });

        return blob;

    } catch (error) {
        downloadAttempts.push({ method: 'BackendProxy', success: false, error: error.message });

        // If user cancelled, don't try other methods
        if (error.name === 'AbortError') {
            throw error;
        }

        // Continue to next method
    }

    // Method 3: CORS Proxy Services (public services)
    try {
        onProgress({ status: 'trying', method: 'CORS Proxy', step: 3, total: 4 });

        const blob = await downloadViaCorsProxy(streamUrl, onProgress, signal);

        downloadAttempts.push({ method: 'CorsProxy', success: true, size: blob.size });

        return blob;

    } catch (error) {
        downloadAttempts.push({ method: 'CorsProxy', success: false, error: error.message });

        // If user cancelled, don't try other methods
        if (error.name === 'AbortError') {
            throw error;
        }

        // Continue to final fallback
    }

    // Method 4: Direct Download Fallback (last resort)
    onProgress({ status: 'trying', method: 'Direct Download', step: 4, total: 4 });

    downloadAttempts.push({ method: 'DirectDownload', success: true, note: 'Fallback redirect' });

    // Log all attempts for debugging
    downloadAttempts.forEach((attempt, index) => {
    });

    // Create error with detailed information
    const smartError = new Error('SMART_DOWNLOAD_FALLBACK');
    smartError.attempts = downloadAttempts;
    smartError.fallbackUrl = streamUrl;
    smartError.filename = filename;

    throw smartError;
}

/**
 * Get download method status for user display
 */
export function getDownloadMethodStatus() {
    return {
        directStream: 'Available',
        backendProxy: 'Available', // Check with actual backend
        corsProxy: 'Available',
        directDownload: 'Available (Fallback)'
    };
}

/**
 * Check if backend proxy is available
 */
export async function checkBackendProxyAvailability() {
    try {
        const response = await fetch(`${getApiBaseUrl()}/proxy-stream`, {
            method: 'OPTIONS',
            headers: { 'Accept': 'application/json' }
        });
        return response.ok;
    } catch (error) {
        return false;
    }
}