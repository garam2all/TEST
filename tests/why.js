const { chromium, open } = require('./lib');
(async()=>{const b=await chromium.launch();const {page}=await open(b);await page.waitForFunction(()=>window.GG_FINDER_RUN_TESTS);await page.waitForFunction(()=>{try{return window.GG_FINDER_RUN_TESTS().results.length>0}catch(e){return false}},null,{timeout:30000});
const [c,t]=process.argv.slice(2);console.log(JSON.stringify(await page.evaluate(([c,t])=>window.GG_FINDER_WHY(c,t),[c,t]),null,1));await b.close()})();
