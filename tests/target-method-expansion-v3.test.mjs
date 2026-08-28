import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const V1_PARTS=[1,2,3,4,5].map(i=>`target-method-data-v1-part${i}.js`);
const V2_PARTS=[1,2,3,4,5].map(i=>`target-method-data-v2-part${i}.js`);
const V3_PARTS=[1,2,3,4,5].map(i=>`target-method-data-v3-part${i}.js`);
const REQUIRED=['id','method','style','why','rod','reel','line','leader','rig','bait','size','range','action','time','steps','places','source'];

function load(){
  const context=vm.createContext({console});
  for(const file of V1_PARTS)vm.runInContext(read(file),context,{filename:file});
  vm.runInContext(read('target-method-data-v1.js'),context,{filename:'target-method-data-v1.js'});
  for(const file of V2_PARTS)vm.runInContext(read(file),context,{filename:file});
  vm.runInContext(read('target-method-data-v2.js'),context,{filename:'target-method-data-v2.js'});
  for(const file of V3_PARTS)vm.runInContext(read(file),context,{filename:file});
  const v3Parts=context.FISH_TARGET_METHOD_EXPANSION_V3_PARTS;
  vm.runInContext(read('target-method-data-v3.js'),context,{filename:'target-method-data-v3.js'});
  return {combined:context.FISH_TARGET_METHOD_EXPANSION_V3,parts:v3Parts};
}

const rows=parts=>parts.flatMap(part=>[
  ...Object.entries(part.existing||{}).flatMap(([fish,methods])=>methods.map(method=>({fish,method}))),
  ...(part.targets||[]).flatMap(target=>target.methods.map(method=>({fish:target.name,method})))
]);

test('TARGET3 composes the verified TARGET2 baseline into 60 targets and 128 plans',()=>{
  const {combined}=load();
  assert.equal(combined.version,'V25-TARGET-METHOD3');
  assert.equal(combined.targets.length,41,'41 expansion targets + 19 canonical targets');
  assert.equal(19+combined.targets.length,60);
  const plans=19+Object.values(combined.existing).flat().length+combined.targets.reduce((n,x)=>n+x.methods.length,0);
  assert.equal(plans,128);
  assert.equal(new Set(combined.targets.map(x=>x.name)).size,combined.targets.length,'expansion target names must remain unique');
});

test('TARGET3 batch adds exactly five targets and twenty-three evidence-backed plans',()=>{
  const {parts}=load();
  const addedTargets=parts.flatMap(x=>x.targets||[]);
  const addedRows=rows(parts);
  assert.deepEqual([...addedTargets.map(x=>x.name)].sort(),['ウグイ','テナガエビ','ナマズ','ブルーギル','マブナ'].sort());
  assert.equal(addedTargets.length,5);
  assert.equal(addedRows.length,23);
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

test('TARGET3 representative target and cross-phase methods are present without duplicate IDs',()=>{
  const {combined}=load();
  const byName=new Map(combined.targets.map(x=>[x.name,x]));
  assert.equal(byName.get('ウグイ').methods.length,3);
  assert.equal(byName.get('テナガエビ').methods.length,2);
  assert.equal(byName.get('ブルーギル').methods.length,2);
  assert.equal(byName.get('ナマズ').methods[0].id,'top');
  assert.ok(combined.existing['クロダイ'].some(x=>x.id==='otoshikomi'),'kurodai otoshikomi');
  assert.ok(combined.existing['クロダイ'].some(x=>x.id==='ikada_dango'),'kurodai ikada dango');
  assert.ok(combined.existing['マダイ'].some(x=>x.id==='tairaba'),'madai tairaba');
  assert.ok(combined.existing['マダイ'].some(x=>x.id==='hitoritenya'),'madai hitoritenya');
  assert.ok(combined.existing['ワカサギ'].some(x=>x.id==='ice'),'TARGET2-added wakasagi receives TARGET3 ice plan');
  for(const [fish,methods] of Object.entries(combined.existing)){
    const ids=methods.map(x=>x.id);
    assert.equal(new Set(ids).size,ids.length,`${fish}: duplicate alternate method id`);
    assert.ok(!ids.includes('default'),`${fish}: reserved default id`);
  }
  for(const target of combined.targets){
    const ids=target.methods.map(x=>x.id);
    assert.equal(new Set(ids).size,ids.length,`${target.name}: duplicate target method id`);
    assert.ok(!ids.includes('default'),`${target.name}: reserved default id`);
    for(const season of ['春','夏','秋','冬'])assert.ok(target.season?.[season],`${target.name}: ${season} guidance`);
  }
});

test('TARGET3 ships and loads all parts before the existing method controller',()=>{
  const pwa=read('pwa.js');
  const build=read('scripts/build.mjs');
  const v3PartsToken='./target-method-data-v3-part${i}.js';
  assert.ok(pwa.indexOf("./target-method-data-v2.js")<pwa.indexOf(v3PartsToken),'TARGET2 aggregate before TARGET3 parts');
  assert.ok(pwa.indexOf(v3PartsToken)<pwa.indexOf("./target-method-data-v3.js"),'TARGET3 parts before TARGET3 aggregate');
  assert.ok(pwa.indexOf("./target-method-data-v3.js")<pwa.indexOf("./target-methods-v1.js"),'TARGET3 aggregate before controller');
  for(const asset of [...V3_PARTS,'target-method-data-v3.js'])assert.ok(build.includes(`'${asset}'`),`${asset} must ship in build`);
});
