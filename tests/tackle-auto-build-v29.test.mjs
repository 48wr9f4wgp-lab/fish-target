import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const auto=await readFile(new URL('../tackle-auto-build-v29.js',import.meta.url),'utf8');
const css=await readFile(new URL('../tackle-auto-build-v29.css',import.meta.url),'utf8');
const pwa=await readFile(new URL('../pwa.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');

const count=(source,token)=>source.split(token).length-1;

test('auto build reuses resolver/catalog fit instead of inventing recommendation data',()=>{
  assert.match(auto,/FISH_TARGET_RESOLVER/);
  assert.match(auto,/resolver\.matchCatalog\(plan\.plan_id,'default',\{catalog,includeResearch:true,includeSynthetic:false\}\)/,'catalog context must be the resolver third argument');
  assert.match(auto,/includeResearch:true/);
  assert.match(auto,/includeSynthetic:false/);
  assert.match(auto,/statusRank=Object\.freeze\(\{current:0,unknown:1,discontinued:2,legacy:3\}\)/);
  assert.doesNotMatch(auto,/DAIWA|SHIMANO/,'AUTO BUILD must stay maker-neutral');
});

test('auto build never claims recommended products are owned tackle',()=>{
  assert.doesNotMatch(auto,/fish_target_v17_tackle/);
  assert.doesNotMatch(auto,/localStorage\.(?:setItem|removeItem|clear)/);
  assert.match(auto,/MY TACKLEには自動登録しません/);
});

test('catalog remains user-triggered and publication build fails closed',()=>{
  assert.equal(count(auto,'loader.ensureLoaded()'),1,'Catalog hydration has one explicit AUTO BUILD trigger');
  assert.match(auto,/catalogRuntime!=='off'/);
  assert.match(auto,/公開ビルドでは商品Catalogを配信していない/);
});

test('assembly UI covers rod reel line rig with accessible alternatives',()=>{
  for(const token of ['01 · ROD','02 · REEL','03 · LINE','04 · RIG','SET READY','別候補'])assert.ok(auto.includes(token),`missing ${token}`);
  assert.match(auto,/MAX_ALTERNATES=3/);
  assert.match(css,/autoBuildStageInV29/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});

test('build and PWA shell include AUTO BUILD assets',()=>{
  for(const asset of ['tackle-auto-build-v29.js','tackle-auto-build-v29.css'])assert.ok(build.includes(`'${asset}'`),`build missing ${asset}`);
  assert.match(pwa,/tackle-auto-build-v29-css/);
  assert.match(pwa,/tackle-auto-build-v29-js/);
});