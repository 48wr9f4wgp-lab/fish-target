import {access,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';
import {publicationReady as fishAssetPublicationReady} from './fish-asset-authoring.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dist=path.join(root,'dist');
const buildConfig=JSON.parse(await readFile(path.join(root,'build.config.json'),'utf8'));
const buildId=buildConfig.version.toLowerCase();
const researchCache=`fish-target-shell-${buildId}`;
const publicationCache=`${researchCache}-publication`;
const manifest=JSON.parse(await readFile(path.join(root,'catalog-batch-manifest.json'),'utf8'));
const productionBatches=manifest.batches.filter(batch=>batch.stage==='production');
const researchFiles=[...new Set(manifest.batches.filter(batch=>batch.stage==='research').flatMap(batch=>batch.files||[]))];
const fishAuthoring=JSON.parse(await readFile(path.join(root,'authoring/fish-assets.v1.json'),'utf8'));
const fishFiles=[...new Set(fishAuthoring.assets.map(record=>String(record?.asset?.file||'').trim()).filter(Boolean))];
const publicationFishFiles=fishFiles.filter(file=>{
  const records=fishAuthoring.assets.filter(record=>String(record?.asset?.file||'').trim()===file);
  return records.length>0&&records.every(fishAssetPublicationReady);
});
const blockedFishFiles=fishFiles.filter(file=>!publicationFishFiles.includes(file));
const exists=async file=>access(path.join(dist,file)).then(()=>true,()=>false);
const runBuild=publication=>{
  const result=spawnSync(process.execPath,['scripts/build.mjs'],{
    cwd:root,
    env:{...process.env,FISH_TARGET_PUBLICATION_BUILD:publication?'1':'0'},
    stdio:'inherit'
  });
  if(result.status!==0)throw new Error(`${publication?'publication':'research'} build failed with ${result.status}`);
};

function serviceWorkerHarness(worker){
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
  vm.runInContext(worker,context,{filename:'publication-dist/sw.js'});
  return {handlers,stores};
}

let primaryError=null;
try{
  runBuild(true);
  const html=await readFile(path.join(dist,'index.html'),'utf8');
  const worker=await readFile(path.join(dist,'sw.js'),'utf8');
  const runtimeExpected=productionBatches.length>0;
  if(!html.includes('data-publication-build="on"'))throw new Error('global publication build marker missing');
  if(!html.includes('data-catalog-publication="on"'))throw new Error('publication catalog marker missing');
  if(!html.includes(`data-catalog-runtime="${runtimeExpected?'on':'off'}"`))throw new Error('publication catalog runtime marker mismatch');
  if(!worker.includes(`const CACHE='${publicationCache}';`))throw new Error('publication service worker cache is not publication-specific');
  if(/__(?:BUILD_VERSION|BUILD_ID|CACHE_BUILD_ID|FIELD_LIVE_STATE|SHELL_MANIFEST)__/.test(worker))throw new Error('publication service worker contains unresolved build token');
  if(!(await exists('catalog-loader.js')))throw new Error('publication build must retain fail-closed catalog loader');
  if(!(await exists('tackle.js')))throw new Error('publication build must retain MY TACKLE manual fallback');
  if(!(await exists('fish-asset-authoring-generated.js'))||!(await exists('fish-asset-manifest.js')))throw new Error('publication build must retain fish fallback metadata/runtime');
  if(await exists('catalog-fixtures.js'))throw new Error('synthetic catalog fixtures leaked into publication build');
  for(const file of researchFiles){if(await exists(file))throw new Error(`research catalog batch leaked into publication build: ${file}`)}
  for(const file of blockedFishFiles){if(await exists(file))throw new Error(`unverified fish binary leaked into publication build: ${file}`)}
  for(const file of publicationFishFiles){if(!(await exists(file)))throw new Error(`publication-ready fish binary missing from publication build: ${file}`)}
  if(runtimeExpected){
    if(!(await exists('catalog-batch-manifest.json')))throw new Error('publication manifest missing with production batches');
    const published=JSON.parse(await readFile(path.join(dist,'catalog-batch-manifest.json'),'utf8'));
    if(published.batches.length!==productionBatches.length||published.batches.some(batch=>batch.stage!=='production'))throw new Error('publication manifest is not production-only');
  }else{
    for(const file of ['catalog-batch-manifest.json','catalog-providers.js','catalog-adapters.js','catalog-research.js','catalog.js']){
      if(await exists(file))throw new Error(`catalog runtime leaked with zero production batches: ${file}`);
    }
  }

  const {handlers,stores}=serviceWorkerHarness(worker);
  stores.set(researchCache,new Map([
    ['/catalog.js',new Response('stale research catalog')],
    ['/fish-real-v7.avif',new Response('stale unverified fish binary')]
  ]));
  let installPromise;
  handlers.install({waitUntil:promise=>{installPromise=promise}});
  await installPromise;
  let activatePromise;
  handlers.activate({waitUntil:promise=>{activatePromise=promise}});
  await activatePromise;
  const remainingCaches=[...stores.keys()];
  if(remainingCaches.length!==1||remainingCaches[0]!==publicationCache)throw new Error(`publication activation did not purge stale research cache: ${remainingCaches.join(',')}`);

  console.log(`PUBLICATION BUILD QA PASS · production batches ${productionBatches.length} · research files excluded ${researchFiles.length} · fish files publication ${publicationFishFiles.length}/${fishFiles.length} · cache ${publicationCache} isolated`);
}catch(error){primaryError=error}finally{
  try{
    runBuild(false);
    const html=await readFile(path.join(dist,'index.html'),'utf8');
    const worker=await readFile(path.join(dist,'sw.js'),'utf8');
    if(!html.includes('data-publication-build="off"'))throw new Error('research build restore global publication marker mismatch');
    if(!html.includes('data-catalog-publication="off"'))throw new Error('research build restore publication marker mismatch');
    if(!html.includes('data-catalog-runtime="on"'))throw new Error('research build restore did not re-enable catalog runtime');
    if(!worker.includes(`const CACHE='${researchCache}';`))throw new Error('research build restore service worker cache mismatch');
    if(worker.includes(`const CACHE='${publicationCache}';`))throw new Error('research build restore retained publication cache id');
    if(!(await exists('catalog-batch-manifest.json')))throw new Error('research build restore missing catalog manifest');
    for(const file of fishFiles){if(!(await exists(file)))throw new Error(`research build restore missing fish asset: ${file}`)}
  }catch(error){if(!primaryError)primaryError=error;else console.error(error)}
}
if(primaryError)throw primaryError;