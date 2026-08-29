import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../fish-photo-v27.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../fish-photo-v27.css',import.meta.url),'utf8');
const pwa=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');

test('V27 keeps bundled real fish first and only resolves missing species remotely',()=>{
  assert.match(js,/FISH_TARGET_REAL_FISH\?\.species/);
  assert.match(js,/LOCAL\.has\(name\)/);
  assert.match(js,/provider:'Wikimedia Commons'/);
  assert.match(js,/licensed-photo-only-with-svg-offline-fallback/);
});

test('V27 resolves Wikipedia page image then validates Commons license metadata',()=>{
  assert.match(js,/ja\.wikipedia\.org\/w\/api\.php/);
  assert.match(js,/commons\.wikimedia\.org\/w\/api\.php/);
  assert.match(js,/extmetadata/);
  assert.match(js,/LicenseShortName/);
  assert.match(js,/CC0\|Public domain\|CC BY/);
  assert.match(js,/license rejected/);
  assert.doesNotMatch(js,/unsplash|pexels|pixabay|googleusercontent/i);
});

test('V27 provides visible attribution and preserves SVG fallback',()=>{
  assert.match(js,/fishPhotoCreditV27/);
  assert.match(js,/Wikimedia Commons/);
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
