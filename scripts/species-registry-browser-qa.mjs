import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {generateRuntimeSource} from './species-method-authoring.mjs';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
const method=(id=null,style='lure')=>({
  ...(id?{id}:{}),method:id?'統合テスト別釣法':'統合テストルアー',style,why:'Phase Gの経路を実ブラウザで検証するfixture。',
  requirements:{rod:'8ft / M',reel:'3000番',line:'PE 1号',leader:'20lb',rig:'PE→リーダー→ルアー'},
  first_cast:{bait:style==='bait'?'オキアミ':'ミノー',size:'10cm',color:'ナチュラル',bait_action:'ただ巻き',range:'中層',action:'一定速',time:'朝夕'},
  steps:['場所を選ぶ','投入する','反応に合わせて調整する'],places:['堤防'],mistakes:['同じレンジだけに固定する'],
  source:{provider:'TEST',url:'https://example.com/phase-g-fixture',reviewed_at:'2026-08-30',evidence:'integration-fixture',confidence:'A'}
});
const fixture={
  version:'SPECIES-METHOD-AUTHORING-1',
  targets:[{species_id:'species-pipeline-fixture',name:'パイプライン魚',aliases:['統合テスト魚'],water:'salt',shape:'small',tags:['テスト'],difficulty:'初級',season:{春:'春のfixture',夏:'夏のfixture',秋:'秋のfixture',冬:'冬のfixture'},default_method:method(),methods:[method('alt_bait','bait')]}],
  existing:[{species:'ヒラメ',methods:[method('authoring_extra')]}]
};
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_AUTHORING_STATUS&&globalThis.FISH_TARGET_SPECIES_REGISTRY&&globalThis.FISH_TARGET_METHOD_REGISTRY&&globalThis.FISH_TARGET_METHOD_STATUS),{timeout:15000});
  const snapshot=await page.evaluate(()=>{
    const authoring=globalThis.FISH_TARGET_AUTHORING_STATUS;
    const species=globalThis.FISH_TARGET_SPECIES_REGISTRY;
    const methods=globalThis.FISH_TARGET_METHOD_REGISTRY;
    const methodStatus=globalThis.FISH_TARGET_METHOD_STATUS;
    const speciesIds=species.records.map(row=>row.species_id);
    const planIds=methods.records.map(row=>row.plan_id);
    const hirame=species.resolve('平目');
    const hiramePlans=methods.plansForSpecies(hirame);
    return {
      authoringVersion:authoring.version,
      authoredTargets:authoring.authored_targets,
      authoredExisting:authoring.authored_existing,
      authoredPlans:authoring.authored_plans,
      speciesVersion:species.version,
      speciesCount:species.count,
      speciesIds,
      names:species.records.map(row=>row.name),
      speciesPlanLinks:species.records.reduce((sum,row)=>sum+row.plan_count,0),
      methodVersion:methods.version,
      methodCount:methods.count,
      planIds,
      methodPlans:methodStatus.plans,
      seabass:species.resolve('シーバス')?.name||null,
      alias:hirame?.name||null,
      hiramePlanCount:hiramePlans.length,
      hirameDefault:methods.resolve('ヒラメ','default')?.method||null,
      speciesImmutable:species.records.every(row=>Object.isFrozen(row)&&Object.isFrozen(row.aliases)&&Object.isFrozen(row.method_ids)),
      methodsImmutable:methods.records.every(row=>Object.isFrozen(row)&&Object.isFrozen(row.requirements)&&Object.isFrozen(row.first_cast)&&Object.isFrozen(row.steps)&&Object.isFrozen(row.places)&&Object.isFrozen(row.mistakes)&&Object.isFrozen(row.source))
    };
  });
  assert.equal(snapshot.authoringVersion,'SPECIES-METHOD-AUTHORING-RUNTIME-1');
  assert.equal(snapshot.authoredTargets,0,'Phase G baseline adds no new species');
  assert.equal(snapshot.authoredExisting,0,'Phase G baseline adds no new methods');
  assert.equal(snapshot.authoredPlans,0,'Phase G baseline preserves current plan count');
  assert.equal(snapshot.speciesVersion,'SPECIES-REGISTRY-1');
  assert.equal(snapshot.speciesCount,60,'registry tracks every current target');
  assert.equal(new Set(snapshot.speciesIds).size,60,'species IDs are unique');
  assert.equal(new Set(snapshot.names).size,60,'species names are unique');
  assert.equal(snapshot.speciesPlanLinks,150,'species plan links stay synchronized with TARGET4');
  assert.equal(snapshot.methodVersion,'METHOD-REGISTRY-1');
  assert.equal(snapshot.methodCount,150,'method registry tracks every current plan');
  assert.equal(new Set(snapshot.planIds).size,150,'plan IDs are globally unique');
  assert.equal(snapshot.methodPlans,150,'method controller remains at 150 plans');
  assert.equal(snapshot.seabass,'シーバス');
  assert.equal(snapshot.alias,'ヒラメ');
  assert.ok(snapshot.hiramePlanCount>=1,'species lookup returns method plans');
  assert.ok(snapshot.hirameDefault,'default plan resolves by species and method id');
  assert.equal(snapshot.speciesImmutable,true,'species records are immutable read models');
  assert.equal(snapshot.methodsImmutable,true,'method records are immutable read models');
  assert.deepEqual(pageErrors,[],'domain registry browser path must not throw');
  await page.close();

  const fixturePage=await browser.newPage({viewport:{width:390,height:844}});
  const fixtureErrors=[];
  fixturePage.on('pageerror',error=>fixtureErrors.push(String(error)));
  await fixturePage.route('**/species-method-authoring-generated.js*',route=>route.fulfill({status:200,contentType:'application/javascript',body:generateRuntimeSource(fixture)}));
  await fixturePage.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await fixturePage.waitForFunction(()=>globalThis.FISH_TARGET_AUTHORING_STATUS?.authored_targets===1&&globalThis.FISH_TARGET_SPECIES_REGISTRY?.count===61&&globalThis.FISH_TARGET_METHOD_REGISTRY?.count===153,{timeout:15000});
  const integrated=await fixturePage.evaluate(()=>{
    const authoring=globalThis.FISH_TARGET_AUTHORING_STATUS;
    const species=globalThis.FISH_TARGET_SPECIES_REGISTRY;
    const methods=globalThis.FISH_TARGET_METHOD_REGISTRY;
    const resolver=globalThis.FISH_TARGET_RESOLVER;
    const pipeline=species.resolve('統合テスト魚');
    return {
      authoredTargets:authoring.authored_targets,
      authoredExisting:authoring.authored_existing,
      authoredPlans:authoring.authored_plans,
      speciesCount:species.count,
      methodCount:methods.count,
      controllerPlans:globalThis.FISH_TARGET_METHOD_STATUS?.plans,
      alias:pipeline?.name||null,
      speciesId:pipeline?.species_id||null,
      planCount:methods.plansForSpecies(pipeline).length,
      defaultMethod:methods.resolve('パイプライン魚','default')?.method||null,
      altMethod:methods.resolve('パイプライン魚','alt_bait')?.method||null,
      existingMethod:methods.resolve('ヒラメ','authoring_extra')?.method||null,
      resolverMethods:resolver.resolveMethods('統合テスト魚').length,
      gridCard:Boolean(document.querySelector('button.fish[data-fish="パイプライン魚"]'))
    };
  });
  assert.equal(integrated.authoredTargets,1);
  assert.equal(integrated.authoredExisting,1);
  assert.equal(integrated.authoredPlans,3);
  assert.equal(integrated.speciesCount,61,'fixture target reaches Species Registry');
  assert.equal(integrated.methodCount,153,'fixture plans reach Method Registry');
  assert.equal(integrated.controllerPlans,153,'fixture plans reach method controller');
  assert.equal(integrated.alias,'パイプライン魚','authored alias resolves');
  assert.equal(integrated.speciesId,'species-pipeline-fixture','explicit authored species_id is preserved');
  assert.equal(integrated.planCount,2,'new target owns default and alternate plans');
  assert.equal(integrated.defaultMethod,'統合テストルアー');
  assert.equal(integrated.altMethod,'統合テスト別釣法');
  assert.equal(integrated.existingMethod,'統合テスト別釣法','existing target receives authored method');
  assert.equal(integrated.resolverMethods,2,'Resolver sees authored target methods');
  assert.equal(integrated.gridCard,true,'authored target reaches home discovery UI');
  assert.deepEqual(fixtureErrors,[],'authored fixture browser path must not throw');
  await fixturePage.close();
  console.log(`DOMAIN REGISTRY BROWSER QA PASS ${JSON.stringify({species:snapshot.speciesCount,plans:snapshot.methodCount,authoring:snapshot.authoringVersion,fixtureSpecies:integrated.speciesCount,fixturePlans:integrated.methodCount})}`);
}finally{
  await browser.close();
}
