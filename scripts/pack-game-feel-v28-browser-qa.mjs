import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];const consoleErrors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
assert.equal(await page.locator('script[data-extension="trip-pack-rules-v34-js"]').count(),1,'trip pack rules loaded once');
assert.equal(await page.locator('script[data-extension="pack-checklist-v28-js"]').count(),1,'pack UI loaded once');
assert.equal(await page.locator('link[data-extension="trip-pack-v34-css"]').count(),1,'trip pack CSS loaded once');
await page.locator('#grid .fish').first().waitFor({state:'visible'});
assert.equal(await page.locator('#appPackTabV30').count(),1,'packing has its own app tab');
assert.equal(await page.locator('#appTabBarV26 button').count(),4,'global shell has four tabs');
assert.equal(await page.locator('#packStandaloneV30').isVisible(),false,'packing surface starts closed');

await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status==='ready');
assert.equal(await page.locator('#result #quickPackV28').count(),0,'TRIP READY remains optional and is not inserted into the core result flow');
await page.locator('#back').click();
await page.locator('#home.on').waitFor({state:'visible'});

await page.locator('#appPackTabV30').click();
await page.locator('#packStandaloneV30').waitFor({state:'visible'});
assert.equal(await page.locator('#appPackTabV30.on').count(),1,'packing tab becomes active');
assert.match((await page.locator('#tripPackContextV34').textContent())||'',/ブリ・ワラサ/,'selected trip context is preserved');
const runtime=await page.evaluate(()=>({
  version:globalThis.FISH_TARGET_QUICK_PACK?.version,
  plan:globalThis.FISH_TARGET_QUICK_PACK?.currentPlan?.()?.plan_id||null,
  items:globalThis.FISH_TARGET_QUICK_PACK?.getConfig?.()||[],
  checked:[...(globalThis.FISH_TARGET_QUICK_PACK?.getChecked?.()||[])]
}));
assert.equal(runtime.version,'TRIP-READY-V34');
assert.ok(runtime.plan,'selected plan has a stable pack context');
assert.equal(runtime.checked.length,0,'owned/required gear is never auto-marked as physically packed');
const required=runtime.items.filter(item=>item.priority==='required');
assert.ok(required.length>=5,'plan generates required rod/reel/line/rig/FIRST CAST items');
for(const id of ['plan-rod','plan-reel','plan-line','plan-rig','plan-first-cast'])assert.ok(runtime.items.some(item=>item.id===id),`missing generated item ${id}`);
assert.equal((await page.locator('.tripPackRowV34.priority-required').count()),required.length,'required UI matches rule output');
assert.equal((await page.locator('#quickPackCountV28').textContent())?.trim(),`必須 0/${required.length}`);

const ergonomics=await page.evaluate(()=>{
  const px=value=>Number.parseFloat(value)||0;
  const label=document.querySelector('.tripPackRowV34.priority-required .quickPackItemV28');
  const edit=document.getElementById('quickPackEditV28');
  const title=document.querySelector('.tripPackRowV34.priority-required .tripPackTextV34 b');
  const reason=document.querySelector('.tripPackRowV34.priority-required .tripPackTextV34 small');
  const measure=el=>el?{height:el.getBoundingClientRect().height,font:px(getComputedStyle(el).fontSize)}:null;
  return {label:measure(label),edit:measure(edit),title:measure(title),reason:measure(reason)};
});
assert.ok(ergonomics.label?.height>=44,`required row tap target below 44px: ${JSON.stringify(ergonomics.label)}`);
assert.ok(ergonomics.edit?.height>=44,`edit tap target below 44px: ${JSON.stringify(ergonomics.edit)}`);
assert.ok(ergonomics.title?.font>=13,`required item title too small: ${JSON.stringify(ergonomics.title)}`);
assert.ok(ergonomics.reason?.font>=11,`required item reason too small: ${JSON.stringify(ergonomics.reason)}`);

await page.locator('.tripPackRowV34.priority-required .quickPackItemV28').first().click();
assert.equal((await page.locator('#quickPackCountV28').textContent())?.trim(),`必須 1/${required.length}`);
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9_checklists')||'{}'));
assert.ok(saved.__quick_pack_v28_checked,'checked state stored inside existing checklist storage');
assert.ok(Object.keys(saved.__quick_pack_v28_checked).some(key=>key.startsWith('pack:species-')),'plan uses an isolated checklist key');

await page.locator('#quickPackEditV28').click();
assert.equal(await page.locator('#quickPackEditorV28').isVisible(),true,'editor opens');
assert.equal(await page.locator('.tripPackRowV34.priority-required .quickPackDeleteV28:visible').count(),0,'system-generated required items cannot be deleted');
assert.ok(await page.locator('.quickPackDeleteV28:visible').count()>0,'user-list items remain editable');
await page.locator('#quickPackAddInputV28').fill('<img src=x>');
await page.locator('#quickPackAddFormV28 button').click();
assert.equal(await page.locator('#quickPackListV28 img').count(),0,'custom item text is not interpreted as HTML');
assert.ok((await page.locator('.tripPackTextV34 b').allTextContents()).includes('<img src=x>'),'custom text preserved literally');

await page.locator('#quickPackResetV28').click();
assert.ok(await page.locator('.tripPackRowV34.priority-required').count()>=5,'reset does not remove generated trip requirements');
await page.locator('#quickPackEditV28').click();
for(const row of await page.locator('.tripPackRowV34.priority-required').all()){
  const input=row.locator('input');
  if(!(await input.isChecked()))await row.locator('.quickPackItemV28').click();
}
assert.ok(await page.locator('#quickPackV28.ready').count(),'all required items checked produces TRIP READY state');
const afterReady=await page.evaluate(()=>({items:globalThis.FISH_TARGET_QUICK_PACK.getConfig(),checked:[...globalThis.FISH_TARGET_QUICK_PACK.getChecked()]}));
assert.ok(afterReady.items.filter(item=>item.priority==='required').every(item=>afterReady.checked.includes(item.id)),'READY means every required generated item is explicitly checked');

await page.locator('#packStandaloneCloseV30').click();
assert.equal(await page.locator('#packStandaloneV30').isVisible(),false,'standalone packing surface closes');
assert.equal(await page.locator('#appTabBarV26 button[data-app-tab="home"].on').count(),1,'home tab is restored');

const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
assert.ok(overflow.doc<=391&&overflow.body<=391&&overflow.viewport===390,`390px overflow: ${JSON.stringify(overflow)}`);
assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);

await browser.close();
console.log('TRIP_READY_V34_BROWSER_QA_PASS');
