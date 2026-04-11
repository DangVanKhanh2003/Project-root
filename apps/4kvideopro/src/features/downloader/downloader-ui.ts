/**
 * Downloader UI Orchestrator - TypeScript
 * Wires together Model-View-Controller components
 */

import { setRenderCallback, getState, initializeFormatSelector } from './state';
import { initRenderer, render, setInputValue, focusInput } from './ui-render/ui-renderer';
import { initInputForm } from './logic/input-form';
import { initContentRenderer } from './ui-render/content-renderer';
import { SuggestionDropdown } from '@downloader/ui-components';
import { initConversionController } from './logic/conversion/conversion-controller';
import { scrollManager } from '@downloader/ui-shared';
import type { AppState } from './state';
import { getRouteFromUrl, initRouting, cleanUrl } from './routing/url-manager';
import { setVideoPageSEO } from './routing/seo-manager';
import { initFormatSelector } from '../../ui-components/format-selector/format-selector';
import { initViewSwitcher, showSearchView } from './ui-render/view-switcher';

/**
 * Initialize downloader UI
 */
export async function init(): Promise<void> {
  // Step 0: Initialize shared services
  // Configure scroll manager for 4kvideopro (header is static)
  scrollManager.setHeaderConfig({ isFixed: false, height: 0 });
  scrollManager.init();

  // ==========================================
  // Format Selector Initialization
  // ==========================================
  // IMPORTANT: Order matters to prevent layout shift
  // 1. Initialize state first (from localStorage or page defaults)
  // 2. Render UI immediately with loaded state (no skeleton needed)
  // Result: User sees FormatSelector instantly with correct values
  initializeFormatSelector();
  initFormatSelector('#format-selector-container');

  // Step 1: Initialize renderers (views)
  const rendererInitialized = initRenderer();
  const contentRendererInitialized = initContentRenderer();
  const viewSwitcherInitialized = initViewSwitcher();

  // Initialize SuggestionDropdown
  const suggestionDropdown = new SuggestionDropdown({
    containerId: 'suggestion-container',
    inputId: 'videoUrl'
  });
  const suggestionRendererInitialized = suggestionDropdown.init();

  if (!rendererInitialized || !contentRendererInitialized) {
    return;
  }

  if (!viewSwitcherInitialized) {
    console.warn('View switcher failed to initialize - 2-view structure may not work');
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
      suggestionDropdown.render(state);
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
    suggestionDropdown.render(initialState);
  }

  // Step 6: Setup routing (check URL on page load)
  const route = getRouteFromUrl();

  // Clean URL (remove extra params)
  cleanUrl();

  if (route.type === 'video' && route.videoId) {
    // Deep link or page refresh with video URL
    // Update SEO meta tags for video page
    setVideoPageSEO();

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

