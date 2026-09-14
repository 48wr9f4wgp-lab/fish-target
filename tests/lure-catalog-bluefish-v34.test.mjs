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

test('bluefish shore-jig research is multi-maker and source-first',()=>{
  const batches=manifest.batches.filter(batch=>batch.targets?.includes('ブリ・ワラサ'));
  assert.deepEqual(new Set(batches.map(batch=>batch.maker)),new Set(['DAIWA','SHIMANO']));
  const all=batches.flatMap(batch=>rows(batch.file));
  assert.equal(all.length,4);
  assert.deepEqual(new Set(all.map(row=>row.weight_g)),new Set([40,42,60]));
  assert.ok(all.every(row=>row.methods.includes('ショアジギング')));
  assert.ok(all.every(row=>row.targets.includes('ブリ・ワラサ')));
  assert.ok(all.every(row=>row.publication_ready===false),'research candidates must not silently become publication products');
  assert.ok(all.every(row=>/^https:\/\/(www\.daiwa\.com|fish\.shimano\.com)\//.test(row.source?.source_url||'')),'every row needs an official manufacturer source');
});
