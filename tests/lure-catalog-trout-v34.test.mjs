import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {loadContentModel} from '../scripts/content-expansion-readiness.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('lure-catalog-manifest.json'));
const model=await loadContentModel();
const planPairs=new Set(model.records.flatMap(row=>row.methods.map(method=>`${row.name}\u0000${method.method}`)));
const ids=['daiwa-area-trout-spoon-v34','shimano-area-trout-spoon-v34','daiwa-native-trout-minnow-v34','shimano-native-trout-minnow-v34'];

function rows(file){
  const context=vm.createContext({console,FISH_TARGET_LURE_CATALOG_BATCH_ROWS:[]});
  vm.runInContext(read(file),context,{filename:file});
  return context.FISH_TARGET_LURE_CATALOG_BATCH_ROWS[0]?.rows||[];
}
const batches=()=>manifest.batches.filter(batch=>ids.includes(batch.id));
const allRows=()=>batches().flatMap(batch=>rows(batch.file));

test('V34 trout cluster is maker-neutral and uses complete lures only',()=>{
  const selected=batches();
  assert.equal(selected.length,4);
  assert.deepEqual(new Set(selected.map(batch=>batch.maker)),new Set(['DAIWA','SHIMANO']));
  const all=allRows();
  assert.equal(all.length,8);
  assert.equal(all.filter(row=>row.targets.includes('ニジマス')).length,4);
  assert.equal(all.filter(row=>row.targets.includes('ヤマメ・イワナ')).length,4);
  assert.ok(all.every(row=>['spoon-complete','sinking-minnow-complete'].includes(row.lure_type)));
  assert.ok(all.every(row=>row.variant_scope==='functional-size'));
  assert.ok(all.every(row=>row.publication_ready===false));
});

test('trout methods resolve exactly to canonical 63/158 plans',()=>{
  assert.ok(planPairs.has('ニジマス\u0000スプーン'));
  assert.ok(planPairs.has('ヤマメ・イワナ\u0000渓流ルアー'));
  for(const row of allRows()){
    for(const target of row.targets){
      assert.ok(row.methods.some(method=>planPairs.has(`${target}\u0000${method}`)),`${row.display_name} has no canonical method for ${target}`);
    }
  }
});

test('area-trout spoons stay inside canonical 1-5g FIRST CAST envelope',()=>{
  const rowsForTarget=allRows().filter(row=>row.targets.includes('ニジマス'));
  assert.deepEqual(new Set(rowsForTarget.map(row=>row.weight_g)),new Set([1.5,1.6,1.9,2.5]));
  assert.ok(rowsForTarget.every(row=>row.weight_g>=1&&row.weight_g<=5));
  assert.ok(rowsForTarget.every(row=>row.methods.includes('スプーン')));
  assert.ok(rowsForTarget.every(row=>row.lure_type==='spoon-complete'));
});

test('native-trout minnows stay inside canonical 4-6cm FIRST CAST envelope',()=>{
  const rowsForTarget=allRows().filter(row=>row.targets.includes('ヤマメ・イワナ'));
  assert.deepEqual(new Set(rowsForTarget.map(row=>row.size_mm)),new Set([44,45,50]));
  assert.ok(rowsForTarget.every(row=>row.size_mm>=40&&row.size_mm<=60));
  assert.ok(rowsForTarget.every(row=>row.methods.includes('渓流ルアー')));
  assert.ok(rowsForTarget.every(row=>row.lure_type==='sinking-minnow-complete'));
});

test('trout evidence is manufacturer-official and research rows avoid commerce/SKU bloat',()=>{
  const all=allRows();
  assert.ok(all.filter(row=>row.maker==='DAIWA').every(row=>/^https:\/\/www\.daiwa\.com\//.test(row.source?.source_url||'')));
  assert.ok(all.filter(row=>row.maker==='SHIMANO').every(row=>/^https:\/\/fish\.shimano\.com\//.test(row.source?.source_url||'')));
  assert.ok(all.every(row=>row.source?.source_type==='manufacturer_official'));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-16'));
  assert.doesNotMatch(JSON.stringify(all),/thumbnail|price|stock|color_sku/i);
});
