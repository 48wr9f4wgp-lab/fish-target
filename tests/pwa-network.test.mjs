import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');
function boot({online=true,live='off',missing=false}={}){
  const events=new Map(),toasts=[],elements={networkStatus:{hidden:true,textContent:''},weatherEmpty:{textContent:'unchanged'}};
  const document={documentElement:{dataset:{build:'test',fieldLive:live,lureCatalogRuntime:'off',publicationBuild:'on'}},
    getElementById:id=>missing?null:elements[id]||null,querySelector:()=>null,
    createElement:()=>({dataset:{}}),head:{appendChild(){}},body:{appendChild(){}}};
  const navigator={onLine:online};
  const context=vm.createContext({document,navigator,window:{addEventListener:(name,fn)=>events.set(name,fn)},console,toast:text=>toasts.push(text)});
  // Asset loads remain unresolved; no catalog, service worker or remote request is executed.
  vm.runInContext(source,context);
  return {elements,events,toasts,navigator};
}
test('offline startup keeps core availability wording with live service disabled',()=>{
  const {elements}=boot({online:false});
  assert.equal(elements.networkStatus.hidden,false);
  assert.equal(elements.networkStatus.textContent,'OFFLINE · 基本診断は利用可');
  assert.equal(elements.weatherEmpty.textContent,'オフライン中。魚の基本診断・保存済みプラン・FIELD MODEは利用できます。');
});
test('offline startup adds the live reconnect explanation only when enabled',()=>{
  const {elements}=boot({online:false,live:'on'});
  assert.equal(elements.weatherEmpty.textContent,'オフライン中。魚の基本診断・保存済みプラン・FIELD MODEは利用できます。FIELD LIVEは接続復帰後に取得できます。');
});
test('online and offline events refresh the badge and preserve notifications',()=>{
  const state=boot();
  assert.equal(state.elements.networkStatus.hidden,true);
  assert.equal(state.elements.weatherEmpty.textContent,'unchanged');
  assert.equal(state.toasts.length,0);
  state.navigator.onLine=false;state.events.get('offline')();
  assert.equal(state.elements.networkStatus.hidden,false);
  state.navigator.onLine=true;state.events.get('online')();
  assert.equal(state.elements.networkStatus.hidden,true);
  assert.deepEqual(state.toasts,['オフラインモードへ切替','オンラインに復帰した']);
});
test('network rendering tolerates an absent status surface',()=>{
  const state=boot({missing:true,online:false});
  assert.doesNotThrow(()=>state.events.get('offline')());
});
test('startup budget remains below the existing 8000-byte limit',()=>{
  assert.ok(Buffer.byteLength(source)<8000,`pwa.js is ${Buffer.byteLength(source)} bytes`);
});
