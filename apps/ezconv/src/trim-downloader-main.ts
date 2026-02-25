/**
 * Trim Downloader Entry Point
 * Entry point for cut-video-youtube.html
 */

import './styles/index.css';

import { initMobileMenu, initLangSelector, initDrawerLangSelector, initHeaderScroll, initFirebaseAnalytics } from './features/shared/init/common-init';

function prepareStreamSubmitInterception(): void {
  const form = document.getElementById('downloadForm') as HTMLFormElement | null;
  if (!form) return;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    (document.getElementById('stream-start-btn') as HTMLButtonElement | null)?.click();
  }, { capture: true });
}

async function initDownloaderUI(): Promise<void> {
  const { init } = await import('./features/downloader/downloader-ui');
  await init();
}

async function loadFeatures(): Promise<void> {
  initHeaderScroll();
  initMobileMenu();
  initLangSelector();
  initDrawerLangSelector();
  prepareStreamSubmitInterception();
  await initDownloaderUI();

  const { init } = await import('./features/trim-downloader/trim-downloader');
  init();
  initFirebaseAnalytics();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadFeatures().catch((error) => {
      console.error('Failed to initialize cut video page:', error);
    });
  });
} else {
  loadFeatures().catch((error) => {
    console.error('Failed to initialize cut video page:', error);
  });
}
