import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {generateRuntimeSource} from './fish-asset-authoring.mjs';

const BASE=process.env.BASE_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const pageErrors=[];
const page=await browser.newPage({viewport:{width:390,height:844}});
page.on('pageerror',error=>pageErrors.push(String(error)));

try{
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_FISH_ASSET_MANIFEST&&globalThis.FISH_TARGET_REAL_FISH&&globalThis.FISH_TARGET_PHOTO_V27&&globalThis.FISH_TARGET_SPECIES_REGISTRY),null,{timeout:20000});
  const snapshot=await page.evaluate(()=>{
    const manifest=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST;
    const real=globalThis.FISH_TARGET_REAL_FISH;
    const photo=globalThis.FISH_TARGET_PHOTO_V27;
    return {
      version:manifest.version,
      count:manifest.count,
      bundledCount:manifest.bundledCount,
      remoteFallbackCount:manifest.remoteFallbackCount,
      publicationReady:manifest.records.filter(x=>x.publication_ready).length,
      publicationReadyCount:manifest.publicationReadyCount,
      hirame:manifest.resolve('平目'),
      aji:manifest.resolve('アジ'),
      saba:manifest.resolve('サバ'),
      realVersion:real.version,
      realRenderer:real.renderer,
      realManifest:real.manifestVersion,
      realSpecies:real.species.slice().sort(),
      photoManifest:photo.manifestVersion,
      photoLocal:photo.localSpecies.slice().sort()
    };
  });
  assert.equal(snapshot.version,'FISH-ASSET-MANIFEST-2');
  assert.equal(snapshot.count,60);
  assert.equal(snapshot.bundledCount,19);
  assert.equal(snapshot.remoteFallbackCount,41);
  assert.equal(snapshot.publicationReady,0,'no asset is silently marked publication-ready without rights evidence');
  assert.equal(snapshot.publicationReadyCount,0,'manifest publication-ready index stays fail closed');
  assert.equal(snapshot.hirame?.species_name,'ヒラメ','species aliases resolve through canonical registry');
  assert.equal(snapshot.aji?.mode,'bundled','local fish resolves to bundled asset');
  assert.equal(snapshot.aji?.asset?.file,'fish-real-v7.avif');
  assert.equal(snapshot.saba?.mode,'remote-fallback','non-bundled fish resolves to remote fallback');
  assert.equal(snapshot.saba?.asset,null);
  assert.equal(snapshot.realVersion,'V23-REAL9');
  assert.equal(snapshot.realRenderer,'manifest-bundled-sprite-or-file-with-svg-fallback');
  assert.equal(snapshot.realManifest,snapshot.version,'bundled renderer consumes manifest');
  assert.deepEqual(snapshot.realSpecies,snapshot.photoLocal,'bundled renderer and remote photo resolver agree on local priority set');
  assert.equal(snapshot.photoManifest,snapshot.version,'remote photo resolver consumes manifest');
  assert.deepEqual(pageErrors,[],'asset manifest browser path must not throw');

  const fixturePage=await browser.newPage({viewport:{width:390,height:844}});
  const fixtureErrors=[];
  fixturePage.on('pageerror',error=>fixtureErrors.push(String(error)));
  const source=JSON.parse(await readFile(new URL('../authoring/fish-assets.v1.json',import.meta.url),'utf8'));
  const fixtureAuthoring={
    ...source,
    assets:[...source.assets,{
      species_name:'サバ',
      asset:{type:'file',file:'icon.svg'},
      source:'browser-fixture',
      source_url:'https://example.com/fish-target-qa',
      author:null,
      license:'CC0',
      attribution:null,
      verified_at:'2026-08-30',
      rights_status:'verified',
      provenance:{
        source_file_url:'https://example.com/fish-target-qa/source.svg',
        source_sha256:'a'.repeat(64),
        output_sha256:'b'.repeat(64),
        transformations:['fixture-copy'],
        transformation_notice:'Browser QA fixture provenance.'
      }
    }]
  };
  const fixtureRuntime=generateRuntimeSource(fixtureAuthoring);
  await fixturePage.route('**/fish-asset-authoring-generated.js*',route=>route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:fixtureRuntime}));
  await fixturePage.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await fixturePage.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_FISH_ASSET_MANIFEST&&globalThis.FISH_TARGET_REAL_FISH&&globalThis.FISH_TARGET_PHOTO_V27&&globalThis.FISH_TARGET_SPECIES_REGISTRY),null,{timeout:20000});

  const preflight=await fixturePage.evaluate(async()=>{
    const manifest=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST;
    const real=globalThis.FISH_TARGET_REAL_FISH;
    const record=manifest.resolve('サバ');
    return {
      mode:record?.mode||null,
      type:record?.asset?.type||null,
      file:record?.asset?.file||null,
      publicationReady:record?.publication_ready===true,
      provenanceHash:record?.provenance?.output_sha256||null,
      prefetched:await real.prefetch('サバ')
    };
  });
  assert.equal(preflight.mode,'bundled','file fixture becomes a bundled manifest record before rendering');
  assert.equal(preflight.type,'file');
  assert.equal(preflight.file,'icon.svg');
  assert.equal(preflight.publicationReady,true,'complete CC0 fixture derives publication readiness');
  assert.equal(preflight.provenanceHash,'b'.repeat(64),'manifest preserves direct-file derivative provenance');
  assert.equal(preflight.prefetched,true,'direct file fixture loads through the production image loader');

  const opened=await fixturePage.evaluate(()=>{
    const species=globalThis.FISH_TARGET_SPECIES_REGISTRY.resolve('サバ');
    const runtimeFish=globalThis.FISH_TARGET_SPECIES_REGISTRY.runtimeFish(species);
    if(!runtimeFish||typeof openFish!=='function')return false;
    openFish(runtimeFish);
    if(typeof renderResult==='function')renderResult();
    return true;
  });
  assert.equal(opened,true,'file fixture species opens through the production result path');
  await fixturePage.waitForFunction(()=>document.getElementById('tart')?.dataset.fishAsset==='direct-bundled-file',null,{timeout:10000});

  const fixtureSnapshot=await fixturePage.evaluate(()=>{
    const manifest=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST;
    const real=globalThis.FISH_TARGET_REAL_FISH;
    const photo=globalThis.FISH_TARGET_PHOTO_V27;
    const host=document.getElementById('tart');
    const image=host?.querySelector('img');
    const record=manifest.resolve('サバ');
    return {
      record,
      bundledCount:manifest.bundledCount,
      remoteCount:manifest.remoteFallbackCount,
      publicationReadyCount:manifest.publicationReadyCount,
      realHas:real.has('サバ'),
      realSpecies:real.species.includes('サバ'),
      photoLocal:photo.localSpecies.includes('サバ'),
      photoHas:photo.hasBundled('サバ'),
      dataset:host?.dataset?.fishAsset||null,
      imageSrc:image?.getAttribute('src')||null,
      credit:host?.querySelector('.fishPhotoCredit')?.textContent||null
    };
  });

  assert.equal(fixtureSnapshot.record?.mode,'bundled');
  assert.equal(fixtureSnapshot.record?.asset?.type,'file');
  assert.equal(fixtureSnapshot.record?.asset?.file,'icon.svg');
  assert.equal(fixtureSnapshot.record?.publication_ready,true);
  assert.equal(fixtureSnapshot.record?.provenance?.output_sha256,'b'.repeat(64));
  assert.equal(fixtureSnapshot.bundledCount,20);
  assert.equal(fixtureSnapshot.remoteCount,40);
  assert.equal(fixtureSnapshot.publicationReadyCount,1);
  assert.equal(fixtureSnapshot.realHas,true);
  assert.equal(fixtureSnapshot.realSpecies,true);
  assert.equal(fixtureSnapshot.photoLocal,true);
  assert.equal(fixtureSnapshot.photoHas,true);
  assert.equal(fixtureSnapshot.dataset,'direct-bundled-file');
  assert.match(fixtureSnapshot.imageSrc||'',/icon\.svg/);
  assert.equal(fixtureSnapshot.credit,null,'bundled file does not inject remote Wikimedia credit UI');
  assert.deepEqual(fixtureErrors,[],'direct bundled file fixture must not throw');
  await fixturePage.close();

  console.log('FISH ASSET MANIFEST BROWSER QA PASS',JSON.stringify({manifest:snapshot.version,count:snapshot.count,bundled:snapshot.bundledCount,remote:snapshot.remoteFallbackCount,fixture:'direct-file-provenance'}));
}finally{
  await page.close();
  await browser.close();
}
