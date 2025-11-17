/**
 * Conversion Modal - TypeScript
 * Modal for displaying conversion progress and status
 */

interface ProgressBarManager {
  updateProgress(videoProgress: number, audioProgress: number, message?: string): void;
  setText(message: string): void;
  setIndeterminate(indeterminate: boolean): void;
  reset(): void;
  // Extended methods for advanced workflows
  startExtractPhase(target: number): void;
  completeExtractToFull(callback: () => void): void;
  resumeToDownloadPhase(type: string, options: any): void;
  setPollingProgress(progress: number, statusText: string): void;
  updatePollingProgress(apiData: any, phase: string): void;
  completePollingProgress(): void;
  stop(): void;
}

export class ConversionModal {
  private isOpenFlag: boolean = false;
  private abortController: AbortController | null = null;
  private progressBarManager: ProgressBarManager;

  constructor(wrapperSelector: string) {

    // Create progress bar manager stub
    this.progressBarManager = {
      updateProgress: (videoProgress: number, audioProgress: number, message?: string) => {
      },
      setText: (message: string) => {
      },
      setIndeterminate: (indeterminate: boolean) => {
      },
      reset: () => {
      },
      // Extended methods stubs
      startExtractPhase: (target: number) => {
      },
      completeExtractToFull: (callback: () => void) => {
        callback?.();
      },
      resumeToDownloadPhase: (type: string, options: any) => {
      },
      setPollingProgress: (progress: number, statusText: string) => {
      },
      updatePollingProgress: (apiData: any, phase: string) => {
      },
      completePollingProgress: () => {
      },
      stop: () => {
      }
    };
  }

  get isOpen(): boolean {
    return this.isOpenFlag;
  }

  async open(options: any = {}): Promise<void> {
    this.isOpenFlag = true;
    this.abortController = new AbortController();
  }

  async close(): Promise<void> {
    this.isOpenFlag = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  transitionToSuccess(downloadUrl?: string): void {
  }

  transitionToError(errorMessage: string): void {
  }

  transitionToExpired(videoTitle?: string): void {
  }

  getAbortSignal(): AbortSignal | null {
    return this.abortController?.signal || null;
  }

  getProgressBarManager(): ProgressBarManager {
    return this.progressBarManager;
  }

  showDownloadButton(url: string, options: any = {}): void {
  }
}

let modalInstance: ConversionModal | null = null;

export function getConversionModal(): ConversionModal {
  if (!modalInstance) {
    modalInstance = new ConversionModal('#progressBarWrapper');
  }
  return modalInstance;
}
