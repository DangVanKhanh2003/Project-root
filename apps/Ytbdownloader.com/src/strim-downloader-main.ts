import './styles/index.css';
import { applyInitialVisibility } from './features/widget-level-manager';
import { initHeroFeatureLinks } from './features/hero-feature-links';
import { initAllowedFeatures } from './features/allowed-features';


function prepareStreamSubmitInterception(): void {
  const form = document.getElementById('downloadForm') as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const startBtn = document.getElementById('stream-start-btn') as HTMLButtonElement | null;
    startBtn?.click();
  }, { capture: true });
}

async function initDownloaderUI(): Promise<void> {
  const { init } = await import('./features/downloader/downloader-ui');
  await init();
}

function initMobileMenu(): void {
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const closeDrawerBtn = document.getElementById('close-drawer-btn');
  const mobileDrawer = document.getElementById('mobile-drawer');
  if (!mobileMenuBtn || !mobileDrawer) return;

  mobileDrawer.removeAttribute('hidden');
  const openDrawer = () => {
    mobileDrawer.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  const closeDrawer = () => {
    mobileDrawer.classList.remove('open');
    document.body.style.overflow = '';
  };

  mobileMenuBtn.addEventListener('click', (event) => {
    event.preventDefault();
    openDrawer();
  });
  closeDrawerBtn?.addEventListener('click', closeDrawer);
  mobileDrawer.addEventListener('click', (event) => {
    if (event.target === mobileDrawer) closeDrawer();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && mobileDrawer.classList.contains('open')) {
      closeDrawer();
    }
  });
}

function initLangSelector(): void {
  const langSelector = document.querySelector('.lang-selector');
  const langButton = document.querySelector('.lang-button');
  if (!langSelector || !langButton) return;

  langButton.addEventListener('click', (event) => {
    event.stopPropagation();
    langSelector.classList.toggle('active');
  });
  document.addEventListener('click', (event) => {
    if (!langSelector.contains(event.target as Node)) {
      langSelector.classList.remove('active');
    }
  });
}

function initDrawerLangSelector(): void {
  const drawerLangSelector = document.querySelector('.drawer-lang-selector');
  const drawerLangButton = document.querySelector('.drawer-lang-button');
  if (!drawerLangSelector || !drawerLangButton) return;

  drawerLangButton.addEventListener('click', (event) => {
    event.stopPropagation();
    drawerLangSelector.classList.toggle('active');
  });
}

function initFirebaseAnalytics(): void {
  setTimeout(() => {
    import('./libs/firebase/firebase-loader')
      .then(({ loadFirebaseWhenIdle }) => loadFirebaseWhenIdle())
      .catch(() => { });
  }, 5000);
}

function initFeedbackWidget(): void {
  setTimeout(() => {
    import('./features/feedback/feedback-widget')
      .then(({ initFeedbackWidget: init }) => init())
      .catch(() => { });
  }, 5000);
}

async function loadFeatures(): Promise<void> {
  initAllowedFeatures();
  await applyInitialVisibility();
  initMobileMenu();
  initLangSelector();
  initDrawerLangSelector();
  initHeroFeatureLinks();
  prepareStreamSubmitInterception();
  await initDownloaderUI();

  const { init } = await import('./features/strim-downloader/strim-downloader');
  init();
  initFirebaseAnalytics();
  initFeedbackWidget();
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
