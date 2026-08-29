import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,jackall=c.list({maker:'JACKALL',series:'26 BRS'}).filter(x=>x.source.source_type==='manufacturer_official');

test('JACKALL 26 BRS keeps all eleven official research rows production-blocked',()=>{const batch=manifest.batches.find(x=>x.id==='jackall-brs-2026');assert.ok(batch);assert.equal(batch.expected_rows,11);assert.equal(jackall.length,11);assert.ok(c.makers.includes('JACKALL'));assert.equal(c.validateCatalog(c.products).length,0);assert.ok(jackall.every(x=>x.category==='rod'&&x.status==='unknown'));assert.ok(jackall.every(x=>x.source.source_provider==='jackall-official-research'&&x.source.license_status==='restricted'&&!c.productionEligible(x)));const jan=jackall.map(x=>x.identifiers.jan);assert.equal(jan.length,11);assert.equal(new Set(jan).size,11);assert.ok(jan.every(x=>/^\d{13}$/.test(x)))});

test('26 BRS split PLUG and JIG limits never collapse into one fabricated generic lure range',()=>{const p=jackall.find(x=>x.model==='BRS-S98L/M-SJ');assert.ok(p);assert.equal(p.specs.power,'L');assert.equal(p.specs.power_raw,'LIGHT');assert.equal(p.specs.lure_weight_raw,'PLUG MAX40g / JIG MAX50g');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.jig_max_g,50);assert.equal(p.specs.line_pe_max,2.5);assert.equal(p.identifiers.jan,'4525807337280');assert.equal(c.ownedSnapshot(p,{id:'jackall-split'}).maxLure,null)});

test('26 BRS compound power remains raw instead of being forced into one canonical class',()=>{const p=jackall.find(x=>x.model==='BRS-S100ML/MH-SJ');assert.ok(p);assert.equal(p.specs.power,'');assert.equal(p.specs.power_raw,'MEDIUM LIGHT / MEDIUM HEAVY');assert.equal(p.specs.lure_weight_raw,'PLUG MAX50g / JIG MAX70g');assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.jig_max_g,70)});

test('26 BRS preserves EGI and RIG units without inventing gram conversions',()=>{const egi=jackall.find(x=>x.model==='BRS-S84ML'),rig=jackall.find(x=>x.model==='BRS-S56SUL-LG');assert.ok(egi&&rig);assert.equal(egi.specs.lure_max_g,25);assert.equal(egi.specs.lure_weight_raw,'LURE MAX25g / EGI MAX #3.5');assert.equal(rig.specs.power,'');assert.equal(rig.specs.power_raw,'SUPER ULTRA LIGHT');assert.equal(rig.specs.lure_weight_raw,'RIG MAX 3g');assert.equal(rig.specs.lure_min_g,null);assert.equal(rig.specs.lure_max_g,null);assert.equal(rig.specs.line_pe_max,0.4)});
