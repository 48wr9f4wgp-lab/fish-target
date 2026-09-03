import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

function fakeElement(id){
  return {
    id,value:'',textContent:'',innerHTML:'',hidden:false,dataset:{},style:{},
    classList:{add(){},remove(){},toggle(){},contains(){return false}},
    querySelectorAll(){return []},querySelector(){return null},
    addEventListener(){},appendChild(){},focus(){}
  };
}

function appContext(){
  const elements=new Map();
  const document={
    documentElement:{dataset:{fieldLive:'off'}},
    getElementById(id){if(!elements.has(id))elements.set(id,fakeElement(id));return elements.get(id)},
    querySelectorAll(){return []},querySelector(){return null}
  };
  const context=vm.createContext({console,document});
  vm.runInContext(read('data.js'),context,{filename:'data.js'});
  vm.runInContext(read('app.js').split("if($('spotSearchBtn'))")[0],context,{filename:'app.js'});
  for(const id of ['q','clearSearch','count','grid'])document.getElementById(id);
  return {context,elements};
}

test('search and water/style/difficulty filters render expected target sets',()=>{
  const {context,elements}=appContext();
  const run=source=>vm.runInContext(source,context);
  elements.get('q').value='タチウオ';
  run('renderHome()');
  assert.equal(elements.get('count').textContent,'1種');
  assert.match(elements.get('grid').innerHTML,/タチウオ/);

  elements.get('q').value='';
  run("waterFilter='fresh';styleFilter='all';difficultyFilter='all';renderHome()");
  assert.equal(elements.get('count').textContent,`${run("F.filter(f=>f.water==='fresh').length")}種`);
  assert.doesNotMatch(elements.get('grid').innerHTML,/タチウオ/);

  run("waterFilter='all';styleFilter='bait';difficultyFilter='all';renderHome()");
  assert.equal(elements.get('count').textContent,`${run("F.filter(f=>f.style==='bait').length")}種`);
  assert.match(elements.get('grid').innerHTML,/タチウオ/);

  run("waterFilter='all';styleFilter='all';difficultyFilter='advanced';renderHome()");
  assert.equal(elements.get('count').textContent,'1種');
  assert.match(elements.get('grid').innerHTML,/アユ/);
});

test('every canonical boat override remains a complete recommendation plan',()=>{
  const {context}=appContext();
  const plans=vm.runInContext(`Object.keys(O).map(name=>{
    cur=F.find(f=>f.name===name);
    state={place:'船',season:'秋',goal:'標準',wind:'普通',tide:'動いている',clarity:'普通',rotation:0,rotationManual:false,refined:false};
    const p=basePlan();return {name,hasBoat:!!O[name]?.['船'],method:p.method,style:p.style,rod:p.rod,reel:p.reel,line:p.line,leader:p.leader,steps:p.steps,cast:currentRotation(p)};
  }).filter(x=>x.hasBoat)`,context);
  assert.ok(plans.length>=8);
  for(const plan of plans){
    for(const field of ['method','style','rod','reel','line','leader'])assert.ok(plan[field],`${plan.name}: ${field}`);
    assert.equal(plan.steps?.length,3,`${plan.name}: steps`);
    assert.ok(plan.cast?.name&&plan.cast?.size,`${plan.name}: FIRST CAST`);
  }
});

test('save/restore data falls back safely when localStorage is unavailable',()=>{
  const {context}=appContext();
  const result=vm.runInContext(`(()=>{
    const saved=[{fish:'タチウオ',place:'おすすめ',season:'秋',goal:'標準',rotation:1,rotationManual:true}];
    const persisted=storeSet('fish_target_v9',JSON.stringify(saved));
    return {persisted,raw:storeGet('fish_target_v9'),restored:savedData()};
  })()`,context);
  assert.equal(result.persisted,false);
  assert.equal(JSON.parse(result.raw)[0].fish,'タチウオ');
  assert.equal(result.restored[0].rotation,1);
  assert.equal(result.restored[0].rotationManual,true);
});

test('public artifact uses the canonical build version and no stale recommendation markers',()=>{
  const html=read('dist/index.html');
  const config=JSON.parse(read('build.config.json'));
  assert.match(html,new RegExp(`FISH TARGET ${config.version.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}`));
  assert.doesNotMatch(html,/FISH TARGET V(?:15|19)\b/i);
  assert.doesNotMatch(html,/__(?:BUILD_VERSION|BUILD_ID|FIELD_LIVE_STATE|SHELL_MANIFEST)__/);
});
