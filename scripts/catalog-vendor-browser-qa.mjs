import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';
const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const KEY='fish_target_v17_tackle';
const manifest=JSON.parse(readFileSync(new URL('../catalog-batch-manifest.json',import.meta.url),'utf8'));
const EXPECTED=14+manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);
const browser=await chromium.launch({headless:true});
async function waitApp(page){await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_CATALOG_LOADER&&document.querySelector('.v19TackleShortcut')),{timeout:15000})}
async function open(page){await page.locator('.v19TackleShortcut').click();await page.locator('#tackleSheet').waitFor({state:'visible'});await page.waitForFunction(n=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready'&&globalThis.FISH_TARGET_CATALOG?.products?.length===n,EXPECTED,{timeout:20000})}
async function chooseRod(page,maker,series,query,expected){await page.locator('#rodCatalogMaker').selectOption({label:maker});await page.locator('#rodCatalogSeries').selectOption({label:series});await page.locator('#rodCatalogSearch').fill(query);await page.waitForFunction(text=>[...document.querySelectorAll('#rodCatalogModel option')].some(o=>(o.textContent||'').includes(text)),expected,{timeout:15000});const opt=page.locator('#rodCatalogModel option').filter({hasText:expected}).first();const value=await opt.getAttribute('value');assert.ok(value,expected);await page.locator('#rodCatalogModel').selectOption(value);return value}
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});await waitApp(page);await open(page);
  const makers=await page.locator('#rodCatalogMaker option').allTextContents();for(const m of ['TAILWALK','JACKSON','PROX'])assert.ok(makers.includes(m),`${m} maker option`);

  const tailId=await chooseRod(page,'TAILWALK','FULLRANGE [New Gen]','C66L','C66L');await page.locator('#addCatalogRod').click();
  let saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);let rod=saved.rods.find(x=>x.product_id===tailId);assert.ok(rod,'tailwalk saved');assert.equal(rod.length,6.5);assert.equal(rod.maxLure,10.63);

  const jacksonId=await chooseRod(page,'JACKSON','SURF TRIBE','STHS-1062M','STHS-1062M');await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===jacksonId);assert.ok(rod,'Jackson saved');assert.equal(rod.length,10.5);assert.equal(rod.power,'M');assert.equal(rod.maxLure,45);

  const proxId=await chooseRod(page,'PROX','GRAVIS TAMAN AIR-K','GTAK850','GTAK850');await page.locator('#addCatalogRod').click();
  saved=await page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{"rods":[]}'),KEY);rod=saved.rods.find(x=>x.product_id===proxId);assert.ok(rod,'PROX saved');assert.equal(rod.length,16.404);assert.equal(rod.maxLure,null);

  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));await page.locator('#tackleClose').click();await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded',timeout:20000});await waitApp(page);await open(page);
  const owned=await page.locator('#tackleOwned').textContent();for(const text of ['FULLRANGE [New Gen] C66L','SURF TRIBE STHS-1062M','GRAVIS TAMAN AIR-K GTAK850'])assert.ok((owned||'').includes(text),`offline saved ${text}`);
  assert.equal(errors.length,0,errors.join('\n'));console.log(`CATALOG VENDOR BROWSER QA PASS · ${EXPECTED} rows · TAILWALK/JACKSON/PROX`);await context.close();
}finally{await browser.close()}
