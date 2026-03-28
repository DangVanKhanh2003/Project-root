/**
 * Shared test data & constants — Downloader Monorepo E2E Tests
 *
 * Test data for 19 downloader sites (YouTube, Facebook, TikTok, Instagram, X).
 * Project: downloader-monorepo
 */

// ==========================================
// App URLs
// ==========================================

/** All production app domains */
export const APP_DOMAINS: Record<string, string> = {
  'convert1s.com': 'https://convert1s.com',
  'onedownloader.net': 'https://onedownloader.net',
  'snakeloader.com': 'https://snakeloader.com',
  'snap1s.com': 'https://snap1s.com',
  'sstube.net': 'https://sstube.net',
  'ssvid.cc': 'https://ssvid.cc',
  'tube1s.com': 'https://tube1s.com',
  'u2snap.com': 'https://u2snap.com',
  'y2save.com': 'https://y2save.com',
  'yt1s.guru': 'https://yt1s.guru',
  'ytconvert.org': 'https://ytconvert.org',
  'ytmp4.gg': 'https://ytmp4.gg',
  'ytsss.com': 'https://ytsss.com',
};

// ==========================================
// Test Video URLs (public, short, stable)
// ==========================================

export const TEST_VIDEOS = {
  /** YouTube - short video, always available */
  youtube_short: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
  /** YouTube - standard video */
  youtube_standard: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  /** YouTube - with playlist param */
  youtube_with_playlist: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf',
  /** YouTube Shorts */
  youtube_shorts: 'https://www.youtube.com/shorts/dQw4w9WgXcQ',
  /** YouTube shortened URL */
  youtube_short_url: 'https://youtu.be/jNQXAC9IVRw',
};

export const INVALID_URLS = [
  '',
  'not-a-url',
  'http://',
  'https://example.com',
  'ftp://files.example.com/video.mp4',
  'https://www.youtube.com/watch?v=',
  'https://www.youtube.com/watch?v=INVALID_ID_TOO_LONG_12345',
];

// ==========================================
// Supported Languages
// ==========================================

export const LANGUAGES = [
  { code: 'en', name: 'English', dir: 'ltr' },
  { code: 'ar', name: 'العربية', dir: 'rtl' },
  { code: 'bn', name: 'বাংলা', dir: 'ltr' },
  { code: 'de', name: 'Deutsch', dir: 'ltr' },
  { code: 'es', name: 'Español', dir: 'ltr' },
  { code: 'fr', name: 'Français', dir: 'ltr' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr' },
  { code: 'id', name: 'Indonesia', dir: 'ltr' },
  { code: 'it', name: 'Italiano', dir: 'ltr' },
  { code: 'ja', name: '日本語', dir: 'ltr' },
  { code: 'ko', name: '한국어', dir: 'ltr' },
  { code: 'ms', name: 'Melayu', dir: 'ltr' },
  { code: 'my', name: 'မြန်မာ', dir: 'ltr' },
  { code: 'pt', name: 'Português', dir: 'ltr' },
  { code: 'ru', name: 'Русский', dir: 'ltr' },
  { code: 'th', name: 'ไทย', dir: 'ltr' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr' },
  { code: 'ur', name: 'اردو', dir: 'rtl' },
  { code: 'vi', name: 'Tiếng Việt', dir: 'ltr' },
] as const;

export const RTL_LANGUAGES = LANGUAGES.filter(l => l.dir === 'rtl');
export const LTR_LANGUAGES = LANGUAGES.filter(l => l.dir === 'ltr');

// ==========================================
// Selectors (shared CSS selectors for UI elements)
// ==========================================

export const SELECTORS = {
  // Input form
  urlInput: '#videoUrl, #urlsInput, #url-input, input[name="url"], input[name="q"], input[type="url"], .input-url, .hero-input input',
  submitButton: '#submit-btn, button[type="submit"], .hero-input button, .btn-download, .btn-convert, .multi-btn-convert, .converter-btn',
  pasteButton: '.paste-btn, [data-action="paste"]',

  // Format selector
  formatTabs: '.format-tabs, .tab-selector',
  videoTab: '[data-tab="video"], .tab-video',
  audioTab: '[data-tab="audio"], .tab-audio',
  qualitySelect: '.quality-select, select[name="quality"]',

  // Results / conversion
  resultContainer: '.result-container, .download-result, #result',
  progressBar: '.progress-bar, .conversion-progress',
  downloadButton: '.download-btn, a[download], .btn-download-file',
  errorMessage: '.error-message, .alert-error, .error',

  // Navigation
  langDropdown: '.lang-dropdown, .language-selector, [data-lang-dropdown]',
  themeToggle: '.theme-toggle, [data-theme-toggle]',
  navMenu: '.nav-menu, .mobile-menu',

  // Page structure
  header: 'header, .header, .navbar',
  footer: 'footer, .footer',
  heroSection: '.hero, .hero-section, .main-section',
};

// ==========================================
// Download formats for stress testing
// ==========================================

export const VIDEO_QUALITIES = ['2160', '1440', '1080', '720', '480', '360', '144'];
export const VIDEO_FORMATS = ['mp4', 'webm', 'mkv'];
export const AUDIO_FORMATS = ['mp3', 'm4a', 'wav', 'opus', 'ogg', 'flac'];
export const AUDIO_BITRATES = ['64', '128', '192', '320'];
