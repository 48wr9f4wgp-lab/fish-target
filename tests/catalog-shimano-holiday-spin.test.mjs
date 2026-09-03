import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,rows=c.list({maker:'SHIMANO',series:'HOLIDAY SPIN'}).filter(x=>x.source.source_type==='manufacturer_official');

test('HOLIDAY SPIN keeps all 22 official current rows production-blocked',()=>{const batch=manifest.batches.find(x=>x.id==='shimano-holiday-spin-2026');assert.ok(batch);assert.equal(batch.expected_rows,22);assert.equal(rows.length,22);assert.ok(rows.every(x=>x.category==='rod'&&x.status==='current'));assert.ok(rows.every(x=>x.source.source_provider==='shimano-official-research'&&x.source.license_status==='restricted'&&!c.productionEligible(x)));assert.equal(c.validateCatalog(c.products).length,0)});

test('surf sinker gou stays raw and never becomes fabricated lure grams or PE',()=>{const p=rows.find(x=>x.model==='305JX-TS');assert.ok(p);assert.equal(p.specs.sinker_load_raw,'5-15');assert.equal(p.specs.standard_sinker_load_raw,'10');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.line_pe_min,null);assert.equal(p.specs.line_pe_max,null)});

test('Shimano proprietary JX through CX hardness remains raw rather than fake canonical power',()=>{const jx=rows.find(x=>x.model==='305JX-TS'),cx=rows.find(x=>x.model==='405CX-T');assert.ok(jx&&cx);assert.equal(jx.specs.power,'');assert.equal(jx.specs.power_raw,'JX');assert.equal(cx.specs.power,'');assert.equal(cx.specs.power_raw,'CX')});

test('telescopic construction standard sinker and exact official JAN survive normalization',()=>{const p=rows.find(x=>x.model==='405CX-T');assert.ok(p);assert.equal(p.specs.rod_joint_raw,'振出');assert.equal(p.specs.length_m,4.05);assert.equal(p.specs.pieces,4);assert.equal(p.specs.closed_length_cm,114);assert.equal(p.specs.weight_g,438);assert.equal(p.specs.tip_diameter_mm,2.6);assert.equal(p.specs.sinker_load_raw,'25-35');assert.equal(p.specs.standard_sinker_load_raw,'30');assert.equal(p.specs.reel_seat_position_mm,820);assert.equal(p.specs.carbon_content_pct,78);assert.equal(p.specs.product_code,'251541');assert.equal(p.identifiers.jan,'4969363251541')});
