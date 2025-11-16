/**
 * Shared utility functions
 */

/**
 * Generate YouTube thumbnail URL from video ID
 * @param videoId - YouTube video ID
 * @returns Thumbnail URL
 */
export function generateYoutubeThumbnail(videoId: string): string {
  if (!videoId) {
    return '';
  }
  return `https://i.ytimg.com/vi/${videoId}/0.jpg`;
}

/**
 * Truncate string to max length
 * @param str - String to truncate
 * @param maxLength - Maximum length
 * @returns Truncated string
 */
export function truncateString(str: string | null | undefined, maxLength: number = 120): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.substring(0, maxLength) + '...';
}

/**
 * Triggers a file download by creating and clicking a temporary anchor link.
 * This is more reliable than window.open for avoiding pop-up blockers.
 * @param url - The URL of the file to download.
 * @param filename - Optional. The desired filename for the download.
 * @param openInNewTab - Whether to open in new tab instead of download
 */
export function triggerDownload(url: string, filename?: string, openInNewTab: boolean = false): void {
    const anchor = document.createElement('a');
    anchor.href = url;

    if (filename) {
        anchor.download = filename;
    }

    if (openInNewTab) {
        anchor.target = '_blank';
    }

    // The 'download' attribute suggests a download. 'noopener' is for security.
    anchor.rel = 'noopener noreferrer';

    // Append to the DOM, click, and then remove
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

/**
 * Parse file size from various formats to MB (number)
 * @param sizeValue - Size value from API (can be "45.6 MB", 45.6, or bytes)
 * @returns Size in MB, or null if invalid
 */
export function parseSizeToMB(sizeValue: string | number | null | undefined): number | null {
  if (!sizeValue) return null;

  // If string with "MB" (e.g., "45.6 MB")
  if (typeof sizeValue === 'string' && sizeValue.includes('MB')) {
    const parsed = parseFloat(sizeValue);
    return isNaN(parsed) ? null : parsed;
  }

  // If string with "GB" (e.g., "1.2 GB")
  if (typeof sizeValue === 'string' && sizeValue.includes('GB')) {
    const parsed = parseFloat(sizeValue);
    return isNaN(parsed) ? null : parsed * 1024;
  }

  // If string with "KB" (e.g., "512 KB")
  if (typeof sizeValue === 'string' && sizeValue.includes('KB')) {
    const parsed = parseFloat(sizeValue);
    return isNaN(parsed) ? null : parsed / 1024;
  }

  // If number (assume MB if < 10000, otherwise bytes)
  if (typeof sizeValue === 'number') {
    // If large number, assume bytes
    if (sizeValue > 10000) {
      return parseFloat((sizeValue / (1024 * 1024)).toFixed(1));
    }
    // Small number, assume MB
    return sizeValue;
  }

  // Try parsing as string number
  const parsed = parseFloat(sizeValue as string);
  return isNaN(parsed) ? null : parsed;
}

/**
 * Format MB size to display string with 1 decimal place
 * @param sizeInMB - Size in MB
 * @returns Formatted size string (e.g., "45.6 MB")
 */
export function formatMBSize(sizeInMB: number | null | undefined): string {
  if (typeof sizeInMB !== 'number' || isNaN(sizeInMB)) return '';

  // If >= 1024 MB, show in GB
  if (sizeInMB >= 1024) {
    return `${(sizeInMB / 1024).toFixed(1)} GB`;
  }

  return `${sizeInMB.toFixed(1)} MB`;
}

/**
 * Opens the given URL in a new browser tab using a temporary anchor element.
 * @param url - The URL to open.
 */
export function openLinkInNewTab(url: string): void {
    if (!url) {
        return;
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.style.display = 'none';

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}

/**
 * Initialize expandable text functionality using EVENT DELEGATION pattern
 * Creates "see more/see less" buttons for text that exceeds container height
 * Uses a single delegated event listener to avoid stale references and duplicate listeners
 *
 * Based on reference implementation - uses setTimeout to ensure CSS is fully applied
 * before measuring overflow
 *
 * @param container - Parent container to search within and attach delegation listener
 * @param textSelector - CSS selector for elements to make expandable (e.g., '.video-title')
 */
export function initExpandableText(container: HTMLElement | null, textSelector: string = '.expandable-text'): void {
    if (!container) return;


    // ============================================================
    // STEP 1: Set up EVENT DELEGATION listener (once per container)
    // ============================================================
    if (container.dataset.expandableDelegated !== 'true') {
        container.addEventListener('click', (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            const button = target.closest('.see-more-btn') as HTMLElement;
            if (!button) return; // Not a "see more" button click


            // Find the associated text element (previous sibling)
            const textElement = button.previousElementSibling as HTMLElement;

            if (!textElement) {
                return;
            }

            // Toggle expanded state
            const isExpanded = textElement.classList.toggle('expanded');

            button.textContent = isExpanded ? 'see less' : 'see more';
            button.setAttribute('aria-expanded', isExpanded ? 'true' : 'false');

        });

        container.dataset.expandableDelegated = 'true';
    }

    // ============================================================
    // STEP 2: Create buttons for overflowing elements (with setTimeout)
    // setTimeout ensures CSS line-clamp is fully applied before measuring
    // ============================================================
    setTimeout(() => {
        const elements = container.querySelectorAll(textSelector);

        elements.forEach((element) => {
            const htmlElement = element as HTMLElement;

            // Remove existing button to avoid duplicates (idempotent approach)
            const existingButton = htmlElement.nextElementSibling;
            if (existingButton && existingButton.classList.contains('see-more-btn')) {
                existingButton.remove();
            }

            // Check if text is overflowing (clamped to 2 lines)
            const isOverflowing = (htmlElement.scrollHeight - htmlElement.clientHeight) > 10;

            if (!isOverflowing) {
                return;
            }


            // Create button (no direct event listener - handled by delegation)
            const button = document.createElement('span');
            button.className = 'see-more-btn';
            button.textContent = 'see more';
            button.setAttribute('role', 'button');
            button.setAttribute('tabindex', '0');
            button.setAttribute('aria-expanded', 'false');

            // Insert button after element
            htmlElement.parentNode?.insertBefore(button, htmlElement.nextSibling);

        });
    }, 100); // 100ms delay to ensure CSS rendering is complete
}

/**
 * Checks if the user is on a mobile or tablet device based on user agent.
 * @returns True if the device is identified as mobile or tablet.
 */
export function isMobileDevice(): boolean {
  return false;
  // Unreachable code below kept for reference
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(navigator.userAgent);
}

/**
 * Throttle function using requestAnimationFrame for optimal scroll performance.
 * Ensures callback runs at most once per animation frame (~16ms at 60fps).
 * Best practice for scroll/resize event handlers to reduce forced reflows.
 *
 * @param callback - Function to throttle
 * @returns Throttled function
 *
 * @example
 * const handleScroll = throttle(() => {
 *
 * });
 * window.addEventListener('scroll', handleScroll);
 */
export function throttle<T extends (...args: any[]) => void>(callback: T): (...args: Parameters<T>) => void {
  let requestId: number | null = null;
  let lastArgs: Parameters<T> | null = null;

  return function throttled(this: any, ...args: Parameters<T>): void {
    lastArgs = args;
    if (requestId === null) {
      requestId = requestAnimationFrame(() => {
        callback.apply(this, lastArgs!);
        requestId = null;
      });
    }
  };
}

/**
 * Detect if current device is iOS (iPhone, iPad, iPod)
 * Includes detection for iOS 13+ iPads which report as Mac
 * @returns True if iOS device
 */
export function isIOS(): boolean {
  if (typeof navigator === 'undefined' || !navigator.userAgent) {
    return false;
  }

  const ua = navigator.userAgent;

  // Check for iPhone, iPad, iPod
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;

  // iOS 13+ on iPad reports as Mac, but has touch support
  const isTouchDevice = navigator.maxTouchPoints && navigator.maxTouchPoints > 1;
  const isMacLike = /Macintosh/.test(ua);

  return isIOSDevice || (isMacLike && isTouchDevice);
}

/**
 * Detect if current platform is Windows
 * @returns True if Windows device
 */
export function isWindows(): boolean {
  if (typeof navigator === 'undefined') {
    return false;
  }

  // Check both platform and userAgent for comprehensive detection
  return /Win/i.test(navigator.platform) || /Windows/i.test(navigator.userAgent);
}

/**
 * Trigger browser download from Blob object
 * Creates temporary anchor, clicks it, and cleans up object URL
 * @param blob - Blob object to download
 * @param filename - Desired filename for download
 */
export function triggerBlobDownload(blob: Blob | null, filename?: string): void {
  if (!blob || !(blob instanceof Blob)) {
    return;
  }

  if (!filename) {
    filename = 'download';
  }

  // Create object URL from blob
  const url = URL.createObjectURL(blob);

  // Create temporary anchor element
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';

  // Trigger download
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  // ✅ Revoke URL immediately after click
  // Browser has already started download process, safe to revoke
  // This prevents blob URL from keeping blob in memory
  URL.revokeObjectURL(url);
}
