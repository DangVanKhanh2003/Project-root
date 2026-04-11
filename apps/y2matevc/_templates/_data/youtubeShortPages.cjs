const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return youtube-short-downloader variants
 */
module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'youtube-short-downloader');
};
