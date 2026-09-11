import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const pwa=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');

test('central storage guard validates all schema-sensitive persisted reads without writing',()=>{
  for(const key of ['fish_target_v17_tackle','fish_target_v9_checklists','fish_target_v16_recent','fish_target_v16_favorites','fish_target_v16_last_plan','fish_target_v9_events'])assert.match(pwa,new RegExp(key));
  assert.match(pwa,/STORAGE-READ-GUARD-V34/);
  assert.match(pwa,/recordItems/);
  assert.match(pwa,/globalThis\.storeGet=guardedStoreGet/);
  assert.doesNotMatch(pwa,/sanitizeStorageRead[\s\S]*localStorage\.setItem/,'read guard must not mutate persisted data');
});