import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const V1_PARTS=[1,2,3,4,5].map(i=>`target-method-data-v1-part${i}.js`);
const V2_PARTS=[1,2,3,4,5].map(i=>`target-method-data-v2-part${i}.js`);
const REQUIRED=['id','method','style','why','rod','reel','line','leader','rig','bait','size','range','action','time','steps','places','source'];

function expansion(){
  const context=vm.createContext({console});
  for(const file of V1_PARTS)vm.runInContext(read(file),context,{filename:file});
  vm.runInContext(read('target-method-data-v1.js'),context,{filename:'target-method-data-v1.js'});
  for(const file of V2_PARTS)vm.runInContext(read(file),context,{filename:file});
  vm.runInContext(read('target-method-data-v2.js'),context,{filename:'target-method-data-v2.js'});
  return context.FISH_TARGET_METHOD_EXPANSION_V2;
}

const allMethods=data=>[
  ...Object.entries(data.existing).flatMap(([fish,methods])=>methods.map(method=>({fish,method}))),
  ...data.targets.flatMap(target=>target.methods.map(method=>({fish:target.name,method})))
];

test('TARGET2 expands to 55 targets and 105 selectable fishing plans',()=>{
  const data=expansion();
  assert.equal(data.version,'V24-TARGET-METHOD2');
  assert.equal(Object.values(data.existing).flat().length,29);
  assert.equal(data.targets.length,36);
  assert.equal(data.targets.reduce((n,x)=>n+x.methods.length,0),57);
  assert.equal(19+data.targets.length,55);
  assert.equal(19+Object.values(data.existing).flat().length+data.targets.reduce((n,x)=>n+x.methods.length,0),105);
  assert.equal(new Set(data.targets.map(x=>x.name)).size,data.targets.length,'new target names must be unique');
});

test('every TARGET2 expansion method is complete and traceable',()=>{
  const data=expansion();
  const rows=allMethods(data);
  assert.equal(rows.length,86);
  for(const {fish,method} of rows){
    for(const field of REQUIRED)assert.ok(method[field]!==undefined&&method[field]!==null&&method[field]!=='' ,`${fish}/${method.id}: ${field}`);
    assert.ok(['bait','lure'].includes(method.style),`${fish}/${method.id}: style`);
    assert.ok(Array.isArray(method.steps)&&method.steps.length===3,`${fish}/${method.id}: exactly 3 field steps`);
    assert.ok(Array.isArray(method.places)&&method.places.length>0,`${fish}/${method.id}: places`);
    assert.ok(['SHIMANO','DAIWA'].includes(method.source.provider),`${fish}/${method.id}: provider`);
    assert.match(method.source.url,/^https:\/\//,`${fish}/${method.id}: HTTPS source`);
    assert.equal(method.source.reviewed_at,'2026-08-28',`${fish}/${method.id}: review date`);
    assert.ok(['species-method','method-target'].includes(method.source.evidence),`${fish}/${method.id}: evidence`);
    assert.equal(method.source.confidence,'A',`${fish}/${method.id}: confidence`);
  }
});

test('method ids are unique within each target and defaults stay reserved',()=>{
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

test('TARGET2 contains representative freshwater shore offshore squid and rock plans',()=>{
  const data=expansion();
  const byName=new Map(data.targets.map(x=>[x.name,x]));
  for(const name of ['ワカサギ','ヘラブナ','ウナギ','ヒラマサ','シイラ','オニカサゴ','スルメイカ','ヤリイカ','マルイカ','コウイカ','ヒイカ','アイナメ','ムラソイ','キジハタ'])assert.ok(byName.has(name),`${name} target`);
  assert.equal(byName.get('ヘラブナ').methods.length,3,'herabuna has bottom/chuu/kattuke');
  assert.equal(byName.get('コウイカ').methods.length,3,'kouika has eging/bait/sutte');
  assert.equal(byName.get('ウナギ').methods.length,2,'unagi has float/cast');
  assert.equal(byName.get('ムラソイ').methods.length,2,'murasoi bait/lure');
  assert.ok(data.existing['アオリイカ'].some(x=>x.id==='tiprun'),'aori tiprun');
  assert.ok(data.existing['メバル'].some(x=>x.id==='boat_doutuki'),'mebaru boat doutuki');
  assert.ok(data.existing['アジ'].some(x=>x.id==='bishi'),'aji bishi');
  assert.ok(data.existing['カレイ'].some(x=>x.id==='choinage'),'TARGET1-added karei receives TARGET2 choinage');
});

test('controller preserves method selection, staged composition, and TARGET2 load order',()=>{
  const js=read('target-methods-v1.js');
  const pwa=read('pwa.js');
  const build=read('scripts/build.mjs');
  const v1PartsToken='./target-method-data-v1-part${i}.js';
  const v2PartsToken='./target-method-data-v2-part${i}.js';
  assert.match(js,/state\.methodKey=next\.id/);
  assert.match(js,/x=\{fish:cur\.name,\.\.\.state,methodKey\}/);
  assert.match(js,/\(y\.methodKey\|\|'default'\)===methodKey/);
  assert.match(js,/styles\.includes\(styleFilter\)/);
  assert.match(js,/methodPickerV1/);
  assert.match(js,/methodNames=methodsFor\(f\)\.map/);
  assert.ok(
    js.indexOf('for(const raw of expansion.targets||[])') < js.indexOf('for(const [name,methods] of Object.entries(expansion.existing||{}))'),
    'expanded targets must exist before cross-phase alternate methods are applied'
  );
  assert.ok(pwa.indexOf(v1PartsToken)<pwa.indexOf("./target-method-data-v1.js"),'TARGET1 parts before TARGET1 aggregate');
  assert.ok(pwa.indexOf("./target-method-data-v1.js")<pwa.indexOf(v2PartsToken),'TARGET1 aggregate before TARGET2 parts');
  assert.ok(pwa.indexOf(v2PartsToken)<pwa.indexOf("./target-method-data-v2.js"),'TARGET2 parts before aggregate');
  assert.ok(pwa.indexOf("./target-method-data-v2.js")<pwa.indexOf("./target-methods-v1.js"),'combined data before controller');
  assert.ok(pwa.indexOf("./target-methods-v1.js")<pwa.indexOf("./tackle.js"),'method controller before MY TACKLE');
  for(const asset of [...V1_PARTS,'target-method-data-v1.js',...V2_PARTS,'target-method-data-v2.js','target-methods-v1.js','target-methods-v1.css'])assert.ok(build.includes(`'${asset}'`),`${asset} must ship in build`);
});
