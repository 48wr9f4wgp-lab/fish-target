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
assert.equal(await page.locator('script[data-extension="tackle-set-rules-v31-js"]').count(),1,'tackle set rules load once');
assert.equal(await page.locator('script[data-extension="tackle-set-resolver-v31-js"]').count(),1,'tackle set resolver loads once');
assert.equal(await page.locator('script[data-extension="tackle-auto-build-v29-js"]').count(),1,'AUTO BUILD JS loads once');
assert.equal(await page.locator('link[data-extension="tackle-auto-build-v29-css"]').count(),1,'AUTO BUILD CSS loads once');
assert.deepEqual(await page.evaluate(()=>({status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,count:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount})),{status:'idle',count:0},'Catalog stays cold at startup');

await page.locator('#grid .fish').first().waitFor({state:'visible'});
await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.locator('#tackleAutoBuildV29').waitFor({state:'visible'});
assert.equal((await page.locator('#autoBuildRunV29').textContent())?.trim(),'AUTO BUILD');
assert.equal(await page.locator('#autoBuildResultV29').isVisible(),false,'AUTO BUILD result starts collapsed');

const ownedBefore=await page.evaluate(()=>{
  const plan=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.currentPlan();
  const ideal=globalThis.FISH_TARGET_TACKLE_SET_RESOLVER.buildIdealSet(plan);
  const powerList=globalThis.FISH_TARGET_TACKLE_SET_RULES.POWER;
  const powerRange=ideal.rod.power_range;
  const power=powerRange?powerList[Math.round((powerRange.min+powerRange.max)/2)]:'MH';
  const length=ideal.rod.length_ft?(ideal.rod.length_ft.min+ideal.rod.length_ft.max)/2:9.6;
  const maxLure=ideal.rod.lure_weight_g?.max||100;
  const sizeRange=ideal.reel.size_range;
  const size=sizeRange?Math.round((sizeRange.min+sizeRange.max)/2):4000;
  const lineOptions=globalThis.FISH_TARGET_TACKLE_LOGIC.lineOptions(plan.requirements?.line||'');
  const line=lineOptions.find(option=>option.unit==='号')||lineOptions[0]||null;
  const lineNo=line?.range?(line.range.min+line.range.max)/2:null;
  const db={
    rods:[{id:'qa-owned-rod',source:'manual',name:'QA OWNED ROD',length,power,maxLure}],
    reels:[{id:'qa-owned-reel',source:'manual',name:'QA OWNED REEL',size,lineType:line?.type||'',lineNo}]
  };
  const raw=JSON.stringify(db);localStorage.setItem('fish_target_v17_tackle',raw);return raw;
});

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
assert.ok(runtime.state.rods.length>0,'rod product candidates exist');
assert.ok(runtime.state.reels.length>0,'reel product candidates exist');
assert.ok(runtime.state.setResult?.myBestSet,'MY TACKLE best set exists');
assert.equal(runtime.state.setResult.myBestSet.rod.name,'QA OWNED ROD');
assert.equal(runtime.state.setResult.myBestSet.reel.name,'QA OWNED REEL');
assert.ok(['ideal','good','usable'].includes(runtime.state.setResult.compatibility),`unexpected owned compatibility ${runtime.state.setResult.compatibility}`);

assert.deepEqual(await page.locator('.autoBuildSetSummaryV31 article>span').allTextContents(),['IDEAL SET','MY SET','MISSING']);
assert.match((await page.locator('[data-set-card="owned"]>small').textContent())||'',/QA OWNED ROD/);
assert.match((await page.locator('[data-set-card="owned"]>small').textContent())||'',/QA OWNED REEL/);
assert.equal(await page.locator('#autoBuildDetailsV31').getAttribute('hidden'),null,'product detail is available when Catalog is enabled');
await page.locator('#autoBuildDetailsV31 summary').click();
const labels=await page.locator('.autoBuildStageV29 .autoBuildStageTopV29>span').allTextContents();
assert.deepEqual(labels,['01 · ROD','02 · REEL','03 · LINE','04 · RIG']);
for(const kind of ['rod','reel','line','rig'])assert.ok((await page.locator(`.autoBuildStageV29[data-stage="${kind}"]>b`).textContent())?.trim(),`${kind} stage has content`);
assert.equal(await page.locator('.autoBuildReadyV29').isVisible(),true,'set decision bar is visible');
assert.equal(await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle')),ownedBefore,'AUTO BUILD reads but does not mutate MY TACKLE ownership');

const altPossible=await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.getState().rods.length>1);
if(altPossible){const before=(await page.locator('.autoBuildStageV29[data-stage="rod"]>b').textContent())?.trim();await page.locator('[data-alt="rod"]').click();const after=(await page.locator('.autoBuildStageV29[data-stage="rod"]>b').textContent())?.trim();assert.notEqual(after,before,'rod alternative changes product candidate')}

assert.equal(await page.locator('#resultDockV20 button:visible').count(),2,'existing two-button result dock is preserved');
assert.equal(await page.locator('#result #quickPackV28').count(),0,'packing checklist stays outside result flow');
assert.equal(await page.locator('#appPackTabV30').count(),1,'standalone packing entry remains available from app shell');
const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
assert.ok(overflow.doc<=391&&overflow.body<=391&&overflow.viewport===390,`390px overflow: ${JSON.stringify(overflow)}`);
assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.version),'TACKLE-AUTO-BUILD-V31');
assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_SET_RESOLVER?.version),'TACKLE-SET-RESOLVER-V31');
assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);

await browser.close();
console.log('TACKLE_AUTO_BUILD_V31_BROWSER_QA_PASS',JSON.stringify({elapsedMs:terminal.elapsedMs,compatibility:runtime.state.setResult.compatibility,gaps:runtime.state.setResult.gaps.length}));