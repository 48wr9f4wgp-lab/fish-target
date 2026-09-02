import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,rows=c.list({maker:'SMITH',series:"TROUTIN' SPIN MULTIYOUSE"}).filter(x=>x.source.source_type==='manufacturer_official');

test('SMITH MULTIYOUSE keeps all thirteen official rows production-blocked',()=>{const batch=manifest.batches.find(x=>x.id==='smith-multiyouse-2026');assert.ok(batch);assert.equal(batch.expected_rows,13);assert.equal(rows.length,13);assert.ok(c.makers.includes('SMITH'));assert.ok(rows.every(x=>x.category==='rod'&&x.status==='unknown'));assert.ok(rows.every(x=>x.source.source_provider==='smith-official-research'&&x.source.license_status==='restricted'&&!c.productionEligible(x)));assert.equal(c.validateCatalog(c.products).length,0)});

test('spinning lb-only rows never fabricate PE values',()=>{const p=rows.find(x=>x.model==='TRMK-805M');assert.ok(p);assert.equal(p.specs.lure_min_g,5);assert.equal(p.specs.lure_max_g,18);assert.equal(p.specs.line_weight_raw,'6～16lb.');assert.equal(p.specs.line_pe_min,null);assert.equal(p.specs.line_pe_max,null);assert.equal(p.specs.pieces,null)});

test('bait rows keep manufacturer-supplied PE ranges only when explicitly printed',()=>{const p=rows.find(x=>x.model==='TRMK-C394UL');assert.ok(p);assert.equal(p.specs.line_weight_raw,'2～6lb. (0.3～1.0pe)');assert.equal(p.specs.line_pe_min,0.3);assert.equal(p.specs.line_pe_max,1.0);assert.equal(p.specs.lure_min_g,2);assert.equal(p.specs.lure_max_g,7)});

test('special power labels stay raw while standard powers may normalize',()=>{const uml=rows.find(x=>x.model==='TRMK-564UML'),sl=rows.find(x=>x.model==='TRMK-604SL'),ml=rows.find(x=>x.model==='TRMK-765ML');assert.ok(uml&&sl&&ml);assert.equal(uml.specs.power,'');assert.equal(uml.specs.power_raw,'UM.Light');assert.equal(sl.specs.power,'');assert.equal(sl.specs.power_raw,'Super Light');assert.equal(ml.specs.power,'ML');assert.equal(ml.specs.power_raw,'Medium Light')});

test('official page does not supply JAN, so identifiers remain empty',()=>{assert.ok(rows.every(x=>!x.identifiers?.jan))});
