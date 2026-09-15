import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const root=new URL('../',import.meta.url);
const read=file=>readFileSync(new URL(file,root),'utf8');
const lureManifest=JSON.parse(read('lure-catalog-manifest.json'));

function fishRuntime(publicationBuild){
  const context={console,document:{documentElement:{dataset:{publicationBuild:publicationBuild?'on':'off'}}}};
  vm.createContext(context);
  vm.runInContext(read('fish-asset-authoring-generated.js'),context,{filename:'fish-asset-authoring-generated.js'});
  const names=context.FISH_TARGET_FISH_ASSET_AUTHORING.assets.map(record=>record.species_name);
  const records=names.map((name,index)=>Object.freeze({species_id:`species-${index}`,name}));
  const byName=new Map(records.map(record=>[record.name,record]));
  context.FISH_TARGET_SPECIES_REGISTRY=Object.freeze({
    records:Object.freeze(records),
    count:records.length,
    resolve:value=>byName.get(String(value??'').trim())||null
  });
  vm.runInContext(read('fish-asset-manifest.js'),context,{filename:'fish-asset-manifest.js'});
  return context.FISH_TARGET_FISH_ASSET_MANIFEST;
}

function lureRows(){
  const context=vm.createContext({console,FISH_TARGET_LURE_CATALOG_BATCH_ROWS:[]});
  for(const batch of lureManifest.batches)vm.runInContext(read(batch.file),context,{filename:batch.file});
  return context.FISH_TARGET_LURE_CATALOG_BATCH_ROWS.flatMap(batch=>batch.rows||[]);
}

test('publication build excludes all eight unreviewed Batch 2 fish visuals',()=>{
  const research=fishRuntime(false);
  const publication=fishRuntime(true);
  assert.equal(research.developmentOnlyCount,8);
  assert.equal(research.publicationReadyCount,4);
  assert.equal(publication.developmentOnlyCount,0);
  assert.equal(publication.publicationReadyCount,4);
  assert.equal(publication.bundledCount,4);
  assert.ok(publication.records.every(record=>record.development_only===false));
});

test('all 29 integrated lure rows remain research-only',()=>{
  const rows=lureRows();
  assert.equal(rows.length,29);
  assert.ok(rows.every(row=>row.publication_ready===false));
  assert.doesNotMatch(JSON.stringify(rows),/"price"|"stock"|"color_sku"/i);
});

test('publication/research boundary is explicit in build and manifest code',()=>{
  const build=read('scripts/build.mjs');
  const fishManifest=read('fish-asset-manifest.js');
  assert.match(build,/publicationBuild\?\[\]:devFishAssetFiles/);
  assert.match(fishManifest,/PUBLICATION_BUILD\s*\?\s*authoring\.assets/);
  assert.match(fishManifest,/Publication build must not expose development-only fish assets/);
});
