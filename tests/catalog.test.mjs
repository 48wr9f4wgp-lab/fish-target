import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

function catalogContext(){
  const context=vm.createContext({console});
  vm.runInContext(read('catalog-providers.js'),context,{filename:'catalog-providers.js'});
  vm.runInContext(read('catalog-adapters.js'),context,{filename:'catalog-adapters.js'});
  vm.runInContext(read('catalog-fixtures.js'),context,{filename:'catalog-fixtures.js'});
  vm.runInContext(read('catalog.js'),context,{filename:'catalog.js'});
  return context;
}

test('V23 synthetic catalog is valid for development but blocked from production',()=>{
  const {FISH_TARGET_CATALOG:catalog}=catalogContext();
  assert.equal(catalog.products.length,14);
  assert.deepEqual([...catalog.validateCatalog(catalog.products)],[]);
  const production=[...catalog.validateCatalog(catalog.products,{production:true})];
  assert.equal(production.length,catalog.products.length);
  assert.ok(production.every(x=>x.errors.includes('source not eligible for production')));
  assert.ok(production.every(x=>x.errors.includes('provider not production-enabled')));
  assert.ok(catalog.products.every(x=>x.source.license_status==='synthetic'));
});

test('DAIWA and SHIMANO provider gates remain disabled for production',()=>{
  const context=catalogContext();
  const providers=context.FISH_TARGET_CATALOG_PROVIDERS;
  const daiwa=providers.byMaker('DAIWA');
  const shimano=providers.byMaker('SHIMANO');
  assert.equal(daiwa.mode,'poc');
  assert.equal(shimano.id,'shimano-official-research');
  assert.equal(shimano.mode,'research');
  assert.equal(daiwa.productionEnabled,false);
  assert.equal(shimano.productionEnabled,false);
  assert.equal(providers.canPublish(daiwa,'licensed'),false);
  assert.equal(providers.canPublish(shimano,'licensed'),false);
  assert.throws(()=>providers.assertPublishable(shimano,'licensed'));
});

test('manufacturer adapters normalize raw rows without enabling production',()=>{
  const context=catalogContext();
  const adapters=context.FISH_TARGET_CATALOG_ADAPTERS;
  const daiwa=adapters.byMaker('DAIWA');
  const normalized=daiwa.normalize({category:'rod',series:'月下美人',generation:'demo',model:'76L',status:'current',specs:{length_ft:'7.6',power:'l',lure_max_g:'12'},source:{source_type:'synthetic',license_status:'synthetic'}});
  assert.equal(normalized.maker,'DAIWA');
  assert.equal(normalized.specs.length_ft,7.6);
  assert.equal(normalized.specs.power,'L');
  assert.equal(normalized.source.license_status,'synthetic');
  assert.equal(daiwa.productionEnabled,false);
  assert.throws(()=>daiwa.normalize({maker:'SHIMANO',category:'rod',series:'X',model:'Y'}));
});

test('stable product IDs support Japanese series names without collisions',()=>{
  const {FISH_TARGET_CATALOG:catalog}=catalogContext();
  const a=catalog.productId({maker:'DAIWA',category:'rod',series:'月下美人',generation:'2026',model:'76L'});
  const b=catalog.productId({maker:'DAIWA',category:'rod',series:'紅牙',generation:'2026',model:'76L'});
  const again=catalog.productId({maker:'DAIWA',category:'rod',series:'月下美人',generation:'2026',model:'76L'});
  assert.equal(a,again);
  assert.notEqual(a,b);
  assert.doesNotMatch(a,/unknown:unknown/);
});

test('catalog ownership snapshot maps rod specs but never guesses the line currently on a reel',()=>{
  const {FISH_TARGET_CATALOG:catalog}=catalogContext();
  const rod=catalog.list({maker:'DAIWA',category:'rod',status:'current'})[0];
  const ownedRod=catalog.ownedSnapshot(rod,{id:'rod-1'});
  assert.equal(ownedRod.source,'catalog');
  assert.equal(ownedRod.product_id,rod.product_id);
  assert.equal(ownedRod.length,rod.specs.length_ft);
  assert.equal(ownedRod.maxLure,rod.specs.lure_max_g);
  assert.deepEqual({...ownedRod.user_overrides},{});

  const reel=catalog.list({maker:'DAIWA',category:'reel'})[0];
  const unspecified=catalog.ownedSnapshot(reel,{id:'reel-1'});
  assert.equal(unspecified.size,reel.specs.reel_size);
  assert.equal(unspecified.lineType,'');
  assert.equal(unspecified.lineNo,null);
  const specified=catalog.ownedSnapshot(reel,{id:'reel-2',lineType:'PE',lineNo:1.5,user_overrides:{nickname:'遠征用'}});
  assert.equal(specified.lineType,'PE');
  assert.equal(specified.lineNo,1.5);
  assert.equal(specified.user_overrides.nickname,'遠征用');
});

test('legacy MY TACKLE records remain manual unless explicitly catalog-backed',()=>{
  const context=vm.createContext({console});
  const source=read('tackle.js').split('  const best=')[0]+'\n})();';
  vm.runInContext(source,context,{filename:'tackle.js'});
  const {normalizeOwned}=context.FISH_TARGET_TACKLE_LOGIC;
  const legacy=normalizeOwned({id:'old-1',name:'古いロッド',length:9.6,power:'MH',maxLure:60});
  assert.equal(legacy.source,'manual');
  assert.equal(legacy.name,'古いロッド');
  const catalog=normalizeOwned({id:'new-1',source:'catalog',product_id:'daiwa:rod:demo:v23:100mh'});
  assert.equal(catalog.source,'catalog');
  assert.equal(catalog.product_id,'daiwa:rod:demo:v23:100mh');
});

test('catalog search keeps maker/category/series boundaries',()=>{
  const {FISH_TARGET_CATALOG:catalog}=catalogContext();
  const daiwaRods=catalog.list({maker:'DAIWA',category:'rod'});
  assert.ok(daiwaRods.length>0);
  assert.ok(daiwaRods.every(x=>x.maker==='DAIWA'&&x.category==='rod'));
  const series=daiwaRods[0].series;
  const narrowed=catalog.list({maker:'DAIWA',category:'rod',series,query:daiwaRods[0].model});
  assert.ok(narrowed.length>=1);
  assert.ok(narrowed.every(x=>x.series===series));
});

test('catalog page contract supports lazy-load migration without changing selectors',async()=>{
  const {FISH_TARGET_CATALOG:catalog}=catalogContext();
  assert.equal(catalog.version,'V23-DEV2');
  const first=catalog.search({category:'rod',limit:2,offset:0});
  assert.equal(first.items.length,2);
  assert.equal(first.offset,0);
  assert.equal(first.limit,2);
  assert.ok(first.total>first.items.length);
  assert.equal(first.hasMore,true);

  const second=await catalog.loadPage({category:'rod',limit:2,offset:2});
  assert.equal(second.items.length,2);
  assert.equal(second.offset,2);
  assert.notEqual(second.items[0].product_id,first.items[0].product_id);
});

test('catalog lifecycle status remains searchable and selectable with explicit review metadata',()=>{
  const {FISH_TARGET_CATALOG:catalog}=catalogContext();
  const discontinued=catalog.list({status:'discontinued'});
  const unknown=catalog.list({status:'unknown'});
  assert.equal(discontinued.length,1);
  assert.equal(unknown.length,1);
  assert.equal(catalog.statusInfo('discontinued').label,'廃番');
  assert.equal(catalog.statusInfo('discontinued').selectable,true);
  assert.equal(catalog.statusInfo('discontinued').needsReview,true);
  assert.equal(catalog.statusInfo('unknown').label,'状態不明');
  assert.equal(catalog.statusInfo('current').needsReview,false);
});

test('catalog index exposes maker and series metadata without requiring full UI scans',()=>{
  const {FISH_TARGET_CATALOG:catalog}=catalogContext();
  const index=catalog.index({category:'rod'});
  assert.equal(index.total,catalog.list({category:'rod'}).length);
  assert.ok(index.makers.length>=2);
  assert.ok(index.makers.every(x=>x.count>0&&x.series.length>0));
});
