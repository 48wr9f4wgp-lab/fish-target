import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';

const source=await readFile(new URL('../catalog.js',import.meta.url),'utf8');

function rows(count){
  return Array.from({length:count},(_,i)=>{
    const maker=i%2===0?'DAIWA':'SHIMANO';
    const category=i%3===0?'reel':'rod';
    const series=`S${i%80}`;
    const model=`M${String(i).padStart(5,'0')}`;
    return {
      maker,category,series,generation:'scale',model,
      display_name:`${maker} ${series} ${model}`,
      status:i%97===0?'discontinued':'current',
      specs:category==='rod'
        ?{length_ft:8+(i%30)/10,power:['L','ML','M','MH'][i%4],lure_min_g:5,lure_max_g:20+(i%100),line_pe_min:.6,line_pe_max:2.5}
        :{reel_size:2500+(i%8)*500,gear_ratio:5+(i%15)/10,max_drag_kg:7+(i%10)},
      source:{source_type:'synthetic',source_provider:'scale-qa',source_url:null,retrieved_at:'2026-08-27',last_verified:'2026-08-27',license_status:'synthetic'}
    };
  });
}

async function stage(count){
  const sandbox={
    console:{warn:()=>{}},
    FISH_TARGET_CATALOG_FIXTURES:rows(count),
    FISH_TARGET_CATALOG_PROVIDERS:{byMaker:()=>({productionEnabled:false}),canPublish:()=>false}
  };
  sandbox.globalThis=sandbox;
  const heapBefore=process.memoryUsage().heapUsed;
  const t0=performance.now();
  vm.runInNewContext(source,sandbox,{filename:'catalog.js'});
  const initMs=performance.now()-t0;
  const catalog=sandbox.FISH_TARGET_CATALOG;
  assert.ok(catalog,'catalog initialized');
  assert.equal(catalog.products.length,count,`${count}: product count`);

  const t1=performance.now();
  const index=catalog.index({category:'rod'});
  const indexMs=performance.now()-t1;
  assert.ok(index.total>0,`${count}: rod index`);

  const needle=`M${String(count-1).padStart(5,'0')}`;
  const t2=performance.now();
  const search=catalog.search({query:needle,limit:20});
  const searchMs=performance.now()-t2;
  assert.equal(search.total,1,`${count}: exact search result`);

  const t3=performance.now();
  const page=await catalog.loadPage({maker:'DAIWA',category:'rod',limit:100,offset:100});
  const loadPageMs=performance.now()-t3;
  assert.ok(page.items.length>0,`${count}: paged load`);

  const t4=performance.now();
  for(let i=0;i<100;i++)catalog.seriesFor(i%2===0?'DAIWA':'SHIMANO',i%3===0?'reel':'rod');
  const selector100Ms=performance.now()-t4;

  const t5=performance.now();
  for(let i=0;i<100;i++)catalog.search({query:`M${String((i*83)%count).padStart(5,'0')}`,limit:20});
  const search100Ms=performance.now()-t5;
  const heapDelta=Math.max(0,process.memoryUsage().heapUsed-heapBefore);

  // Very generous hard ceilings: catch pathological regressions without making CI timing-flaky.
  assert.ok(initMs<5000,`${count}: init too slow ${initMs.toFixed(1)}ms`);
  assert.ok(indexMs<1500,`${count}: index too slow ${indexMs.toFixed(1)}ms`);
  assert.ok(searchMs<1000,`${count}: search too slow ${searchMs.toFixed(1)}ms`);
  assert.ok(loadPageMs<1000,`${count}: loadPage too slow ${loadPageMs.toFixed(1)}ms`);

  const result={count,initMs,indexMs,searchMs,loadPageMs,selector100Ms,search100Ms,heapDeltaBytes:heapDelta};
  console.log(`SCALE ${count} ${JSON.stringify(Object.fromEntries(Object.entries(result).map(([k,v])=>[k,typeof v==='number'&&k.endsWith('Ms')?Number(v.toFixed(2)):v])))}`);
  return result;
}

const results=[];
for(const count of [1000,5000,10000])results.push(await stage(count));
assert.ok(results[2].search100Ms<5000,'10k repeated search remains interactively bounded');
console.log('CATALOG SCALE QA PASS');
