/**
 * @downloader/history
 * Shared history feature for download converter apps
 */

// Types
export type {
  HistoryItem,
  HistoryData,
  HistoryDisplayConfig,
  OnHistoryItemClick,
  OnHistoryUpdate
} from './types';

export { DEFAULT_HISTORY_CONFIG } from './types';

// Storage
export {
  configureStorage,
  getStorageConfig,
  getAllHistory,
  getHistory,
  getHistoryCount,
  hasMoreItems,
  addToHistory,
  removeFromHistory,
  clearHistory,
  getHistoryItem
} from './history-storage';

// Service
export type { SaveToHistoryParams, ApplyHistoryHandlers } from './history-service';

export {
  detectPlatform,
  formatQualityDisplay,
  saveConversionToHistory,
  onHistoryUpdate,
  registerApplyHandlers,
  applyHistoryItem,
  getRelativeTime
} from './history-service';

// UI
export {
  initHistoryUI,
  refreshHistoryCard,
  destroyHistoryUI
} from './history-ui';
