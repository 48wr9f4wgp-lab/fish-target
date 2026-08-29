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
const tict=c.list({maker:'TICT'}).filter(x=>x.source.source_type==='manufacturer_official');

test('TICT batch keeps all 21 official rods as later makers are added',()=>{
  assert.equal(tict.length,21);assert.ok(c.makers.includes('TICT'));assert.equal(c.validateCatalog(c.products).length,0);
  assert.ok(tict.every(x=>x.category==='rod'&&x.status==='current'));
  assert.ok(tict.every(x=>x.source.source_provider==='tict-official-research'));
  assert.ok(tict.every(x=>x.source.license_status==='restricted'&&!c.productionEligible(x)));
  const jans=tict.map(x=>x.identifiers.jan);assert.equal(new Set(jans).size,21);assert.ok(jans.every(x=>/^4988540\d{6}$/.test(x)));
});

test('SRAM EXR preserves official rig and line ranges without inventing rod power',()=>{const p=c.list({maker:'TICT',series:'SRAM EXR'}).find(x=>x.model==='EXR-66T-Sis');assert.ok(p);assert.equal(p.specs.length_raw,"6'6\" (199cm)");assert.equal(p.specs.length_ft,6.529);assert.equal(p.specs.weight_g,65);assert.equal(p.specs.power,'');assert.equal(p.specs.lure_weight_raw,'1～4g');assert.equal(p.specs.lure_min_g,1);assert.equal(p.specs.lure_max_g,4);assert.equal(p.specs.line_pe_min,0.15);assert.equal(p.specs.line_pe_max,0.35);assert.equal(p.identifiers.jan,'4988540223324')});

test('UTR-61 official fine and hard solid models remain separate exact products',()=>{const fs=c.list({maker:'TICT',series:'SRAM UTR-61 MasterPiece'}).find(x=>x.model==='UTR-61FS-T2'),hs=c.list({maker:'TICT',series:'SRAM UTR-61 MasterPiece'}).find(x=>x.model==='UTR-61HS-T2');assert.ok(fs&&hs);assert.equal(fs.specs.length_ft,6.102);assert.equal(hs.specs.length_ft,6.102);assert.equal(fs.specs.weight_g,47);assert.equal(hs.specs.weight_g,48.5);assert.equal(fs.specs.lure_weight_raw,'0.1～2g');assert.equal(hs.specs.lure_weight_raw,'0.4～3.5g');assert.equal(fs.specs.line_pe_min,null);assert.equal(hs.specs.line_pe_min,0.1);assert.equal(fs.identifiers.jan,'4988540178075');assert.equal(hs.identifiers.jan,'4988540178082')});

test('ICE CUBE maps exact maker lure maximums into MY TACKLE without touching line ownership',()=>{const p=c.list({maker:'TICT',series:'ICE CUBE'}).find(x=>x.model==='IC-90TG-Sis');assert.ok(p);assert.equal(p.specs.length_raw,"9'0\" (276cm)");assert.equal(p.specs.length_ft,9.055);assert.equal(p.specs.weight_g,115);assert.equal(p.specs.lure_min_g,0.8);assert.equal(p.specs.lure_max_g,21);assert.equal(p.specs.line_pe_min,0.2);assert.equal(p.specs.line_pe_max,0.6);const owned=c.ownedSnapshot(p,{id:'tict-ice'});assert.equal(owned.length,9.055);assert.equal(owned.maxLure,21);assert.equal(owned.lineType,undefined);assert.equal(owned.lineNo,undefined)});
