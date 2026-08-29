import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,official=manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0),apia=c.list({maker:'APIA'}).filter(x=>x.source.source_type==='manufacturer_official');

test('APIA expansion reaches 815 rows, 801 official facts, 30 batches and seventeen makers',()=>{assert.equal(manifest.batches.length,30);assert.equal(official,801);assert.equal(c.products.length,815);assert.equal(apia.length,71);assert.equal(c.makers.length,17);assert.ok(c.makers.includes('APIA'));assert.equal(c.validateCatalog(c.products).length,0);assert.ok(apia.every(x=>x.category==='rod'));assert.ok(apia.every(x=>x.status==='unknown'));assert.ok(apia.every(x=>x.source.source_provider==='apia-official-research'));assert.ok(apia.every(x=>x.source.license_status==='restricted'&&!c.productionEligible(x)));const j=apia.map(x=>x.identifiers.jan);assert.equal(j.length,71);assert.equal(new Set(j).size,71);assert.ok(j.every(x=>/^\d{13}$/.test(x)))});

test('Foojin Z SUPER SEVEN preserves exact official fit facts',()=>{const p=c.list({maker:'APIA',series:'Foojin’Z 6th Generation'}).find(x=>x.model==='S77MH');assert.ok(p);assert.equal(p.specs.length_ft,7.583);assert.equal(p.specs.length_m,2.311);assert.equal(p.specs.weight_g,117);assert.equal(p.specs.power,'MH');assert.equal(p.specs.lure_min_g,8);assert.equal(p.specs.lure_max_g,42);assert.equal(p.specs.line_pe_min,0.8);assert.equal(p.specs.line_pe_max,2);assert.equal(p.identifiers.jan,'4571679750955');assert.equal(c.ownedSnapshot(p,{id:'apia-fz'}).maxLure,42)});

test('Foojin RS EXV variants stay separate from regular models without ID collision',()=>{const regular=c.list({maker:'APIA',series:"Foojin'RS"}).find(x=>x.model==='S90L+'),exv=c.list({maker:'APIA',series:"Foojin'RS EXV"}).find(x=>x.model==='S90L+');assert.ok(regular&&exv);assert.notEqual(regular.product_id,exv.product_id);assert.equal(regular.specs.pieces,2);assert.equal(exv.specs.pieces,5);assert.equal(regular.identifiers.jan,'4571679752331');assert.equal(exv.identifiers.jan,'4571679752423');assert.equal(regular.specs.power,'');assert.equal(regular.specs.power_raw,'L+')});

test('GRANDAGE LEGACY preserves mixed line notation while extracting only explicit PE range',()=>{const p=c.list({maker:'APIA',series:'GRANDAGE LEGACY'}).find(x=>x.model==='S68MLT');assert.ok(p);assert.equal(p.specs.line_weight_raw,'lb:1-4 PE:#0.2-0.8');assert.equal(p.specs.line_pe_min,0.2);assert.equal(p.specs.line_pe_max,0.8);assert.equal(p.specs.power,'');assert.equal(p.specs.power_raw,'MLT');assert.equal(p.specs.lure_min_g,1);assert.equal(p.specs.lure_max_g,10)});

test('GRANDAGE ATLAS keeps Plug and Jig max contexts separate instead of inventing one range',()=>{const p=c.list({maker:'APIA',series:'GRANDAGE ATLAS'}).find(x=>x.model==='98M');assert.ok(p);assert.equal(p.specs.lure_weight_raw,'Plug:MAX50 Jig:MAX60');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.line_pe_min,1);assert.equal(p.specs.line_pe_max,3);assert.equal(c.ownedSnapshot(p,{id:'apia-atlas'}).maxLure,null)});

test('GRANDAGE MEGASOUL max-only models never invent a lower bound',()=>{const p=c.list({maker:'APIA',series:'GRANDAGE MEGASOUL'}).find(x=>x.model==='C62HH+');assert.ok(p);assert.equal(p.specs.power,'');assert.equal(p.specs.power_raw,'HH+');assert.equal(p.specs.lure_weight_raw,'MAX300');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,300);assert.equal(p.specs.line_pe_min,4);assert.equal(p.specs.line_pe_max,8);assert.equal(c.ownedSnapshot(p,{id:'apia-mega'}).maxLure,300)});
