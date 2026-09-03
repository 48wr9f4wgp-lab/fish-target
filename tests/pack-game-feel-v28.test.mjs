import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [runtime,css,pwa,build]=await Promise.all([
  readFile(new URL('../pack-checklist-v28.js',import.meta.url),'utf8'),
  readFile(new URL('../game-feel-v28.css',import.meta.url),'utf8'),
  readFile(new URL('../pwa.js',import.meta.url),'utf8'),
  readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8')
]);

test('quick pack ships a compact default essentials list',()=>{
  for(const item of ['日焼け止め','虫除け','飲み物','タオル','モバイルバッテリー','ヘッドライト / ライト','ゴミ袋','救急用品'])assert.match(runtime,new RegExp(item.replace('/','\\/')));
  assert.match(runtime,/QUICK-PACK-V28/);
});

test('quick pack reuses owned checklist storage and stays editable',()=>{
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

test('quick pack adds no network dependency',()=>{
  assert.doesNotMatch(runtime,/\bfetch\s*\(/);
  assert.doesNotMatch(runtime,/XMLHttpRequest/);
});

test('game feel respects reduced motion and uses focused feedback',()=>{
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
