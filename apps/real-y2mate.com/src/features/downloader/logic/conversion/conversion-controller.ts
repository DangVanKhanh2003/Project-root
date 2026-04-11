/**
 * Conversion Controller
 * Wires ConversionModal events to business logic
 *
 * This is the ONLY file that needs customization when reusing ConversionModal
 * in different projects. The modal itself is fully reusable via events.
 */

import {
  cancelConversion,
  handleDownloadClick,
  clearSocialMediaCache,
  startConversion
} from './index';
import { getConversionTask, getState } from '../../state';
import { showExpireModal } from '@downloader/ui-components';

// Type definitions for custom events
interface ConversionCancelEventDetail {
  formatId: string;
}

interface ConversionDownloadEventDetail {
  formatId: string;
}

interface ConversionRetryEventDetail {
  formatId: string;
}

interface ConversionModalOpenedEventDetail {
  formatId: string;
  status: string;
  videoTitle: string;
}

interface ConversionModalClosedEventDetail {
  formatId: string;
}

declare global {
  interface WindowEventMap {
    'conversion:cancel': CustomEvent<ConversionCancelEventDetail>;
    'conversion:download': CustomEvent<ConversionDownloadEventDetail>;
    'conversion:retry': CustomEvent<ConversionRetryEventDetail>;
    'conversion:modal-opened': CustomEvent<ConversionModalOpenedEventDetail>;
    'conversion:modal-closed': CustomEvent<ConversionModalClosedEventDetail>;
  }
}

// Named event handlers to prevent duplicates
const handleCancelEvent = (event: CustomEvent<ConversionCancelEventDetail>) => {
  const { formatId } = event.detail;
  if (formatId) {
    cancelConversion(formatId);
  }
};

const handleDownloadEvent = (event: CustomEvent<ConversionDownloadEventDetail>) => {
  const { formatId } = event.detail;
  if (formatId) {
    const result = handleDownloadClick(formatId);

    // Handle expired case (YouTube links expire after ~6 hours)
    if (result === 'expired') {
      const state = getState();
      const videoTitle = state.videoDetail?.meta?.title || 'Video';

      showExpireModal({
        videoTitle,
        onTryAgain: () => {
          // Reload page to get fresh download link
          window.location.reload();
        }
      });
    }
  }
};

const handleRetryEvent = async (event: CustomEvent<ConversionRetryEventDetail>) => {
  const { formatId } = event.detail;
  if (formatId) {
    // Get task and re-trigger conversion
    const task = getConversionTask(formatId);
    if (task?.formatData) {
      const state = getState();
      const videoTitle = state.videoDetail?.meta?.title || 'Video';
      const videoUrl = state.videoDetail?.meta?.originalUrl || '';

      await startConversion({
        formatId,
        videoUrl,
        videoTitle,
        extractV2Options: task.formatData?.extractV2Options || {}
      });
    }
  }
};

const handleModalClosedEvent = (event: CustomEvent<ConversionModalClosedEventDetail>) => {
  const { formatId } = event.detail;
  if (formatId) {
    // Clear social media cache when modal closes
    clearSocialMediaCache(formatId);
  }
};

// Guard to prevent duplicate initialization
let isInitialized = false;

/**
 * Initialize conversion controller
 * Sets up event listeners to wire modal events → business logic
 */
export function initConversionController(): void {
  if (isInitialized) {
    return;
  }
  isInitialized = true;

  // Remove existing listeners first (defensive)
  window.removeEventListener('conversion:cancel', handleCancelEvent as EventListener);
  window.removeEventListener('conversion:download', handleDownloadEvent as EventListener);
  window.removeEventListener('conversion:retry', handleRetryEvent as EventListener);
  window.removeEventListener('conversion:modal-closed', handleModalClosedEvent as EventListener);

  // Add fresh listeners
  window.addEventListener('conversion:cancel', handleCancelEvent as EventListener);
  window.addEventListener('conversion:download', handleDownloadEvent as EventListener);
  window.addEventListener('conversion:retry', handleRetryEvent as EventListener);
  window.addEventListener('conversion:modal-closed', handleModalClosedEvent as EventListener);
}
