import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../resolver-engine.js',import.meta.url),'utf8');

function harness(){
  const plan=Object.freeze({
    plan_id:'species-test:default',species_id:'species-test',species_name:'テスト魚',method_id:'default',
    method:'テスト釣法',style:'lure',
    requirements:Object.freeze({rod:'9-10ft / M',reel:'4000',line:'PE 1.5号',leader:'',rig:''}),
    first_cast:Object.freeze({size:'30g'})
  });
  const species=Object.freeze({species_id:'species-test',name:'テスト魚'});
  const speciesRegistry={
    resolve:value=>value==='テスト魚'||value==='species-test'?species:null,
    runtimeFish:()=>({name:'テスト魚',style:'lure'})
  };
  const methodRegistry={
    plansForSpecies:()=>[plan],
    resolve:(value,methodId='default')=>(value==='テスト魚'||value==='species-test'||value===species)&&methodId==='default'?plan:null,
    get:id=>id===plan.plan_id?plan:null
  };
  const logic={
    rodFit:item=>({level:item.fitLevel??1,label:'rod'}),
    reelFit:item=>({level:item.fitLevel??1,label:'reel'})
  };
  const context={console,globalThis:null,FISH_TARGET_SPECIES_REGISTRY:speciesRegistry,FISH_TARGET_METHOD_REGISTRY:methodRegistry,FISH_TARGET_TACKLE_LOGIC:logic};
  context.globalThis=context;
  vm.runInNewContext(source,context,{filename:'resolver-engine.js'});
  return {resolver:context.FISH_TARGET_RESOLVER,plan};
}

function catalog(){
  const products=[
    {product_id:'rod-prod',category:'rod',display_name:'Prod Rod',fitLevel:0,source:{source_type:'internal',license_status:'internal'}},
    {product_id:'reel-research',category:'reel',display_name:'Research Reel',fitLevel:1,source:{source_type:'manufacturer_official',license_status:'restricted'}},
    {product_id:'rod-fixture',category:'rod',display_name:'Fixture Rod',fitLevel:0,source:{source_type:'synthetic',license_status:'synthetic'}}
  ];
  return {
    products,
    ownedSnapshot:product=>({id:product.product_id,fitLevel:product.fitLevel}),
    productionEligible:product=>product.source?.license_status==='internal'
  };
}

test('catalog matching is publication fail-closed by default',()=>{
  const {resolver}=harness();
  const matches=resolver.matchCatalog('テスト魚','default',{catalog:catalog()});
  assert.deepEqual(Array.from(matches,item=>item.product_id),['rod-prod']);
  assert.equal(matches[0].production_eligible,true);
  assert.equal(matches[0].research_only,false);
});

test('research catalog matching requires explicit opt-in and synthetic stays excluded',()=>{
  const {resolver}=harness();
  const matches=resolver.matchCatalog('テスト魚','default',{catalog:catalog(),includeResearch:true});
  assert.deepEqual(Array.from(matches,item=>item.product_id),['rod-prod','reel-research']);
  assert.equal(matches.find(item=>item.product_id==='reel-research')?.research_only,true);
  assert.equal(matches.some(item=>item.synthetic),false);
});

test('synthetic catalog rows require their own explicit opt-in',()=>{
  const {resolver}=harness();
  const matches=resolver.matchCatalog('テスト魚','default',{catalog:catalog(),includeResearch:true,includeSynthetic:true});
  assert.deepEqual(Array.from(matches,item=>item.product_id),['rod-prod','reel-research','rod-fixture']);
  assert.equal(matches.find(item=>item.product_id==='rod-fixture')?.synthetic,true);
});

test('legacy injected match and items APIs remain compatible',()=>{
  const {resolver,plan}=harness();
  const injected=[{id:'legacy'}];
  assert.deepEqual(Array.from(resolver.matchCatalog(plan,'default',{items:injected})),injected);
  assert.deepEqual(Array.from(resolver.matchCatalog(plan,'default',{match:()=>injected})),injected);
});
