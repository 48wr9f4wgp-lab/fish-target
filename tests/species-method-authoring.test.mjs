import assert from 'node:assert/strict';
import test from 'node:test';
import {generateRuntimeSource,toRuntimePayload,validateAuthoring} from '../scripts/species-method-authoring.mjs';

const method=(id='rock_game')=>({
  ...(id?{id}:{}),
  method:'テスト釣法',style:'lure',why:'検証用の釣法データ。',
  requirements:{rod:'8ft / M',reel:'3000番',line:'PE 1号',leader:'20lb',rig:'PE→リーダー→ルアー'},
  first_cast:{bait:'ミノー',size:'10cm',color:'ナチュラル',bait_action:'ただ巻き',range:'中層',action:'一定速',time:'朝夕'},
  steps:['場所を選ぶ','投入する','反応に合わせて調整する'],places:['堤防'],mistakes:['同じレンジだけを探る'],
  source:{provider:'TEST',url:'https://example.com/source',reviewed_at:'2026-08-30',evidence:'species-method',confidence:'A'}
});

const valid=()=>({
  version:'SPECIES-METHOD-AUTHORING-1',
  targets:[{species_id:'species-test-target',name:'テスト魚',aliases:['試験魚'],water:'salt',tags:['テスト'],difficulty:'初級',default_method:method(null),methods:[method('alt_lure')]}],
  existing:[{species:'ヒラメ',methods:[method('extra_lure')]}]
});

test('valid authoring payload passes and flattens deterministically',()=>{
  const data=valid();
  assert.deepEqual(validateAuthoring(data),[]);
  const runtime=toRuntimePayload(data);
  assert.equal(runtime.targets[0].methods[0].id,'default');
  assert.equal(runtime.targets[0].methods[0].baitAction,'ただ巻き');
  assert.equal(runtime.existing['ヒラメ'][0].id,'extra_lure');
  assert.equal(generateRuntimeSource(data),generateRuntimeSource(structuredClone(data)));
});

test('duplicate authored method ids are rejected',()=>{
  const data=valid();
  data.targets[0].methods.push(method('alt_lure'));
  assert.ok(validateAuthoring(data).some(error=>error.includes('duplicate method id')));
});

test('source and FIRST CAST completeness are hard gates',()=>{
  const data=valid();
  delete data.targets[0].default_method.source.url;
  data.targets[0].default_method.first_cast.color='';
  const errors=validateAuthoring(data);
  assert.ok(errors.some(error=>error.includes('source.url')));
  assert.ok(errors.some(error=>error.includes('first_cast.color')));
});

test('alias collisions inside new targets are rejected',()=>{
  const data=valid();
  data.targets.push({...data.targets[0],species_id:'species-test-target-2',name:'別テスト魚',aliases:['試験魚']});
  assert.ok(validateAuthoring(data).some(error=>error.includes('alias collision')));
});
