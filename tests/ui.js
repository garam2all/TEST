const { chromium, open } = require('./lib');
/* 1クエリ=新規ページ。回答・カード・遷移先URL・はみ出し・エラーを返す */
async function ask(browser, text, o = {}) {
  const { page, ctx, errors } = await open(browser, o);
  const navs = [];
  await ctx.route('**/view/search**', r => { navs.push(r.request().url()); r.abort(); });
  try {
    await page.waitForFunction(() => window.GG_FINDER_RUN_TESTS, null, { timeout: 15000 });
    await page.waitForFunction(() => { try { return window.GG_FINDER_RUN_TESTS().results.length > 0; } catch (e) { return false; } }, null, { timeout: 20000 });
    await page.fill('#q', text);
    await page.click('#send', { timeout: 5000 });
    await page.waitForTimeout(o.wait || 1800);
    const out = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('#talk .ln-row')];
      const me = rows.filter(r => r.classList.contains('me')).length;
      const bot = rows.filter(r => !r.classList.contains('me'));
      const last = bot[bot.length - 1];
      const de = document.documentElement;
      return {
        rows: rows.length, text: rows.map(r => r.innerText.replace(/\s+/g, ' ').trim()).join(' || ').slice(0, 800),
        cards: document.querySelectorAll('#talk .ln-grid a').length,
        links: [...document.querySelectorAll('#talk a[href]')].map(a => a.getAttribute('href')).slice(0, 12),
        overflowX: de.scrollWidth - de.clientWidth, injected: !!document.querySelector('#talk img[src="x"], #talk script'),
        sendDisabled: document.getElementById('send').disabled
      };
    });
    out.navs = navs; out.errors = errors; return out;
  } finally { await ctx.close(); }
}
module.exports = { ask };
if (require.main === module) (async () => {
  const b = await chromium.launch();
  for (const t of process.argv.slice(2)) { try { console.log('>>', t, '\n  ', JSON.stringify(await ask(b, t))); } catch (e) { console.log('>>', t, 'ERR', e.message.split('\n')[0]); } }
  await b.close();
})();
