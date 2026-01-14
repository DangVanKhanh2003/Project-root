/**
 * IConversionStrategy - Strategy interface for conversion operations
 *
 * Core package version with state updates via DI.
 * Extracted from apps/ytmp3-clone-3/src/features/downloader/logic/conversion/
 */

import type { ExtractResult, FormatData, RoutingDecision } from '../types';

/**
 * Context passed to strategy
 */
export interface StrategyContext {
  readonly formatId: string;
  readonly formatData: FormatData;
  readonly extractResult: ExtractResult;
  readonly routing: RoutingDecision;
  readonly abortSignal: AbortSignal;
  readonly videoTitle: string;
  readonly videoUrl: string;
}

/**
 * Strategy result
 */
export interface StrategyResult {
  readonly success: boolean;
  readonly downloadUrl?: string;
  readonly error?: string;
  readonly blob?: Blob;
  readonly filename?: string;
}

/**
 * Conversion strategy interface
 */
export interface IConversionStrategy {
  execute(): Promise<StrategyResult>;
  cancel(): void;
  getName(): string;
}
