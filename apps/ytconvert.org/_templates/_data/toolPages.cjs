const allPages = require('./allPages.cjs');

module.exports = function() {
  const pages = allPages();
  return pages.filter(p => p.pageKey !== 'index' && p.pageKey !== 'youtube-playlist-to-mp3');
};
