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
await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status==='ready',null,{timeout:10000});
assert.equal(await page.locator('#autoBuildResultV29').isVisible(),true,'local set decision appears automatically');
assert.equal(await page.locator('#autoBuildStatusV29').isVisible(),false,'automatic local decision adds no explanatory clutter');
assert.equal((await page.locator('#autoBuildRunV29').textContent())?.trim(),'商品候補');
assert.deepEqual(await page.evaluate(()=>({status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,count:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount})),{status:'idle',count:0},'automatic local decision never hydrates Catalog');
assert.equal((await page.locator('[data-set-card="owned"]>b').textContent())?.trim(),'MY TACKLE未登録');

const order=await page.evaluate(()=>{
  const body=document.querySelector('#result .body');
  const children=[...body.children];
  const index=selector=>children.indexOf(body.querySelector(selector));
  return {plan:index('.planCard'),answer:index('.ux23AnswerTitle'),first:index('.firstCast'),auto:index('#tackleAutoBuildV29')};
});
assert.ok(order.plan>=0&&order.answer>order.plan&&order.first>order.answer&&order.auto>order.first,`result order must be method → FIRST CAST → MY SET: ${JSON.stringify(order)}`);
assert.equal((await page.locator('#result .planCard .recommend').textContent())?.trim(),'STEP 1 · 釣り方');
assert.match((await page.locator('#result .ux23AnswerTitle').innerText())||'',/STEP 2 · 最初の1投/);
assert.match((await page.locator('.autoBuildHeadV29 strong').textContent())||'',/STEP 3 · 今回のセット/);
assert.deepEqual(await page.locator('#resultRailV26 button').allTextContents(),['釣り方','セット','現場']);

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
  const db={rods:[{id:'qa-owned-rod',source:'manual',name:'QA OWNED ROD',length,power,maxLure}],reels:[{id:'qa-owned-reel',source:'manual',name:'QA OWNED REEL',size,lineType:line?.type||'',lineNo}]};
  const raw=JSON.stringify(db);localStorage.setItem('fish_target_v17_tackle',raw);return raw;
});
await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.run({loadCatalog:false}));
await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status==='ready');
const local=await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.getState());
assert.ok(local.setResult?.myBestSet,'local decision picks MY TACKLE without Catalog');
assert.equal(local.setResult.myBestSet.rod.name,'QA OWNED ROD');
assert.equal(local.setResult.myBestSet.reel.name,'QA OWNED REEL');
assert.ok(['ideal','good','usable'].includes(local.setResult.compatibility),`unexpected owned compatibility ${local.setResult.compatibility}`);
assert.match((await page.locator('[data-set-card="owned"]>small').textContent())||'',/QA OWNED ROD/);
assert.match((await page.locator('[data-set-card="owned"]>small').textContent())||'',/QA OWNED REEL/);
assert.ok(['このセットで行ける','確認が必要'].includes((await page.locator('[data-set-card="owned"]>b').textContent())?.trim()),'consumer decision uses canonical ready/review wording');
assert.equal(await page.locator('#autoBuildDetailsV31').getAttribute('hidden'),null,'evidence disclosure is available without Catalog');
assert.equal(await page.locator('#autoBuildProductDetailV33').isVisible(),false,'product detail stays hidden until explicit request');

const started=Date.now();
await page.locator('#autoBuildRunV29').click();
await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status==='ready'&&globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready',null,{timeout:45000});
const runtime=await page.evaluate(()=>({products:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount,batches:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.batchCount,state:globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.()}));
assert.equal(runtime.products,985,'explicit product action hydrates the current 985-product Catalog');
assert.equal(runtime.batches,46,'explicit product action uses all current Catalog batches');
assert.ok(runtime.state.rods.length>0,'rod product candidates exist');
assert.ok(runtime.state.reels.length>0,'reel product candidates exist');
assert.equal(await page.locator('#autoBuildProductDetailV33').getAttribute('hidden'),null,'product detail becomes available after explicit request');
await page.locator('#autoBuildDetailsV31 summary').click();
assert.equal(await page.locator('#autoBuildProductDetailV33').isVisible(),true,'product detail becomes visible after opening evidence');
const labels=await page.locator('.autoBuildStageV29 .autoBuildStageTopV29>span').allTextContents();
assert.deepEqual(labels,['01 · ROD','02 · REEL','03 · LINE','04 · RIG']);
for(const kind of ['rod','reel','line','rig'])assert.ok((await page.locator(`.autoBuildStageV29[data-stage="${kind}"]>b`).textContent())?.trim(),`${kind} stage has content`);
assert.equal(await page.locator('.autoBuildReadyV29').isVisible(),true,'set decision bar is visible');
assert.ok(['このセットで現場へ','確認して現場へ'].includes((await page.locator('#autoBuildNextV32').textContent())?.trim()),'compatible set gets a direct field action');
assert.equal(await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle')),ownedBefore,'AUTO BUILD reads but does not mutate MY TACKLE ownership');

const altPossible=await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.getState().rods.length>1);
if(altPossible){const before=(await page.locator('.autoBuildStageV29[data-stage="rod"]>b').textContent())?.trim();await page.locator('[data-alt="rod"]').click();const after=(await page.locator('.autoBuildStageV29[data-stage="rod"]>b').textContent())?.trim();assert.notEqual(after,before,'rod alternative changes product candidate')}

const ergonomics=await page.evaluate(()=>{
  const style=selector=>getComputedStyle(document.querySelector(selector));
  const run=document.querySelector('#autoBuildRunV29').getBoundingClientRect();
  const next=document.querySelector('#autoBuildNextV32').getBoundingClientRect();
  return {runH:run.height,nextH:next.height,decision:style('[data-set-card="owned"]>b').fontSize,detail:style('.autoBuildStageV29>small').fontSize};
});
assert.ok(ergonomics.runH>=44&&ergonomics.nextH>=48,`touch targets: ${JSON.stringify(ergonomics)}`);
assert.ok(parseFloat(ergonomics.decision)>=17&&parseFloat(ergonomics.detail)>=12,`step 3 typography: ${JSON.stringify(ergonomics)}`);

const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
assert.ok(overflow.doc<=391&&overflow.body<=391&&overflow.viewport===390,`390px overflow: ${JSON.stringify(overflow)}`);
assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.version),'TACKLE-AUTO-BUILD-V33');
assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_SET_RESOLVER?.version),'TACKLE-SET-RESOLVER-V31');

await page.locator('#autoBuildNextV32').click();
await page.locator('#fieldmode.on').waitFor({state:'visible'});
assert.equal(await page.locator('#fieldmode.on').count(),1,'owned-set next action opens FIELD MODE');
assert.equal(await page.locator('#fmTackle').getAttribute('data-owned-set'),'','FIELD MODE marks an owned-set handoff');
assert.match((await page.locator('#fmTackle').innerText())||'',/QA OWNED ROD/);
assert.match((await page.locator('#fmTackle').innerText())||'',/QA OWNED REEL/);
assert.equal((await page.locator('.fmNext span').textContent())?.trim(),'反応がなければ');
assert.deepEqual(await page.locator('.fmTitle').allTextContents(),['今回のセット','現場の3手']);
const fieldErgonomics=await page.evaluate(()=>{const back=document.querySelector('.fieldBack').getBoundingClientRect(),step=getComputedStyle(document.querySelector('.fmStep span')),condition=getComputedStyle(document.querySelector('.fmCondition'));return {backW:back.width,backH:back.height,step:parseFloat(step.fontSize),condition:parseFloat(condition.fontSize)}});
assert.ok(fieldErgonomics.backW>=44&&fieldErgonomics.backH>=44&&fieldErgonomics.step>=15&&fieldErgonomics.condition>=12,`field ergonomics: ${JSON.stringify(fieldErgonomics)}`);
assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);

const raceContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const racePage=await raceContext.newPage();
let releaseManifest;const manifestGate=new Promise(resolve=>{releaseManifest=resolve});
await racePage.route('**/catalog-batch-manifest.json*',async route=>{await manifestGate;await route.continue()});
await racePage.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await racePage.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
await racePage.locator('#grid .fish').first().waitFor({state:'visible'});
await racePage.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await racePage.locator('#result.on').waitFor({state:'visible'});
await racePage.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState().status==='ready');
await racePage.locator('#autoBuildRunV29').click();
await racePage.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState().status==='loading');
await racePage.locator('#back').click();
await racePage.locator('#home.on').waitFor({state:'visible'});
await racePage.locator('button.fish[data-fish="シロギス"]').click();
await racePage.locator('#result.on').waitFor({state:'visible'});
await racePage.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState().status==='ready');
releaseManifest();
await racePage.waitForFunction(()=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready',null,{timeout:45000});
await racePage.waitForTimeout(100);
const race=await racePage.evaluate(()=>({state:globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.(),current:globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.currentPlan?.(),label:document.getElementById('autoBuildPlanV29')?.textContent||''}));
assert.equal(race.state?.status,'ready','new fish keeps its automatic local decision after late Catalog completion');
assert.equal(race.state?.plan?.species_name,'シロギス','late Catalog completion must not restore the previous fish plan');
assert.equal(race.state?.catalogReady,false,'late previous Catalog result must not attach candidates to the new fish');
assert.equal(race.current?.species_name,'シロギス','current AUTO BUILD plan stays on the newly selected fish');
assert.match(race.label,/シロギス/,'MY SET label stays synchronized to the newly selected fish');
await raceContext.close();

await browser.close();
console.log('TACKLE_AUTO_BUILD_V33_BROWSER_QA_PASS',JSON.stringify({catalogMs:Date.now()-started,compatibility:runtime.state.setResult.compatibility,gaps:runtime.state.setResult.gaps.length,raceGuard:'pass'}));