import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {versionContract} from '../scripts/version-contract.mjs';

const readRoot=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const readDist=file=>readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8');
const config=JSON.parse(readRoot('build.config.json'));
const html=readDist('index.html');
const worker=readDist('sw.js');

test('generated HTML, result header, assets, and SW share one build version',()=>{
  assert.deepEqual(versionContract({config,html,worker}),[]);
  assert.doesNotMatch(html,/FISH TARGET V(?:15|19)\b/i);
  assert.doesNotMatch(html,/TARGET GAME PLAN · V(?:15|19)\b/i);
  assert.doesNotMatch(html,/__(?:BUILD_VERSION|BUILD_ID|FIELD_LIVE_STATE|SHELL_MANIFEST)__/);
  assert.doesNotMatch(worker,/__(?:BUILD_VERSION|BUILD_ID|FIELD_LIVE_STATE|SHELL_MANIFEST)__/);
});

test('stale V19 asset mixing is rejected by the version contract',()=>{
  const buildId=config.version.toLowerCase();
  const stale=html.replace(`?v=${buildId}`, '?v=v19');
  assert.ok(versionContract({config,html:stale,worker}).some(error=>error.startsWith('asset version mismatch')));
});

function serviceWorkerHarness(){
  const handlers={};
  const stores=new Map();
  const normalize=value=>{
    const raw=typeof value==='string'?value:value.url;
    return new URL(raw,'https://example.test/').pathname;
  };
  const cacheFor=name=>{
    if(!stores.has(name))stores.set(name,new Map());
    const values=stores.get(name);
    return {
      async addAll(items){for(const item of items)values.set(normalize(item),new Response(`cached:${item}`))},
      async put(request,response){values.set(normalize(request),response)},
      async match(request){return values.get(normalize(request))}
    };
  };
  const caches={
    open:async name=>cacheFor(name),
    keys:async()=>[...stores.keys()],
    delete:async name=>stores.delete(name)
  };
  const self={
    addEventListener:(name,handler)=>{handlers[name]=handler},
    skipWaiting:async()=>{},
    clients:{claim:async()=>{}},
    location:{origin:'https://example.test'}
  };
  const context=vm.createContext({self,caches,fetch:async()=>{throw new Error('origin unavailable')},Request,Response,URL,console});
  vm.runInContext(worker,context,{filename:'dist/sw.js'});
  return {handlers,stores};
}

test('current shell installs atomically and removes a stale V19 cache',async()=>{
  const {handlers,stores}=serviceWorkerHarness();
  stores.set('fish-target-shell-v19',new Map([['/',new Response('old V19')]]));
  let installPromise;
  handlers.install({waitUntil:promise=>{installPromise=promise}});
  await installPromise;
  let activatePromise;
  handlers.activate({waitUntil:promise=>{activatePromise=promise}});
  await activatePromise;
  assert.deepEqual([...stores.keys()],[`fish-target-shell-${config.version.toLowerCase()}`]);
});

test('origin unavailable returns the cached current launch, never stale V19',async()=>{
  const {handlers,stores}=serviceWorkerHarness();
  stores.set('fish-target-shell-v19',new Map([['/',new Response('old V19')]]));
  let installPromise;
  handlers.install({waitUntil:promise=>{installPromise=promise}});
  await installPromise;
  let responsePromise;
  handlers.fetch({request:new Request('https://example.test/'),respondWith:promise=>{responsePromise=promise}});
  const response=await responsePromise;
  assert.equal(await response.text(),'cached:./');
});
