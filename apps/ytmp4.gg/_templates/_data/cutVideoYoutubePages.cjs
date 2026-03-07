const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return cut-video-youtube page variants
 */
module.exports = function () {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'cut-video-youtube');
};
