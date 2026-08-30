import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_RESOLVER&&globalThis.FISH_TARGET_TACKLE_LOGIC&&globalThis.FISH_TARGET_RESOLVER_SHADOW&&globalThis.FISH_TARGET_RESOLVER_TACKLE_UI),{timeout:15000});
  const out=await page.evaluate(()=>{
    const r=globalThis.FISH_TARGET_RESOLVER;
    const species=r.resolveSpecies('平目');
    const methods=r.resolveMethods(species);
    const plan=r.resolvePlan(species,'default');
    const first=r.resolveFirstCast(plan);
    const req=r.resolveRequirements(plan);
    const owned={
      rods:[{id:'shadow-rod',name:'test rod',length:9.6,power:'M',maxLure:60}],
      reels:[{id:'shadow-reel',name:'test reel',size:4000,lineType:'PE',lineNo:1.5}]
    };
    const fit=r.evaluateOwnedTackle(plan,'default',owned);
    const ranked=r.rankCatalogMatches([{id:'a',score:1},{id:'b',score:3},{id:'c',score:2}]);
    localStorage.setItem('fish_target_v17_tackle',JSON.stringify(owned));
    const runtimeFish=globalThis.FISH_TARGET_SPECIES_REGISTRY.runtimeFish(species);
    openFish(runtimeFish);
    state.goal='大物狙い';
    state.methodKey='default';
    state.rotation=0;
    state.rotationManual=false;
    renderResult();
    const shadow=globalThis.FISH_TARGET_RESOLVER_SHADOW.check();
    const ui=globalThis.FISH_TARGET_RESOLVER_TACKLE_UI.render();
    const body=document.getElementById('tackleFitBody');
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
      methodTotal:globalThis.FISH_TARGET_METHOD_REGISTRY?.count,
      shadow,ui,
      uiSource:body?.dataset.fitSource||null,
      uiMarker:body?.querySelectorAll('[data-resolver-render-marker]').length||0,
      uiSummary:body?.querySelector('.fitSummary b')?.textContent||'',
      breakdown:Boolean(body?.querySelector('#fitBreakdown'))
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
  assert.equal(out.shadow?.version,'RESOLVER-SHADOW-1');
  assert.equal(out.shadow?.ready,true);
  assert.equal(out.shadow?.parity,true);
  assert.equal(out.shadow?.rod_parity,true);
  assert.equal(out.shadow?.reel_parity,true);
  assert.ok(out.shadow?.plan_id?.endsWith(':default'));
  assert.equal(out.ui?.version,'RESOLVER-TACKLE-UI-1');
  assert.equal(out.ui?.ready,true);
  assert.equal(out.ui?.source,'resolver');
  assert.equal(out.ui?.plan_id,out.shadow?.plan_id);
  assert.equal(out.ui?.rod,out.shadow?.resolver_rod);
  assert.equal(out.ui?.reel,out.shadow?.resolver_reel);
  assert.equal(out.uiSource,'resolver');
  assert.equal(out.uiMarker,1);
  assert.ok(out.uiSummary.length>0);
  assert.equal(out.breakdown,false,'direct resolver render owns base fit before explanation layer appends');
  assert.deepEqual(pageErrors,[],'resolver browser path must not throw');
  console.log(`RESOLVER ENGINE BROWSER QA PASS ${JSON.stringify({species:out.species,plans:out.methodTotal,shadow:out.shadow?.parity,ui:out.uiSource})}`);
}finally{
  await browser.close();
}
