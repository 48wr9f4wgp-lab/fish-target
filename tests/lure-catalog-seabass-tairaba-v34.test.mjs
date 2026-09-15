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

const ids=['daiwa-seabass-v34','shimano-seabass-v34','daiwa-tairaba-v34','shimano-tairaba-v34'];
const batches=()=>manifest.batches.filter(batch=>ids.includes(batch.id));
const allRows=()=>batches().flatMap(batch=>rows(batch.file));

test('V34 seabass and tairaba catalog is maker-neutral and complete-product only',()=>{
  const selected=batches();
  assert.equal(selected.length,4);
  assert.deepEqual(new Set(selected.map(batch=>batch.maker)),new Set(['DAIWA','SHIMANO']));
  const all=allRows();
  assert.equal(all.length,6);
  assert.equal(all.filter(row=>row.targets.includes('シーバス')).length,2);
  assert.equal(all.filter(row=>row.targets.includes('マダイ')).length,4);
  assert.ok(all.every(row=>['minnow-complete','tairubber-complete'].includes(row.lure_type)));
  assert.ok(all.every(row=>row.variant_scope==='functional-size'));
  assert.ok(all.every(row=>row.publication_ready===false));
});

test('candidate methods resolve to canonical 63/158 plans',()=>{
  assert.ok(planPairs.has('シーバス\u0000ルアーシーバス'));
  assert.ok(planPairs.has('マダイ\u0000タイラバ'));
  for(const row of allRows()){
    for(const target of row.targets){
      assert.ok(row.methods.some(method=>planPairs.has(`${target}\u0000${method}`)),`${row.display_name} has no canonical method for ${target}`);
    }
  }
});

test('seabass candidates stay inside the canonical 9-14cm minnow FIRST CAST envelope',()=>{
  const rowsForTarget=allRows().filter(row=>row.targets.includes('シーバス'));
  assert.equal(rowsForTarget.length,2);
  assert.ok(rowsForTarget.every(row=>row.methods.includes('ルアーシーバス')));
  assert.ok(rowsForTarget.every(row=>row.size_mm>=90&&row.size_mm<=140));
  assert.ok(rowsForTarget.every(row=>row.lure_type==='minnow-complete'));
});

test('tairaba candidates stay inside the canonical 60-150g FIRST CAST envelope',()=>{
  const rowsForTarget=allRows().filter(row=>row.targets.includes('マダイ'));
  assert.equal(rowsForTarget.length,4);
  assert.ok(rowsForTarget.every(row=>row.methods.includes('タイラバ')));
  assert.deepEqual(new Set(rowsForTarget.map(row=>row.weight_g)),new Set([60,80]));
  assert.ok(rowsForTarget.every(row=>row.weight_g>=60&&row.weight_g<=150));
  assert.ok(rowsForTarget.every(row=>row.lure_type==='tairubber-complete'));
});

test('manufacturer evidence is official and research rows avoid commerce/SKU bloat',()=>{
  const all=allRows();
  assert.ok(all.filter(row=>row.maker==='DAIWA').every(row=>/^https:\/\/www\.daiwa\.com\//.test(row.source?.source_url||'')));
  assert.ok(all.filter(row=>row.maker==='SHIMANO').every(row=>/^https:\/\/fish\.shimano\.com\//.test(row.source?.source_url||'')));
  assert.ok(all.every(row=>row.source?.source_type==='manufacturer_official'));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-16'));
  assert.doesNotMatch(JSON.stringify(all),/thumbnail|price|stock|color_sku/i);
});
