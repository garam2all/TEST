const { chromium, open } = require('./lib');
(async()=>{const b=await chromium.launch();const {page,errors}=await open(b);
await page.waitForFunction(()=>window.GG_FINDER_RUN_TESTS);await page.waitForFunction(()=>{try{return window.GG_FINDER_RUN_TESTS().results.length>0}catch(e){return false}},null,{timeout:30000});
page.on('request',r=>{ if(r.url().includes('garam2')) console.log('REQ',r.url().slice(0,120))});
page.on('requestfailed',r=>console.log('FAIL',r.url().slice(0,100)));
await page.fill('#q',process.argv[2]);await page.press('#q','Enter');
for(let i=0;i<8;i++){await page.waitForTimeout(1000);console.log(i,await page.evaluate(()=>({dis:document.getElementById('send').disabled,rows:document.querySelectorAll('#talk .ln-row').length,last:document.querySelector('#talk').lastElementChild.innerText.slice(0,80)})))}
console.log(errors);await b.close()})();
