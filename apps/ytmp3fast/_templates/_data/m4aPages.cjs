const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return youtube-to-m4a variants
 */
module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'youtube-to-m4a');
};
