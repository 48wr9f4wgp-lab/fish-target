import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,official=manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0),apia=c.list({maker:'APIA'}).filter(x=>x.source.source_type==='manufacturer_official'),off=apia.filter(x=>['GRANDAGE NAVAL','GRANDAGE WORLD OCEAN'].includes(x.series));

test('APIA offshore expansion reaches 827 rows, 813 official facts, 31 batches and seventeen makers',()=>{assert.equal(manifest.batches.length,31);assert.equal(official,813);assert.equal(c.products.length,827);assert.equal(apia.length,83);assert.equal(off.length,12);assert.equal(c.makers.length,17);assert.equal(c.validateCatalog(c.products).length,0);assert.ok(off.every(x=>x.category==='rod'&&x.status==='unknown'));assert.ok(off.every(x=>x.source.source_provider==='apia-official-research'));assert.ok(off.every(x=>x.source.license_status==='restricted'&&!c.productionEligible(x)));const j=off.map(x=>x.identifiers.jan);assert.equal(j.length,12);assert.equal(new Set(j).size,12);assert.ok(j.every(x=>/^\d{13}$/.test(x)));assert.equal(new Set(apia.map(x=>x.identifiers.jan)).size,83)});

test('GRANDAGE NAVAL keeps exact numeric ranges and official PE values',()=>{const p=c.list({maker:'APIA',series:'GRANDAGE NAVAL'}).find(x=>x.model==='S68ML');assert.ok(p);assert.equal(p.specs.length_ft,6.667);assert.equal(p.specs.length_m,2.03);assert.equal(p.specs.pieces,2);assert.equal(p.specs.weight_g,110);assert.equal(p.specs.power,'ML');assert.equal(p.specs.lure_min_g,3);assert.equal(p.specs.lure_max_g,25);assert.equal(p.specs.line_pe_min,0.6);assert.equal(p.specs.line_pe_max,1.2);assert.equal(p.identifiers.jan,'4582509422485');assert.equal(c.ownedSnapshot(p,{id:'apia-naval'}).maxLure,25)});

test('NAVAL grip-joint model does not invent a numeric piece count and M+ stays raw',()=>{const grip=c.list({maker:'APIA',series:'GRANDAGE NAVAL'}).find(x=>x.model==='C65ML'),plus=c.list({maker:'APIA',series:'GRANDAGE NAVAL'}).find(x=>x.model==='C64M+');assert.ok(grip&&plus);assert.equal(grip.specs.pieces,null);assert.equal(plus.specs.power,'');assert.equal(plus.specs.power_raw,'M+');assert.equal(plus.specs.lure_min_g,10);assert.equal(plus.specs.lure_max_g,42)});

test('WORLD OCEAN MAX-only rods never invent lower lure bounds',()=>{const p=c.list({maker:'APIA',series:'GRANDAGE WORLD OCEAN'}).find(x=>x.model==='834ML');assert.ok(p);assert.equal(p.specs.length_ft,8.25);assert.equal(p.specs.weight_g,282);assert.equal(p.specs.power,'ML');assert.equal(p.specs.lure_weight_raw,'MAX 70g');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,70);assert.equal(p.specs.pieces,null);assert.equal(p.identifiers.jan,'4582509428111');assert.equal(c.ownedSnapshot(p,{id:'apia-world'}).maxLure,70)});

test('WORLD OCEAN noncanonical heavy powers remain raw without flattening',()=>{for(const [model,power,max] of [['768H+','H+',190],['8010HH','HH',200],['7812HHH','HHH',220],['7614MAX','MAX',250]]){const p=c.list({maker:'APIA',series:'GRANDAGE WORLD OCEAN'}).find(x=>x.model===model);assert.ok(p,model);assert.equal(p.specs.power,'');assert.equal(p.specs.power_raw,power);assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,max)}});
