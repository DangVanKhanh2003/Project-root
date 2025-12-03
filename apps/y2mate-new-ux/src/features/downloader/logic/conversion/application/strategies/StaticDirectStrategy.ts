/**
 * StaticDirectStrategy - Case 1: Static Direct Download
 *
 * File sẵn có (status='static'), không cần progress.
 */

import { BaseStrategy } from './BaseStrategy';
import type { StrategyContext, StrategyResult } from './IConversionStrategy';

// Debug logger
const LOG_PREFIX = '[StaticDirectStrategy]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

export class StaticDirectStrategy extends BaseStrategy {
  constructor(context: StrategyContext) {
    super(context);
  }

  getName(): string {
    return 'StaticDirectStrategy';
  }

  async execute(): Promise<StrategyResult> {
    log('=== EXECUTE START ===');
    log('extractResult:', JSON.stringify(this.ctx.extractResult, null, 2));

    if (this.checkAborted()) {
      log('Already aborted');
      return this.cancelledResult();
    }

    const { url, filename } = this.ctx.extractResult;
    log('url:', url);
    log('filename:', filename);

    // Update state
    log('Marking success in state');
    this.markSuccess(url, { filename });

    // Show download button
    log('Showing download button');
    this.getModal().showDownloadButton(url);

    log('=== EXECUTE COMPLETE ===');
    return this.successResult(url, { filename: filename ?? undefined });
  }
}
