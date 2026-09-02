import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,rows=c.list({maker:'JACKALL',series:'SWITCH STICK'}).filter(x=>x.source.source_type==='manufacturer_official');

test('SWITCH STICK keeps exactly three official current research rows',()=>{const batch=manifest.batches.find(x=>x.id==='jackall-switch-stick-2026');assert.ok(batch);assert.equal(batch.expected_rows,3);assert.equal(rows.length,3);assert.equal(c.validateCatalog(c.products).length,0);assert.ok(rows.every(x=>x.category==='rod'&&x.status==='unknown'));assert.ok(rows.every(x=>x.source.source_provider==='jackall-official-research'&&x.source.license_status==='restricted'&&!c.productionEligible(x)))});

test('SWITCH STICK preserves official MAX-only lure and PE ranges without fabricated minima',()=>{const c551=rows.find(x=>x.model==='SS-C551'),c552=rows.find(x=>x.model==='SS-C552'),s553=rows.find(x=>x.model==='SS-S553');assert.ok(c551&&c552&&s553);for(const p of rows){assert.equal(p.specs.length_raw,'5\'5"/1.65m');assert.equal(p.specs.pieces,1);assert.equal(p.specs.line_pe_min,0.6);assert.equal(p.specs.line_pe_max,1);assert.equal(p.specs.lure_min_g,null)}assert.equal(c551.specs.lure_max_g,160);assert.equal(c552.specs.lure_max_g,160);assert.equal(s553.specs.lure_max_g,60);assert.equal(c551.specs.lure_weight_raw,'MAX 160g');assert.equal(s553.specs.lure_weight_raw,'MAX 60g')});

test('SWITCH STICK keeps special SUL raw while standard UL and L remain canonical',()=>{const c551=rows.find(x=>x.model==='SS-C551'),c552=rows.find(x=>x.model==='SS-C552'),s553=rows.find(x=>x.model==='SS-S553');assert.equal(c551.specs.power,'');assert.equal(c551.specs.power_raw,'SUPER ULTRA LIGHT');assert.equal(c552.specs.power,'UL');assert.equal(c552.specs.power_raw,'ULTRA LIGHT');assert.equal(s553.specs.power,'L');assert.equal(s553.specs.power_raw,'LIGHT')});

test('SWITCH STICK stores only manufacturer-published JAN values',()=>{const jan=Object.fromEntries(rows.map(x=>[x.model,x.identifiers.jan]));assert.deepEqual(jan,{'SS-C551':'4525807278606','SS-C552':'4525807278613','SS-S553':'4525807278620'});assert.equal(new Set(Object.values(jan)).size,3)});
