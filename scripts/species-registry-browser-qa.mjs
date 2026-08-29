import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_SPECIES_REGISTRY&&globalThis.FISH_TARGET_METHOD_REGISTRY&&globalThis.FISH_TARGET_METHOD_STATUS),{timeout:15000});
  const snapshot=await page.evaluate(()=>{
    const species=globalThis.FISH_TARGET_SPECIES_REGISTRY;
    const methods=globalThis.FISH_TARGET_METHOD_REGISTRY;
    const methodStatus=globalThis.FISH_TARGET_METHOD_STATUS;
    const speciesIds=species.records.map(row=>row.species_id);
    const planIds=methods.records.map(row=>row.plan_id);
    const hirame=species.resolve('平目');
    const hiramePlans=methods.plansForSpecies(hirame);
    return {
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
  console.log(`DOMAIN REGISTRY BROWSER QA PASS ${JSON.stringify({species:snapshot.speciesCount,plans:snapshot.methodCount})}`);
}finally{
  await browser.close();
}
