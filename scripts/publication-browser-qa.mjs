import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const build=publication=>{
  const result=spawnSync(process.execPath,['scripts/build.mjs'],{
    env:{...process.env,FISH_TARGET_PUBLICATION_BUILD:publication?'1':'0'},
    stdio:'inherit'
  });
  if(result.status!==0)throw new Error(`${publication?'publication':'research'} build failed with ${result.status}`);
};

let browser=null;
let context=null;
let primaryError=null;
try{
  build(true);
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  const pageErrors=[];
  const localFailures=[];
  const removedBinaryRequests=[];
  const lureRequests=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  page.on('request',request=>{
    const url=request.url();
    if(url.includes('fish-real-v7.avif'))removedBinaryRequests.push(url);
    if(url.includes('lure-catalog'))lureRequests.push(url);
  });
  page.on('requestfailed',request=>{
    const url=new URL(request.url());
    if(url.hostname==='127.0.0.1'||url.hostname==='localhost')localFailures.push(`${url.pathname}: ${request.failure()?.errorText||'failed'}`);
  });
  await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.hostname==='127.0.0.1'||url.hostname==='localhost')return route.continue();
    return route.abort('blockedbyclient');
  });

  await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),{timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===62,{timeout:15000});

  const boot=await page.evaluate(()=>({
    publication:document.documentElement.dataset.publicationBuild,
    catalogRuntime:document.documentElement.dataset.catalogRuntime,
    catalogPublication:document.documentElement.dataset.catalogPublication,
    lureCatalogRuntime:document.documentElement.dataset.lureCatalogRuntime,
    lureCatalogTargets:document.documentElement.dataset.lureCatalogTargets,
    catalogLoaderDisabled:globalThis.FISH_TARGET_CATALOG_LOADER?.disabled===true,
    catalogFacadePresent:Boolean(globalThis.FISH_TARGET_CATALOG),
    lureEntryPresent:Boolean(globalThis.FISH_TARGET_LURE_CATALOG_ENTRY),
    lureLoaderPresent:Boolean(globalThis.FISH_TARGET_LURE_CATALOG),
    targets:document.querySelectorAll('#grid .fish').length
  }));
  assert.equal(boot.publication,'on');
  assert.equal(boot.catalogRuntime,'off');
  assert.equal(boot.catalogPublication,'on');
  assert.equal(boot.lureCatalogRuntime,'off');
  assert.equal(boot.lureCatalogTargets,'');
  assert.equal(boot.catalogLoaderDisabled,true,'publication loader must fail closed');
  assert.equal(boot.catalogFacadePresent,false,'publication build with zero approved batches must not expose Catalog facade');
  assert.equal(boot.lureEntryPresent,false,'publication build must not expose research lure UI');
  assert.equal(boot.lureLoaderPresent,false,'publication build must not expose research lure loader');
  assert.equal(boot.targets,62,'publication build must retain all target decisions');
  assert.deepEqual(lureRequests,[],'publication boot must never request research lure assets');

  const tackleTab=page.locator('#appTabBarV26 [data-app-tab="tackle"]');
  await tackleTab.waitFor({state:'visible'});
  await tackleTab.click();
  await page.locator('#tackleSheet').waitFor({state:'visible'});
  assert.equal(await page.locator('.catalogUnavailable').count(),2,'rod and reel must expose manual fallback instead of Catalog');
  assert.equal(await page.locator('#rodManualPanel').isVisible(),true);
  assert.equal(await page.locator('#reelManualPanel').isVisible(),true);
  assert.equal(await page.locator('.tackleEntryModes').count(),0,'publication mode must not expose Catalog/manual mode switch');

  await page.locator('#rodName').fill('PUBLICATION MANUAL ROD');
  await page.locator('#rodLength').fill('9.6');
  await page.locator('#rodPower').selectOption({label:'MH'});
  await page.locator('#rodMaxLure').fill('60');
  await page.locator('#addRod').click();
  await page.locator('#reelName').fill('PUBLICATION MANUAL REEL');
  await page.locator('#reelSize').fill('4000');
  await page.locator('#reelLineType').selectOption({label:'PE'});
  await page.locator('#reelLineNo').fill('1.5');
  await page.locator('#addReel').click();

  const owned=page.locator('#tackleOwned .ownedRow');
  await owned.first().waitFor({state:'visible'});
  assert.equal(await owned.count(),2,'publication build must persist manual rod and reel');
  const ownedText=await page.locator('#tackleOwned').innerText();
  assert.match(ownedText,/PUBLICATION MANUAL ROD/);
  assert.match(ownedText,/PUBLICATION MANUAL REEL/);
  assert.doesNotMatch(ownedText,/CATALOG/,'publication-owned rows must remain manual-only');

  await page.locator('#tackleClose').click();
  await page.locator('#grid .fish').first().click();
  await page.locator('#result.on').waitFor({state:'visible'});
  await page.locator('#tackleFitBody').waitFor({state:'visible'});
  const fitText=await page.locator('#tackleFitBody').innerText();
  assert.match(fitText,/PUBLICATION MANUAL|このセット|条件付き|見直し|推奨/,'manual MY TACKLE must participate in result decision UI');

  assert.deepEqual(pageErrors,[],'publication smoke must not raise page errors');
  assert.deepEqual(localFailures,[],'publication smoke must not request missing local assets');
  assert.deepEqual(removedBinaryRequests,[],'publication runtime must not request excluded unverified fish binary');
  assert.deepEqual(lureRequests,[],'publication runtime must never request research lure assets');
  console.log('PUBLICATION BROWSER QA PASS · 62 targets · Catalog off · lure Catalog off · manual MY TACKLE operational · external network blocked');
}catch(error){
  primaryError=error;
}finally{
  if(context)await context.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  try{build(false)}catch(error){if(!primaryError)primaryError=error;else console.error(error)}
}
if(primaryError)throw primaryError;