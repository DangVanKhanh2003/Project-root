import { MaterialPopup } from '../../../ui-components/material-popup/material-popup';
import { extractVideoId, extractPlaylistId, isYouTubeUrl } from '@downloader/core';

/**
 * Check if the given URL is a playlist URL without a video ID
 */
export function shouldPromptPlaylistRedirect(url: string): boolean {
  const videoId = extractVideoId(url);
  const playlistId = extractPlaylistId(url);
  return !videoId && !!playlistId;
}

/**
 * Check if a batch of raw text contains at least one playlist-only URL
 * and NO video URLs at all, to prompt redirect for multi-downloader.
 */
export function shouldPromptPlaylistRedirectForMulti(rawText: string): boolean {
    const tokens = rawText
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .replace(/\t/g, ' ')
        .trim()
        .split(/[\n\s,]+/)
        .filter(Boolean)
        .filter(token => isYouTubeUrl(token));

    if (tokens.length === 0) return false;

    const hasVideoUrl = tokens.some(token => !!extractVideoId(token));
    const hasPlaylistOnlyUrl = tokens.some(token => !extractVideoId(token) && !!extractPlaylistId(token));

    return hasPlaylistOnlyUrl && !hasVideoUrl;
}

/**
 * Show confirmation popup for redirecting to the playlist downloader page
 * @returns Promise resolving to true if user confirms redirect, false otherwise
 */
export async function confirmPlaylistRedirect(): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const settle = (goToPlaylistPage: boolean) => {
      if (settled) return;
      settled = true;
      resolve(goToPlaylistPage);
    };

    MaterialPopup.show({
      title: 'Go to playlist page',
      message: 'Would you like to download a playlist instead? Go to the playlist downloader page.',
      type: 'info',
      confirmText: 'Playlist page',
      cancelText: 'Continue',
      buttonLayout: 'row',
      onConfirm: () => settle(true),
      onCancel: () => settle(false)
    });
  });
}
