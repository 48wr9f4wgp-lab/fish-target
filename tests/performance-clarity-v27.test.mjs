import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('catalog hydration loads independent batches in parallel',()=>{
  const source=read('catalog-loader.js');
  assert.match(source,/loadStrategy:'parallel-batches'/);
  assert.match(source,/await Promise\.all\(batchAssets\.map\(loadScript\)\)/);
  assert.doesNotMatch(source,/for\(const asset of lazyAssets\)await loadScript\(asset\)/);
});

test('target expansion bootstrap fetches the four data generations concurrently',()=>{
  const source=read('pwa.js');
  assert.match(source,/const loadTargetExpansion=async version=>/);
  assert.match(source,/Promise\.all\(Array\.from\(\{length:5\}/);
  assert.match(source,/Promise\.all\(\['v1','v2','v3','v4'\]\.map\(loadTargetExpansion\)\)/);
});

test('clarity pass coalesces mutation work and debounces catalog search',()=>{
  const source=read('app-shell-v26.js');
  assert.match(source,/let syncQueued=false/);
  assert.match(source,/new MutationObserver\(scheduleSync\)/);
  assert.match(source,/setTimeout\(\(\)=>\{const next=new Event\('input'/);
  assert.match(source,/160\)\)/);
  assert.match(source,/① 投げる/);
  assert.match(source,/② 道具/);
  assert.match(source,/③ 現場/);
  assert.match(source,/answer\.textContent='まず投げる'/);
});

test('visual clarity hides explanatory copy that is not needed for the core loop',()=>{
  const css=read('visual-v26.css');
  assert.match(css,/V27 clarity pass/);
  assert.match(css,/\.fitNote\{display:none!important\}/);
  assert.match(css,/\.tackleSheetIntroV26\{display:none!important\}/);
  assert.match(css,/-webkit-line-clamp:1!important/);
});
