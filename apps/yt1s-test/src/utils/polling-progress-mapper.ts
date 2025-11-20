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
        const result1 = Math.min(50, videoProgress * 0.5);
        return result1;

      case 'audio':
      case 'downloading_audio':
        const result2 = 50 + Math.min(25, audioProgress * 0.25);
        return result2;

      case 'merge':
      case 'merging':
        const avgProgress = (videoProgress + audioProgress) / 2;
        const result3 = 75 + Math.min(25, avgProgress * 0.125);
        return result3;

      default:
        const avg = (videoProgress + audioProgress) / 2;
        const result4 = Math.min(100, avg);
        return result4;
    }
  }

  /**
   * Map polling progress data to percentage
   * @param pollingData - Polling data from API
   * @returns Progress percentage
   */
  static mapProgress(pollingData: any): number {
    const {
      phase = '',
      video_progress = 0,   // từ API cũ
      audio_progress = 0,
      videoProgress = 0,    // từ API mới
      audioProgress = 0,
      video_progress_percent = 0,  // thêm các trường có thể tồn tại
      audio_progress_percent = 0
    } = pollingData || {};

    // Ưu tiên các trường mới nếu có, nếu không thì dùng các trường cũ
    const videoProg = videoProgress !== undefined ? videoProgress :
                     video_progress !== undefined ? video_progress :
                     video_progress_percent;
    const audioProg = audioProgress !== undefined ? audioProgress :
                     audio_progress !== undefined ? audio_progress :
                     audio_progress_percent;


    const progress = this.calculateProgress(phase, videoProg, audioProg);
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

    const { phase = '', status = '', videoProgress, audioProgress, mergedUrl } = pollingData || {};


    // Nếu có mergedUrl, có nghĩa là hoàn tất chuyển đổi
    if (mergedUrl) {
      return 'Ready'; // Không thêm phần trăm ở đây vì UI sẽ thêm
    }

    // Nếu có status cụ thể từ API và không có video/audio progress, sử dụng status
    if (status && status !== 'downloading' && status !== 'processing') {
      return status; // Không thêm phần trăm ở đây vì UI sẽ thêm
    }

    // Nếu có progress thực tế (video/audio), ưu tiên hiển thị trạng thái dựa trên tiến độ
    if ((videoProgress !== undefined && videoProgress < 100) ||
        (audioProgress !== undefined && audioProgress < 100)) {
      const isAudioOnly = videoProgress === 0; // Nếu không có video progress
      if (isAudioOnly) {
        if (audioProgress >= 100) {
          return 'Audio download complete';
        } else {
          return 'Downloading audio...';
        }
      } else {
        if (videoProgress >= 100 && audioProgress < 100) {
          return 'Processing audio...';
        } else if (videoProgress < 100 && audioProgress < 100) {
          return 'Downloading video...';
        } else {
          return 'Processing...';
        }
      }
    }

    // Nếu không có tiến độ cụ thể, sử dụng phase message
    const phaseMessage = this.getPhaseMessage(phase);

    // Không thêm phần trăm ở đây vì UI sẽ thêm
    const result = phaseMessage;

    return result;
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
