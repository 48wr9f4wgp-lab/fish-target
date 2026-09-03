import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const registry=JSON.parse(readFileSync(new URL('../authoring/recommendation-targets.v1.json',import.meta.url),'utf8'));
const normalize=value=>String(value??'').normalize('NFKC').toLowerCase().replace(/[\s·・\-_/().（）]+/g,'');
const expected=['カーディフ NX','ソアレ BB','ゾディアス','プライムサーフ T','ボーダレス BB','ライトゲーム X'];

test('series-family recommendation registry is complete, unique, and evidence-backed',()=>{
  assert.equal(registry.schema_version,1);
  assert.equal(registry.registry_id,'RECOMMENDATION-TARGETS-1');
  assert.equal(registry.verified_at,'2026-08-31');
  assert.equal(registry.targets.length,6);
  assert.deepEqual(registry.targets.map(x=>x.legacy_name).sort((a,b)=>a.localeCompare(b,'ja')),expected.sort((a,b)=>a.localeCompare(b,'ja')));
  const keys=new Set();
  for(const target of registry.targets){
    assert.equal(target.target_kind,'series_family');
    assert.equal(target.legacy_type,'ロッド');
    assert.equal(target.category,'rod');
    assert.ok(['DAIWA','SHIMANO'].includes(target.maker));
    assert.equal(target.selection_policy,'requirements_before_sku');
    assert.ok(target.official_series);
    assert.equal(Object.hasOwn(target,'model'),false,'family target must not invent a representative SKU');
    assert.equal(target.source?.source_type,'manufacturer_official');
    assert.ok(/^https:\/\/(?:www\.daiwa\.com|fish\.shimano\.com)\//.test(target.source?.source_url||''));
    const key=`${target.legacy_type}|${normalize(target.legacy_name)}`;
    assert.equal(keys.has(key),false,`duplicate recommendation target: ${target.legacy_name}`);
    keys.add(key);
  }
});
