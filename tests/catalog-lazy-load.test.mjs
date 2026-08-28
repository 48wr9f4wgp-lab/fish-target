import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';

const text=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const dist=file=>readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8');
const lazy=['catalog-providers.js','catalog-adapters.js','catalog-daiwa-poc.js','catalog-shimano-poc.js','catalog-fixtures.js','catalog.js'];

test('PWA boots with catalog facade and does not eagerly execute official catalog assets',()=>{
  const pwa=text('pwa.js');
  assert.match(pwa,/loadScript\('\.\/catalog-loader\.js','catalog-loader-js'\)/);
  assert.ok(pwa.indexOf("./catalog-loader.js")<pwa.indexOf("./tackle.js"),'catalog facade must exist before tackle.js');
  for(const file of lazy)assert.doesNotMatch(pwa,new RegExp(`loadScript\\(['\"]\\.\\/${file.replaceAll('.','\\.')}['\"]`),`${file} must not be eager-loaded by pwa.js`);
});

test('lazy catalog assets ship in dist but stay out of the install-time shell manifest',()=>{
  const worker=dist('sw.js');
  for(const file of lazy){
    assert.equal(existsSync(new URL(`../dist/${file}`,import.meta.url)),true,`${file} must ship in dist`);
    assert.ok(!worker.includes(`"./${file}"`),`${file} must not be precached in shell`);
  }
  assert.ok(worker.includes('cache.put(request,fresh.clone())'),'same-origin runtime requests must be cached after first fetch');
});

test('catalog loader waits for MY TACKLE intent and preserves the existing catalog API',()=>{
  const loader=text('catalog-loader.js');
  assert.match(loader,/status:'idle'/);
  assert.match(loader,/tackleSheet/);
  assert.match(loader,/#tackleManage,#tackleEditFromResult,\.v19TackleShortcut/);
  assert.match(loader,/globalThis\.FISH_TARGET_CATALOG=facade/);
  assert.match(loader,/globalThis\.FISH_TARGET_CATALOG_RUNTIME=runtime/);
  assert.match(loader,/async loadPage/);
  assert.match(loader,/ownedSnapshot/);
  assert.match(loader,/productCount=runtime\.products\?\.length\|\|0/);
});
