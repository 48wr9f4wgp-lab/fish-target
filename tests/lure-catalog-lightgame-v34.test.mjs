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

function lightgameRows(){
  const batches=manifest.batches.filter(batch=>['daiwa-lightgame-jighead-v34','shimano-lightgame-jighead-v34'].includes(batch.id));
  return batches.flatMap(batch=>rows(batch.file));
}

test('Ajing and Mebaring research is maker-neutral and inside the shared light-game band',()=>{
  const batches=manifest.batches.filter(batch=>batch.targets?.includes('アジ')&&batch.targets?.includes('メバル'));
  assert.deepEqual(new Set(batches.map(batch=>batch.maker)),new Set(['DAIWA','SHIMANO']));
  assert.deepEqual(batches.map(batch=>batch.expected_rows),[3,3]);
  const all=lightgameRows();
  assert.equal(all.length,6);
  assert.ok(all.every(row=>row.weight_g>=1&&row.weight_g<=2));
  assert.ok(all.every(row=>row.targets.includes('アジ')&&row.targets.includes('メバル')));
  assert.ok(all.every(row=>row.methods.includes('アジング')&&row.methods.includes('メバリング')));
  assert.ok(all.every(row=>row.publication_ready===false));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-15'));
});

test('every light-game target uses only canonical runtime method labels',()=>{
  const all=lightgameRows();
  for(const row of all){
    for(const target of row.targets){
      const canonicalForTarget=row.methods.filter(method=>planPairs.has(`${target}\u0000${method}`));
      assert.ok(canonicalForTarget.length>0,`${row.display_name} has no runtime method match for ${target}`);
    }
    assert.ok(row.methods.every(method=>[...planPairs].some(pair=>pair.endsWith(`\u0000${method}`))),`${row.display_name} contains a noncanonical method label`);
  }
  assert.ok(planPairs.has('アジ\u0000アジング'));
  assert.ok(planPairs.has('メバル\u0000メバリング'));
  assert.equal(planPairs.has('メバル\u0000メバリング（ワーム）'),false,'tests must not invent a display label that is absent from the 63/158 model');
});

test('component research never pretends to be a complete first cast',()=>{
  const components=lightgameRows().filter(row=>row.lure_type==='jighead-component');
  assert.equal(components.length,4);
  assert.deepEqual(new Set(components.map(row=>row.weight_g)),new Set([1,1.2,1.5,1.6]));
  assert.ok(components.every(row=>/ワームは別途必要/.test(row.use_note||'')));
});

test('two maker-neutral derived rig combos complete the physical FIRST CAST',()=>{
  const combos=lightgameRows().filter(row=>row.lure_type==='rig-combo');
  assert.equal(combos.length,2);
  assert.deepEqual(new Set(combos.map(row=>row.maker)),new Set(['DAIWA','SHIMANO']));
  assert.ok(combos.every(row=>Array.isArray(row.components)&&row.components.length===2));
  assert.ok(combos.every(row=>row.components.some(component=>component.role==='jighead')));
  assert.ok(combos.every(row=>row.components.some(component=>component.role==='soft-plastic')));
  assert.ok(combos.every(row=>/FIRST CAST/.test(row.use_note||'')));
  assert.ok(combos.every(row=>row.source?.source_type==='manufacturer_official_derived_combo'));
  assert.ok(combos.every(row=>row.variant_scope==='functional-size'));
  assert.doesNotMatch(JSON.stringify(combos),/thumbnail|price|stock|color_sku/i);
});

test('official evidence stays manufacturer-owned and publication remains closed',()=>{
  const all=lightgameRows();
  const daiwa=all.filter(row=>row.maker==='DAIWA');
  const shimano=all.filter(row=>row.maker==='SHIMANO');
  assert.ok(daiwa.some(row=>row.series==='月下美人ジグヘッドSS TG'));
  assert.ok(daiwa.every(row=>/^https:\/\/www\.daiwa\.com\//.test(row.source?.source_url||'')));
  assert.ok(shimano.every(row=>/^https:\/\/fish\.shimano\.com\//.test(row.source?.source_url||'')));
  assert.ok(all.every(row=>row.publication_ready===false));
});

test('candidate UI distinguishes first-cast sets, complete lures, and rig components',()=>{
  const entry=read('lure-catalog-entry.js');
  const loader=read('lure-catalog-loader.js');
  assert.match(entry,/市販ルアー \/ 仕掛け候補/);
  assert.match(loader,/FIRST CASTセット/);
  assert.match(loader,/lureType==='rig-combo'/);
  assert.match(loader,/row\.hook_size/);
  assert.match(loader,/row\.size_inch/);
  assert.match(loader,/FIRST CASTセット・ルアー完成品・仕掛け部品/);
});
