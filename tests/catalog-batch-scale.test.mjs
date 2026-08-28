import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import {prepareRows,renderBatchModule} from '../scripts/catalog-ingest.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const batchFiles=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const sourceBatches=manifest.batches.filter(x=>x.source_input);
const expectedOfficial=manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);
const expectedSynthetic=14;
const expectedRegistryRows=sourceBatches.reduce((n,x)=>n+Number(x.expected_rows||0),0);
const expectedByMaker=maker=>manifest.batches.filter(x=>x.maker===maker).reduce((n,x)=>n+Number(x.expected_rows||0),0);

function loadRuntime(){
  const context=vm.createContext({console});
  vm.runInContext(read('catalog-providers.js'),context,{filename:'catalog-providers.js'});
  vm.runInContext(read('catalog-adapters.js'),context,{filename:'catalog-adapters.js'});
  for(const file of batchFiles)vm.runInContext(read(file),context,{filename:file});
  vm.runInContext(read('catalog-fixtures.js'),context,{filename:'catalog-fixtures.js'});
  vm.runInContext(read('catalog.js'),context,{filename:'catalog.js'});
  return context;
}

test('catalog batch manifest is unique, complete, and self-consistent',()=>{
  assert.match(manifest.version,/^CATALOG-BATCHES-\d+$/);
  const ids=manifest.batches.map(x=>x.id),files=manifest.batches.flatMap(x=>x.files||[]);
  assert.equal(new Set(ids).size,ids.length,'unique batch ids');
  assert.equal(new Set(files).size,files.length,'each runtime file belongs to one batch');
  assert.ok(expectedOfficial>=158,'official factual row contract must not regress');
  for(const batch of manifest.batches){
    assert.ok(batch.id&&batch.maker&&batch.stage,`${batch.id}: metadata`);
    assert.ok(Number.isInteger(batch.expected_rows)&&batch.expected_rows>0,`${batch.id}: expected_rows`);
    assert.ok(Array.isArray(batch.files)&&batch.files.length>0,`${batch.id}: files`);
    for(const file of batch.files)assert.ok(read(file).length>0,`${batch.id}: ${file}`);
    if(batch.source_input)assert.ok(read(batch.source_input).length>0,`${batch.id}: source input`);
  }
});

test('runtime composes manifest official rows plus synthetic fixtures without collisions',()=>{
  const context=loadRuntime(),catalog=context.FISH_TARGET_CATALOG;
  assert.equal(catalog.products.length,expectedOfficial+expectedSynthetic);
  const official=catalog.products.filter(p=>p.source.source_type==='manufacturer_official');
  const synthetic=catalog.products.filter(p=>p.source.source_type==='synthetic');
  assert.equal(official.length,expectedOfficial);
  assert.equal(synthetic.length,expectedSynthetic);
  assert.equal(official.filter(p=>p.maker==='DAIWA').length,expectedByMaker('DAIWA'));
  assert.equal(official.filter(p=>p.maker==='SHIMANO').length,expectedByMaker('SHIMANO'));
  assert.equal(catalog.validateCatalog(catalog.products).length,0,'catalog validation errors');
  const ids=catalog.products.map(p=>p.product_id),jans=catalog.products.map(p=>p.identifiers?.jan).filter(Boolean);
  assert.equal(new Set(ids).size,ids.length,'product ids unique');
  assert.equal(new Set(jans).size,jans.length,'JAN unique across all known JANs');
  assert.equal(context.FISH_TARGET_CATALOG_COMPOSITION.batchRows,expectedRegistryRows);
});

test('scale batches preserve official DAIWA facts and stay production-blocked',()=>{
  const context=loadRuntime(),catalog=context.FISH_TARGET_CATALOG;
  const air=catalog.list({maker:'DAIWA',series:'EMERALDAS AIR'});
  const ex=catalog.list({maker:'DAIWA',series:'EMERALDAS X'});
  const gx=catalog.list({maker:'DAIWA',series:'GEKKABIJIN X'});
  assert.equal(air.length,4);assert.equal(ex.length,4);assert.equal(gx.length,3);
  const emeraldas=air.find(x=>x.model==='PC LT2500-H');
  assert.equal(emeraldas.specs.reel_size,2500);
  assert.equal(emeraldas.specs.weight_g,175);
  assert.equal(emeraldas.specs.gear_ratio,5.7);
  assert.equal(emeraldas.specs.retrieve_cm,80);
  assert.equal(emeraldas.specs.max_drag_kg,10);
  assert.equal(emeraldas.specs.pe_capacity_raw,'0.8号-200m');
  assert.equal(emeraldas.identifiers.jan,'4550133579592');
  assert.equal(emeraldas.source.source_url,'https://www.daiwa.com/jp/product/10wlj94');
  assert.equal(emeraldas.source.last_verified,'2026-08-28');
  assert.equal(emeraldas.source.license_status,'unknown');
  assert.equal(catalog.productionEligible(emeraldas),false);
  const emeraldasOwned=catalog.ownedSnapshot(emeraldas,{id:'scale-reel'});
  assert.equal(emeraldasOwned.size,2500);
  assert.equal(emeraldasOwned.lineType,'');
  assert.equal(emeraldasOwned.lineNo,null);

  const blast=catalog.list({maker:'DAIWA',series:'BLAST LT'}).find(x=>x.model==='LT6000D-H');
  assert.ok(blast,'BLAST LT6000D-H');
  assert.equal(blast.status,'unknown','lifecycle is not inferred from page presence');
  assert.equal(blast.specs.reel_size,6000);
  assert.equal(blast.specs.weight_g,370);
  assert.equal(blast.specs.gear_ratio,5.7);
  assert.equal(blast.specs.retrieve_cm,101);
  assert.equal(blast.specs.max_drag_kg,12);
  assert.equal(blast.specs.pe_capacity_raw,'3号-300m');
  assert.equal(blast.identifiers.jan,'4960652239288');
  assert.equal(catalog.productionEligible(blast),false);

  const gekka=catalog.list({maker:'DAIWA',series:'GEKKABIJIN'}).find(x=>x.model==='LT2000S-H');
  assert.ok(gekka,'GEKKABIJIN LT2000S-H');
  assert.equal(gekka.status,'unknown');
  assert.equal(gekka.specs.weight_g,165);
  assert.equal(gekka.specs.gear_ratio,5.8);
  assert.equal(gekka.specs.retrieve_cm,76);
  assert.equal(gekka.specs.pe_capacity_raw,'0.4号-200m');
  assert.equal(gekka.identifiers.jan,'4550133304538');
  const gekkaOwned=catalog.ownedSnapshot(gekka,{id:'gekka-reel'});
  assert.equal(gekkaOwned.lineType,'');
  assert.equal(gekkaOwned.lineNo,null);
});

test('every source JSON deterministically regenerates its committed runtime batch',()=>{
  assert.ok(sourceBatches.length>=3,'scalable source batches');
  for(const batch of sourceBatches){
    assert.equal(batch.files.length,1,`${batch.id}: one generated runtime file per source batch`);
    const input=JSON.parse(read(batch.source_input));
    const rows=prepareRows(input,{expectedMaker:batch.maker,requireOfficial:true});
    assert.equal(rows.length,batch.expected_rows,`${batch.id}: source row count`);
    assert.ok(rows.every(x=>x.source.source_type==='manufacturer_official'),`${batch.id}: official sources`);
    const generated=renderBatchModule(rows,batch.id);
    const generatedContext=vm.createContext({});
    vm.runInContext(generated,generatedContext);
    const generatedRows=JSON.parse(JSON.stringify(generatedContext.FISH_TARGET_CATALOG_BATCH_ROWS[0].rows));
    const committedContext=vm.createContext({});
    vm.runInContext(read(batch.files[0]),committedContext);
    const committedRows=JSON.parse(JSON.stringify(committedContext.FISH_TARGET_CATALOG_BATCH_ROWS[0].rows));
    assert.deepEqual(committedRows,generatedRows,`${batch.id}: committed runtime batch equals deterministic ingest output`);
  }
});

test('manifest batch files ship to dist lazily, never install-time precache',()=>{
  const worker=read('dist/sw.js');
  assert.ok(worker.includes('"./catalog-batch-manifest.json"'),'small manifest is part of core shell');
  for(const file of batchFiles){
    assert.ok(read(`dist/${file}`).length>0,`${file}: shipped`);
    assert.ok(!worker.includes(`"./${file}"`),`${file}: excluded from install precache`);
  }
});
