/**
 * YouTube Fake Data Constants
 * Pre-defined format lists with extractV2 options included
 */

/**
 * Standard video formats with extractV2 options
 */
export const YOUTUBE_VIDEO_FORMATS = [
    {
        id: 'video|mp4|1080p',
        category: 'video',
        type: 'mp4',
        quality: '1080p',
        size: 'Processing...',
        isFakeData: true,
        // extractV2 options pre-configured
        extractV2Options: {
            downloadMode: 'video',
            videoQuality: '1080',
            youtubeVideoContainer: 'mp4'
        }
    },
    {
        id: 'video|mp4|720p',
        category: 'video',
        type: 'mp4',
        quality: '720p',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'video',
            videoQuality: '720',
            youtubeVideoContainer: 'mp4'
        }
    },
    {
        id: 'video|mp4|480p',
        category: 'video',
        type: 'mp4',
        quality: '480p',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'video',
            videoQuality: '480',
            youtubeVideoContainer: 'mp4'
        }
    },
    {
        id: 'video|mp4|360p',
        category: 'video',
        type: 'mp4',
        quality: '360p',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'video',
            videoQuality: '360',
            youtubeVideoContainer: 'mp4'
        }
    },
    {
        id: 'video|mp4|240p',
        category: 'video',
        type: 'mp4',
        quality: '240p',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'video',
            videoQuality: '240',
            youtubeVideoContainer: 'mp4'
        }
    },
    {
        id: 'video|mp4|144p',
        category: 'video',
        type: 'mp4',
        quality: '144p',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'video',
            videoQuality: '144',
            youtubeVideoContainer: 'mp4'
        }
    }
];

/**
 * Standard audio formats with extractV2 options
 */
export const YOUTUBE_AUDIO_FORMATS = [
    {
        id: 'audio|mp3|256kbs',
        category: 'audio',
        type: 'mp3',
        quality: '256kbs',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'mp3',
            audioBitrate: '256'
        }
    },
    {
        id: 'audio|mp3|128kbs',
        category: 'audio',
        type: 'mp3',
        quality: '128kbs',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'mp3',
            audioBitrate: '128'
        }
    },
    {
        id: 'audio|ogg|auto',
        category: 'audio',
        type: 'ogg',
        quality: 'auto',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'ogg'
            // No audioBitrate for ogg - uses default 128kbps
        }
    },
    {
        id: 'audio|wav|auto',
        category: 'audio',
        type: 'wav',
        quality: 'auto',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'wav'
            // No audioBitrate for wav - uses default 128kbps
        }
    },
    {
        id: 'audio|opus|auto',
        category: 'audio',
        type: 'opus',
        quality: 'auto',
        size: 'Processing...',
        isFakeData: true,
        extractV2Options: {
            downloadMode: 'audio',
            audioFormat: 'opus'
            // No audioBitrate for opus - uses default 128kbps
        }
    }
];

/**
 * Get video formats with video ID attached
 * @param {string} videoId - YouTube video ID
 * @returns {Array} Video formats with vid field
 */
export function getVideoFormats(videoId) {
    return YOUTUBE_VIDEO_FORMATS.map(format => ({
        ...format,
        vid: videoId
    }));
}

/**
 * Get audio formats with video ID attached
 * @param {string} videoId - YouTube video ID
 * @returns {Array} Audio formats with vid field
 */
export function getAudioFormats(videoId) {
    return YOUTUBE_AUDIO_FORMATS.map(format => ({
        ...format,
        vid: videoId
    }));
}

/**
 * Get all formats (video + audio) with video ID attached
 * @param {string} videoId - YouTube video ID
 * @returns {Object} {videoFormats: Array, audioFormats: Array}
 */
export function getAllFormats(videoId) {
    return {
        videoFormats: getVideoFormats(videoId),
        audioFormats: getAudioFormats(videoId)
    };
}

/**
 * Find format by ID and attach video ID
 * @param {string} formatId - Format ID to find
 * @param {string} videoId - YouTube video ID
 * @returns {Object|null} Found format or null
 */
export function findFormatById(formatId, videoId) {
    const allFormats = [...YOUTUBE_VIDEO_FORMATS, ...YOUTUBE_AUDIO_FORMATS];
    const format = allFormats.find(f => f.id === formatId);

    if (format) {
        return {
            ...format,
            vid: videoId
        };
    }

    return null;
}