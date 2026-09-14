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

test('Aori shore-eging research covers 3.0 and 3.5 sizes with two official makers',()=>{
  const batches=manifest.batches.filter(batch=>batch.targets?.includes('アオリイカ'));
  assert.deepEqual(new Set(batches.map(batch=>batch.maker)),new Set(['DAIWA','SHIMANO']));
  const all=batches.flatMap(batch=>rows(batch.file));
  assert.equal(all.length,4);
  assert.deepEqual(new Set(all.map(row=>row.size_go)),new Set([3,3.5]));
  assert.ok(all.every(row=>row.methods.includes('エギング')));
  assert.ok(all.every(row=>row.targets.includes('アオリイカ')));
  assert.ok(all.every(row=>row.lure_type==='egi'));
  assert.ok(all.every(row=>row.publication_ready===false));
  assert.ok(all.every(row=>/^https:\/\/(www\.daiwa\.com|fish\.shimano\.com)\//.test(row.source?.source_url||'')));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-15'));
});

test('candidate UI can expose Egi Japanese size without depending on color variants',()=>{
  const loader=read('lure-catalog-loader.js');
  assert.match(loader,/row\.size_go/);
  assert.match(loader,/toFixed\(1\).*号/);
  for(const batch of manifest.batches.filter(batch=>batch.targets?.includes('アオリイカ'))){
    const all=rows(batch.file);
    assert.equal(new Set(all.map(row=>row.variant)).size,2,'only functional 3.0/3.5 size variants are stored');
    assert.ok(all.every(row=>row.variant_scope==='functional-size'));
  }
});
