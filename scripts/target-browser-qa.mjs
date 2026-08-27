import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const VIEWPORTS=[{width:375,height:812},{width:390,height:844},{width:430,height:932}];

async function waitExpanded(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===35,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_METHOD_STATUS?.targets===35&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===67,{timeout:15000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_VISUAL_V8&&document.getElementById('tackleManage')),{timeout:15000});
}

async function noOverflow(page,width,label){
  const x=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
  assert.ok(x.doc<=width+1,`${label}: document overflow ${x.doc}>${width}`);
  assert.ok(x.body<=width+1,`${label}: body overflow ${x.body}>${width}`);
  assert.equal(x.viewport,width,`${label}: viewport`);
}

async function openTarget(page,name){
  await page.locator(`button.fish[data-fish="${name}"]`).click();
  await page.locator('#result.on').waitFor({state:'visible'});
  assert.equal((await page.locator('#rname').textContent()||'').trim(),name);
}

async function runViewport(browser,{width,height}){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'allow'});
  const page=await context.newPage();
  const errors=[];const consoleErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await waitExpanded(page);
  assert.equal(await page.locator('#grid .fish').count(),35,`${width}: target count`);
  assert.equal((await page.locator('#home .heroStats span').first().textContent()||'').trim(),'35魚種',`${width}: hero target count`);
  assert.ok((await page.locator('#home .heroStats').textContent()||'').includes('67釣法プラン'),`${width}: plan count`);
  await noOverflow(page,width,`${width} home`);

  // Multi-style filtering: サバ defaults to bait but must remain discoverable under lure.
  await page.locator('#styleFilters button[data-v="lure"]').click();
  assert.equal(await page.locator('button.fish[data-fish="サバ"]').count(),1,`${width}: multi-style target remains in lure filter`);
  await page.locator('#styleFilters button[data-v="all"]').click();

  // Method names participate in search.
  await page.locator('#q').fill('ハゼクランク');
  assert.equal(await page.locator('button.fish[data-fish="ハゼ"]').count(),1,`${width}: method search resolves target`);
  await page.locator('#clearSearch').click();

  await openTarget(page,'サバ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id]').count(),3,`${width}: サバ method count`);
  assert.equal((await page.locator('#pmethod').textContent()||'').trim(),'サビキ釣り',`${width}: default method`);
  await page.locator('#methodPickerV1 [data-method-id="lure"]').click();
  assert.equal((await page.locator('#pmethod').textContent()||'').trim(),'ライトゲーム/小型メタルジグ',`${width}: alternate method selected`);
  assert.ok((await page.locator('#firstBait').textContent()||'').trim(),`${width}: FIRST CAST`);
  assert.ok(await page.locator('#gear .gearItem').count()>=4,`${width}: tackle`);
  assert.ok(await page.locator('#steps .step').count()>=3,`${width}: steps`);
  await noOverflow(page,width,`${width} result`);

  if(width===390){
    // Selected method must flow through FIELD MODE.
    await page.locator('#fieldModeBtn').click();
    await page.locator('#fieldmode.on').waitFor({state:'visible'});
    assert.equal((await page.locator('#fmFish').textContent()||'').trim(),'サバ','FIELD MODE target');
    assert.ok((await page.locator('#fmBait').textContent()||'').trim(),'FIELD MODE FIRST CAST');
    await page.locator('#fmBackPlan').click();
    await page.locator('#result.on').waitFor({state:'visible'});

    // Save must persist methodKey and restore the exact method after reload.
    await page.locator('#save').click();
    let saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9')||'[]'));
    const row=saved.find(x=>x.fish==='サバ');
    assert.equal(row?.methodKey,'lure','saved methodKey');
    await page.reload({waitUntil:'networkidle'});
    await waitExpanded(page);
    await page.locator('.nav button[data-v="saved"]').click();
    await page.locator('#savedList .saveRow').filter({hasText:'サバ'}).locator('.op').click();
    await page.locator('#result.on').waitFor({state:'visible'});
    assert.equal((await page.locator('#pmethod').textContent()||'').trim(),'ライトゲーム/小型メタルジグ','saved method restored');

    // MY TACKLE remains reachable with the expansion controller in front of its render wrapper.
    await page.locator('.nav button[data-v="home"]').click();
    await page.locator('.v19TackleShortcut').click();
    await page.locator('#tackleSheet').waitFor({state:'visible'});
    assert.ok(await page.locator('#rodCatalogMaker option').count()>=2,'catalog maker selector survives expansion');
    await page.locator('#tackleClose').click();

    // All expansion assets are part of the offline shell.
    await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
    await page.reload({waitUntil:'networkidle'});
    await waitExpanded(page);
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded',timeout:20000});
    await waitExpanded(page);
    assert.equal(await page.locator('#grid .fish').count(),35,'offline target expansion available');
    await context.setOffline(false);
  }

  assert.equal(errors.length,0,`${width}: page errors\n${errors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`${width}: console errors\n${consoleErrors.join('\n')}`);
  console.log(`PASS TARGET1 browser ${width}px`);
  await context.close();
}

const browser=await chromium.launch({headless:true});
try{
  for(const viewport of VIEWPORTS)await runViewport(browser,viewport);
  console.log('TARGET METHOD BROWSER QA PASS');
}finally{
  await browser.close();
}
