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

test('Ajing and Mebaring jighead research is maker-neutral and inside the shared 1-2g plan band',()=>{
  const batches=manifest.batches.filter(batch=>batch.targets?.includes('アジ')&&batch.targets?.includes('メバル'));
  assert.deepEqual(new Set(batches.map(batch=>batch.maker)),new Set(['DAIWA','SHIMANO']));
  const all=batches.flatMap(batch=>rows(batch.file));
  assert.equal(all.length,4);
  assert.deepEqual(new Set(all.map(row=>row.weight_g)),new Set([1,1.2,1.5,1.6]));
  assert.ok(all.every(row=>row.weight_g>=1&&row.weight_g<=2));
  assert.ok(all.every(row=>row.targets.includes('アジ')&&row.targets.includes('メバル')));
  assert.ok(all.every(row=>row.methods.includes('アジング')&&row.methods.includes('メバリング（ワーム）')));
  assert.ok(all.every(row=>row.lure_type==='jighead-component'));
  assert.ok(all.every(row=>/ワームは別途必要/.test(row.use_note||'')),'component candidates must not imply a complete first cast');
  assert.ok(all.every(row=>row.publication_ready===false));
  assert.ok(all.every(row=>/^https:\/\/(www\.daiwa\.com|fish\.shimano\.com)\//.test(row.source?.source_url||'')));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-15'));
});

test('every light-game target resolves to a real runtime method label',()=>{
  const batches=manifest.batches.filter(batch=>['daiwa-lightgame-jighead-v34','shimano-lightgame-jighead-v34'].includes(batch.id));
  const all=batches.flatMap(batch=>rows(batch.file));
  for(const row of all){
    for(const target of row.targets){
      assert.ok(row.methods.some(method=>planPairs.has(`${target}\u0000${method}`)),`${row.display_name} has no runtime method match for ${target}`);
    }
  }
});

test('official evidence is target-specific enough for both Aji and Mebaru',()=>{
  const batches=manifest.batches.filter(batch=>['daiwa-lightgame-jighead-v34','shimano-lightgame-jighead-v34'].includes(batch.id));
  const all=batches.flatMap(batch=>rows(batch.file));
  const daiwa=all.filter(row=>row.maker==='DAIWA');
  assert.ok(daiwa.every(row=>row.series==='月下美人ジグヘッドSS TG'));
  assert.ok(daiwa.every(row=>row.source.source_url==='https://www.daiwa.com/jp/product/c2562ct'));
  assert.ok(all.every(row=>row.variant_scope==='functional-size'));
  assert.doesNotMatch(JSON.stringify(all),/image|thumbnail|price|stock|color_sku/i);
});

test('candidate UI distinguishes complete lures from rig components and exposes hook specs',()=>{
  const entry=read('lure-catalog-entry.js');
  const loader=read('lure-catalog-loader.js');
  assert.match(entry,/市販ルアー \/ 仕掛け候補/);
  assert.match(loader,/市販ルアー \/ 仕掛け候補/);
  assert.match(loader,/row\.hook_size/);
  assert.match(loader,/ルアー完成品と仕掛け部品を含む/);
});
