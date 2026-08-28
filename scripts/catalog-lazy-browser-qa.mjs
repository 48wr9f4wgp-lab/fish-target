import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const KEY='fish_target_v17_tackle';
const manifest=JSON.parse(readFileSync(new URL('../catalog-batch-manifest.json',import.meta.url),'utf8'));
const batchFiles=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const LAZY=['catalog-providers.js','catalog-adapters.js',...batchFiles,'catalog-fixtures.js','catalog.js'];
const EXPECTED_PRODUCTS=14+manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);

async function waitApp(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===60,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_METHOD_STATUS?.targets===60&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===150,{timeout:15000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_CATALOG_LOADER&&document.querySelector('.v19TackleShortcut')),{timeout:15000});
}

async function assertDeferred(page,label){
  const state=await page.evaluate(()=>({status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,loaded:globalThis.FISH_TARGET_CATALOG?.loaded,count:globalThis.FISH_TARGET_CATALOG?.products?.length,lazyScripts:[...document.querySelectorAll('script[data-catalog-lazy]')].map(x=>x.dataset.catalogLazy)}));
  assert.equal(state.status,'idle',`${label}: loader idle before MY TACKLE`);
  assert.equal(state.loaded,false,`${label}: facade not hydrated`);
  assert.equal(state.count,0,`${label}: zero products before intent`);
  assert.deepEqual(state.lazyScripts,[],`${label}: no lazy script executed`);
}

async function openSheetAndWaitCatalog(page,label){
  await page.locator('.v19TackleShortcut').click();
  await page.locator('#tackleSheet').waitFor({state:'visible'});
  await page.waitForFunction(expected=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready'&&globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount===expected,EXPECTED_PRODUCTS,{timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#rodCatalogMaker option').length>=2,{timeout:15000});
  const state=await page.evaluate(()=>({count:globalThis.FISH_TARGET_CATALOG.products.length,runtimeCount:globalThis.FISH_TARGET_CATALOG_RUNTIME?.products?.length,batchCount:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.batchCount,scripts:[...document.querySelectorAll('script[data-catalog-lazy]')].map(x=>x.dataset.catalogLazy)}));
  assert.equal(state.count,EXPECTED_PRODUCTS,`${label}: facade product count`);
  assert.equal(state.runtimeCount,EXPECTED_PRODUCTS,`${label}: runtime product count`);
  assert.equal(state.batchCount,manifest.batches.length,`${label}: manifest batch count`);
  assert.deepEqual(state.scripts,LAZY,`${label}: lazy scripts load exactly once in manifest order`);
}

async function searchSelect(page,{makerId,seriesId,searchId,modelId,maker,series,query,expected}){
  await page.locator(makerId).selectOption({label:maker});
  if(series)await page.locator(seriesId).selectOption({label:series});
  await page.locator(searchId).fill(query);
  await page.waitForFunction(({modelId,expected})=>{const model=document.querySelector(modelId);return model&&!model.disabled&&[...model.options].some(o=>(o.textContent||'').includes(expected))},{modelId,expected},{timeout:15000});
  const option=page.locator(`${modelId} option`).filter({hasText:expected}).first();
  const value=await option.getAttribute('value');
  assert.ok(value,`${expected}: canonical product id`);
  await page.locator(modelId).selectOption(value);
  return value;
}

const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();
  const errors=[];const consoleErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await waitApp(page);
  await assertDeferred(page,'online cold launch');
  await openSheetAndWaitCatalog(page,'first MY TACKLE open');

  // Legacy catalog row remains searchable after manifest composition.
  const rodId=await searchSelect(page,{makerId:'#rodCatalogMaker',seriesId:'#rodCatalogSeries',searchId:'#rodCatalogSearch',modelId:'#rodCatalogModel',maker:'DAIWA',series:'DEMO SHORE',query:'100MH',expected:'100MH'});
  await page.locator('#addCatalogRod').click();
  let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{"rods":[],"reels":[]}'),KEY);
  assert.ok(saved.rods.some(x=>x.source==='catalog'&&x.product_id===rodId),'legacy catalog-backed rod persists');

  // Scalable reel batches remain selectable and product capacity never becomes the user's current line.
  const reelId=await searchSelect(page,{makerId:'#reelCatalogMaker',seriesId:'#reelCatalogSeries',searchId:'#reelCatalogSearch',modelId:'#reelCatalogModel',maker:'DAIWA',series:'EMERALDAS AIR',query:'PC LT2500-H',expected:'PC LT2500-H'});
  await page.locator('#addCatalogReel').click();
  saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{"rods":[],"reels":[]}'),KEY);
  const ownedReel=saved.reels.find(x=>x.source==='catalog'&&x.product_id===reelId);
  assert.ok(ownedReel,'scale batch catalog reel persists');
  assert.equal(ownedReel.size,2500,'catalog reel size maps');
  assert.equal(ownedReel.lineType,'','catalog capacity never guesses current line type');
  assert.equal(ownedReel.lineNo,null,'catalog capacity never guesses current line number');
  const runtimeReel=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),reelId);
  assert.equal(runtimeReel.specs.pe_capacity_raw,'0.8号-200m','official PE capacity retained as product metadata');

  const luviasId=await searchSelect(page,{makerId:'#reelCatalogMaker',seriesId:'#reelCatalogSeries',searchId:'#reelCatalogSearch',modelId:'#reelCatalogModel',maker:'DAIWA',series:'LUVIAS',query:'LT5000D-CXH',expected:'LT5000D-CXH'});
  await page.locator('#addCatalogReel').click();
  saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{"rods":[],"reels":[]}'),KEY);
  const ownedLuvias=saved.reels.find(x=>x.source==='catalog'&&x.product_id===luviasId);
  assert.ok(ownedLuvias,'LUVIAS catalog reel persists');
  assert.equal(ownedLuvias.size,5000,'LUVIAS reel size maps');
  assert.equal(ownedLuvias.lineType,'','LUVIAS capacity never guesses current line type');
  assert.equal(ownedLuvias.lineNo,null,'LUVIAS capacity never guesses current line number');
  const runtimeLuvias=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),luviasId);
  assert.equal(runtimeLuvias.specs.pe_capacity_raw,'2.5号-300m','LUVIAS PE capacity retained only as product metadata');
  assert.equal(runtimeLuvias.identifiers.jan,'4550133389061','LUVIAS official JAN retained');
  await page.locator('#tackleClose').click();

  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await page.reload({waitUntil:'networkidle'});
  await waitApp(page);
  await assertDeferred(page,'second launch before intent');

  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:20000});
  await waitApp(page);
  await assertDeferred(page,'offline cold launch before intent');
  await openSheetAndWaitCatalog(page,'offline cached MY TACKLE open');
  await page.locator('#reelCatalogMaker').selectOption({label:'DAIWA'});
  await page.locator('#reelCatalogSeries').selectOption({label:'EMERALDAS AIR'});
  await page.locator('#reelCatalogSearch').fill('PC LT2500-H');
  await page.waitForFunction(()=>[...document.querySelectorAll('#reelCatalogModel option')].some(o=>(o.textContent||'').includes('PC LT2500-H')),{timeout:15000});
  assert.ok((await page.locator('#tackleOwned').textContent()||'').includes('PC LT2500-H'),'offline saved scale-batch reel remains visible');
  await page.locator('#reelCatalogSeries').selectOption({label:'LUVIAS'});
  await page.locator('#reelCatalogSearch').fill('LT5000D-CXH');
  await page.waitForFunction(()=>[...document.querySelectorAll('#reelCatalogModel option')].some(o=>(o.textContent||'').includes('LT5000D-CXH')),{timeout:15000});
  assert.ok((await page.locator('#tackleOwned').textContent()||'').includes('LT5000D-CXH'),'offline saved LUVIAS reel remains visible');
  await context.setOffline(false);

  assert.equal(errors.length,0,`page errors\n${errors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`console errors\n${consoleErrors.join('\n')}`);
  console.log(`CATALOG LAZY/SCALE BROWSER QA PASS · ${EXPECTED_PRODUCTS} rows/${manifest.batches.length} batches/runtime cache/offline`);
  await context.close();
}finally{await browser.close()}