const allPages = require('./allPages.cjs');

module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === '9gag-downloader');
};
