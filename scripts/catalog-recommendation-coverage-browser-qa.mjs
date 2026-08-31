import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {chromium} from 'playwright';

const BASE=process.env.FISH_TARGET_QA_URL||'http://127.0.0.1:4173/dist/';
const manifest=JSON.parse(readFileSync(new URL('../catalog-batch-manifest.json',import.meta.url),'utf8'));
const EXPECTED_PRODUCTS=14+manifest.batches.reduce((n,x)=>n+Number(x.expected_rows||0),0);

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

  const coverage=await page.evaluate(()=>{
    const normalize=value=>String(value??'')
      .normalize('NFKC')
      .toLowerCase()
      .replace(/[\s·・\-_/().（）]+/g,'');
    const products=globalThis.FISH_TARGET_CATALOG_RUNTIME.products||[];
    const catalog=products.map(product=>({
      product,
      keys:[
        normalize(product.display_name),
        normalize(`${product.series||''}${product.model||''}`),
        normalize(`${product.maker||''}${product.series||''}${product.model||''}`)
      ].filter(Boolean)
    }));
    const findMatch=name=>{
      const target=normalize(name);
      if(target.length<4)return null;
      return catalog.find(entry=>entry.keys.some(key=>
        key.length>=4&&(target===key||target.includes(key)||key.includes(target))
      ))||null;
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
      const match=findMatch(row.name);
      return {
        ...row,
        matched:Boolean(match),
        product_id:match?.product?.product_id||null,
        production_eligible:match?Boolean(globalThis.FISH_TARGET_CATALOG_RUNTIME.productionEligible(match.product)):false,
        source_type:match?.product?.source?.source_type||null,
        license_status:match?.product?.source?.license_status||null
      };
    });

    const matchedNameSet=new Set(resolved.filter(x=>x.matched).map(x=>`${x.type}|${normalize(x.name)}`));
    const matchedPlanLinks=planLinks.filter(row=>matchedNameSet.has(`${row.type}|${normalize(row.name)}`)).length;
    const matched=resolved.filter(x=>x.matched);
    const unmatched=resolved.filter(x=>!x.matched);
    return {
      plans:globalThis.FISH_TARGET_METHOD_REGISTRY.count,
      catalog_products:products.length,
      plan_links:planLinks.length,
      unique_recommendations:unique.length,
      matched_unique:matched.length,
      unmatched_unique:unmatched.length,
      matched_plan_links:matchedPlanLinks,
      production_eligible_unique:matched.filter(x=>x.production_eligible).length,
      research_only_unique:matched.filter(x=>!x.production_eligible).length,
      match_rate_unique:unique.length?Number((matched.length/unique.length).toFixed(4)):0,
      match_rate_plan_links:planLinks.length?Number((matchedPlanLinks/planLinks.length).toFixed(4)):0,
      unmatched_names:unmatched.map(x=>x.name).sort(),
      matched_names:matched.map(x=>x.name).sort()
    };
  });

  assert.equal(coverage.plans,150);
  assert.equal(coverage.catalog_products,EXPECTED_PRODUCTS);
  assert.ok(coverage.plan_links>0,'legacy product recommendations must exist');
  assert.ok(coverage.unique_recommendations>0,'unique legacy product recommendations must exist');
  assert.equal(coverage.matched_unique+coverage.unmatched_unique,coverage.unique_recommendations);
  assert.ok(coverage.matched_unique>0,'coverage audit must resolve at least one legacy recommendation');
  assert.ok(coverage.matched_plan_links<=coverage.plan_links);
  assert.ok(coverage.production_eligible_unique<=coverage.matched_unique);
  assert.ok(coverage.research_only_unique<=coverage.matched_unique);
  assert.deepEqual(errors,[],'coverage browser path must not throw');
  console.log(`CATALOG RECOMMENDATION COVERAGE QA PASS ${JSON.stringify(coverage)}`);
}finally{
  await browser.close();
}
