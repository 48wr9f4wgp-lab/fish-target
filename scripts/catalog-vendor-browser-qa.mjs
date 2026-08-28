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
  const makers=await page.locator('#rodCatalogMaker option').allTextContents();for(const m of ['TAILWALK','JACKSON','PROX','FISHMAN','YAMAGA BLANKS','TENRYU'])assert.ok(makers.includes(m),`${m} maker option`);

  const tailId=await chooseRod(page,'TAILWALK','FULLRANGE [New Gen]','C66L','C66L');await page.locator('#addCatalogRod').click();
  let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);let rod=saved.rods.find(x=>x.product_id===tailId);assert.ok(rod,'tailwalk saved');assert.equal(rod.length,6.5);assert.equal(rod.maxLure,10.63);

  const jacksonId=await chooseRod(page,'JACKSON','SURF TRIBE','STHS-1062M','STHS-1062M');await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===jacksonId);assert.ok(rod,'Jackson saved');assert.equal(rod.length,10.5);assert.equal(rod.power,'M');assert.equal(rod.maxLure,45);

  const proxId=await chooseRod(page,'PROX','GRAVIS TAMAN AIR-K','GTAK850','GTAK850');await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===proxId);assert.ok(rod,'PROX saved');assert.equal(rod.length,16.404);assert.equal(rod.maxLure,null);

  const fishmanId=await chooseRod(page,'FISHMAN','Beams','calmer8.6M','calmer8.6M');
  await page.waitForFunction(()=>{const t=document.querySelector('#rodCatalogPreview')?.textContent||'';return t.includes('calmer8.6M')&&t.includes('8ft6in')&&t.includes('M')},null,{timeout:15000});
  const fishmanPreview=await page.locator('#rodCatalogPreview').textContent()||'';assert.ok(fishmanPreview.includes('8ft6in'),'Fishman official raw length visible');assert.ok(fishmanPreview.includes('2.5～4.5号'),'Fishman official egi range visible');assert.ok(fishmanPreview.includes('M'),'Fishman power visible');
  const fishmanRuntime=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),fishmanId);assert.equal(fishmanRuntime.specs.length_ft,8.5,'numeric length is derived only for fit logic');assert.equal(fishmanRuntime.specs.lure_weight_raw,'2.5～4.5号');assert.equal(fishmanRuntime.specs.lure_min_g,null);assert.equal(fishmanRuntime.specs.lure_max_g,null);
  const discontinued=await page.evaluate(()=>globalThis.FISH_TARGET_CATALOG.list({maker:'FISHMAN',series:'Beams'}).find(x=>x.model==='blancsierra5.2UL')?.status);assert.equal(discontinued,'discontinued');
  await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===fishmanId);assert.ok(rod,'Fishman saved');assert.equal(rod.length,8.5);assert.equal(rod.power,'M');assert.equal(rod.maxLure,null,'egi size is not converted to grams');

  const blueId=await chooseRod(page,'YAMAGA BLANKS','BlueCurrentⅢ','78/B','78/B');
  await page.waitForFunction(()=>{const t=document.querySelector('#rodCatalogPreview')?.textContent||'';return t.includes('BlueCurrentⅢ 78/B')&&t.includes('2350mm')&&t.includes('MAX15g')},null,{timeout:15000});
  const blueRuntime=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),blueId);assert.equal(blueRuntime.specs.length_ft,7.71);assert.equal(blueRuntime.specs.lure_min_g,null);assert.equal(blueRuntime.specs.lure_max_g,15);assert.equal(blueRuntime.identifiers.jan,'4571584101682');
  await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===blueId);assert.ok(rod,'YAMAGA BlueCurrent saved');assert.equal(rod.length,7.71);assert.equal(rod.maxLure,15);

  const calistaId=await chooseRod(page,'YAMAGA BLANKS','Calista','82ML/AR','82ML/AR');
  await page.waitForFunction(()=>{const t=document.querySelector('#rodCatalogPreview')?.textContent||'';return t.includes('Calista 82ML/AR')&&t.includes('2496mm')&&t.includes('Egi 2.5~3.5号')},null,{timeout:15000});
  const calistaRuntime=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),calistaId);assert.equal(calistaRuntime.specs.length_ft,8.189);assert.equal(calistaRuntime.specs.power,'ML');assert.equal(calistaRuntime.specs.lure_weight_raw,'Egi 2.5~3.5号');assert.equal(calistaRuntime.specs.lure_min_g,null);assert.equal(calistaRuntime.specs.lure_max_g,null);
  await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===calistaId);assert.ok(rod,'YAMAGA Calista saved');assert.equal(rod.length,8.189);assert.equal(rod.power,'ML');assert.equal(rod.maxLure,null,'Calista egi size is not converted to grams');

  const rayzId=await chooseRod(page,'TENRYU','Rayz Spectra','RZS712S-ML','RZS712S-ML');
  await page.waitForFunction(()=>{const t=document.querySelector('#rodCatalogPreview')?.textContent||'';return t.includes('Rayz Spectra RZS712S-ML')&&t.includes("2.16m [7'1\"]")&&t.includes('3-18g')},null,{timeout:15000});
  const rayzRuntime=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),rayzId);assert.equal(rayzRuntime.specs.length_ft,7.087);assert.equal(rayzRuntime.specs.power,'ML');assert.equal(rayzRuntime.specs.lure_min_g,3);assert.equal(rayzRuntime.specs.lure_max_g,18);assert.equal(rayzRuntime.identifiers.product_code,'023632');assert.equal(rayzRuntime.identifiers.jan,undefined);
  await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===rayzId);assert.ok(rod,'TENRYU Rayz saved');assert.equal(rod.length,7.087);assert.equal(rod.power,'ML');assert.equal(rod.maxLure,18);

  const horizonId=await chooseRod(page,'TENRYU','HORIZON MJ','HMJ5101B-M','HMJ5101B-M');
  await page.waitForFunction(()=>{const t=document.querySelector('#rodCatalogPreview')?.textContent||'';return t.includes('HORIZON MJ HMJ5101B-M')&&t.includes("1.78m [5'10\"]")&&t.includes('High100-180g / Slow150-350g')},null,{timeout:15000});
  const horizonRuntime=await page.evaluate(id=>globalThis.FISH_TARGET_CATALOG.get(id),horizonId);assert.equal(horizonRuntime.specs.length_ft,5.84);assert.equal(horizonRuntime.specs.power,'M');assert.equal(horizonRuntime.specs.lure_min_g,null);assert.equal(horizonRuntime.specs.lure_max_g,null);assert.equal(horizonRuntime.identifiers.product_code,'022024');
  await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===horizonId);assert.ok(rod,'TENRYU HORIZON saved');assert.equal(rod.length,5.84);assert.equal(rod.power,'M');assert.equal(rod.maxLure,null,'dual-mode jig range stays raw');

  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.locator('#tackleClose').click();await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded',timeout:20000});await waitApp(page);await open(page);
  const owned=await page.locator('#tackleOwned').textContent();for(const text of ['FULLRANGE [New Gen] C66L','SURF TRIBE STHS-1062M','GRAVIS TAMAN AIR-K GTAK850','Beams calmer8.6M','BlueCurrentⅢ 78/B','Calista 82ML/AR','Rayz Spectra RZS712S-ML','HORIZON MJ HMJ5101B-M'])assert.ok((owned||'').includes(text),`offline saved ${text}`);
  assert.equal(errors.length,0,errors.join('\n'));console.log(`CATALOG VENDOR BROWSER QA PASS · ${EXPECTED} rows · TAILWALK/JACKSON/PROX/FISHMAN/YAMAGA/TENRYU`);await context.close();
}finally{await browser.close()}
