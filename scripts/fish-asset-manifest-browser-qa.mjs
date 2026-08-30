import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_FISH_ASSET_MANIFEST&&globalThis.FISH_TARGET_SPECIES_REGISTRY&&globalThis.FISH_TARGET_REAL_FISH&&globalThis.FISH_TARGET_PHOTO_V27),null,{timeout:20000});

  const snapshot=await page.evaluate(()=>{
    const manifest=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST;
    const species=globalThis.FISH_TARGET_SPECIES_REGISTRY;
    const real=globalThis.FISH_TARGET_REAL_FISH;
    const photo=globalThis.FISH_TARGET_PHOTO_V27;
    const bundled=manifest.bundledRecords;
    const remote=manifest.remoteFallbackRecords;
    return {
      version:manifest.version,
      policy:manifest.policy,
      count:manifest.count,
      speciesCount:species.count,
      bundledCount:manifest.bundledCount,
      remoteFallbackCount:manifest.remoteFallbackCount,
      speciesIds:manifest.records.map(row=>row.species_id),
      names:manifest.records.map(row=>row.species_name),
      fieldsComplete:manifest.records.every(row=>['species_id','species_name','asset','source','author','license','attribution','verified_at','mode','rights_status','publication_ready'].every(key=>Object.prototype.hasOwnProperty.call(row,key))),
      recordsFrozen:Object.isFrozen(manifest.records)&&manifest.records.every(row=>Object.isFrozen(row)&&(!row.asset||Object.isFrozen(row.asset))),
      bundledSlots:bundled.map(row=>row.asset?.slot),
      bundledFiles:[...new Set(bundled.map(row=>row.asset?.file))],
      bundledRights:bundled.every(row=>row.source==='project-bundled-existing'&&row.license==='unknown'&&row.rights_status==='unverified'&&row.publication_ready===false),
      remoteRights:remote.every(row=>row.asset===null&&row.source==='wikimedia-runtime-resolver'&&row.license===null&&row.rights_status==='runtime-license-gated'&&row.publication_ready===false),
      publicationReady:manifest.records.filter(row=>row.publication_ready).length,
      hirame:manifest.resolve('平目'),
      aji:manifest.resolve('アジ'),
      saba:manifest.resolve('サバ'),
      realManifest:real.manifestVersion,
      realSpecies:real.species,
      photoManifest:photo.manifestVersion,
      photoLocal:photo.localSpecies
    };
  });

  assert.equal(snapshot.version,'FISH-ASSET-MANIFEST-1');
  assert.equal(snapshot.policy,'bundled-first-license-gated-remote-fallback');
  assert.equal(snapshot.count,60,'manifest covers every current fish species');
  assert.equal(snapshot.count,snapshot.speciesCount,'manifest and species registry stay synchronized');
  assert.equal(snapshot.bundledCount,19,'current bundled AVIF coverage remains explicit');
  assert.equal(snapshot.remoteFallbackCount,41,'remaining species are explicit license-gated remote fallbacks');
  assert.equal(new Set(snapshot.speciesIds).size,60,'manifest species IDs are unique');
  assert.equal(new Set(snapshot.names).size,60,'manifest species names are unique');
  assert.equal(snapshot.fieldsComplete,true,'every manifest record carries rights and attribution fields');
  assert.equal(snapshot.recordsFrozen,true,'manifest read model is immutable');
  assert.deepEqual(snapshot.bundledSlots,[...Array(19).keys()],'bundled sprite slots are unique and deterministic');
  assert.deepEqual(snapshot.bundledFiles,['fish-real-v7.avif'],'bundled records point at the current sheet');
  assert.equal(snapshot.bundledRights,true,'existing bundled asset rights remain explicitly unverified');
  assert.equal(snapshot.remoteRights,true,'remote fallbacks remain runtime license gated');
  assert.equal(snapshot.publicationReady,0,'no asset is silently marked publication-ready without rights evidence');
  assert.equal(snapshot.hirame?.species_name,'ヒラメ','species aliases resolve through canonical registry');
  assert.equal(snapshot.aji?.mode,'bundled','local fish resolves to bundled asset');
  assert.equal(snapshot.aji?.asset?.file,'fish-real-v7.avif');
  assert.equal(snapshot.saba?.mode,'remote-fallback','non-bundled fish resolves to remote fallback');
  assert.equal(snapshot.saba?.asset,null);
  assert.equal(snapshot.realManifest,snapshot.version,'bundled renderer consumes manifest');
  assert.deepEqual(snapshot.realSpecies,snapshot.photoLocal,'bundled renderer and remote photo resolver agree on local priority set');
  assert.equal(snapshot.photoManifest,snapshot.version,'remote photo resolver consumes manifest');
  assert.deepEqual(pageErrors,[],'asset manifest browser path must not throw');
  console.log(`FISH ASSET MANIFEST BROWSER QA PASS ${JSON.stringify({species:snapshot.count,bundled:snapshot.bundledCount,remote:snapshot.remoteFallbackCount})}`);
}finally{
  await browser.close();
}
