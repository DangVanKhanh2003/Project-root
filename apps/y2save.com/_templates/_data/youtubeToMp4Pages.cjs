const allPages = require('./allPages.cjs');

module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey === 'youtube-to-mp4');
};
