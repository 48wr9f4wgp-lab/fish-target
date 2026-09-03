import assert from 'node:assert/strict';
import {webkit,devices} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const iphone=devices['iPhone 13'];
const browser=await webkit.launch({headless:true});
const context=await browser.newContext({
  viewport:{width:390,height:844},
  screen:{width:390,height:844},
  deviceScaleFactor:3,
  isMobile:true,
  hasTouch:true,
  userAgent:iphone.userAgent,
  locale:'ja-JP',
  serviceWorkers:'block'
});
const page=await context.newPage();
const errors=[];const consoleErrors=[];
page.on('pageerror',error=>errors.push(String(error)));
page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});

await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:30000});
await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:20000});

const environment=await page.evaluate(()=>({
  width:innerWidth,height:innerHeight,
  touch:navigator.maxTouchPoints,
  ua:navigator.userAgent,
  ready:document.documentElement.classList.contains('ft-ready')
}));
assert.equal(environment.width,390,'iPhone baseline width is 390px');
assert.ok(environment.touch>0,'WebKit context exposes touch capability');
assert.match(environment.ua,/iPhone/i,'iPhone Safari-class user agent is active');
assert.equal(environment.ready,true,'runtime reaches ft-ready');

const search=page.locator('#q');
await search.fill('ヒラメ');
await page.waitForTimeout(250);
assert.ok(await page.locator('button.fish[data-fish="ヒラメ"]').isVisible(),'Japanese search remains usable in WebKit');
await page.locator('#clearSearch').click();
await page.waitForTimeout(100);

await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.locator('#tackleAutoBuildV29').waitFor({state:'visible'});
assert.equal((await page.locator('#result .planCard .recommend').textContent())?.trim(),'STEP 1 · 釣り方');
assert.match((await page.locator('#result .ux23AnswerTitle').innerText())||'',/STEP 2 · 最初の1投/);
assert.match((await page.locator('.autoBuildHeadV29 strong').textContent())||'',/STEP 3 · セットを組む/);
assert.equal((await page.locator('#fieldModeBtn').textContent())?.trim(),'STEP 4 · 現場へ');

const boxes=await page.evaluate(()=>{
  const box=selector=>{const el=document.querySelector(selector);if(!el)return null;const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}};
  return {plan:box('#result .planCard'),first:box('#result .firstCast'),auto:box('#tackleAutoBuildV29')};
});
assert.ok(boxes.plan&&boxes.first&&boxes.auto&&boxes.plan.top<boxes.first.top&&boxes.first.top<boxes.auto.top,`iOS flow order: ${JSON.stringify(boxes)}`);

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
    rods:[{id:'webkit-owned-rod',source:'manual',name:'WEBKIT OWNED ROD',length,power,maxLure}],
    reels:[{id:'webkit-owned-reel',source:'manual',name:'WEBKIT OWNED REEL',size,lineType:line?.type||'',lineNo}]
  };
  const raw=JSON.stringify(db);localStorage.setItem('fish_target_v17_tackle',raw);return raw;
});

await page.locator('#autoBuildRunV29').click();
await page.waitForFunction(()=>['ready','error'].includes(globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status),null,{timeout:45000});
const state=await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.());
assert.equal(state?.status,'ready',`AUTO BUILD reaches ready in WebKit: ${JSON.stringify(state)}`);
assert.equal(state?.setResult?.myBestSet?.rod?.name,'WEBKIT OWNED ROD');
assert.equal(state?.setResult?.myBestSet?.reel?.name,'WEBKIT OWNED REEL');
assert.ok(['ideal','good','usable'].includes(state?.setResult?.compatibility),`compatible MY SET expected: ${state?.setResult?.compatibility}`);
await page.locator('#autoBuildResultV29').waitFor({state:'visible'});
assert.equal((await page.locator('#autoBuildNextV32').textContent())?.trim(),'STEP 4 · 現場へ');
assert.equal(await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle')),ownedBefore,'AUTO BUILD does not mutate MY TACKLE in WebKit');

const touchTargets=await page.locator('#ux23MethodChange,#favoriteBtn,#autoBuildRunV29,#autoBuildNextV32,#resultDockV20 button:visible').evaluateAll(els=>els.map(el=>({text:el.textContent?.trim(),w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
assert.ok(touchTargets.every(x=>x.w>=44&&x.h>=44),`iOS touch targets stay >=44px: ${JSON.stringify(touchTargets)}`);
const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
assert.ok(overflow.doc<=391&&overflow.body<=391&&overflow.viewport===390,`iOS 390px overflow: ${JSON.stringify(overflow)}`);

await page.locator('#autoBuildNextV32').click();
await page.locator('#fieldmode.on').waitFor({state:'visible'});
assert.ok((await page.locator('#fmFish').textContent())?.includes('ブリ'),'FIELD MODE preserves selected target');
await page.locator('#fieldBack').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.locator('#back').click();
await page.locator('#home.on').waitFor({state:'visible'});
await page.locator('#resumePlan').waitFor({state:'visible'});
assert.match((await page.locator('#resumePlan').innerText())||'',/ブリ・ワラサ/,'continuity exposes previous plan after returning home');
await page.locator('#resumePlan').click();
await page.locator('#result.on').waitFor({state:'visible'});
assert.equal((await page.locator('#rname').textContent())?.trim(),'ブリ・ワラサ','resume reopens the previous target in WebKit');

assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
await browser.close();
console.log('IOS_WEBKIT_RC_QA_PASS',JSON.stringify({viewport:environment.width,touch:environment.touch,compatibility:state.setResult.compatibility}));
