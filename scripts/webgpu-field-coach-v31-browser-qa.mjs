import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];
page.on('pageerror',error=>errors.push(String(error)));

await page.addInitScript(()=>{
  Object.defineProperty(navigator,'gpu',{configurable:true,value:{}});
  globalThis.FISH_TARGET_WEBGPU_COACH_TEST_BACKEND={
    async load(cb){cb?.({status:'ready',progress:100})},
    async generate(messages){
      if(!Array.isArray(messages)||!messages.length)throw new Error('messages missing');
      return 'ヒラメの確定済みプランを確認。\n表示中の仕掛けとFIRST CASTを使って開始。';
    }
  };
});

await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),{timeout:20000});
await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_WEBGPU_FIELD_COACH),{timeout:10000});

assert.equal(await page.locator('script[data-extension="webgpu-field-coach-v31-js"]').count(),1);
assert.equal(await page.locator('link[data-extension="webgpu-field-coach-v31-css"]').count(),1);
assert.equal(await page.locator('#webgpuFieldCoachV31').count(),1);

await page.locator('button.fish[data-fish="ヒラメ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.locator('#webgpuCoachRunV31').click();
await page.waitForFunction(()=>document.getElementById('webgpuCoachStatusV31')?.textContent?.includes('WebGPU'),{timeout:5000});

const output=(await page.locator('#webgpuCoachAnswerV31').textContent())||'';
assert.match(output,/ヒラメ/);
assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_WEBGPU_FIELD_COACH.supported()),true);
assert.deepEqual(errors,[]);

const guarded=await page.evaluate(()=>{
  const coach=globalThis.FISH_TARGET_WEBGPU_FIELD_COACH;
  try{
    coach.guardOutput('重量99kgで開始。',{requirements:{rod:'10g'}});
    return false;
  }catch{
    return true;
  }
});
assert.equal(guarded,true);

await context.close();
await browser.close();
console.log('WEBGPU_FIELD_COACH_V31_BROWSER_QA_PASS');
