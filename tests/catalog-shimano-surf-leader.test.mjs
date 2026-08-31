import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,rows=c.list({maker:'SHIMANO',category:'reel',series:'SURF LEADER'}).filter(x=>x.source.source_type==='manufacturer_official');

test('SURF LEADER reel batch keeps all 3 current official rows production-blocked',()=>{const batch=manifest.batches.find(x=>x.id==='shimano-surf-leader-2026');assert.ok(batch);assert.equal(batch.expected_rows,3);assert.equal(rows.length,3);assert.ok(rows.every(x=>x.category==='reel'&&x.status==='current'));assert.ok(rows.every(x=>x.source.source_provider==='shimano-official-research'&&x.source.license_status==='restricted'&&!c.productionEligible(x)));assert.equal(c.validateCatalog(c.products).length,0)});

test('35 GOKUHOSO remains a dedicated casting size and keeps official no-drag facts',()=>{const p=rows.find(x=>x.model==='35 GOKUHOSO');assert.ok(p);assert.equal(p.specs.reel_size,null);assert.equal(p.specs.reel_size_raw,'35');assert.equal(p.specs.gear_ratio,3.5);assert.equal(p.specs.weight_g,455);assert.equal(p.specs.retrieve_cm,83);assert.equal(p.specs.max_drag_kg,null);assert.equal(p.specs.allowable_strength_kg,20);assert.equal(p.specs.drag_type_raw,'ドラグなし');assert.equal(p.specs.application_raw,'投げ・遠投');assert.equal(p.specs.pe_capacity_raw,'0.6-250, 0.8-200, 1-160');assert.equal(p.identifiers.jan,'4969363048288')});

test('SD 35 HYOUJYUN preserves drag and spool capacity without claiming current line',()=>{const p=rows.find(x=>x.model==='SD 35 HYOUJYUN');assert.ok(p);assert.equal(p.specs.reel_size,null);assert.equal(p.specs.reel_size_raw,'35');assert.equal(p.specs.max_drag_kg,20);assert.equal(p.specs.allowable_strength_kg,null);assert.equal(p.specs.drag_type_raw,'ドラグあり');assert.equal(p.specs.pe_capacity_raw,'1.5-250, 2-200, 3-130');assert.equal(p.identifiers.jan,'4969363048301');const owned=c.ownedSnapshot(p,{id:'owned',lineType:'PE',lineNo:2});assert.equal(owned.lineType,'PE');assert.equal(owned.lineNo,2);assert.equal(owned.peCapacityRaw,'1.5-250, 2-200, 3-130');assert.equal(owned.applicationRaw,'投げ・遠投');assert.equal(owned.maxDragKg,20)});
