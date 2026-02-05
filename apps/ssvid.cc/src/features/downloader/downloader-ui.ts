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

import { setAudioTrack } from './ui-render/dropdown-logic';

/**
 * Initialize downloader UI
 */
export async function init(): Promise<void> {
  // Step 0: Initialize shared services
  // Configure scroll manager for ytmp3-clone-3 (header is static)
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

    // Apply URL parameters if present
    if (route.format || route.quality) {
      // Determine whether to switch to MP3 or MP4 tab
      const isAudio = route.format === 'mp3' || route.format === 'm4a' || route.format === 'wav' || route.format === 'ogg' || route.format === 'opus';
      const type = isAudio ? 'mp3' : 'mp4';

      // Find format tab buttons
      const mp4Btn = document.querySelector(`.format-btn[data-format="mp4"]`) as HTMLElement;
      const mp3Btn = document.querySelector(`.format-btn[data-format="mp3"]`) as HTMLElement;

      if (isAudio && mp3Btn) {
        mp3Btn.click();
      } else if (!isAudio && mp4Btn) {
        mp4Btn.click();
      } else {
        // Format buttons not found
      }

      // Handle quality selection
      // Logic: Try to find a match in the active select element
      // If route.quality is present, use it. If not, use route.format (e.g. format=wav -> select matches value="wav")
      const targetValue = route.quality ? `${type}-${route.quality}` : route.format;
      
      // Wait for tab switch to update DOM visibility (though click() is sync, state update might be async)
      // We select based on the type we just switched to
      const selectId = isAudio ? 'quality-select-mp3' : 'quality-select-mp4';
      const select = document.getElementById(selectId) as HTMLSelectElement;

      if (select && targetValue) {
        // Try to find the option. 
        // The values in HTML are like 'mp4-720', 'mp3-128', 'wav', 'webm'
        // Route params might be: format=mp4, quality=720 -> target=mp4-720
        // OR format=wav -> target=wav
        
        // Check if we need to prefix format for mp3/mp4 simple qualities
        // If the targetValue doesn't exist directly, try constructing it
        let valueToSelect = targetValue;
        
        // If exact match not found, try to be smart?
        // For now, let's assume the user passes valid params matching our values
        // or the mapping we just did: `${type}-${route.quality}`
        
        // Special case ref: HTML uses 'mp3-128' but route might be quality=128
        
        // Allow selecting by setting value
        select.value = valueToSelect;
        
        // Dispatch change event so FormatSelector updates its internal state (Redux/Store)
        select.dispatchEvent(new Event('change', { bubbles: true }));
         
         // If simpler match failed (e.g. targetValue was just 'mp4' but options are 'mp4-720')
        // we default to default behavior of dropdown (usually top option)
      } else {
        // Select element not found or target value missing.
      }
    }

    if (route.audioTrack) {
      // Apply audio track selection
      setAudioTrack(route.audioTrack);
    }

    if (form && input) {
      // Set input value
      input.value = youtubeUrl;

      // Trigger input event to update state and start suggestion throttling (which we want to bypass/ignore really)
      input.dispatchEvent(new Event('input', { bubbles: true }));

      // Small delay to let UI settle before submitting
      // INCREASED: 100ms -> 300ms to ensure FormatSelector events propagate and state updates
      setTimeout(() => {
        form.requestSubmit();
      }, 100);
    }
  }

  // Setup popstate listener (back/forward button handling)
  initRouting();

}

