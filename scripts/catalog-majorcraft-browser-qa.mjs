import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const KEY='fish_target_v17_tackle';
const manifest=JSON.parse(readFileSync(new URL('../catalog-batch-manifest.json',import.meta.url),'utf8'));
const EXPECTED=14+manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();
  const pageErrors=[];const consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.locator('.v19TackleShortcut').click();
  await page.locator('#tackleSheet').waitFor({state:'visible'});
  await page.waitForFunction(expected=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready'&&globalThis.FISH_TARGET_CATALOG?.products?.length===expected,EXPECTED,{timeout:15000});
  await page.waitForFunction(()=>[...document.querySelectorAll('#rodCatalogMaker option')].some(o=>o.textContent==='MAJOR CRAFT'),{timeout:15000});

  await page.locator('#rodCatalogMaker').selectOption({label:'MAJOR CRAFT'});
  await page.locator('#rodCatalogSeries').selectOption({label:'CROSSRIDE 7G'});
  await page.locator('#rodCatalogSearch').fill('XR7-1002MH');
  await page.waitForFunction(()=>[...document.querySelectorAll('#rodCatalogModel option')].some(o=>(o.textContent||'').includes('CROSSRIDE 7G · XR7-1002MH')),{timeout:15000});
  const option=page.locator('#rodCatalogModel option').filter({hasText:'CROSSRIDE 7G · XR7-1002MH'}).first();
  const productId=await option.getAttribute('value');
  assert.ok(productId,'Major Craft canonical product id');
  await page.locator('#rodCatalogModel').selectOption(productId);
  const preview=await page.locator('#rodCatalogPreview').textContent()||'';
  assert.ok(preview.includes('10'),'Major Craft length visible in preview');
  assert.ok(preview.includes('MH'),'Major Craft power visible in preview');
  assert.ok(preview.includes('公式スペック参照'),'official research label visible');
  await page.locator('#addCatalogRod').click();

  let saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{"rods":[],"reels":[]}'),KEY);
  const owned=saved.rods.find(x=>x.product_id===productId);
  assert.ok(owned,'Major Craft rod persists');
  assert.equal(owned.maker,'MAJOR CRAFT');
  assert.equal(owned.series,'CROSSRIDE 7G');
  assert.equal(owned.model,'XR7-1002MH');
  assert.equal(owned.length,10);
  assert.equal(owned.power,'MH');
  assert.equal(owned.maxLure,100);
  const runtime=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),productId);
  assert.equal(runtime.identifiers.jan,'4573236278612');
  assert.equal(runtime.specs.lure_min_g,null,'MAX-only lower bound stays unknown');
  assert.equal(runtime.specs.lure_max_g,100);

  await page.locator('#rodCatalogSeries').selectOption({label:'AJIDO 5G'});
  await page.locator('#rodCatalogSearch').fill('AD5-S832FC/AJI');
  await page.waitForFunction(()=>[...document.querySelectorAll('#rodCatalogModel option')].some(o=>(o.textContent||'').includes('AJIDO 5G · AD5-S832FC/AJI')),{timeout:15000});
  const fcId=await page.locator('#rodCatalogModel option').filter({hasText:'AJIDO 5G · AD5-S832FC/AJI'}).first().getAttribute('value');
  const fc=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),fcId);
  assert.equal(fc.specs.power,'','Float & Caro suffix is not converted into invented power');

  await page.locator('#tackleClose').click();
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await page.reload({waitUntil:'networkidle'});
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:20000});
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.locator('.v19TackleShortcut').click();
  await page.locator('#tackleSheet').waitFor({state:'visible'});
  await page.waitForFunction(expected=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready'&&globalThis.FISH_TARGET_CATALOG?.products?.length===expected,EXPECTED,{timeout:15000});
  assert.ok((await page.locator('#tackleOwned').textContent()||'').includes('XR7-1002MH'),'Major Craft saved rod visible offline');
  await page.locator('#rodCatalogMaker').selectOption({label:'MAJOR CRAFT'});
  await page.locator('#rodCatalogSearch').fill('SPAJ-S682M');
  await page.waitForFunction(()=>[...document.querySelectorAll('#rodCatalogModel option')].some(o=>(o.textContent||'').includes('NEW SOLPARA AJING · SPAJ-S682M')),{timeout:15000});
  await context.setOffline(false);

  assert.equal(pageErrors.length,0,`page errors\n${pageErrors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`console errors\n${consoleErrors.join('\n')}`);
  console.log(`MAJOR CRAFT BROWSER QA PASS · 33 rods / ${EXPECTED} total / save / offline`);
  await context.close();
}finally{await browser.close()}
