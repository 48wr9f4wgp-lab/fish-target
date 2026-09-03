import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const manifest=JSON.parse(readFileSync(new URL('../catalog-batch-manifest.json',import.meta.url),'utf8'));
const recommendationTargetRegistry=JSON.parse(readFileSync(new URL('../authoring/recommendation-targets.v1.json',import.meta.url),'utf8'));
const EXPECTED_PRODUCTS=14+manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);

assert.equal(recommendationTargetRegistry.registry_id,'RECOMMENDATION-TARGETS-1');
assert.equal(recommendationTargetRegistry.targets.length,6);

const browser=await chromium.launch({headless:true});
try{
  const page=await browser.newPage({viewport:{width:390,height:844}});
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error)));
  await page.goto(BASE,{waitUntil:'networkidle',timeout:30000});
  await page.waitForFunction(()=>Boolean(
    globalThis.FISH_TARGET_METHOD_REGISTRY?.count===150 &&
    globalThis.FISH_TARGET_CATALOG_LOADER &&
    typeof globalThis.productsForPlan==='function'
  ),{timeout:15000});

  await page.evaluate(()=>globalThis.FISH_TARGET_CATALOG_LOADER.ensureLoaded());
  await page.waitForFunction(expected=>
    globalThis.FISH_TARGET_CATALOG_LOADER?.state?.status==='ready' &&
    globalThis.FISH_TARGET_CATALOG_RUNTIME?.products?.length===expected
  ,EXPECTED_PRODUCTS,{timeout:15000});

  const coverage=await page.evaluate(recommendationTargets=>{
    const normalize=value=>String(value??'')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s·・\-_/().（）]+/g,'');

    // Explicit legacy-name aliases are evidence-backed only. These bridge the
    // current Japanese PRODUCT_DB labels to canonical manufacturer-series names
    // already present in the factual Catalog; they do not create product facts.
    const legacyAliases=new Map([
      [normalize('コルトスナイパー BB S96MH'),'COLTSNIPER BB S96MH'],
      [normalize('ナスキー 4000XG'),'NASCI 4000XG'],
      [normalize('ホリデー イソ'),'HOLIDAY ISO'],
      [normalize('ホリデー イソ 1.5-530'),'HOLIDAY ISO 1.5-530'],
      [normalize('ホリデー イソ 4-530PTS'),'HOLIDAY ISO 4-530PTS'],
      [normalize('ライトゲーム BB'),'LIGHTGAME BB'],
      [normalize('ライトゲーム BB 73MH230'),'LIGHTGAME BB 73MH230']
    ]);
    const familyTargets=new Map(recommendationTargets.map(target=>[
      `${target.legacy_type}|${normalize(target.legacy_name)}`,
      target
    ]));

    const products=globalThis.FISH_TARGET_CATALOG_RUNTIME.products||[];
    const catalog=products.map(product=>({
      product,
      keys:[
        normalize(product.display_name),
        normalize(`${product.series||''}${product.model||''}`),
        normalize(`${product.maker||''}${product.series||''}${product.model||''}`)
      ].filter(Boolean)
    }));
    const findDirectMatch=name=>{
      const target=normalize(name);
      if(target.length<4)return null;
      return catalog.find(entry=>entry.keys.some(key=>
        key.length>=4&&(target===key||target.includes(key)||key.includes(target))
      ))||null;
    };
    const findMatch=name=>{
      const direct=findDirectMatch(name);
      if(direct)return {entry:direct,match_kind:'direct',alias_target:null};
      const aliasTarget=legacyAliases.get(normalize(name));
      if(!aliasTarget)return null;
      const aliased=findDirectMatch(aliasTarget);
      return aliased?{entry:aliased,match_kind:'alias',alias_target:aliasTarget}:null;
    };

    const planLinks=[];
    for(const plan of globalThis.FISH_TARGET_METHOD_REGISTRY.records||[]){
      const recommendations=globalThis.productsForPlan({method:plan.method})||[];
      for(const rec of recommendations){
        if(!['ロッド','リール'].includes(rec?.type))continue;
        planLinks.push({
          plan_id:plan.plan_id,
          method:plan.method,
          type:rec.type,
          name:rec.name,
          brand:rec.brand||''
        });
      }
    }

    const uniqueMap=new Map();
    for(const row of planLinks){
      const key=`${row.type}|${normalize(row.name)}`;
      if(!uniqueMap.has(key))uniqueMap.set(key,row);
    }
    const unique=[...uniqueMap.values()];
    const resolved=unique.map(row=>{
      const semanticKey=`${row.type}|${normalize(row.name)}`;
      const familyTarget=familyTargets.get(semanticKey)||null;
      // Explicit family semantics take precedence over fuzzy Catalog matching so
      // future SKU growth cannot silently collapse a family recommendation to one model.
      const match=familyTarget?null:findMatch(row.name);
      const product=match?.entry?.product||null;
      return {
        ...row,
        matched:Boolean(product),
        match_kind:match?.match_kind||null,
        alias_target:match?.alias_target||null,
        product_id:product?.product_id||null,
        family_resolved:Boolean(familyTarget),
        semantic_resolved:Boolean(product||familyTarget),
        semantic_kind:familyTarget?'series_family':(match?.match_kind||null),
        family_maker:familyTarget?.maker||null,
        family_series:familyTarget?.official_series||null,
        family_source_url:familyTarget?.source?.source_url||null,
        production_eligible:product?Boolean(globalThis.FISH_TARGET_CATALOG_RUNTIME.productionEligible(product)):false,
        source_type:product?.source?.source_type||null,
        license_status:product?.source?.license_status||null
      };
    });

    const matchedNameSet=new Set(resolved.filter(x=>x.matched).map(x=>`${x.type}|${normalize(x.name)}`));
    const semanticNameSet=new Set(resolved.filter(x=>x.semantic_resolved).map(x=>`${x.type}|${normalize(x.name)}`));
    const matchedPlanLinks=planLinks.filter(row=>matchedNameSet.has(`${row.type}|${normalize(row.name)}`)).length;
    const semanticResolvedPlanLinks=planLinks.filter(row=>semanticNameSet.has(`${row.type}|${normalize(row.name)}`)).length;
    const matched=resolved.filter(x=>x.matched);
    const unmatched=resolved.filter(x=>!x.matched);
    const directMatched=matched.filter(x=>x.match_kind==='direct');
    const aliasMatched=matched.filter(x=>x.match_kind==='alias');
    const familyResolved=resolved.filter(x=>x.family_resolved);
    const semanticResolved=resolved.filter(x=>x.semantic_resolved);
    const semanticUnresolved=resolved.filter(x=>!x.semantic_resolved);
    return {
      plans:globalThis.FISH_TARGET_METHOD_REGISTRY.count,
      catalog_products:products.length,
      plan_links:planLinks.length,
      unique_recommendations:unique.length,
      matched_unique:matched.length,
      direct_matched_unique:directMatched.length,
      alias_matched_unique:aliasMatched.length,
      unmatched_unique:unmatched.length,
      matched_plan_links:matchedPlanLinks,
      family_resolved_unique:familyResolved.length,
      semantic_resolved_unique:semanticResolved.length,
      semantic_unresolved_unique:semanticUnresolved.length,
      semantic_resolved_plan_links:semanticResolvedPlanLinks,
      production_eligible_unique:matched.filter(x=>x.production_eligible).length,
      research_only_unique:matched.filter(x=>!x.production_eligible).length,
      match_rate_unique:unique.length?Number((matched.length/unique.length).toFixed(4)):0,
      match_rate_plan_links:planLinks.length?Number((matchedPlanLinks/planLinks.length).toFixed(4)):0,
      semantic_resolution_rate_unique:unique.length?Number((semanticResolved.length/unique.length).toFixed(4)):0,
      semantic_resolution_rate_plan_links:planLinks.length?Number((semanticResolvedPlanLinks/planLinks.length).toFixed(4)):0,
      alias_matches:aliasMatched.map(x=>({name:x.name,alias_target:x.alias_target})).sort((a,b)=>a.name.localeCompare(b.name,'ja')),
      family_targets:familyResolved.map(x=>({name:x.name,maker:x.family_maker,series:x.family_series,source_url:x.family_source_url})).sort((a,b)=>a.name.localeCompare(b.name,'ja')),
      unmatched_names:unmatched.map(x=>x.name).sort(),
      semantic_unresolved_names:semanticUnresolved.map(x=>x.name).sort(),
      matched_names:matched.map(x=>x.name).sort()
    };
  },recommendationTargetRegistry.targets);

  assert.equal(coverage.plans,150);
  assert.equal(coverage.catalog_products,EXPECTED_PRODUCTS);
  assert.ok(coverage.plan_links>0,'legacy product recommendations must exist');
  assert.ok(coverage.unique_recommendations>0,'unique legacy product recommendations must exist');
  assert.equal(coverage.matched_unique+coverage.unmatched_unique,coverage.unique_recommendations);
  assert.equal(coverage.direct_matched_unique+coverage.alias_matched_unique,coverage.matched_unique);
  assert.equal(coverage.alias_matches.length,coverage.alias_matched_unique);
  assert.equal(coverage.family_resolved_unique,recommendationTargetRegistry.targets.length);
  assert.equal(coverage.semantic_resolved_unique,coverage.matched_unique+coverage.family_resolved_unique);
  assert.equal(coverage.semantic_resolved_unique+coverage.semantic_unresolved_unique,coverage.unique_recommendations);
  assert.equal(coverage.semantic_unresolved_unique,0,'every legacy recommendation must resolve to an exact/alias product or explicit family target');
  assert.equal(coverage.semantic_resolved_plan_links,coverage.plan_links);
  assert.equal(coverage.semantic_resolution_rate_unique,1);
  assert.equal(coverage.semantic_resolution_rate_plan_links,1);
  assert.ok(coverage.matched_unique>0,'coverage audit must resolve at least one legacy recommendation');
  assert.ok(coverage.matched_plan_links<=coverage.plan_links);
  assert.ok(coverage.production_eligible_unique<=coverage.matched_unique);
  assert.ok(coverage.research_only_unique<=coverage.matched_unique);
  assert.deepEqual(errors,[],'coverage browser path must not throw');
  console.log(`CATALOG RECOMMENDATION COVERAGE QA PASS ${JSON.stringify(coverage)}`);
}finally{
  await browser.close();
}
