/**
 * BaseStrategy - Abstract base class with DI
 *
 * Core package version using Dependency Injection for state management.
 * Extracted from apps/ytmp3-clone-3/src/features/downloader/logic/conversion/
 *
 * Key Changes:
 * - Receives IStateUpdater via constructor (DI pattern)
 * - No direct imports of app-specific state management
 * - updateTask() delegates to stateUpdater.updateTask()
 */

import type { IStateUpdater } from '../state-interface/IStateUpdater';
import type { IConversionStrategy, StrategyContext, StrategyResult } from './IConversionStrategy';
import { TaskState } from '../types';

/**
 * Base strategy - provides common helpers
 */
export abstract class BaseStrategy implements IConversionStrategy {
  protected readonly ctx: StrategyContext;
  protected readonly stateUpdater: IStateUpdater;
  protected isAborted: boolean = false;

  constructor(context: StrategyContext, stateUpdater: IStateUpdater) {
    this.ctx = context;
    this.stateUpdater = stateUpdater;

    // Listen for abort
    context.abortSignal?.addEventListener('abort', () => {
      this.isAborted = true;
    });
  }

  abstract execute(): Promise<StrategyResult>;
  abstract getName(): string;

  cancel(): void {
    this.isAborted = true;
  }

  // ========== Helpers ==========

  protected checkAborted(): boolean {
    return this.isAborted || this.ctx.abortSignal?.aborted === true;
  }

  /**
   * Update task state via DI
   */
  protected updateTask(update: Record<string, unknown>): void {
    this.stateUpdater.updateTask(this.ctx.formatId, update);
  }

  /**
   * Mark task as successful
   */
  protected markSuccess(downloadUrl: string, extras?: Record<string, unknown>): void {
    this.updateTask({
      state: TaskState.SUCCESS,
      statusText: 'Conversion successful!',
      downloadUrl,
      completedAt: Date.now(),
      showProgressBar: false,
      ...extras
    });
  }

  /**
   * Mark task as failed
   */
  protected markFailed(error: string): void {
    this.updateTask({
      state: TaskState.FAILED,
      statusText: `Error: ${error}`,
      error,
      completedAt: Date.now(),
      showProgressBar: false
    });
  }

  /**
   * Create success result
   */
  protected successResult(downloadUrl: string, extras?: Partial<StrategyResult>): StrategyResult {
    return { success: true, downloadUrl, ...extras };
  }

  /**
   * Create failure result
   */
  protected failureResult(error: string): StrategyResult {
    return { success: false, error };
  }

  /**
   * Create cancelled result
   */
  protected cancelledResult(): StrategyResult {
    return { success: false, error: 'Cancelled' };
  }
}
