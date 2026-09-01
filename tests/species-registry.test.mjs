import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const source=read('species-registry.js');

function load(){
  const fish=[
    {name:'シーバス',water:'salt',style:'lure',styles:['lure'],tags:['河口'],syn:['スズキ','シーバス'],difficulty:'中級',method:'ルアーシーバス'},
    {name:'ヒラスズキ',water:'salt',style:'lure',tags:['磯'],syn:['スズキ'],difficulty:'上級',method:'磯ルアー'}
  ];
  const before=JSON.stringify(fish);
  const sandbox={
    F:fish,
    FISH_TARGET_METHOD_STATUS:{methodsFor:item=>item.name==='シーバス'?[{id:'default'},{id:'night'}]:[{id:'default'}]}
  };
  sandbox.globalThis=sandbox;
  vm.runInNewContext(source,sandbox,{filename:'species-registry.js'});
  return {sandbox,fish,before};
}

test('species registry creates stable immutable lookup records without mutating legacy fish data',()=>{
  const {sandbox,fish,before}=load();
  const registry=sandbox.FISH_TARGET_SPECIES_REGISTRY;
  assert.ok(registry);
  assert.equal(registry.version,'SPECIES-REGISTRY-1');
  assert.equal(registry.count,2);
  assert.equal(JSON.stringify(fish),before,'registry must not mutate legacy F');
  assert.equal(registry.records[0].species_id,registry.idFor(fish[0]),'generated id is deterministic');
  assert.match(registry.records[0].species_id,/^species-[a-z0-9]+$/);
  assert.equal(registry.records[0].plan_count,2);
  assert.deepEqual(Array.from(registry.records[0].method_ids),['default','night']);
  assert.ok(Object.isFrozen(registry.records[0]));
  assert.ok(Object.isFrozen(registry.records[0].aliases));
});

test('species registry resolves exact IDs/names and refuses ambiguous aliases',()=>{
  const {sandbox}=load();
  const registry=sandbox.FISH_TARGET_SPECIES_REGISTRY;
  const seabass=registry.byName('シーバス');
  assert.equal(registry.get(seabass.species_id)?.name,'シーバス');
  assert.equal(registry.resolve('シーバス')?.name,'シーバス','exact canonical name wins');
  assert.equal(registry.resolve('スズキ'),null,'ambiguous alias must not guess a species');
  assert.deepEqual(Array.from(registry.aliasMatches('スズキ'),row=>row.name),['シーバス','ヒラスズキ']);
  assert.equal(registry.runtimeFish(seabass),sandbox.F[0]);
});

test('species registry loads after target composition and ships in the offline shell',()=>{
  const pwa=read('pwa.js');
  const targetPos=pwa.indexOf("loadScript('./target-methods-v1.js'");
  const registryPos=pwa.indexOf("loadScript('./species-registry.js'");
  const catalogPos=pwa.indexOf("loadScript('./catalog-loader.js'");
  assert.ok(targetPos>=0&&registryPos>targetPos&&catalogPos>registryPos,'registry must load after target composition and before consumers');
  assert.equal(read('dist/species-registry.js'),source,'build must ship registry verbatim');
  assert.ok(read('dist/sw.js').includes('./species-registry.js'),'species registry must remain available offline');
});
