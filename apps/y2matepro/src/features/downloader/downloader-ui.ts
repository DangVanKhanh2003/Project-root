/**
 * Downloader UI Orchestrator - TypeScript
 * Wires together Model-View-Controller components
 */

import { setRenderCallback, getState } from './state';
import { initRenderer, render } from './ui-render/ui-renderer';
import { initInputForm } from './logic/input-form';
import { initContentRenderer } from './ui-render/content-renderer';
import { initSuggestionRenderer, render as renderSuggestions } from '../../ui-components/suggestion-dropdown/suggestion-renderer';
import { initConversionController } from './logic/conversion/conversion-controller';
import { scrollManager } from '@downloader/ui-shared';
import type { AppState } from './state';
import { getRouteFromUrl, initRouting, cleanUrl, type Route } from './routing/url-manager';
import { setVideoPageSEO } from './routing/seo-manager';

// Store auto-download params from URL
let pendingAutoDownload: { format: string; quality: string } | null = null;

/**
 * Initialize downloader UI
 */
export async function init(): Promise<void> {
  // Step 0: Initialize shared services
  // Configure scroll manager for y2matepro (header is not fixed)
  scrollManager.setHeaderConfig({ isFixed: false, height: 0 });
  scrollManager.init();

  // Step 1: Initialize renderers (views)
  const rendererInitialized = initRenderer();
  const contentRendererInitialized = initContentRenderer();
  const suggestionRendererInitialized = initSuggestionRenderer();

  if (!rendererInitialized || !contentRendererInitialized) {
    return;
  }

  if (!suggestionRendererInitialized) {
    // Don't return - continue without suggestions
  }

  // Step 2: Register render callback (state changes trigger view updates)
  setRenderCallback((state: AppState, prevState: AppState) => {

    // Render main UI
    render(state, prevState);

    // Render suggestions if initialized
    if (suggestionRendererInitialized) {
      renderSuggestions(state, prevState);
    }

    // Check for pending auto-download after video loads
    if (pendingAutoDownload && state.videoDetail && !prevState.videoDetail) {
      // Video just loaded, trigger auto-download
      const { format, quality } = pendingAutoDownload;
      pendingAutoDownload = null; // Clear to prevent re-trigger

      // Wait for DOM to update with format buttons
      setTimeout(() => {
        triggerAutoDownload(format, quality);
      }, 300);
    }
  });

  // Step 3: Initialize input form controller
  const formInitialized = initInputForm();

  if (!formInitialized) {
    return;
  }

  // Step 4: Initialize conversion controller (handles modal events)
  initConversionController();

  // Step 5: Initial render
  const initialState = getState();
  render(initialState);
  if (suggestionRendererInitialized) {
    renderSuggestions(initialState);
  }

  // Step 6: Setup routing (check URL on page load)
  // IMPORTANT: Get route BEFORE cleanUrl() to preserve f and q params
  const route = getRouteFromUrl();

  if (route.type === 'video' && route.videoId) {
    // Deep link or page refresh with video URL
    // Update SEO meta tags for video page
    setVideoPageSEO();

    // Store auto-download params if present (f=format, q=quality)
    // Must be done BEFORE cleanUrl() which removes extra params
    // At least one of format or quality must be present
    if (route.format || route.quality) {
      pendingAutoDownload = {
        format: (route.format || '').toLowerCase(),
        quality: route.quality || ''
      };
      console.log('[Auto-download] Stored params:', pendingAutoDownload);
    }

    // Clean URL after storing params (remove f and q from URL)
    cleanUrl();

    // Auto-submit form to load video
    const youtubeUrl = `https://www.youtube.com/watch?v=${route.videoId}`;

    // Get form element
    const form = document.getElementById('downloadForm') as HTMLFormElement;
    const input = document.getElementById('videoUrl') as HTMLInputElement;

    if (form && input) {
      // Set input value
      input.value = youtubeUrl;

      // Trigger input event to update state
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Small delay to let UI settle before submitting
      setTimeout(() => {
        form.requestSubmit();
      }, 100);
    }
  }

  // Setup popstate listener (back/forward button handling)
  initRouting();

}

/**
 * Trigger auto-download for specified format and quality
 * Called when URL has f=format&q=quality params
 *
 * @param format - Format type (mp3, mp4, webm, etc.)
 * @param quality - Quality value (320, 1080, 720, etc.)
 */
function triggerAutoDownload(format: string, quality: string): void {
  console.log('[Auto-download] Triggering for format:', format, 'quality:', quality);

  // Determine category based on format
  const audioFormats = ['mp3', 'aac', 'ogg', 'wav', 'opus', 'm4a'];
  const category = format ? (audioFormats.includes(format) ? 'audio' : 'video') : 'video';

  // Switch to correct tab first
  const tabButton = document.querySelector(`.format-tab[data-tab="${category}"]`) as HTMLButtonElement;
  if (tabButton && !tabButton.classList.contains('active')) {
    tabButton.click();
    // Wait for tab switch to complete
    setTimeout(() => {
      findAndClickFormatButton(format, quality);
    }, 100);
  } else {
    findAndClickFormatButton(format, quality);
  }
}

/**
 * Find and click the format button matching format and quality
 *
 * @param format - Format type (mp3, mp4, etc.)
 * @param quality - Quality value (320, 1080, etc.)
 */
function findAndClickFormatButton(format: string, quality: string): void {
  console.log('[Auto-download] Finding button for format:', format, 'quality:', quality);

  // Find all quality items
  const qualityItems = document.querySelectorAll('.quality-item');
  console.log('[Auto-download] Found quality items:', qualityItems.length);

  for (const item of qualityItems) {
    const formatId = item.getAttribute('data-format-id');
    if (!formatId) continue;

    // formatId format: "video|mp4|1080p" or "audio|mp3|320kbps"
    const formatIdLower = formatId.toLowerCase();

    // Check if format matches (e.g., "mp4" in "video|mp4|1080p")
    const formatMatch = !format || formatIdLower.includes(`|${format}|`) || formatIdLower.includes(`|${format}-`);

    // Check if quality matches (e.g., "1080" in "1080p" or "320" in "320kbps")
    const qualityMatch = !quality || formatIdLower.includes(quality);

    // Both must match (if provided)
    if (formatMatch && qualityMatch && (format || quality)) {
      console.log('[Auto-download] Matched formatId:', formatId);
      // Found matching format, click the button
      const button = item.querySelector('.btn-convert') as HTMLButtonElement;
      if (button && !button.disabled) {
        button.click();
        console.log('[Auto-download] Clicked button!');
        return;
      }
    }
  }

  console.log('[Auto-download] No exact match found, trying fallback...');

  // Fallback: try to find by quality only if format didn't match exactly
  if (quality) {
    for (const item of qualityItems) {
      const formatId = item.getAttribute('data-format-id');
      if (!formatId) continue;

      const formatIdLower = formatId.toLowerCase();
      if (formatIdLower.includes(quality)) {
        const button = item.querySelector('.btn-convert') as HTMLButtonElement;
        if (button && !button.disabled) {
          console.log('[Auto-download] Fallback matched formatId:', formatId);
          button.click();
          return;
        }
      }
    }
  }

  console.log('[Auto-download] No button found for format:', format, 'quality:', quality);
}

