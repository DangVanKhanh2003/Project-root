/**
 * BaseStrategy - Simple abstract base class
 *
 * Gọi TRỰC TIẾP existing infrastructure:
 * - getConversionModal()
 * - updateConversionTask()
 * - api.xxx()
 */

import { IConversionStrategy, StrategyContext, StrategyResult } from './IConversionStrategy';
import { TaskState } from '../../types';

// Direct imports from existing infrastructure
import { getConversionModal } from '../../../../../../ui-components/modal/conversion-modal';
import { updateConversionTask } from '../../../../state/conversion-state';

/**
 * Base strategy - provides common helpers
 */
export abstract class BaseStrategy implements IConversionStrategy {
  protected readonly ctx: StrategyContext;
  protected isAborted: boolean = false;

  constructor(context: StrategyContext) {
    this.ctx = context;

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

  protected getModal() {
    return getConversionModal();
  }

  protected updateTask(update: Record<string, unknown>): void {
    updateConversionTask(this.ctx.formatId, update);
  }

  protected markSuccess(downloadUrl: string, extras?: Record<string, unknown>): void {
    this.updateTask({
      state: TaskState.SUCCESS,
      downloadUrl,
      completedAt: Date.now(),
      ...extras
    });
  }

  protected markFailed(error: string): void {
    this.updateTask({
      state: TaskState.FAILED,
      error,
      completedAt: Date.now()
    });
  }

  protected successResult(downloadUrl: string, extras?: Partial<StrategyResult>): StrategyResult {
    return { success: true, downloadUrl, ...extras };
  }

  protected failureResult(error: string): StrategyResult {
    return { success: false, error };
  }

  protected cancelledResult(): StrategyResult {
    return { success: false, error: 'Cancelled' };
  }
}
