/**
 * Multifile Download Orchestration
 *
 * @module orchestration/multifile
 */

export { createMultifileOrchestrator } from './orchestrator';
export type {
  SessionData,
  StateChangeData,
  ProgressUpdateData,
  CompleteData,
  OrchestratorCallbacks,
  MultifileService,
  OrchestratorConfig,
  MultifileOrchestrator,
} from './orchestrator';

export { createSSEManager, createDefaultCallbacks } from './sse-manager';
export type { SSEProgressData, SSECompleteData, SSEErrorData, SSECallbacks, SSEManager } from './sse-manager';

export {
  MULTIFILE_STATES,
  MULTIFILE_TIMEOUTS,
  MULTIFILE_LIMITS,
  MULTIFILE_ENDPOINTS,
  SSE_EVENTS,
  PROGRESS_WEIGHTS,
  UI_MESSAGES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  calculateOverallProgress,
  formatMessage,
  validateUrlCount,
  getRemainingTime,
  isExpired,
  formatRemainingTime,
} from './constants';

export type { MultifileState, SSEEvent, ValidationResult } from './constants';
