import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../fish-photo-v27.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../fish-photo-v27.css',import.meta.url),'utf8');
const pwa=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');

test('V27R4 keeps bundled real fish first and only resolves taxonomy-safe missing species remotely',()=>{
  assert.match(js,/FISH_TARGET_REAL_FISH\?\.species/);
  assert.match(js,/LOCAL\.has\(name\)/);
  assert.match(js,/version:'V27R4'/);
  assert.match(js,/provider:'Wikimedia'/);
  assert.match(js,/licensed-photo-only-with-taxonomy-fail-closed-svg-offline-fallback/);
});

test('V27R4 resolves jawiki imageinfo first then falls back to Commons with license validation',()=>{
  assert.match(js,/ja\.wikipedia\.org\/w\/api\.php/);
  assert.match(js,/imageInfo\('https:\/\/ja\.wikipedia\.org\/w\/api\.php'/);
  assert.match(js,/imageInfo\('https:\/\/commons\.wikimedia\.org\/w\/api\.php'/);
  assert.match(js,/extmetadata/);
  assert.match(js,/LicenseShortName/);
  assert.match(js,/CC0\|Public domain\|CC BY/);
  assert.match(js,/if\(!allowed\.test\(license\)\)return null/);
  assert.doesNotMatch(js,/unsplash|pexels|pixabay|googleusercontent/i);
});

test('V27R4 fails closed to resolved canonical photo taxa and invalidates stale ambiguous cache',()=>{
  assert.match(js,/canonicalPhotoAlias=Object\.freeze\(\{'エソ':'マエソ','オニカサゴ':'イズカサゴ','マルイカ':'ケンサキイカ'\}\)/);
  assert.match(js,/canonicalPhotoAlias\[name\]\?\[canonicalPhotoAlias\[name\]\]/,'canonical targets must not fall back to the ambiguous product label');
  assert.match(js,/!canonical\|\|v\.article===canonical/,'canonical cached article must match the resolved taxon title');
  assert.match(js,/if\(canonical\)localStorage\.removeItem\(cacheKey\(name\)\)/,'stale canonical cache must be removed');
  assert.match(js,/canonicalAliases:canonicalPhotoAlias/);
});

test('V27R4 does not fake broad or compound product labels with one exact-species photo',()=>{
  for(const name of ['ヤマメ・イワナ','カレイ','サバ','イワシ','ハゼ','ベラ','タナゴ'])assert.match(js,new RegExp(`REMOTE_IDENTITY_FAIL_CLOSED[^;]*${name}`));
  assert.doesNotMatch(js,/'ヤマメ・イワナ':'ヤマメ'/);
  assert.doesNotMatch(js,/'サバ':'マサバ'/);
  assert.doesNotMatch(js,/'イワシ':'マイワシ'/);
  assert.doesNotMatch(js,/'ハゼ':'マハゼ'/);
  assert.match(js,/if\(REMOTE_IDENTITY_FAIL_CLOSED\.has\(name\)\)return false/);
  assert.match(js,/remoteIdentityFailClosed:Object\.freeze/);
});

test('V27R4 preserves explicit aliases only where the product taxon has been deliberately resolved',()=>{
  assert.match(js,/'エソ':'マエソ'/);
  assert.match(js,/'オニカサゴ':'イズカサゴ'/);
  assert.match(js,/'マルイカ':'ケンサキイカ'/);
  assert.match(js,/'マブナ':'ギンブナ'/);
  assert.doesNotMatch(js,/'カレイ':'マコガレイ'/);
  assert.doesNotMatch(js,/'タナゴ':'ヤリタナゴ'/);
  assert.doesNotMatch(js,/'ヒイカ':'ジンドウイカ'/);
  assert.match(js,/ft-fish-photo-v27r3/,'cache namespace stays stable so existing valid receipts can be reused');
});

test('V27 remote provider is production HTTPS only unless explicitly enabled for dedicated QA',()=>{
  assert.match(js,/location\.protocol==='https:'/);
  assert.match(js,/fishPhotoRemote/);
  assert.match(js,/fishPhotoEager/);
  assert.match(js,/if\(!REMOTE_ENABLED\)return/);
});

test('V27 provides visible attribution and preserves SVG fallback',()=>{
  assert.match(js,/fishPhotoCreditV27/);
  assert.match(js,/Wikimedia Commons/);
  assert.match(js,/Wikipedia \/ Wikimedia/);
  assert.match(css,/\.fishPhotoMountedV27>\.speciesSvg\{opacity:0\}/);
  assert.match(css,/\.fishPhotoCreditV27\{/);
  assert.match(css,/font-size:7px/);
  assert.match(js,/catch\(\(\)=>null\)/);
});

test('V27 handles detail-host species changes without stale photo reuse',()=>{
  assert.match(js,/host\.dataset\.fishPhotoName!==name/);
  assert.match(js,/clearHost\(host\)/);
  assert.match(js,/document\.getElementById\('rname'\)/);
});

test('V27 assets are bootstrapped and shipped in the PWA shell',()=>{
  assert.match(pwa,/fish-photo-v27\.css/);
  assert.match(pwa,/fish-photo-v27\.js/);
  assert.match(build,/'fish-photo-v27\.css'/);
  assert.match(build,/'fish-photo-v27\.js'/);
});
