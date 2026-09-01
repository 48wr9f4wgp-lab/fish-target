import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../fish-photo-v27.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../fish-photo-v27.css',import.meta.url),'utf8');
const pwa=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');

test('V27R3 keeps bundled real fish first and only resolves missing species remotely',()=>{
  assert.match(js,/FISH_TARGET_REAL_FISH\?\.species/);
  assert.match(js,/LOCAL\.has\(name\)/);
  assert.match(js,/version:'V27R3'/);
  assert.match(js,/provider:'Wikimedia'/);
  assert.match(js,/licensed-photo-only-with-svg-offline-fallback/);
});

test('V27R3 resolves jawiki imageinfo first then falls back to Commons with license validation',()=>{
  assert.match(js,/ja\.wikipedia\.org\/w\/api\.php/);
  assert.match(js,/imageInfo\('https:\/\/ja\.wikipedia\.org\/w\/api\.php'/);
  assert.match(js,/imageInfo\('https:\/\/commons\.wikimedia\.org\/w\/api\.php'/);
  assert.match(js,/extmetadata/);
  assert.match(js,/LicenseShortName/);
  assert.match(js,/CC0\|Public domain\|CC BY/);
  assert.match(js,/if\(!allowed\.test\(license\)\)return null/);
  assert.doesNotMatch(js,/unsplash|pexels|pixabay|googleusercontent/i);
});

test('V27R3 adds explicit aliases for device-observed and taxonomy-resolved species',()=>{
  assert.match(js,/'サバ':'マサバ'/);
  assert.match(js,/'イワシ':'マイワシ'/);
  assert.match(js,/'ハゼ':'マハゼ'/);
  assert.match(js,/'エソ':'マエソ'/);
  assert.match(js,/'オニカサゴ':'イズカサゴ'/);
  assert.match(js,/'マルイカ':'ケンサキイカ'/);
  assert.match(js,/'マブナ':'ギンブナ'/);
  assert.doesNotMatch(js,/'カレイ':'マコガレイ'/);
  assert.doesNotMatch(js,/'タナゴ':'ヤリタナゴ'/);
  assert.doesNotMatch(js,/'ヒイカ':'ジンドウイカ'/);
  assert.match(js,/ft-fish-photo-v27r3/);
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
