const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
async function open(browser, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || { width: 390, height: 800 }, locale: 'ja-JP', userAgent: opts.ua });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errors.push('console: ' + m.text()); });
  await page.route('**/*', route => {
    const u = route.request().url();
    if (u.endsWith('/finder_index.js') || u.includes('finder_index.js')) return route.fulfill({ status: 200, contentType: 'application/javascript; charset=utf-8', body: fs.readFileSync(path.join(ROOT, 'data/finder_index.js')) });
    if (u.startsWith('file:') || u.startsWith('about:') || u.startsWith('data:')) return route.continue();
    if (u.includes('finder_patch') || u.includes('finder_stock')) return route.fulfill({ status: 404, body: '' });
    return route.abort();
  });
  const file = opts.file || path.join(ROOT, 'src/finder.html');
  await page.goto('file://' + file + (opts.qs ?? '?finder_test=1'), { waitUntil: 'domcontentloaded' });
  return { ctx, page, errors };
}
module.exports = { chromium, open, ROOT };
