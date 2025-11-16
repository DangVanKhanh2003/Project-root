/**
 * Polling Progress Mapper
 * Maps polling progress phases to UI display
 */

export class PollingProgressMapper {
  private static lastProgressValue: number = 0;

  /**
   * Calculate progress percentage based on current phase
   * @param phase - Current phase (video/audio/merge)
   * @param videoProgress - Video download progress (0-100)
   * @param audioProgress - Audio download progress (0-100)
   * @returns Overall progress percentage
   */
  static calculateProgress(
    phase: string,
    videoProgress: number = 0,
    audioProgress: number = 0
  ): number {
    // Simple weighted calculation
    // Video: 0-50%, Audio: 50-75%, Merge: 75-100%
    switch (phase?.toLowerCase()) {
      case 'video':
      case 'downloading_video':
        return Math.min(50, videoProgress * 0.5);

      case 'audio':
      case 'downloading_audio':
        return 50 + Math.min(25, audioProgress * 0.25);

      case 'merge':
      case 'merging':
        return 75 + Math.min(25, (videoProgress + audioProgress) * 0.125);

      default:
        return Math.min(100, (videoProgress + audioProgress) / 2);
    }
  }

  /**
   * Map polling progress data to percentage
   * @param pollingData - Polling data from API
   * @returns Progress percentage
   */
  static mapProgress(pollingData: any): number {
    const { phase = '', video_progress = 0, audio_progress = 0 } = pollingData || {};
    const progress = this.calculateProgress(phase, video_progress, audio_progress);
    this.lastProgressValue = progress;
    return progress;
  }

  /**
   * Get last recorded progress value
   */
  static get lastProgress(): number {
    return this.lastProgressValue;
  }

  /**
   * Get display message for current phase
   * @param phase - Current phase
   * @returns Display message
   */
  static getPhaseMessage(phase: string): string {
    switch (phase?.toLowerCase()) {
      case 'video':
      case 'downloading_video':
        return 'Downloading video...';

      case 'audio':
      case 'downloading_audio':
        return 'Downloading audio...';

      case 'merge':
      case 'merging':
        return 'Merging files...';

      case 'processing':
        return 'Processing...';

      case 'converting':
        return 'Converting...';

      default:
        return 'Preparing...';
    }
  }

  /**
   * Get status text from polling data
   * @param pollingData - Polling data from API
   * @param progress - Optional progress override
   * @returns Status text
   */
  static getStatusText(pollingData: any, progress?: number): string {
    const { phase = '', status = '' } = pollingData || {};
    const progressText = progress !== undefined ? ` ${progress}%` : '';

    if (status) {
      return status + progressText;
    }

    return this.getPhaseMessage(phase) + progressText;
  }

  /**
   * Get size category from polling data
   * @param pollingData - Polling data from API
   * @returns Size category
   */
  static getSizeCategory(pollingData: any): string {
    const { size_category = 'small' } = pollingData || {};
    return size_category;
  }

  /**
   * Start merging phase
   * @returns Progress percentage at start of merge
   */
  static startMergingPhase(): number {
    this.lastProgressValue = 75;
    return 75;
  }
}
