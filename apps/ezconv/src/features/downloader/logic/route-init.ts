import { Route } from '../routing/url-manager';
import { setVideoPageSEO } from '../routing/seo-manager';
import { setAudioTrack } from '../ui-render/dropdown-logic';

/**
 * Handle initialization when landing on a video route (deep link)
 * Applies URL parameters (format, quality, audioTrack) to the UI
 * and triggers auto-submission.
 */
export function handleVideoRoute(route: Route): void {
    if (route.type !== 'video' || !route.videoId) return;

    // Deep link or page refresh with video URL
    // Update SEO meta tags for video page
    setVideoPageSEO();

    // Auto-submit form to load video
    const youtubeUrl = `https://www.youtube.com/watch?v=${route.videoId}`;

    // Get form element
    const form = document.getElementById('downloadForm') as HTMLFormElement;
    const input = document.getElementById('videoUrl') as HTMLInputElement;

    // Apply URL parameters if present
    if (route.format || route.quality) {
        // Determine whether to switch to MP3 or MP4 tab
        const isAudio = route.format === 'mp3' || route.format === 'm4a' || route.format === 'wav' || route.format === 'ogg' || route.format === 'opus' || route.format === 'flac';
        const type = isAudio ? 'mp3' : 'mp4';

        // Find format tab buttons
        const mp4Btn = document.querySelector(`.format-btn[data-format="mp4"]`) as HTMLElement;
        const mp3Btn = document.querySelector(`.format-btn[data-format="mp3"]`) as HTMLElement;

        if (isAudio && mp3Btn) {
            mp3Btn.click();
        } else if (!isAudio && mp4Btn) {
            mp4Btn.click();
        }

        // Handle quality selection
        let targetValue = '';

        if (isAudio) {
            // Audio Logic
            const q = route.quality ? route.quality.toLowerCase() : '';
            const f = route.format ? route.format.toLowerCase() : '';

            if (q) {
                // Case 1: quality param is actually a format name (e.g. quality=opus)
                if (['opus', 'ogg', 'wav', 'flac', 'm4a'].includes(q)) {
                    targetValue = q;
                } else {
                    // Case 2: quality is a bitrate (e.g. 128)
                    const prefix = (['mp3', 'm4a', 'opus', 'ogg', 'flac', 'wav'].includes(f)) ? f : 'mp3';
                    targetValue = prefix === 'mp3' ? `${prefix}-${q}` : prefix;
                }
            } else if (f) {
                // Case 3: Only format provided (e.g. format=wav)
                targetValue = f;
            }
        } else {
            // Video Logic
            const q = route.quality ? route.quality.toLowerCase() : '';
            if (q) {
                if (['webm', 'mkv'].includes(q)) {
                    targetValue = q;
                } else {
                    const res = q.replace('p', '');
                    targetValue = `mp4-${res}`;
                }
            } else {
                targetValue = 'mp4-720';
            }
        }

        // Apply to dropdown
        const selectId = isAudio ? 'quality-select-mp3' : 'quality-select-mp4';
        const select = document.getElementById(selectId) as HTMLSelectElement;

        if (select) {
            // Robust matching logic
            let bestMatch = '';
            const options = Array.from(select.options);

            // 1. Exact match
            const exact = options.find(o => o.value === targetValue);
            if (exact) {
                bestMatch = exact.value;
            } else {
                // 2. Prefix match
                const prefixMatch = options.find(o => o.value.startsWith(targetValue + '-'));
                if (prefixMatch) {
                    bestMatch = prefixMatch.value;
                }
            }

            if (bestMatch) {
                select.value = bestMatch;
                select.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
    }

    if (route.audioTrack) {
        // Apply audio track selection
        setAudioTrack(route.audioTrack);
    }

    if (form && input) {
        // Set input value
        input.value = youtubeUrl;

        // Trigger input event
        input.dispatchEvent(new Event('input', { bubbles: true }));

        // Small delay to let UI settle before submitting
        setTimeout(() => {
            form.requestSubmit();
        }, 100);
    }
}
