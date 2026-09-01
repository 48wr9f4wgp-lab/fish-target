import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const QA_URL=`${BASE}${BASE.includes('?')?'&':'?'}fishPhotoRemote=on&fishPhotoEager=on&fishPhotoQaAutoLoad=on`;
const MOCK_IMAGE='<svg xmlns="http://www.w3.org/2000/svg" width="32" height="16" viewBox="0 0 32 16"><rect width="32" height="16" fill="#7ec8e3"/><ellipse cx="16" cy="8" rx="10" ry="5" fill="#1f6f8b"/><circle cx="22" cy="7" r="1" fill="#fff"/></svg>';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];const consoleErrors=[];let wikiPageHits=0,wikiInfoHits=0,commonsHits=0;
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
const cors={'access-control-allow-origin':'*','cache-control':'no-store'};

await page.route('https://ja.wikipedia.org/**',route=>{
  const url=new URL(route.request().url());
  const prop=url.searchParams.get('prop')||'';
  if(prop.includes('imageinfo')){
    wikiInfoHits++;
    return route.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({query:{pages:{2:{imageinfo:[{thumburl:'https://upload.wikimedia.org/fake/saba.svg',url:'https://upload.wikimedia.org/fake/saba.svg',extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'},Artist:{value:'Test Photographer'}}}]}}}})});
  }
  wikiPageHits++;
  return route.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({query:{pages:{1:{pageid:1,title:'マサバ',pageimage:'Saba.jpg'}}}})});
});
await page.route('https://commons.wikimedia.org/**',route=>{commonsHits++;return route.fulfill({status:200,headers:{...cors,'content-type':'application/json'},body:JSON.stringify({query:{pages:{2:{imageinfo:[{thumburl:'https://upload.wikimedia.org/fake/saba.svg',url:'https://upload.wikimedia.org/fake/saba.svg',extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'},Artist:{value:'Test Photographer'}}}]}}}})})});
await page.route('https://upload.wikimedia.org/**',route=>route.fulfill({status:200,headers:{'cache-control':'no-store','content-type':'image/svg+xml'},body:MOCK_IMAGE}));

await page.goto(QA_URL,{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
assert.equal(await page.locator('link[data-extension="fish-photo-v27-css"]').count(),1,'V27 photo CSS loaded once');
assert.equal(await page.locator('script[data-extension="fish-photo-v27-js"]').count(),1,'V27 photo JS loaded once');
assert.deepEqual(await page.evaluate(()=>({version:globalThis.FISH_TARGET_PHOTO_V27?.version,provider:globalThis.FISH_TARGET_PHOTO_V27?.provider,enabled:globalThis.FISH_TARGET_PHOTO_V27?.enabled,eager:globalThis.FISH_TARGET_PHOTO_V27?.eager,qaAutoLoad:globalThis.FISH_TARGET_PHOTO_V27?.qaAutoLoad})),{version:'V27R3',provider:'Wikimedia',enabled:true,eager:true,qaAutoLoad:true},'V27R3 dedicated QA mode exposed');
const aliases=await page.evaluate(()=>globalThis.FISH_TARGET_PHOTO_V27?.aliases||{});
assert.equal(aliases['エソ'],'マエソ','エソ remote image lookup uses resolved マエソ taxon');
assert.equal(aliases['オニカサゴ'],'イズカサゴ','オニカサゴ remote image lookup uses resolved イズカサゴ taxon');
assert.equal(aliases['マルイカ'],'ケンサキイカ','マルイカ remote image lookup uses resolved ケンサキイカ taxon');
assert.equal(aliases['カレイ'],undefined,'generic カレイ must not collapse to one species');
assert.equal(aliases['タナゴ'],undefined,'generic タナゴ must not collapse to one species');
assert.equal(aliases['ヒイカ'],undefined,'generic ヒイカ must not collapse to one species');

const saba=page.locator('#grid .fish[data-fish="サバ"]');
await saba.waitFor({state:'attached',timeout:10000});
await saba.locator('.art.fishPhotoMountedV27').waitFor({state:'attached',timeout:15000});
assert.equal(await saba.locator('.art').getAttribute('data-fish-asset'),'wikimedia-licensed-photo','missing local fish gets licensed remote photo');
assert.equal(await saba.locator('.fishPhotoV27').count(),1,'remote fish image mounted once');
assert.equal(await saba.locator('.fishPhotoCreditV27').count(),1,'photo attribution mounted once');
const credit=(await saba.locator('.fishPhotoCreditV27').textContent())||'';
assert.match(credit,/Wikipedia \/ Wikimedia/);assert.match(credit,/CC BY-SA 4\.0/);assert.match(credit,/Test Photographer/);
assert.ok(wikiPageHits>0&&wikiInfoHits>0,`jawiki metadata routes not exercised: ${JSON.stringify({wikiPageHits,wikiInfoHits,commonsHits})}`);
assert.equal(commonsHits,0,'jawiki imageinfo succeeds before Commons fallback');

const aji=page.locator('#grid .fish[data-fish="アジ"]');
await aji.scrollIntoViewIfNeeded();
await page.waitForFunction(()=>document.querySelector('#grid .fish[data-fish="アジ"] .art')?.dataset.fishAsset==='direct-avif-grid',null,{timeout:10000});
assert.equal(await aji.locator('.fishPhotoV27').count(),0,'bundled real fish remains first priority');

await saba.click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.waitForFunction(()=>document.getElementById('rname')?.textContent?.trim()==='サバ');
await page.locator('#tart.fishPhotoMountedV27').waitFor({state:'attached',timeout:10000});
assert.equal(await page.locator('#tart').getAttribute('data-fish-asset'),'wikimedia-licensed-photo','detail receives licensed photo');
assert.equal(await page.locator('#tart .fishPhotoCreditV27').count(),1,'detail attribution mounted once');

assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
await browser.close();
console.log('FISH_PHOTO_V27_BROWSER_QA_PASS');
