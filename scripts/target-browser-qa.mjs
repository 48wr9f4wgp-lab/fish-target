import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const VIEWPORTS=[{width:375,height:812},{width:390,height:844},{width:430,height:932}];

async function waitExpanded(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===55,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_METHOD_STATUS?.targets===55&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===105,{timeout:15000});
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

async function backHome(page){
  await page.locator('#back').click();
  await page.locator('#home.on').waitFor({state:'visible'});
}

async function openFilters(page){
  const details=page.locator('#v19FilterDetails');
  if(await details.count()){
    if(!(await details.evaluate(el=>el.open)))await details.locator('summary').click();
    await page.locator('#styleFilters').waitFor({state:'visible'});
  }
}

async function text(page,selector){
  return (await page.locator(selector).textContent()||'').trim();
}

async function runViewport(browser,{width,height}){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'allow'});
  const page=await context.newPage();
  const errors=[];const consoleErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await waitExpanded(page);
  assert.equal(await page.locator('#grid .fish').count(),55,`${width}: target count`);
  assert.equal(await text(page,'#home .heroStats span'),'55魚種',`${width}: hero target count`);
  assert.ok((await page.locator('#home .heroStats').textContent()||'').includes('105釣法プラン'),`${width}: plan count`);
  await noOverflow(page,width,`${width} home`);

  // Multi-style filtering: サバ defaults to bait but must remain discoverable under lure.
  await openFilters(page);
  await page.locator('#styleFilters button[data-v="lure"]').click();
  assert.equal(await page.locator('button.fish[data-fish="サバ"]').count(),1,`${width}: multi-style target remains in lure filter`);
  await page.locator('#styleFilters button[data-v="all"]').click();

  // V1 and V2 alternate method names participate in search.
  await page.locator('#q').fill('ハゼクランク');
  assert.equal(await page.locator('button.fish[data-fish="ハゼ"]').count(),1,`${width}: V1 method search`);
  await page.locator('#clearSearch').click();
  await page.locator('#q').fill('ティップエギング');
  assert.equal(await page.locator('button.fish[data-fish="アオリイカ"]').count(),1,`${width}: V2 method search`);
  await page.locator('#clearSearch').click();

  // Exact propagation gate: one selected method must drive FIRST CAST, required tackle,
  // MY TACKLE fit, field steps, FIELD MODE, save, and restore without falling back.
  await openTarget(page,'サバ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id]').count(),4,`${width}: サバ method count with bishi`);
  assert.equal(await text(page,'#pmethod'),'サビキ釣り',`${width}: default method`);

  await page.evaluate(()=>localStorage.setItem('fish_target_v17_tackle',JSON.stringify({
    rods:[{id:'qa-lure-rod',source:'manual',name:'QA 7.5ft L',length:7.5,power:'L',maxLure:20}],
    reels:[{id:'qa-lure-reel',source:'manual',name:'QA 2500 PE0.6',size:2500,lineType:'PE',lineNo:0.6}]
  })));
  await page.locator('#methodPickerV1 [data-method-id="default"]').click();
  assert.equal(await text(page,'#tackleFitBody .fitSummary b'),'買い足し候補あり',`${width}: default MY TACKLE baseline`);

  await page.locator('#methodPickerV1 [data-method-id="lure"]').click();
  assert.equal(await text(page,'#pmethod'),'ライトゲーム/小型メタルジグ',`${width}: alternate method selected`);
  assert.equal(await text(page,'#firstBait'),'小型メタルジグ',`${width}: FIRST CAST follows selected method`);
  assert.equal(await text(page,'#gear .gearItem:nth-child(1) b'),'7〜8ft / L〜ML',`${width}: selected rod recommendation`);
  assert.equal(await text(page,'#gear .gearItem:nth-child(2) b'),'2000〜3000番',`${width}: selected reel recommendation`);
  assert.equal(await text(page,'#gear .gearItem:nth-child(3) b'),'PE 0.4〜0.8号',`${width}: selected line recommendation`);
  assert.equal(await text(page,'#gear .gearItem:nth-child(4) b'),'フロロ 6〜12lb',`${width}: selected leader recommendation`);
  assert.equal(await text(page,'#steps .step:nth-child(1) .st'),'群れの外へキャスト',`${width}: selected step 1`);
  assert.equal(await text(page,'#steps .step:nth-child(2) .st'),'表層から順に探る',`${width}: selected step 2`);
  assert.equal(await text(page,'#steps .step:nth-child(3) .st'),'深いときはジグを沈めリフト&フォール',`${width}: selected step 3`);
  assert.equal(await text(page,'#tackleFitBody .fitSummary b'),'手持ちで組みやすい',`${width}: MY TACKLE recomputes for selected method`);
  await noOverflow(page,width,`${width} result`);

  if(width===390){
    await page.locator('#fieldModeBtn').click();
    await page.locator('#fieldmode.on').waitFor({state:'visible'});
    assert.equal(await text(page,'#fmFish'),'サバ','FIELD MODE target');
    assert.equal(await text(page,'#fmMethod'),'ライトゲーム/小型メタルジグ','FIELD MODE method');
    assert.equal(await text(page,'#fmBait'),'小型メタルジグ','FIELD MODE FIRST CAST');
    assert.equal(await text(page,'#fmTackle div:nth-child(1) b'),'7〜8ft / L〜ML','FIELD MODE rod');
    assert.equal(await text(page,'#fmTackle div:nth-child(2) b'),'2000〜3000番','FIELD MODE reel');
    assert.equal(await text(page,'#fmSteps .fmStep:nth-child(1) span'),'群れの外へキャスト','FIELD MODE step 1');
    await page.locator('#fmBackPlan').click();
    await page.locator('#result.on').waitFor({state:'visible'});

    await page.locator('#save').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9')||'[]'));
    const row=saved.find(x=>x.fish==='サバ');
    assert.equal(row?.methodKey,'lure','saved methodKey');
    await page.reload({waitUntil:'networkidle'});
    await waitExpanded(page);
    await page.locator('.nav button[data-v="saved"]').click();
    await page.locator('#savedList .saveRow').filter({hasText:'サバ'}).locator('.op').click();
    await page.locator('#result.on').waitFor({state:'visible'});
    assert.equal(await text(page,'#pmethod'),'ライトゲーム/小型メタルジグ','saved method restored');
    assert.equal(await text(page,'#firstBait'),'小型メタルジグ','saved FIRST CAST restored');
    assert.equal(await text(page,'#gear .gearItem:nth-child(1) b'),'7〜8ft / L〜ML','saved rod recommendation restored');
    assert.equal(await text(page,'#tackleFitBody .fitSummary b'),'手持ちで組みやすい','saved MY TACKLE fit restored');
    await page.locator('.nav button[data-v="home"]').click();
    await page.locator('#home.on').waitFor({state:'visible'});
  }else{
    await backHome(page);
  }

  // Regression for the staged-expansion bug: カレイ is added in TARGET1, then
  // TARGET2 attaches choinage through `existing`. It must survive at runtime.
  await openTarget(page,'カレイ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id="choinage"]').count(),1,`${width}: karei TARGET2 method attached`);
  await page.locator('#methodPickerV1 [data-method-id="choinage"]').click();
  assert.equal(await text(page,'#pmethod'),'ちょい投げ',`${width}: karei choinage selectable`);
  await backHome(page);

  // TARGET2 freshwater target and multi-method switching.
  await openTarget(page,'ヘラブナ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id]').count(),3,`${width}: herabuna methods`);
  await page.locator('#methodPickerV1 [data-method-id="kattuke"]').click();
  assert.equal(await text(page,'#pmethod'),'カッツケ釣り',`${width}: herabuna kattuke`);
  assert.ok((await page.locator('#firstRange').textContent()||'').includes('1m'),`${width}: shallow FIRST CAST`);
  await noOverflow(page,width,`${width} freshwater result`);
  await backHome(page);

  // TARGET2 squid target has lure + bait styles and 3 complete plans.
  await openTarget(page,'コウイカ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id]').count(),3,`${width}: kouika methods`);
  await page.locator('#methodPickerV1 [data-method-id="tera"]').click();
  assert.equal(await text(page,'#pmethod'),'テーラ探り釣り',`${width}: kouika bait method`);
  assert.equal(await page.locator('#steps .step').count(),3,`${width}: kouika 3 steps`);
  await noOverflow(page,width,`${width} squid result`);

  if(width===390){
    // A newly added TARGET2 target must also carry its selected method into FIELD MODE and persistence.
    await page.locator('#fieldModeBtn').click();
    await page.locator('#fieldmode.on').waitFor({state:'visible'});
    assert.equal(await text(page,'#fmFish'),'コウイカ','FIELD MODE TARGET2 target');
    assert.equal(await text(page,'#fmMethod'),'テーラ探り釣り','FIELD MODE TARGET2 method');
    assert.ok(await text(page,'#fmBait'),'FIELD MODE TARGET2 FIRST CAST');
    await page.locator('#fmBackPlan').click();
    await page.locator('#result.on').waitFor({state:'visible'});

    await page.locator('#save').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9')||'[]'));
    const row=saved.find(x=>x.fish==='コウイカ');
    assert.equal(row?.methodKey,'tera','saved TARGET2 methodKey');
    await page.reload({waitUntil:'networkidle'});
    await waitExpanded(page);
    await page.locator('.nav button[data-v="saved"]').click();
    await page.locator('#savedList .saveRow').filter({hasText:'コウイカ'}).locator('.op').click();
    await page.locator('#result.on').waitFor({state:'visible'});
    assert.equal(await text(page,'#pmethod'),'テーラ探り釣り','saved TARGET2 method restored');

    // MY TACKLE management remains reachable with TARGET2 expansion controller.
    await page.locator('.nav button[data-v="home"]').click();
    await page.locator('.v19TackleShortcut').click();
    await page.locator('#tackleSheet').waitFor({state:'visible'});
    assert.ok(await page.locator('#rodCatalogMaker option').count()>=2,'catalog maker selector survives TARGET2');
    await page.locator('#tackleClose').click();

    // All TARGET2 assets are part of the offline shell.
    await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
    await page.reload({waitUntil:'networkidle'});
    await waitExpanded(page);
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded',timeout:20000});
    await waitExpanded(page);
    assert.equal(await page.locator('#grid .fish').count(),55,'offline TARGET2 expansion available');
    await page.locator('button.fish[data-fish="ワカサギ"]').click();
    await page.locator('#result.on').waitFor({state:'visible'});
    assert.equal(await text(page,'#pmethod'),'ドーム船ワカサギ','offline new target usable');
    await context.setOffline(false);
  }

  assert.equal(errors.length,0,`${width}: page errors\n${errors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`${width}: console errors\n${consoleErrors.join('\n')}`);
  console.log(`PASS TARGET2 browser ${width}px`);
  await context.close();
}

const browser=await chromium.launch({headless:true});
try{
  for(const viewport of VIEWPORTS)await runViewport(browser,viewport);
  console.log('TARGET METHOD BROWSER QA PASS');
}finally{
  await browser.close();
}
