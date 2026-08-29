import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_SPECIES_REGISTRY&&globalThis.FISH_TARGET_METHOD_STATUS),{timeout:15000});
  const snapshot=await page.evaluate(()=>{
    const registry=globalThis.FISH_TARGET_SPECIES_REGISTRY;
    const methodStatus=globalThis.FISH_TARGET_METHOD_STATUS;
    const ids=registry.records.map(row=>row.species_id);
    return {
      version:registry.version,
      count:registry.count,
      ids,
      names:registry.records.map(row=>row.name),
      plans:registry.records.reduce((sum,row)=>sum+row.plan_count,0),
      methodPlans:methodStatus.plans,
      seabass:registry.resolve('シーバス')?.name||null,
      alias:registry.resolve('平目')?.name||null,
      immutable:registry.records.every(row=>Object.isFrozen(row)&&Object.isFrozen(row.aliases)&&Object.isFrozen(row.method_ids))
    };
  });
  assert.equal(snapshot.version,'SPECIES-REGISTRY-1');
  assert.equal(snapshot.count,60,'registry tracks every current target');
  assert.equal(new Set(snapshot.ids).size,60,'species IDs are unique');
  assert.equal(new Set(snapshot.names).size,60,'species names are unique');
  assert.equal(snapshot.plans,150,'registry plan links stay synchronized with TARGET4');
  assert.equal(snapshot.methodPlans,150,'method controller remains at 150 plans');
  assert.equal(snapshot.seabass,'シーバス');
  assert.equal(snapshot.alias,'ヒラメ');
  assert.equal(snapshot.immutable,true,'registry records are immutable read models');
  assert.deepEqual(pageErrors,[],'species registry browser path must not throw');
  console.log(`SPECIES REGISTRY BROWSER QA PASS ${JSON.stringify({count:snapshot.count,plans:snapshot.plans})}`);
}finally{
  await browser.close();
}
