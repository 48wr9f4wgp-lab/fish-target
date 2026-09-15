import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('lure-catalog-manifest.json'));

function rows(file){
  const context=vm.createContext({console,FISH_TARGET_LURE_CATALOG_BATCH_ROWS:[]});
  vm.runInContext(read(file),context,{filename:file});
  return context.FISH_TARGET_LURE_CATALOG_BATCH_ROWS[0]?.rows||[];
}

test('Seabass FIRST CAST research stays canonical and maker-neutral',()=>{
  const batches=manifest.batches.filter(batch=>batch.targets?.includes('シーバス'));
  assert.deepEqual(new Set(batches.map(batch=>batch.maker)),new Set(['DAIWA','SHIMANO']));
  assert.ok(batches.every(batch=>batch.stage==='research'));
  const all=batches.flatMap(batch=>rows(batch.file));
  assert.equal(all.length,2);
  assert.ok(all.every(row=>row.targets.includes('シーバス')));
  assert.ok(all.every(row=>row.methods.includes('ルアーシーバス')));
  assert.ok(all.every(row=>row.lure_type==='minnow'));
  assert.ok(all.every(row=>row.length_mm>=90&&row.length_mm<=140));
  assert.ok(all.every(row=>row.publication_ready===false));
  assert.ok(all.every(row=>row.variant_scope==='functional-size'));
  assert.ok(all.every(row=>/^https:\/\/(www\.daiwa\.com|fish\.shimano\.com)\//.test(row.source?.source_url||'')));
  assert.ok(all.every(row=>row.source?.source_type==='manufacturer_official'));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-15'));
});

test('Seabass candidates preserve official functional specs for the 9-14cm FIRST CAST band',()=>{
  const all=manifest.batches.filter(batch=>batch.targets?.includes('シーバス')).flatMap(batch=>rows(batch.file));
  const daiwa=all.find(row=>row.maker==='DAIWA');
  const shimano=all.find(row=>row.maker==='SHIMANO');
  assert.deepEqual({length_mm:daiwa.length_mm,weight_g:daiwa.weight_g},{length_mm:100,weight_g:16.4});
  assert.deepEqual({length_mm:shimano.length_mm,weight_g:shimano.weight_g},{length_mm:99,weight_g:14});
  assert.match(daiwa.use_note,/表層〜1\.0m/);
  assert.match(daiwa.use_note,/ドリフト/);
  assert.match(shimano.use_note,/ドリフト/);
});
