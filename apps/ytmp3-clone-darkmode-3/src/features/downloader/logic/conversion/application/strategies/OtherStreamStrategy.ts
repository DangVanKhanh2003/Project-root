/**
 * OtherStreamStrategy - Case 5: Other Platform Stream
 *
 * Platforms hỗ trợ stream trực tiếp (Android, Mac, Linux).
 */

import { BaseStrategy } from './BaseStrategy';
import type { StrategyContext, StrategyResult } from './IConversionStrategy';
import { getSizeMB } from '../../types';

// Debug logger
const LOG_PREFIX = '[OtherStreamStrategy]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

export class OtherStreamStrategy extends BaseStrategy {
  constructor(context: StrategyContext) {
    super(context);
  }

  getName(): string {
    return 'OtherStreamStrategy';
  }

  async execute(): Promise<StrategyResult> {
    log('=== EXECUTE START ===');
    log('extractResult:', JSON.stringify(this.ctx.extractResult, null, 2));

    if (this.checkAborted()) {
      log('Already aborted');
      return this.cancelledResult();
    }

    const { url, filename } = this.ctx.extractResult;
    const sizeMB = getSizeMB(this.ctx.extractResult);
    log('url:', url);
    log('filename:', filename);
    log('sizeMB:', sizeMB);

    // Update state
    log('Marking success in state');
    this.markSuccess(url, { filename });

    // Show download button with size info
    const buttonText = sizeMB > 0 ? `Download Stream (${sizeMB}MB)` : 'Download Stream';
    log('Showing download button with text:', buttonText);

    log('=== EXECUTE COMPLETE ===');
    return this.successResult(url, { filename: filename ?? undefined });
  }
}
