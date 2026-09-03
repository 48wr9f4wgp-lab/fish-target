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
assert.equal(await page.locator('link[data-extension="visual-v25-css"]').count(),1,'V25 visual stylesheet loaded once');

await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.locator('#result .firstCast').waitFor({state:'visible'});

const styles=await page.evaluate(()=>{
  const read=(sel)=>{const el=document.querySelector(sel);if(!el)throw new Error(`Missing visual QA selector: ${sel}`);const s=getComputedStyle(el);return {bg:s.backgroundImage,bgc:s.backgroundColor,border:s.borderColor,shadow:s.boxShadow,blur:s.backdropFilter||s.webkitBackdropFilter||'',radius:s.borderRadius,color:s.color}};
  return {
    fishArt:read('#result .tart'),
    plan:read('#result .planCard'),
    fit:read('#tackleFitCard'),
    gear:read('#gear'),
    stepCard:read('#steps'),
    refine:read('#result .refine'),
    dock:read('#resultDockV20'),
    field:read('#fieldModeBtn')
  };
});

const stepPanel=await page.locator('#steps').evaluate(el=>{const p=el.parentElement;if(!p)throw new Error('Missing field steps parent panel');const s=getComputedStyle(p);return {bg:s.backgroundImage,shadow:s.boxShadow,border:s.borderColor}});
assert.match(styles.fishArt.bg,/gradient/i,'fish art uses integrated background rather than a plain box');
assert.ok(styles.plan.shadow!=='none','method surface retains controlled depth');
assert.ok(styles.fit.shadow!=='none','MY TACKLE surface uses the same material system');
assert.ok(styles.gear.shadow!=='none','required tackle surface uses the same material system');
assert.ok(stepPanel.shadow!=='none','field steps parent surface uses the same material system');
assert.match(stepPanel.bg,/gradient/i,'field steps parent surface uses unified gradient material');
assert.ok(styles.refine.shadow!=='none','disclosure surface receives subtle depth');
assert.match(styles.dock.blur,/blur/i,'dock remains frosted glass');
assert.match(styles.field.bg,/gradient/i,'field mode remains the dominant CTA');

const surfaceColors=await page.evaluate(()=>{
  const selectors=['#result .planCard','#tackleFitCard','#gear'];
  const values=selectors.map(sel=>getComputedStyle(document.querySelector(sel)).backgroundImage);
  const steps=document.querySelector('#steps')?.parentElement;if(!steps)throw new Error('Missing field steps panel');
  values.push(getComputedStyle(steps).backgroundImage);
  return values;
});
assert.ok(surfaceColors.every(v=>/gradient/i.test(v)),`primary result surfaces share gradient material language: ${JSON.stringify(surfaceColors)}`);

const titleAccent=await page.locator('#result .sectionTitle').first().evaluate(el=>getComputedStyle(el,'::before').backgroundImage);
assert.match(titleAccent,/gradient/i,'section titles receive a consistent mint instrument accent');

const touchTargets=await page.locator('#ux23MethodChange,#favoriteBtn,#resultDockV20 button:visible').evaluateAll(els=>els.map(el=>({w:el.getBoundingClientRect().width,h:el.getBoundingClientRect().height})));
assert.ok(touchTargets.every(x=>x.h>=44&&x.w>=44),`V25 preserves 44px touch targets: ${JSON.stringify(touchTargets)}`);
const firstBox=await page.locator('#result .firstCast').boundingBox(),planBox=await page.locator('#result .planCard').boundingBox(),fitBox=await page.locator('#tackleFitCard').boundingBox(),gearBox=await page.locator('#gear').boundingBox();
assert.ok(firstBox&&planBox&&fitBox&&gearBox&&planBox.y<firstBox.y&&firstBox.y<fitBox.y&&fitBox.y<gearBox.y,'V25 preserves RC32 method → FIRST CAST → MY TACKLE hierarchy');
const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,viewport:innerWidth}));
assert.ok(overflow.doc<=391&&overflow.viewport===390,'V25 introduces no horizontal overflow');
assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
await browser.close();
console.log('VISUAL_V25_BROWSER_QA_PASS');
