import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {loadContentModel} from '../scripts/content-expansion-readiness.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('lure-catalog-manifest.json'));
const model=await loadContentModel();
const planPairs=new Set(model.records.flatMap(row=>row.methods.map(method=>`${row.name}\u0000${method.method}`)));

function rows(file){
  const context=vm.createContext({console,FISH_TARGET_LURE_CATALOG_BATCH_ROWS:[]});
  vm.runInContext(read(file),context,{filename:file});
  return context.FISH_TARGET_LURE_CATALOG_BATCH_ROWS[0]?.rows||[];
}

test('surf flatfish candidates are maker-neutral complete jighead-worm products',()=>{
  const batches=manifest.batches.filter(batch=>['daiwa-surf-flatfish-v34','majorcraft-surf-flatfish-v34'].includes(batch.id));
  assert.equal(batches.length,2);
  assert.deepEqual(new Set(batches.map(batch=>batch.maker)),new Set(['DAIWA','Major Craft']));
  const all=batches.flatMap(batch=>rows(batch.file));
  assert.equal(all.length,4);
  assert.deepEqual(new Set(all.map(row=>row.weight_g)),new Set([21,28]));
  assert.ok(all.every(row=>row.size_inch===4));
  assert.ok(all.every(row=>row.lure_type==='jighead-worm-complete'));
  assert.ok(all.every(row=>row.targets.includes('ヒラメ')&&row.targets.includes('マゴチ')));
  assert.ok(all.every(row=>row.methods.includes('サーフルアー')&&row.methods.includes('ワームゲーム')));
  assert.ok(all.every(row=>row.variant_scope==='functional-size'));
  assert.ok(all.every(row=>row.publication_ready===false));
});

test('surf candidate methods resolve to the canonical 63/158 plan model',()=>{
  assert.ok(planPairs.has('ヒラメ\u0000サーフルアー'));
  assert.ok(planPairs.has('マゴチ\u0000ワームゲーム'));
  const batches=manifest.batches.filter(batch=>['daiwa-surf-flatfish-v34','majorcraft-surf-flatfish-v34'].includes(batch.id));
  for(const row of batches.flatMap(batch=>rows(batch.file))){
    for(const target of row.targets)assert.ok(row.methods.some(method=>planPairs.has(`${target}\u0000${method}`)),`${row.display_name} has no canonical method for ${target}`);
  }
});

test('surf candidates stay inside each target FIRST CAST envelope',()=>{
  const all=manifest.batches.filter(batch=>['daiwa-surf-flatfish-v34','majorcraft-surf-flatfish-v34'].includes(batch.id)).flatMap(batch=>rows(batch.file));
  assert.ok(all.every(row=>row.weight_g>=20&&row.weight_g<=30),'Hirame canonical band is 20-30g');
  assert.ok(all.every(row=>row.weight_g>=14&&row.weight_g<=30),'Magochi canonical band is 14-30g');
  assert.ok(all.every(row=>row.size_inch>=3&&row.size_inch<=5));
});

test('surf evidence is official and avoids color-SKU/catalog bloat',()=>{
  const all=manifest.batches.filter(batch=>['daiwa-surf-flatfish-v34','majorcraft-surf-flatfish-v34'].includes(batch.id)).flatMap(batch=>rows(batch.file));
  assert.ok(all.filter(row=>row.maker==='DAIWA').every(row=>/^https:\/\/www\.daiwa\.com\//.test(row.source?.source_url||'')));
  assert.ok(all.filter(row=>row.maker==='Major Craft').every(row=>/^https:\/\/www\.majorcraft\.co\.jp\//.test(row.source?.source_url||'')));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-15'));
  assert.doesNotMatch(JSON.stringify(all),/thumbnail|price|stock|color_sku/i);
});
