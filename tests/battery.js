/* 1ラウンド=1000件の自動点検。使い方: node battery.js <round> [file] */
const { chromium, open } = require('./lib');
const fs = require('fs');
const round = +process.argv[2] || 1;
const file = process.argv[3];
// 決定的な乱数（ラウンドごとに別の1000件を作る）
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
const R = rng(round * 7919 + 13);
const pick = a => a[Math.floor(R() * a.length)];

const CATS = [["スカート","SK"],["トップス","TO"],["パンツ","PA"],["ピアス","PI"],["ネックレス","CH"],["チョーカー","CH"],["バングル","BA"],["アンクレット",null],["ベール","VE"],["ヘッドアクセサリー","HA"],["ヒップスカーフ","HI"],["コスチューム","CO"],["つけまつげ","EY"],["ビンディー","BI"],["チョリ","TO"],["ブラ",null],["レギンス",null],["ベルト","HI"],["イヤリング","PI"],["髪飾り","HA"]];
const COLORS = [["赤","レッド"],["青","ブルー"],["黒",null],["白",null],["緑","グリーン"],["黄色","イエロー"],["ピンク","ピンク"],["紫","パープル"],["金","ゴールド"],["銀","シルバー"],["オレンジ","オレンジ"],["水色","ブルー"],["ネイビー","ブルー"]];
const MATS = ["サテン","シフォン","コットン","シルク","レース","ベロア","ビーズ","スパンコール","ストレッチ","ベルベット"];
const PRICES = [["3000円以下",null,3000],["5000円以内",null,5000],["1万円以下",null,10000],["2000円から5000円",2000,5000],["予算8000円",null,8000],["10000円以上",10000,null],["1000円台",null,null],["三千円以下",null,3000]];
const SORTS = [["安い","price_asc"],["一番安い","price_asc"],["高い","price_desc"],["人気","pop"],["新着","new"]];
const POST = ["","を探しています","ください","がほしい","ありますか","おすすめ","教えて","見たい","を探して！","。","？","でお願いします"];
const PRE = ["","","","ベリーダンス ","ダンス用の ","発表会用 ","初心者向け ","かわいい ","おしゃれな "];
const NOISE = ["ざざざざざ","qwertyuiop","あいうえおかきくけこ","xyzxyzxyz","ぬぬぬぬぬぬ","😀😀😀","!!!???","        ","<script>alert(1)</script>","<img src=x onerror=alert(1)>","'; DROP TABLE x;--","%00%0a","a".repeat(300),"あ".repeat(200),"\\\\\\\\","$&$1$`","__proto__","constructor","toString","[[[(((","(?:","*+?","{1,2}","​​","\u0000","ｱｲｳｴｵ","ＡＢＣ１２３","ﾋﾟｱｽ"];
const toKata = s => s.replace(/[ぁ-ゖ]/g, c => String.fromCharCode(c.charCodeAt(0) + 96));
const toFull = s => s.replace(/[0-9A-Za-z]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0));

const cases = [];
while (cases.length < 1000) {
  const k = R();
  if (k < 0.30) { // カテゴリ×色
    const [cn, cc] = pick(CATS), [co, ck] = pick(COLORS);
    cases.push({ t: pick(PRE) + co + (["赤","青","黒","白","黄色"].includes(co) && R() < .5 ? "い" : "の") + cn + pick(POST), kind: "catcolor", cat: cc, colorKw: ck, catWord: cn });
  } else if (k < 0.45) { // カテゴリ×価格
    const [cn, cc] = pick(CATS), [ps, lo, hi] = pick(PRICES);
    cases.push({ t: ps + "の" + cn + pick(POST), kind: "catprice", cat: cc, lo, hi });
  } else if (k < 0.55) { // 素材×カテゴリ
    const [cn, cc] = pick(CATS); const m = pick(MATS);
    cases.push({ t: m + "の" + cn + pick(POST), kind: "mat", cat: cc, mat: m });
  } else if (k < 0.63) { // 並び替え
    const [cn, cc] = pick(CATS), [sw, sk] = pick(SORTS);
    cases.push({ t: sw + cn, kind: "sort", cat: cc, sort: sk });
  } else if (k < 0.72) { // 表記ゆれ（同値性）
    const [cn, cc] = pick(CATS), [co, ck] = pick(COLORS);
    const base = co + (["赤","青","黒","白","黄色"].includes(co) ? "い" : "の") + cn; const v = pick([toKata(base), base.split("").join(" "), toFull(base), base + " ", "　" + base, base.toUpperCase()]);
    cases.push({ t: v, kind: "equiv", base, cat: cc, colorKw: ck });
  } else if (k < 0.80) { // ノイズ
    cases.push({ t: pick(NOISE), kind: "noise" });
  } else if (k < 0.90) { // 色×カテゴリ×価格×素材 複合
    const [cn, cc] = pick(CATS), [co, ck] = pick(COLORS), [ps, lo, hi] = pick(PRICES), m = pick(MATS);
    cases.push({ t: ps + "で" + co + "の" + m + "の" + cn, kind: "combo", cat: cc, colorKw: ck, lo, hi, mat: m });
  } else { // 否定・または・と
    const [cn, cc] = pick(CATS), [c1, k1] = pick(COLORS), [c2, k2] = pick(COLORS);
    const form = pick([`${c1}以外の${cn}`, `${c1}じゃない${cn}`, `${c1}か${c2}の${cn}`, `${c1}と${c2}の${cn}`, `${c1}や${c2}の${cn}`]);
    cases.push({ t: form, kind: "logic", cat: cc, c1, c2, k1, k2, form });
  }
}

(async () => {
  const b = await chromium.launch();
  const { page, errors } = await open(b, { file });
  await page.waitForFunction(() => window.GG_FINDER_RUN_TESTS, null, { timeout: 20000 });
  await page.waitForFunction(() => { try { return !!window.GG_FINDER_RUN_TESTS().results; } catch (e) { return false; } }, null, { timeout: 30000 });
  const res = await page.evaluate((cases) => {
    const out = [];
    for (const c of cases) {
      const o = { t: c.t, kind: c.kind, problems: [] };
      const t0 = performance.now();
      try {
        const q = window.GG_FINDER_PARSE(c.t); const r = window.GG_FINDER_SEARCH(q); const list = r.list || [];
        const ms = performance.now() - t0; o.ms = ms; o.n = list.length;
        if (ms > 400) o.problems.push("slow:" + Math.round(ms) + "ms");
        const codes = list.map(e => e.c); if (new Set(codes).size !== codes.length) o.problems.push("duplicate_results");
        const qc = (q.cats || []).map(x => x.code), qk = (q.colors || []).map(x => x.kw);
        if (c.kind === "catcolor") {
          if (c.cat && !qc.includes(c.cat)) o.problems.push("cat_not_parsed:" + c.cat + " got " + qc);
          if (c.colorKw && !qk.includes(c.colorKw)) o.problems.push("color_not_parsed:" + c.colorKw + " got " + qk);
        }
        if (c.kind === "catprice" || c.kind === "combo") {
          const lo = q.price && q.price.low ? +q.price.low : null, hi = q.price && q.price.high ? +q.price.high : null;
          if (c.hi && hi !== c.hi) o.problems.push("price_hi:" + c.hi + " got " + hi);
          if (c.lo && lo !== c.lo) o.problems.push("price_lo:" + c.lo + " got " + lo);
          if (c.cat && !qc.includes(c.cat)) o.problems.push("cat_not_parsed:" + c.cat + " got " + qc);
          const bad = list.filter(e => (hi && e.p > hi) || (lo && e.p < lo)); if (bad.length) o.problems.push("price_violation:" + bad.length + "/" + list.length);
        }
        if (c.kind === "sort" && q.sort !== c.sort && c.sort.startsWith("price")) o.problems.push("sort:" + c.sort + " got " + q.sort);
        if (c.kind === "sort" && q.sort === "price_asc") { for (let i = 1; i < Math.min(list.length, 30); i++) if (list[i].p < list[i-1].p) { o.problems.push("not_sorted_asc"); break; } }
        if (c.kind === "sort" && q.sort === "price_desc") { for (let i = 1; i < Math.min(list.length, 30); i++) if (list[i].p > list[i-1].p) { o.problems.push("not_sorted_desc"); break; } }
        if (c.kind === "equiv") {
          const q2 = window.GG_FINDER_PARSE(c.base); const a = JSON.stringify([(q2.cats||[]).map(x=>x.code).sort(), (q2.colors||[]).map(x=>x.kw).sort()]);
          const bb = JSON.stringify([qc.slice().sort(), qk.slice().sort()]);
          if (a !== bb) o.problems.push("equiv_mismatch:" + a + " vs " + bb);
        }
        if (c.kind === "noise") {
          /* 条件が1つも読み取れない入力は画面側(UI)で別処理されるため、ここでは例外が出ないことだけを見る */
        }
        if (c.kind === "logic") {
          if (/以外|じゃない/.test(c.form)) { if (qk.includes(c.k1) && c.k1) o.problems.push("negation_positive_color"); }
          if (/か|や/.test(c.form) && !/以外|じゃない/.test(c.form) && c.k1 && c.k2 && c.k1 !== c.k2 && q.colorAnd) o.problems.push("or_parsed_as_and");
          if (/と/.test(c.form) && c.k1 && c.k2 && c.k1 !== c.k2 && !q.colorAnd && qk.length > 1) o.problems.push("and_parsed_as_or");
        }
        // 上位結果が条件に合っているか（品目/色）
        if ((c.kind === "catcolor") && list.length && window.GG_FINDER_WHY) {
          for (const e of list.slice(0, 3)) {
            const w = window.GG_FINDER_WHY(e.c, null);
            if (c.cat && w && w["店内のカテゴリー"] !== undefined && !(String(w["店内のカテゴリー"]).includes(c.cat) || String(w["推測した品目"]).includes(c.cat))) { o.problems.push("top_wrong_cat:" + e.c); break; }
            if (c.colorKw && w && !String(w["色"]).includes(c.colorKw)) { o.problems.push("top_wrong_color:" + e.c + "(" + w["色"] + ")"); break; }
          }
        }
      } catch (e) { o.problems.push("exception:" + e.message); }
      out.push(o);
    }
    return out;
  }, cases);
  const bad = res.filter(r => r.problems.length);
  const bykey = {};
  for (const r of bad) for (const p of r.problems) { const k = p.split(":")[0] + "|" + r.kind; (bykey[k] = bykey[k] || []).push(r.t + "  → " + p); }
  console.log(`round ${round}: ${res.length} checks, ${bad.length} with problems, pageErrors=${errors.length}`);
  for (const [k, v] of Object.entries(bykey).sort((a, b) => b[1].length - a[1].length)) console.log(`  [${v.length}] ${k}\n      e.g. ${v.slice(0, 3).join("\n           ")}`);
  fs.writeFileSync(`/tmp/claude-0/battery-${round}.json`, JSON.stringify({ bad, errors }, null, 1));
  if (errors.length) console.log(errors.slice(0, 5));
  await b.close();
})();
