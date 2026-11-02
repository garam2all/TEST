/* 全商品を正解データにした再現率テスト：商品名/部分名/コードで検索して自分自身が上位に出るか */
const { chromium, open } = require('./lib');
const fs = require('fs');
(async () => {
  const b = await chromium.launch();
  const { page, errors } = await open(b, { file: process.argv[2] });
  await page.waitForFunction(() => window.GG_FINDER_RUN_TESTS); 
  await page.waitForFunction(() => { try { return window.GG_FINDER_RUN_TESTS().results.length > 0; } catch (e) { return false; } }, null, { timeout: 30000 });
  const idx = JSON.parse(fs.readFileSync(__dirname + '/../data/finder_index.js', 'utf8').match(/window\.GG_INDEX=(\[.*\]);?\s*$/m)[1]);
  console.log('products', idx.length);
  const res = await page.evaluate((idx) => {
    const strip = n => n.replace(/[【\[（(].*?[】\]）)]/g, '').replace(/[★☆※〇◎]/g, '').replace(/\s+/g, ' ').trim();
    const out = { fullName: [], head: [], tail: [] };
    for (const e of idx) {
      const full = strip(e.n); if (full.length < 3) continue;
      const tests = { fullName: full, head: full.slice(0, Math.max(4, Math.ceil(full.length / 2))), tail: full.slice(-Math.max(4, Math.ceil(full.length / 2))) };
      for (const [k, q] of Object.entries(tests)) {
        let rank = -1, n = 0, err = null;
        try { const r = window.GG_FINDER_SEARCH(window.GG_FINDER_PARSE(q)); n = r.list.length; rank = r.list.findIndex(x => x.c === e.c); } catch (x) { err = x.message; }
        out[k].push({ c: e.c, name: e.n, q, rank, n, err, z: !!e.z });
      }
    }
    return out;
  }, idx);
  let tot = 0;
  for (const [k, arr] of Object.entries(res)) {
    const miss = arr.filter(r => r.rank < 0 && !r.z), low = arr.filter(r => r.rank >= 10), err = arr.filter(r => r.err);
    tot += arr.length;
    console.log(`${k}: ${arr.length} checks | not found ${miss.length} | rank>=10 ${low.length} | errors ${err.length}`);
    for (const r of miss.slice(0, 6)) console.log('    MISS', r.c, JSON.stringify(r.q), 'n=' + r.n);
  }
  console.log('total checks', tot, 'pageErrors', errors.length);
  fs.writeFileSync('/tmp/claude-0/recall.json', JSON.stringify(res));
  await b.close();
})();
