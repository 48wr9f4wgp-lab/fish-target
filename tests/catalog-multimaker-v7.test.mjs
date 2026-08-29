import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,official=manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0),g=c.list({maker:'GAMAKATSU'}).filter(x=>x.source.source_type==='manufacturer_official');

test('Gamakatsu expansion reaches 614 rows, 600 official facts, 26 batches and fourteen makers',()=>{assert.equal(manifest.batches.length,26);assert.equal(official,600);assert.equal(c.products.length,614);assert.equal(g.length,52);assert.equal(c.makers.length,14);assert.ok(c.makers.includes('GAMAKATSU'));assert.equal(c.validateCatalog(c.products).length,0);assert.ok(g.every(x=>x.category==='rod'&&x.status==='current'));assert.ok(g.every(x=>x.source.source_provider==='gamakatsu-official-research'));assert.ok(g.every(x=>x.source.license_status==='restricted'&&!c.productionEligible(x)));const j=g.map(x=>x.identifiers.jan);assert.equal(new Set(j).size,52);assert.ok(j.every(x=>/^4549018\d{6}$/.test(x)))});

test('EG S keeps egi size as egi size and never converts it into grams',()=>{const p=c.list({maker:'GAMAKATSU',series:'LUXXE EG S'}).find(x=>x.model==='S82ML');assert.ok(p);assert.equal(p.specs.length_raw,"249cm (8'2\")");assert.equal(p.specs.length_ft,8.169);assert.equal(p.specs.power,'ML');assert.equal(p.specs.lure_weight_raw,'Egi 1.8〜3.5号');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.line_pe_min,0.4);assert.equal(p.specs.line_pe_max,1);const owned=c.ownedSnapshot(p,{id:'g-egs'});assert.equal(owned.maxLure,null)});

test('Speedmetal uses maker-supplied gram values while preserving original gou notation',()=>{const p=c.list({maker:'GAMAKATSU',series:'LUXXE Speedmetal R'}).find(x=>x.model==='B65ML');assert.ok(p);assert.equal(p.specs.lure_weight_raw,'5〜20号 (19〜75g)');assert.equal(p.specs.lure_min_g,19);assert.equal(p.specs.lure_max_g,75);assert.equal(p.specs.line_pe_min,0.3);assert.equal(p.specs.line_pe_max,1);const owned=c.ownedSnapshot(p,{id:'g-speed'});assert.equal(owned.maxLure,75)});

test('noncanonical Gamakatsu power labels remain raw instead of being flattened',()=>{const fl=c.list({maker:'GAMAKATSU',series:'LUXXE Storia F'}).find(x=>x.model==='66FL-solid.R'),lp=c.list({maker:'GAMAKATSU',series:'LUXXE EGTR XX'}).find(x=>x.model==='S69L+-solid'),p12=c.list({maker:'GAMAKATSU',series:'LUXXE RAYGRIT TC'}).find(x=>x.model==='S70/12+');for(const p of [fl,lp,p12])assert.ok(p);assert.equal(fl.specs.power,'');assert.equal(fl.specs.power_raw,'FL');assert.equal(lp.specs.power,'');assert.equal(lp.specs.power_raw,'L+');assert.equal(p12.specs.power,'');assert.equal(p12.specs.power_raw,'12+')});

test('official ounce and gram dual notation keeps exact maker grams without recalculating',()=>{const p=c.list({maker:'GAMAKATSU',series:'LUXXE Efreet'}).find(x=>x.model==='B70H-RF');assert.ok(p);assert.equal(p.specs.lure_weight_raw,'3/16〜1・1/4oz (5〜35g)');assert.equal(p.specs.lure_min_g,5);assert.equal(p.specs.lure_max_g,35);assert.equal(p.specs.line_pe_min,null);assert.equal(p.specs.line_weight_raw,'12〜20lb')});
