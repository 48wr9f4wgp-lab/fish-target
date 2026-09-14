import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {collectTripReadiness,CORE_REQUIRED} from '../scripts/trip-readiness-audit-v34.mjs';

const ruleSource=readFileSync(new URL('../trip-pack-rules-v34.js',import.meta.url),'utf8');

function rulesFor(species){
  const context=vm.createContext({console,FISH_TARGET_SPECIES_REGISTRY:{resolve:()=>species}});
  context.globalThis=context;
  vm.runInContext(ruleSource,context,{filename:'trip-pack-rules-v34.js'});
  return context.FISH_TARGET_TRIP_PACK;
}

test('all 158 plans generate the core physical-preparation checklist',async()=>{
  const report=await collectTripReadiness();
  assert.equal(report.plans,158);
  assert.equal(report.core_ready,158);
  assert.equal(report.core_incomplete,0);
  assert.ok(report.required_count.min>=CORE_REQUIRED.length);
  assert.equal(report.spare_plans,158,'every plan has rig/FIRST CAST spare guidance');
  assert.equal(report.line_cutter_plans,158,'every technical plan needs a line-cutting tool recommendation');
  assert.equal(report.lure_pliers_plans,report.lure_plans,'every lure plan receives pliers guidance');
});

test('mixed-style species does not leak lure tools into a bait plan',()=>{
  const rules=rulesFor({name:'テスト魚',water:'salt',styles:['bait','lure'],tags:['回遊魚']});
  const plan={
    plan_id:'test:bait',species_name:'テスト魚',method:'ウキ釣り',style:'bait',
    requirements:{rod:'磯竿',reel:'2500番',line:'ナイロン2号',leader:'ハリス1.5号',rig:'ウキ仕掛け'},
    first_cast:{bait:'オキアミ',size:'1尾'},places:['堤防']
  };
  const ids=new Set(rules.derive(plan,{ownedSet:null}).map(item=>item.id));
  assert.equal(ids.has('handling-pliers'),false,'species-level lure support must not make this bait plan a lure plan');
  assert.equal(ids.has('handling-landing'),false,'generic 回遊魚 tag alone must not imply large-game landing gear');
  assert.equal(ids.has('handling-line-cutter'),true);
});

test('explicit large-game method still gets landing guidance',()=>{
  const rules=rulesFor({name:'大型魚',water:'salt',styles:['bait'],tags:[]});
  const plan={
    plan_id:'test:livebait',species_name:'大型魚',method:'泳がせ',style:'bait',
    requirements:{rod:'青物竿',reel:'6000番',line:'PE3号',leader:'60lb',rig:'泳がせ仕掛け'},
    first_cast:{bait:'活き餌',size:'1尾'},places:['堤防']
  };
  const ids=new Set(rules.derive(plan,{ownedSet:null}).map(item=>item.id));
  assert.equal(ids.has('handling-landing'),true);
});
