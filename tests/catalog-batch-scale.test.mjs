import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {prepareRows,renderBatchModule} from '../scripts/catalog-ingest.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const batchFiles=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];

function loadRuntime(){
  const context=vm.createContext({console});
  vm.runInContext(read('catalog-providers.js'),context,{filename:'catalog-providers.js'});
  vm.runInContext(read('catalog-adapters.js'),context,{filename:'catalog-adapters.js'});
  for(const file of batchFiles)vm.runInContext(read(file),context,{filename:file});
  vm.runInContext(read('catalog-fixtures.js'),context,{filename:'catalog-fixtures.js'});
  vm.runInContext(read('catalog.js'),context,{filename:'catalog.js'});
  return context;
}

test('catalog batch manifest is unique, complete, and describes 150 factual rows',()=>{
  assert.equal(manifest.version,'CATALOG-BATCHES-2');
  const ids=manifest.batches.map(x=>x.id),files=manifest.batches.flatMap(x=>x.files||[]);
  assert.equal(new Set(ids).size,ids.length,'unique batch ids');
  assert.equal(new Set(files).size,files.length,'each runtime file belongs to one batch');
  assert.equal(manifest.batches.reduce((n,x)=>n+x.expected_rows,0),150,'official factual row contract');
  for(const batch of manifest.batches){
    assert.ok(batch.id&&batch.maker&&batch.stage,`${batch.id}: metadata`);
    assert.ok(Number.isInteger(batch.expected_rows)&&batch.expected_rows>0,`${batch.id}: expected_rows`);
    for(const file of batch.files)assert.ok(read(file).length>0,`${batch.id}: ${file}`);
  }
});

test('runtime composes 150 official factual rows plus 14 synthetic fixtures without collisions',()=>{
  const context=loadRuntime(),catalog=context.FISH_TARGET_CATALOG;
  assert.equal(catalog.products.length,164);
  const official=catalog.products.filter(p=>p.source.source_type==='manufacturer_official');
  const synthetic=catalog.products.filter(p=>p.source.source_type==='synthetic');
  assert.equal(official.length,150);
  assert.equal(synthetic.length,14);
  assert.equal(official.filter(p=>p.maker==='DAIWA').length,116);
  assert.equal(official.filter(p=>p.maker==='SHIMANO').length,34);
  assert.equal(catalog.validateCatalog(catalog.products).length,0,'catalog validation errors');
  const ids=catalog.products.map(p=>p.product_id),jans=catalog.products.map(p=>p.identifiers?.jan).filter(Boolean);
  assert.equal(new Set(ids).size,ids.length,'product ids unique');
  assert.equal(new Set(jans).size,jans.length,'JAN unique across all known JANs');
  assert.equal(context.FISH_TARGET_CATALOG_COMPOSITION.batchRows,11);
});

test('first scale batch preserves current DAIWA facts and stays production-blocked',()=>{
  const context=loadRuntime(),catalog=context.FISH_TARGET_CATALOG;
  const air=catalog.list({maker:'DAIWA',series:'EMERALDAS AIR'});
  const ex=catalog.list({maker:'DAIWA',series:'EMERALDAS X'});
  const gx=catalog.list({maker:'DAIWA',series:'GEKKABIJIN X'});
  assert.equal(air.length,4);assert.equal(ex.length,4);assert.equal(gx.length,3);
  const model=air.find(x=>x.model==='PC LT2500-H');
  assert.equal(model.specs.reel_size,2500);
  assert.equal(model.specs.weight_g,175);
  assert.equal(model.specs.gear_ratio,5.7);
  assert.equal(model.specs.retrieve_cm,80);
  assert.equal(model.specs.max_drag_kg,10);
  assert.equal(model.specs.pe_capacity_raw,'0.8号-200m');
  assert.equal(model.identifiers.jan,'4550133579592');
  assert.equal(model.source.source_url,'https://www.daiwa.com/jp/product/10wlj94');
  assert.equal(model.source.last_verified,'2026-08-28');
  assert.equal(model.source.license_status,'unknown');
  assert.equal(catalog.productionEligible(model),false);
  const owned=catalog.ownedSnapshot(model,{id:'scale-reel'});
  assert.equal(owned.size,2500);
  assert.equal(owned.lineType,'');
  assert.equal(owned.lineNo,null);
});

test('source JSON regenerates the scale batch deterministically through catalog ingest',()=>{
  const input=JSON.parse(read('catalog-batches/daiwa-light-egi-reels-2026.json'));
  const rows=prepareRows(input,{expectedMaker:'DAIWA',requireOfficial:true});
  assert.equal(rows.length,11);
  assert.ok(rows.every(x=>x.identifiers.jan&&x.source.source_type==='manufacturer_official'));
  const generated=renderBatchModule(rows,'daiwa-light-egi-reels-2026');
  const context=vm.createContext({});
  vm.runInContext(generated,context);
  const generatedRows=JSON.parse(JSON.stringify(context.FISH_TARGET_CATALOG_BATCH_ROWS[0].rows));
  const committed=vm.createContext({});
  vm.runInContext(read('catalog-daiwa-light-egi-reels-2026.js'),committed);
  const committedRows=JSON.parse(JSON.stringify(committed.FISH_TARGET_CATALOG_BATCH_ROWS[0].rows));
  assert.deepEqual(committedRows,generatedRows,'committed runtime batch equals deterministic ingest output');
});

test('manifest batch files ship to dist lazily, never install-time precache',()=>{
  const worker=read('dist/sw.js');
  assert.ok(worker.includes('"./catalog-batch-manifest.json"'),'small manifest is part of core shell');
  for(const file of batchFiles){
    assert.ok(read(`dist/${file}`).length>0,`${file}: shipped`);
    assert.ok(!worker.includes(`"./${file}"`),`${file}: excluded from install precache`);
  }
});
