/**
 * IOSRamStrategy - Case 2: iOS RAM Download
 *
 * iOS audio ≤150MB: Download to RAM (blob) first.
 * Implements "Double EXTRACTING" trick for smooth UX.
 * Extracted from apps/ytmp3-clone-3/src/features/downloader/logic/conversion/
 *
 * Key Changes:
 * - Receives IStateUpdater via constructor (DI pattern)
 * - Removed console.log statements (apps can add their own logging)
 */

import { BaseStrategy } from './BaseStrategy';
import type { IStateUpdater } from '../state-interface/IStateUpdater';
import type { StrategyContext, StrategyResult } from './IConversionStrategy';
import { TaskState } from '../types';
import { downloadStreamToRAM } from '../../utils/download-stream';

export class IOSRamStrategy extends BaseStrategy {
  private hasStartedDownload: boolean = false;

  constructor(context: StrategyContext, stateUpdater: IStateUpdater) {
    super(context, stateUpdater);
  }

  getName(): string {
    return 'IOSRamStrategy';
  }

  async execute(): Promise<StrategyResult> {
    if (this.checkAborted()) {
      return this.cancelledResult();
    }

    const { url, filename, size } = this.ctx.extractResult;
    const totalBytes = size ?? 0;

    // Delay 1s while keeping EXTRACTING state (smooth UX transition)
    // Delay can be interrupted by abort signal for responsive cancellation
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
      return this.cancelledResult();
    }

    // Build initial status text with size info
    const totalMB = totalBytes > 0 ? Math.ceil(totalBytes / (1024 * 1024)) : 0;
    const initialStatusText = totalMB > 0
      ? `Converting... 0 MB / ${totalMB} MB`
      : 'Converting...';

    // Update state to DOWNLOADING after delay
    this.updateTask({
      state: TaskState.DOWNLOADING,
      statusText: initialStatusText
    });

    try {
      const blob = await downloadStreamToRAM(url, {
        onProgress: (progress) => this.handleProgress(progress.loaded, progress.total || totalBytes),
        signal: this.ctx.abortSignal
      });

      if (this.checkAborted()) {
        return this.cancelledResult();
      }

      // CRITICAL FIX: Force progress to 100% before showing success
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

      // Wait for 100% to paint (double RAF + 150ms delay for CSS transition)
      // CSS transition for final 100% is 50ms (0.05s with .completing-final class)
      await new Promise<void>(resolve => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Add 150ms delay to ensure CSS transition completes (50ms transition + safety buffer)
            setTimeout(() => {
              resolve();
            }, 150);
          });
        });
      });

      if (this.checkAborted()) {
        return this.cancelledResult();
      }

      // Save blob to state
      this.markSuccess(url, { ramBlob: blob, filename });

      return this.successResult(url, { blob, filename: filename ?? undefined });

    } catch (error) {
      if (this.checkAborted() || (error as Error).name === 'AbortError') {
        return this.cancelledResult();
      }

      const errorMessage = (error as Error).message || 'Download failed';
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
      ? `Converting... ${loadedMB} MB / ${totalMB} MB`
      : `Converting... ${loadedMB} MB`;

    const percent = total > 0 ? Math.round((loaded / total) * 100) : 0;

    // Double EXTRACTING trick: only transition when data arrives
    if (!this.hasStartedDownload && loaded > 0) {
      this.hasStartedDownload = true;
    }

    // Update task with progress info
    this.updateTask({
      statusText: statusText,
      progress: percent
    });
  }
}
