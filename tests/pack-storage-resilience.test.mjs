import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../pack-checklist-v28.js',import.meta.url),'utf8');
// Exercise the actual private storage functions without a synthetic DOM implementation.
const storageSource=source.slice(0,source.indexOf('  function syncPackTab'))+
  'globalThis.storageTest={getConfig,getChecked,saveConfig,saveChecked};})();';
function runtime(raw){
  const ctx=vm.createContext({console,localStorage:{getItem:()=>raw,setItem:(_,value)=>{raw=value}}});
  vm.runInContext(storageSource,ctx);
  return {api:ctx.storageTest,raw:()=>raw};
}
for(const raw of ['null','42','true','"text"','[]','{broken']){
  test(`packing recovers from invalid root ${raw} without auto-writing`,()=>{
    const {api,raw:stored}=runtime(raw);
    assert.equal(api.getConfig().length,8);
    assert.equal(api.getChecked().size,0);
    assert.equal(stored(),raw);
    api.saveChecked(new Set(['sun']));
    assert.equal(api.getChecked().has('sun'),true);
  });
}
test('packing writes preserve unrelated checklist entries',()=>{
  const {api,raw}=runtime(JSON.stringify({existingPlan:['keep']}));
  api.saveConfig([{id:'custom',name:'Custom'}]);
  assert.deepEqual(JSON.parse(raw()).existingPlan,['keep']);
});
