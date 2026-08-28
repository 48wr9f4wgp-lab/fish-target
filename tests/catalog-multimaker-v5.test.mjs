import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG;
const official=manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);
const tenryu=c.list({maker:'TENRYU'}).filter(x=>x.source.source_type==='manufacturer_official');

test('TENRYU expansion reaches 541 rows, 527 official facts, 24 batches and twelve makers',()=>{
  assert.equal(manifest.batches.length,24);
  assert.equal(official,527);
  assert.equal(c.products.length,541);
  assert.equal(tenryu.length,36);
  assert.ok(c.makers.includes('TENRYU'));
  assert.equal(c.validateCatalog(c.products).length,0);
  assert.ok(tenryu.every(x=>x.category==='rod'&&x.status==='current'));
  assert.ok(tenryu.every(x=>x.source.source_provider==='tenryu-official-research'));
  assert.ok(tenryu.every(x=>x.source.license_status==='restricted'&&!c.productionEligible(x)));
  const codes=tenryu.map(x=>x.identifiers.product_code);
  assert.equal(new Set(codes).size,36);
  assert.ok(codes.every(x=>/^\d{6}$/.test(x)));
  assert.ok(tenryu.every(x=>!x.identifiers.jan),'six-digit official page codes must not be fabricated into 13-digit JANs');
});

test('Rayz Spectra keeps official compound power and single lure range without flattening power',()=>{
  const p=c.list({maker:'TENRYU',series:'Rayz Spectra'}).find(x=>x.model==='RZS512S-LML');
  assert.ok(p);
  assert.equal(p.specs.length_raw,"1.55m [5'1\"]");
  assert.equal(p.specs.length_ft,5.085);
  assert.equal(p.specs.weight_g,65);
  assert.equal(p.specs.power,'');
  assert.equal(p.specs.power_raw,'LML');
  assert.equal(p.specs.lure_weight_raw,'2-10g');
  assert.equal(p.specs.lure_min_g,2);
  assert.equal(p.specs.lure_max_g,10);
  assert.equal(p.identifiers.product_code,'023618');
});

test('JIG-ZAM MAX-only model does not invent a lower lure bound',()=>{
  const p=c.list({maker:'TENRYU',series:'JIG-ZAM Dragg Force'}).find(x=>x.model==='JDF591B-G5/6');
  assert.ok(p);
  assert.equal(p.specs.length_raw,"1.75m [5'9\"]");
  assert.equal(p.specs.length_ft,5.741);
  assert.equal(p.specs.lure_weight_raw,'MAX350g (Best150-300g)');
  assert.equal(p.specs.lure_min_g,null);
  assert.equal(p.specs.lure_max_g,350);
  assert.equal(p.specs.line_pe_min,null);
  assert.equal(p.specs.line_pe_max,5);
});

test('HORIZON MJ keeps high and slow jig ranges as raw context rather than one false fit range',()=>{
  const p=c.list({maker:'TENRYU',series:'HORIZON MJ'}).find(x=>x.model==='HMJ5101B-M');
  assert.ok(p);
  assert.equal(p.specs.length_ft,5.84);
  assert.equal(p.specs.power,'M');
  assert.equal(p.specs.lure_weight_raw,'High100-180g / Slow150-350g');
  assert.equal(p.specs.lure_min_g,null);
  assert.equal(p.specs.lure_max_g,null);
  const owned=c.ownedSnapshot(p,{id:'tenryu-hmj'});
  assert.equal(owned.maxLure,null,'multi-mode jig ranges must not become a single MY TACKLE max');
});

test('Red Flip keeps vertical dotera and cast contexts intact',()=>{
  const p=c.list({maker:'TENRYU',series:'Red Flip'}).find(x=>x.model==='RF652S-L/CN');
  assert.ok(p);
  assert.equal(p.specs.length_raw,"1.96m [6'5\"]");
  assert.equal(p.specs.length_ft,6.43);
  assert.equal(p.specs.power,'L');
  assert.equal(p.specs.lure_weight_raw,'Vertical 45-120g / Dotera MAX180g / Cast MAX60g');
  assert.equal(p.specs.lure_min_g,null);
  assert.equal(p.specs.lure_max_g,null);
  assert.equal(p.identifiers.product_code,'023304');
});
