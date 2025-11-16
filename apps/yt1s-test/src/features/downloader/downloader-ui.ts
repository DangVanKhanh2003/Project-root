/**
 * Downloader UI Orchestrator - TypeScript
 * Wires together Model-View-Controller components
 */

import { setRenderCallback } from './state';
import { initRenderer, render } from './ui-renderer';
import { initInputForm } from './input-form';
import { initContentRenderer } from './content-renderer';
import type { AppState } from './state';

/**
 * Initialize downloader UI
 */
export async function init(): Promise<void> {
  console.log('🚀 Initializing Downloader UI...');

  // Step 1: Initialize renderers (views)
  const rendererInitialized = initRenderer();
  const contentRendererInitialized = initContentRenderer();

  if (!rendererInitialized || !contentRendererInitialized) {
    console.error('❌ Failed to initialize renderers');
    return;
  }

  // Step 2: Register render callback (state changes trigger view updates)
  setRenderCallback((state: AppState, prevState: AppState) => {
    console.log('📊 State changed:', state);
    render(state, prevState);
  });

  // Step 3: Initialize input form controller
  const formInitialized = initInputForm();

  if (!formInitialized) {
    console.error('❌ Failed to initialize input form');
    return;
  }

  console.log('✅ Downloader UI initialized successfully');
}
