/**
 * Main Entry Point - TypeScript
 * ezconv.pro - Video Downloader
 */

import './styles/index.css';

import { initMobileMenu, initLangSelector, initDrawerLangSelector, initHeaderScroll, initFirebaseAnalytics } from './features/shared/init/common-init';

async function initDownloaderUI() {
  try {
    const { init } = await import('./features/downloader/downloader-ui');
    await init();
  } catch (err) {
    console.error('Failed to initialize downloader UI:', err);
  }
}

function initLogoClickHandler() {
  document.querySelectorAll('a.logo[href="/"]').forEach(logo => {
    logo.addEventListener('click', (event) => {
      if (window.location.pathname === '/') {
        event.preventDefault();
        if (document.body.classList.contains('drawer-open')) {
          document.body.classList.remove('drawer-open');
          document.body.style.overflow = '';
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

function loadFeatures() {
  initHeaderScroll();
  initMobileMenu();
  initLangSelector();
  initDrawerLangSelector();
  initDownloaderUI();
  initLogoClickHandler();
  initFirebaseAnalytics();

  import('./features/downloader/ui-render/dropdown-logic').then(({ initAudioDropdown }) => {
    initAudioDropdown();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadFeatures);
} else {
  loadFeatures();
}

