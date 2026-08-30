import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {generateRuntimeSource,publicationReady,toRuntimePayload,validateAuthoring,verifyAssetFiles} from '../scripts/fish-asset-authoring.mjs';

const provenance=()=>({
  source_file_url:'https://upload.wikimedia.org/example/source.jpg',
  source_sha256:'a'.repeat(64),
  output_sha256:'b'.repeat(64),
  transformations:['resize-long-edge:1200','encode:avif'],
  transformation_notice:'Source image resized and encoded as AVIF; no semantic content edits.'
});
const baseRecord=()=>({
  species_name:'テスト魚',
  asset:{type:'file',file:'fish-real-v7.avif'},
  source:'Wikimedia Commons',
  source_url:'https://commons.wikimedia.org/wiki/File:Test.jpg',
  author:'Test Author',
  license:'CC BY-SA 4.0',
  attribution:'Test Author · CC BY-SA 4.0',
  verified_at:'2026-08-30',
  rights_status:'verified',
  provenance:provenance()
});
const valid=()=>({version:'FISH-ASSET-AUTHORING-1',policy:'bundled-first-license-gated-remote-fallback',bundled_sheet:'fish-real-v7.avif',assets:[baseRecord()]});

test('complete verified rights and derivative provenance derive publication readiness',()=>{
  const data=valid();
  assert.deepEqual(validateAuthoring(data),[]);
  assert.equal(publicationReady(data.assets[0]),true);
  assert.equal(toRuntimePayload(data).assets[0].publication_ready,true);
  assert.equal(toRuntimePayload(data).assets[0].provenance.output_sha256,'b'.repeat(64));
  assert.equal(generateRuntimeSource(data),generateRuntimeSource(structuredClone(data)));
});

test('publication readiness cannot be asserted with incomplete attribution',()=>{
  const data=valid();
  data.assets[0].author=null;
  data.assets[0].attribution=null;
  assert.equal(publicationReady(data.assets[0]),false);
  assert.ok(validateAuthoring(data).some(error=>error.includes('publication-safe')));
});

test('verified direct files require source and output hashes plus transformation provenance',()=>{
  const data=valid();
  delete data.assets[0].provenance;
  assert.equal(publicationReady(data.assets[0]),false);
  assert.ok(validateAuthoring(data).some(error=>error.includes('provenance is required')));

  data.assets[0].provenance=provenance();
  data.assets[0].provenance.output_sha256='BAD';
  assert.equal(publicationReady(data.assets[0]),false);
  assert.ok(validateAuthoring(data).some(error=>error.includes('output_sha256')));
});

test('unknown or restricted rights stay publication blocked',()=>{
  for(const status of ['unverified','restricted']){
    const record=baseRecord();
    record.rights_status=status;
    assert.equal(publicationReady(record),false);
  }
});

test('duplicate sprite slots and unsafe paths are rejected',()=>{
  const data=valid();
  const unverified={...baseRecord(),rights_status:'unverified',license:'unknown',source_url:null,verified_at:null,provenance:null};
  data.assets=[
    {...unverified,species_name:'魚A',asset:{type:'sprite-sheet',file:'fish-real-v7.avif',slot:0,columns:5,rows:4}},
    {...unverified,species_name:'魚B',asset:{type:'sprite-sheet',file:'fish-real-v7.avif',slot:0,columns:5,rows:4}}
  ];
  assert.ok(validateAuthoring(data).some(error=>error.includes('duplicate fish asset slot')));
  data.assets[1].asset={type:'file',file:'../escape.avif'};
  assert.ok(validateAuthoring(data).some(error=>error.includes('safe relative path')));
});

test('verified direct file bytes must match the authoring output SHA-256',async()=>{
  const data=valid();
  data.assets[0].asset={type:'file',file:'icon.svg'};
  const bytes=readFileSync(new URL('../icon.svg',import.meta.url));
  data.assets[0].provenance.output_sha256=createHash('sha256').update(bytes).digest('hex');
  await verifyAssetFiles(data);
  data.assets[0].provenance.output_sha256='c'.repeat(64);
  await assert.rejects(()=>verifyAssetFiles(data),/output hash mismatch/);
});
