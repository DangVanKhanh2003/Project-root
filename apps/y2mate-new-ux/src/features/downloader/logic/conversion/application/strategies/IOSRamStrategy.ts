/**
 * IOSRamStrategy - Case 2: iOS RAM Download
 *
 * iOS audio ≤150MB: Download vào RAM (blob) trước.
 * Implements "Double EXTRACTING" trick.
 */

import { BaseStrategy } from './BaseStrategy';
import type { StrategyContext, StrategyResult } from './IConversionStrategy';
import { TaskState } from '../../types';

// Direct import
import { downloadStreamToRAM } from '../../../../../../utils/download-stream';

// Debug logger
const LOG_PREFIX = '[IOSRamStrategy]';
const log = (...args: unknown[]) => console.log(LOG_PREFIX, ...args);

export class IOSRamStrategy extends BaseStrategy {
  private hasStartedDownload: boolean = false;

  constructor(context: StrategyContext) {
    super(context);
  }

  getName(): string {
    return 'IOSRamStrategy';
  }

  async execute(): Promise<StrategyResult> {
    log('=== EXECUTE START ===');
    log('extractResult:', JSON.stringify(this.ctx.extractResult, null, 2));

    if (this.checkAborted()) {
      log('Already aborted');
      return this.cancelledResult();
    }

    const { url, filename, size } = this.ctx.extractResult;
    const totalBytes = size ?? 0;
    log('url:', url);
    log('filename:', filename);
    log('totalBytes:', totalBytes);

    // Delay 1s while keeping EXTRACTING state (smooth UX transition)
    // Delay can be interrupted by abort signal for responsive cancellation
    log('Waiting 1s before starting download (keeping EXTRACTING state)...');
    try {
      await new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(resolve, 1000);

        // Listen for abort to break delay immediately
        this.ctx.abortSignal?.addEventListener('abort', () => {
          clearTimeout(timeoutId);
          reject(new Error('Aborted'));
        }, { once: true });
      });
    } catch {
      // Aborted during delay - return immediately without waiting
      log('Aborted during 1s delay');
      return this.cancelledResult();
    }

    // Build initial status text with size info
    const totalMB = totalBytes > 0 ? Math.ceil(totalBytes / (1024 * 1024)) : 0;
    const initialStatusText = totalMB > 0
      ? `Downloading... 0 MB / ${totalMB} MB`
      : 'Downloading...';

    // Update state to DOWNLOADING after delay
    log('Updating task state to DOWNLOADING with initial status:', initialStatusText);
    this.updateTask({
      state: TaskState.DOWNLOADING,
      statusText: initialStatusText
    });

    try {
      log('Starting downloadStreamToRAM...');
      const blob = await downloadStreamToRAM(url, {
        onProgress: (progress) => this.handleProgress(progress.loaded, progress.total || totalBytes),
        signal: this.ctx.abortSignal
      });

      if (this.checkAborted()) {
        log('Aborted after download');
        return this.cancelledResult();
      }

      log('Download complete, blob size:', blob.size);

      // CRITICAL FIX: Force progress to 100% before showing success
      log('⚠️ FORCE: Updating progress to 100% at timestamp:', performance.now().toFixed(2) + 'ms');

      // Calculate final status text with size info
      const finalMB = Math.ceil(blob.size / (1024 * 1024));
      const finalStatusText = finalMB > 0
        ? `Downloaded ${finalMB} MB / ${finalMB} MB`
        : 'Download complete';
      // Force update progress to 100% BEFORE delay
      this.updateTask({
        progress: 100,
        statusText: finalStatusText
      });
      // Wait for 100% to paint (double RAF + 300ms delay for CSS transition)
      // CSS transition for final 100% is 50ms (0.05s with .completing-final class)
      log('⚠️ WAIT: Starting double RAF + 300ms delay to ensure CSS transition completes');
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          log('⚠️ RAF #1 callback at timestamp:', performance.now().toFixed(2) + 'ms');
          requestAnimationFrame(() => {
            log('⚠️ RAF #2 callback at timestamp:', performance.now().toFixed(2) + 'ms');
            // Add 300ms delay to ensure CSS transition completes (50ms transition + safety buffer)
            setTimeout(() => {
              log('⚠️ Delay 300ms complete at timestamp:', performance.now().toFixed(2) + 'ms');
              log('✅ 100% ANIMATION COMPLETE - safe to show success now');
              resolve();
            }, 150);
          });
        });
      });

      if (this.checkAborted()) {
        log('Aborted during RAF wait');
        return this.cancelledResult();
      }

      // Save blob to state
      log('Marking success with ramBlob');
      this.markSuccess(url, { ramBlob: blob, filename });

      // Show download button
      log('Showing download button');

      log('=== EXECUTE COMPLETE ===');
      return this.successResult(url, { blob, filename: filename ?? undefined });

    } catch (error) {
      if (this.checkAborted() || (error as Error).name === 'AbortError') {
        log('Caught abort error');
        return this.cancelledResult();
      }

      const errorMessage = (error as Error).message || 'Download failed';
      log('ERROR:', errorMessage);
      log('Full error:', error);
      this.markFailed(errorMessage);

      return this.failureResult(errorMessage);
    }
  }

  private async handleProgress(loaded: number, total: number): Promise<void> {
    if (this.checkAborted()) return;

    // Calculate MB values
    const loadedMB = Math.ceil(loaded / (1024 * 1024));
    const totalMB = total > 0 ? Math.ceil(total / (1024 * 1024)) : 0;

    // Build status text
    const statusText = totalMB > 0
      ? `Downloading... ${loadedMB} MB / ${totalMB} MB`
      : `Downloading... ${loadedMB} MB`;

    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;

    // Double EXTRACTING trick: chỉ transition khi có data
    if (!this.hasStartedDownload && loaded > 0) {
      log('First chunk received, transitioning to CONVERTING with spiral-in (Double EXTRACTING trick)');
      this.hasStartedDownload = true;
    }

    // Update task with progress info
    this.updateTask({
      statusText: statusText,
      progress: percent
    });
  }
}
