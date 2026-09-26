import assert from 'node:assert/strict';
import {chromium,webkit} from 'playwright';

const engine=process.env.FISH_TARGET_QA_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch({headless:true});
const base=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const enlarge=()=>{
  for(const el of document.querySelectorAll('body *')){
    if(el.dataset.qaTextEnlarged)continue;
    const style=getComputedStyle(el);
    if(style.display==='none'||style.visibility!=='visible')continue;
    if(![...el.childNodes].some(node=>node.nodeType===Node.TEXT_NODE&&node.textContent.trim()))continue;
    el.dataset.qaTextEnlarged='1';
    el.style.setProperty('font-size',`${parseFloat(style.fontSize)*2}px`,'important');
  }
};
const fits=()=>document.documentElement.scrollWidth<=innerWidth+1;
try{
  for(const width of [375,390,430]){
    const page=await browser.newPage({viewport:{width,height:812},serviceWorkers:'block'});
    const errors=[];page.on('pageerror',error=>errors.push(String(error)));
    await page.goto(base);await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'));
    await page.evaluate(enlarge);
    assert.equal(await page.evaluate(fits),true,`home horizontal reflow at ${width}`);
    assert.equal(await page.locator('.methodSmall').first().evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,`fish method must not be truncated at ${width}`);
    await page.locator('button.fish[data-fish="シーバス"]').click();
    await page.evaluate(enlarge);
    await page.waitForFunction(()=>document.body.classList.contains('largeTextV34'));
    assert.equal(await page.evaluate(fits),true,`result horizontal reflow at ${width}`);
    assert.equal(await page.locator('#pmethod').evaluate(el=>el.scrollWidth<=el.clientWidth+1),true,`method title must not be truncated at ${width}`);
    assert.equal(await page.locator('#resultDockV20').evaluate(el=>getComputedStyle(el).position),'static');
    await page.locator('#tackleEditFromResult').click();
    await page.evaluate(enlarge);
    assert.equal(await page.evaluate(fits),true,`MY TACKLE horizontal reflow at ${width}`);
    await page.locator('#tackleClose').click();
    await page.locator('#fieldModeBtn').click();
    await page.evaluate(enlarge);
    assert.equal(await page.evaluate(fits),true,`field horizontal reflow at ${width}`);
    assert.equal(await page.locator('.fieldModeHead').evaluate(el=>el.getBoundingClientRect().right<=innerWidth+1),true);
    await page.locator('#fieldBack').click();
    assert.deepEqual(errors,[]);
    await page.close();
  }
  // Browser zoom narrows the CSS viewport; the navigation must remain usable there too.
  const page=await browser.newPage({viewport:{width:188,height:812},serviceWorkers:'block'});
  await page.goto(base);await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'));
  await page.locator('button.fish[data-fish="シーバス"]').click();
  assert.equal(await page.evaluate(fits),true,'zoomed CSS viewport reflow');
  await page.locator('#tackleEditFromResult').click();await page.locator('#tackleClose').click();
  await page.locator('#fieldModeBtn').click();assert.equal(await page.evaluate(fits),true);
  await page.close();
  console.log('LEGIBILITY_V34_BROWSER_QA_PASS',engine.name());
}finally{await browser.close()}
