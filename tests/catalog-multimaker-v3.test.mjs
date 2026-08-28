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
const expectedOfficial=manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);
const byMaker=maker=>c.list({maker}).filter(x=>x.source.source_type==='manufacturer_official');

test('multimaker catalog reaches 429 rows with nine makers',()=>{
  assert.ok(expectedOfficial>=415);
  assert.equal(c.products.length,expectedOfficial+14);
  assert.equal(c.products.length,429);
  for(const maker of ['DAIWA','SHIMANO','ABU GARCIA','PENN','OKUMA','MAJOR CRAFT','TAILWALK','JACKSON','PROX'])assert.ok(c.makers.includes(maker),maker);
  assert.equal(byMaker('TAILWALK').length,38);
  assert.equal(byMaker('JACKSON').length,31);
  assert.equal(byMaker('PROX').length,6);
  assert.equal(c.validateCatalog(c.products).length,0);
});

test('tailwalk preserves native oz and ft-in specs while deriving usable numeric values',()=>{
  const p=c.list({maker:'TAILWALK',series:'FULLRANGE [New Gen]'}).find(x=>x.model==='C66L');
  assert.ok(p);
  assert.equal(p.specs.length_raw,'6\'6"');
  assert.equal(p.specs.length_ft,6.5);
  assert.equal(p.specs.lure_weight_raw,'3/32-3/8');
  assert.equal(p.specs.lure_min_g,2.66);
  assert.equal(p.specs.lure_max_g,10.63);
  assert.equal(p.identifiers.jan,'4516508158953');
  assert.equal(c.productionEligible(p),false);
});

test('Jackson keeps exact rod context and does not convert sinker gou into grams',()=>{
  const surf=c.list({maker:'JACKSON',series:'SURF TRIBE'}).find(x=>x.model==='STHS-1062M');
  assert.ok(surf);
  assert.equal(surf.specs.length_raw,'10ft6in');
  assert.equal(surf.specs.length_ft,10.5);
  assert.equal(surf.specs.power,'M');
  assert.equal(surf.specs.lure_max_g,45);
  assert.equal(surf.specs.line_pe_min,0.8);
  assert.equal(surf.specs.line_pe_max,2);
  const tako=c.list({maker:'JACKSON',series:'OCEAN GATE TAKO'}).find(x=>x.model==='JOG-B600XH TAKO');
  assert.ok(tako);
  assert.equal(tako.specs.sinker_load_raw,'MAX80号');
  assert.equal(tako.specs.lure_max_g,null);
  assert.equal(c.productionEligible(tako),false);
});

test('PROX keeps official sinker and leader units without inventing lure weight',()=>{
  const p=c.list({maker:'PROX',series:'GRAVIS TAMAN AIR-K'}).find(x=>x.model==='GTAK850');
  assert.ok(p);
  assert.equal(p.specs.length_m,5);
  assert.equal(p.specs.length_ft,16.404);
  assert.equal(p.specs.sinker_load_raw,'20〜40号');
  assert.equal(p.specs.line_weight_raw,'適合ハリス 8〜12号');
  assert.equal(p.specs.lure_max_g,null);
  assert.equal(p.identifiers.jan,'4548992004652');
  assert.equal(c.productionEligible(p),false);
});
