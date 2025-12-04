/**
 * Download Rendering Utilities
 *
 * Minimal utilities for old flow compatibility
 * TODO: This file can be deleted after fully migrating to new flow
 */

import { initExpandableText } from '../../../utils';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

interface VideoMeta {
    title?: string;
    originalUrl?: string;
}

// ============================================================
// LEGACY FUNCTIONS - Keep for backward compatibility
// ============================================================

/**
 * Update video title dynamically without full re-render
 * Used in input-form.ts for fake data → real data transition
 * @param meta - Video metadata
 */
export function updateVideoTitle(meta: VideoMeta): void {
    const titleElement = document.getElementById('videoTitle');
    if (!meta || !titleElement) return;

    const displayTitle = meta.title || meta.originalUrl || 'Video không có tiêu đề';
    const escapedTitle = escapeHtml(displayTitle);

    titleElement.textContent = escapedTitle;
    titleElement.setAttribute('title', escapedTitle);

    // Re-activate expandable text logic (see more/collapse)
    const container = titleElement.closest('#previewCard, #downloadOptionsContainer');
    if (container) {
        initExpandableText(container as HTMLElement, '.video-title');
    }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
    if (typeof text !== 'string') return '';

    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
