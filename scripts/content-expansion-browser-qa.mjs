import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const lureAsset=url=>{try{return new URL(url).pathname.split('/').pop()||''}catch{return ''}};
const text=async(page,selector)=>(await page.locator(selector).textContent()||'').trim();
const has=(list,name)=>list.includes(name);
const noLureRequests=list=>list.filter(name=>name.startsWith('lure-catalog'));

async function waitApp(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===64,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_METHOD_STATUS?.targets===64&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===159,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_SPECIES_REGISTRY?.count===64&&globalThis.FISH_TARGET_METHOD_REGISTRY?.count===159,{timeout:15000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_CATALOG_LOADER&&document.querySelector('.v19TackleShortcut')),{timeout:15000});
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

async function assertRodSearch(page,series,query,modelName,displayName){
  const maker=page.locator('#rodCatalogMaker'),seriesSelect=page.locator('#rodCatalogSeries'),model=page.locator('#rodCatalogModel'),search=page.locator('#rodCatalogSearch');
  await maker.selectOption({label:'DAIWA'});
  await page.waitForFunction(series=>[...document.querySelectorAll('#rodCatalogSeries option')].some(option=>(option.textContent||'').trim()===series),series,{timeout:10000});
  await seriesSelect.selectOption({label:series});
  await search.fill(query);
  const resultLabel=`${series} · ${modelName}`;
  await page.waitForFunction(expected=>[...document.querySelectorAll('#rodCatalogModel option')].some(option=>(option.textContent||'').includes(expected)),resultLabel,{timeout:10000});
  const candidate=model.locator('option').filter({hasText:resultLabel}).first();
  const value=await candidate.getAttribute('value');
  assert.ok(value,`${displayName} search result exposes stable product id`);
  await model.selectOption(value);
  await page.waitForFunction(expected=>(document.getElementById('rodCatalogPreview')?.textContent||'').includes(expected),displayName,{timeout:10000});
  assert.match(await text(page,'#rodCatalogPreview'),new RegExp(displayName.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`${displayName} is searchable and previewable`);
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

  assert.equal(await page.locator('#grid .fish').count(),64,'content expansion renders 64 targets');
  assert.equal(await text(page,'#home .heroStats span:nth-of-type(1)'),'64魚種','hero species count');
  assert.ok((await page.locator('#home .heroStats').textContent()||'').includes('159釣法プラン'),'hero plan count');
  assert.deepEqual(noLureRequests(requests),[],'startup performs zero lure catalog requests');
  for(const fish of ['カマス','オオモンハタ','アマダイ','アカムツ'])assert.equal(await page.locator(`button.fish[data-fish="${fish}"]`).count(),1,`${fish} target is selectable`);

  const catalogCold=await page.evaluate(()=>({status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status,count:globalThis.FISH_TARGET_CATALOG?.products?.length||0}));
  assert.deepEqual(catalogCold,{status:'idle',count:0},'rod/reel catalog remains unloaded at startup');
  await page.locator('.v19TackleShortcut').click();
  await page.locator('#tackleSheet').waitFor({state:'visible'});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready'&&globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount===989,{timeout:20000});
  assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_CATALOG_LOADER.state.batchCount),47,'47 rod/reel catalog batches load only after MY TACKLE intent');
  await assertRodSearch(page,'GEKKABIJIN MEBARU','83M','83M-T・N','月下美人 83M-T・N');
  await assertRodSearch(page,'OUTRAGE BR LC','LC70','LC70-2.5','OUTRAGE BR LC70-2.5');
  await assertRodSearch(page,'LIGHT AMADAI X','190','190・R','ライトアマダイ X 190・R');
  await assertRodSearch(page,'NEOSTAGE DG','J63B','J63B-2','Neostage DG J63B-2');
  assert.deepEqual(noLureRequests(requests),[],'opening rod/reel catalog never loads lure catalog');
  await page.locator('#tackleClose').click();
  await page.locator('#tackleSheet').waitFor({state:'hidden'});

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
  await backHome(page);

  await openTarget(page,'アマダイ');
  assert.equal(await text(page,'#pmethod'),'ライト天秤アマダイ','Amadai default method');
  assert.equal(await text(page,'#firstBait'),'オキアミ','Amadai bait FIRST CAST');
  await selectMethod(page,'amadai-tairubber');
  assert.equal(await text(page,'#pmethod'),'アマラバ（タイラバ）','Amadai lure method selectable');
  assert.equal(await text(page,'#firstBait'),'ブレード付きタイラバ（アマダイチューン）','Amadai lure FIRST CAST');
  await backHome(page);

  await openTarget(page,'アカムツ');
  assert.equal(await text(page,'#pmethod'),'中深場・胴突き餌釣り','Akamutsu default method');
  assert.match(await text(page,'#firstBait'),/ホタルイカ/,'Akamutsu bait FIRST CAST');
  await selectMethod(page,'electric-slow-jig');
  assert.equal(await text(page,'#pmethod'),'電動スロージギング','Akamutsu electric slow method selectable');
  assert.equal(await text(page,'#firstBait'),'スロー系メタルジグ','Akamutsu lure FIRST CAST');

  const layout=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
  assert.ok(layout.doc<=391&&layout.body<=391&&layout.viewport===390,'390px result remains overflow-free');
  assert.deepEqual(pageErrors,[],'content expansion browser path has no page errors');
  assert.deepEqual(consoleErrors,[],'content expansion browser path has no console errors');

  await context.close();
  console.log('CONTENT_EXPANSION_BROWSER_QA_PASS',JSON.stringify({species:64,plans:159,catalogProducts:989,catalogBatches:47,lureRequests:requests,renderedKamasu:3,batch2:['アマダイ','アカムツ']}));
}finally{
  await browser.close();
}
