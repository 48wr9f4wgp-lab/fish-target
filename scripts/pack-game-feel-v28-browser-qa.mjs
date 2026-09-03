import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
const page=await context.newPage();
const errors=[];const consoleErrors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
assert.equal(await page.locator('script[data-extension="pack-checklist-v28-js"]').count(),1,'pack JS loaded once');
assert.equal(await page.locator('link[data-extension="game-feel-v28-css"]').count(),1,'game feel CSS loaded once');
await page.locator('#grid .fish').first().waitFor({state:'visible'});
assert.equal(await page.locator('#appPackTabV30').count(),1,'packing has its own app tab');
assert.equal(await page.locator('#appTabBarV26 button').count(),4,'global shell has four tabs');
assert.equal(await page.locator('#packStandaloneV30').isVisible(),false,'packing surface starts closed');

await page.locator('button.fish[data-fish="ブリ・ワラサ"]').click();
await page.locator('#result.on').waitFor({state:'visible'});
assert.equal(await page.locator('#result #quickPackV28').count(),0,'packing checklist is not inserted into fish result flow');
await page.locator('#back').click();
await page.locator('#home.on').waitFor({state:'visible'});

await page.locator('#appPackTabV30').click();
await page.locator('#packStandaloneV30').waitFor({state:'visible'});
assert.equal(await page.locator('#appPackTabV30.on').count(),1,'packing tab becomes active');
const defaults=await page.locator('.quickPackItemV28>span:last-child').allTextContents();
assert.deepEqual(defaults,['日焼け止め','虫除け','飲み物','タオル','モバイルバッテリー','ヘッドライト / ライト','ゴミ袋','救急用品']);
assert.equal((await page.locator('#quickPackCountV28').textContent())?.trim(),'0/8');

await page.locator('.quickPackItemV28').first().click();
assert.equal((await page.locator('#quickPackCountV28').textContent())?.trim(),'1/8');
const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('fish_target_v9_checklists')||'{}'));
assert.ok(saved.__quick_pack_v28_checked,'checked state stored inside existing checklist storage');

await page.locator('#quickPackEditV28').click();
assert.equal(await page.locator('#quickPackEditorV28').isVisible(),true,'editor opens');
assert.equal(await page.locator('.quickPackDeleteV28:visible').count(),8,'delete controls available in edit mode');
await page.locator('.quickPackDeleteV28').last().click();
assert.equal(await page.locator('.quickPackItemV28').count(),7,'standard item can be removed');
await page.locator('#quickPackAddInputV28').fill('<img src=x>');
await page.locator('#quickPackAddFormV28 button').click();
assert.equal(await page.locator('#quickPackListV28 img').count(),0,'custom item text is not interpreted as HTML');
assert.equal((await page.locator('#quickPackCountV28').textContent())?.trim(),'1/8');
assert.ok((await page.locator('.quickPackItemV28>span:last-child').allTextContents()).includes('<img src=x>'),'custom text preserved literally');

await page.locator('#quickPackResetV28').click();
assert.equal(await page.locator('.quickPackItemV28').count(),8,'reset restores standard items');
assert.equal((await page.locator('#quickPackCountV28').textContent())?.trim(),'0/8');
await page.locator('#quickPackEditV28').click();
for(const label of await page.locator('.quickPackItemV28').all())await label.click();
assert.equal((await page.locator('#quickPackCountV28').textContent())?.trim(),'8/8');
assert.ok(await page.locator('#quickPackV28.ready').count(),'all checked produces READY state');

await page.locator('#packStandaloneCloseV30').click();
assert.equal(await page.locator('#packStandaloneV30').isVisible(),false,'standalone packing surface closes');
assert.equal(await page.locator('#appTabBarV26 button[data-app-tab="home"].on').count(),1,'home tab is restored');

const overflow=await page.evaluate(()=>({doc:document.documentElement.scrollWidth,body:document.body.scrollWidth,viewport:innerWidth}));
assert.ok(overflow.doc<=391&&overflow.body<=391&&overflow.viewport===390,`390px overflow: ${JSON.stringify(overflow)}`);
assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_QUICK_PACK?.version),'PACK-STANDALONE-V30');
assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);

await browser.close();
console.log('PACK_STANDALONE_V30_BROWSER_QA_PASS');
