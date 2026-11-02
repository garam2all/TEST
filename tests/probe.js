const { chromium, open } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const { page, errors } = await open(b);
  await page.waitForFunction(() => window.GG_FINDER_RUN_TESTS, null, { timeout: 20000 });
  await page.waitForTimeout(3000);
  const qs = process.argv.slice(2);
  for (const t of qs) {
    const r = await page.evaluate((t) => { const q = window.GG_FINDER_PARSE(t); const r = window.GG_FINDER_SEARCH(q); return { q: JSON.parse(JSON.stringify(q, (k,v)=> typeof v==='function'?undefined:v)), mode: r.mode, n: (r.list||[]).length, top: (r.list||[]).slice(0,4).map(e=>e.c+':'+e.n+':'+e.p), opts: r.opts }; }, t);
    console.log('==', t, '\n', JSON.stringify(r).slice(0, 1400));
  }
  console.log('errors', errors);
  await b.close();
})();
