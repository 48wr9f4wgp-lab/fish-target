import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [runtime,rules,css,tripCss,pwa,build]=await Promise.all([
  readFile(new URL('../pack-checklist-v28.js',import.meta.url),'utf8'),
  readFile(new URL('../trip-pack-rules-v34.js',import.meta.url),'utf8'),
  readFile(new URL('../game-feel-v28.css',import.meta.url),'utf8'),
  readFile(new URL('../trip-pack-v34.css',import.meta.url),'utf8'),
  readFile(new URL('../pwa.js',import.meta.url),'utf8'),
  readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8')
]);

test('TRIP READY preserves editable fallback essentials while adding contextual plan requirements',()=>{
  for(const item of ['日焼け止め','虫除け','飲み物','タオル','モバイルバッテリー','ヘッドライト / ライト','ゴミ袋','救急用品'])assert.match(runtime,new RegExp(item.replace('/','\\/')));
  assert.match(runtime,/TRIP-READY-V34/);
  assert.match(runtime,/PRIORITY_LABEL=Object\.freeze\(\{required:'必須',recommended:'推奨',optional:'任意'\}\)/);
  assert.match(runtime,/contextualConfig=/);
  assert.match(runtime,/FISH_TARGET_TRIP_PACK\?\.derive/);
  assert.match(runtime,/必須を先に確認/);
  assert.match(rules,/plan-rod/);
  assert.match(rules,/plan-reel/);
  assert.match(rules,/plan-line/);
  assert.match(rules,/plan-rig/);
  assert.match(rules,/plan-first-cast/);
});

test('TRIP READY stays optional and independently accessible instead of becoming a mandatory result step',()=>{
  assert.match(runtime,/packStandaloneV30/);
  assert.match(runtime,/appPackTabV30/);
  assert.match(runtime,/data-app-tab/);
  assert.doesNotMatch(runtime,/v19Conditions|v19Details|#result \.actions/,'packing UI must not anchor into result flow');
  assert.match(runtime,/忘れ物をまとめて確認/);
  assert.match(runtime,/今回のチェックリスト/);
});

test('TRIP READY keeps owned and packed state separate with per-plan checked storage',()=>{
  assert.match(runtime,/fish_target_v9_checklists/);
  assert.match(runtime,/quickPackSaveStatusV30/);
  assert.match(runtime,/保存できません。ブラウザの空き容量・サイトデータ設定を確認してください。/);
  assert.match(runtime,/__quick_pack_v28_config/);
  assert.match(runtime,/__quick_pack_v28_checked/);
  assert.match(runtime,/activeKey=/);
  assert.match(runtime,/planKey\?\.\(currentPlan\(\)\)/);
  assert.doesNotMatch(runtime,/checked\.add\(['"]plan-(?:rod|reel)/,'owned gear must never be auto-marked as packed');
  assert.match(runtime,/quickPackEditV28/);
  assert.match(runtime,/quickPackAddFormV28/);
  assert.match(runtime,/quickPackDeleteV28/);
  assert.match(runtime,/quickPackResetV28/);
});

test('READY requires every required generated item, not every optional personal item',()=>{
  assert.match(runtime,/required=config\.filter\(item=>item\.priority==='required'\)/);
  assert.match(runtime,/requiredDone=required\.filter\(item=>checked\.has\(item\.id\)\)\.length/);
  assert.match(runtime,/ready=required\.length>0&&requiredDone===required\.length/);
  assert.match(runtime,/TRIP READY · 必須チェック完了/);
});

test('editable labels are escaped before innerHTML rendering',()=>{
  assert.match(runtime,/escapeHtml=value/);
  assert.match(runtime,/const id=escapeHtml\(item\.id\),name=escapeHtml\(item\.name\)/);
});

test('packing surface adds no network dependency',()=>{
  assert.doesNotMatch(runtime,/\bfetch\s*\(/);
  assert.doesNotMatch(rules,/\bfetch\s*\(/);
  assert.doesNotMatch(runtime,/XMLHttpRequest/);
});

test('TRIP READY meets mobile touch and critical-type floors',()=>{
  assert.match(css,/\.quickPackItemV28\{[^}]*min-height:48px/);
  assert.match(css,/\.quickPackHeadActionsV28 button,[^\{]*\{[^}]*min-height:44px/);
  assert.match(css,/#quickPackAddFormV28 button\{[^}]*min-height:44px/);
  assert.match(tripCss,/\.tripPackTextV34 b\{font-size:14px/);
  assert.match(tripCss,/\.tripPackTextV34 small\{font-size:11px/);
  assert.match(tripCss,/\.tripPackPriorityV34\{[^}]*font-size:11px/);
});

test('standalone layout keeps four-tab shell and reduced-motion support',()=>{
  assert.match(css,/grid-template-columns:repeat\(4,1fr\)/);
  assert.match(css,/\.packStandaloneV30/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/gameFeelCastV28/);
  assert.match(css,/gameFeelGearV28/);
  assert.match(css,/quickPackReadyPulseV28/);
});

test('TRIP READY rules, runtime and styles are bootstrapped and shipped',()=>{
  assert.match(pwa,/game-feel-v28\.css/);
  assert.match(pwa,/trip-pack-v34\.css/);
  assert.match(pwa,/trip-pack-rules-v34\.js/);
  assert.match(pwa,/pack-checklist-v28\.js/);
  assert.ok(pwa.indexOf("loadScript('./trip-pack-rules-v34.js'")<pwa.indexOf("loadScript('./pack-checklist-v28.js'"),'rules must load before packing UI');
  assert.match(build,/'game-feel-v28\.css'/);
  assert.match(build,/'trip-pack-v34\.css'/);
  assert.match(build,/'trip-pack-rules-v34\.js'/);
  assert.match(build,/'pack-checklist-v28\.js'/);
});
