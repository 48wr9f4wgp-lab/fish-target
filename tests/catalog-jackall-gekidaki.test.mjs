import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,rows=c.list({maker:'JACKALL',series:'GEKIDAKI SHAFT EXTRO'}).filter(x=>x.source.source_type==='manufacturer_official');

test('GEKIDAKI SHAFT EXTRO keeps exactly six official research rows production-blocked',()=>{
 const batch=manifest.batches.find(x=>x.id==='jackall-gekidaki-extro-2026');assert.ok(batch);assert.equal(batch.expected_rows,6);assert.equal(rows.length,6);assert.equal(c.validateCatalog(c.products).length,0);assert.ok(rows.every(x=>x.status==='unknown'&&x.source.license_status==='restricted'&&!c.productionEligible(x)));
});

test('GEKIDAKI keeps sinker gou raw and never fabricates grams',()=>{
 for(const p of rows){assert.match(p.specs.sinker_load_raw,/号/);assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.jig_max_g,null);assert.equal(p.specs.lure_weight_raw,p.specs.sinker_load_raw);assert.equal(c.ownedSnapshot(p,{id:p.model}).maxLure,null)}
});

test('GEKIDAKI preserves official PE ranges and canonical power only when official',()=>{
 const sul=rows.find(x=>x.model==='GDX-C60SUL'),ml=rows.find(x=>x.model==='GDX-C64ML'),mh=rows.find(x=>x.model==='GDX-S65MH+OMO');assert.ok(sul&&ml&&mh);assert.equal(sul.specs.power,'');assert.equal(sul.specs.power_raw,'SUPER ULTRA LIGHT');assert.equal(ml.specs.power,'ML');assert.equal(ml.specs.line_pe_min,0.4);assert.equal(ml.specs.line_pe_max,0.8);assert.equal(mh.specs.power,'MH');assert.equal(mh.specs.power_raw,'MEDIUM HEAVY');assert.equal(mh.specs.line_pe_min,0.6);assert.equal(mh.specs.line_pe_max,1.0);
});

test('GEKIDAKI stores only JANs explicitly shown on the official page',()=>{
 const by=Object.fromEntries(rows.map(x=>[x.model,x]));for(const m of ['GDX-C60SUL','GDX-C64ML','GDX-C61MH-OMO'])assert.equal(by[m].identifiers.jan,undefined);assert.equal(by['GDX-C68UL'].identifiers.jan,'4525807303117');assert.equal(by['GDX-S60MH-OMO'].identifiers.jan,'4525807303124');assert.equal(by['GDX-S65MH+OMO'].identifiers.jan,'4525807303131');
});
