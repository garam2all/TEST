/* UI経由の大量点検（並列）。使い方: node uisweep.js <round> [file] */
const { chromium, open } = require('./lib');
const fs = require('fs');
const round = +process.argv[2] || 1, file = process.argv[3];
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rng(round * 104729 + 7); const pick = a => a[Math.floor(R() * a.length)];
const idx = JSON.parse(fs.readFileSync(__dirname + '/../data/finder_index.js', 'utf8').match(/window\.GG_INDEX=(\[.*\]);?\s*$/m)[1]);
const NOUN = ["スカート","トップス","パンツ","ピアス","ネックレス","チョーカー","バングル","アンクレット","ベール","ヒップスカーフ","コスチューム","つけまつげ","ビンディー","チョリ","ブラ","レギンス","ベルト","イヤリング","髪飾り","ヘッドドレス","ガラベーヤ","タッセル","シューズ","衣装","アクセサリー"];
const COL = ["赤","青","黒","白","緑","黄色","ピンク","紫","金","銀","オレンジ","水色","ネイビー","茶色","グレー","ベージュ","ゴールド","派手な","シンプルな","柄物"];
const MAT = ["サテン","シフォン","コットン","シルク","レース","ベロア","ビーズ","スパンコール","ストレッチ","フリンジ","コイン","羽根"];
const PR = ["3000円以下","5000円以内","1万円以下","2000円から5000円","予算8000円","10000円以上","1000円台","三千円以下","〜3000円","3,000円まで","5千円くらい"];
const SORT = ["安い","一番安い","高い","人気","新着","新商品","再入荷","セール","アウトレット"];
const TAIL = ["","","を探しています","ください","がほしい","ありますか","おすすめ","教えて","見たい！","。","？"];
const WEIRD = ["😀😀😀","!!!???","        ","<script>alert(1)</script>","<img src=x onerror=alert(1)>","'; DROP TABLE x;--","%00%0a","a".repeat(300),"あ".repeat(200),"$&$1$`","__proto__","constructor","toString","[[[(((","(?:","*+?","{1,2}","ｱｲｳｴｵ","ＡＢＣ１２３","ﾋﾟｱｽ","hello","help","ヘルプ","営業時間","送料","返品","配送","電話番号","店舗","住所","どこにありますか","ポイント","ログイン","会員登録","注文履歴","キャンセル","支払い方法","銀行振込","代引き","予約","サイズ","在庫","入荷","お問い合わせ","LINE","こんにちは","ありがとう","さようなら","初心者","発表会","プレゼント","結婚式","子供","男性","大きいサイズ","xl","3L","S","M","L","1","0","9999999999","-1","3.14","1e10","0x10","Infinity","NaN","null","undefined","true"];
const qs = [];
while (qs.length < 1000) {
  const k = R();
  if (k < .25) qs.push(pick(COL) + (R()<.5?"の":"い") + pick(NOUN) + pick(TAIL));
  else if (k < .40) qs.push(pick(PR) + "の" + pick(NOUN));
  else if (k < .50) qs.push(pick(MAT) + "の" + pick(NOUN) + pick(TAIL));
  else if (k < .58) qs.push(pick(SORT) + pick(NOUN));
  else if (k < .72) qs.push(pick(WEIRD));
  else if (k < .85) { const e = pick(idx); qs.push(e.n.replace(/[【】★☆]/g, " ").trim().slice(0, 4 + Math.floor(R() * 14))); }
  else if (k < .93) qs.push(pick(PR) + "で" + pick(COL) + "の" + pick(MAT) + pick(NOUN));
  else qs.push(String(pick(idx).c).padStart(R()<.5?3:0, "0") + (R()<.3?"":""));
}
const W = 8;
(async () => {
  const b = await chromium.launch();
  const bad = [], t0 = Date.now(); let done = 0, pageErrs = [];
  async function worker(w) {
    let h = await open(b, { qs: '?finder_test=1' });
    const fresh = async () => { if (h) await h.ctx.close(); h = await open(b, {}); await h.page.waitForFunction(() => window.GG_FINDER_RUN_TESTS); await h.page.waitForFunction(() => { try { return window.GG_FINDER_RUN_TESTS().results.length > 0; } catch (e) { return false; } }, null, { timeout: 30000 }); };
    await fresh();
    for (let i = w; i < qs.length; i += W) {
      const text = qs[i];
      if (i % (W * 25) === w) await fresh();
      const { page, errors } = h; const ne = errors.length;
      let o = { q: text, problems: [] };
      try {
        await page.evaluate(() => { document.getElementById('talk').dataset.n = document.querySelectorAll('#talk .ln-row').length; });
        await page.fill('#q', text); await page.press('#q', 'Enter');
        await page.waitForFunction(() => { const s = document.getElementById('send'); return !s.disabled; }, null, { timeout: 8000 });
        await page.waitForTimeout(60);
        const r = await page.evaluate(() => {
          const rows = [...document.querySelectorAll('#talk .ln-row')]; const n0 = +document.getElementById('talk').dataset.n;
          const newRows = rows.slice(n0); const txt = newRows.map(x => x.innerText).join('\n');
          const de = document.documentElement;
          return { added: newRows.length, txt: txt.slice(0, 2000), undef: /undefined|NaN|\[object|null円|NaN円/.test(txt),
            badHref: [...document.querySelectorAll('#talk a[href]')].filter(a => /\/view\/item\//.test(a.getAttribute('href')) && !/^\/view\/item\/\d{12}$/.test(a.getAttribute('href'))).length,
            emptyName: [...newRows.flatMap(x => [...x.querySelectorAll('.ln-grid a')])].filter(a => !a.innerText.trim()).length,
            overflow: de.scrollWidth - de.clientWidth, injected: !!document.querySelector('#talk img[src="x"], #talk script, #talk [onerror]') };
        });
        if (r.added < 2) o.problems.push('no_reply');
        if (r.undef) o.problems.push('undefined_in_text');
        if (r.badHref) o.problems.push('bad_item_href');
        if (r.emptyName) o.problems.push('empty_card_name');
        if (r.overflow > 0) o.problems.push('overflowX:' + r.overflow);
        if (r.injected) o.problems.push('html_injection');
        o.txt = r.txt.replace(/\s+/g, ' ').slice(0, 200);
      } catch (e) { o.problems.push('exception:' + e.message.split('\n')[0]); try { await fresh(); } catch (x) {} }
      if (h.errors.length > ne) o.problems.push('pageerror:' + h.errors.slice(ne).join(' / ').slice(0, 200));
      if (o.problems.length) bad.push(o);
      done++;
    }
    await h.ctx.close();
  }
  await Promise.all(Array.from({ length: W }, (_, w) => worker(w)));
  const by = {}; for (const o of bad) for (const p of o.problems) { const k = p.split(':')[0]; (by[k] = by[k] || []).push(JSON.stringify(o.q) + ' → ' + p + ' | ' + (o.txt || '')); }
  console.log(`UI round ${round}: ${done} checks in ${Math.round((Date.now()-t0)/1000)}s, ${bad.length} with problems`);
  for (const [k, v] of Object.entries(by)) console.log(`  [${v.length}] ${k}\n     ` + v.slice(0, 4).join('\n     '));
  fs.writeFileSync(`/tmp/claude-0/ui-${round}.json`, JSON.stringify({ bad }, null, 1));
  await b.close();
})();
