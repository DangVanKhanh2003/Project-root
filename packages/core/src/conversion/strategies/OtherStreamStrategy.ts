/**
 * OtherStreamStrategy - Case 5: Other Platform Stream
 *
 * For platforms that support direct streaming (Android, Mac, Linux).
 * Extracted from apps/ytmp3-clone-3/src/features/downloader/logic/conversion/
 *
 * Key Changes:
 * - Receives IStateUpdater via constructor (DI pattern)
 * - Removed console.log statements (apps can add their own logging)
 */

import { BaseStrategy } from './BaseStrategy';
import type { IStateUpdater } from '../state-interface/IStateUpdater';
import type { StrategyContext, StrategyResult } from './IConversionStrategy';

export class OtherStreamStrategy extends BaseStrategy {
  constructor(context: StrategyContext, stateUpdater: IStateUpdater) {
    super(context, stateUpdater);
  }

  getName(): string {
    return 'OtherStreamStrategy';
  }

  async execute(): Promise<StrategyResult> {
    if (this.checkAborted()) {
      return this.cancelledResult();
    }

    const { url, filename } = this.ctx.extractResult;

    // Mark task as successful
    this.markSuccess(url, { filename });

    // Return success result
    return this.successResult(url, { filename: filename ?? undefined });
  }
}
