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
const yamaga=c.list({maker:'YAMAGA BLANKS'}).filter(x=>x.source.source_type==='manufacturer_official');

test('YAMAGA expansion reaches 505 rows, 491 official facts, and eleven makers',()=>{
  assert.equal(manifest.batches.length,23);
  assert.equal(official,491);
  assert.equal(c.products.length,505);
  assert.equal(yamaga.length,25);
  assert.ok(c.makers.includes('YAMAGA BLANKS'));
  assert.equal(c.validateCatalog(c.products).length,0);
  assert.ok(yamaga.every(x=>x.category==='rod'));
  assert.ok(yamaga.every(x=>x.status==='current'));
  assert.ok(yamaga.every(x=>x.source.source_provider==='yamaga-official-research'));
  assert.ok(yamaga.every(x=>x.source.license_status==='restricted'));
  assert.ok(yamaga.every(x=>c.productionEligible(x)===false));
  const jans=yamaga.map(x=>x.identifiers.jan);
  assert.equal(new Set(jans).size,25);
  assert.ok(jans.every(x=>/^457158410\d{4}$/.test(x)));
});

test('BlueCurrent III preserves exact maker facts while deriving metric length only for fit logic',()=>{
  const b53=c.list({maker:'YAMAGA BLANKS',series:'BlueCurrentⅢ'}).find(x=>x.model==='53');
  assert.ok(b53);
  assert.equal(b53.specs.length_raw,'1610mm');
  assert.equal(b53.specs.length_m,1.61);
  assert.equal(b53.specs.length_ft,5.282);
  assert.equal(b53.specs.weight_g,53);
  assert.equal(b53.specs.power,'');
  assert.equal(b53.specs.lure_weight_raw,'MAX4.5g (JH0.1~4.5g)');
  assert.equal(b53.specs.lure_min_g,null,'MAX-only maker spec must not invent a lower bound');
  assert.equal(b53.specs.lure_max_g,4.5);
  assert.equal(b53.specs.line_pe_min,0.06);
  assert.equal(b53.specs.line_pe_max,0.3);
  assert.equal(b53.identifiers.jan,'4571584100005');

  const b78=c.list({maker:'YAMAGA BLANKS',series:'BlueCurrentⅢ'}).find(x=>x.model==='78/B');
  assert.ok(b78);
  assert.equal(b78.specs.length_raw,'2350mm');
  assert.equal(b78.specs.length_ft,7.71);
  assert.equal(b78.specs.weight_g,92);
  assert.equal(b78.specs.lure_max_g,15);
  assert.equal(b78.specs.line_pe_min,0.4);
  assert.equal(b78.specs.line_pe_max,0.8);
  assert.equal(b78.identifiers.jan,'4571584101682');
  const owned=c.ownedSnapshot(b78,{id:'yamaga-b78'});
  assert.equal(owned.length,7.71);
  assert.equal(owned.maxLure,15);
});

test('Mebius keeps manufacturer approximate grams as raw context, never exact fit weight',()=>{
  const m=c.list({maker:'YAMAGA BLANKS',series:'Mebius'}).find(x=>x.model==='710L');
  assert.ok(m);
  assert.equal(m.specs.length_raw,'2390mm');
  assert.equal(m.specs.length_ft,7.841);
  assert.equal(m.specs.weight_g,84);
  assert.equal(m.specs.power,'L');
  assert.equal(m.specs.lure_weight_raw,'1.8~3.5号(~21g)');
  assert.equal(m.specs.lure_min_g,null);
  assert.equal(m.specs.lure_max_g,null,'approximate maker g stays raw because fit engine has no approximation semantics');
  assert.equal(m.identifiers.jan,'4571584100548');
  const owned=c.ownedSnapshot(m,{id:'yamaga-mebius'});
  assert.equal(owned.power,'L');
  assert.equal(owned.maxLure,null);
});

test('Calista preserves egi units and compound power without flattening them into false canonical classes',()=>{
  const ar=c.list({maker:'YAMAGA BLANKS',series:'Calista'}).find(x=>x.model==='82ML/AR');
  assert.ok(ar);
  assert.equal(ar.specs.length_raw,'2496mm');
  assert.equal(ar.specs.length_ft,8.189);
  assert.equal(ar.specs.weight_g,92);
  assert.equal(ar.specs.power,'ML');
  assert.equal(ar.specs.lure_weight_raw,'Egi 2.5~3.5号');
  assert.equal(ar.specs.lure_min_g,null);
  assert.equal(ar.specs.lure_max_g,null);
  assert.equal(ar.identifiers.jan,'4571584101194');

  const lml=c.list({maker:'YAMAGA BLANKS',series:'Calista'}).find(x=>x.model==='90LML/S');
  assert.equal(lml.specs.power,'');
  assert.equal(lml.specs.power_raw,'LML');
  const mmh=c.list({maker:'YAMAGA BLANKS',series:'Calista'}).find(x=>x.model==='79MMH/AG');
  assert.equal(mmh.specs.power,'');
  assert.equal(mmh.specs.power_raw,'MMH');
  const owned=c.ownedSnapshot(ar,{id:'yamaga-calista'});
  assert.equal(owned.length,8.189);
  assert.equal(owned.power,'ML');
  assert.equal(owned.maxLure,null,'egi size must not become grams in MY TACKLE');
});
