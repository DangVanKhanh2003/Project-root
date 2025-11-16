/**
 * Polling Progress Mapper
 *
 * Handles format-specific progress allocation and mapping for polling downloads
 * Based on analysis that MP3 merging is extremely slow (100-200s) vs MP4 merging (5-15s)
 */

// Format-specific progress allocation
const PROGRESS_ALLOCATION = {
  mp4: {
    extract: { start: 0, end: 30 },      // 30% (fixed)
    processing: { start: 30, end: 90 },   // 60% (video compression dominates)
    merging: { start: 90, end: 100 }      // 10% (container muxing, very fast)
  },

  mp3: {
    extract: { start: 0, end: 30 },      // 30% (fixed)
    processing: { start: 30, end: 65 },   // 35% (audio conversion)
    merging: { start: 65, end: 100 }      // 35% (audio encoding, very slow!)
  },

  // Fallback for other formats
  default: {
    extract: { start: 0, end: 30 },
    processing: { start: 30, end: 80 },
    merging: { start: 80, end: 100 }
  }
};

// Format-specific merging time estimates (milliseconds)
// Time to reach 95% progress (leaving 5% for API confirmation)
// NOTE: Polling only triggers for files >150MB (iOS large streams, Windows MP4)
// NOTE: MP4 merging is instant (<500ms) - no fake progress needed
const MERGING_TIME_ESTIMATES = {
  mp3: {
    small: 60 * 1000,    // 150-250MB: 60s to reach 95%
    medium: 100 * 1000,  // 250-450MB: 100s to reach 95%
    large: 150 * 1000    // 450MB+: 150s to reach 95%
  },

  mp4: {
    instant: true  // MP4 container muxing <500ms - instant completion
  },

  default: {
    small: 60 * 1000,
    medium: 100 * 1000,
    large: 150 * 1000
  }
};

// 3-phase progress allocation for merge phase (65% → 95%)
// Phase 1 (65→75): Fast initial progress using 15% of time
// Phase 2 (75→85): Medium speed using 35% of time
// Phase 3 (85→95): Slow final stretch using 50% of time
const MERGE_PHASE_ALLOCATION = {
  phase1: { progressRange: [65, 75], timePercentage: 0.15 },  // 10% progress in 15% time
  phase2: { progressRange: [75, 85], timePercentage: 0.35 },  // 10% progress in 35% time
  phase3: { progressRange: [85, 95], timePercentage: 0.50 }   // 10% progress in 50% time
};

/**
 * WHY: Map polling API progress to display progress based on format-specific allocation
 * CONTRACT: (format:string, fileSizeMB:number) → PollingProgressMapper instance
 * PRE: Valid format (mp3/mp4), fileSizeMB >150 (polling only triggers for large files)
 * POST: Returns mapper instance with format-specific progress allocation and time estimates
 * EDGE: Unknown format → use default allocation; MP4 → instant merging
 * USAGE: const mapper = new PollingProgressMapper('mp3', 200);
 *        const progress = mapper.mapProgress('processing', { audioProgress: 45 });
 */
export class PollingProgressMapper {
  constructor(format, fileSizeMB = 200) {
    this.format = format.toLowerCase();
    this.fileSizeMB = fileSizeMB;
    this.allocation = PROGRESS_ALLOCATION[this.format] || PROGRESS_ALLOCATION.default;
    this.timeEstimates = MERGING_TIME_ESTIMATES[this.format] || MERGING_TIME_ESTIMATES.default;

    this.lastProgress = 30; // Start after extract phase
    this.mergingStartTime = null;
  }

  /**
   * Map API progress to display progress for current phase
   */
  mapProgress(phase, apiData) {
    let progress;

    if (phase === 'processing') {
      progress = this.mapProcessingProgress(apiData);
    } else if (phase === 'merging') {
      progress = this.mapMergingProgress();
    } else {
      return this.lastProgress;
    }

    // Ensure progress never goes backwards
    if (progress < this.lastProgress) {
      return this.lastProgress;
    }

    // Reasonable increment limits (max 5% jump per update)
    const maxJump = 5;
    if (progress - this.lastProgress > maxJump) {
      progress = this.lastProgress + maxJump;
    }

    this.lastProgress = progress;
    return progress;
  }

  /**
   * Map processing phase progress (real progress from API)
   */
  mapProcessingProgress(apiData) {
    const { videoProgress, audioProgress } = apiData;
    const realProgress = this.calculateOverallProgress(videoProgress, audioProgress);

    const phase = this.allocation.processing;
    const range = phase.end - phase.start;

    return phase.start + (realProgress * range / 100);
  }

  /**
   * Map merging phase progress (fake progress based on elapsed time)
   * MP4: Instant completion (<500ms) - API returns mergedUrl immediately, no fake progress needed
   * MP3: Uses 3-phase buffer allocation for smoother UX:
   * - Phase 1 (65→75): Fast initial progress (15% of time)
   * - Phase 2 (75→85): Medium speed (35% of time)
   * - Phase 3 (85→95): Slow final stretch (50% of time)
   */
  mapMergingProgress() {
    // MP4 merging is instant (<500ms) - API returns mergedUrl immediately
    // No fake progress needed, completePolling() will jump to 100%
    if (this.format === 'mp4') {
      return this.lastProgress; // Keep current progress, wait for API
    }

    // MP3: Time-based fake progress with 3-phase allocation
    if (!this.mergingStartTime) {
      this.mergingStartTime = Date.now();
    }
    const elapsed = Date.now() - this.mergingStartTime;
    const estimatedDuration = this.getEstimatedMergingTime();
    const timeProgress = elapsed / estimatedDuration; // 0.0 → 1.0


    // Determine which phase we're in and calculate progress
    let displayProgress;

    if (timeProgress <= 0.15) {
      // Phase 1: 0-15% of time → 65-75% progress
      const phaseProgress = timeProgress / 0.15; // 0.0 → 1.0 within this phase
      displayProgress = 65 + (phaseProgress * 10); // 65 → 75
    } else if (timeProgress <= 0.50) {
      // Phase 2: 15-50% of time → 75-85% progress
      const phaseProgress = (timeProgress - 0.15) / 0.35; // 0.0 → 1.0 within this phase
      displayProgress = 75 + (phaseProgress * 10); // 75 → 85
    } else {
      // Phase 3: 50-100% of time → 85-95% progress
      const phaseProgress = Math.min(1.0, (timeProgress - 0.50) / 0.50); // 0.0 → 1.0 within this phase
      displayProgress = 85 + (phaseProgress * 10); // 85 → 95
    }

    // Cap at 95% until API confirms completion
    displayProgress = Math.min(95, displayProgress);

    return displayProgress;
  }

  /**
   * Calculate overall progress from video and audio progress
   */
  calculateOverallProgress(videoProgress = 0, audioProgress = 0) {
    if (this.format === 'mp3') {
      return audioProgress; // Audio only
    }

    if (this.format === 'mp4') {
      return (videoProgress * 0.8) + (audioProgress * 0.2); // Video dominates
    }

    return Math.max(videoProgress, audioProgress); // Best effort for unknown formats
  }

  /**
   * Get estimated merging time based on file size and format
   * MP4: Not used (instant merge, API returns mergedUrl immediately)
   * MP3: Returns time estimate based on file size category
   */
  getEstimatedMergingTime() {
    // MP4 merging is instant - this method not used for MP4
    if (this.timeEstimates.instant) {
      return 0; // Instant, no wait time
    }

    const sizeCategory = this.getSizeCategory();
    const estimatedTime = this.timeEstimates[sizeCategory];
    return estimatedTime;
  }

  getSizeCategory() {
    if (this.format === 'mp3') {
      // NOTE: Polling only for files >150MB, so minimum is 150MB
      if (this.fileSizeMB < 250) return 'small';    // 150-250MB: 60s
      if (this.fileSizeMB < 450) return 'medium';   // 250-450MB: 100s
      return 'large';                               // 450MB+: 150s
    } else if (this.format === 'mp4') {
      // MP4 is instant, category doesn't matter
      return 'instant';
    } else {
      // Default fallback (shouldn't be used)
      if (this.fileSizeMB < 250) return 'small';
      if (this.fileSizeMB < 450) return 'medium';
      return 'large';
    }
  }

  /**
   * Start merging phase
   */
  startMergingPhase() {
    this.mergingStartTime = Date.now();
  }

  /**
   * Get format-specific status text
   */
  getStatusText(phase, progress) {
    const relativeProgress = Math.round(progress - this.allocation[phase].start);

    if (phase === 'processing') {
      return `Processing ${this.format}... `;
    } else if (phase === 'merging') {
      if (this.format === 'mp3') {
        if (relativeProgress < 25) return 'Encoding audio...';
        if (relativeProgress < 50) return 'Optimizing quality...';
        if (relativeProgress < 75) return 'Finalizing audio... (this may take a while)';
        return 'Almost ready...';
      } else {
        return 'Finalizing video...';
      }
    }

    return 'Processing...';
  }
}