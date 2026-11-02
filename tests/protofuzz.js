const { chromium, open } = require('./lib');
const NAMES = ["constructor","toString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","toLocaleString","__proto__","__defineGetter__","__defineSetter__","__lookupGetter__","__lookupSetter__","prototype","length","name","call","apply","bind","then","toJSON","hasOwn","CONSTRUCTOR","Constructor"];
const FORMS = n => [n, "赤い " + n, n + " スカート", "スカート " + n, "5000円以下の" + n, n + "以外", n + "のピアス", "ピンクの" + n + "と黒", n.toUpperCase(), "｜" + n, n + "円"];
(async () => {
  const b = await chromium.launch(); let { page, errors } = await open(b);
  const ready = async () => { await page.waitForFunction(() => window.GG_FINDER_RUN_TESTS); await page.waitForFunction(() => { try { return window.GG_FINDER_RUN_TESTS().results.length > 0; } catch (e) { return false; } }, null, { timeout: 30000 }); };
  await ready(); const bad = []; let n = 0;
  for (const nm of NAMES) for (const q of FORMS(nm)) {
    n++;
    // エンジン層
    const r = await page.evaluate((q) => { try { const x = window.GG_FINDER_PARSE(q); const r = window.GG_FINDER_SEARCH(x); window.GG_FINDER_LINKS(x, r.opts || {}); return 'ok'; } catch (e) { return 'EXC ' + e.message; } }, q);
    if (r !== 'ok') bad.push(['engine', q, r]);
  }
  // UI層（新規ページで1件ずつ）
  for (const nm of NAMES) for (const q of FORMS(nm).slice(0, 4)) {
    n++; const h = await open(b, {}); const pg = h.page;
    try {
      await pg.waitForFunction(() => window.GG_FINDER_RUN_TESTS); await pg.waitForFunction(() => { try { return window.GG_FINDER_RUN_TESTS().results.length > 0; } catch (e) { return false; } }, null, { timeout: 30000 });
      await pg.fill('#q', q); await pg.press('#q', 'Enter'); await pg.waitForTimeout(900);
      const st = await pg.evaluate(() => ({ dis: document.getElementById('send').disabled, rows: document.querySelectorAll('#talk .ln-row').length }));
      if (h.errors.length || st.dis) bad.push(['ui', q, JSON.stringify(st) + ' ' + h.errors.join('|')]);
    } catch (e) { bad.push(['ui', q, e.message.split('\n')[0]]); }
    await h.ctx.close();
  }
  console.log('proto fuzz checks', n, 'bad', bad.length); bad.slice(0, 20).forEach(x => console.log(' ', x.join(' | ')));
  await b.close();
})();
