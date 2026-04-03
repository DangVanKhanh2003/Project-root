import { getState } from '../state';
import { getRouteFromUrl, replaceUrl } from './url-manager';

/**
 * Setup listeners to update URL when UI changes
 * Keeps the URL in sync with the current format/quality/audio track selections
 */
export function setupUrlSync(): void {
    const updateUrlParams = () => {
        const state = getState();
        const route = getRouteFromUrl();
        
        // Only update if we are on a video page
        if (route.type !== 'video' || !route.videoId) return;

        const newRoute: any = {
            type: 'video',
            videoId: route.videoId,
            format: state.selectedFormat,
            // Quality logic:
            // Video: '720p', '1080p', 'webm', 'mkv'
            // Audio: 'mp3', 'm4a', 'opus' etc.
            // We want to map state back to URL params reasonably.
        };

        if (state.selectedFormat === 'mp4') {
             // For video, we use 'quality' param to store resolution or format override
             newRoute.quality = state.videoQuality; 
        } else {
             // For audio
             // Format is crucial (mp3/m4a/wav)
             newRoute.format = state.audioFormat;
             
             // Quality (bitrate) only for MP3
             newRoute.quality = state.audioFormat === 'mp3'
                ? (state.audioBitrate || '128')
                : '128';
        }

        // Audio Track
        const audioTrackInput = document.getElementById('audio-track-value') as HTMLInputElement | null;
        if (audioTrackInput && audioTrackInput.value && audioTrackInput.value !== 'original') {
            newRoute.audioTrack = audioTrackInput.value;
        }

        replaceUrl(newRoute);
    };

    // Listen to changes in the format selector container (delegated)
    const formatContainer = document.querySelector('#format-selector-container');
    if (formatContainer) {
        // Change event covers <select> changes
        formatContainer.addEventListener('change', () => {
             // Defer slightly to allow state to update
             setTimeout(updateUrlParams, 0);
        });
        
        // Click event covers format buttons (MP3/MP4 toggle)
        // Note: Format toggle also triggers state update
        formatContainer.addEventListener('click', (e) => {
            if ((e.target as HTMLElement).closest('.format-btn')) {
                 setTimeout(updateUrlParams, 0);
            }
        });
    }

    // Listen to audio track changes
    // The custom dropdown might dispatch specific events or we listen to hidden input?
    const audioTrackInput = document.getElementById('audio-track-value');
    if (audioTrackInput) {
        // We modified dropdown-logic to dispatch 'change' on the hidden input!
        audioTrackInput.addEventListener('change', updateUrlParams);
    }
}
