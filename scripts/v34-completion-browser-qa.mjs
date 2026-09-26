import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const engine=process.env.FISH_TARGET_QA_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  const ready=async()=>{await page.goto(BASE);await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'))};
  const fish=async name=>{
    if(await page.locator('#result.on').count())await page.locator('#back').click();
    await page.locator(`button.fish[data-fish="${name}"]`).click();
    await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState?.().status==='ready');
  };
  await ready();
  const decoded=await page.evaluate(async()=>{
    const manifest=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST;
    const files=[...new Set(manifest.bundledRecords.map(row=>row.asset.file))];
    const results=await Promise.all(files.map(async file=>{
      const img=new Image();img.src=new URL(file,location.href).href;
      try{await img.decode();return {file,width:img.naturalWidth,height:img.naturalHeight}}
      catch(error){return {file,error:String(error)}}
    }));
    return {results,development:manifest.developmentOnlyCount,publication:manifest.publicationReadyCount};
  });
  assert.ok(decoded.results.length>0);
  assert.ok(decoded.results.every(row=>!row.error&&row.width>0&&row.height>0),`bundled assets must actually decode: ${JSON.stringify(decoded)}`);
  assert.equal(decoded.development,12,'four pilot repairs and eight new replacements are development previews');
  assert.equal(decoded.publication,0,'preview assets must not inherit the original pilot rights-ready status');

  await fish('ブリ・ワラサ');
  const hierarchy=await page.evaluate(()=>{
    const first=document.querySelector('#result .firstCast'),set=document.getElementById('tackleAutoBuildV29'),products=document.getElementById('lureCatalogPanel');
    return {adjacent:first.nextElementSibling===set,productsAfterSet:Boolean(set.compareDocumentPosition(products)&Node.DOCUMENT_POSITION_FOLLOWING),below:products.getBoundingClientRect().top>=set.getBoundingClientRect().bottom};
  });
  assert.deepEqual(hierarchy,{adjacent:true,productsAfterSet:true,below:true},'MY SET must precede optional product candidates in the actual lure flow');
  await page.locator('#rotation button:not(.on)').first().click();
  const selectedCast=(await page.locator('#firstBait').textContent()).trim();
  const selectedSize=(await page.locator('#firstSize').textContent()).trim();
  await page.locator('#back').click();
  await page.locator('#appTabBarV26 [data-app-tab="conditions"]').click();
  await page.waitForFunction(()=>document.querySelector('.view.on')?.id==='conditions');
  await page.locator('#conditionsPackBtn').click();
  const firstCast=page.locator('[data-id="plan-first-cast"]');
  assert.ok((await firstCast.textContent()).includes(selectedCast),'packing must use the selected alternative FIRST CAST');
  assert.ok((await firstCast.textContent()).includes(selectedSize),'packing must use the displayed size');
  await page.locator('#packStandaloneCloseV30').click();
  const setOwned=async id=>page.evaluate(async id=>{
    localStorage.setItem('fish_target_v17_tackle',JSON.stringify({
      rods:[{id,source:'manual',name:'AUDIT ROD',length:10,power:'MH',maxLure:80}],
      reels:[{id:'audit-reel',source:'manual',name:'AUDIT REEL',size:5000,lineType:'PE',lineNo:2}]
    }));
    await globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.run({loadCatalog:false});
  },id);
  await setOwned('rod-a');
  await page.locator('#conditionsPackBtn').click();
  const rod=page.locator('[data-id="plan-rod"]');
  assert.match(await rod.textContent(),/AUDIT ROD/);
  await rod.locator('label').click();
  assert.equal(await rod.locator('input').isChecked(),true);
  await page.locator('#packStandaloneCloseV30').click();
  await setOwned('rod-b');
  await page.locator('#conditionsPackBtn').click();
  assert.equal(await rod.locator('input').isChecked(),false,'a different physical rod with the same name is not already packed');
  await page.locator('#packStandaloneCloseV30').click();

  // Fail the cold loader once, then reopen the same panel to retry.
  let loaderRequests=0;
  await page.route('**/lure-catalog-loader.js*',route=>++loaderRequests===1?route.abort():route.continue());
  await fish('シーバス');
  const panel=page.locator('#lureCatalogPanel');
  await panel.locator('summary').click();
  await page.waitForFunction(()=>document.getElementById('lureCatalogBody')?.textContent?.includes('読み込めませんでした'));
  await panel.locator('summary').click();
  await panel.locator('summary').click();
  await page.locator('#lureCatalogBody .lureCatalogItem').first().waitFor();
  assert.equal(loaderRequests,2,'the failed script must be removed so retry makes a new request');
  const seabassText=await page.locator('#lureCatalogBody').textContent();
  // An older, slower request must not overwrite the latest target's response.
  await page.route('**/lure-catalog-*-lightgame-*.js',async route=>{
    await new Promise(resolve=>setTimeout(resolve,250));await route.continue();
  });
  await page.evaluate(async()=>{
    const api=globalThis.FISH_TARGET_LURE_CATALOG,host=document.getElementById('lureCatalogBody');
    const older=api.render(host,'アジ','アジング');
    const newer=api.render(host,'シーバス','ルアーシーバス');
    await Promise.all([older,newer]);
  });
  assert.equal(await page.locator('#lureCatalogBody').textContent(),seabassText,'older target candidates cannot overwrite the current list');
  assert.deepEqual(errors,[]);
  console.log(`V34_COMPLETION_BROWSER_QA_PASS ${JSON.stringify({engine:process.env.FISH_TARGET_QA_ENGINE||'chromium',decoded:decoded.results.length})}`);
}finally{await browser.close()}
