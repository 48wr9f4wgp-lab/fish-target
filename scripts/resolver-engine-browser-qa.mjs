import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_RESOLVER&&globalThis.FISH_TARGET_TACKLE_LOGIC),{timeout:15000});
  const out=await page.evaluate(()=>{
    const r=globalThis.FISH_TARGET_RESOLVER;
    const species=r.resolveSpecies('平目');
    const methods=r.resolveMethods(species);
    const plan=r.resolvePlan(species,'default');
    const first=r.resolveFirstCast(plan);
    const req=r.resolveRequirements(plan);
    const fit=r.evaluateOwnedTackle(plan,'default',{
      rods:[{name:'test rod',length:9.6,power:'M',maxLure:60}],
      reels:[{name:'test reel',size:4000,lineType:'PE',lineNo:1.5}]
    });
    const ranked=r.rankCatalogMatches([{id:'a',score:1},{id:'b',score:3},{id:'c',score:2}]);
    return {
      version:r.version,
      species:species?.name||null,
      methodCount:methods.length,
      planId:plan?.plan_id||null,
      first:!!first?.bait,
      requirements:!!req?.rod&&!!req?.reel,
      fitReady:fit?.ready,
      fitPlanId:fit?.plan_id||null,
      ranked:ranked.map(x=>x.id),
      methodTotal:globalThis.FISH_TARGET_METHOD_REGISTRY?.count
    };
  });
  assert.equal(out.version,'RESOLVER-ENGINE-1');
  assert.equal(out.species,'ヒラメ');
  assert.ok(out.methodCount>=1);
  assert.ok(out.planId?.endsWith(':default'));
  assert.equal(out.first,true);
  assert.equal(out.requirements,true);
  assert.equal(out.fitReady,true);
  assert.equal(out.fitPlanId,out.planId);
  assert.deepEqual(out.ranked,['b','c','a']);
  assert.equal(out.methodTotal,150);
  assert.deepEqual(pageErrors,[],'resolver browser path must not throw');
  console.log(`RESOLVER ENGINE BROWSER QA PASS ${JSON.stringify({species:out.species,plans:out.methodTotal})}`);
}finally{
  await browser.close();
}
