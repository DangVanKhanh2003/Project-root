/**
 * YouTube Fake Data Generator
 * Generates fake YouTube data for instant UI rendering before API call completes
 */

/**
 * Generate fake YouTube data for instant UI
 * Returns pre-defined quality options before API call completes
 *
 * @param videoId - YouTube video ID (11 characters)
 * @param url - Full YouTube URL
 * @returns Fake data structure with meta and formats
 */
export function generateFakeYouTubeData(videoId: string, url: string): any {
  return {
    meta: {
      vid: videoId,
      title: `Loading video information...`,
      author: 'Please wait...',
      thumbnail: `https://i.ytimg.com/vi/${videoId}/0.jpg`,
      duration: '--:--',
      source: 'YouTube',
      originalUrl: url,
      isFakeData: true
    },
    formats: {
      video: [
        {
          quality: '1080p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '1080',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '720p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '720',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '480p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '480',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '360p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '360',
            youtubeVideoContainer: 'mp4'
          }
        },
        {
          quality: '144p',
          format: 'mp4',
          vid: videoId,
          type: 'VIDEO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'video',
            videoQuality: '144',
            youtubeVideoContainer: 'mp4'
          }
        },
      ],
      audio: [
        {
          quality: '256kbps',
          format: 'mp3',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioBitrate: '256',
            audioFormat: 'mp3'
          }
        },
        {
          quality: '128kbps',
          format: 'mp3',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioBitrate: '128',
            audioFormat: 'mp3'
          }
        },
        {
          quality: 'OGG',
          format: 'ogg',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'ogg'
          }
        },
        {
          quality: 'WAV',
          format: 'wav',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'wav'
          }
        },
        {
          quality: 'Opus',
          format: 'opus',
          vid: videoId,
          type: 'AUDIO',
          size: 'Processing...',
          isFakeData: true,
          extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'opus'
          }
        },
      ]
    }
  };
}
