/**
 * Polling Progress Mapper - Phase 3 Architecture
 *
 * Maps polling API data to UI progress with 2-phase architecture:
 * - Processing: 0% → 100% based on real API progress
 * - Merging: 100% constant (UI shows spinner instead of progress bar)
 * - Success: mergedUrl received → show checkmark
 */

export class PollingProgressMapper {
  // Phase 3: Processing reaches 100%, then merging spinner
  private static readonly VIDEO_WEIGHT = 0.8;       // 80% weight for video in processing
  private static readonly AUDIO_WEIGHT = 0.2;       // 20% weight for audio in processing

  private static currentPhase: 'processing' | 'merging' = 'processing';
  private static mergingStartTime: number = 0;
  private static lastProgressValue: number = 0;
  private static currentFormat: string = 'mp4'; // Track current format

  /**
   * Map API polling data to UI progress (0-100%)
   *
   * Phase 3 Architecture:
   * - Processing: 0% → 100% based on real API progress
   * - Merging: Return 100% constant (UI shows spinner)
   * - mergedUrl received: Return 100% (ready for success)
   *
   * CONTRACT: (apiData:object) → number - returns display progress 0-100
   * PRE: Valid apiData with videoProgress/audioProgress (nullable)
   * POST: Returns progress in range [0, 100]
   * EDGE: Null progress values → treat as 0; mergedUrl → instant 100%
   * USAGE: const displayProg = PollingProgressMapper.mapProgress(apiData);
   */
  static mapProgress(apiData: {
    videoProgress: number | null;
    audioProgress: number | null;
    status: string;
    mergedUrl?: string | null;
  }): number {
    const { videoProgress, audioProgress, mergedUrl } = apiData;

    console.log('[PollingProgressMapper] 📊 mapProgress INPUT:', {
      videoProgress,
      audioProgress,
      status: apiData.status,
      mergedUrl: mergedUrl ? 'EXISTS' : 'null',
      currentPhase: this.currentPhase,
      format: this.currentFormat
    });

    // If mergedUrl exists → conversion completed (100%)
    if (mergedUrl) {
      this.lastProgressValue = 100;
      console.log('[PollingProgressMapper] ✅ OUTPUT: 100% (mergedUrl exists)');
      return 100;
    }

    // Default to 0 for null progress values
    const videoProg = videoProgress ?? 0;
    const audioProg = audioProgress ?? 0;

    // Check if should transition to merging phase
    // Condition: Audio-only needs only audioProgress; Video needs both
    const isProcessingComplete = this.isAudioFormat(this.currentFormat)
      ? audioProg >= 100
      : videoProg >= 100 && audioProg >= 100;

    console.log('[PollingProgressMapper] Checking phase transition:', {
      videoProg,
      audioProg,
      isProcessingComplete,
      currentPhase: this.currentPhase
    });

    if (isProcessingComplete && this.currentPhase === 'processing') {
      // Phase 3: Transition: Processing (100%) → Merging (100% + spinner)
      this.currentPhase = 'merging';
      this.mergingStartTime = Date.now();
      this.lastProgressValue = 100;
      console.log('[PollingProgressMapper] 🔄 PHASE TRANSITION: processing → merging');
      console.log('[PollingProgressMapper] ✅ OUTPUT: 100% (transitioning to merging)');
      return 100;
    }

    if (this.currentPhase === 'merging') {
      // Phase 3: Merging phase - stay at 100% (UI will show spinner)
      this.lastProgressValue = 100;
      console.log('[PollingProgressMapper] ✅ OUTPUT: 100% (in merging phase)');
      return 100;
    }

    // Processing phase - real API progress mapped to 0-100%
    // Phase 3: Full range 0-100% for processing
    let displayProgress: number;

    if (this.isAudioFormat(this.currentFormat)) {
      // Audio-only: Map audioProgress 0-100 → display 0-100
      displayProgress = audioProg;
    } else {
      // Video: Weighted average of audio (40%) and video (60%)
      displayProgress = (audioProg * 0.4) + (videoProg * 0.6);
    }

    this.lastProgressValue = displayProgress;
    console.log('[PollingProgressMapper] ✅ OUTPUT:', Math.round(displayProgress) + '% (processing phase)');
    return displayProgress;
  }

  /**
   * Get status text for current phase
   *
   * Phase 3: Simple status for processing, merging handled by spinner UI
   * CONTRACT: (apiData:object) → string - returns status text
   * PRE: Valid apiData with progress values and status
   * POST: Returns appropriate status message for current phase
   * EDGE: mergedUrl present → 'Ready'; merging phase → 'Merging...'
   * USAGE: const status = PollingProgressMapper.getStatusText(apiData);
   */
  static getStatusText(apiData: {
    videoProgress: number | null;
    audioProgress: number | null;
    status: string;
    mergedUrl?: string | null;
  }): string {
    const { mergedUrl } = apiData;

    let statusText: string;

    // Completed
    if (mergedUrl) {
      statusText = 'Ready';
    } else if (this.currentPhase === 'merging') {
      // Phase 3: Merging phase - text will be shown with spinner
      statusText = 'Merging...';
    } else {
      // Processing phase - simple status without detailed progress
      statusText = 'Processing...';
    }

    console.log('[PollingProgressMapper] 📝 getStatusText OUTPUT:', {
      statusText,
      currentPhase: this.currentPhase,
      mergedUrl: mergedUrl ? 'EXISTS' : 'null'
    });

    return statusText;
  }


  /**
   * Reset phase state (call when starting new conversion)
   *
   * Phase 3: Simple reset for processing → merging flow
   * CONTRACT: (format?:string, fileSizeMB?:number) → void - resets state
   * PRE: None (format optional, use default if not provided)
   * POST: Phase reset to 'processing', timers cleared, progress reset to 0
   * EDGE: Can be called multiple times safely; no format → default MP4
   * USAGE: PollingProgressMapper.reset('mp3'); // Before starting new polling
   */
  static reset(format: string = 'mp4', fileSizeMB: number = 200): void {
    this.currentPhase = 'processing';
    this.mergingStartTime = 0;
    this.lastProgressValue = 0;
    this.currentFormat = format;
    console.log('[PollingProgressMapper] Phase 3: Reset for format:', format);
  }

  /**
   * Helper method to determine if format is audio
   */
  private static isAudioFormat(format: string): boolean {
    const audioFormats = ['mp3', 'wav', 'opus', 'ogg', 'm4a', 'audio'];
    return audioFormats.includes(format.toLowerCase());
  }

  /**
   * Get current phase
   *
   * WHY: Allow external code to check current polling phase
   * CONTRACT: () → 'processing' | 'merging'
   * PRE: None
   * POST: Returns current phase
   * EDGE: Always returns valid phase (never undefined)
   * USAGE: const phase = PollingProgressMapper.getCurrentPhase();
   */
  static getCurrentPhase(): 'processing' | 'merging' {
    return this.currentPhase;
  }

  /**
   * Get last recorded progress value
   *
   * WHY: Access cached progress without recalculating
   * CONTRACT: () → number - returns last progress value
   * PRE: None
   * POST: Returns number in range [0, 100]
   * EDGE: Returns 0 if never calculated before
   * USAGE: const lastProg = PollingProgressMapper.lastProgress;
   */
  static get lastProgress(): number {
    return this.lastProgressValue;
  }

  /**
   * Manually start merging phase (for testing or manual control)
   *
   * Phase 3: Transition to merging at 100%
   * CONTRACT: () → number - returns starting progress of merge phase (100)
   * PRE: None
   * POST: Phase set to 'merging', timer started, returns 100
   * EDGE: Can override current phase state
   * USAGE: const startProgress = PollingProgressMapper.startMergingPhase();
   */
  static startMergingPhase(): number {
    this.currentPhase = 'merging';
    this.mergingStartTime = Date.now();
    this.lastProgressValue = 100;
    console.log('[PollingProgressMapper] Phase 3: Manually started merging at 100%');
    return 100;
  }
}