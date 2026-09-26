import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {generateRuntimeSource,validateAuthoring,verifyAssetFiles} from '../scripts/fish-asset-authoring.mjs';

const data=JSON.parse(await readFile(new URL('../authoring/fish-assets.v1.json',import.meta.url)));
const manifestSource=await readFile(new URL('../fish-asset-manifest.js',import.meta.url),'utf8');
const names=data.assets.map(record=>record.species_name);
function runtime(publication){
  const records=names.map((name,i)=>({name,species_id:`fish-${i}`}));
  const context=vm.createContext({document:{documentElement:{dataset:{publicationBuild:publication?'on':'off'}}},FISH_TARGET_SPECIES_REGISTRY:{records,count:records.length,resolve:name=>records.find(row=>row.name===name)}});
  vm.runInContext(generateRuntimeSource(data),context);vm.runInContext(manifestSource,context);
  return context.FISH_TARGET_FISH_ASSET_MANIFEST;
}

test('preview selection preserves the separately approved publication original',()=>{
  const development=runtime(false),publication=runtime(true);
  assert.equal(data.development_previews.length,4);
  for(const preview of data.development_previews){
    const name=preview.species_name,original=data.assets.find(row=>row.species_name===name);
    assert.equal(development.resolve(name).asset.file,preview.asset.file);
    assert.equal(development.resolve(name).development_only,true);
    assert.equal(development.resolve(name).publication_ready,false);
    assert.equal(publication.resolve(name).asset.file,original.asset.file);
    assert.equal(publication.resolve(name).development_only,false);
    assert.equal(publication.resolve(name).publication_ready,true);
  }
});

test('preview validation rejects promotion, duplicate names and replacement of canonical bytes',()=>{
  assert.deepEqual(validateAuthoring(data),[]);
  const mutations=[
    d=>{d.development_previews[0].rights_status='verified'},
    d=>{d.development_previews[0].review_status='approved'},
    d=>{d.development_previews[0].species_name='unknown'},
    d=>{d.development_previews.push(d.development_previews[0])},
    d=>{d.development_previews[0].asset.file=d.assets[0].asset.file},
    d=>{d.development_previews[0].asset.display_scale=1.5},
    d=>{delete d.development_previews[0].provenance},
  ];
  for(const mutate of mutations){const copy=structuredClone(data);mutate(copy);assert.ok(validateAuthoring(copy).length>0)}
});

test('preview files have verified bytes and are included in the development offline shell',async()=>{
  await verifyAssetFiles(data);
  const worker=await readFile(new URL('../dist/sw.js',import.meta.url),'utf8');
  for(const preview of data.development_previews){
    assert.ok((await readFile(new URL('../dist/'+preview.asset.file,import.meta.url))).length>0);
    assert.ok(worker.includes(preview.asset.file));
  }
  const copy=structuredClone(data);copy.development_previews[0].provenance.output_sha256='0'.repeat(64);
  await assert.rejects(()=>verifyAssetFiles(copy),/output hash mismatch/);
});
