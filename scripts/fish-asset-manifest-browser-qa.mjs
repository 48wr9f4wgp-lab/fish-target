import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
import {generateRuntimeSource} from './fish-asset-authoring.mjs';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_FISH_ASSET_AUTHORING&&globalThis.FISH_TARGET_FISH_ASSET_MANIFEST&&globalThis.FISH_TARGET_SPECIES_REGISTRY&&globalThis.FISH_TARGET_REAL_FISH&&globalThis.FISH_TARGET_PHOTO_V27),null,{timeout:20000});

  const snapshot=await page.evaluate(()=>{
    const authoring=globalThis.FISH_TARGET_FISH_ASSET_AUTHORING;
    const manifest=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST;
    const species=globalThis.FISH_TARGET_SPECIES_REGISTRY;
    const real=globalThis.FISH_TARGET_REAL_FISH;
    const photo=globalThis.FISH_TARGET_PHOTO_V27;
    const bundled=manifest.bundledRecords;
    const remote=manifest.remoteFallbackRecords;
    return {
      version:manifest.version,
      authoringVersion:manifest.authoringVersion,
      authoringAssets:authoring.assets.length,
      policy:manifest.policy,
      count:manifest.count,
      speciesCount:species.count,
      bundledCount:manifest.bundledCount,
      remoteFallbackCount:manifest.remoteFallbackCount,
      publicationReadyCount:manifest.publicationReadyCount,
      speciesIds:manifest.records.map(row=>row.species_id),
      names:manifest.records.map(row=>row.species_name),
      fieldsComplete:manifest.records.every(row=>['species_id','species_name','asset','source','source_url','author','license','attribution','verified_at','provenance','mode','rights_status','publication_ready'].every(key=>Object.prototype.hasOwnProperty.call(row,key))),
      recordsFrozen:Object.isFrozen(manifest.records)&&manifest.records.every(row=>Object.isFrozen(row)&&(!row.asset||Object.isFrozen(row.asset))&&(!row.provenance||Object.isFrozen(row.provenance))),
      bundledSlots:bundled.map(row=>row.asset?.slot),
      bundledFiles:[...new Set(bundled.map(row=>row.asset?.file))],
      bundledRights:bundled.every(row=>row.source==='project-bundled-existing'&&row.license==='unknown'&&row.rights_status==='unverified'&&row.publication_ready===false&&row.provenance===null),
      remoteRights:remote.every(row=>row.asset===null&&row.source==='wikimedia-runtime-resolver'&&row.license===null&&row.rights_status==='runtime-license-gated'&&row.publication_ready===false&&row.provenance===null),
      publicationReady:manifest.records.filter(row=>row.publication_ready).length,
      hirame:manifest.resolve('平目'),
      aji:manifest.resolve('アジ'),
      saba:manifest.resolve('サバ'),
      realVersion:real.version,
      realRenderer:real.renderer,
      realManifest:real.manifestVersion,
      realSpecies:real.species,
      photoManifest:photo.manifestVersion,
      photoLocal:photo.localSpecies
    };
  });

  assert.equal(snapshot.version,'FISH-ASSET-MANIFEST-2');
  assert.equal(snapshot.authoringVersion,'FISH-ASSET-AUTHORING-1');
  assert.equal(snapshot.authoringAssets,19,'runtime manifest is generated from current 19 authored bundled assets');
  assert.equal(snapshot.policy,'bundled-first-license-gated-remote-fallback');
  assert.equal(snapshot.count,60,'manifest covers every current fish species');
  assert.equal(snapshot.count,snapshot.speciesCount,'manifest and species registry stay synchronized');
  assert.equal(snapshot.bundledCount,19,'current bundled AVIF coverage remains explicit');
  assert.equal(snapshot.remoteFallbackCount,41,'remaining species are explicit license-gated remote fallbacks');
  assert.equal(new Set(snapshot.speciesIds).size,60,'manifest species IDs are unique');
  assert.equal(new Set(snapshot.names).size,60,'manifest species names are unique');
  assert.equal(snapshot.fieldsComplete,true,'every manifest record carries rights, attribution, and provenance fields');
  assert.equal(snapshot.recordsFrozen,true,'manifest read model is immutable');
  assert.deepEqual(snapshot.bundledSlots,[...Array(19).keys()],'bundled sprite slots are unique and deterministic');
  assert.deepEqual(snapshot.bundledFiles,['fish-real-v7.avif'],'bundled records point at the current sheet');
  assert.equal(snapshot.bundledRights,true,'existing bundled asset rights remain explicitly unverified');
  assert.equal(snapshot.remoteRights,true,'remote fallbacks remain runtime license gated');
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
  assert.equal(preflight.provenanceHash,'b'.repeat(64),'direct file fixture preserves derivative provenance');
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
    const canvas=host?.querySelector(':scope > .realFishCanvas');
    return {
      record:manifest.resolve('サバ'),
      bundledCount:manifest.bundledCount,
      remoteCount:manifest.remoteFallbackCount,
      publicationReadyCount:manifest.publicationReadyCount,
      renderer:real.renderer,
      assetTypes:real.assetTypes,
      localSpecies:photo.localSpecies,
      fishAsset:host?.dataset.fishAsset||null,
      canvasWidth:canvas?.width||0,
      canvasHeight:canvas?.height||0
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
  assert.equal(fixtureSnapshot.renderer,'manifest-bundled-sprite-or-file-with-svg-fallback');
  assert.deepEqual(fixtureSnapshot.assetTypes.sort(),['file','sprite-sheet']);
  assert.ok(fixtureSnapshot.localSpecies.includes('サバ'),'remote photo resolver treats direct file assets as local');
  assert.equal(fixtureSnapshot.fishAsset,'direct-bundled-file','direct file fixture owns the result fish host');
  assert.ok(fixtureSnapshot.canvasWidth>0&&fixtureSnapshot.canvasHeight>0,'direct file fixture renders into a real canvas');
  assert.deepEqual(fixtureErrors,[],'direct file fish browser path must not throw');

  console.log(`FISH ASSET MANIFEST BROWSER QA PASS ${JSON.stringify({species:snapshot.count,bundled:snapshot.bundledCount,remote:snapshot.remoteFallbackCount,fileFixture:fixtureSnapshot.fishAsset,provenance:true})}`);
}finally{
  await browser.close();
}
