import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];const consoleErrors=[];
page.on('pageerror',error=>errors.push(String(error)));
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});

await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
assert.equal(await page.locator('script[data-extension="tackle-auto-build-v29-js"]').count(),1,'AUTO BUILD JS loads once');
assert.equal(await page.locator('link[data-extension="tackle-auto-build-v29-css"]').count(),1,'AUTO BUILD CSS loads once');
assert.deepEqual(await page.evaluate(()=>({status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,count:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount})),{status:'idle',count:0},'Catalog stays cold at startup');

await page.locator('#grid .fish').first().waitFor({state:'visible'});
await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.locator('#tackleAutoBuildV29').waitFor({state:'visible'});
assert.equal((await page.locator('#autoBuildRunV29').textContent())?.trim(),'AUTO BUILD');
assert.equal(await page.locator('#autoBuildResultV29').isVisible(),false,'AUTO BUILD result starts collapsed');
const ownedBefore=await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle'));

const started=Date.now();
await page.locator('#autoBuildRunV29').click();
await page.waitForFunction(()=>['ready','error'].includes(globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status),null,{timeout:30000});
const terminal=await page.evaluate(()=>({
  elapsedMs:0,
  auto:globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.(),
  catalog:{...globalThis.FISH_TARGET_CATALOG_LOADER?.state},
  statusText:document.getElementById('autoBuildStatusV29')?.textContent||''
}));
terminal.elapsedMs=Date.now()-started;
assert.equal(terminal.auto?.status,'ready',`AUTO BUILD failed to reach ready: ${JSON.stringify(terminal)}`);
await page.locator('#autoBuildResultV29').waitFor({state:'visible'});
const runtime=await page.evaluate(()=>({products:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount,batches:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.batchCount,state:globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.()}));
assert.equal(runtime.products,985,'AUTO BUILD hydrates the current 985-product Catalog');
assert.equal(runtime.batches,46,'AUTO BUILD uses all current Catalog batches');
assert.ok(runtime.state.rods.length>0,'rod candidates exist');
assert.ok(runtime.state.reels.length>0,'reel candidates exist');
assert.ok(Number(runtime.state.rods[0]?.fit?.level)<=1,'top rod candidate is usable');
assert.ok(Number(runtime.state.reels[0]?.fit?.level)<=1,'top reel candidate is usable');

const labels=await page.locator('.autoBuildStageV29 .autoBuildStageTopV29>span').allTextContents();
assert.deepEqual(labels,['01 · ROD','02 · REEL','03 · LINE','04 · RIG']);
for(const kind of ['rod','reel','line','rig'])assert.ok((await page.locator(`.autoBuildStageV29[data-stage="${kind}"]>b`).textContent())?.trim(),`${kind} stage has content`);
assert.equal(await page.locator('.autoBuildReadyV29').isVisible(),true,'SET READY is visible');
assert.equal(await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle')),ownedBefore,'AUTO BUILD does not write MY TACKLE ownership');

const altPossible=await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.getState().rods.length>1);
if(altPossible){const before=(await page.locator('.autoBuildStageV29[data-stage="rod"]>b').textContent())?.trim();await page.locator('[data-alt="rod"]').click();const after=(await page.locator('.autoBuildStageV29[data-stage="rod"]>b').textContent())?.trim();assert.notEqual(after,before,'rod alternative changes candidate')}

assert.equal(await page.locator('#resultDockV20 button:visible').count(),2,'existing two-button result dock is preserved');
assert.equal(await page.locator('#quickPackV28').isVisible(),true,'quick pack remains visible');
const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
assert.ok(overflow.doc<=391&&overflow.body<=391&&overflow.viewport===390,`390px overflow: ${JSON.stringify(overflow)}`);
assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.version),'TACKLE-AUTO-BUILD-V29');
assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);

await browser.close();
console.log('TACKLE_AUTO_BUILD_V29_BROWSER_QA_PASS',JSON.stringify({elapsedMs:terminal.elapsedMs}));