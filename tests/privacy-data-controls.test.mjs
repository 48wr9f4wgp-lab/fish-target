import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const shell=read('app-shell-v26.js');
const css=read('visual-v26.css');
const app=read('app.js');
const continuity=read('continuity.js');
const tackle=read('tackle.js');
const photo=read('fish-photo-v27.js');

const expectedKeys=[
  'fish_target_v9','fish_target_v8','fish_target_v7','fish_target_v6','fish_target_v5',
  'fish_target_v9_checklists','fish_target_v9_events',
  'fish_target_v16_last_plan','fish_target_v16_recent','fish_target_v16_favorites',
  'fish_target_v17_tackle'
];

test('privacy controls delete only FISH TARGET owned storage after explicit confirmation',()=>{
  assert.doesNotMatch(shell,/localStorage\.clear\s*\(/,'origin-wide localStorage.clear is forbidden');
  assert.match(shell,/globalThis\.confirm\(/,'destructive local reset must require explicit confirmation');
  assert.match(shell,/localStorage\.removeItem\(/,'scoped key removal must be used');
  assert.match(shell,/ft-fish-photo-v27r3:/,'fish photo cache prefix must be included');
  for(const key of expectedKeys)assert.match(shell,new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),`${key} missing from owned-key allowlist`);
  const confirmAt=shell.indexOf('globalThis.confirm(');
  const deleteAt=shell.indexOf('removeOwnedStorage()',confirmAt);
  assert.ok(confirmAt>=0&&deleteAt>confirmAt,'confirmation must occur before destructive deletion');
});

test('owned-key allowlist covers storage used by current persistence modules',()=>{
  for(const key of ['fish_target_v9','fish_target_v8','fish_target_v7','fish_target_v6','fish_target_v5','fish_target_v9_checklists','fish_target_v9_events'])assert.match(app,new RegExp(key));
  for(const key of ['fish_target_v16_last_plan','fish_target_v16_recent','fish_target_v16_favorites'])assert.match(continuity,new RegExp(key));
  assert.match(tackle,/fish_target_v17_tackle/);
  assert.match(photo,/ft-fish-photo-v27r3:/);
});

test('privacy disclosure accurately states local storage and remaining external request boundary',()=>{
  assert.match(shell,/端末内に保存/);
  assert.match(shell,/外部Analyticsサービスへ送信しません/);
  assert.match(shell,/Wikipedia \/ Wikimedia/);
  assert.match(shell,/接続元IP/);
  assert.match(shell,/現在の公開設定ではOFF/);
  assert.match(shell,/他のサイトやアプリの保存データは削除しません/);
});

test('privacy and result navigation controls retain mobile touch-target floor',()=>{
  assert.match(css,/\.privacyPanelV26>summary\{[^}]*min-height:56px/);
  assert.match(css,/\.privacyDeleteV26\{[^}]*min-height:48px/);
  assert.match(css,/#resultRailV26 button\{[^}]*min-height:44px/);
});
