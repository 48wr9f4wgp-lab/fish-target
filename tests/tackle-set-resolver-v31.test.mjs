import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';

const rulesSource=await readFile(new URL('../tackle-set-rules-v31.js',import.meta.url),'utf8');
const resolverSource=await readFile(new URL('../tackle-set-resolver-v31.js',import.meta.url),'utf8');

const basePlan=overrides=>({
  plan_id:'test:default',species_id:'test',species_name:'TEST',method_id:'default',method:'テスト釣法',style:'lure',
  requirements:{rod:'9〜10ft / M',reel:'4000',line:'PE 1〜2号',leader:'フロロ 25〜40lb',rig:'メタルジグ',...(overrides?.requirements||{})},
  first_cast:{bait:'メタルジグ',size:'40g',color:'',bait_action:'',range:'',action:'',time:'',...(overrides?.first_cast||{})},
  ...overrides,
  requirements:{rod:'9〜10ft / M',reel:'4000',line:'PE 1〜2号',leader:'フロロ 25〜40lb',rig:'メタルジグ',...(overrides?.requirements||{})},
  first_cast:{bait:'メタルジグ',size:'40g',color:'',bait_action:'',range:'',action:'',time:'',...(overrides?.first_cast||{})}
});

function runtime({plan=basePlan(),rodFit,reelFit}={}){
  const ctx=vm.createContext({console});
  vm.runInContext(rulesSource,ctx,{filename:'tackle-set-rules-v31.js'});
  ctx.FISH_TARGET_TACKLE_LOGIC={
    rodFit:rodFit||((item)=>({level:Number(item.fitLevel??0),label:'rod'})),
    reelFit:reelFit||((item)=>({level:Number(item.fitLevel??0),label:'reel'}))
  };
  ctx.FISH_TARGET_SPECIES_REGISTRY={runtimeFish:()=>({})};
  ctx.FISH_TARGET_RESOLVER={resolvePlan:()=>plan};
  vm.runInContext(resolverSource,ctx,{filename:'tackle-set-resolver-v31.js'});
  return {rules:ctx.FISH_TARGET_TACKLE_SET_RULES,resolver:ctx.FISH_TARGET_TACKLE_SET_RESOLVER,plan};
}

const json=value=>JSON.parse(JSON.stringify(value));

test('ideal set is returned even with no MY TACKLE inventory',()=>{
  const {resolver,plan}=runtime();
  const result=json(resolver.resolvePlan(plan,{rods:[],reels:[]}));
  assert.equal(result.idealSet.rod.raw,'9〜10ft / M');
  assert.equal(result.idealSet.reel.raw,'4000');
  assert.equal(result.myBestSet,null);
  assert.equal(result.compatibility,'incompatible');
  assert.deepEqual(result.gaps.map(g=>[g.type,g.component]),[['missing_component','rod'],['missing_component','reel']]);
});

test('one coherent owned set resolves as ideal',()=>{
  const {resolver,plan}=runtime();
  const result=json(resolver.resolvePlan(plan,{rods:[{id:'r1',name:'M ROD',power:'M',fitLevel:0}],reels:[{id:'e1',name:'4000 REEL',size:4000,fitLevel:0}]}));
  assert.equal(result.compatibility,'ideal');
  assert.equal(result.myBestSet.rod.id,'r1');
  assert.equal(result.myBestSet.reel.id,'e1');
  assert.equal(result.myBestSet.fits.pair.level,0);
  assert.deepEqual(result.gaps,[]);
});

test('combination scoring can reject individually best rod plus reel when the pair opposes target balance',()=>{
  const {resolver,plan}=runtime();
  const owned={
    rods:[
      {id:'heavy-best',name:'Heavy Best',power:'MH',fitLevel:0},
      {id:'target-sub',name:'Target Substitute',power:'M',fitLevel:1}
    ],
    reels:[
      {id:'small-best',name:'Small Best',size:3000,fitLevel:0},
      {id:'other-poor',name:'Other Poor',size:4000,fitLevel:2}
    ]
  };
  const result=json(resolver.resolvePlan(plan,owned));
  assert.notEqual(`${result.myBestSet.rod.id}+${result.myBestSet.reel.id}`,'heavy-best+small-best','independent component winners must not be blindly paired');
  assert.equal(result.myBestSet.rod.id,'target-sub');
  assert.equal(result.myBestSet.reel.id,'small-best');
  assert.equal(result.myBestSet.score,120);
});

test('conditional component is surfaced as acceptable substitution',()=>{
  const {resolver,plan}=runtime();
  const result=json(resolver.resolvePlan(plan,{rods:[{id:'r1',name:'M ROD',power:'M',fitLevel:1}],reels:[{id:'e1',name:'4000',size:4000,fitLevel:0}]}));
  assert.equal(result.compatibility,'good');
  assert.deepEqual(result.gaps,[{type:'acceptable_substitution',component:'rod',severity:1}]);
});

test('underspec rod is distinguished from generic incompatibility',()=>{
  const {resolver,plan}=runtime();
  const result=json(resolver.resolvePlan(plan,{rods:[{id:'r1',name:'Light Rod',power:'L',fitLevel:2}],reels:[{id:'e1',name:'4000',size:4000,fitLevel:0}]}));
  assert.equal(result.compatibility,'poor');
  assert.ok(result.gaps.some(g=>g.type==='underspec'&&g.component==='rod'));
});

test('major opposite rod and reel balance becomes incompatible even when component fits say ideal',()=>{
  const {resolver,plan}=runtime();
  const result=json(resolver.resolvePlan(plan,{rods:[{id:'r1',name:'Heavy Rod',power:'H',fitLevel:0}],reels:[{id:'e1',name:'Small Reel',size:3000,fitLevel:0}]}));
  assert.equal(result.myBestSet.fits.rod.level,0);
  assert.equal(result.myBestSet.fits.reel.level,0);
  assert.equal(result.myBestSet.fits.pair.level,2);
  assert.equal(result.compatibility,'incompatible');
  assert.ok(result.gaps.some(g=>g.type==='incompatible'&&g.component==='pair'));
});

test('partial MY TACKLE inventory does not throw and reports only the missing required component',()=>{
  const {resolver,plan}=runtime();
  const result=json(resolver.resolvePlan(plan,{rods:[{id:'r1',name:'M ROD',power:'M',fitLevel:0}],reels:[]}));
  assert.equal(result.myBestSet.rod.id,'r1');
  assert.equal(result.myBestSet.reel,null);
  assert.equal(result.compatibility,'incompatible');
  assert.deepEqual(result.gaps.map(g=>[g.type,g.component]),[['missing_component','reel']]);
});

test('missing optional target ranges prevent false ideal without inventing incompatibility',()=>{
  const plan=basePlan({requirements:{rod:'スピニングロッド',reel:'汎用スピニング'}});
  const {resolver}=runtime({plan});
  const result=json(resolver.resolvePlan(plan,{rods:[{id:'r1',name:'Unknown Rod',power:'M',fitLevel:0}],reels:[{id:'e1',name:'Unknown Reel',size:4000,fitLevel:0}]}));
  assert.equal(result.compatibility,'good');
  assert.ok(result.reasons.some(reason=>reason.code==='component-data-incomplete'));
});

test('resolver does not mutate owned tackle input objects',()=>{
  const {resolver,plan}=runtime();
  const owned={rods:[{id:'r1',name:'M ROD',power:'M',fitLevel:0}],reels:[{id:'e1',name:'4000',size:4000,fitLevel:0}]};
  const before=JSON.stringify(owned);
  resolver.resolvePlan(plan,owned);
  assert.equal(JSON.stringify(owned),before);
});

test('unit parsers refuse ambiguous conversions and unrelated Japanese size notation',()=>{
  const {rules}=runtime();
  assert.equal(rules.gRange('エギ3.5号'),null);
  assert.equal(rules.gRange('1oz'),null);
  assert.equal(rules.ftRange('3〜4m級'),null);
  assert.equal(rules.powerRange('3〜4m級'),null);
  assert.equal(rules.reelRange('PE 1.5号'),null);
  assert.deepEqual(json(rules.gRange('30〜50g')),{min:30,max:50});
  assert.deepEqual(json(rules.ftRange('9〜10ft / MH')),{min:9,max:10});
});