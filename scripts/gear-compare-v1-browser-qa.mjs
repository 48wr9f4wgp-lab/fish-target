import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';
import {mkdir} from 'node:fs/promises';
const engine=process.env.FISH_TARGET_QA_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch();
const base=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const publication=process.env.FISH_TARGET_COMPARE_PUBLICATION==='1';
const artifact=process.env.FISH_TARGET_QA_DIAGNOSTICS||'/tmp/gear-compare-qa';
const context=await browser.newContext({viewport:{width:390,height:844},locale:'ja-JP',timezoneId:'Asia/Tokyo',serviceWorkers:'block'});
const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
const settled=()=>page.waitForFunction(()=>globalThis.FISH_TARGET_NAVIGATION&&!FISH_TARGET_NAVIGATION.isRestoring());
const selection=query=>page.locator('#gcQuery').fill(query);
try{
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'));
  await settled();
  if(publication){
    assert.equal(await page.locator('#gearCompareHome').count(),0);
    assert.equal(await page.locator('#gearCompareLaunch').count(),0);
    assert.equal(await page.evaluate(()=>!!globalThis.FISH_TARGET_GEAR_COMPARE),false);
    assert.equal(await page.evaluate(()=>performance.getEntriesByType('resource').some(r=>/gear-compare-v1/.test(r.name))),false);
    console.log('GEAR_COMPARE_PUBLICATION_QA_PASS',engine.name());
  }else{
    assert.equal(await page.evaluate(()=>typeof cur==='undefined'||cur===null),true,'fish not required');
    assert.equal(await page.locator('#gearCompareHome').isVisible(),true);
    const owned=await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle'));
    await page.locator('#gearCompareHome').click();
    await page.waitForFunction(()=>document.getElementById('gcCount')?.textContent.includes('254型番'));
    await page.waitForFunction(()=>FISH_TARGET_NAVIGATION.getState()?.modal==='compare');
    await selection('レガリス 5000');await page.locator('#gcResults [data-gc-select]').click();
    await selection('ナスキー C5000XG');await page.locator('#gcResults [data-gc-select]').click();
    await page.locator('#gcGo').click();
    assert.equal(await page.locator('#gcTable thead th').count(),3);
    assert.match(await page.locator('#gcTable').innerText(),/DAIWA/);
    assert.match(await page.locator('#gcTable').innerText(),/SHIMANO/);
    assert.match(await page.locator('#gcTable').innerText(),/基準比 \+55g/);
    assert.match(await page.locator('#gcTable').innerText(),/¥15,100/);
    // Invalid criteria must invalidate stale comparison verdicts and actions.
    await page.locator('.gc-conditions summary').click();await page.locator('#gcBudget').fill('-1');
    await page.waitForFunction(()=>document.getElementById('gcError')?.textContent.includes('0より'));
    assert.equal(await page.locator('#gcComparison').isHidden(),true);
    assert.equal(await page.locator('#gcGo').isDisabled(),true);
    assert.equal(await page.locator('#gcQuickCompare').isDisabled(),true);
    assert.equal((await page.locator('#gcTable').textContent()||'').trim(),'');
    await page.locator('#gcBudget').fill('');await page.waitForFunction(()=>!document.getElementById('gcComparison').hidden);
    await mkdir(artifact,{recursive:true});
    for(const width of [375,390,430]){
      await page.setViewportSize({width,height:844});
      const m=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,sheet:document.getElementById('gearCompareSheet').scrollWidth,table:document.querySelector('.gc-table-scroll').scrollWidth}));
      assert.ok(m.doc<=width+1&&m.sheet<=width+1,`page overflow at ${width}: ${JSON.stringify(m)}`);
      await page.screenshot({path:`${artifact}/compare-${engine.name()}-${width}.png`});
    }
    const beforeRows=await page.locator('#gcTable tbody tr').count();await page.locator('#gcDifferences').check();assert.ok(await page.locator('#gcTable tbody tr').count()<beforeRows);
    await selection('カルディア 5000-CXH');await page.locator('#gcResults [data-gc-select]').click();
    await selection('ステラ C5000XG');await page.locator('#gcResults [data-gc-select]').click();assert.match(await page.locator('#gcError').textContent(),/最大3点/);
    await page.locator('#gcClear').click();await page.locator('#gcReset').click();
    if(!(await page.locator('.gc-conditions').getAttribute('open')))await page.locator('.gc-conditions summary').click();await page.locator('#gcPe').fill('2');await page.locator('#gcMetres').fill('300');
    assert.ok(await page.locator('#gcResults .gc-product').count()>1);
    await selection('レガリス 4000');assert.equal(await page.locator('#gcResults .gc-product').count(),0);
    await page.locator('#gcReset').click();await selection('レガリス 5000');await page.locator('#gcResults [data-gc-similar]').click();assert.ok(await page.locator('#gcSimilarRows .gc-product').count()>0);
    await page.locator('[data-gc-kind=rod]').click();await selection('LATEO 96M');assert.match(await page.locator('#gcResults').innerText(),/単位を再確認/);
    await page.keyboard.press('Escape');await settled();assert.equal(await page.locator('#gearCompareSheet').isHidden(),true);
    // Real browser back/forward/reload restores compare as a modal, not as a fish-required view.
    await page.locator('#gearCompareHome').click();await page.waitForFunction(()=>FISH_TARGET_NAVIGATION.getState()?.modal==='compare');
    await page.goBack();await settled();assert.equal(await page.locator('#gearCompareSheet').isHidden(),true);
    await page.goForward();await settled();assert.equal(await page.locator('#gearCompareSheet').isVisible(),true);
    await page.reload();await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'));await settled();assert.equal(await page.locator('#gearCompareSheet').isVisible(),true);
    await page.locator('#gcClose').click();await settled();
    await page.locator('#appTabBarV26 [data-app-tab=tackle]').click();await page.locator('#gearCompareLaunch').waitFor({state:'visible'});await page.locator('#gearCompareLaunch').click();
    await page.waitForFunction(()=>FISH_TARGET_NAVIGATION.getState()?.modal==='compare');assert.equal(await page.locator('#tackleSheet').isHidden(),true);
    await page.locator('#gcClose').click();await settled();assert.equal(await page.locator('#tackleSheet').isVisible(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle')),owned,'comparison must not mutate MY TACKLE');
    assert.deepEqual(errors,[]);
    console.log('GEAR_COMPARE_BROWSER_QA_PASS',engine.name());
    // Network failure is surfaced with retry. This uses an isolated cold catalog context.
    const cold=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),retry=await cold.newPage();
    await retry.route('**/catalog-batch-manifest.json*',route=>route.fulfill({status:503,body:'unavailable'}));
    await retry.goto(base);await retry.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'));await retry.locator('#gearCompareHome').click();await retry.locator('#gcRetry').waitFor({state:'visible'});
    await retry.unroute('**/catalog-batch-manifest.json*');await retry.locator('#gcRetry').click();await retry.waitForFunction(()=>document.getElementById('gcCount').textContent.includes('254型番'));
    await cold.close();console.log('GEAR_COMPARE_RETRY_QA_PASS',engine.name());
  }
}catch(e){await mkdir(artifact,{recursive:true});await page.screenshot({path:`${artifact}/failure-${engine.name()}.png`}).catch(()=>{});throw e;}finally{await browser.close();}
