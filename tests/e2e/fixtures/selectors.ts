/**
 * Real DOM Selectors — Downloader Monorepo
 *
 * Mapped from actual source code of 19 sites:
 * onedownloader.net, ssvid.cc, yt1s.guru, ytmp4.gg, ytsss.com,
 * convert1s.com, tube1s.com, snap1s.com, snakeloader.com, u2snap.com,
 * y2save.com, sstube.net, ytconvert.org, ytmp3.my, y2matepro,
 * y2matevc, mp3fast, ezconv, 4kvideopro
 *
 * All sites share the same DOM structure (monorepo shared code).
 */

export const S = {
  // ==========================================
  // Input Form
  // ==========================================
  form: '#downloadForm',
  urlInput: '#videoUrl',
  pasteBtn: '#input-action-button',
  submitBtn: '#downloadForm button[type="submit"]',
  convertBtn: '.btn-convert',
  errorMessage: '#error-message',

  // ==========================================
  // Format Selector
  // ==========================================
  formatSelector: '#format-selector-container',
  formatBtnMp3: '.format-btn[data-format="mp3"]',
  formatBtnMp4: '.format-btn[data-format="mp4"]',
  formatBtnActive: '.format-btn.active',
  qualitySelectMp4: '.quality-select--mp4',
  qualitySelectMp3: '.quality-select--mp3',

  // Grouped video dropdown
  videoGroupTrigger: '[data-video-group-trigger]',
  videoGroupMenu: '.video-group-menu',
  videoGroupItem: (format: string, quality: string) => `[data-group-item="${format}-${quality}"]`,

  // ==========================================
  // Preview Card
  // ==========================================
  previewCard: '.yt-preview-card',
  previewSkeleton: '.yt-preview-card.skeleton',
  previewTitle: '.yt-preview-title',
  previewThumbnail: '.yt-preview-thumbnail img',
  previewAuthor: '.yt-preview-author',
  badgeFormat: '.badge-format',
  badgeQuality: '.badge-main-quality',

  // ==========================================
  // Conversion Status
  // ==========================================
  statusContainer: '#status-container',
  statusBar: '.status',
  statusText: '.status-text',
  statusSpinner: '.spinner.active',
  statusSuccess: '.status--success',
  statusError: '.status--error',
  statusProcessing: '.status--processing',

  // ==========================================
  // Action Buttons (after conversion)
  // ==========================================
  actionContainer: '#action-container',
  downloadBtn: '#conversion-download-btn',
  retryBtn: '#conversion-retry-btn',
  startOverBtn: '#btn-new-convert',

  // ==========================================
  // Navigation
  // ==========================================
  mobileMenuBtn: '#mobile-menu-btn',
  mobileDrawer: '#mobile-drawer',
  closeDrawerBtn: '#close-drawer-btn',
  langSelector: '.lang-selector',
  langButton: '.lang-button',
  langDropdown: '.lang-dropdown',
  langOption: '.lang-option',

  // ==========================================
  // Views
  // ==========================================
  searchView: '#search-view',
  resultView: '#result-view',
  contentArea: '#content-area',

  // ==========================================
  // Page structure
  // ==========================================
  header: 'header',
  footer: 'footer',
  hero: '.hero-section, .hero, .main-section',
};
