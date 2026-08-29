import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const batchFiles=[...new Set(manifest.batches.flatMap(batch=>batch.files||[]))];
const expectedResearch=manifest.batches.reduce((sum,batch)=>sum+Number(batch.expected_rows||0),0);
const expectedSynthetic=14;
const expectedRegistryRows=manifest.batches
  .filter(batch=>(batch.files||[]).some(file=>read(file).includes('FISH_TARGET_CATALOG_BATCH_ROWS')))
  .reduce((sum,batch)=>sum+Number(batch.expected_rows||0),0);

function load({explicitResearch}){
  const context=vm.createContext({console});
  for(const file of ['catalog-providers.js','catalog-adapters.js',...batchFiles]){
    vm.runInContext(read(file),context,{filename:file});
  }
  if(explicitResearch)vm.runInContext(read('catalog-research.js'),context,{filename:'catalog-research.js'});
  vm.runInContext(read('catalog-fixtures.js'),context,{filename:'catalog-fixtures.js'});
  vm.runInContext(read('catalog.js'),context,{filename:'catalog.js'});
  return context;
}

test('research rows and synthetic fixtures remain separate explicit boundaries',()=>{
  const context=load({explicitResearch:true});
  const research=context.FISH_TARGET_CATALOG_RESEARCH_ROWS;
  const fixtures=context.FISH_TARGET_CATALOG_FIXTURES;
  const catalog=context.FISH_TARGET_CATALOG;
  const composition=context.FISH_TARGET_CATALOG_COMPOSITION;

  assert.equal(research.length,expectedResearch,'all manifest factual rows live in research boundary');
  assert.equal(fixtures.length,expectedSynthetic,'fixture boundary contains only development fixtures');
  assert.ok(research.every(row=>row.source?.source_type!=='synthetic'),'research boundary never contains synthetic rows');
  assert.ok(fixtures.every(row=>row.source?.source_type==='synthetic'),'fixture boundary contains only synthetic rows');
  assert.equal(catalog.products.length,expectedResearch+expectedSynthetic,'runtime composes both boundaries');
  assert.equal(composition.research,expectedResearch);
  assert.equal(composition.synthetic,expectedSynthetic);
  assert.equal(composition.total,expectedResearch+expectedSynthetic);
  assert.equal(composition.batchRows,expectedRegistryRows,'legacy composition metrics stay inspectable');
  assert.equal(composition.researchMode,'explicit');
});

test('legacy direct-load path composes identical runtime without re-mixing fixture boundary',()=>{
  const explicit=load({explicitResearch:true});
  const legacy=load({explicitResearch:false});
  const explicitIds=Array.from(explicit.FISH_TARGET_CATALOG.products,row=>String(row.product_id)).sort();
  const legacyIds=Array.from(legacy.FISH_TARGET_CATALOG.products,row=>String(row.product_id)).sort();

  assert.deepEqual(legacyIds,explicitIds,'legacy test/load harness resolves to the same product set');
  assert.equal(legacy.FISH_TARGET_CATALOG_FIXTURES.length,expectedSynthetic,'legacy compatibility does not repopulate fixture boundary with factual rows');
  assert.ok(legacy.FISH_TARGET_CATALOG_FIXTURES.every(row=>row.source?.source_type==='synthetic'));
  assert.equal(legacy.FISH_TARGET_CATALOG_COMPOSITION.researchMode,'legacy-fallback');
  assert.equal(legacy.FISH_TARGET_CATALOG_COMPOSITION.research,expectedResearch);
  assert.equal(legacy.FISH_TARGET_CATALOG_COMPOSITION.synthetic,expectedSynthetic);
  assert.equal(legacy.FISH_TARGET_CATALOG_COMPOSITION.total,expectedResearch+expectedSynthetic);
});

test('catalog research layer ships as lazy runtime asset before fixtures and runtime',()=>{
  const build=read('scripts/build.mjs');
  const loader=read('catalog-loader.js');
  assert.match(build,/lazyRuntimeAssets=\['catalog-providers\.js','catalog-adapters\.js',\.\.\.batchFiles,'catalog-research\.js','catalog-fixtures\.js','catalog\.js'\]/,'build must ship research layer in lazy runtime order');
  assert.match(loader,/tailAssets=\['catalog-research\.js','catalog-fixtures\.js','catalog\.js'\]/,'loader must execute research before fixtures/runtime');
  assert.equal(read('dist/catalog-research.js'),read('catalog-research.js'),'build must copy catalog-research.js verbatim');
  assert.ok(!read('dist/sw.js').includes('./catalog-research.js'),'research catalog stays out of install-time PWA shell');
});
