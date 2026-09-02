import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,rows=c.list({maker:'SHIMANO',series:'HOLIDAY ISO'}).filter(x=>x.source.source_type==='manufacturer_official');

test('HOLIDAY ISO keeps all 25 official rows production-blocked',()=>{const batch=manifest.batches.find(x=>x.id==='shimano-holiday-iso-2026');assert.ok(batch);assert.equal(batch.expected_rows,25);assert.equal(rows.length,25);assert.ok(rows.every(x=>x.category==='rod'&&x.status==='current'));assert.ok(rows.every(x=>x.source.source_provider==='shimano-official-research'&&x.source.license_status==='restricted'&&!c.productionEligible(x)));assert.equal(c.validateCatalog(c.products).length,0)});

test('sinker and leader ranges stay in official go units and never become lure grams or PE',()=>{const p=rows.find(x=>x.model==='5-530PTS');assert.ok(p);assert.equal(p.specs.sinker_load_raw,'10-25');assert.equal(p.specs.leader_line_raw,'5-12');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.line_pe_min,null);assert.equal(p.specs.line_pe_max,null)});

test('telescopic construction and official JAN are preserved',()=>{const p=rows.find(x=>x.model==='4-530PTS');assert.ok(p);assert.equal(p.specs.rod_joint_raw,'振出');assert.equal(p.specs.pieces,6);assert.equal(p.specs.length_m,5.30);assert.equal(p.specs.closed_length_cm,104);assert.equal(p.identifiers.jan,'4969363251732')});

test('A models remain distinct and use official values without inference',()=>{const p=rows.find(x=>x.model==='2-530A');assert.ok(p);assert.equal(p.specs.sinker_load_raw,'2-5');assert.equal(p.specs.leader_line_raw,'2-5');assert.equal(p.specs.power,'');assert.equal(p.identifiers.jan,'4969363251800')});
