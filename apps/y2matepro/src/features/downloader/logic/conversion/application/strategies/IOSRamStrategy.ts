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

    // Update state
    log('Updating task state to DOWNLOADING');
    this.updateTask({ state: TaskState.DOWNLOADING });

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

      // Save blob to state
      log('Marking success with ramBlob');
      this.markSuccess(url, { ramBlob: blob, filename });

      // Show download button
      log('Showing download button');
      this.getModal().showDownloadButton(url, { buttonText: 'Download' });

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
      this.getModal().transitionToError(errorMessage);

      return this.failureResult(errorMessage);
    }
  }

  private handleProgress(loaded: number, total: number): void {
    if (this.checkAborted()) return;

    const modal = this.getModal();
    const progressBar = modal.getProgressBarManager();

    // Double EXTRACTING trick: chỉ transition khi có data
    if (!this.hasStartedDownload && loaded > 0) {
      log('First chunk received, transitioning to CONVERTING (Double EXTRACTING trick)');
      this.hasStartedDownload = true;
      modal.transitionToConverting();
    }

    // Update progress (using updateDownloadProgress - no % appended)
    if (progressBar && this.hasStartedDownload) {
      const loadedMB = Math.ceil(loaded / (1024 * 1024));
      const totalMB = Math.ceil(total / (1024 * 1024));
      const statusText = total > 0
        ? `Downloading... ${loadedMB} MB / ${totalMB} MB`
        : `Downloading... ${loadedMB} MB`;

      const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;
      progressBar.updateDownloadProgress(percent, statusText);
    }
  }
}
