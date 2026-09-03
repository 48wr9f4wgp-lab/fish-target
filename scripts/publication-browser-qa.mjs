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
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===63,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_METHOD_STATUS?.plans===158&&globalThis.FISH_TARGET_METHOD_REGISTRY?.count===158,{timeout:15000});

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
    tackleSetResolver:globalThis.FISH_TARGET_TACKLE_SET_RESOLVER?.version||null,
    autoBuild:globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.version||null,
    targets:document.querySelectorAll('#grid .fish').length,
    plans:globalThis.FISH_TARGET_METHOD_REGISTRY?.count
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
  assert.equal(boot.tackleSetResolver,'TACKLE-SET-RESOLVER-V31','spec/MY SET resolver must remain in publication shell');
  assert.equal(boot.autoBuild,'TACKLE-AUTO-BUILD-V32','AUTO BUILD core must remain in publication shell');
  assert.equal(boot.targets,63,'publication build must retain all target decisions');
  assert.equal(boot.plans,158,'publication build must retain all approved fishing plans');
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
  await page.locator('button.fish[data-fish="カツオ"]').click();
  await page.locator('#result.on').waitFor({state:'visible'});
  const picker=page.locator('#methodPickerV1');
  const change=page.locator('#ux23MethodChange');
  if(!(await picker.isVisible()))await change.click();
  await picker.locator('[data-method-id="offshore-jigging"]').click();
  assert.equal((await page.locator('#pmethod').textContent()||'').trim(),'オフショアジギング','publication keeps Katsuo offshore jigging');
  assert.equal((await page.locator('#firstBait').textContent()||'').trim(),'メタルジグ','publication keeps Katsuo FIRST CAST');
  assert.equal(await page.locator('#lureCatalogPanel').count(),0,'publication never mounts research lure panel for Katsuo');
  await page.locator('#tackleFitBody').waitFor({state:'visible'});
  const fitText=await page.locator('#tackleFitBody').innerText();
  assert.match(fitText,/PUBLICATION MANUAL|このセット|条件付き|見直し|推奨/,'manual MY TACKLE must participate in result decision UI');

  await page.locator('#autoBuildRunV29').waitFor({state:'visible'});
  assert.equal(await page.locator('#autoBuildRunV29').isEnabled(),true,'Catalog OFF must not disable AUTO BUILD core');
  const ownedBeforeAuto=await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle'));
  await page.locator('#autoBuildRunV29').click();
  await page.waitForFunction(()=>['ready','error'].includes(globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status),{timeout:10000});
  const auto=await page.evaluate(()=>({
    state:globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.(),
    catalog:{disabled:globalThis.FISH_TARGET_CATALOG_LOADER?.disabled===true,status:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status||null,productCount:globalThis.FISH_TARGET_CATALOG_LOADER?.state?.productCount||0},
    owned:localStorage.getItem('fish_target_v17_tackle')
  }));
  assert.equal(auto.state?.status,'ready',`publication AUTO BUILD must resolve without Catalog: ${JSON.stringify(auto)}`);
  assert.ok(auto.state?.setResult?.idealSet,'publication AUTO BUILD must return idealSet');
  assert.ok(auto.state?.setResult?.myBestSet,'publication AUTO BUILD must evaluate manual MY TACKLE');
  assert.equal(auto.state.catalogReady,false,'publication must not expose product picks');
  assert.equal(auto.catalog.disabled,true,'publication Catalog loader remains fail closed');
  assert.equal(auto.catalog.productCount,0,'publication AUTO BUILD must not hydrate product rows');
  assert.equal(auto.owned,ownedBeforeAuto,'publication AUTO BUILD must not mutate MY TACKLE');
  assert.deepEqual(await page.locator('.autoBuildSetSummaryV31 article>span').allTextContents(),['IDEAL SET','MY SET','MISSING']);
  assert.equal(await page.locator('#autoBuildDetailsV31').getAttribute('hidden'),'','product detail remains hidden when Catalog is off');

  assert.deepEqual(pageErrors,[],'publication smoke must not raise page errors');
  assert.deepEqual(localFailures,[],'publication smoke must not request missing local assets');
  assert.deepEqual(removedBinaryRequests,[],'publication runtime must not request excluded unverified fish binary');
  assert.deepEqual(lureRequests,[],'publication runtime must never request research lure assets');
  console.log('PUBLICATION BROWSER QA PASS · 63 targets · 158 plans · Catalog off · AUTO BUILD spec/MY SET operational · lure Catalog off · Katsuo jigging operational · manual MY TACKLE operational · external network blocked');
}catch(error){
  primaryError=error;
}finally{
  if(context)await context.close().catch(()=>{});
  if(browser)await browser.close().catch(()=>{});
  try{build(false)}catch(error){if(!primaryError)primaryError=error;else console.error(error)}
}
if(primaryError)throw primaryError;
