import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const DELAY_MS=70;
const MAX_PARALLEL_LOAD_MS=2400;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const assetName=url=>{try{return new URL(url).pathname.split('/').pop()||''}catch{return ''}};

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  const pageErrors=[];const consoleErrors=[];const delayed=[];
  let measureCatalog=false;
  page.on('pageerror',error=>pageErrors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')consoleErrors.push(message.text())});
  await page.route('**/*',async route=>{
    const name=assetName(route.request().url());
    const lazyCatalog=name.startsWith('catalog-')&&name.endsWith('.js')&&name!=='catalog-loader.js';
    if(measureCatalog&&lazyCatalog){delayed.push({name,at:Date.now()});await sleep(DELAY_MS)}
    await route.continue();
  });

  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===63&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===158,null,{timeout:20000});
  const cold=await page.evaluate(()=>({status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,count:globalThis.FISH_TARGET_CATALOG?.products?.length||0,strategy:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.loadStrategy}));
  assert.deepEqual(cold,{status:'idle',count:0,strategy:'parallel-batches'},'Catalog stays deferred and advertises parallel batch hydration');

  measureCatalog=true;
  const started=Date.now();
  await page.locator('.v19TackleShortcut').click();
  await page.locator('#tackleSheet').waitFor({state:'visible',timeout:5000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready'&&globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount===985,null,{timeout:15000});
  const elapsed=Date.now()-started;
  measureCatalog=false;
  const loaded=await page.evaluate(()=>({batchCount:globalThis.FISH_TARGET_CATALOG_LOADER.state.batchCount,productCount:globalThis.FISH_TARGET_CATALOG_LOADER.state.productCount,scripts:[...document.querySelectorAll('script[data-catalog-lazy]')].map(x=>x.dataset.catalogLazy)}));
  const uniqueDelayed=[...new Set(delayed.map(x=>x.name))];
  assert.equal(loaded.batchCount,46,'all 46 Catalog batches hydrate after explicit intent');
  assert.equal(loaded.productCount,985,'Catalog product total remains intact');
  assert.ok(uniqueDelayed.length>=46,`expected broad Catalog request fan-out, got ${uniqueDelayed.length}`);
  assert.ok(elapsed<MAX_PARALLEL_LOAD_MS,`Catalog hydration took ${elapsed}ms with ${DELAY_MS}ms/request synthetic latency; serial loading would exceed the ${MAX_PARALLEL_LOAD_MS}ms guard`);
  assert.equal((await page.locator('.tackleSheetHead h2').textContent()||'').trim(),'タックル追加','MY TACKLE sheet uses concise title');
  assert.deepEqual(await page.locator('.tackleEntryModes').first().locator('button').allTextContents(),['商品から','手入力'],'entry mode copy is concise');

  await page.locator('#tackleClose').click();
  await page.locator('button.fish[data-fish="アカハタ"]').click();
  await page.locator('#result.on').waitFor({state:'visible'});
  assert.equal((await page.locator('#result .ux23AnswerTitle').textContent()||'').trim(),'まず投げる','result opens with action-first heading');
  assert.deepEqual(await page.locator('#resultRailV26 button').allTextContents(),['① 投げる','② 道具','③ 現場'],'result rail is a three-step visual path');
  const layout=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
  assert.ok(layout.doc<=391&&layout.body<=391&&layout.viewport===390,'clarity pass remains overflow-free at 390px');
  assert.deepEqual(pageErrors,[],'performance/clarity path has no page errors');
  assert.deepEqual(consoleErrors,[],'performance/clarity path has no console errors');
  console.log('PERF_CLARITY_BROWSER_QA_PASS',JSON.stringify({catalogHydrationMs:elapsed,syntheticDelayMs:DELAY_MS,delayedCatalogAssets:uniqueDelayed.length,batches:46,products:985}));
}finally{
  await browser.close();
}
