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
async function choose(page,series,model){await page.locator('#rodCatalogMaker').selectOption({label:'TICT'});await page.locator('#rodCatalogSeries').selectOption({label:series});await page.locator('#rodCatalogSearch').fill(model);const value=await page.waitForFunction(({series,model})=>[...document.querySelectorAll('#rodCatalogModel option')].find(o=>{const t=(o.textContent||'').trim();return t===model||t.startsWith(`${model} ·`)||t===`${series} · ${model}`||t.startsWith(`${series} · ${model} ·`)})?.value||null,{series,model},{timeout:15000}).then(h=>h.jsonValue());assert.ok(value,`${series} ${model}`);await page.locator('#rodCatalogModel').selectOption(value);await page.locator('#rodCatalogModel').dispatchEvent('change');return value}
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});await waitApp(page);await open(page);
  const makers=await page.locator('#rodCatalogMaker option').allTextContents();assert.ok(makers.includes('TICT'),'TICT maker option');

  const exrId=await choose(page,'SRAM EXR','EXR-66T-Sis');
  await page.waitForFunction(()=>{const t=document.querySelector('#rodCatalogPreview')?.textContent||'';return t.includes('EXR-66T-Sis')&&t.includes("6'6\" (199cm)")&&t.includes('1～4g')},null,{timeout:15000});
  const exr=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),exrId);assert.equal(exr.specs.length_ft,6.529);assert.equal(exr.specs.lure_max_g,4);assert.equal(exr.specs.line_pe_min,0.15);assert.equal(exr.identifiers.jan,'4988540223324');
  await page.locator('#addCatalogRod').click();
  let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);let rod=saved.rods.find(x=>x.product_id===exrId);assert.ok(rod,'TICT EXR saved');assert.equal(rod.length,6.529);assert.equal(rod.maxLure,4);

  const iceId=await choose(page,'ICE CUBE','IC-90TG-Sis');
  await page.waitForFunction(()=>{const t=document.querySelector('#rodCatalogPreview')?.textContent||'';return t.includes('IC-90TG-Sis')&&t.includes("9'0\" (276cm)")&&t.includes('0.8～21g')},null,{timeout:15000});
  const ice=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),iceId);assert.equal(ice.specs.length_ft,9.055);assert.equal(ice.specs.lure_max_g,21);assert.equal(ice.specs.line_pe_min,0.2);assert.equal(ice.identifiers.jan,'4988540223515');
  await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===iceId);assert.ok(rod,'TICT ICE CUBE saved');assert.equal(rod.length,9.055);assert.equal(rod.maxLure,21);

  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.locator('#tackleClose').click();await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded',timeout:20000});await waitApp(page);await open(page);
  const owned=await page.locator('#tackleOwned').textContent()||'';assert.ok(owned.includes('SRAM EXR EXR-66T-Sis'),'offline TICT EXR');assert.ok(owned.includes('ICE CUBE IC-90TG-Sis'),'offline TICT ICE CUBE');
  assert.equal(errors.length,0,errors.join('\n'));console.log(`TICT BROWSER QA PASS · ${EXPECTED} rows / save / offline`);await context.close();
}finally{await browser.close()}
