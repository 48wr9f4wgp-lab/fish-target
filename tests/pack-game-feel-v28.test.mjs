import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [runtime,css,pwa,build]=await Promise.all([
  readFile(new URL('../pack-checklist-v28.js',import.meta.url),'utf8'),
  readFile(new URL('../game-feel-v28.css',import.meta.url),'utf8'),
  readFile(new URL('../pwa.js',import.meta.url),'utf8'),
  readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8')
]);

test('packing surface ships a compact default essentials list',()=>{
  for(const item of ['日焼け止め','虫除け','飲み物','タオル','モバイルバッテリー','ヘッドライト / ライト','ゴミ袋','救急用品'])assert.match(runtime,new RegExp(item.replace('/','\\/')));
  assert.match(runtime,/PACK-STANDALONE-V30/);
});

test('packing surface is independent from fish result flow',()=>{
  assert.match(runtime,/packStandaloneV30/);
  assert.match(runtime,/appPackTabV30/);
  assert.match(runtime,/data-app-tab/);
  assert.doesNotMatch(runtime,/v19Conditions|v19Details|#result \.actions/,'packing UI must not anchor into result flow');
  assert.match(runtime,/釣行フローとは別に/);
});

test('packing surface reuses owned checklist storage and stays editable',()=>{
  assert.match(runtime,/fish_target_v9_checklists/);
  assert.match(runtime,/__quick_pack_v28_config/);
  assert.match(runtime,/__quick_pack_v28_checked/);
  assert.match(runtime,/quickPackEditV28/);
  assert.match(runtime,/quickPackAddFormV28/);
  assert.match(runtime,/quickPackDeleteV28/);
  assert.match(runtime,/quickPackResetV28/);
});

test('editable labels are escaped before innerHTML rendering',()=>{
  assert.match(runtime,/escapeHtml=value/);
  assert.match(runtime,/const id=escapeHtml\(item\.id\),name=escapeHtml\(item\.name\)/);
});

test('packing surface adds no network dependency',()=>{
  assert.doesNotMatch(runtime,/\bfetch\s*\(/);
  assert.doesNotMatch(runtime,/XMLHttpRequest/);
});

test('standalone layout keeps four-tab shell and reduced-motion support',()=>{
  assert.match(css,/grid-template-columns:repeat\(4,1fr\)/);
  assert.match(css,/\.packStandaloneV30/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/gameFeelCastV28/);
  assert.match(css,/gameFeelGearV28/);
  assert.match(css,/quickPackReadyPulseV28/);
});

test('runtime and styles are part of bootstrap and build output',()=>{
  assert.match(pwa,/game-feel-v28\.css/);
  assert.match(pwa,/pack-checklist-v28\.js/);
  assert.match(build,/'game-feel-v28\.css'/);
  assert.match(build,/'pack-checklist-v28\.js'/);
});
