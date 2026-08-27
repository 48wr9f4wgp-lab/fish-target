import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const VIEWPORTS=[
  {name:'375',width:375,height:812},
  {name:'390',width:390,height:844},
  {name:'430',width:430,height:932}
];
const localHost=url=>{
  const host=new URL(url).hostname;
  return host==='127.0.0.1'||host==='localhost';
};
const nonEmpty=async(locator,label)=>assert.ok((await locator.textContent()||'').trim(),`${label} must render text`);

async function waitApp(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===19,{timeout:15000});
  await page.waitForFunction(()=>document.documentElement.classList.contains('realFishReady'),{timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .realFishMounted').length===19,{timeout:15000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_VISUAL_V8&&document.getElementById('tackleManage')),{timeout:15000});
}

async function assertLayout(page,width,label){
  const layout=await page.evaluate(()=>{
    const accessibleName=el=>{
      const aria=el.getAttribute('aria-label')?.trim();
      if(aria)return aria;
      const labelledBy=el.getAttribute('aria-labelledby');
      if(labelledBy){
        const text=labelledBy.split(/\s+/).map(id=>document.getElementById(id)?.textContent||'').join(' ').trim();
        if(text)return text;
      }
      if('labels' in el&&el.labels?.length){
        const text=[...el.labels].map(node=>node.textContent||'').join(' ').trim();
        if(text)return text;
      }
      const title=el.getAttribute('title')?.trim();
      if(title)return title;
      if(el instanceof HTMLInputElement&&['button','submit','reset'].includes(el.type)&&el.value.trim())return el.value.trim();
      return (el.textContent||'').trim();
    };
    const unnamed=[...document.querySelectorAll('button,a,input,select,textarea,summary')].filter(el=>{
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      if(s.display==='none'||s.visibility==='hidden'||r.width===0||r.height===0)return false;
      return !accessibleName(el);
    }).map(el=>({tag:el.tagName,id:el.id,klass:el.className,type:el.getAttribute('type'),html:el.outerHTML.slice(0,180)}));
    return {doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:window.innerWidth,unnamed};
  });
  assert.ok(layout.doc<=width+1,`${label}: document overflow ${layout.doc}>${width}`);
  assert.ok(layout.body<=width+1,`${label}: body overflow ${layout.body}>${width}`);
  assert.equal(layout.viewport,width,`${label}: viewport width`);
  assert.equal(layout.unnamed.length,0,`${label}: visible interactive controls need an accessible name\n${JSON.stringify(layout.unnamed,null,2)}`);
}

async function resourceMetrics(page){
  return page.evaluate(()=>{
    const resources=performance.getEntriesByType('resource');
    const sizes=resources.map(r=>r.encodedBodySize||r.transferSize||0);
    return {count:resources.length,total:sizes.reduce((n,v)=>n+v,0),largest:Math.max(0,...sizes)};
  });
}

async function runViewport(browser,vp){
  const context=await browser.newContext({viewport:{width:vp.width,height:vp.height},serviceWorkers:'allow'});
  const page=await context.newPage();
  const consoleErrors=[];
  const pageErrors=[];
  const externalRequests=[];
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
  page.on('pageerror',err=>pageErrors.push(String(err)));
  page.on('request',req=>{if(!localHost(req.url()))externalRequests.push(req.url())});

  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await waitApp(page);
  const perf=await resourceMetrics(page);
  assert.ok(perf.total>0,`${vp.name}: initial encoded resource bytes must be measurable`);
  assert.ok(perf.total<2_000_000,`${vp.name}: encoded resource budget ${perf.total}`);
  assert.ok(perf.largest<600_000,`${vp.name}: largest encoded resource budget ${perf.largest}`);
  assert.equal(await page.getAttribute('html','data-field-live'),'off',`${vp.name}: FIELD LIVE flag`);
  assert.equal(await page.locator('#grid .fish').count(),19,`${vp.name}: 19 targets`);
  assert.equal(await page.locator('#grid .realFishMounted[data-fish-asset="direct-avif-grid"]').count(),19,`${vp.name}: all fish use direct AVIF renderer`);
  assert.equal(await page.locator('[data-feature="field-live"]').evaluateAll(nodes=>nodes.filter(n=>getComputedStyle(n).display!=='none').length),0,`${vp.name}: FIELD LIVE controls hidden`);
  await assertLayout(page,vp.width,`${vp.name} home`);

  await page.locator('button.fish[data-fish="ヒラメ"]').click();
  await page.locator('#result.on').waitFor({state:'visible'});
  assert.equal((await page.locator('#rname').textContent()||'').trim(),'ヒラメ',`${vp.name}: selected target`);
  await nonEmpty(page.locator('#pmethod'),`${vp.name}: method`);
  await nonEmpty(page.locator('#firstBait'),`${vp.name}: FIRST CAST`);
  assert.ok(await page.locator('#gear .gearItem').count()>=4,`${vp.name}: required tackle`);
  assert.ok(await page.locator('#steps .step').count()>=3,`${vp.name}: field steps`);
  await page.waitForFunction(()=>document.querySelector('#tart')?.dataset.fishAsset==='direct-avif-grid',{timeout:10000});
  await assertLayout(page,vp.width,`${vp.name} result`);

  await page.locator('#fieldModeBtn').click();
  await page.locator('#fieldmode.on').waitFor({state:'visible'});
  assert.equal((await page.locator('#fmFish').textContent()||'').trim(),'ヒラメ',`${vp.name}: FIELD MODE target`);
  await nonEmpty(page.locator('#fmBait'),`${vp.name}: FIELD MODE FIRST CAST`);
  assert.ok(await page.locator('#fmTackle > div').count()>=4,`${vp.name}: FIELD MODE tackle`);
  assert.ok(await page.locator('#fmSteps .fmStep').count()>=3,`${vp.name}: FIELD MODE steps`);
  await assertLayout(page,vp.width,`${vp.name} field mode`);
  await page.locator('#fmBackPlan').click();
  await page.locator('#result.on').waitFor({state:'visible'});

  await page.locator('#save').click();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9')||'[]'));
  assert.ok(saved.some(x=>x.fish==='ヒラメ'),`${vp.name}: save persisted`);
  await page.reload({waitUntil:'networkidle'});
  await waitApp(page);
  await page.locator('.nav button[data-v="saved"]').click();
  await page.locator('#saved.on').waitFor({state:'visible'});
  assert.ok((await page.locator('#savedList').textContent()||'').includes('ヒラメ'),`${vp.name}: save resumes after reload`);

  if(vp.width===390){
    await page.locator('.nav button[data-v="home"]').click();
    await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
    await page.reload({waitUntil:'networkidle'});
    await waitApp(page);
    await context.setOffline(true);
    await page.reload({waitUntil:'domcontentloaded',timeout:20000});
    await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:10000});
    assert.equal(await page.locator('#grid .fish').count(),19,'390 offline: targets remain available');
    assert.equal(await page.locator('#networkStatus').isVisible(),true,'390 offline: offline status visible');
    await page.locator('button.fish[data-fish="ヒラメ"]').click();
    await page.locator('#result.on').waitFor({state:'visible'});
    await nonEmpty(page.locator('#firstBait'),'390 offline: FIRST CAST');
    await page.locator('.nav button[data-v="saved"]').click();
    assert.ok((await page.locator('#savedList').textContent()||'').includes('ヒラメ'),'390 offline: saved plan available');
    await context.setOffline(false);
  }

  assert.equal(pageErrors.length,0,`${vp.name}: page errors\n${pageErrors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`${vp.name}: console errors\n${consoleErrors.join('\n')}`);
  assert.equal(externalRequests.length,0,`${vp.name}: RC0 must not make third-party requests with FIELD LIVE off\n${externalRequests.join('\n')}`);
  console.log(`PASS browser ${vp.name}px · resources=${perf.count} encoded=${perf.total} largest=${perf.largest}`);
  await context.close();
}

async function runLegacyMigration(browser){
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{
    localStorage.removeItem('fish_target_v9');
    localStorage.setItem('fish_target_v8',JSON.stringify([{fish:'アジ',place:'おすすめ',season:'秋',goal:'標準'}]));
  });
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'networkidle'});
  await page.locator('.nav button[data-v="saved"]').click();
  await page.locator('#saved.on').waitFor({state:'visible'});
  assert.ok((await page.locator('#savedList').textContent()||'').includes('アジ'),'legacy saved plan renders');
  const values=await page.evaluate(()=>({old:localStorage.getItem('fish_target_v8'),next:localStorage.getItem('fish_target_v9')}));
  assert.ok(values.old,'legacy key remains intact');
  assert.ok(values.next&&JSON.parse(values.next).some(x=>x.fish==='アジ'),'legacy plan migrates non-destructively');
  console.log('PASS legacy save migration');
  await context.close();
}

async function openTackleSheetFromHome(page){
  const shortcut=page.locator('.v19TackleShortcut');
  await shortcut.waitFor({state:'visible'});
  await shortcut.click();
  await page.locator('#tackleSheet').waitFor({state:'visible'});
}

async function runTackleFlow(browser){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();
  const consoleErrors=[];
  const pageErrors=[];
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});
  page.on('pageerror',err=>pageErrors.push(String(err)));
  await page.goto(BASE,{waitUntil:'networkidle'});
  await waitApp(page);
  assert.ok((await page.locator('#tackleSummary').textContent()||'').includes('手持ちタックルを登録'),'MY TACKLE empty state');
  assert.equal(await page.locator('#myTackleHome.v19HomeTackleHidden').count(),1,'legacy MY TACKLE home card is intentionally compacted');
  await openTackleSheetFromHome(page);
  await assertLayout(page,390,'390 MY TACKLE catalog sheet');

  await page.locator('.tackleEntryModes[data-kind="rod"] button[data-mode="manual"]').click();
  await page.locator('.tackleEntryModes[data-kind="reel"] button[data-mode="manual"]').click();
  await page.locator('#rodManualPanel').waitFor({state:'visible'});
  await page.locator('#reelManualPanel').waitFor({state:'visible'});
  await assertLayout(page,390,'390 MY TACKLE manual sheet');
  await page.locator('#rodName').fill('部分入力ロッド');
  await page.locator('#addRod').click();
  await page.locator('#reelName').fill('部分入力リール');
  await page.locator('#addReel').click();
  let tackle=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v17_tackle')||'{}'));
  assert.equal(tackle.rods?.length,1,'manual rod persisted');
  assert.equal(tackle.reels?.length,1,'manual reel persisted');
  assert.equal(tackle.rods[0].source,'manual','manual rod source');
  assert.equal(tackle.reels[0].source,'manual','manual reel source');
  assert.equal(tackle.rods[0].maxLure,null,'missing rod spec stays null');
  assert.equal(tackle.reels[0].lineNo,null,'missing reel line stays null');
  await page.locator('#tackleClose').click();

  await page.locator('button.fish[data-fish="ヒラメ"]').click();
  await page.locator('#result.on').waitFor({state:'visible'});
  assert.equal(await page.locator('#tackleFitBody .fitSummary.level0').count(),0,'missing MY TACKLE fields never produce green fit');
  assert.ok((await page.locator('#tackleFitBody').textContent()||'').includes('一部条件を確認'),'partial MY TACKLE is explicitly conditional');

  await page.reload({waitUntil:'networkidle'});
  await waitApp(page);
  tackle=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v17_tackle')||'{}'));
  assert.equal(tackle.rods?.length,1,'manual rod survives reload');
  assert.equal(tackle.reels?.length,1,'manual reel survives reload');
  await openTackleSheetFromHome(page);
  await page.waitForFunction(()=>{
    const select=document.getElementById('reelCatalogModel');
    return select&&!select.disabled&&select.options.length>0;
  },{timeout:15000});
  assert.equal(await page.locator('#catalogReelLineType').inputValue(),'','catalog reel current line starts unspecified');
  assert.equal(await page.locator('#catalogReelLineNo').inputValue(),'','catalog reel current line number starts unspecified');
  await page.locator('#addCatalogReel').click();
  tackle=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v17_tackle')||'{}'));
  const catalogReel=tackle.reels?.find(x=>x.source==='catalog');
  assert.ok(catalogReel,'catalog reel persisted through UI');
  assert.equal(catalogReel.lineType,'','catalog reel product specs do not infer current line type');
  assert.equal(catalogReel.lineNo,null,'catalog reel product specs do not infer current line number');
  await assertLayout(page,390,'390 MY TACKLE populated sheet');
  assert.equal(pageErrors.length,0,`MY TACKLE page errors\n${pageErrors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`MY TACKLE console errors\n${consoleErrors.join('\n')}`);
  console.log('PASS MY TACKLE UI · shortcut/empty/manual/partial-fit/catalog-line invariant/reload');
  await context.close();
}

const browser=await chromium.launch({headless:true});
try{
  for(const vp of VIEWPORTS)await runViewport(browser,vp);
  await runLegacyMigration(browser);
  await runTackleFlow(browser);
  console.log('BROWSER QA PASS');
}finally{
  await browser.close();
}
