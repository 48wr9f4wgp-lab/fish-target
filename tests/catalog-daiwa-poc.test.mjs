import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

function previewContext(){
  const context=vm.createContext({console});
  for(const file of ['catalog-providers.js','catalog-adapters.js','catalog-daiwa-poc.js','catalog-fixtures.js','catalog.js']){
    vm.runInContext(read(file),context,{filename:file});
  }
  return context;
}

test('DAIWA official-spec PoC adds 105 preview rows while production publication stays blocked',()=>{
  const context=previewContext();
  const catalog=context.FISH_TARGET_CATALOG;
  const poc=[...catalog.products].filter(x=>x.source?.source_provider==='daiwa-official-poc');
  assert.equal(context.FISH_TARGET_DAIWA_POC_ROWS.length,105);
  assert.equal(poc.length,105);
  assert.equal(catalog.products.length,119);
  assert.deepEqual([...catalog.validateCatalog(catalog.products)],[]);
  assert.ok(poc.every(x=>x.source.license_status==='unknown'));
  assert.ok(poc.every(x=>catalog.productionEligible(x)===false));
  const production=[...catalog.validateCatalog(poc,{production:true})];
  assert.equal(production.length,105);
  assert.ok(production.every(x=>x.errors.includes('source not eligible for production')));
  assert.ok(production.every(x=>x.errors.includes('provider not production-enabled')));
});

test('preview rod lengths match the existing ft.in convention and avoid false precision for 10ft10 models',()=>{
  const catalog=previewContext().FISH_TARGET_CATALOG;
  const lateo=catalog.list({maker:'DAIWA',category:'rod',series:'LATEO'}).find(x=>x.model==='86ML-K');
  assert.equal(lateo.specs.length_ft,8.6);
  const over=catalog.list({maker:'DAIWA',category:'rod',series:'OVER THERE'}).find(x=>x.model==='1010M/MH-K');
  assert.equal(over.specs.length_ft,null);
});

test('catalog reel product specs still never infer the line currently spooled by the user',()=>{
  const catalog=previewContext().FISH_TARGET_CATALOG;
  const reel=catalog.list({maker:'DAIWA',category:'reel',series:'FREAMS'}).find(x=>x.model==='LT4000-CXH');
  assert.equal(reel.specs.reel_size,4000);
  const owned=catalog.ownedSnapshot(reel,{id:'preview-reel'});
  assert.equal(owned.lineType,'');
  assert.equal(owned.lineNo,null);
});
