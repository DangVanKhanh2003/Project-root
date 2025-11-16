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
    console.log('ConversionModal created:', wrapperSelector);

    // Create progress bar manager stub
    this.progressBarManager = {
      updateProgress: (videoProgress: number, audioProgress: number, message?: string) => {
        console.log('Progress:', videoProgress, audioProgress, message);
      },
      setText: (message: string) => {
        console.log('Progress text:', message);
      },
      setIndeterminate: (indeterminate: boolean) => {
        console.log('Indeterminate:', indeterminate);
      },
      reset: () => {
        console.log('Progress reset');
      },
      // Extended methods stubs
      startExtractPhase: (target: number) => {
        console.log('startExtractPhase:', target);
      },
      completeExtractToFull: (callback: () => void) => {
        console.log('completeExtractToFull');
        callback?.();
      },
      resumeToDownloadPhase: (type: string, options: any) => {
        console.log('resumeToDownloadPhase:', type, options);
      },
      setPollingProgress: (progress: number, statusText: string) => {
        console.log('setPollingProgress:', progress, statusText);
      },
      updatePollingProgress: (apiData: any, phase: string) => {
        console.log('updatePollingProgress:', apiData, phase);
      },
      completePollingProgress: () => {
        console.log('completePollingProgress');
      },
      stop: () => {
        console.log('Progress stop');
      }
    };
  }

  get isOpen(): boolean {
    return this.isOpenFlag;
  }

  async open(options: any = {}): Promise<void> {
    console.log('ConversionModal.open() called', options);
    this.isOpenFlag = true;
    this.abortController = new AbortController();
  }

  async close(): Promise<void> {
    console.log('ConversionModal.close() called');
    this.isOpenFlag = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  transitionToSuccess(downloadUrl?: string): void {
    console.log('ConversionModal.transitionToSuccess()', downloadUrl);
  }

  transitionToError(errorMessage: string): void {
    console.log('ConversionModal.transitionToError()', errorMessage);
  }

  transitionToExpired(videoTitle?: string): void {
    console.log('ConversionModal.transitionToExpired()', videoTitle);
  }

  getAbortSignal(): AbortSignal | null {
    return this.abortController?.signal || null;
  }

  getProgressBarManager(): ProgressBarManager {
    return this.progressBarManager;
  }

  showDownloadButton(url: string, options: any = {}): void {
    console.log('ConversionModal.showDownloadButton()', url, options);
  }
}

let modalInstance: ConversionModal | null = null;

export function getConversionModal(): ConversionModal {
  if (!modalInstance) {
    modalInstance = new ConversionModal('#progressBarWrapper');
  }
  return modalInstance;
}
