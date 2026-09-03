import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

function load(){
  const fish=[
    {name:'ヒラメ',water:'salt',style:'lure',tags:['フラット'],syn:['平目'],difficulty:'中級',method:'サーフルアー'},
    {name:'アジ',water:'salt',style:'bait',tags:['小物'],syn:['鯵'],difficulty:'初心者向け',method:'サビキ釣り'}
  ];
  const plans=new Map([
    ['ヒラメ',[
      {id:'default',method:'サーフルアー',style:'lure',rod:'10ft M',reel:'4000',line:'PE1号',leader:'20lb',rig:'ジグヘッド',bait:'ワーム',size:'20g',color:'ナチュラル',baitAction:'ただ巻き',range:'底上',action:'スロー',time:'朝',steps:['投げる','底を取る','巻く'],places:['サーフ'],mistakes:['底を引きずる'],source:{provider:'TEST',confidence:'A'}},
      {id:'bait',method:'泳がせ',style:'bait',rod:'投げ竿',reel:'4000',line:'ナイロン',leader:'5号',rig:'泳がせ仕掛け',bait:'小魚',size:'現地',range:'底',action:'待つ',time:'朝',steps:['投入','待つ','合わせ'],places:['堤防']}
    ]],
    ['アジ',[{id:'default',method:'サビキ釣り',style:'bait',rod:'磯竿',reel:'2500',line:'ナイロン',rig:'サビキ',bait:'アミエビ',size:'6号',range:'タナ',action:'誘う',time:'夕方',steps:['落とす','撒く','巻く'],places:['堤防']}]]
  ]);
  const sandbox={F:fish,FISH_TARGET_METHOD_STATUS:{methodsFor:item=>plans.get(item.name)||[]}};
  sandbox.globalThis=sandbox;
  vm.runInNewContext(read('species-registry.js'),sandbox,{filename:'species-registry.js'});
  vm.runInNewContext(read('method-registry.js'),sandbox,{filename:'method-registry.js'});
  return sandbox;
}

test('method registry creates globally unique plan ids from species + local method ids',()=>{
  const sandbox=load();
  const registry=sandbox.FISH_TARGET_METHOD_REGISTRY;
  assert.equal(registry.version,'METHOD-REGISTRY-1');
  assert.equal(registry.count,3);
  assert.equal(new Set(Array.from(registry.records,row=>row.plan_id)).size,3);
  const hirame=sandbox.FISH_TARGET_SPECIES_REGISTRY.resolve('平目');
  const plans=registry.plansForSpecies(hirame);
  assert.equal(plans.length,2);
  assert.equal(registry.resolve('ヒラメ','bait')?.method,'泳がせ');
  assert.equal(registry.get(registry.planId(hirame.species_id,'default'))?.method,'サーフルアー');
});

test('method registry freezes resolver-facing plan requirements and first-cast data',()=>{
  const registry=load().FISH_TARGET_METHOD_REGISTRY;
  const plan=registry.resolve('ヒラメ','default');
  assert.ok(Object.isFrozen(plan));
  assert.ok(Object.isFrozen(plan.requirements));
  assert.ok(Object.isFrozen(plan.first_cast));
  assert.ok(Object.isFrozen(plan.steps));
  assert.ok(Object.isFrozen(plan.places));
  assert.ok(Object.isFrozen(plan.mistakes));
  assert.ok(Object.isFrozen(plan.source));
  assert.equal(plan.requirements.rod,'10ft M');
  assert.equal(plan.first_cast.bait,'ワーム');
  assert.equal(plan.is_default,true);
});

test('method registry ships after species registry and remains available offline',()=>{
  const pwa=read('pwa.js');
  const speciesPos=pwa.indexOf("loadScript('./species-registry.js'");
  const methodPos=pwa.indexOf("loadScript('./method-registry.js'");
  const catalogPos=pwa.indexOf("loadScript('./catalog-loader.js'");
  assert.ok(speciesPos>=0&&methodPos>speciesPos&&catalogPos>methodPos,'method registry must load between species and downstream consumers');
  assert.equal(read('dist/method-registry.js'),read('method-registry.js'),'build must ship method registry verbatim');
  assert.ok(read('dist/sw.js').includes('./method-registry.js'),'method registry must remain available offline');
});
