import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const partsFor=v=>[1,2,3,4,5].map(i=>`target-method-data-v${v}-part${i}.js`);
const V1_PARTS=partsFor(1),V2_PARTS=partsFor(2),V3_PARTS=partsFor(3),V4_PARTS=partsFor(4);
const REQUIRED=['id','method','style','why','rod','reel','line','leader','rig','bait','size','range','action','time','steps','places','source'];

function load(){
  const context=vm.createContext({console});
  for(const v of [1,2,3]){
    for(const file of partsFor(v))vm.runInContext(read(file),context,{filename:file});
    vm.runInContext(read(`target-method-data-v${v}.js`),context,{filename:`target-method-data-v${v}.js`});
  }
  const baseline=context.FISH_TARGET_METHOD_EXPANSION_V3;
  for(const file of V4_PARTS)vm.runInContext(read(file),context,{filename:file});
  const v4Parts=context.FISH_TARGET_METHOD_EXPANSION_V4_PARTS;
  vm.runInContext(read('target-method-data-v4.js'),context,{filename:'target-method-data-v4.js'});
  return {baseline,combined:context.FISH_TARGET_METHOD_EXPANSION_V4,parts:v4Parts};
}

const rows=parts=>parts.flatMap(part=>[
  ...Object.entries(part.existing||{}).flatMap(([fish,methods])=>methods.map(method=>({fish,method}))),
  ...(part.targets||[]).flatMap(target=>target.methods.map(method=>({fish:target.name,method})))
]);

const planCount=data=>19+Object.values(data.existing||{}).flat().length+(data.targets||[]).reduce((n,x)=>n+(x.methods||[]).length,0);

test('TARGET4 keeps 60 targets and expands the verified TARGET3 baseline to 150 plans',()=>{
  const {baseline,combined}=load();
  assert.equal(baseline.version,'V25-TARGET-METHOD3');
  assert.equal(19+baseline.targets.length,60);
  assert.equal(planCount(baseline),130);
  assert.equal(combined.version,'V26-TARGET-METHOD4');
  assert.equal(19+combined.targets.length,60);
  assert.equal(planCount(combined),150);
  assert.equal(combined.targets.length,baseline.targets.length,'TARGET4 is a method-density pass, not a fish-count pass');
});

test('TARGET4 adds exactly twenty complete official-evidence Game Plans and zero new fish',()=>{
  const {parts}=load();
  const addedTargets=parts.flatMap(x=>x.targets||[]);
  const addedRows=rows(parts);
  assert.equal(addedTargets.length,0,'TARGET4 must not add fish');
  assert.equal(addedRows.length,20,'TARGET4 method batch size');
  for(const {fish,method} of addedRows){
    for(const field of REQUIRED)assert.ok(method[field]!==undefined&&method[field]!==null&&method[field]!=='' ,`${fish}/${method.id}: ${field}`);
    assert.ok(['bait','lure'].includes(method.style),`${fish}/${method.id}: style`);
    assert.ok(Array.isArray(method.steps)&&method.steps.length===3,`${fish}/${method.id}: exactly 3 field steps`);
    assert.ok(Array.isArray(method.places)&&method.places.length>0,`${fish}/${method.id}: places`);
    assert.ok(['SHIMANO','DAIWA'].includes(method.source.provider),`${fish}/${method.id}: official provider`);
    assert.match(method.source.url,/^https:\/\//,`${fish}/${method.id}: HTTPS source`);
    assert.equal(method.source.reviewed_at,'2026-08-28',`${fish}/${method.id}: review date`);
    assert.ok(['species-method','method-target'].includes(method.source.evidence),`${fish}/${method.id}: evidence`);
    assert.equal(method.source.confidence,'A',`${fish}/${method.id}: confidence`);
  }
});

test('TARGET4 representative shore boat bait and lure methods are all present',()=>{
  const {combined}=load();
  const has=(fish,id)=>combined.existing?.[fish]?.some(x=>x.id===id);
  for(const [fish,id] of [
    ['メバル','uki'],['メバル','kabura'],['カサゴ','saguri'],['カサゴ','boat_doutuki'],
    ['シーバス','nage'],['シーバス','uki'],['ヒラメ','boat_livebait'],['ヒラメ','boat_lure'],
    ['カンパチ','boat_jigging'],['ヒラマサ','offshore_casting'],['アユ','ayuing'],
    ['ブラックバス','topwater'],['テナガエビ','shimori'],['コイ','suikomi']
  ])assert.ok(has(fish,id),`${fish}/${id}`);
});

test('method IDs remain unique across original target plans and every later expansion layer',()=>{
  const {combined}=load();
  const targetsByName=new Map(combined.targets.map(x=>[x.name,x]));
  for(const [fish,methods] of Object.entries(combined.existing||{})){
    const ids=methods.map(x=>x.id);
    assert.equal(new Set(ids).size,ids.length,`${fish}: duplicate alternate method id`);
    assert.ok(!ids.includes('default'),`${fish}: reserved default id`);
    const target=targetsByName.get(fish);
    if(target){
      const targetIds=new Set((target.methods||[]).map(x=>x.id));
      for(const id of ids)assert.ok(!targetIds.has(id),`${fish}: method id ${id} duplicates an original expansion plan`);
    }
  }
  for(const target of combined.targets){
    const ids=(target.methods||[]).map(x=>x.id);
    assert.equal(new Set(ids).size,ids.length,`${target.name}: duplicate original method id`);
  }
});

test('TARGET4 files load after TARGET3 aggregate and ship before the controller',()=>{
  const pwa=read('pwa.js');
  const build=read('scripts/build.mjs');
  const v4PartsToken='./target-method-data-v4-part${i}.js';
  assert.ok(pwa.indexOf("./target-method-data-v3.js")<pwa.indexOf(v4PartsToken),'TARGET3 aggregate before TARGET4 parts');
  assert.ok(pwa.indexOf(v4PartsToken)<pwa.indexOf("./target-method-data-v4.js"),'TARGET4 parts before aggregate');
  assert.ok(pwa.indexOf("./target-method-data-v4.js")<pwa.indexOf("./target-methods-v1.js"),'TARGET4 aggregate before controller');
  for(const asset of [...V4_PARTS,'target-method-data-v4.js'])assert.ok(build.includes(`'${asset}'`),`${asset} must ship in build/offline shell`);
});
