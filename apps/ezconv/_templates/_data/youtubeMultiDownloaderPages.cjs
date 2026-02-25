const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return youtube-multi-downloader page variants
 */
module.exports = function () {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'youtube-multi-downloader');
};
