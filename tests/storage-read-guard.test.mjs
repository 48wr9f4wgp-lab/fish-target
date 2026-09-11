import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const continuity=readFileSync(new URL('../continuity.js',import.meta.url),'utf8');
const pwa=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');

test('central storage guard validates all schema-sensitive persisted reads without writing',()=>{
  for(const key of ['fish_target_v17_tackle','fish_target_v9_checklists','fish_target_v16_recent','fish_target_v16_favorites','fish_target_v16_last_plan','fish_target_v9_events'])assert.match(continuity,new RegExp(key));
  assert.match(continuity,/STORAGE-READ-GUARD-V35/);
  assert.match(continuity,/recordItems/);
  assert.match(continuity,/storeGet=guardedStoreGet/,'guard must replace the bare global binding used by legacy readers');
  assert.match(continuity,/globalThis\.storeGet=guardedStoreGet/,'guard must also expose the same reader to globalThis consumers');
  assert.doesNotMatch(continuity,/sanitizeStorageRead[\s\S]*localStorage\.setItem/,'read guard must not mutate persisted data');
  assert.ok(pwa.indexOf("loadScript('./continuity.js'")<pwa.indexOf("loadScript('./tackle.js'"),'guarded continuity must load before MY TACKLE readers');
});
