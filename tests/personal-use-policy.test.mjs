import assert from 'node:assert/strict';
import test from 'node:test';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
test('FISH TARGET retains the explicit owner-only personal product decision',()=>{
  const {productIntent}=JSON.parse(read('build.config.json'));
  assert.deepEqual(productIntent,{status:'LOCKED',decidedAt:'2026-09-27',use:'personal',audience:'owner-only',generalDistribution:false,appStore:false,monetization:false,multiUser:false});
});
test('maintainer and entry documentation point to the same scope lock',()=>{
  for(const path of ['AGENTS.md','README.md'])assert.ok(read(path).includes('docs/PERSONAL_USE_LOCK_2026-09-27.md'));
  const decision=read('docs/PERSONAL_USE_LOCK_2026-09-27.md');
  assert.ok(decision.includes('認証・アクセス制限を追加するものではない'));
  assert.ok(decision.includes('物理iPhone'));
});
