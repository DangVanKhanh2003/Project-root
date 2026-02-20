const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return download-mp3-youtube-playlist page variants
 */
module.exports = function () {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'download-mp3-youtube-playlist');
};
