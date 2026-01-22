const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return youtube-to-mp3-320kbps variants
 */
module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'youtube-to-mp3-320kbps');
};
