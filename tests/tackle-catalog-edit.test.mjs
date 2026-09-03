import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

function tackleLogic(){
  const context=vm.createContext({console});
  const source=read('tackle.js').split('  const best=')[0]+'\n})();';
  vm.runInContext(source,context,{filename:'tackle.js'});
  return context.FISH_TARGET_TACKLE_LOGIC;
}

test('catalog ownership edits only change user-owned fields',()=>{
  const {applyOwnedEdit}=tackleLogic();
  const original={
    id:'r1',source:'catalog',product_id:'demo:reel:1',name:'DEMO 4000',maker:'DAIWA',series:'DEMO',model:'4000',
    size:4000,lineType:'PE',lineNo:1.5,catalog_status:'current',license_status:'synthetic',user_overrides:{}
  };
  const edited=applyOwnedEdit(original,{name:'青物用',lineType:'PE',lineNo:'2'});
  assert.equal(edited.name,'青物用');
  assert.equal(edited.lineType,'PE');
  assert.equal(edited.lineNo,2);
  assert.equal(edited.product_id,original.product_id);
  assert.equal(edited.size,4000);
  assert.equal(edited.user_overrides.nickname,'青物用');
  assert.equal(edited.user_overrides.lineNo,2);
  assert.deepEqual(original.user_overrides,{});
});

test('manual ownership is not mutated by catalog edit helper',()=>{
  const {applyOwnedEdit}=tackleLogic();
  const manual={id:'m1',source:'manual',name:'手入力',size:3000,lineType:'PE',lineNo:1};
  const edited=applyOwnedEdit(manual,{name:'変更',lineNo:2});
  assert.equal(edited.id,manual.id);
  assert.equal(edited.source,manual.source);
  assert.equal(edited.name,manual.name);
  assert.equal(edited.size,manual.size);
  assert.equal(edited.lineType,manual.lineType);
  assert.equal(edited.lineNo,manual.lineNo);
  assert.notEqual(edited,manual);
});

test('invalid reel line number becomes unspecified rather than a false numeric fit',()=>{
  const {applyOwnedEdit}=tackleLogic();
  const original={id:'r2',source:'catalog',name:'DEMO',lineType:'PE',lineNo:1,user_overrides:{}};
  const edited=applyOwnedEdit(original,{lineNo:'abc'});
  assert.equal(edited.lineNo,null);
  assert.equal(edited.user_overrides.lineNo,null);
});
