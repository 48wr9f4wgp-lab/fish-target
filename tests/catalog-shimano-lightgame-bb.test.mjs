import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,rows=c.list({maker:'SHIMANO',series:'LIGHTGAME BB'}).filter(x=>x.source.source_type==='manufacturer_official');

test('LIGHTGAME BB keeps all ten official rows production-blocked',()=>{const batch=manifest.batches.find(x=>x.id==='shimano-lightgame-bb-2026');assert.ok(batch);assert.equal(batch.expected_rows,10);assert.equal(rows.length,10);assert.ok(rows.every(x=>x.category==='rod'&&x.status==='unknown'));assert.ok(rows.every(x=>x.source.source_provider==='shimano-official-research'&&x.source.license_status==='restricted'&&!c.productionEligible(x)));assert.equal(c.validateCatalog(c.products).length,0)});

test('LIGHTGAME BB keeps sinker gou raw and never fabricates lure grams or PE',()=>{const p=rows.find(x=>x.model==='73HH195');assert.ok(p);assert.equal(p.specs.sinker_load_raw,'40-120');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.line_pe_min,null);assert.equal(p.specs.line_pe_max,null);assert.equal(p.specs.power,'')});

test('LIGHTGAME BB preserves official dimensions weight and JAN',()=>{const p=rows.find(x=>x.model==='73MH195');assert.ok(p);assert.equal(p.specs.length_m,1.95);assert.equal(p.specs.pieces,2);assert.equal(p.specs.closed_length_cm,101);assert.equal(p.specs.weight_g,139);assert.equal(p.specs.tip_diameter_mm,1.2);assert.equal(p.identifiers.product_code,'274984');assert.equal(p.identifiers.jan,'4969363274984')});

test('LIGHTGAME BB heavy model remains separate with exact official sinker range',()=>{const p=rows.find(x=>x.model==='82H180');assert.ok(p);assert.equal(p.specs.length_m,1.80);assert.equal(p.specs.sinker_load_raw,'30-100');assert.equal(p.identifiers.jan,'4969363275004')});
