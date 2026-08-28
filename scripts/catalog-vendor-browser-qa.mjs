import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const KEY='fish_target_v17_tackle';
const manifest=JSON.parse(readFileSync(new URL('../catalog-batch-manifest.json',import.meta.url),'utf8'));
const EXPECTED=14+manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);
const browser=await chromium.launch({headless:true});
async function waitApp(page){await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_CATALOG_LOADER&&document.querySelector('.v19TackleShortcut')),null,{timeout:15000})}
async function open(page){await page.locator('.v19TackleShortcut').click();await page.locator('#tackleSheet').waitFor({state:'visible'});await page.waitForFunction(n=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready'&&globalThis.FISH_TARGET_CATALOG?.products?.length===n,EXPECTED,{timeout:20000})}
async function chooseRod(page,maker,series,query,expected){await page.locator('#rodCatalogMaker').selectOption({label:maker});await page.locator('#rodCatalogSeries').selectOption({label:series});await page.locator('#rodCatalogSearch').fill(query);await page.waitForFunction(text=>[...document.querySelectorAll('#rodCatalogModel option')].some(o=>(o.textContent||'').includes(text)),expected,{timeout:15000});const opt=page.locator('#rodCatalogModel option').filter({hasText:expected}).first();const value=await opt.getAttribute('value');assert.ok(value,expected);const model=page.locator('#rodCatalogModel');await model.selectOption(value);await model.dispatchEvent('change');return value}
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});await waitApp(page);await open(page);
  const makers=await page.locator('#rodCatalogMaker option').allTextContents();for(const m of ['TAILWALK','JACKSON','PROX','FISHMAN'])assert.ok(makers.includes(m),`${m} maker option`);

  const tailId=await chooseRod(page,'TAILWALK','FULLRANGE [New Gen]','C66L','C66L');await page.locator('#addCatalogRod').click();
  let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);let rod=saved.rods.find(x=>x.product_id===tailId);assert.ok(rod,'tailwalk saved');assert.equal(rod.length,6.5);assert.equal(rod.maxLure,10.63);

  const jacksonId=await chooseRod(page,'JACKSON','SURF TRIBE','STHS-1062M','STHS-1062M');await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===jacksonId);assert.ok(rod,'Jackson saved');assert.equal(rod.length,10.5);assert.equal(rod.power,'M');assert.equal(rod.maxLure,45);

  const proxId=await chooseRod(page,'PROX','GRAVIS TAMAN AIR-K','GTAK850','GTAK850');await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===proxId);assert.ok(rod,'PROX saved');assert.equal(rod.length,16.404);assert.equal(rod.maxLure,null);

  const fishmanId=await chooseRod(page,'FISHMAN','Beams','calmer8.6M','calmer8.6M');
  await page.waitForTimeout(150);
  const fishmanDebug=await page.evaluate(id=>{const selected=document.querySelector('#rodCatalogModel')?.value||'';const selectedProduct=globalThis.FISH_TARGET_CATALOG.get(selected);const expectedProduct=globalThis.FISH_TARGET_CATALOG.get(id);return {expected:id,selected,preview:document.querySelector('#rodCatalogPreview')?.textContent||'',expectedProduct:expectedProduct?{product_id:expectedProduct.product_id,model:expectedProduct.model,specs:expectedProduct.specs}:null,selectedProduct:selectedProduct?{product_id:selectedProduct.product_id,model:selectedProduct.model,specs:selectedProduct.specs}:null}},fishmanId);
  console.log('FISHMAN_PREVIEW_DEBUG',JSON.stringify(fishmanDebug));
  assert.equal(fishmanDebug.selected,fishmanId,'Fishman selected product id remains stable after async catalog update');
  assert.equal(fishmanDebug.selectedProduct?.model,'calmer8.6M','Fishman selected runtime product');
  assert.equal(fishmanDebug.selectedProduct?.specs?.length_ft,8.5,'Fishman runtime length');
  assert.equal(fishmanDebug.selectedProduct?.specs?.power,'M','Fishman runtime power');
  const fishmanPreview=fishmanDebug.preview;assert.ok(fishmanPreview.includes('calmer8.6M'),'Fishman model visible in preview');assert.ok(fishmanPreview.includes('8.5ft'),'Fishman derived length visible');assert.ok(fishmanPreview.includes('M'),'Fishman power visible');
  const fishmanRuntime=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),fishmanId);assert.equal(fishmanRuntime.specs.lure_weight_raw,'2.5～4.5号');assert.equal(fishmanRuntime.specs.lure_min_g,null);assert.equal(fishmanRuntime.specs.lure_max_g,null);
  const discontinued=await page.evaluate(()=>globalThis.FISH_TARGET_CATALOG.list({maker:'FISHMAN',series:'Beams'}).find(x=>x.model==='blancsierra5.2UL')?.status);assert.equal(discontinued,'discontinued');
  await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===fishmanId);assert.ok(rod,'Fishman saved');assert.equal(rod.length,8.5);assert.equal(rod.power,'M');assert.equal(rod.maxLure,null,'egi size is not converted to grams');

  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.locator('#tackleClose').click();await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded',timeout:20000});await waitApp(page);await open(page);
  const owned=await page.locator('#tackleOwned').textContent();for(const text of ['FULLRANGE [New Gen] C66L','SURF TRIBE STHS-1062M','GRAVIS TAMAN AIR-K GTAK850','Beams calmer8.6M'])assert.ok((owned||'').includes(text),`offline saved ${text}`);
  assert.equal(errors.length,0,errors.join('\n'));console.log(`CATALOG VENDOR BROWSER QA PASS · ${EXPECTED} rows · TAILWALK/JACKSON/PROX/FISHMAN`);await context.close();
}finally{await browser.close()}
