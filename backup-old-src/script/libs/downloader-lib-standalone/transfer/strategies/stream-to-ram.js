/**
 * Stream Download to RAM Module
 * Downloads stream URL to RAM buffer before saving (iOS stability fix)
 */

// Import environment config for timeout
import { getTimeout } from '../../../../environment.js';

/**
 * WHY: Download stream URL to RAM buffer before saving (iOS stability)
 * CONTRACT: (url:string, onProgress:function, signal:AbortSignal?) → Promise<Blob>
 * PRE: Valid URL, browser supports ReadableStream, sufficient memory
 * POST: Returns Blob in memory, chunks array cleared, progress callbacks fired
 * EDGE: No Content-Length → progress shows bytes only; AbortSignal → throw AbortError
 */
export async function downloadStreamToRAM(url, onProgress, signal = null) {
  if (!url || typeof url !== 'string') {
    throw new Error('Invalid URL provided to downloadStreamToRAM');
  }

  if (typeof onProgress !== 'function') {
    throw new Error('onProgress callback is required');
  }

  // Feature detection
  if (!window.ReadableStream) {
    throw new Error('ReadableStream not supported in this browser');
  }


  // Create timeout abort controller for long downloads (30 minutes)
  const timeoutMs = getTimeout('streamDownload');
  const timeoutController = new AbortController();

  const timeoutId = setTimeout(() => {
    timeoutController.abort();
  }, timeoutMs);

  try {
    // Fetch with both user abort signal and timeout
    const fetchOptions = {};

    if (signal && timeoutController.signal) {
      // Combine user abort signal with timeout signal
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

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }

    // Get total size from Content-Length or Estimated-Content-Length header
    const contentLength = response.headers.get('Content-Length') || response.headers.get('Estimated-Content-Length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : null;


    // Get readable stream
    const reader = response.body.getReader();

    // Array to accumulate chunks
    const chunks = [];
    let receivedBytes = 0;

    // Read stream in chunks
    while (true) {
      // Check if download was cancelled before reading next chunk
      if (signal?.aborted) {
        await reader.cancel();
        throw new DOMException('Download cancelled', 'AbortError');
      }

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

    // ✅ Clear chunks array immediately to free memory
    // This prevents double memory usage (chunks + blob)
    chunks.length = 0;  // Clear array - frees ~100-150MB RAM instantly!

    // Final progress callback
    const finalProgress = calculateProgress(receivedBytes, totalBytes, true);
    onProgress(finalProgress);

    // Clear timeout since download completed successfully
    clearTimeout(timeoutId);

    // Return blob
    return blob;

  } catch (error) {
    // Clear timeout on error
    clearTimeout(timeoutId);

    // Handle abort
    if (error.name === 'AbortError') {
      throw error;
    }

    // Handle CORS errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      const corsError = new Error('CORS_ERROR');
      corsError.originalError = error;
      throw corsError;
    }

    // Handle other network errors that might be CORS-related
    if (error.message.includes('CORS') || error.message.includes('cross-origin')) {
      const corsError = new Error('CORS_ERROR');
      corsError.originalError = error;
      throw corsError;
    }

    // Handle other errors
    throw new Error(`Download failed: ${error.message}`);
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
