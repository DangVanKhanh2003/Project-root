/**
 * Download Options Renderer - TypeScript
 * Renders video info + download options UI (2-column layout)
 * Based on old project's download-rendering.js structure
 */

/**
 * Video metadata interface
 */
interface VideoMeta {
  vid: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  source: string;
  originalUrl: string;
  isFakeData?: boolean;
}

/**
 * Format option interface
 */
interface FormatOption {
  quality: string;
  format: string;
  videoId: string;
  type: 'video' | 'audio';
  size: string;
}

/**
 * Download options data structure
 */
interface DownloadOptionsData {
  meta: VideoMeta;
  formats: {
    video: FormatOption[];
    audio: FormatOption[];
  };
}

/**
 * Main function to render download options UI
 * Returns HTML string with 2-column layout (video info + format options)
 */
export function renderDownloadOptions(data: DownloadOptionsData, activeTab: 'video' | 'audio' = 'video'): string {
  if (!data || !data.meta || !data.formats) {
    return renderErrorMessage('No download options available');
  }

  const { meta, formats } = data;
  const hasVideo = formats.video && formats.video.length > 0;
  const hasAudio = formats.audio && formats.audio.length > 0;

  if (!hasVideo && !hasAudio) {
    return renderErrorMessage('No formats available for download');
  }

  return `
    <div id="downloadOptionsContainer" class="video-info-card">
      <div class="video-layout">
        <!-- Left Column: Video Info -->
        <div class="video-info-left">
          ${renderVideoInfo(meta)}
        </div>

        <!-- Right Column: Download Options -->
        <div class="video-details">
          ${renderTabNavigation(activeTab, hasVideo, hasAudio)}
          ${renderFormatPanels(formats.video, formats.audio, activeTab)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render video thumbnail and title
 */
function renderVideoInfo(meta: VideoMeta): string {
  if (!meta) {
    return '<div class="dl-info__placeholder">No video information</div>';
  }

  const { title, thumbnail } = meta;
  const displayTitle = title || 'Video';

  return `
    <div class="video-thumbnail aspect-16-9">
      <img id="videoThumbnail"
           alt="Video thumbnail"
           class="thumbnail-image"
           src="${escapeHtml(thumbnail)}"
           width="480"
           height="360"
           loading="eager"
           decoding="async">
    </div>
    <div class="video-title-wrapper">
      <h3 id="videoTitle" class="video-title expandable-text" title="${escapeHtml(displayTitle)}">
        ${escapeHtml(displayTitle)}
      </h3>
    </div>
  `;
}

/**
 * Render format tabs (Video/Audio navigation)
 */
function renderTabNavigation(activeTab: 'video' | 'audio', hasVideo: boolean, hasAudio: boolean): string {
  const videoDisabled = !hasVideo;
  const audioDisabled = !hasAudio;

  return `
    <div class="format-tabs" role="tablist" aria-label="Format selection">
      <button type="button"
              class="format-tab ${activeTab === 'video' ? 'active' : ''} ${videoDisabled ? 'disabled' : ''}"
              role="tab"
              aria-selected="${activeTab === 'video'}"
              aria-controls="videoFormats"
              data-tab="video"
              id="tab-video"
              ${videoDisabled ? 'disabled' : ''}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></rect>
        </svg>
        <span>Video</span>
      </button>
      <button type="button"
              class="format-tab ${activeTab === 'audio' ? 'active' : ''} ${audioDisabled ? 'disabled' : ''}"
              role="tab"
              aria-selected="${activeTab === 'audio'}"
              aria-controls="audioFormats"
              data-tab="audio"
              id="tab-audio"
              ${audioDisabled ? 'disabled' : ''}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9 18V5l12-2v13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
          <circle cx="6" cy="18" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
          <circle cx="18" cy="16" r="3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></circle>
        </svg>
        <span>Audio</span>
      </button>
    </div>
  `;
}

/**
 * Render both format panels (video + audio)
 */
function renderFormatPanels(videoFormats: FormatOption[], audioFormats: FormatOption[], activeTab: 'video' | 'audio'): string {
  const videoPanel = renderFormatPanel('video', videoFormats, activeTab === 'video');
  const audioPanel = renderFormatPanel('audio', audioFormats, activeTab === 'audio');

  return `
    ${videoPanel}
    ${audioPanel}
  `;
}

/**
 * Render single format panel (video OR audio)
 */
function renderFormatPanel(category: 'video' | 'audio', formats: FormatOption[], isActive: boolean): string {
  const panelId = `${category}Formats`;
  const displayStyle = isActive ? 'block' : 'none';

  if (!formats || formats.length === 0) {
    const emptyMessage = category === 'video' ? 'No video formats available' : 'No audio formats available';
    return `
      <div class="quality-list" id="${panelId}" role="tabpanel" aria-labelledby="tab-${category}" style="display: ${displayStyle};">
        <div class="quality-empty">${emptyMessage}</div>
      </div>
    `;
  }

  const formatItems = formats.map(format => renderFormatItem(format, category)).join('');

  return `
    <div class="quality-list" id="${panelId}" role="tabpanel" aria-labelledby="tab-${category}" style="display: ${displayStyle};">
      ${formatItems}
    </div>
  `;
}

/**
 * Render single format item (quality option with download button)
 */
function renderFormatItem(format: FormatOption, category: 'video' | 'audio'): string {
  const formatId = `${category}-${format.quality}`;
  const formatType = format.format.toUpperCase();

  return `
    <div class="quality-item" data-format-id="${escapeHtml(formatId)}" data-category="${category}">
      <div class="quality-row">
        <div class="quality-col-left">
          <span class="quality-format">${escapeHtml(formatType)}</span>
        </div>
        <div class="quality-col-center">
          <span class="quality-label">${escapeHtml(format.quality)}</span>
          <span class="size-info">${escapeHtml(format.size)}</span>
        </div>
        <div class="quality-col-right">
          <button type="button"
                  class="btn-convert"
                  data-format-id="${escapeHtml(formatId)}"
                  data-video-id="${escapeHtml(format.videoId)}"
                  data-quality="${escapeHtml(format.quality)}"
                  data-format="${escapeHtml(format.format)}"
                  data-type="${category}"
                  aria-label="Download ${formatType} ${format.quality}">
            <span class="btn-text">Convert</span>
            ${renderDownloadIcon()}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render download icon (SVG)
 */
function renderDownloadIcon(): string {
  return `
    <svg class="btn-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 -960 960 960" fill="currentColor" aria-hidden="true" role="img">
      <path d="M480-320 280-520l56-58 104 104v-326h80v326l104-104 56 58-200 200ZM240-160q-33 0-56.5-23.5T160-240v-120h80v120h480v-120h80v120q0 33-23.5 56.5T720-160H240Z"/>
    </svg>
  `;
}

/**
 * Render error message
 */
function renderErrorMessage(message: string): string {
  return `
    <div class="content-message content-message--error">
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  if (typeof text !== 'string') return '';

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
