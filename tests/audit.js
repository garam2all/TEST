const { chromium, open } = require('./lib');
(async () => {
  const b = await chromium.launch();
  const out = {};
  for (const [name, vp] of Object.entries({ s320: {width:320,height:568}, s360:{width:360,height:740}, s390:{width:390,height:844}, t768:{width:768,height:1024}, d1280:{width:1280,height:800}, land:{width:844,height:390} })) {
    const { page, errors } = await open(b, { viewport: vp });
    await page.waitForFunction(() => window.GG_FINDER_RUN_TESTS); await page.waitForTimeout(2500);
    out[name] = await page.evaluate(() => {
      const r = {};
      const de = document.documentElement; r.overflowX = de.scrollWidth - de.clientWidth;
      const ids = {}; document.querySelectorAll('[id]').forEach(e => ids[e.id] = (ids[e.id] || 0) + 1); r.dupIds = Object.entries(ids).filter(([k, v]) => v > 1).map(([k]) => k);
      r.imgNoAlt = [...document.querySelectorAll('img')].filter(i => !i.hasAttribute('alt')).length;
      r.btnNoName = [...document.querySelectorAll('button,a,input,select')].filter(e => { const s = getComputedStyle(e); if (s.display === 'none' || e.closest('[aria-hidden=true]')) return false; return !(e.innerText || e.getAttribute('aria-label') || e.getAttribute('title') || e.getAttribute('alt') || e.value || (e.querySelector('img[alt]')||{}).alt || '').trim(); }).map(e => e.outerHTML.slice(0, 90));
      r.small = [...document.querySelectorAll('button,a,input')].filter(e => { const b = e.getBoundingClientRect(); const s = getComputedStyle(e); return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && !e.closest('[aria-hidden=true]') && (b.height < 32 || b.width < 32) && e.closest('main,.gg-line'); }).map(e => { const b = e.getBoundingClientRect(); return e.tagName + '.' + e.className + ' ' + Math.round(b.width) + 'x' + Math.round(b.height) + ' ' + (e.innerText||'').slice(0,12); }).slice(0, 10);
      const wide = [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); return b.right > innerWidth + 1 && b.width > 0 && getComputedStyle(e).position !== 'fixed' && !e.closest('[aria-hidden=true]'); }).map(e => e.tagName + '.' + e.className).slice(0, 8); r.wide = wide;
      r.hasLangMain = !!document.querySelector('main'); r.h1 = document.querySelectorAll('h1').length;
      r.jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map(s => { try { JSON.parse(s.textContent); return 'ok'; } catch (e) { return 'BAD ' + e.message; } });
      r.title = document.title; r.titleLen = document.title.length;
      r.metaDesc = (document.querySelector('meta[name=description]') || {}).content;
      r.sendLabel = document.getElementById('send').getAttribute('aria-label');
      r.inputLabel = document.getElementById('q').getAttribute('aria-label');
      r.talkRole = document.getElementById('talk').getAttribute('role') + '/' + document.getElementById('talk').getAttribute('aria-live');
      return r;
    });
    out[name].errors = errors;
  }
  console.log(JSON.stringify(out, null, 1));
  await b.close();
})();
