/**
 * Download Stream to RAM
 * Downloads stream URL to memory as Blob (for iOS small files)
 */

interface DownloadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface DownloadOptions {
  onProgress?: (progress: DownloadProgress) => void;
  signal?: AbortSignal;
}

/**
 * Download stream URL to RAM as Blob
 * @param url - Stream URL to download
 * @param options - Download options
 * @returns Blob containing downloaded data
 */
export async function downloadStreamToRAM(
  url: string,
  options: DownloadOptions = {}
): Promise<Blob> {
  const { onProgress, signal } = options;

  try {
    const response = await fetch(url, { signal });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentLength = response.headers.get('content-length');
    const total = contentLength ? parseInt(contentLength, 10) : 0;

    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let loaded = 0;

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      chunks.push(value);
      loaded += value.length;

      // Call progress callback (even if total is unknown)
      if (onProgress) {
        onProgress({
          loaded,
          total,
          percentage: total > 0 ? Math.round((loaded / total) * 100) : 0
        });
      }
    }

    // Combine chunks into single Blob
    const blob = new Blob(chunks as BlobPart[]);
    return blob;

  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error('Download was canceled');
    }
    throw error;
  }
}
