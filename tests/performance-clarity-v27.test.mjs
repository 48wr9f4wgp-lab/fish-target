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

test('target expansion parallelizes each five-part stage while preserving generation order',()=>{
  const source=read('pwa.js');
  assert.ok((source.match(/await Promise\.all\(Array\.from\(\{length:5\}/g)||[]).length>=4,'four five-part stages use Promise.all');
  for(const version of ['v1','v2','v3','v4'])assert.ok(source.includes(`./target-method-data-${version}-part\${i}.js`),`${version} part token remains explicit`);
  const v1=source.indexOf('./target-method-data-v1.js');
  const v2Parts=source.indexOf('./target-method-data-v2-part${i}.js');
  const v2=source.indexOf('./target-method-data-v2.js');
  const v3Parts=source.indexOf('./target-method-data-v3-part${i}.js');
  const v3=source.indexOf('./target-method-data-v3.js');
  const v4Parts=source.indexOf('./target-method-data-v4-part${i}.js');
  const v4=source.indexOf('./target-method-data-v4.js');
  assert.ok(v1>=0&&v1<v2Parts&&v2Parts<v2&&v2<v3Parts&&v3Parts<v3&&v3<v4Parts&&v4Parts<v4,'generation order remains explicit and staged');
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
