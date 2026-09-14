import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const WIDTHS=[375,390,430];
const browser=await chromium.launch({headless:true});

const rect=async(locator)=>locator.evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,width:r.width,height:r.height}});
const noOverflow=async page=>page.evaluate(()=>({viewport:innerWidth,doc:document.documentElement.scrollWidth,body:document.body.scrollWidth}));

for(const width of WIDTHS){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
  await page.locator('#grid .fish').first().waitFor({state:'visible'});

  let overflow=await noOverflow(page);
  assert.ok(overflow.doc<=width+1&&overflow.body<=width+1,`home overflow at ${width}px: ${JSON.stringify(overflow)}`);

  // Beginner / re-entry: the core answer must work before MY TACKLE or Catalog setup.
  await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
  await page.locator('#result.on').waitFor({state:'visible'});
  await page.locator('#tackleAutoBuildV29').waitFor({state:'visible'});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status==='ready');
  assert.deepEqual(await page.locator('#resultRailV26 button').allTextContents(),['釣り方','セット','現場']);
  assert.equal((await page.locator('#result .planCard .recommend').textContent())?.trim(),'STEP 1 · 釣り方');
  assert.match((await page.locator('#result .ux23AnswerTitle').innerText())||'',/STEP 2 · 最初の1投/);
  assert.match((await page.locator('.autoBuildHeadV29 strong').textContent())||'',/STEP 3 · 今回のセット/);
  assert.equal((await page.locator('[data-set-card="owned"]>b').textContent())?.trim(),'MY TACKLE未登録');
  assert.equal((await page.locator('#autoBuildNextV32').textContent())?.trim(),'MY TACKLEを追加');
  assert.equal(await page.locator('#autoBuildDetailsV31').evaluate(el=>el.open),false,'evidence is closed by default');
  assert.deepEqual(await page.evaluate(()=>({status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,count:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount})),{status:'idle',count:0},'beginner answer must not depend on Catalog');

  const plan=await rect(page.locator('#result .planCard'));
  const first=await rect(page.locator('#result .firstCast'));
  const mySet=await rect(page.locator('#tackleAutoBuildV29'));
  assert.ok(plan.top<first.top&&first.top<mySet.top,`visual order at ${width}px must be METHOD → FIRST CAST → MY SET`);

  const ergonomics=await page.evaluate(()=>{
    const box=selector=>{const r=document.querySelector(selector)?.getBoundingClientRect();return r?{w:r.width,h:r.height}:null};
    const size=selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
    return {
      product:box('#autoBuildRunV29'),next:box('#autoBuildNextV32'),
      decision:size('[data-set-card="owned"]>b'),firstCast:size('#result .firstCast b, #result .firstCast strong, #firstBait')
    };
  });
  assert.ok(ergonomics.product?.h>=44,`product action <44px at ${width}: ${JSON.stringify(ergonomics)}`);
  assert.ok(ergonomics.next?.h>=48,`primary action <48px at ${width}: ${JSON.stringify(ergonomics)}`);
  assert.ok(ergonomics.decision>=17,`MY SET decision type <17px at ${width}: ${JSON.stringify(ergonomics)}`);

  overflow=await noOverflow(page);
  assert.ok(overflow.doc<=width+1&&overflow.body<=width+1,`result overflow at ${width}px: ${JSON.stringify(overflow)}`);
  assert.deepEqual(errors,[],`page errors at ${width}px: ${errors.join('\n')}`);
  await context.close();
}

// Owned / experienced / field-state contract at the canonical iPhone width.
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
await page.locator('#grid .fish').first().waitFor({state:'visible'});
await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status==='ready');

await page.evaluate(()=>{
  const plan=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.currentPlan();
  const ideal=globalThis.FISH_TARGET_TACKLE_SET_RESOLVER.buildIdealSet(plan);
  const powers=globalThis.FISH_TARGET_TACKLE_SET_RULES.POWER;
  const pr=ideal.rod.power_range;
  const power=pr?powers[Math.round((pr.min+pr.max)/2)]:'MH';
  const length=ideal.rod.length_ft?(ideal.rod.length_ft.min+ideal.rod.length_ft.max)/2:9.6;
  const maxLure=ideal.rod.lure_weight_g?.max||100;
  const sr=ideal.reel.size_range;
  const size=sr?Math.round((sr.min+sr.max)/2):4000;
  const options=globalThis.FISH_TARGET_TACKLE_LOGIC.lineOptions(plan.requirements?.line||'');
  const line=options.find(option=>option.unit==='号')||options[0]||null;
  const lineNo=line?.range?(line.range.min+line.range.max)/2:null;
  localStorage.setItem('fish_target_v17_tackle',JSON.stringify({
    rods:[{id:'hf-rod',source:'manual',name:'HUMAN FACTORS ROD',length,power,maxLure}],
    reels:[{id:'hf-reel',source:'manual',name:'HUMAN FACTORS REEL',size,lineType:line?.type||'',lineNo}]
  }));
  return globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.run({loadCatalog:false});
});
await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().setResult?.myBestSet?.rod?.name==='HUMAN FACTORS ROD');
const decision=(await page.locator('[data-set-card="owned"]>b').textContent())?.trim();
assert.ok(['このセットで行ける','確認が必要'].includes(decision),`owned decision must be immediate: ${decision}`);
assert.equal(await page.locator('#autoBuildDetailsV31').evaluate(el=>el.open),false,'experienced evidence remains progressive disclosure');
assert.ok(['このセットで現場へ','確認して現場へ'].includes((await page.locator('#autoBuildNextV32').textContent())?.trim()));
assert.deepEqual(await page.evaluate(()=>({status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,count:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount})),{status:'idle',count:0},'owned decision is offline/local before optional evidence');

await page.locator('#autoBuildNextV32').click();
await page.locator('#fieldmode.on').waitFor({state:'visible'});
assert.match((await page.locator('#fmTackle').innerText())||'',/HUMAN FACTORS ROD/);
assert.match((await page.locator('#fmTackle').innerText())||'',/HUMAN FACTORS REEL/);
assert.equal((await page.locator('.fmNext span').textContent())?.trim(),'反応がなければ');
assert.deepEqual(await page.locator('.fmTitle').allTextContents(),['今回のセット','現場の3手']);
const field=await page.evaluate(()=>{
  const r=document.querySelector('.fieldBack').getBoundingClientRect();
  const size=selector=>parseFloat(getComputedStyle(document.querySelector(selector)).fontSize);
  return {backW:r.width,backH:r.height,step:size('.fmStep span'),condition:size('.fmCondition'),overflow:document.documentElement.scrollWidth};
});
assert.ok(field.backW>=44&&field.backH>=44,`FIELD back target must be >=44px: ${JSON.stringify(field)}`);
assert.ok(field.step>=15&&field.condition>=12,`FIELD glance typography: ${JSON.stringify(field)}`);
assert.ok(field.overflow<=391,`FIELD overflow at 390px: ${JSON.stringify(field)}`);

await context.close();
await browser.close();
console.log('HUMAN_FACTORS_V33_BROWSER_QA_PASS',JSON.stringify({widths:WIDTHS,beginner:'pass',owned:'pass',experienced:'pass',field:'pass'}));