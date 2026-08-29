import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const VIEWPORTS=[{width:375,height:812},{width:390,height:844},{width:430,height:932}];

async function waitExpanded(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===60,{timeout:15000});
  await page.waitForFunction(()=>globalThis.FISH_TARGET_METHOD_STATUS?.targets===60&&globalThis.FISH_TARGET_METHOD_STATUS?.plans===150,{timeout:15000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_VISUAL_V8&&document.getElementById('tackleManage')),{timeout:15000});
}

async function noOverflow(page,width,label){
  const x=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
  assert.ok(x.doc<=width+1,`${label}: document overflow ${x.doc}>${width}`);
  assert.ok(x.body<=width+1,`${label}: body overflow ${x.body}>${width}`);
  assert.equal(x.viewport,width,`${label}: viewport`);
}

async function text(page,selector){return (await page.locator(selector).textContent()||'').trim()}

async function openTarget(page,name){
  await page.locator(`button.fish[data-fish="${name}"]`).click();
  await page.locator('#result.on').waitFor({state:'visible'});
  assert.equal(await text(page,'#rname'),name);
}

async function selectMethod(page,id){
  const picker=page.locator('#methodPickerV1');
  const change=page.locator('#ux23MethodChange');
  if(await change.count()&&!(await picker.isVisible()))await change.click();
  await picker.waitFor({state:'visible'});
  await page.locator(`#methodPickerV1 [data-method-id="${id}"]`).click();
}

async function backHome(page){
  const dockHome=page.locator('#resultDockV20 [data-action="home"]');
  if(await dockHome.count()&&await dockHome.isVisible())await dockHome.click();
  else await page.locator('#back').click();
  await page.locator('#home.on').waitFor({state:'visible'});
}

async function openFilters(page){
  const details=page.locator('#v19FilterDetails');
  if(await details.count()){
    if(!(await details.evaluate(el=>el.open)))await details.locator('summary').click();
    await page.locator('#styleFilters').waitFor({state:'visible'});
  }
}

async function restoreSaved(page,fish){
  await page.reload({waitUntil:'networkidle'});
  await waitExpanded(page);
  await page.locator('.nav button[data-v="saved"]').click();
  await page.locator('#savedList .saveRow').filter({hasText:fish}).locator('.op').click();
  await page.locator('#result.on').waitFor({state:'visible'});
}

async function runViewport(browser,{width,height}){
  const context=await browser.newContext({viewport:{width,height},serviceWorkers:'allow'});
  const page=await context.newPage();
  const errors=[];const consoleErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await waitExpanded(page);
  assert.equal(await page.locator('#grid .fish').count(),60,`${width}: target count`);
  assert.equal(await text(page,'#home .heroStats span:nth-of-type(1)'),'60魚種',`${width}: hero target count`);
  assert.ok((await page.locator('#home .heroStats').textContent()||'').includes('150釣法プラン'),`${width}: plan count`);
  await noOverflow(page,width,`${width} home`);

  await openFilters(page);
  await page.locator('#styleFilters button[data-v="lure"]').click();
  assert.equal(await page.locator('button.fish[data-fish="サバ"]').count(),1,`${width}: multi-style target remains in lure filter`);
  await page.locator('#styleFilters button[data-v="all"]').click();

  for(const [query,fish,label] of [
    ['ハゼクランク','ハゼ','V1 method search'],
    ['ティップエギング','アオリイカ','V2 method search'],
    ['タイラバ','マダイ','V3 method search'],
    ['アユイング','アユ','V4 method search']
  ]){
    await page.locator('#q').fill(query);
    assert.equal(await page.locator(`button.fish[data-fish="${fish}"]`).count(),1,`${width}: ${label}`);
    await page.locator('#clearSearch').click();
  }

  // Legacy exact propagation + MY TACKLE gate through the current UX23 method-change path.
  await openTarget(page,'サバ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id]').count(),4,`${width}: サバ method count`);
  assert.equal(await text(page,'#pmethod'),'サビキ釣り',`${width}: default method`);
  await page.evaluate(()=>localStorage.setItem('fish_target_v17_tackle',JSON.stringify({
    rods:[{id:'qa-lure-rod',source:'manual',name:'QA 7.5ft L',length:7.5,power:'L',maxLure:20}],
    reels:[{id:'qa-lure-reel',source:'manual',name:'QA 2500 PE0.6',size:2500,lineType:'PE',lineNo:0.6}]
  })));
  await selectMethod(page,'default');
  assert.equal(await text(page,'#tackleFitBody .fitSummary b'),'買い足し候補あり',`${width}: default MY TACKLE baseline`);
  await selectMethod(page,'lure');
  assert.equal(await text(page,'#pmethod'),'ライトゲーム/小型メタルジグ',`${width}: alternate method selected`);
  assert.equal(await text(page,'#firstBait'),'小型メタルジグ',`${width}: FIRST CAST`);
  assert.equal(await text(page,'#gear .gearItem:nth-child(1) b'),'7〜8ft / L〜ML',`${width}: rod`);
  assert.equal(await text(page,'#gear .gearItem:nth-child(2) b'),'2000〜3000番',`${width}: reel`);
  assert.equal(await text(page,'#gear .gearItem:nth-child(3) b'),'PE 0.4〜0.8号',`${width}: line`);
  assert.equal(await text(page,'#gear .gearItem:nth-child(4) b'),'フロロ 6〜12lb',`${width}: leader`);
  assert.equal(await text(page,'#steps .step:nth-child(1) .st'),'群れの外へキャスト',`${width}: step1`);
  assert.equal(await text(page,'#steps .step:nth-child(2) .st'),'表層から順に探る',`${width}: step2`);
  assert.equal(await text(page,'#steps .step:nth-child(3) .st'),'深いときはジグを沈めリフト&フォール',`${width}: step3`);
  assert.equal(await text(page,'#tackleFitBody .fitSummary b'),'手持ちで組みやすい',`${width}: MY TACKLE recompute`);
  await noOverflow(page,width,`${width} legacy result`);

  if(width===390){
    await page.locator('#fieldModeBtn').click();
    await page.locator('#fieldmode.on').waitFor({state:'visible'});
    assert.equal(await text(page,'#fmFish'),'サバ','legacy FIELD MODE fish');
    assert.equal(await text(page,'#fmMethod'),'ライトゲーム/小型メタルジグ','legacy FIELD MODE method');
    assert.equal(await text(page,'#fmBait'),'小型メタルジグ','legacy FIELD MODE FIRST CAST');
    assert.equal(await text(page,'#fmSteps .fmStep:nth-child(1) span'),'群れの外へキャスト','legacy FIELD MODE step');
    await page.locator('#fmBackPlan').click();
    await page.locator('#save').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9')||'[]'));
    assert.equal(saved.find(x=>x.fish==='サバ')?.methodKey,'lure','legacy saved methodKey');
    await restoreSaved(page,'サバ');
    assert.equal(await text(page,'#pmethod'),'ライトゲーム/小型メタルジグ','legacy saved method restored');
    assert.equal(await text(page,'#tackleFitBody .fitSummary b'),'手持ちで組みやすい','legacy saved fit restored');
    await backHome(page);
  }else await backHome(page);

  // V1 -> V2 cross-phase regression.
  await openTarget(page,'カレイ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id="choinage"]').count(),1,`${width}: karei cross-phase method`);
  await selectMethod(page,'choinage');
  assert.equal(await text(page,'#pmethod'),'ちょい投げ',`${width}: karei choinage selectable`);
  await backHome(page);

  // V1 -> V3 cross-phase regression.
  await openTarget(page,'ウグイ');
  assert.ok(await page.locator('#methodPickerV1 [data-method-id]').count()>=3,`${width}: ugui method density`);
  assert.equal(await page.locator('#methodPickerV1 [data-method-id="lure"]').count(),1,`${width}: ugui V3 lure attached`);
  await selectMethod(page,'lure');
  assert.equal(await text(page,'#pmethod'),'ウグイルアー',`${width}: ugui V3 lure selectable`);
  assert.equal(await text(page,'#firstBait'),'小型スプーン/ミノー',`${width}: ugui FIRST CAST bait`);
  assert.equal(await text(page,'#steps .step:nth-child(1) .st'),'緩流部と流れの境を探す',`${width}: ugui V3 step1`);
  await backHome(page);

  // True TARGET3 fish remains healthy.
  await openTarget(page,'ニゴイ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id]').count(),3,`${width}: nigoi methods`);
  await selectMethod(page,'lure');
  assert.equal(await text(page,'#pmethod'),'ニゴイルアー',`${width}: nigoi lure`);
  assert.equal(await text(page,'#firstBait'),'小型スプーン/スピナー',`${width}: nigoi FIRST CAST bait`);
  assert.equal(await text(page,'#steps .step:nth-child(1) .st'),'トロ場・淵・カケアガリへ投げる',`${width}: nigoi step1`);
  await noOverflow(page,width,`${width} TARGET3 new target`);
  await backHome(page);

  // TARGET4 exact propagation gate: canonical Ayu receives a distinct lure Game Plan.
  await openTarget(page,'アユ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id="ayuing"]').count(),1,`${width}: ayuing attached`);
  await selectMethod(page,'ayuing');
  assert.equal(await text(page,'#pmethod'),'アユイング',`${width}: ayuing selected`);
  assert.equal(await text(page,'#firstBait'),'アユイング用ルアー',`${width}: ayuing FIRST CAST bait`);
  assert.equal(await text(page,'#steps .step:nth-child(1) .st'),'遊漁規則とアユルアー可能区間を確認する',`${width}: ayuing rule step`);
  assert.equal(await text(page,'#steps .step:nth-child(2) .st'),'石色と流れを見て縄張りへルアーを入れる',`${width}: ayuing step2`);
  assert.equal(await text(page,'#steps .step:nth-child(3) .st'),'追いを感じたらルアーをポイントに残し掛ける',`${width}: ayuing step3`);
  await noOverflow(page,width,`${width} TARGET4 ayuing result`);

  if(width===390){
    await page.locator('#fieldModeBtn').click();
    await page.locator('#fieldmode.on').waitFor({state:'visible'});
    assert.equal(await text(page,'#fmFish'),'アユ','TARGET4 FIELD MODE fish');
    assert.equal(await text(page,'#fmMethod'),'アユイング','TARGET4 FIELD MODE method');
    assert.equal(await text(page,'#fmBait'),'アユイング用ルアー','TARGET4 FIELD MODE FIRST CAST');
    assert.equal(await text(page,'#fmSteps .fmStep:nth-child(1) span'),'遊漁規則とアユルアー可能区間を確認する','TARGET4 FIELD MODE rule step');
    await page.locator('#fmBackPlan').click();
    await page.locator('#save').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9')||'[]'));
    assert.equal(saved.find(x=>x.fish==='アユ')?.methodKey,'ayuing','TARGET4 saved methodKey');
    await restoreSaved(page,'アユ');
    assert.equal(await text(page,'#pmethod'),'アユイング','TARGET4 saved method restored');
    assert.equal(await text(page,'#firstBait'),'アユイング用ルアー','TARGET4 saved FIRST CAST restored');
    await backHome(page);
  }else await backHome(page);

  // V1 fish receiving V4 boat/shore methods must not lose its original plans.
  await openTarget(page,'カサゴ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id="saguri"]').count(),1,`${width}: kasago saguri attached`);
  assert.equal(await page.locator('#methodPickerV1 [data-method-id="boat_doutuki"]').count(),1,`${width}: kasago boat doutuki attached`);
  await selectMethod(page,'boat_doutuki');
  assert.equal(await text(page,'#pmethod'),'船カサゴ胴突き',`${width}: kasago boat method selectable`);
  assert.equal(await text(page,'#firstBait'),'魚切身/虫エサ',`${width}: kasago boat FIRST CAST`);
  await backHome(page);

  // V2 -> V3 persistence regression remains intact.
  await openTarget(page,'ワカサギ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id="ice"]').count(),1,`${width}: wakasagi TARGET3 ice attached`);
  await selectMethod(page,'ice');
  assert.equal(await text(page,'#pmethod'),'氷上穴釣り',`${width}: wakasagi ice selectable`);
  assert.equal(await text(page,'#steps .step:nth-child(1) .st'),'解禁・氷厚・立入範囲を必ず確認する',`${width}: wakasagi safety step`);

  if(width===390){
    await page.locator('#fieldModeBtn').click();
    await page.locator('#fieldmode.on').waitFor({state:'visible'});
    assert.equal(await text(page,'#fmFish'),'ワカサギ','TARGET3 FIELD MODE fish');
    assert.equal(await text(page,'#fmMethod'),'氷上穴釣り','TARGET3 FIELD MODE method');
    await page.locator('#fmBackPlan').click();
    await page.locator('#save').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9')||'[]'));
    assert.equal(saved.find(x=>x.fish==='ワカサギ')?.methodKey,'ice','TARGET3 saved methodKey');
    await restoreSaved(page,'ワカサギ');
    assert.equal(await text(page,'#pmethod'),'氷上穴釣り','TARGET3 saved method restored');
    await backHome(page);
  }else await backHome(page);

  // TARGET2 representative remains healthy after four composition layers.
  await openTarget(page,'コウイカ');
  assert.equal(await page.locator('#methodPickerV1 [data-method-id]').count(),3,`${width}: kouika methods`);
  await selectMethod(page,'tera');
  assert.equal(await text(page,'#pmethod'),'テーラ探り釣り',`${width}: kouika method`);
  assert.equal(await page.locator('#steps .step').count(),3,`${width}: kouika three steps`);
  await noOverflow(page,width,`${width} TARGET2 regression`);

  if(width===390){
    await backHome(page);
    await page.locator('.v19TackleShortcut').click();
    await page.locator('#tackleSheet').waitFor({state:'visible'});
    assert.ok(await page.locator('#rodCatalogMaker option').count()>=2,'catalog maker selector survives TARGET4');
    await page.locator('#tackleClose').click();

    // V4 data must survive a cold offline reload and still expose its new method.
    await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
    await page.reload({waitUntil:'networkidle'});
    await waitExpanded(page);
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded',timeout:20000});
    await waitExpanded(page);
    assert.equal(await page.locator('#grid .fish').count(),60,'offline TARGET4 target count');
    await page.locator('button.fish[data-fish="アユ"]').click();
    await page.locator('#result.on').waitFor({state:'visible'});
    assert.equal(await page.locator('#methodPickerV1 [data-method-id="ayuing"]').count(),1,'offline TARGET4 ayuing available');
    await selectMethod(page,'ayuing');
    assert.equal(await text(page,'#pmethod'),'アユイング','offline TARGET4 method usable');
    await context.setOffline(false);
  }

  assert.equal(errors.length,0,`${width}: page errors\n${errors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`${width}: console errors\n${consoleErrors.join('\n')}`);
  console.log(`PASS TARGET4 browser ${width}px`);
  await context.close();
}

const browser=await chromium.launch({headless:true});
try{
  for(const viewport of VIEWPORTS)await runViewport(browser,viewport);
  console.log('TARGET4 METHOD BROWSER QA PASS');
}finally{
  await browser.close();
}
