import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const KEY='fish_target_v17_tackle';
const LAZY=['catalog-providers.js','catalog-adapters.js','catalog-daiwa-poc.js','catalog-shimano-poc.js','catalog-fixtures.js','catalog.js'];

async function waitApp(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===60,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_METHOD_STATUS?.targets===60&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===150,{timeout:15000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_CATALOG_LOADER&&document.querySelector('.v19TackleShortcut')),{timeout:15000});
}

async function assertDeferred(page,label){
  const state=await page.evaluate(()=>({
    status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,
    loaded:globalThis.FISH_TARGET_CATALOG?.loaded,
    count:globalThis.FISH_TARGET_CATALOG?.products?.length,
    lazyScripts:[...document.querySelectorAll('script[data-catalog-lazy]')].map(x=>x.dataset.catalogLazy)
  }));
  assert.equal(state.status,'idle',`${label}: loader idle before MY TACKLE`);
  assert.equal(state.loaded,false,`${label}: facade not hydrated`);
  assert.equal(state.count,0,`${label}: zero products before intent`);
  assert.deepEqual(state.lazyScripts,[],`${label}: no lazy script executed`);
}

async function openSheetAndWaitCatalog(page,label){
  await page.locator('.v19TackleShortcut').click();
  await page.locator('#tackleSheet').waitFor({state:'visible'});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready',{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount===153,{timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#rodCatalogMaker option').length>=2,{timeout:15000});
  const state=await page.evaluate(()=>({
    count:globalThis.FISH_TARGET_CATALOG.products.length,
    runtimeCount:globalThis.FISH_TARGET_CATALOG_RUNTIME?.products?.length,
    scripts:[...document.querySelectorAll('script[data-catalog-lazy]')].map(x=>x.dataset.catalogLazy)
  }));
  assert.equal(state.count,153,`${label}: facade exposes 153 rows`);
  assert.equal(state.runtimeCount,153,`${label}: runtime exposes 153 rows`);
  assert.deepEqual(state.scripts,LAZY,`${label}: lazy scripts load exactly once in order`);
}

async function searchRod(page,query,expected){
  await page.locator('#rodCatalogSearch').fill(query);
  await page.waitForFunction(({query,expected})=>{
    const input=document.querySelector('#rodCatalogSearch');
    const model=document.querySelector('#rodCatalogModel');
    return input?.value===query&&model&&!model.disabled&&[...model.options].some(o=>(o.textContent||'').includes(expected));
  },{query,expected},{timeout:15000});
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
  await page.locator('#rodCatalogMaker').selectOption({label:'DAIWA'});
  await searchRod(page,'100MH','100MH');
  const option=page.locator('#rodCatalogModel option').filter({hasText:'100MH'}).first();
  const value=await option.getAttribute('value');
  assert.ok(value,'catalog model has canonical product id');
  await page.locator('#rodCatalogModel').selectOption(value);
  await page.locator('#addCatalogRod').click();
  const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{"rods":[],"reels":[]}'),KEY);
  assert.ok(saved.rods.some(x=>x.source==='catalog'&&x.product_id===value),'catalog-backed ownership persists');
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
  await page.locator('#rodCatalogMaker').selectOption({label:'DAIWA'});
  await searchRod(page,'100MH','100MH');
  assert.ok((await page.locator('#tackleOwned').textContent()||'').includes('100MH'),'offline saved catalog tackle remains visible');
  await context.setOffline(false);

  assert.equal(errors.length,0,`page errors\n${errors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`console errors\n${consoleErrors.join('\n')}`);
  console.log('CATALOG LAZY BROWSER QA PASS · deferred/153 rows/runtime cache/offline');
  await context.close();
}finally{
  await browser.close();
}
