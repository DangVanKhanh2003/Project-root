/**
 * Downloader UI Orchestrator - TypeScript
 * Wires together Model-View-Controller components
 */

import { setRenderCallback, getState } from './state';
import { initRenderer, render } from './ui-render/ui-renderer';
import { initInputForm } from './logic/input-form';
import { initContentRenderer } from './ui-render/content-renderer';
import { initSuggestionRenderer, render as renderSuggestions } from '../../ui-components/suggestion-dropdown/suggestion-renderer';
import type { AppState } from './state';

/**
 * Initialize downloader UI
 */
export async function init(): Promise<void> {
  console.log('🚀 Initializing Downloader UI...');

  // Step 1: Initialize renderers (views)
  const rendererInitialized = initRenderer();
  const contentRendererInitialized = initContentRenderer();
  const suggestionRendererInitialized = initSuggestionRenderer();

  if (!rendererInitialized || !contentRendererInitialized) {
    console.error('❌ Failed to initialize renderers');
    return;
  }

  if (!suggestionRendererInitialized) {
    console.warn('⚠️ Suggestion renderer failed to initialize (may be missing DOM elements)');
    // Don't return - continue without suggestions
  }

  // Step 2: Register render callback (state changes trigger view updates)
  setRenderCallback((state: AppState, prevState: AppState) => {
    console.log('📊 State changed:', state);

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
    console.error('❌ Failed to initialize input form');
    return;
  }

  // Step 4: Initial render
  const initialState = getState();
  render(initialState);
  if (suggestionRendererInitialized) {
    renderSuggestions(initialState);
  }

  console.log('✅ Downloader UI initialized successfully');
}
