const { chromium, open } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const { page, errors } = await open(b);
  await page.waitForFunction(() => window.GG_FINDER_PARSE && window.GG_FINDER_RUN_TESTS, null, { timeout: 20000 }).catch(e => console.log('wait fail', e.message));
  await page.waitForTimeout(3000);
  const r = await page.evaluate(() => { try { const t = window.GG_FINDER_RUN_TESTS(); return { ok: t.ok, fails: (t.results||[]).filter(x=>!x.pass), n: (t.results||[]).length, reason: t.reason }; } catch (e) { return { err: String(e) }; } });
  console.log(JSON.stringify(r, null, 1)); console.log('errors', errors);
  await b.close();
})();
