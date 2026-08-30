import assert from 'node:assert/strict';
import test from 'node:test';
import {generateRuntimeSource,publicationReady,toRuntimePayload,validateAuthoring} from '../scripts/fish-asset-authoring.mjs';

const baseRecord=()=>({
  species_name:'テスト魚',
  asset:{type:'file',file:'fish-real-v7.avif'},
  source:'Wikimedia Commons',
  source_url:'https://commons.wikimedia.org/wiki/File:Test.jpg',
  author:'Test Author',
  license:'CC BY-SA 4.0',
  attribution:'Test Author · CC BY-SA 4.0',
  verified_at:'2026-08-30',
  rights_status:'verified'
});
const valid=()=>({version:'FISH-ASSET-AUTHORING-1',policy:'bundled-first-license-gated-remote-fallback',bundled_sheet:'fish-real-v7.avif',assets:[baseRecord()]});

test('complete verified rights derive publication readiness',()=>{
  const data=valid();
  assert.deepEqual(validateAuthoring(data),[]);
  assert.equal(publicationReady(data.assets[0]),true);
  assert.equal(toRuntimePayload(data).assets[0].publication_ready,true);
  assert.equal(generateRuntimeSource(data),generateRuntimeSource(structuredClone(data)));
});

test('publication readiness cannot be asserted with incomplete attribution',()=>{
  const data=valid();
  data.assets[0].author=null;
  data.assets[0].attribution=null;
  assert.equal(publicationReady(data.assets[0]),false);
  assert.ok(validateAuthoring(data).some(error=>error.includes('publication-safe')));
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
  data.assets=[
    {...baseRecord(),species_name:'魚A',rights_status:'unverified',license:'unknown',source_url:null,verified_at:null,asset:{type:'sprite-sheet',file:'fish-real-v7.avif',slot:0,columns:5,rows:4}},
    {...baseRecord(),species_name:'魚B',rights_status:'unverified',license:'unknown',source_url:null,verified_at:null,asset:{type:'sprite-sheet',file:'fish-real-v7.avif',slot:0,columns:5,rows:4}}
  ];
  assert.ok(validateAuthoring(data).some(error=>error.includes('duplicate fish asset slot')));
  data.assets[1].asset={type:'file',file:'../escape.avif'};
  assert.ok(validateAuthoring(data).some(error=>error.includes('safe relative path')));
});
