/**
 * Expire Modal - TypeScript
 * Modal for showing expired download links
 */

interface ExpireModalOptions {
  videoTitle?: string;
  onTryAgain?: () => void | Promise<void>;
}

export function showExpireModal(options: ExpireModalOptions | string): void {
  // Support both old string signature and new object signature
  if (typeof options === 'string') {
    console.log('showExpireModal() called:', options);
    alert(`Download link expired for: ${options}`);
  } else {
    console.log('showExpireModal() called:', options);
    const message = options.videoTitle
      ? `Download link expired for: ${options.videoTitle}`
      : 'Download link has expired';

    if (confirm(`${message}\n\nWould you like to try again?`)) {
      if (options.onTryAgain) {
        const result = options.onTryAgain();
        if (result instanceof Promise) {
          result.catch(err => console.error('Retry failed:', err));
        }
      }
    }
  }
}
