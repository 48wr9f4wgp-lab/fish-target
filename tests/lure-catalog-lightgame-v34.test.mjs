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

test('Ajing and Mebaring jighead research is maker-neutral and inside the shared 1-2g plan band',()=>{
  const batches=manifest.batches.filter(batch=>batch.targets?.includes('アジ')&&batch.targets?.includes('メバル'));
  assert.deepEqual(new Set(batches.map(batch=>batch.maker)),new Set(['DAIWA','SHIMANO']));
  const all=batches.flatMap(batch=>rows(batch.file));
  assert.equal(all.length,4);
  assert.deepEqual(new Set(all.map(row=>row.weight_g)),new Set([1,1.2,1.5,1.6]));
  assert.ok(all.every(row=>row.weight_g>=1&&row.weight_g<=2));
  assert.ok(all.every(row=>row.targets.includes('アジ')&&row.targets.includes('メバル')));
  assert.ok(all.every(row=>row.methods.includes('アジング')&&row.methods.includes('メバリング')));
  assert.ok(all.every(row=>row.lure_type==='jighead-component'));
  assert.ok(all.every(row=>/ワームは別途必要/.test(row.use_note||'')),'component candidates must not imply a complete first cast');
  assert.ok(all.every(row=>row.publication_ready===false));
  assert.ok(all.every(row=>/^https:\/\/(www\.daiwa\.com|fish\.shimano\.com)\//.test(row.source?.source_url||'')));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-15'));
});

test('candidate UI distinguishes complete lures from rig components and exposes hook specs',()=>{
  const entry=read('lure-catalog-entry.js');
  const loader=read('lure-catalog-loader.js');
  assert.match(entry,/市販ルアー \/ 仕掛け候補/);
  assert.match(loader,/市販ルアー \/ 仕掛け候補/);
  assert.match(loader,/row\.hook_size/);
  assert.match(loader,/ルアー完成品と仕掛け部品を含む/);
});
