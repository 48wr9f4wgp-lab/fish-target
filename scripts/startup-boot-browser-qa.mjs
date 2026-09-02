import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

await page.route('**/visual-v8.js*',async route=>{
  await new Promise(resolve=>setTimeout(resolve,1200));
  await route.continue();
});

await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await page.locator('.app').waitFor({state:'attached'});

const during=await page.evaluate(()=>({
  ready:document.documentElement.classList.contains('ft-ready'),
  appVisibility:getComputedStyle(document.querySelector('.app')).visibility,
  splash:getComputedStyle(document.body,'::before').content,
  splashPosition:getComputedStyle(document.body,'::before').position
}));
assert.equal(during.ready,false,'boot gate must remain closed while final visual layer is delayed');
assert.equal(during.appVisibility,'hidden','raw app must not be visible during bootstrap');
assert.match(during.splash,/FISH TARGET/,'startup splash must be visible during bootstrap');
assert.equal(during.splashPosition,'fixed','startup splash must cover the viewport');

await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),{timeout:15000});
await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_VISUAL_V8),{timeout:15000});
await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===63,{timeout:15000});

const after=await page.evaluate(()=>({
  appVisibility:getComputedStyle(document.querySelector('.app')).visibility,
  splash:getComputedStyle(document.body,'::before').content,
  targets:document.querySelectorAll('#grid .fish').length
}));
assert.equal(after.appVisibility,'visible','app must reveal after enhanced UI bootstrap');
assert.ok(after.splash==='none'||after.splash==='normal'||after.splash==='""','startup splash must be removed after reveal');
assert.equal(after.targets,63,'expanded target grid must be ready before reveal');
assert.deepEqual(errors,[],'startup gate must not introduce page errors');

await context.close();
await browser.close();
console.log('startup boot browser QA passed · 63 targets');