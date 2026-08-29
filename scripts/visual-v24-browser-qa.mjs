import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];const consoleErrors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:20000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
assert.equal(await page.locator('link[data-extension="visual-v24-css"]').count(),1,'V24 visual stylesheet loaded once');

await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.locator('#result .firstCast').waitFor({state:'visible'});

const visual=await page.evaluate(()=>{
  const read=(sel)=>{const el=document.querySelector(sel);const s=getComputedStyle(el);return {bg:s.backgroundImage,bgc:s.backgroundColor,color:s.color,border:s.borderColor,shadow:s.boxShadow,blur:s.backdropFilter||s.webkitBackdropFilter||''}};
  return {
    hero:read('#result .resultHero'),
    first:read('#result .firstCast'),
    firstCell:read('#result .firstGrid div'),
    plan:read('#result .planCard'),
    methodChange:read('#ux23MethodChange'),
    fit:read('#tackleFitCard'),
    gear:read('#gear'),
    dock:read('#resultDockV20'),
    field:read('#fieldModeBtn')
  };
});

assert.match(visual.hero.bg,/gradient/i,'result hero uses layered marine gradient');
assert.match(visual.first.bg,/gradient/i,'FIRST CAST is a dark instrument panel');
assert.notEqual(visual.first.bgc,'rgb(255, 255, 255)','FIRST CAST no longer reads as generic white card');
assert.match(visual.first.color,/rgb\((?:24[0-9]|25[0-5]),/,'FIRST CAST keeps high-contrast light text');
assert.notEqual(visual.firstCell.bgc,'rgb(255, 255, 255)','FIRST CAST data cells are integrated into panel');
assert.ok(visual.plan.shadow!=='none','method card has controlled depth');
assert.ok(/gradient/i.test(visual.methodChange.bg)||visual.methodChange.bgc!=='rgba(0, 0, 0, 0)','method change is a deliberate dark control');
assert.ok(visual.fit.shadow!=='none','MY TACKLE decision card has hierarchy depth');
assert.ok(visual.gear.shadow!=='none','required tackle spec plate has subtle depth');
assert.match(visual.dock.blur,/blur/i,'result dock uses frosted-glass treatment');
assert.match(visual.field.bg,/gradient/i,'field mode remains the dominant dock action');

const firstBox=await page.locator('#result .firstCast').boundingBox();
const planBox=await page.locator('#result .planCard').boundingBox();
assert.ok(firstBox&&planBox&&firstBox.y<planBox.y,'visual pass preserves answer-first UX23 hierarchy');
const touchTargets=await page.locator('#ux23MethodChange,#favoriteBtn,#resultDockV20 button:visible').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
assert.ok(touchTargets.every(x=>x.h>=44&&x.w>=44),`visual pass preserves 44px touch targets: ${JSON.stringify(touchTargets)}`);
const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
assert.ok(overflow.doc<=391&&overflow.viewport===390,'V24 visual pass introduces no horizontal overflow');
assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
await browser.close();
console.log('VISUAL_V24_BROWSER_QA_PASS');
