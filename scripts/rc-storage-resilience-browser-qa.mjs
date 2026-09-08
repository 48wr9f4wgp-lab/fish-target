import assert from 'node:assert/strict';
import {chromium,webkit,devices} from 'playwright';

const engine=process.env.FISH_TARGET_QA_ENGINE||'chromium';
const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await ({chromium,webkit}[engine]).launch({headless:true});
try{
  for(const raw of ['null','[]','42']){
    const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},serviceWorkers:'block'});
    const page=await context.newPage();
    const errors=[];
    page.on('pageerror',error=>errors.push(String(error)));
    await context.addInitScript(({raw})=>{
      localStorage.setItem('fish_target_v9_checklists',raw);
      localStorage.setItem('fish_target_v17_tackle',JSON.stringify({
        rods:[null,42,[],{id:'rc-rod',name:'RC ROD',power:'MH',length:9.6,maxLure:80}],
        reels:[null,false,[],{id:'rc-reel',name:'RC REEL',size:5000,lineType:'PE',lineNo:2}]
      }));
    },{raw});
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
    await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:20000});
    await page.locator('#appPackTabV30').waitFor({state:'visible'});
    await page.locator('#appPackTabV30').click();
    await page.locator('#packStandaloneV30').waitFor({state:'visible'});
    assert.equal(await page.locator('.quickPackItemV28').count(),8);
    assert.equal(await page.evaluate(()=>localStorage.getItem('fish_target_v9_checklists')),raw,'opening does not auto-migrate storage');
    await page.locator('.quickPackItemV28').first().click();
    await page.locator('#packStandaloneCloseV30').click();
    await page.locator('#appPackTabV30').click();
    assert.equal((await page.locator('#quickPackCountV28').textContent()).trim(),'1/8');
    await page.locator('#packStandaloneCloseV30').click();
    await page.locator('#home.on').waitFor({state:'visible'});
    await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
    await page.locator('#result.on').waitFor({state:'visible'});
    await page.locator('#tackleAutoBuildV29').waitFor({state:'visible'});
    const owned=await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle'));
    await page.locator('#autoBuildRunV29').click();
    await page.waitForFunction(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD?.getState().status==='ready',null,{timeout:45000});
    assert.equal(await page.evaluate(()=>localStorage.getItem('fish_target_v17_tackle')),owned,'AUTO BUILD preserves malformed storage verbatim');
    assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_TACKLE_AUTO_BUILD.getState().setResult.myBestSet.rod.id),'rc-rod');
    assert.deepEqual(errors,[]);
    await context.close();
  }
  {
    const context=await browser.newContext({...devices['iPhone 13'],viewport:{width:390,height:844},serviceWorkers:'block'});
    const page=await context.newPage();
    await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
    await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
    await page.locator('#appPackTabV30').waitFor({state:'visible'});
    await page.locator('#appPackTabV30').click();
    await page.locator('#packStandaloneV30').waitFor({state:'visible'});
    const before=await page.evaluate(()=>localStorage.getItem('fish_target_v9_checklists'));
    await page.evaluate(()=>{const proto=Object.getPrototypeOf(localStorage);Object.defineProperty(proto,'setItem',{configurable:true,value(){throw new DOMException('Quota exceeded','QuotaExceededError')}})});
    await page.locator('.quickPackItemV28').first().click();
    assert.equal(await page.locator('.quickPackItemV28 input').first().isChecked(),false,'failed write rolls the checkbox back');
    assert.equal(await page.evaluate(()=>localStorage.getItem('fish_target_v9_checklists')),before,'failed write leaves persisted packing state untouched');
    await page.locator('#quickPackSaveStatusV30').waitFor({state:'visible'});
    assert.match((await page.locator('#quickPackSaveStatusV30').textContent())||'',/保存できません/,'failed write is visible to the user');
    await context.close();
  }
  console.log('RC_STORAGE_RESILIENCE_PASS',engine);
}finally{await browser.close()}
