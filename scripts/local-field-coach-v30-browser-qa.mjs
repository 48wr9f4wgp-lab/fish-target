import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});

const nativeContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const nativePage=await nativeContext.newPage();
const errors=[];
nativePage.on('pageerror',error=>errors.push(String(error)));
await nativePage.addInitScript(()=>{
  globalThis.__fieldCoachMessages=[];
  globalThis.webkit={
    messageHandlers:{
      fishTargetLocalLLM:{
        postMessage(payload){globalThis.__fieldCoachMessages.push(payload)}
      }
    }
  };
});

await nativePage.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await nativePage.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),{timeout:20000});
await nativePage.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_LOCAL_FIELD_COACH),{timeout:10000});
assert.equal(await nativePage.locator('script[data-extension="local-field-coach-v30-js"]').count(),1,'local coach JS loads once');
assert.equal(await nativePage.locator('link[data-extension="local-field-coach-v30-css"]').count(),1,'local coach CSS loads once');
assert.equal(await nativePage.locator('#localFieldCoachV30').count(),1,'native bridge reveals local coach UI');

await nativePage.locator('button.fish[data-fish="ヒラメ"]').click();
await nativePage.locator('#result.on').waitFor({state:'visible'});
const ownedBefore=await nativePage.evaluate(()=>localStorage.getItem('fish_target_v17_tackle'));
await nativePage.locator('#localCoachRunV30').click();
await nativePage.waitForFunction(()=>globalThis.__fieldCoachMessages.length===1,{timeout:5000});

const payload=await nativePage.evaluate(()=>globalThis.__fieldCoachMessages[0]);
assert.equal(payload.schema,1);
assert.equal(payload.task,'render_field_coach');
assert.equal(payload.language,'ja');
assert.equal(payload.facts.species,'ヒラメ');
assert.ok(payload.facts.method,'method is included');
assert.equal(payload.rules.max_sentences,3);
assert.equal(payload.rules.use_only_facts,true);
assert.equal(payload.rules.do_not_calculate,true);
assert.equal(payload.rules.do_not_select_products,true);
assert.equal(payload.rules.do_not_invent_numbers,true);

await nativePage.evaluate(requestId=>{
  globalThis.FISH_TARGET_LOCAL_FIELD_COACH.resolve(requestId,{text:'ヒラメの確定済みプランを短く説明します。\n表示中のFIRST CASTと必須タックルを確認してください。'});
},payload.request_id);
await nativePage.waitForFunction(()=>document.getElementById('localCoachStatusV30')?.textContent?.includes('端末内生成'),{timeout:5000});
assert.match((await nativePage.locator('#localCoachAnswerV30').textContent())||'',/ヒラメ/);
assert.equal(await nativePage.evaluate(()=>localStorage.getItem('fish_target_v17_tackle')),ownedBefore,'coach never writes owned tackle');
assert.deepEqual(errors,[],'native-bridge coach must not introduce page errors');

await nativeContext.close();

const webContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const webPage=await webContext.newPage();
await webPage.goto(BASE,{waitUntil:'domcontentloaded',timeout:30000});
await webPage.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),{timeout:20000});
await webPage.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_LOCAL_FIELD_COACH),{timeout:10000});
assert.equal(await webPage.evaluate(()=>globalThis.FISH_TARGET_LOCAL_FIELD_COACH.nativeAvailable()),false,'plain web build has no native LLM bridge');
assert.equal(await webPage.locator('#localFieldCoachV30').count(),0,'plain web build hides local coach UI');

await webContext.close();
await browser.close();
console.log('LOCAL_FIELD_COACH_V30_BROWSER_QA_PASS');
