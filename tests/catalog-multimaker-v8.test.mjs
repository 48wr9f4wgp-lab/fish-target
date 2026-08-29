import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,z=c.list({maker:'ZENAQ'}).filter(x=>x.source.source_type==='manufacturer_official');

test('ZENAQ keeps its 66-row official contract',()=>{assert.equal(z.length,66);assert.ok(c.makers.includes('ZENAQ'));assert.ok(z.every(x=>x.category==='rod'));assert.ok(z.every(x=>x.source.source_provider==='zenaq-official-research'));assert.ok(z.every(x=>x.source.license_status==='restricted'&&!c.productionEligible(x)));const j=z.map(x=>x.identifiers.jan).filter(Boolean);assert.equal(j.length,8);assert.equal(new Set(j).size,8);assert.ok(j.every(x=>/^451445993\d{4}$/.test(x)))});

test('MUTHOS keeps jig and plug ranges separate instead of inventing one fit range',()=>{const p=c.list({maker:'ZENAQ',series:'MUTHOS'}).find(x=>x.model==='Accura 100H');assert.ok(p);assert.equal(p.specs.length_ft,10);assert.equal(p.specs.lure_weight_raw,'Jig 30~200g / Plug 30~120g');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.line_pe_min,2);assert.equal(p.specs.line_pe_max,5);const owned=c.ownedSnapshot(p,{id:'z-muthos'});assert.equal(owned.maxLure,null)});

test('Tobizo stores official max as max-only and does not invent a lower bound',()=>{const p=c.list({maker:'ZENAQ',series:'Tobizo'}).find(x=>x.model==='TC84-100G');assert.ok(p);assert.equal(p.specs.length_ft,8.333);assert.equal(p.specs.lure_weight_raw,'MAX150g (Best60~110g)');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,150);assert.equal(p.specs.line_pe_min,4);assert.equal(p.specs.line_pe_max,8)});

test('Spirado ounce ranges stay raw and never become guessed grams',()=>{const p=c.list({maker:'ZENAQ',series:'Spirado BLACKART'}).find(x=>x.model==='B65 Finesse');assert.ok(p);assert.equal(p.specs.length_ft,6.417);assert.equal(p.specs.lure_weight_raw,'1/16~3/8oz');assert.equal(p.specs.lure_min_g,null);assert.equal(p.specs.lure_max_g,null);assert.equal(p.specs.line_weight_raw,'5~12lb');const owned=c.ownedSnapshot(p,{id:'z-bass'});assert.equal(owned.maxLure,null)});

test('INQLUDE keeps egi notation raw while using the separately stated gram lure range',()=>{const p=c.list({maker:'ZENAQ',series:'INQLUDE'}).find(x=>x.model==='IS83-M3 - SQUID SQUAD -');assert.ok(p);assert.equal(p.specs.length_ft,8.25);assert.equal(p.specs.lure_weight_raw,'Egi 2.5~3.5 / Lure 6~24g');assert.equal(p.specs.lure_min_g,6);assert.equal(p.specs.lure_max_g,24);assert.equal(p.specs.line_pe_min,0.4);assert.equal(p.specs.line_pe_max,1.5)});

test('Expedition preserves explicit lifecycle, exact JAN, pieces and weight',()=>{const p=c.list({maker:'ZENAQ',series:'Expedition'}).find(x=>x.model==='EP67B');assert.ok(p);assert.equal(p.status,'discontinued');assert.equal(p.identifiers.jan,'4514459930017');assert.equal(p.specs.length_ft,6.583);assert.equal(p.specs.pieces,3);assert.equal(p.specs.weight_g,190);assert.equal(p.specs.lure_min_g,13);assert.equal(p.specs.lure_max_g,70)});
