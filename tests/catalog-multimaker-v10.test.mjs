import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=f=>readFileSync(new URL(`../${f}`,import.meta.url),'utf8');
const manifest=JSON.parse(read('catalog-batch-manifest.json'));
const files=[...new Set(manifest.batches.flatMap(x=>x.files||[]))];
const ctx=vm.createContext({console});
for(const f of ['catalog-providers.js','catalog-adapters.js',...files,'catalog-fixtures.js','catalog.js'])vm.runInContext(read(f),ctx,{filename:f});
const c=ctx.FISH_TARGET_CATALOG,palms=c.list({maker:'PALMS'}).filter(x=>x.source.source_type==='manufacturer_official');
const metal=c.list({maker:'PALMS',series:'METAL WITCH Quest α'}),sea=c.list({maker:'PALMS',series:'Sea Rapture'}),lurk=c.list({maker:'PALMS',series:'Lurk Shooter'});

test('PALMS second expansion keeps its 64 official rod contracts',()=>{assert.equal(palms.length,64);assert.equal(metal.length,15);assert.equal(sea.length,10);assert.equal(lurk.length,8);assert.equal(c.validateCatalog(c.products).length,0);assert.ok(palms.every(x=>x.category==='rod'));assert.ok(palms.every(x=>x.source.source_provider==='palms-official-research'));assert.ok(palms.every(x=>x.source.license_status==='restricted'&&!c.productionEligible(x)))});

test('METAL WITCH numeric powers stay raw while simple gram ranges remain usable',()=>{const p=metal.find(x=>x.model==='MTTS-6102BSLJ');assert.ok(p);assert.equal(p.specs.length_ft,6.833);assert.equal(p.specs.power,'');assert.equal(p.specs.power_raw,'2');assert.equal(p.specs.lure_min_g,30);assert.equal(p.specs.lure_max_g,100);assert.equal(p.specs.line_pe_min,0.6);assert.equal(p.specs.line_pe_max,2);assert.equal(p.specs.weight_g,130)});

test('METAL WITCH max-only and multi-context specs never invent false lower or single ranges',()=>{const max=metal.find(x=>x.model==='MTTC-651BSLJ'),multi=metal.find(x=>x.model==='MTTC-685SF');assert.ok(max&&multi);assert.equal(max.specs.lure_weight_raw,'Max 120g');assert.equal(max.specs.lure_min_g,null);assert.equal(max.specs.lure_max_g,120);assert.equal(multi.specs.lure_weight_raw,'180-230g (Fall Max 400g)');assert.equal(multi.specs.lure_min_g,null);assert.equal(multi.specs.lure_max_g,null);assert.equal(c.ownedSnapshot(multi,{id:'palms-multi'}).maxLure,null)});

test('Sea Rapture preserves max-only and plus-power semantics',()=>{const tuna=sea.find(x=>x.model==='STGS-81H ＜ツナクラス＞'),plus=sea.find(x=>x.model==='STGS-83H+ ＜ツナクラス＞'),mplus=sea.find(x=>x.model==='STJS-62M+');assert.ok(tuna&&plus&&mplus);assert.equal(tuna.specs.power,'H');assert.equal(tuna.specs.lure_min_g,null);assert.equal(tuna.specs.lure_max_g,120);assert.equal(plus.specs.power,'');assert.equal(plus.specs.power_raw,'H plus');assert.equal(plus.specs.lure_max_g,150);assert.equal(mplus.specs.power,'');assert.equal(mplus.specs.power_raw,'M plus');assert.equal(mplus.specs.lure_min_g,80);assert.equal(mplus.specs.lure_max_g,200)});

test('Lurk Shooter keeps plus powers raw and lb line ranges raw',()=>{const p=lurk.find(x=>x.model==='LSGS-711H+〔BANK FISHER〕');assert.ok(p);assert.equal(p.specs.length_ft,7.917);assert.equal(p.specs.power,'');assert.equal(p.specs.power_raw,'H Plus');assert.equal(p.specs.lure_min_g,14);assert.equal(p.specs.lure_max_g,42);assert.equal(p.specs.line_pe_min,null);assert.equal(p.specs.line_pe_max,null);assert.equal(p.specs.line_weight_raw,'12-30lb');assert.equal(c.ownedSnapshot(p,{id:'palms-lurk'}).maxLure,42)});
