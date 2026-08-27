import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const PARTS=[1,2,3,4,5].map(i=>`target-method-data-v1-part${i}.js`);
const REQUIRED=['id','method','style','why','rod','reel','line','leader','rig','bait','size','range','action','time','steps','places','source'];

function expansion(){
  const context=vm.createContext({console});
  for(const file of PARTS)vm.runInContext(read(file),context,{filename:file});
  vm.runInContext(read('target-method-data-v1.js'),context,{filename:'target-method-data-v1.js'});
  return context.FISH_TARGET_METHOD_EXPANSION_V1;
}

const allMethods=data=>[
  ...Object.entries(data.existing).flatMap(([fish,methods])=>methods.map(method=>({fish,method}))),
  ...data.targets.flatMap(target=>target.methods.map(method=>({fish:target.name,method})))
];

test('TARGET1 expands to 35 targets and 67 selectable fishing plans',()=>{
  const data=expansion();
  assert.equal(data.version,'V24-TARGET-METHOD1');
  assert.equal(Object.values(data.existing).flat().length,21);
  assert.equal(data.targets.length,16);
  assert.equal(data.targets.reduce((n,x)=>n+x.methods.length,0),27);
  assert.equal(19+data.targets.length,35);
  assert.equal(19+Object.values(data.existing).flat().length+data.targets.reduce((n,x)=>n+x.methods.length,0),67);
  assert.equal(new Set(data.targets.map(x=>x.name)).size,data.targets.length,'new target names must be unique');
});

test('every expansion method is complete, traceable, and confidence A',()=>{
  const data=expansion();
  const rows=allMethods(data);
  assert.equal(rows.length,48);
  for(const {fish,method} of rows){
    for(const field of REQUIRED)assert.ok(method[field]!==undefined&&method[field]!==null&&method[field]!=='' ,`${fish}/${method.id}: ${field}`);
    assert.ok(Array.isArray(method.steps)&&method.steps.length===3,`${fish}/${method.id}: exactly 3 field steps`);
    assert.ok(Array.isArray(method.places)&&method.places.length>0,`${fish}/${method.id}: places`);
    assert.equal(method.source.provider,'SHIMANO',`${fish}/${method.id}: provider`);
    assert.match(method.source.url,/^https:\/\//,`${fish}/${method.id}: HTTPS source`);
    assert.equal(method.source.reviewed_at,'2026-08-28',`${fish}/${method.id}: review date`);
    assert.equal(method.source.confidence,'A',`${fish}/${method.id}: confidence`);
  }
});

test('method ids are unique within each target and do not overwrite default ids',()=>{
  const data=expansion();
  for(const [fish,methods] of Object.entries(data.existing)){
    const ids=methods.map(x=>x.id);
    assert.equal(new Set(ids).size,ids.length,`${fish}: duplicate method id`);
    assert.ok(!ids.includes('default'),`${fish}: reserved default id`);
  }
  for(const target of data.targets){
    const ids=target.methods.map(x=>x.id);
    assert.equal(new Set(ids).size,ids.length,`${target.name}: duplicate method id`);
    assert.ok(!ids.includes('default'),`${target.name}: reserved default id`);
    for(const season of ['春','夏','秋','冬'])assert.ok(target.season?.[season],`${target.name}: ${season} season guidance`);
  }
});

test('controller preserves method selection in saved plans and supports multi-style search',()=>{
  const js=read('target-methods-v1.js');
  const pwa=read('pwa.js');
  const build=read('scripts/build.mjs');
  assert.match(js,/state\.methodKey=next\.id/);
  assert.match(js,/x=\{fish:cur\.name,\.\.\.state,methodKey\}/);
  assert.match(js,/\(y\.methodKey\|\|'default'\)===methodKey/);
  assert.match(js,/styles\.includes\(styleFilter\)/);
  assert.match(js,/methodPickerV1/);
  assert.match(js,/\+\$\{methodsFor\(f\)\.length-1\}釣法/);
  assert.ok(pwa.indexOf("./target-method-data-v1.js")<pwa.indexOf("./target-methods-v1.js"),'data must load before controller');
  assert.ok(pwa.indexOf("./target-methods-v1.js")<pwa.indexOf("./tackle.js"),'method controller must load before MY TACKLE wraps result rendering');
  for(const asset of [...PARTS,'target-method-data-v1.js','target-methods-v1.js','target-methods-v1.css'])assert.ok(build.includes(`'${asset}'`),`${asset} must ship in build`);
});
