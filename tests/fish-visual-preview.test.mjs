import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
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

test('preview selection preserves publication originals and excludes unapproved replacements',()=>{
  const development=runtime(false),publication=runtime(true);
  assert.equal(data.development_previews.length,12);
  for(const preview of data.development_previews){
    const name=preview.species_name,original=data.assets.find(row=>row.species_name===name);
    assert.equal(development.resolve(name).asset.file,preview.asset.file);
    assert.equal(development.resolve(name).development_only,true);
    assert.equal(development.resolve(name).publication_ready,false);
    if(original.rights_status==='verified'){
      assert.equal(publication.resolve(name).asset.file,original.asset.file);
      assert.equal(publication.resolve(name).publication_ready,true);
    }else{
      assert.equal(publication.resolve(name).asset,null);
      assert.equal(publication.resolve(name).mode,'remote-fallback');
      assert.equal(publication.resolve(name).publication_ready,false);
    }
    assert.equal(publication.resolve(name).development_only,false);
  }
});

test('batch 2 replacements retain exact generation prompts and independent output provenance',async()=>{
  const evidence=JSON.parse(await readFile(new URL('../authoring/fish-visual-replacement-batch2-v34.json',import.meta.url)));
  assert.equal(evidence.assets.length,8);
  assert.equal(new Set(evidence.assets.map(row=>row.species_name)).size,8);
  for(const row of evidence.assets){
    const preview=data.development_previews.find(record=>record.species_name===row.species_name);
    assert.equal(row.source_kind,'new-project-generated');
    assert.equal(row.output_file,preview.asset.file);
    assert.equal(row.output_sha256,preview.provenance.output_sha256);
    assert.equal(createHash('sha256').update(JSON.stringify(row.prompts)).digest('hex'),row.prompt_sha256);
    assert.equal(row.prompt_sha256,preview.provenance.prompt_sha256);
    assert.match(row.generation_sha256,/^[a-f0-9]{64}$/);
    assert.equal(preview.provenance.source_sha256,undefined,'new art must not pretend to derive from quarantined bytes');
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
