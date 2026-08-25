import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

function catalogContext(){
  const context=vm.createContext({console});
  vm.runInContext(read('catalog.js'),context,{filename:'catalog.js'});
  return context;
}

test('V23 synthetic catalog is valid for development but blocked from production',()=>{
  const {FISH_TARGET_CATALOG:catalog}=catalogContext();
  assert.equal(catalog.products.length,12);
  assert.deepEqual([...catalog.validateCatalog(catalog.products)],[]);
  const production=[...catalog.validateCatalog(catalog.products,{production:true})];
  assert.equal(production.length,catalog.products.length);
  assert.ok(production.every(x=>x.errors.includes('source not eligible for production')));
  assert.ok(catalog.products.every(x=>x.source.license_status==='synthetic'));
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
  const rod=catalog.list({maker:'DAIWA',category:'rod'})[0];
  const ownedRod=catalog.ownedSnapshot(rod,{id:'rod-1'});
  assert.equal(ownedRod.source,'catalog');
  assert.equal(ownedRod.product_id,rod.product_id);
  assert.equal(ownedRod.length,rod.specs.length_ft);
  assert.equal(ownedRod.maxLure,rod.specs.lure_max_g);

  const reel=catalog.list({maker:'DAIWA',category:'reel'})[0];
  const unspecified=catalog.ownedSnapshot(reel,{id:'reel-1'});
  assert.equal(unspecified.size,reel.specs.reel_size);
  assert.equal(unspecified.lineType,'');
  assert.equal(unspecified.lineNo,null);
  const specified=catalog.ownedSnapshot(reel,{id:'reel-2',lineType:'PE',lineNo:1.5});
  assert.equal(specified.lineType,'PE');
  assert.equal(specified.lineNo,1.5);
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
