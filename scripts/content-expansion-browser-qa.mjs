import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const lureAsset=url=>{try{return new URL(url).pathname.split('/').pop()||''}catch{return ''}};
const text=async(page,selector)=>(await page.locator(selector).textContent()||'').trim();
const has=(list,name)=>list.includes(name);
const noLureRequests=list=>list.filter(name=>name.startsWith('lure-catalog'));

async function waitApp(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===62,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_METHOD_STATUS?.targets===62&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===155,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_SPECIES_REGISTRY?.count===62&&globalThis.FISH_TARGET_METHOD_REGISTRY?.count===155,{timeout:15000});
  await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),{timeout:15000});
}

async function openTarget(page,name){
  await page.locator(`button.fish[data-fish="${name}"]`).click();
  await page.locator('#result.on').waitFor({state:'visible'});
  await page.waitForFunction(expected=>(document.getElementById('rname')?.textContent||'').trim()===expected,name,{timeout:10000});
}

async function backHome(page){
  await page.locator('#back').click();
  await page.locator('#home.on').waitFor({state:'visible',timeout:10000});
}

async function selectMethod(page,id){
  const picker=page.locator('#methodPickerV1');
  const change=page.locator('#ux23MethodChange');
  if(await change.count()&&!(await picker.isVisible()))await change.click();
  await picker.waitFor({state:'visible'});
  await picker.locator(`[data-method-id="${id}"]`).click();
}

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  const requests=[];const pageErrors=[];const consoleErrors=[];
  page.on('request',req=>{const name=lureAsset(req.url());if(name.startsWith('lure-catalog'))requests.push(name)});
  page.on('pageerror',error=>pageErrors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});

  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await waitApp(page);

  assert.equal(await page.locator('#grid .fish').count(),62,'content expansion renders 62 targets');
  assert.equal(await text(page,'#home .heroStats span:nth-of-type(1)'),'62魚種','hero species count');
  assert.ok((await page.locator('#home .heroStats').textContent()||'').includes('155釣法プラン'),'hero plan count');
  assert.deepEqual(noLureRequests(requests),[],'startup performs zero lure catalog requests');
  assert.equal(await page.locator('button.fish[data-fish="カマス"]').count(),1,'Kamasu target is selectable');
  assert.equal(await page.locator('button.fish[data-fish="オオモンハタ"]').count(),1,'Oomonhata target is selectable');

  await openTarget(page,'ヒラメ');
  await page.waitForTimeout(150);
  assert.deepEqual(noLureRequests(requests),[],'unsupported target performs zero lure catalog requests');
  assert.equal(await page.locator('#lureCatalogPanel').count(),0,'unsupported target does not mount lure UI');
  await backHome(page);

  await openTarget(page,'カマス');
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_LURE_CATALOG_ENTRY),{timeout:10000});
  await page.locator('#lureCatalogPanel').waitFor({state:'visible',timeout:10000});
  assert.ok(has(requests,'lure-catalog.css'),'supported target demand-loads lure UI CSS');
  assert.ok(has(requests,'lure-catalog-entry.js'),'supported target demand-loads lure UI entry');
  assert.equal(has(requests,'lure-catalog-loader.js'),false,'loader stays deferred while panel is closed');
  assert.equal(has(requests,'lure-catalog-manifest.json'),false,'manifest stays deferred while panel is closed');
  assert.equal(has(requests,'lure-catalog-daiwa-kamasu-light-2026.js'),false,'Kamasu shard stays deferred while panel is closed');
  assert.equal(has(requests,'lure-catalog-daiwa-sawara-blade-2026.js'),false,'Sawara shard is untouched');

  assert.equal(await text(page,'#pmethod'),'ミノーゲーム','Kamasu default method');
  await selectMethod(page,'small-metal');
  assert.equal(await text(page,'#pmethod'),'ライトメタルゲーム','Kamasu small-metal method selectable');
  assert.equal(await text(page,'#firstBait'),'小型メタルジグ','Kamasu FIRST CAST connects to lure catalog');

  await page.locator('#lureCatalogPanel > summary').click();
  await page.waitForFunction(()=>document.querySelectorAll('#lureCatalogBody .lureCatalogItem').length===3,{timeout:10000});
  assert.ok(has(requests,'lure-catalog-loader.js'),'panel demand-loads lure loader');
  assert.ok(has(requests,'lure-catalog-manifest.json'),'panel demand-loads lure manifest');
  assert.ok(has(requests,'lure-catalog-daiwa-kamasu-light-2026.js'),'Kamasu panel loads only Kamasu shard');
  assert.equal(has(requests,'lure-catalog-daiwa-sawara-blade-2026.js'),false,'Kamasu panel never loads Sawara shard');
  assert.equal(await page.locator('#lureCatalogBody .lureCatalogItem').count(),3,'Kamasu renders three functional-size candidates');
  assert.deepEqual(await page.locator('#lureCatalogBody .lureCatalogItem b').allTextContents(),['月下美人 小鉄 3g','月下美人 小鉄 5g','月下美人 小鉄 7g']);
  assert.match(await text(page,'#lureCatalogBody .lureCatalogDisclaimer'),/色別SKU・在庫・価格は含めない/,'UI discloses lightweight catalog scope');

  const layout=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
  assert.ok(layout.doc<=391&&layout.body<=391&&layout.viewport===390,'390px result remains overflow-free');
  assert.deepEqual(pageErrors,[],'content expansion browser path has no page errors');
  assert.deepEqual(consoleErrors,[],'content expansion browser path has no console errors');

  await context.close();
  console.log('CONTENT_EXPANSION_BROWSER_QA_PASS',JSON.stringify({species:62,plans:155,lureRequests:requests,renderedKamasu:3}));
}finally{
  await browser.close();
}
