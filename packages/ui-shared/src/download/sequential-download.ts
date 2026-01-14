/**
 * Sequential Download Strategy
 *
 * This file contains the logic for downloading multiple files one by one
 * by simulating anchor clicks. It is designed as a simple and reliable
 * fallback when more advanced APIs are not available or are failing.
 *
 * ⚠️ DOM-dependent - Uses document.createElement and document.body
 */

// ============================================================
// TYPES
// ============================================================

export interface DownloadFile {
  url: string;
  name?: string;
}

export interface SequentialDownloadProgress {
  completed: number;
  total: number;
  currentFile: string;
}

export interface SequentialDownloadOptions {
  onProgress?: (progress: SequentialDownloadProgress) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
  shouldCancel?: () => boolean;
  delayBetweenFiles?: number; // milliseconds, default 2500
}

// ============================================================
// SEQUENTIAL DOWNLOAD
// ============================================================

/**
 * A helper function to create a delay.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Starts the sequential download process for a list of files.
 *
 * Creates invisible anchor elements and programmatically clicks them
 * to trigger browser downloads. Includes delays to avoid browser blocking.
 *
 * @param files - Array of file objects with url and optional name
 * @param options - Configuration options for the download process
 */
export async function startSequentialDownload(
  files: DownloadFile[],
  options: SequentialDownloadOptions = {}
): Promise<void> {
  const { onProgress, onComplete, onError, shouldCancel, delayBetweenFiles = 2500 } = options;

  for (let i = 0; i < files.length; i++) {
    if (shouldCancel && shouldCancel()) {
      return;
    }

    const file = files[i];

    try {
      // Update progress before starting the download
      if (onProgress) {
        onProgress({
          completed: i,
          total: files.length,
          currentFile: file.name || `file-${i + 1}`,
        });
      }

      const anchor = document.createElement('a');
      // Using original URL as requested, without proxy
      anchor.href = file.url;
      anchor.download = file.name || `file-${i + 1}`;
      anchor.rel = 'noopener noreferrer';
      anchor.style.display = 'none';

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      // Wait before starting the next download to avoid browser blocking
      // Don't wait after the last file
      if (i < files.length - 1) {
        await delay(delayBetweenFiles);
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      }
      // Optional: decide if you want to stop on error or continue
    }
  }

  // Final progress update
  if (onProgress) {
    onProgress({
      completed: files.length,
      total: files.length,
      currentFile: '',
    });
  }

  if (onComplete) {
    onComplete();
  }
}

/**
 * Download a single file using anchor click method
 *
 * @param url - URL to download
 * @param filename - Optional filename
 */
export function downloadFile(url: string, filename?: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  if (filename) {
    anchor.download = filename;
  }
  anchor.rel = 'noopener noreferrer';
  anchor.style.display = 'none';

  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
