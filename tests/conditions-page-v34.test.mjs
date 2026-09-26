import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
const text=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('trip conditions is globally accessible before choosing a fish',()=>{
  const html=text('index.html'),page=text('conditions-page-v34.js'),history=text('navigation-history-v34.js'),shell=text('app-shell-v26.js');
  assert.match(html,/魚種未選択/);
  assert.match(html,/conditionsChooseFishBtn/);
  assert.match(page,/function openGlobal\(\)/);
  assert.match(page,/LIVE\.conditionsFish=null/);
  assert.match(shell,/data-app-tab="conditions"/);
  assert.match(shell,/>釣行<\/b>/);
  assert.match(history,/row\.view!=='conditions'\|\|row\.fish==null/);
});

test('fish selection is an optional overlay on the same conditions view',()=>{
  const page=text('conditions-page-v34.js'),app=text('app.js');
  assert.match(page,/function openForFish\(\)/);
  assert.match(page,/LIVE\.conditionsFish=cur/);
  assert.match(page,/fish\?'地合い候補':'釣行しやすい時間'/);
  assert.match(app,/function liveTarget\(\)/);
  assert.match(app,/if\(!liveFish\|\|liveFish\.water==='salt'\)/);
});

test('conditions extension is shipped in the offline shell',()=>{
  const pwa=text('pwa.js'),build=text('scripts/build.mjs');
  assert.match(pwa,/conditions-page-v34\.css/);
  assert.match(pwa,/conditions-page-v34\.js/);
  assert.match(build,/'conditions-page-v34\.css'/);
  assert.match(build,/'conditions-page-v34\.js'/);
});