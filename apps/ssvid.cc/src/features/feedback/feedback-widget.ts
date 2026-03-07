import { initFeedbackWidget as initSharedFeedbackWidget } from '@downloader/ui-shared';
import { api, sendFeedbackWidget } from '../../api';
import { getState as getDownloaderState } from '../downloader/state/state-manager';

let initialized = false;

export function initFeedbackWidget(): void {
  if (initialized) return;
  void api.core;
  initSharedFeedbackWidget({
    sendFeedbackWidget,
    getDownloaderState,
  });
  initialized = true;
}
