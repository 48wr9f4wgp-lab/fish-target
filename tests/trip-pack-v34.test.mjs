import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../trip-pack-rules-v34.js',import.meta.url),'utf8');

function runtime(species={water:'salt',styles:[],tags:[]}){
  const normalized=typeof species==='string'?{water:species,styles:[],tags:[]}:species;
  const context=vm.createContext({console,FISH_TARGET_SPECIES_REGISTRY:{resolve:name=>name?{name,...normalized}:null}});
  vm.runInContext(source,context,{filename:'trip-pack-rules-v34.js'});
  return context.FISH_TARGET_TRIP_PACK;
}

test('trip pack derives the complete technical carry set from a plan',()=>{
  const rules=runtime({water:'salt',styles:['lure'],tags:['青物','回遊魚']});
  const plan={
    plan_id:'species-test:boat',species_name:'テスト魚',method:'船ジギング',
    requirements:{rod:'6ft MH',reel:'5000番',line:'PE2号',leader:'40lb',rig:'メタルジグ'},
    first_cast:{bait:'メタルジグ',size:'80g',time:'夜'},places:['船']
  };
  const items=rules.derive(plan,{ownedSet:{rod:{name:'OWNED ROD'},reel:{name:'OWNED REEL'}}});
  const byId=id=>items.find(item=>item.id===id);
  assert.match(byId('plan-rod').name,/OWNED ROD/);
  assert.match(byId('plan-reel').name,/OWNED REEL/);
  assert.equal(byId('plan-line').priority,'required');
  assert.equal(byId('plan-leader').priority,'required');
  assert.equal(byId('plan-rig').priority,'required');
  assert.match(byId('plan-first-cast').name,/メタルジグ/);
  assert.equal(byId('handling-line-cutter').priority,'recommended');
  assert.equal(byId('handling-pliers').priority,'recommended');
  assert.equal(byId('handling-landing').priority,'recommended');
  assert.equal(byId('safety-lifejacket').priority,'required');
  assert.equal(byId('condition-light').priority,'required');
  assert.equal(byId('condition-light').safetyCritical,true);
  assert.equal(rules.planKey(plan),'pack:species-test:boat');
});

test('bluefish shore jigging includes handling tools without treating every possible place as confirmed context',()=>{
  const rules=runtime({water:'salt',styles:['lure'],tags:['青物','回遊魚']});
  const plan={
    plan_id:'species-bluefish:default',species_name:'ブリ・ワラサ',method:'ショアジギング',
    requirements:{rod:'9.6〜10.6ft / MH〜H',reel:'4000〜6000番 / HG',line:'PE 1.5〜2.5号',leader:'30〜50lb',rig:'PE→リーダー→スプリットリング→メタルジグ'},
    first_cast:{bait:'メタルジグ',size:'40〜80g',time:'朝夕まずめ'},places:['堤防','磯','サーフ']
  };
  const items=rules.derive(plan,{ownedSet:null});
  const byId=id=>items.find(item=>item.id===id);
  for(const id of ['plan-rod','plan-reel','plan-line','plan-leader','plan-rig','plan-first-cast'])assert.equal(byId(id).priority,'required',`${id} remains a technical trip requirement`);
  assert.equal(byId('handling-line-cutter').priority,'recommended');
  assert.equal(byId('handling-pliers').priority,'recommended');
  assert.equal(byId('handling-landing').priority,'recommended','landing method depends on the actual shore position');
  assert.equal(byId('safety-lifejacket').priority,'recommended','磯 is only one possible place, not confirmed current context');
  assert.equal(byId('safety-footwear').priority,'recommended');
  assert.equal(byId('condition-light').priority,'recommended','dawn/dusk plan suggests but does not force a light');
});

test('standalone packing stays usable without a selected plan',()=>{
  const rules=runtime({water:'fresh',styles:[],tags:[]});
  const items=rules.derive(null,{ownedSet:null});
  assert.ok(items.some(item=>item.id==='prep-drink'));
  assert.ok(items.some(item=>item.id==='prep-firstaid'));
  assert.equal(items.some(item=>item.priority==='required'),false);
  assert.equal(rules.planKey(null),'pack:standalone');
});

test('owned tackle selection changes labels but never marks anything packed',()=>{
  const rules=runtime({water:'salt',styles:['lure'],tags:[]});
  const plan={plan_id:'p:1',species_name:'魚',method:'ルアー',requirements:{rod:'M',reel:'3000'},first_cast:{bait:'ミノー',size:'100mm'}};
  const items=rules.derive(plan,{ownedSet:{rod:{name:'MY ROD'},reel:{name:'MY REEL'}}});
  assert.match(items.find(item=>item.id==='plan-rod').name,/MY ROD/);
  assert.equal(items.some(item=>'checked' in item),false,'rules must describe requirements, not auto-check physical packing state');
});
