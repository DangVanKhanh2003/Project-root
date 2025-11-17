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
import type { AppState } from './state';

/**
 * Initialize downloader UI
 */
export async function init(): Promise<void> {

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

}
