import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];const consoleErrors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

async function ready(){
  await page.locator('#grid .fish').first().waitFor({state:'visible',timeout:20000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_RESULT_UX_V20&&globalThis.FISH_TARGET_RESULT_UX_V21),null,{timeout:20000});
  await page.locator('button.fish[data-fish="シロギス"]').waitFor({state:'visible',timeout:20000});
}
async function openFish(name){
  await page.locator(`button.fish[data-fish="${name}"]`).click();
  await page.locator('#result.on').waitFor({state:'visible'});
  await page.locator('.fitV20Summary').waitFor({state:'visible'});
}
async function setTackle(data){
  await page.evaluate(value=>localStorage.setItem('fish_target_v17_tackle',JSON.stringify(value)),data);
}

await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
await ready();
await setTackle({
  rods:[{id:'bad-rod',source:'manual',name:'DEMO LIGHT 76L',length:7.6,power:'L',maxLure:20}],
  reels:[{id:'surf-reel',source:'catalog',name:'SURF LEADER SD 35 HYOUJYUN',applicationRaw:'投げ・遠投',dragTypeRaw:'ドラグあり',lineType:'',lineNo:null}]
});
await page.reload({waitUntil:'networkidle'});await ready();await openFish('シロギス');

assert.equal((await page.locator('.tackleFitHead strong').textContent()).trim(),'このセットで行ける？','action-first title');
assert.equal((await page.locator('.fitV20Summary b').textContent()).trim(),'このセットは見直し推奨','bad rod drives clear summary');
const rod=page.locator('.fitV20Item').filter({hasText:'ROD'});
const reel=page.locator('.fitV20Item').filter({hasText:'REEL'});
assert.match((await rod.textContent())||'',/DEMO LIGHT 76L/,'bad rod selected');
assert.match((await rod.textContent())||'',/× 非推奨/,'metric surf rod mismatch is hard fail');
assert.match((await rod.textContent())||'',/3\.6〜4\.2m/,'metric target remains native display');
assert.match((await reel.textContent())||'',/SURF LEADER SD 35 HYOUJYUN/,'surf reel selected');
assert.match((await reel.textContent())||'',/△ 要確認/,'missing installed line remains explicit soft check');
assert.match((await reel.textContent())||'',/今巻いているライン種類を登録/,'reel explains only missing user data');
assert.equal((await page.locator('#tackleFitCard').textContent()||'').includes('NEXT BUY'),false,'duplicate NEXT BUY removed');
assert.equal(await page.locator('#tackleFitBody .fitSummary').isVisible(),false,'legacy summary never leaks into UX21');
assert.equal(await page.locator('.fitV20DetailBody').isVisible(),false,'technical rationale stays collapsed');
assert.equal(await page.locator('#resultDockV20').isVisible(),true,'result action dock visible');
assert.equal(await page.locator('.nav').isVisible(),false,'generic nav hidden on result');
assert.equal((await page.locator('#result .toprow .brand').textContent()).trim(),'FISH TARGET · GAME PLAN','internal build string removed from result chrome');

const dockBox=await page.locator('#resultDockV20').boundingBox();
assert.ok(dockBox&&dockBox.height<=58,`device dock compact: ${dockBox?.height}`);
const heroBox=await page.locator('#result .resultHero').boundingBox();
assert.ok(heroBox&&heroBox.height<=220,`result hero compact: ${heroBox?.height}`);
const gearBox=await page.locator('#gear').boundingBox();
assert.ok(gearBox&&gearBox.height<=190,`four tackle cards compact: ${gearBox?.height}`);

const x=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
assert.ok(x.doc<=391&&x.body<=391&&x.viewport===390,'no result overflow');

await page.locator('#resultDockV20 [data-action="field"]').click();
await page.locator('#fieldmode.on').waitFor({state:'visible'});
assert.equal(await page.locator('#resultDockV20').isVisible(),false,'dock leaves with result view');
await page.locator('#fmBackPlan').click();
await page.locator('#result.on').waitFor({state:'visible'});
assert.equal(await page.locator('#resultDockV20').isVisible(),true,'dock returns with result view');

await page.locator('#resultDockV20 [data-action="home"]').click();
await page.locator('#home.on').waitFor({state:'visible'});
assert.equal(await page.locator('#resultDockV20').isVisible(),false,'dock hidden on home');
assert.equal(await page.locator('.nav').isVisible(),true,'generic nav restored on home');

await setTackle({
  rods:[{id:'good-rod',source:'manual',name:'SURF 13FT',length:13,power:'',maxLure:null}],
  reels:[{id:'surf-reel',source:'catalog',name:'SURF LEADER SD 35 HYOUJYUN',applicationRaw:'投げ・遠投',dragTypeRaw:'ドラグあり',lineType:'PE',lineNo:1.0}]
});
await page.reload({waitUntil:'networkidle'});await ready();await openFish('シロギス');
assert.equal((await page.locator('.fitV20Summary b').textContent()).trim(),'このセットでOK','good surf setup gets clear pass');
assert.match((await page.locator('.fitV20Item').filter({hasText:'ROD'}).textContent())||'',/○ OK/,'good rod pass');
assert.match((await page.locator('.fitV20Item').filter({hasText:'REEL'}).textContent())||'',/○ OK/,'dedicated surf reel pass');
assert.match((await page.locator('.fitV20Item').filter({hasText:'REEL'}).textContent())||'',/投げ専用・遠投対応/,'dedicated reel target replaces generic 3000-4000 display');

await page.locator('#resultDockV20 [data-action="home"]').click();
await page.locator('#home.on').waitFor({state:'visible'});
await setTackle({
  rods:[{id:'shore-m',source:'manual',name:'DEMO SHORE 96M',length:9.6,power:'M',maxLure:80}],
  reels:[{id:'spin-3000',source:'manual',name:'DEMO SPIN 3000',size:3000,lineType:'PE',lineNo:2.0}]
});
await page.reload({waitUntil:'networkidle'});await ready();await openFish('ブリ・ワラサ');
assert.equal(await page.locator('#methodPickerV1 [data-method-id]').count(),6,'six methods remain directly visible');
const methodMetrics=await page.locator('.methodPickerRail').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth,display:getComputedStyle(el).display,cols:getComputedStyle(el).gridTemplateColumns}));
assert.equal(methodMetrics.display,'grid','mobile methods use explicit grid');
assert.ok(methodMetrics.scroll<=methodMetrics.client+1,`method choices do not clip horizontally ${methodMetrics.scroll}/${methodMetrics.client}`);
assert.equal(methodMetrics.cols.split(' ').length,3,'method grid exposes three columns');
assert.equal((await page.locator('.fitV20Summary b').textContent()).trim(),'このセットは見直し推奨','two known core shortfalls aggregate to review');
assert.match((await page.locator('.fitV20Summary small').textContent())||'',/パワー・番手が推奨より不足/,'aggregate reason names the two core gaps');
assert.equal((await page.locator('.fitV20Details>summary em').textContent()).trim(),'要確認 2件','detail count uses human wording');
assert.equal(await page.locator('#tackleFitBody .fitSummary').isVisible(),false,'no duplicate legacy decision on real-device scenario');
const buriGear=await page.locator('#gear').boundingBox();assert.ok(buriGear&&buriGear.height<=190,`buri tackle cards compact: ${buriGear?.height}`);

assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
await browser.close();
console.log('RESULT_UX_V21_BROWSER_QA_PASS');
