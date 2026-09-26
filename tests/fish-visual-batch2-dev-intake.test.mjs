import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const manifestSource=readFileSync(new URL('../fish-asset-manifest.js',import.meta.url),'utf8');
const authoringSource=readFileSync(new URL('../fish-asset-authoring-generated.js',import.meta.url),'utf8');
const buildSource=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const authoring=JSON.parse(readFileSync(new URL('../authoring/fish-assets.v1.json',import.meta.url),'utf8'));

const batch=Object.freeze([
  ['シーバス','fish-master-v34-seabass.avif','1c6d2a60b6756c055e7bc69b1108b411d8586d007c26adf7f916755aaa2144f0'],
  ['アジ','fish-master-v34-aji.avif','8678c123bdb34afbb9e919c17e184f48f26c396ef98809f838131c482e946f79'],
  ['メバル','fish-master-v34-mebaru.avif','e18fa6c60c581590c3270dc4eeef93611ee2b8c069bd063fef02e84ad0c08baa'],
  ['マゴチ','fish-master-v34-magochi.avif','453ff2972794f2c8249137ba62200e6ab8ff95bb9e9f51bd4e35f90a9212f86c'],
  ['タチウオ','fish-master-v34-tachiuo.avif','07763dc855a9e4c1d1d29c0fbadad49870bd40a4503ee6cb577985519d1ff676'],
  ['マダイ','fish-master-v34-madai.avif','517cf42a6ce893b082711e7430213867d17caa25bcf229aa3272c07d43f3711b'],
  ['ブラックバス','fish-master-v34-blackbass.avif','e795c5f8bf0e675629b8d749613830150bfdd4e60257a6b93c844fe756f7161e'],
  ['サワラ','fish-master-v34-sawara.avif','b62c03daf9524e1c5dbb34a4d7429828e9f33e5bd233f75a0b15fb3a1dac45ed']
]);

function runtime(publicationBuild){
  const context={console,document:{documentElement:{dataset:{publicationBuild:publicationBuild?'on':'off'}}}};
  vm.createContext(context);
  vm.runInContext(authoringSource,context);
  const names=context.FISH_TARGET_FISH_ASSET_AUTHORING.assets.map(record=>record.species_name);
  const records=names.map((name,index)=>Object.freeze({species_id:`species-${index}`,name}));
  const byName=new Map(records.map(record=>[record.name,record]));
  context.FISH_TARGET_SPECIES_REGISTRY=Object.freeze({
    records:Object.freeze(records),
    count:records.length,
    resolve:value=>byName.get(String(value??'').trim())||null
  });
  vm.runInContext(manifestSource,context);
  return context.FISH_TARGET_FISH_ASSET_MANIFEST;
}

test('batch 2 development assets are byte-locked AVIF files',()=>{
  for(const [species,file,expected] of batch){
    const url=new URL(`../${file}`,import.meta.url);
    assert.equal(existsSync(url),true,`${species} development AVIF missing`);
    const bytes=readFileSync(url);
    assert.equal(bytes.subarray(4,12).toString('ascii'),'ftypavif',`${species} is not AVIF`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),expected,`${species} development AVIF hash mismatch`);
  }
});

test('quarantined batch 2 uses the existing canonical fallback in development',()=>{
  const manifest=runtime(false);
  assert.equal(manifest.developmentOnlyCount,0);
  assert.equal(manifest.publicationReadyCount,4);
  for(const [species,file] of batch){
    const record=manifest.bySpeciesName(species);
    assert.equal(record.asset.type,'sprite-sheet');
    assert.notEqual(record.asset.file,file);
    assert.equal(record.development_only,false);
    assert.equal(record.publication_ready,false);
  }
});

test('publication runtime remains fail closed for all quarantined species',()=>{
  const manifest=runtime(true);
  assert.equal(manifest.developmentOnlyCount,0);
  assert.equal(manifest.publicationReadyCount,4);
  assert.equal(manifest.bundledCount,4);
  for(const [species] of batch){
    const record=manifest.bySpeciesName(species);
    assert.equal(record.mode,'remote-fallback');
    assert.equal(record.asset,null);
    assert.equal(record.publication_ready,false);
  }
});

test('quarantined AVIFs cannot enter the built app or service-worker shell',()=>{
  const quarantine=JSON.parse(readFileSync(new URL('../authoring/fish-visual-quarantine-v34.json',import.meta.url),'utf8'));
  assert.deepEqual(quarantine.assets.map(row=>row.file).sort(),batch.map(row=>row[1]).sort());
  const worker=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
  for(const [,file] of batch){
    assert.equal(existsSync(new URL(`../dist/${file}`,import.meta.url)),false,`${file} must remain outside distribution`);
    assert.equal(worker.includes(file),false);
    assert.equal(buildSource.includes(`'${file}'`),false);
  }
});
