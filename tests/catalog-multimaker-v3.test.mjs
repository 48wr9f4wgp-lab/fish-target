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

test('Fishman-era makers remain present as later catalog batches are added',()=>{
  assert.equal(c.products.length,expectedOfficial+14);
  for(const maker of ['DAIWA','SHIMANO','ABU GARCIA','PENN','OKUMA','MAJOR CRAFT','TAILWALK','JACKSON','PROX','FISHMAN'])assert.ok(c.makers.includes(maker),maker);
  assert.equal(byMaker('TAILWALK').length,38);
  assert.equal(byMaker('JACKSON').length,31);
  assert.equal(byMaker('PROX').length,6);
  assert.equal(byMaker('FISHMAN').length,51);
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

test('Fishman adds 51 official rods, preserves egi units, and separates discontinued models',()=>{
  const rows=byMaker('FISHMAN');
  assert.equal(rows.length,51);
  assert.ok(rows.every(x=>x.category==='rod'));
  assert.ok(rows.every(x=>x.source.source_provider==='fishman-official-research'));
  assert.ok(rows.every(x=>x.source.license_status==='restricted'));
  assert.ok(rows.every(x=>c.productionEligible(x)===false));
  const jans=rows.map(x=>x.identifiers.jan);
  assert.equal(new Set(jans).size,51);
  assert.ok(jans.every(x=>/^457148790\d{4}$/.test(x)));

  const calmer=c.list({maker:'FISHMAN',series:'Beams'}).find(x=>x.model==='calmer8.6M');
  assert.ok(calmer);
  assert.equal(calmer.specs.length_raw,'8ft6in');
  assert.equal(calmer.specs.length_ft,8.5);
  assert.equal(calmer.specs.power,'M');
  assert.equal(calmer.specs.lure_weight_raw,'2.5～4.5号');
  assert.equal(calmer.specs.lure_min_g,null);
  assert.equal(calmer.specs.lure_max_g,null);
  assert.equal(calmer.specs.line_pe_min,0.4);
  assert.equal(calmer.specs.line_pe_max,1);
  assert.equal(calmer.status,'unknown');

  const discontinued=c.list({maker:'FISHMAN',series:'Beams'}).find(x=>x.model==='blancsierra5.2UL');
  assert.ok(discontinued);
  assert.equal(discontinued.status,'discontinued');

  const heavy=c.list({maker:'FISHMAN',series:'BC4/BC5'}).find(x=>x.model==='8.3XXXH');
  assert.ok(heavy);
  assert.equal(heavy.specs.power,'XXXH');
  assert.equal(heavy.specs.lure_min_g,70);
  assert.equal(heavy.specs.lure_max_g,200);

  const owned=c.ownedSnapshot(calmer,{id:'fishman-calmer'});
  assert.equal(owned.length,8.5);
  assert.equal(owned.power,'M');
  assert.equal(owned.maxLure,null,'egi size must not become grams in MY TACKLE');
});
