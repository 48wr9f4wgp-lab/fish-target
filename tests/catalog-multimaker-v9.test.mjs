import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG;
const shore=c.list({maker:'PALMS',series:'ShoreGun EVOLV'}),pin=c.list({maker:'PALMS',series:'Pinwheel'});

test('initial PALMS batch keeps its 31-row official contract',()=>{assert.equal(shore.length,20);assert.equal(pin.length,11);const p=[...shore,...pin];assert.equal(p.length,31);assert.ok(c.makers.includes('PALMS'));assert.ok(p.every(x=>x.category==='rod'));assert.ok(p.every(x=>x.status==='unknown'));assert.ok(p.every(x=>x.source.source_provider==='palms-official-research'));assert.ok(p.every(x=>x.source.license_status==='restricted'&&!c.productionEligible(x)));assert.ok(p.every(x=>!x.identifiers.jan))});

test('ShoreGun numeric maker powers stay raw while exact lure grams remain usable',()=>{const p1=shore.find(x=>x.model==='SFTGS-992・SS');assert.ok(p1);assert.equal(p1.specs.length_ft,9.75);assert.equal(p1.specs.power,'');assert.equal(p1.specs.power_raw,'2');assert.equal(p1.specs.lure_min_g,20);assert.equal(p1.specs.lure_max_g,40);assert.equal(p1.specs.weight_g,229)});

test('ShoreGun plus power stays raw and egi size never becomes grams',()=>{const plus=shore.find(x=>x.model==='SFTGS-103H＋・BL'),egi=shore.find(x=>x.model==='SFTGS-86ML・EG');assert.ok(plus&&egi);assert.equal(plus.specs.power,'');assert.equal(plus.specs.power_raw,'H plus');assert.equal(plus.specs.lure_max_g,70);assert.equal(egi.specs.power,'ML');assert.equal(egi.specs.lure_weight_raw,'エギ2-3.5号');assert.equal(egi.specs.lure_min_g,null);assert.equal(egi.specs.lure_max_g,null);assert.equal(c.ownedSnapshot(egi,{id:'palms-egi'}).maxLure,null)});

test('Pinwheel noncanonical power labels stay raw while exact gram ranges remain usable',()=>{const x=pin.find(x=>x.model==='PFSS-63XUL〔Jighead tune〕'),u=pin.find(x=>x.model==='PFGS-69UL+〔Tip Power Custom〕'),m=pin.find(x=>x.model==='PFSS-88MLL〔Power Light〕');for(const q of [x,u,m])assert.ok(q);assert.equal(x.specs.power,'');assert.equal(x.specs.power_raw,'XUL');assert.equal(x.specs.lure_max_g,3.5);assert.equal(u.specs.power,'');assert.equal(u.specs.power_raw,'UL plus');assert.equal(u.specs.lure_max_g,7);assert.equal(m.specs.power,'');assert.equal(m.specs.power_raw,'MLL');assert.equal(m.specs.lure_max_g,18)});

test('canonical ShoreGun heavy powers remain canonical for fit logic',()=>{for(const [model,power,max] of [['SFTGS-103XH・BL','XH',100],['SFTGS-106XXH・BL','XXH',120],['SFTGS-103XXXH・BL','XXXH',150]]){const q=shore.find(x=>x.model===model);assert.ok(q);assert.equal(q.specs.power,power);assert.equal(q.specs.lure_max_g,max)}});
