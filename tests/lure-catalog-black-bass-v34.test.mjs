import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('lure-catalog-manifest.json'));
const CANONICAL_METHODS=['ワーム','スピナーベイト','ミノー','クランクベイト','トップウォーター'];

function rows(file){
  const context=vm.createContext({console,FISH_TARGET_LURE_CATALOG_BATCH_ROWS:[]});
  vm.runInContext(read(file),context,{filename:file});
  return Array.from(context.FISH_TARGET_LURE_CATALOG_BATCH_ROWS[0]?.rows||[]);
}

const bassBatches=()=>manifest.batches.filter(batch=>batch.targets?.includes('ブラックバス'));
const bassRows=()=>bassBatches().flatMap(batch=>rows(batch.file));

test('Black Bass five-plan cluster is complete and maker-neutral',()=>{
  const batches=bassBatches();
  assert.equal(batches.length,2);
  assert.deepEqual([...new Set(batches.map(batch=>batch.maker))].sort(),['DAIWA','JACKALL']);
  assert.ok(batches.every(batch=>batch.stage==='research'));
  const all=bassRows();
  assert.equal(all.length,10);
  assert.ok(all.every(row=>row.targets.includes('ブラックバス')));
  assert.ok(all.every(row=>row.publication_ready===false));
  assert.ok(all.every(row=>row.variant_scope==='functional-size'));
  for(const method of CANONICAL_METHODS){
    const methodRows=all.filter(row=>row.methods.includes(method));
    assert.equal(methodRows.length,2,`${method} must have exactly two research candidates`);
    assert.deepEqual([...new Set(methodRows.map(row=>row.maker))].sort(),['DAIWA','JACKALL'],`${method} must stay maker-neutral`);
  }
});

test('Black Bass candidates preserve canonical lure families and functional specs',()=>{
  const all=bassRows();
  const by=(maker,method)=>all.find(row=>row.maker===maker&&row.methods.includes(method));
  for(const maker of ['DAIWA','JACKALL']){
    const worm=by(maker,'ワーム');
    assert.equal(worm.lure_type,'soft_bait');
    assert.ok(worm.length_in>=3&&worm.length_in<=5);
    assert.equal(by(maker,'スピナーベイト').lure_type,'spinnerbait');
    assert.equal(by(maker,'スピナーベイト').weight_oz,0.375);
    assert.equal(by(maker,'ミノー').lure_type,'minnow');
    assert.ok(by(maker,'ミノー').length_mm>0);
    assert.equal(by(maker,'クランクベイト').lure_type,'crankbait');
    assert.ok(by(maker,'クランクベイト').dive_depth_m>0);
    assert.equal(by(maker,'トップウォーター').lure_type,'topwater');
    assert.ok(by(maker,'トップウォーター').length_mm>0);
  }
});

test('Black Bass research uses current manufacturer-official sources only',()=>{
  const all=bassRows();
  assert.ok(all.every(row=>row.source?.source_type==='manufacturer_official'));
  assert.ok(all.every(row=>row.source?.verified_at==='2026-09-15'));
  assert.ok(all.every(row=>/^https:\/\/(www\.daiwa\.com|www\.jackall\.co\.jp)\//.test(row.source?.source_url||'')));
});
