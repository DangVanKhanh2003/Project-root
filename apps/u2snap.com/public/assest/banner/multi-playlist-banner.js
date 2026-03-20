/**
 * Multi-Playlist Banner Component
 * A self-contained banner with 2 cards:
 * 1. Download Multiple Videos -> youtube-multi-downloader
 * 2. Download Playlist -> download-mp3-youtube-playlist
 * 
 * Usage:
 * import { initMultiPlaylistBanner } from './multi-playlist-banner.js';
 * initMultiPlaylistBanner('#container'); // or any CSS selector
 */

const BANNER_STYLES = `
  .mp-banner-container {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
    box-sizing: border-box;
    transition: all 0.5s ease;
  }

  .mp-banner-container *,
  .mp-banner-container *::before,
  .mp-banner-container *::after {
    box-sizing: border-box;
  }

  .mp-banner-content {
    width: 100%;
    min-height: 16rem;
    border-radius: 1.5rem;
    background: linear-gradient(to right, #EBE3DA, #F3EDE6, #EBE3DA);
    position: relative;
    z-index: 0;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 2rem 1.5rem;
    border: 1px solid rgba(255, 255, 255, 0.6);
  }

  @media (min-width: 768px) {
    .mp-banner-content {
      flex-direction: row;
      padding: 2rem 2.5rem;
    }
  }

  .mp-banner-left {
    width: 100%;
    z-index: 10;
    position: relative;
    margin-bottom: 1.5rem;
    padding-right: 0;
  }

  @media (min-width: 768px) {
    .mp-banner-left {
      width: 41.666667%;
      margin-bottom: 0;
      padding-right: 1.5rem;
    }
  }

  .mp-banner-badge {
    display: inline-block;
    padding: 0.25rem 0.75rem;
    background-color: #754e25;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.1em;
    margin-bottom: 0.75rem;
    color: white;
    text-transform: uppercase;
  }

  .mp-banner-title {
    font-size: 1.25rem;
    font-weight: 800;
    margin-bottom: 0.5rem;
    line-height: 1;
    color: #2F2F2F;
  }

  @media (min-width: 768px) {
    .mp-banner-title {
      font-size: 1.5rem;
    }
  }

  .mp-banner-title-highlight {
    color: #754e25;
  }

  .mp-banner-description {
    color: #5C5C5C;
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1;
    margin-bottom: 1.25rem;
    max-width: 28rem;
  }

  .mp-banner-social {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .mp-banner-avatars {
    display: flex;
  }

  .mp-banner-avatars > * {
    margin-left: -0.75rem;
  }

  .mp-banner-avatars > *:first-child {
    margin-left: 0;
  }

  .mp-banner-avatar {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    border: 2px solid white;
    object-fit: cover;
  }

  .mp-banner-avatar-count {
    width: 2rem;
    height: 2rem;
    border-radius: 9999px;
    border: 2px solid white;
    background-color: white;
    color: #5C5C5C;
    font-size: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
  }

  .mp-banner-rating {
    display: flex;
    flex-direction: column;
  }

  .mp-banner-rating-stars {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .mp-banner-star {
    color: #eab308;
    font-size: 1rem;
  }

  .mp-banner-rating-value {
    font-size: 0.875rem;
    font-weight: 700;
    color: #2F2F2F;
  }

  .mp-banner-rating-label {
    font-size: 10px;
    font-weight: 600;
    color: #9B9B9B;
  }

  .mp-banner-right {
    width: 100%;
    z-index: 10;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding-left: 0;
  }

  @media (min-width: 768px) {
    .mp-banner-right {
      width: 58.333333%;
      padding-left: 1rem;
    }
  }

  .mp-banner-card {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-radius: 0.75rem;
    width: 100%;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: all 0.3s ease;
    text-decoration: none !important;
  }

  .mp-banner-card:hover,
  .mp-banner-card:focus,
  .mp-banner-card:active {
    text-decoration: none !important;
  }

  .mp-banner-card-white {
    background-color: white;
    border: 1px solid rgba(227, 224, 218, 0.6);
  }

  .mp-banner-card-white:hover {
    border-color: #D4C4B3;
    transform: translateY(-2px);
  }

  .mp-banner-card-indigo {
    background-color: #754e25;
    border: 1px solid #A8845B;
  }

  .mp-banner-card-indigo:hover {
    transform: translateY(-2px);
  }

  .mp-banner-card-icon {
    padding: 0.75rem;
    border-radius: 0.5rem;
    flex-shrink: 0;
    line-height: 1;
    transition: background-color 0.3s ease;
  }

  .mp-banner-card-white .mp-banner-card-icon {
    background-color: #EBE7E0;
  }

  .mp-banner-card-white:hover .mp-banner-card-icon {
    background-color: #F3ECE3;
  }

  .mp-banner-card-indigo .mp-banner-card-icon {
    background-color: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(4px);
  }

  .mp-banner-card-icon svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .mp-banner-card-white .mp-banner-card-icon svg {
    color: #754e25;
  }

  .mp-banner-card-indigo .mp-banner-card-icon svg {
    color: white;
  }

  .mp-banner-card-text {
    text-align: left;
    flex: 1;
  }

  .mp-banner-card-title {
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.125rem;
    transition: color 0.3s ease;
  }

  @media (min-width: 768px) {
    .mp-banner-card-title {
      font-size: 1.125rem;
    }
  }

  .mp-banner-card-white .mp-banner-card-title {
    color: #2F2F2F;
  }

  .mp-banner-card-white:hover .mp-banner-card-title {
    color: #634221;
  }

  .mp-banner-card-indigo .mp-banner-card-title {
    color: white;
  }

  .mp-banner-card-subtitle {
    font-size: 0.75rem;
    font-weight: 500;
    line-height: 1;
  }

  .mp-banner-card-white .mp-banner-card-subtitle {
    color: #9B9B9B;
  }

  .mp-banner-card-indigo .mp-banner-card-subtitle {
    color: #A8845B;
  }

  .mp-banner-card-arrow {
    padding: 0.375rem;
    border-radius: 9999px;
    line-height: 1;
    transition: background-color 0.3s ease;
  }

  .mp-banner-card-white .mp-banner-card-arrow {
    background-color: transparent;
  }

  .mp-banner-card-white:hover .mp-banner-card-arrow {
    background-color: #F3ECE3;
  }

  .mp-banner-card-indigo .mp-banner-card-arrow {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .mp-banner-card-indigo:hover .mp-banner-card-arrow {
    background-color: rgba(255, 255, 255, 0.2);
  }

  .mp-banner-card-arrow svg {
    width: 1.25rem;
    height: 1.25rem;
  }

  .mp-banner-card-white .mp-banner-card-arrow svg {
    color: #9B9B9B;
  }

  .mp-banner-card-white:hover .mp-banner-card-arrow svg {
    color: #754e25;
  }

  .mp-banner-card-indigo .mp-banner-card-arrow svg {
    color: #A8845B;
  }

  /* ===== Dark Theme ===== */
  :root[data-theme="dark"] .mp-banner-content {
    background: linear-gradient(to right, #2E2C2A, #333130, #2E2C2A);
    border-color: rgba(255, 255, 255, 0.06);
  }

  :root[data-theme="dark"] .mp-banner-title {
    color: #E8E6E3;
  }

  :root[data-theme="dark"] .mp-banner-title-highlight {
    color: #A8845B;
  }

  :root[data-theme="dark"] .mp-banner-description {
    color: #C9C7C2;
  }

  :root[data-theme="dark"] .mp-banner-avatar {
    border-color: #383836;
  }

  :root[data-theme="dark"] .mp-banner-avatar-count {
    border-color: #383836;
    background-color: #383836;
    color: #C9C7C2;
  }

  :root[data-theme="dark"] .mp-banner-rating-value {
    color: #E8E6E3;
  }

  :root[data-theme="dark"] .mp-banner-rating-label {
    color: #8A8884;
  }

  :root[data-theme="dark"] .mp-banner-card-white {
    background-color: #30302E;
    border-color: #4A4A48;
  }

  :root[data-theme="dark"] .mp-banner-card-white:hover {
    border-color: rgba(117, 78, 37, 0.4);
  }

  :root[data-theme="dark"] .mp-banner-card-white .mp-banner-card-icon {
    background-color: #383836;
  }

  :root[data-theme="dark"] .mp-banner-card-white:hover .mp-banner-card-icon {
    background-color: rgba(117, 78, 37, 0.15);
  }

  :root[data-theme="dark"] .mp-banner-card-white .mp-banner-card-icon svg {
    color: #A8845B;
  }

  :root[data-theme="dark"] .mp-banner-card-white .mp-banner-card-title {
    color: #E8E6E3;
  }

  :root[data-theme="dark"] .mp-banner-card-white:hover .mp-banner-card-title {
    color: #A8845B;
  }

  :root[data-theme="dark"] .mp-banner-card-white .mp-banner-card-subtitle {
    color: #8A8884;
  }

  :root[data-theme="dark"] .mp-banner-card-white .mp-banner-card-arrow svg {
    color: #8A8884;
  }

  :root[data-theme="dark"] .mp-banner-card-white:hover .mp-banner-card-arrow svg {
    color: #A8845B;
  }

  :root[data-theme="dark"] .mp-banner-card-white:hover .mp-banner-card-arrow {
    background-color: rgba(117, 78, 37, 0.12);
  }
`;

const BANNER_HTML = `
  <div class="mp-banner-content">
    <!-- Left Content -->
    <div class="mp-banner-left">
      <div class="mp-banner-badge">Fast & Simple</div>
      <h2 class="mp-banner-title">
        Explore New Pages <br />
        <span class="mp-banner-title-highlight">Quick & Easy to Use!</span>
      </h2>
      <p class="mp-banner-description">
        Effortlessly download multiple videos at once with our fast, free, and easy-to-use tool!
      </p>

      <div class="mp-banner-social">
        <div class="mp-banner-avatars">
          <img class="mp-banner-avatar"
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&h=64"
            alt="User" />
          <img class="mp-banner-avatar"
            src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&h=64"
            alt="User" />
          <img class="mp-banner-avatar"
            src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&h=64"
            alt="User" />
          <div class="mp-banner-avatar-count">+2k</div>
        </div>
        <div class="mp-banner-rating">
          <div class="mp-banner-rating-stars">
            <span class="mp-banner-star">★</span>
            <span class="mp-banner-rating-value">4.9/5</span>
          </div>
          <span class="mp-banner-rating-label">Average Rating</span>
        </div>
      </div>
    </div>

    <!-- Right Interactive Buttons -->
    <div class="mp-banner-right">
      <!-- Card 1: Download Multiple Videos -->
      <a href="/multi-youtube-downloader" class="mp-banner-card mp-banner-card-white mp-banner-link-multi">
        <div class="mp-banner-card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 6H2V20C2 21.1 2.9 22 4 22H18V20H4V6ZM20 2H8C6.9 2 6 2.9 6 4V16C6 17.1 6.9 18 8 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2ZM12 14.5V5.5L18 10L12 14.5Z" />
          </svg>
        </div>
        <div class="mp-banner-card-text">
          <div class="mp-banner-card-title">Download Multiple Videos</div>
          <p class="mp-banner-card-subtitle">Batch processing for maximum efficiency.</p>
        </div>
        <div class="mp-banner-card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </a>

      <!-- Card 2: Download Playlist -->
      <a href="/download-mp3-youtube-playlist" class="mp-banner-card mp-banner-card-white mp-banner-link-playlist">
        <div class="mp-banner-card-icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 6H3V8H15V6ZM15 10H3V12H15V10ZM3 16H11V14H3V16ZM17 6V14.18C16.69 14.07 16.35 14 16 14C14.34 14 13 15.34 13 17C13 18.66 14.34 20 16 20C17.66 20 19 18.66 19 17V8H22V6H17Z" />
          </svg>
        </div>
        <div class="mp-banner-card-text">
          <div class="mp-banner-card-title">Download Playlist</div>
          <p class="mp-banner-card-subtitle">Get the entire collection in one click.</p>
        </div>
        <div class="mp-banner-card-arrow">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </a>
    </div>
  </div>
`;

/**
 * Inject styles into the document head (only once)
 */
function injectStyles() {
    const styleId = 'mp-banner-styles';
    if (document.getElementById(styleId)) return;

    const styleElement = document.createElement('style');
    styleElement.id = styleId;
    styleElement.textContent = BANNER_STYLES;
    document.head.appendChild(styleElement);
}

/**
 * Create the banner element
 * @returns {HTMLElement} The banner container element
 */
function buildHref(basePath, params) {
    const href = new URL(basePath, window.location.origin);
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        const normalized = String(value).trim();
        if (!normalized) return;
        href.searchParams.set(key, normalized);
    });
    return href.pathname + href.search;
}

function createBannerElement(options = {}) {
    const container = document.createElement('div');
    container.className = 'mp-banner-container';
    container.innerHTML = BANNER_HTML;

    const {
        multiPath = '/multi-youtube-downloader',
        playlistPath = '/download-mp3-youtube-playlist',
        multiParams = {},
        playlistParams = {}
    } = options;

    const multiLink = container.querySelector('.mp-banner-link-multi');
    if (multiLink) {
        multiLink.setAttribute('href', buildHref(multiPath, multiParams));
    }

    const playlistLink = container.querySelector('.mp-banner-link-playlist');
    if (playlistLink) {
        playlistLink.setAttribute('href', buildHref(playlistPath, playlistParams));
    }

    return container;
}

/**
 * Initialize the Multi-Playlist Banner
 * @param {string|HTMLElement} target - CSS selector or DOM element to inject the banner into
 * @param {Object} options - Custom URLs/params for links
 * @returns {HTMLElement} The created banner element
 */
export function initMultiPlaylistBanner(target, options = {}) {
    injectStyles();

    const container = typeof target === 'string'
        ? document.querySelector(target)
        : target;

    if (!container) {
        console.error('[MultiPlaylistBanner] Target container not found:', target);
        return null;
    }

    const banner = createBannerElement(options);
    container.appendChild(banner);

    return banner;
}

/**
 * Get just the banner HTML (for SSR or manual injection)
 * @returns {string} The banner HTML string
 */
export function getBannerHTML() {
    return `<div class="mp-banner-container">${BANNER_HTML}</div>`;
}

/**
 * Get just the banner styles (for SSR or manual injection)
 * @returns {string} The banner CSS string
 */
export function getBannerStyles() {
    return BANNER_STYLES;
}

// Auto-init if data attribute is present
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        const autoInitContainers = document.querySelectorAll('[data-multi-playlist-banner]');
        autoInitContainers.forEach(container => {
            initMultiPlaylistBanner(container);
        });
    });
}
