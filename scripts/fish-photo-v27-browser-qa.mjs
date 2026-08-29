import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=','base64');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
const page=await context.newPage();
const errors=[];const consoleErrors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});

await page.route('https://ja.wikipedia.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({query:{pages:{1:{pageid:1,title:'サバ',pageimage:'Saba.jpg'}}}})}));
await page.route('https://commons.wikimedia.org/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({query:{pages:{2:{imageinfo:[{thumburl:'https://upload.wikimedia.org/fake/saba.png',url:'https://upload.wikimedia.org/fake/saba.png',extmetadata:{LicenseShortName:{value:'CC BY-SA 4.0'},Artist:{value:'Test Photographer'}}}]}}}})}));
await page.route('https://upload.wikimedia.org/**',route=>route.fulfill({status:200,contentType:'image/png',body:PNG}));

await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
await page.waitForFunction(()=>document.documentElement.classList.contains('ft-ready'),null,{timeout:20000});
assert.equal(await page.locator('link[data-extension="fish-photo-v27-css"]').count(),1,'V27 photo CSS loaded once');
assert.equal(await page.locator('script[data-extension="fish-photo-v27-js"]').count(),1,'V27 photo JS loaded once');
assert.equal(await page.evaluate(()=>globalThis.FISH_TARGET_PHOTO_V27?.provider),'Wikimedia Commons','V27 provider exposed');

const saba=page.locator('#grid .fish[data-fish="サバ"]');
await saba.waitFor({state:'attached',timeout:10000});
await saba.scrollIntoViewIfNeeded();
await saba.locator('.art.fishPhotoMountedV27').waitFor({state:'attached',timeout:10000});
assert.equal(await saba.locator('.art').getAttribute('data-fish-asset'),'wikimedia-licensed-photo','missing local fish gets licensed remote photo');
assert.equal(await saba.locator('.fishPhotoV27').count(),1,'remote fish image mounted once');
const credit=(await saba.locator('.fishPhotoCreditV27').textContent())||'';
assert.match(credit,/Wikimedia Commons/);assert.match(credit,/CC BY-SA 4\.0/);assert.match(credit,/Test Photographer/);

const aji=page.locator('#grid .fish[data-fish="アジ"]');
await aji.scrollIntoViewIfNeeded();
await page.waitForFunction(()=>document.querySelector('#grid .fish[data-fish="アジ"] .art')?.dataset.fishAsset==='direct-avif-grid',null,{timeout:10000});
assert.equal(await aji.locator('.fishPhotoV27').count(),0,'bundled real fish remains first priority');

await saba.click();
await page.locator('#result.on').waitFor({state:'visible'});
await page.waitForFunction(()=>document.getElementById('rname')?.textContent?.trim()==='サバ');
await page.locator('#tart.fishPhotoMountedV27').waitFor({state:'attached',timeout:10000});
assert.equal(await page.locator('#tart').getAttribute('data-fish-asset'),'wikimedia-licensed-photo','detail receives licensed photo');

assert.deepEqual(errors,[],`page errors: ${errors.join('\n')}`);
assert.deepEqual(consoleErrors,[],`console errors: ${consoleErrors.join('\n')}`);
await browser.close();
console.log('FISH_PHOTO_V27_BROWSER_QA_PASS');
