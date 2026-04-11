const allPages = require('./allPages.cjs');

/**
 * Filter allPages to only return index page variants
 */
module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'index');
};
