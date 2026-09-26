import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../lure-catalog-loader.js',import.meta.url),'utf8');
test('lure candidate order follows the manifest when shards finish in reverse order',async()=>{
  const batches=['first','second'].map(id=>({id,file:`${id}.js`,stage:'research',targets:['ヒラメ']}));
  const scripts=[];
  const context=vm.createContext({
    document:{documentElement:{dataset:{lureCatalogRuntime:'on'}},createElement:()=>({}),head:{appendChild:script=>scripts.push(script)}},
    fetch:async()=>({ok:true,json:async()=>({batches})}),
    FISH_TARGET_LURE_CATALOG_BATCH_ROWS:[{id:'unlisted',rows:[{display_name:'unlisted',targets:['ヒラメ']}]}]
  });
  vm.runInContext(source,context);
  const pending=context.FISH_TARGET_LURE_CATALOG.rowsFor('ヒラメ','サーフルアー');
  await new Promise(resolve=>setImmediate(resolve));
  assert.deepEqual(scripts.map(script=>script.src),['first.js','second.js']);
  for(const id of ['second','first']){
    context.FISH_TARGET_LURE_CATALOG_BATCH_ROWS.push({id,rows:[
      {display_name:`${id}-21`,targets:['ヒラメ'],methods:['サーフルアー']},
      {display_name:`${id}-28`,targets:['ヒラメ'],methods:['サーフルアー']},
      {display_name:'other method',targets:['ヒラメ'],methods:['別釣法']}
    ]});
    scripts.find(script=>script.src===`${id}.js`).onload();
  }
  const expected=['first-21','first-28','second-21','second-28'];
  assert.deepEqual(Array.from(await pending,row=>row.display_name),expected);
  assert.deepEqual(Array.from(await context.FISH_TARGET_LURE_CATALOG.rowsFor('ヒラメ','サーフルアー'),row=>row.display_name),expected);
  assert.equal(scripts.length,2,'cached shards are not loaded twice');
});
