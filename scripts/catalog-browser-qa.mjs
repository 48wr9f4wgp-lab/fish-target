import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const KEY='fish_target_v17_tackle';

async function waitApp(page){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:15000});
  await page.waitForFunction(()=>document.querySelectorAll('#grid .fish').length===19,{timeout:15000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_CATALOG&&document.querySelector('.v19TackleShortcut')),{timeout:15000});
}

async function assertNoOverflow(page,width,label){
  const size=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
  assert.ok(size.doc<=width+1,`${label}: document overflow ${size.doc}>${width}`);
  assert.ok(size.body<=width+1,`${label}: body overflow ${size.body}>${width}`);
  assert.equal(size.viewport,width,`${label}: viewport width`);
}

async function openSheet(page){
  const shortcut=page.locator('.v19TackleShortcut');
  await shortcut.waitFor({state:'visible'});
  await shortcut.click();
  await page.locator('#tackleSheet').waitFor({state:'visible'});
}

async function setMode(page,kind,mode){
  await page.locator(`.tackleEntryModes[data-kind="${kind}"] button[data-mode="${mode}"]`).click();
  await page.locator(`#${kind}${mode==='manual'?'Manual':'Catalog'}Panel`).waitFor({state:'visible'});
}

async function selectContaining(page,selector,text){
  const value=await page.locator(selector).locator('option').evaluateAll((options,needle)=>{
    const found=options.find(o=>(o.textContent||'').includes(needle));
    return found?.value||null;
  },text);
  assert.ok(value,`${selector}: option containing ${text}`);
  await page.locator(selector).selectOption(value);
  return value;
}

async function waitModel(page,kind,text){
  await page.waitForFunction(({selector,text})=>{
    const el=document.querySelector(selector);
    return Boolean(el&&!el.disabled&&[...el.options].some(o=>(o.textContent||'').includes(text)));
  },{selector:`#${kind}CatalogModel`,text},{timeout:15000});
}

async function searchModel(page,kind,query,expected){
  await page.locator(`#${kind}CatalogSearch`).fill(query);
  await waitModel(page,kind,expected);
  return page.locator(`#${kind}CatalogModel`);
}

const readDb=page=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)||'{"rods":[],"reels":[]}'),KEY);

async function runFullCatalogFlow(browser){
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();
  const pageErrors=[];
  const consoleErrors=[];
  page.on('pageerror',err=>pageErrors.push(String(err)));
  page.on('console',msg=>{if(msg.type()==='error')consoleErrors.push(msg.text())});

  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await waitApp(page);
  await openSheet(page);
  await assertNoOverflow(page,390,'catalog sheet');

  // Manufacturer → series → model.
  await page.locator('#rodCatalogMaker').selectOption({label:'SHIMANO'});
  await page.waitForFunction(()=>[...document.querySelectorAll('#rodCatalogSeries option')].some(o=>o.textContent==='DEMO SHORE'));
  await page.locator('#rodCatalogSeries').selectOption({label:'DEMO SHORE'});
  await waitModel(page,'rod','100M');
  assert.ok((await page.locator('#rodCatalogModel').locator('option').allTextContents()).some(x=>x.includes('100M')),'SHIMANO series model renders');

  // Search must expose lifecycle state.
  await page.locator('#rodCatalogMaker').selectOption({label:'DAIWA'});
  let model=await searchModel(page,'rod','90M','90M');
  let texts=await model.locator('option').allTextContents();
  assert.ok(texts.some(x=>x.includes('90M')&&x.includes('廃番')),'discontinued rod is searchable and visibly marked');

  await page.locator('#reelCatalogMaker').selectOption({label:'SHIMANO'});
  model=await searchModel(page,'reel','5000X','5000X');
  texts=await model.locator('option').allTextContents();
  assert.ok(texts.some(x=>x.includes('5000X')&&x.includes('状態不明')),'unknown-status reel is searchable and visibly marked');

  // Register the same catalog rod twice; duplicate ownership is valid and ids stay unique.
  model=await searchModel(page,'rod','100MH','100MH');
  await selectContaining(page,'#rodCatalogModel','100MH');
  await page.locator('#addCatalogRod').click();
  await page.locator('#addCatalogRod').click();
  let db=await readDb(page);
  let catalogRods=db.rods.filter(x=>x.source==='catalog'&&x.model==='100MH');
  assert.equal(catalogRods.length,2,'duplicate same-model catalog ownership persists');
  assert.equal(new Set(catalogRods.map(x=>x.id)).size,2,'duplicate ownership receives unique ids');
  assert.equal(new Set(catalogRods.map(x=>x.product_id)).size,1,'duplicate ownership retains canonical product id');

  // Manual/legacy entry coexists with catalog rows.
  await setMode(page,'rod','manual');
  await page.locator('#rodName').fill('旧モデル手入力ロッド');
  await page.locator('#rodLength').fill('9.6');
  await page.locator('#rodPower').selectOption('M');
  await page.locator('#rodMaxLure').fill('60');
  await page.locator('#addRod').click();
  db=await readDb(page);
  assert.equal(db.rods.filter(x=>x.source==='manual').length,1,'manual rod coexists with catalog rods');

  // Catalog reel requires explicit current-line input.
  await setMode(page,'reel','catalog');
  await page.locator('#reelCatalogMaker').selectOption({label:'SHIMANO'});
  model=await searchModel(page,'reel','C3000HG','C3000HG');
  await selectContaining(page,'#reelCatalogModel','C3000HG');
  assert.equal(await page.locator('#catalogReelLineType').inputValue(),'','catalog reel does not infer line type');
  assert.equal(await page.locator('#catalogReelLineNo').inputValue(),'','catalog reel does not infer line number');
  await page.locator('#catalogReelLineType').selectOption('PE');
  await page.locator('#catalogReelLineNo').fill('1.2');
  await page.locator('#addCatalogReel').click();
  db=await readDb(page);
  let reel=db.reels.find(x=>x.source==='catalog'&&x.model==='C3000HG');
  assert.ok(reel,'catalog reel registered');
  assert.equal(reel.lineType,'PE');
  assert.equal(reel.lineNo,1.2);

  // Edit only user-owned fields; canonical identity/spec snapshot must not mutate.
  const immutableBefore={product_id:reel.product_id,maker:reel.maker,series:reel.series,model:reel.model,size:reel.size,catalog_status:reel.catalog_status,license_status:reel.license_status};
  await page.locator(`[data-edit="reels:${reel.id}"]`).click();
  await page.locator(`#edit-reels-${reel.id}-name`).fill('MY C3000HG');
  await page.locator(`#edit-reels-${reel.id}-lineType`).selectOption('PE');
  await page.locator(`#edit-reels-${reel.id}-lineNo`).fill('1.5');
  await page.locator(`[data-save="reels:${reel.id}"]`).click();
  db=await readDb(page);
  reel=db.reels.find(x=>x.id===reel.id);
  assert.equal(reel.name,'MY C3000HG','nickname edit persists');
  assert.equal(reel.lineType,'PE','current line type edit persists');
  assert.equal(reel.lineNo,1.5,'current line number edit persists');
  assert.deepEqual({product_id:reel.product_id,maker:reel.maker,series:reel.series,model:reel.model,size:reel.size,catalog_status:reel.catalog_status,license_status:reel.license_status},immutableBefore,'catalog identity/spec snapshot stays immutable');

  // Delete one duplicate without corrupting the rest.
  catalogRods=db.rods.filter(x=>x.source==='catalog'&&x.model==='100MH');
  const removeId=catalogRods[0].id;
  await page.locator(`[data-remove="rods:${removeId}"]`).click();
  db=await readDb(page);
  assert.equal(db.rods.filter(x=>x.source==='catalog'&&x.model==='100MH').length,1,'deleting one duplicate preserves the other');
  assert.equal(db.rods.filter(x=>x.source==='manual').length,1,'deleting catalog row preserves manual row');
  assert.equal(db.reels.filter(x=>x.source==='catalog').length,1,'deleting rod preserves reel');
  await assertNoOverflow(page,390,'populated catalog sheet');
  await page.locator('#tackleClose').click();

  // Compatibility result remains usable after mixed ownership edits.
  await page.locator('button.fish[data-fish="ヒラメ"]').click();
  await page.locator('#result.on').waitFor({state:'visible'});
  assert.ok((await page.locator('#tackleFitBody').textContent()||'').trim(),'MY TACKLE CHECK renders after mixed ownership');
  await assertNoOverflow(page,390,'MY TACKLE CHECK result');

  // Persistence across reload.
  await page.reload({waitUntil:'networkidle'});
  await waitApp(page);
  db=await readDb(page);
  assert.equal(db.rods.length,2,'catalog + manual rods survive reload');
  assert.equal(db.reels.length,1,'catalog reel survives reload');
  reel=db.reels[0];
  assert.equal(reel.name,'MY C3000HG','catalog nickname survives reload');
  assert.equal(reel.lineType,'PE','current line type survives reload');
  assert.equal(reel.lineNo,1.5,'current line number survives reload');

  // Offline: app, saved MY TACKLE, and DEV fixture selector must remain usable after online install.
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true));
  await page.reload({waitUntil:'networkidle'});
  await waitApp(page);
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded',timeout:20000});
  await waitApp(page);
  await openSheet(page);
  assert.ok((await page.locator('#tackleOwned').textContent()||'').includes('MY C3000HG'),'offline MY TACKLE saved data available');
  await setMode(page,'rod','catalog');
  await page.locator('#rodCatalogMaker').selectOption({label:'DAIWA'});
  await searchModel(page,'rod','90M','90M');
  assert.ok((await page.locator('#rodCatalogModel').locator('option').allTextContents()).some(x=>x.includes('廃番')),'offline DEV fixture selector works');
  await assertNoOverflow(page,390,'offline MY TACKLE sheet');
  await context.setOffline(false);

  assert.equal(pageErrors.length,0,`catalog page errors\n${pageErrors.join('\n')}`);
  assert.equal(consoleErrors.length,0,`catalog console errors\n${consoleErrors.join('\n')}`);
  console.log('PASS catalog full flow · selectors/search/status/duplicate/manual/edit/delete/reload/offline');
  await context.close();
}

async function runLegacyAndInvalidStorage(browser){
  {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(key=>localStorage.setItem(key,JSON.stringify({rods:[{id:'legacy-rod',name:'Source-less Legacy',length:9.6,power:'M',maxLure:40}],reels:[]})),KEY);
    const page=await context.newPage();
    await page.goto(BASE,{waitUntil:'networkidle'});
    await waitApp(page);
    await openSheet(page);
    const text=await page.locator('#tackleOwned').textContent()||'';
    assert.ok(text.includes('Source-less Legacy'),'source-less legacy row renders');
    assert.ok(text.includes('MANUAL'),'source-less legacy row is interpreted as manual');
    console.log('PASS source-less legacy MY TACKLE compatibility');
    await context.close();
  }
  {
    const context=await browser.newContext({viewport:{width:390,height:844}});
    await context.addInitScript(key=>localStorage.setItem(key,'{broken-json'),KEY);
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(String(err)));
    await page.goto(BASE,{waitUntil:'networkidle'});
    await waitApp(page);
    assert.ok((await page.locator('#tackleSummary').textContent()||'').includes('手持ちタックルを登録'),'invalid stored data fails safely to empty state');
    assert.equal(errors.length,0,`invalid storage must not crash\n${errors.join('\n')}`);
    console.log('PASS invalid MY TACKLE storage fails safely');
    await context.close();
  }
}

async function runResponsiveSheet(browser,width,height){
  const context=await browser.newContext({viewport:{width,height}});
  const page=await context.newPage();
  await page.goto(BASE,{waitUntil:'networkidle'});
  await waitApp(page);
  await openSheet(page);
  await assertNoOverflow(page,width,`${width} catalog sheet`);
  await setMode(page,'rod','manual');
  await page.locator('#rodName').fill('responsive check');
  await assertNoOverflow(page,width,`${width} manual editor`);
  assert.equal(await page.locator('#tackleClose').isVisible(),true,`${width} sheet close reachable`);
  await page.locator('#tackleClose').click();
  assert.equal(await page.locator('#tackleSheet').isHidden(),true,`${width} sheet closes`);
  console.log(`PASS catalog responsive ${width}px`);
  await context.close();
}

const browser=await chromium.launch({headless:true});
try{
  await runFullCatalogFlow(browser);
  await runLegacyAndInvalidStorage(browser);
  await runResponsiveSheet(browser,375,812);
  await runResponsiveSheet(browser,430,932);
  console.log('CATALOG BROWSER QA PASS');
}finally{
  await browser.close();
}
