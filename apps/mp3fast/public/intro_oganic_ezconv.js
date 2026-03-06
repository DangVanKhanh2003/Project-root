/**
 * EzConv Intro Module
 * Self-contained banner & popup for promoting EzConv Pro.
 * No external dependencies (no Tailwind, no Lucide).
 *
 * Usage:
 *   <script src="intro_oganic_ezconv.js"></script>
 *   <script>
 *     EzConvIntro.injectBanner(document.getElementById('banner-container'));
 *     EzConvIntro.showPopup();
 *   </script>
 */
; (function (root) {
  'use strict';

  /* ───── SVG Icons (inline, no Lucide needed) ───── */

  const ICON_SEARCH = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>';

  const ICON_COPY = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>';

  const ICON_CHECK = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="m9 12 2 2 4-4"></path></svg>';

  const WAVE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" fill="none" aria-hidden="true" focusable="false" class="ezi-wave-svg">
    <rect width="100" height="50" fill="transparent"></rect>
    <g stroke="#C65D3B" stroke-width="3.5" stroke-linecap="round">
      <path class="ezi-wave-line ezi-run-wave" d="M 4 23 v 4" style="animation-delay:.5s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 10 20 v 10" style="animation-delay:.45s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 16 15 v 20" style="animation-delay:.4s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 22 9 v 32" style="animation-delay:.35s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 28 15 v 20" style="animation-delay:.3s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 34 17 v 16" style="animation-delay:.25s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 40 10 v 30" style="animation-delay:.2s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 46 4 v 42" style="animation-delay:.15s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 52 2 v 46" style="animation-delay:.1s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 58 11 v 28" style="animation-delay:.05s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 64 16 v 18" style="animation-delay:0s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 70 12 v 26" style="animation-delay:.05s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 76 18 v 14" style="animation-delay:.1s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 82 17 v 16" style="animation-delay:.15s"></path>
      <path class="ezi-wave-line ezi-run-wave" d="M 88 21 v 8" style="animation-delay:.2s"></path>
    </g>
  </svg>`;

  /* ───── Google colored letters ───── */

  const GOOGLE_LETTERS = `<span class="ezi-google-letters"><span style="color:#4285F4">G</span><span style="color:#EA4335">o</span><span style="color:#FBBC05">o</span><span style="color:#4285F4">g</span><span style="color:#34A853">l</span><span style="color:#EA4335">e</span></span>`;

  /* ───── Feature list items ───── */

  const FEATURES = [
    'Download MP3 up to 320kbps',
    'Download MP4, MKV, WebM (4K, 2K, HD)',
    'Download entire playlists',
    'Download full channels',
    'Advanced download settings',
    'Fast conversion',
    '100% free',
    'No ads',
  ];

  /* ───── Default config ───── */

  const DEFAULTS = {
    keyword: 'ezconv pro',
    title: 'EzConv Pro — The Professional Free & No-Ads YouTube Download Platform',
    subtitle: "Give EzConv Pro a try — it's worth your time.",
    desktopImage: 'https://mp3fast.net/desktop_ezconv_intro_goggle.png',
    mobileImage: 'https://mp3fast.net/mobile_ezconv_intro_goggle.png',
    expImage: 'https://mp3fast.net/ezconv_exp.png',
  };

  /* ───── CSS (scoped with .ezi- prefix) ───── */

  const CSS = `
/* EzConv Intro — scoped styles */
.ezi-wave-line{transform-origin:center 25px;transform:scaleY(1)}
.ezi-run-wave{animation:ezi-wave-run .5s ease-in-out forwards}
@keyframes ezi-wave-run{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.5)}}

.ezi-card{
  width:100%;
  background:#fff;
  border-radius:24px;
  border:1px solid #E4E1DD;
  box-shadow:0 1px 2px rgba(0,0,0,.05);
  overflow:hidden;
  box-sizing:border-box;
  font-family:'Anthropic Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  color:#2E2E2E;
}
.ezi-card *{box-sizing:border-box}
.ezi-card-inner{padding:24px}

.ezi-header{display:flex;align-items:center;gap:12px;margin-bottom:10px}
.ezi-wave-svg{width:56px;height:28px;cursor:pointer;flex-shrink:0}
.ezi-title{
  font-size:18px;font-weight:700;color:#000;
  font-family:'Anthropic Serif Display','Anthropic Sans',serif;
  letter-spacing:-.01em;line-height:1.25;margin:0;
}
.ezi-subtitle{
  font-size:14px;color:#6B6B6B;line-height:1.6;
  max-width:560px;margin:0;font-weight:400;
}

/* Exp image (banner only, above search label) */
.ezi-exp-img{
  width:100%;height:auto;display:block;border-radius:12px;
  margin-bottom:16px;
}

/* Search on Google */
.ezi-search-label{
  font-size:15px;font-weight:600;color:#6B6B6B;
  margin:40px 0 12px;display:flex;align-items:center;gap:6px;
}
.ezi-google-letters{
  display:inline-flex;letter-spacing:-.02em;font-size:20px;font-weight:500;
}
.ezi-search-section{margin-top:32px}
.ezi-search-bar{
  display:flex;align-items:center;gap:10px;
  padding:8px 8px 8px 20px;height:60px;
  background:#fff;border:2px solid #E4E1DD;border-radius:9999px;
  box-shadow:0 2px 4px rgba(0,0,0,.06);
  transition:box-shadow .2s;
  width:100%;max-width:520px;
}
.ezi-search-bar:hover{box-shadow:0 4px 8px rgba(0,0,0,.1)}
.ezi-search-icon{flex-shrink:0;color:#94a3b8;display:flex;align-items:center}
.ezi-search-icon svg{width:20px;height:20px}
.ezi-search-keyword{
  flex:1;font-weight:700;font-size:24px;color:#2E2E2E;
  letter-spacing:-.01em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.ezi-copy-btn{
  display:flex;align-items:center;gap:6px;
  padding:12px 20px;
  background:#D96C3F;color:#fff;border:none;border-radius:9999px;
  font-size:12px;font-weight:700;cursor:pointer;
  transition:background .15s;white-space:nowrap;
  line-height:1;
}
.ezi-copy-btn:hover{background:#C65E35}
.ezi-copy-btn svg{display:block}

/* Preview image */
.ezi-preview{
  margin:32px 0 16px;border-radius:16px;
  border:1px solid #E4E1DD;box-shadow:0 1px 2px rgba(0,0,0,.05);
  background:#f8fafc;
}
.ezi-preview img{width:100%;height:auto;display:block;border-radius:16px}
.ezi-preview .ezi-img-desktop{display:none}
.ezi-preview .ezi-img-mobile{display:block}
@media(min-width:640px){
  .ezi-preview .ezi-img-desktop{display:block}
  .ezi-preview .ezi-img-mobile{display:none}
}

/* Feature grid */
.ezi-features{
  display:grid;grid-template-columns:1fr;
  gap:12px 24px;
  margin-top:24px;padding-top:24px;
  border-top:1px solid #f1f5f9;
}
.ezi-feature{
  display:flex;align-items:center;gap:8px;
  font-size:14px;color:#475569;
}
.ezi-feature svg{flex-shrink:0;color:#D96C3F}

/* ── Popup overlay ── */
.ezi-popup-overlay{
  position:fixed;inset:0;z-index:9999;
  display:none;align-items:center;justify-content:center;
  padding:16px;
}
.ezi-popup-overlay.ezi-visible{display:flex}
.ezi-popup-backdrop{
  position:absolute;inset:0;
  background:rgba(15,23,42,.6);
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
}
.ezi-popup-content{
  position:relative;z-index:1;width:100%;max-width:672px;
}
.ezi-popup-footer{
  padding:16px;
  border-top:1px solid #f1f5f9;text-align:center;
}
.ezi-dismiss-btn{
  font-size:14px;font-weight:500;color:#94a3b8;
  background:none;border:none;cursor:pointer;
  transition:color .15s;
}
.ezi-dismiss-btn:hover{color:#D96C3F}

/* Pro version button */
.ezi-pro-btn-wrap{display:flex;justify-content:center;margin-top:12px}
.ezi-pro-btn{
  padding:14px 24px;
  background:#C65D3B;color:#fff;
  border:none;border-radius:12px;
  font-size:15px;font-weight:700;
  cursor:pointer;transition:background .15s;
  white-space:nowrap;
  -webkit-tap-highlight-color:transparent;
}
.ezi-pro-btn:hover{background:#b5532f}

/* ── Mobile compact (both banner & popup) ── */
@media(max-width:639px){
  /* Banner mobile */
  .ezi-card-inner{padding:16px}
  .ezi-header{gap:8px;margin-bottom:6px}
  .ezi-title{font-size:15px}
  .ezi-subtitle{font-size:13px;line-height:1.4}
  .ezi-search-section{margin-top:16px}
  .ezi-search-label{margin-bottom:8px}
  .ezi-preview{margin:16px 0 8px}
  .ezi-features{margin-top:16px;padding-top:16px;gap:8px 16px}
  .ezi-exp-img{margin-bottom:12px}
  .ezi-search-keyword{font-size:18px}
  .ezi-search-bar{height:50px}
  #ezconv-intro-banner-section{margin:16px}

  /* Popup mobile extra */
  .ezi-popup-overlay .ezi-popup-footer{padding:12px}
  .ezi-popup-overlay .ezi-wave-svg{width:40px;height:20px}
}

/* ── Responsive ── */
@media(min-width:640px){
  .ezi-card{border-radius:28px}
  .ezi-card-inner{padding:40px}
  .ezi-header{gap:16px}
  .ezi-wave-svg{width:64px;height:32px}
  .ezi-title{font-size:28px}
  .ezi-subtitle{font-size:16px}
  .ezi-search-label{font-size:14px}
  .ezi-google-letters{font-size:18px}
  .ezi-search-bar{padding:6px 6px 6px 20px}
  .ezi-search-keyword{font-size:18px}
  .ezi-copy-btn{padding:10px 24px;font-size:14px}
  .ezi-popup-overlay{padding:24px}
  .ezi-features{grid-template-columns:1fr 1fr}
}
@media(min-width:1024px){
  .ezi-card-inner{padding:48px}
  .ezi-title{font-size:32px}
}
`;

  let _styleInjected = false;
  let _popupEl = null;

  /* ───── Helpers ───── */

  function injectStyle() {
    if (_styleInjected) return;
    // Load Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Anthropic+Sans:wght@400;500;600;700;800&family=Anthropic+Serif+Display:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
    const style = document.createElement('style');
    style.textContent = CSS;
    document.head.appendChild(style);
    _styleInjected = true;
  }

  function buildFeatureHTML() {
    return FEATURES.map(
      (f) => `<div class="ezi-feature">${ICON_CHECK}<span>${f}</span></div>`
    ).join('');
  }

  function buildSearchBar(cfg, opts) {
    const expImg = opts.showExpImage && cfg.expImage
      ? `<img class="ezi-exp-img" src="${cfg.expImage}" alt="EzConv Pro">`
      : '';
    return `
      <div class="ezi-search-section">
        ${expImg}
        <p class="ezi-search-label">Search on ${GOOGLE_LETTERS}</p>
        <div class="ezi-search-bar">
          <span class="ezi-search-icon">${ICON_SEARCH}</span>
          <span class="ezi-search-keyword">${cfg.keyword}</span>
          <button class="ezi-copy-btn" data-ezi-copy="${cfg.keyword}">
            ${ICON_COPY}<span class="ezi-btn-text">Copy</span>
          </button>
        </div>
      </div>`;
  }

  function buildPreview(cfg) {
    return `
      <div class="ezi-preview">
        <img class="ezi-img-desktop" src="${cfg.desktopImage}" alt="EzConv Pro Google Search Preview">
        <img class="ezi-img-mobile" src="${cfg.mobileImage}" alt="EzConv Pro Google Search Preview">
      </div>`;
  }

  function buildCardContent(cfg, opts) {
    const showFeatures = opts.showFeatures !== false;
    const showExpImage = opts.showExpImage === true;
    return `
      <div class="ezi-card-inner">
        <div class="ezi-header">
          <div>${WAVE_SVG}</div>
          <p class="ezi-title">${cfg.title}</p>
        </div>
        <p class="ezi-subtitle">${cfg.subtitle}</p>
        ${buildSearchBar(cfg, { showExpImage })}
        ${buildPreview(cfg)}
        ${showFeatures ? `<div class="ezi-features">${buildFeatureHTML()}</div>` : ''}
      </div>`;
  }

  /* ───── Copy handler (delegated) ───── */

  function handleCopyClick(e) {
    const btn = e.target.closest('[data-ezi-copy]');
    if (!btn) return;
    const text = btn.getAttribute('data-ezi-copy');
    navigator.clipboard.writeText(text).then(() => {
      btn.innerHTML = `${ICON_CHECK}<span class="ezi-btn-text">Copied</span>`;
      setTimeout(() => {
        btn.innerHTML = `${ICON_COPY}<span class="ezi-btn-text">Copy</span>`;
      }, 2000);
    });
  }

  document.addEventListener('click', handleCopyClick);

  /* ───── Public API ───── */

  /**
   * Inject the banner card into the given container element.
   * @param {HTMLElement} container
   * @param {Object}      [options]
   * @param {string}      [options.keyword]
   * @param {string}      [options.title]
   * @param {string}      [options.subtitle]
   * @param {string}      [options.desktopImage]
   * @param {string}      [options.mobileImage]
   * @param {boolean}     [options.showFeatures=true]
   */
  function injectBanner(container, options) {
    if (!container) return;
    injectStyle();
    const cfg = Object.assign({}, DEFAULTS, options);
    const card = document.createElement('div');
    card.className = 'ezi-card';
    card.innerHTML = buildCardContent(cfg, { showFeatures: cfg.showFeatures !== false, showExpImage: true });
    container.appendChild(card);
  }

  /**
   * Show the popup modal.
   * @param {Object} [options]  — same options as injectBanner (keyword, title, etc.)
   */
  function showPopup(options) {
    injectStyle();
    const cfg = Object.assign({}, DEFAULTS, options);

    // Reuse existing popup element
    if (!_popupEl) {
      _popupEl = document.createElement('div');
      _popupEl.className = 'ezi-popup-overlay';
      _popupEl.innerHTML = `
        <div class="ezi-popup-backdrop"></div>
        <div class="ezi-popup-content">
          <div class="ezi-card">
            ${buildCardContent(cfg, { showFeatures: false })}
            <div class="ezi-popup-footer">
              <button class="ezi-dismiss-btn">Maybe later</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(_popupEl);

      // Close on backdrop click
      _popupEl.querySelector('.ezi-popup-backdrop').addEventListener('click', hidePopup);
      // Close on dismiss button
      _popupEl.querySelector('.ezi-dismiss-btn').addEventListener('click', hidePopup);
    }

    _popupEl.classList.add('ezi-visible');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Hide the popup modal.
   */
  function hidePopup() {
    if (_popupEl) {
      _popupEl.classList.remove('ezi-visible');
      document.body.style.overflow = '';
    }
  }

  /* ───── Pro version button triggers popup ───── */

  document.addEventListener('click', function (e) {
    const btn = e.target.closest('.ezi-pro-btn');
    if (btn) {
      showPopup();
    }
  });

  /* ───── Export ───── */

  /**
   * Preload popup DOM so it's instant on first show.
   */
  function preloadPopup(options) {
    injectStyle();
    const cfg = Object.assign({}, DEFAULTS, options);
    if (!_popupEl) {
      _popupEl = document.createElement('div');
      _popupEl.className = 'ezi-popup-overlay';
      _popupEl.innerHTML = `
        <div class="ezi-popup-backdrop"></div>
        <div class="ezi-popup-content">
          <div class="ezi-card">
            ${buildCardContent(cfg, { showFeatures: false, showExpImage: false })}
            <div class="ezi-popup-footer">
              <button class="ezi-dismiss-btn">Maybe later</button>
            </div>
          </div>
        </div>`;
      document.body.appendChild(_popupEl);
      _popupEl.querySelector('.ezi-popup-backdrop').addEventListener('click', hidePopup);
      _popupEl.querySelector('.ezi-dismiss-btn').addEventListener('click', hidePopup);
    }
  }

  root.EzConvIntro = {
    injectBanner: injectBanner,
    showPopup: showPopup,
    hidePopup: hidePopup,
    preloadPopup: preloadPopup,
  };

})(typeof globalThis !== 'undefined' ? globalThis : window);
