import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const manifest=JSON.parse(readFileSync(new URL('../catalog-batch-manifest.json',import.meta.url),'utf8'));
const EXPECTED_PRODUCTS=14+manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);
const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const pageErrors=[];
  page.on('pageerror',error=>pageErrors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(globalThis.FISH_TARGET_RESOLVER&&globalThis.FISH_TARGET_TACKLE_LOGIC&&globalThis.FISH_TARGET_RESOLVER_SHADOW&&globalThis.FISH_TARGET_RESOLVER_TACKLE_UI&&globalThis.FISH_TARGET_RESULT_UX_V23),{timeout:15000});
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
    const catalogBefore=globalThis.FISH_TARGET_RESOLVER_SHADOW.checkCatalog();
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
      shadow,catalogBefore,ui,
      uiSource:body?.dataset.fitSource||null,
      uiMarker:body?.querySelectorAll('[data-resolver-render-marker]').length||0,
      uiSummary:body?.querySelector('.fitV20Summary b')?.textContent||'',
      uiDetails:Boolean(body?.querySelector('.fitV20Details')),
      legacySummaryHidden:body?.querySelector('.fitSummary')?.hidden??false,
      productHtml:document.getElementById('products')?.innerHTML||'',
      fieldProductHtml:document.getElementById('fieldProducts')?.innerHTML||''
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
  assert.equal(out.catalogBefore?.version,'RESOLVER-CATALOG-SHADOW-1');
  assert.equal(out.catalogBefore?.ready,false);
  assert.equal(out.catalogBefore?.reason,'catalog-not-loaded');
  assert.equal(out.ui?.version,'RESOLVER-TACKLE-UI-2');
  assert.equal(out.ui?.ready,true);
  assert.equal(out.ui?.source,'resolver');
  assert.equal(out.ui?.plan_id,out.shadow?.plan_id);
  assert.equal(out.ui?.rod,out.shadow?.resolver_rod);
  assert.equal(out.ui?.reel,out.shadow?.resolver_reel);
  assert.equal(out.uiSource,'resolver');
  assert.equal(out.uiMarker,1);
  assert.ok(out.uiSummary.length>0);
  assert.equal(out.uiDetails,true,'resolver render preserves V20 detail UI');
  assert.equal(out.legacySummaryHidden,true,'legacy compatibility summary stays hidden');

  await page.evaluate(()=>globalThis.FISH_TARGET_CATALOG_LOADER.ensureLoaded());
  await page.waitForFunction(expected=>globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready'&&globalThis.FISH_TARGET_CATALOG_RUNTIME?.products?.length===expected,EXPECTED_PRODUCTS,{timeout:15000});
  const catalogOut=await page.evaluate(()=>{
    const status=globalThis.FISH_TARGET_RESOLVER_SHADOW.checkCatalog();
    const matches=globalThis.FISH_TARGET_RESOLVER.matchCatalog(cur.name,state.methodKey||'default',{
      catalog:globalThis.FISH_TARGET_CATALOG_RUNTIME,
      includeResearch:true,
      plan:basePlan(),
      rotation:currentRotation(basePlan())
    });
    return {
      status,
      products:globalThis.FISH_TARGET_CATALOG_RUNTIME.products.length,
      syntheticMatches:matches.filter(item=>item.synthetic).length,
      cards:[document.getElementById('products')?.innerHTML||'',document.getElementById('fieldProducts')?.innerHTML||'']
    };
  });
  assert.equal(catalogOut.products,EXPECTED_PRODUCTS);
  assert.equal(catalogOut.status?.version,'RESOLVER-CATALOG-SHADOW-1');
  assert.equal(catalogOut.status?.ready,true);
  assert.ok(catalogOut.status?.candidate_count>0);
  assert.ok(catalogOut.status?.rod);
  assert.ok(catalogOut.status?.reel);
  assert.equal(catalogOut.status?.synthetic_count,0);
  assert.equal(catalogOut.syntheticMatches,0);
  assert.deepEqual(catalogOut.cards,[out.productHtml,out.fieldProductHtml],'catalog shadow must not mutate visible product cards');
  assert.deepEqual(pageErrors,[],'resolver browser path must not throw');
  console.log(`RESOLVER ENGINE BROWSER QA PASS ${JSON.stringify({species:out.species,plans:out.methodTotal,shadow:out.shadow?.parity,ui:out.uiSource,catalog:candidateSummary(catalogOut.status)})}`);

  function candidateSummary(status){
    return {candidates:status?.candidate_count,rod:status?.rod,reel:status?.reel,research:status?.research_only_count,overlap:status?.legacy_catalog_overlap};
  }
}finally{
  await browser.close();
}
