/**
 * Polling Progress Mapper - New Architecture
 *
 * Maps polling API data to UI progress with 2-phase architecture:
 * Format-specific allocation:
 * - MP4: Processing 90% + Merging 10% (fast merge <500ms)
 * - MP3: Processing 60% + Merging 40% (slow merge 60-150s)
 * Max progress without mergedUrl: 98%
 */

export class PollingProgressMapper {
  // Constants for video/audio weight in processing phase
  private static readonly VIDEO_WEIGHT = 0.8;       // 80% weight for video in processing
  private static readonly AUDIO_WEIGHT = 0.2;       // 20% weight for audio in processing
  private static readonly MAX_PROGRESS_WITHOUT_URL = 98; // Cap at 98% until mergedUrl received

  private static currentPhase: 'processing' | 'merging' = 'processing';
  private static mergingStartTime: number = 0;
  private static mergingDuration: number = 3000; // Default 3 seconds, calculated dynamically
  private static lastProgressValue: number = 0;
  private static currentFormat: string = 'mp4'; // Track current format for merge estimation
  private static currentFileSizeMB: number = 200; // Track file size for merge estimation

  // Format-specific weights (set during reset)
  private static processingWeight: number = 0.9;  // MP4: 90%, MP3: 60%
  private static mergingWeight: number = 0.1;     // MP4: 10%, MP3: 40%

  /**
   * Map API polling data to UI progress (0-100%)
   *
   * WHY: Unified progress mapping for 2-phase polling architecture
   * CONTRACT: (apiData:object) → number - returns display progress 0-100
   * PRE: Valid apiData with videoProgress/audioProgress (nullable)
   * POST: Returns progress in range [0, 98] or 100 if mergedUrl exists
   * EDGE: Null progress values → treat as 0; mergedUrl → instant 100%; max 98% without URL
   * USAGE: const displayProg = PollingProgressMapper.mapProgress(apiData);
   */
  static mapProgress(apiData: {
    videoProgress: number | null;
    audioProgress: number | null;
    status: string;
    mergedUrl?: string | null;
  }): number {
    const { videoProgress, audioProgress, status, mergedUrl } = apiData;

    // If mergedUrl exists → conversion completed (100%)
    if (mergedUrl) {
      this.lastProgressValue = 100;
      return 100;
    }

    // Default to 0 for null progress values
    const videoProg = videoProgress ?? 0;
    const audioProg = audioProgress ?? 0;

    // Check if should transition to merging phase
    // Condition: Both video and audio reach 100%
    const isProcessingComplete = videoProg >= 100 && audioProg >= 100;

    if (isProcessingComplete && this.currentPhase === 'processing') {
      // Transition: Processing → Merging
      this.currentPhase = 'merging';
      this.mergingStartTime = Date.now();
      const processingEnd = this.processingWeight * 100;
      this.lastProgressValue = processingEnd;
      return processingEnd;
    }

    if (this.currentPhase === 'merging') {
      // Merging phase - estimated progress
      const processingEnd = this.processingWeight * 100;
      const mergingRange = this.mergingWeight * 100;

      const elapsed = Date.now() - this.mergingStartTime;
      const progress = Math.min(elapsed / this.mergingDuration, 1);

      // Ease out cubic for smooth animation: f(t) = 1 - (1-t)³
      const easedProgress = 1 - Math.pow(1 - progress, 3);

      const displayProgress = processingEnd + (easedProgress * mergingRange);

      // Cap at 98% until mergedUrl received
      const cappedProgress = Math.min(displayProgress, this.MAX_PROGRESS_WITHOUT_URL);
      this.lastProgressValue = cappedProgress;
      return cappedProgress;
    }

    // Processing phase - real API progress
    // Weighted average: 80% video + 20% audio
    const weightedProgress = (videoProg * this.VIDEO_WEIGHT) + (audioProg * this.AUDIO_WEIGHT);

    // Map 0-100% API progress → 0-processingWeight% UI progress
    const displayProgress = (weightedProgress / 100) * (this.processingWeight * 100);
    this.lastProgressValue = displayProgress;
    return displayProgress;
  }

  /**
   * Get status text for current phase
   *
   * WHY: Provide simple status text matching current polling phase
   * CONTRACT: (apiData:object) → string - returns status text
   * PRE: Valid apiData with progress values and status
   * POST: Returns appropriate status message for current phase
   * EDGE: mergedUrl present → 'Ready'; merging phase → 'Merging files...'
   * USAGE: const status = PollingProgressMapper.getStatusText(apiData);
   */
  static getStatusText(apiData: {
    videoProgress: number | null;
    audioProgress: number | null;
    status: string;
    mergedUrl?: string | null;
  }): string {
    const { mergedUrl } = apiData;

    // Completed
    if (mergedUrl) {
      return 'Ready';
    }

    // Merging phase
    if (this.currentPhase === 'merging') {
      return 'Merging...';
    }

    // Processing phase - simple status without detailed progress
    return 'Processing...';
  }

  /**
   * Calculate merge duration based on file size and format
   *
   * WHY: MP3 merging is slow (60-150s), MP4 is instant (<500ms)
   * CONTRACT: (format:string, fileSizeMB:number) → number - returns duration in milliseconds
   * PRE: Valid format (mp3/mp4), fileSizeMB > 0
   * POST: Returns estimated merge duration in milliseconds
   * EDGE: MP4 → instant (500ms); unknown format → use MP3 estimates
   * USAGE: const duration = PollingProgressMapper.calculateMergeDuration('mp3', 300);
   */
  private static calculateMergeDuration(format: string, fileSizeMB: number): number {
    const formatLower = format.toLowerCase();

    // MP4: Instant container muxing (<500ms)
    if (formatLower === 'mp4') {
      return 500;
    }

    // MP3: Slow audio encoding (60-150s based on file size)
    // NOTE: Polling only triggers for files >150MB
    if (formatLower === 'mp3' || formatLower === 'audio') {
      if (fileSizeMB < 250) return 60 * 1000;    // 150-250MB: 60s
      if (fileSizeMB < 450) return 100 * 1000;   // 250-450MB: 100s
      return 150 * 1000;                         // 450MB+: 150s
    }

    // Default fallback (treat as MP3)
    if (fileSizeMB < 250) return 60 * 1000;
    if (fileSizeMB < 450) return 100 * 1000;
    return 150 * 1000;
  }

  /**
   * Reset phase state (call when starting new conversion)
   *
   * WHY: Ensure clean state for each new conversion task
   * CONTRACT: (format?:string, fileSizeMB?:number) → void - resets state and calculates merge duration
   * PRE: None (format and size optional, use defaults if not provided)
   * POST: Phase reset to 'processing', timers cleared, progress reset to 0, merge duration calculated, weights set
   * EDGE: Can be called multiple times safely; no format → default MP4
   * USAGE: PollingProgressMapper.reset('mp3', 300); // Before starting new polling
   */
  static reset(format: string = 'mp4', fileSizeMB: number = 200): void {
    this.currentPhase = 'processing';
    this.mergingStartTime = 0;
    this.lastProgressValue = 0;
    this.currentFormat = format;
    this.currentFileSizeMB = fileSizeMB;

    // Set format-specific weights
    const formatLower = format.toLowerCase();
    if (formatLower === 'mp3' || formatLower === 'audio') {
      // MP3: Processing 60% + Merging 40% (slow merge 60-150s)
      this.processingWeight = 0.6;
      this.mergingWeight = 0.4;
    } else {
      // MP4: Processing 90% + Merging 10% (fast merge <500ms)
      this.processingWeight = 0.9;
      this.mergingWeight = 0.1;
    }

    // Calculate merge duration based on format and file size
    this.mergingDuration = this.calculateMergeDuration(format, fileSizeMB);
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
   * WHY: Allow manual phase transition without waiting for API progress
   * CONTRACT: () → number - returns starting progress of merge phase (60)
   * PRE: None
   * POST: Phase set to 'merging', timer started, returns 60
   * EDGE: Can override current phase state
   * USAGE: const startProgress = PollingProgressMapper.startMergingPhase();
   */
  static startMergingPhase(): number {
    this.currentPhase = 'merging';
    this.mergingStartTime = Date.now();
    this.lastProgressValue = 60;
    return 60;
  }
}
