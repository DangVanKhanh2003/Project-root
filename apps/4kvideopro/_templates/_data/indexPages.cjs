/**
 * Filter: Returns only index page variants
 */
const allPages = require('./allPages.cjs');

module.exports = allPages.filter(page => page.pageKey === 'index');
