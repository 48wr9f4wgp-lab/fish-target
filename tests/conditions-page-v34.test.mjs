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
test('trip conditions V35 uses a dashboard-first one-glance hierarchy',()=>{
  const html=text('index.html'),page=text('conditions-page-v34.js'),css=text('conditions-page-v34.css');
  for(const id of ['tripDashboardV35','tripDashPlaceV35','tripDashLevelV35','tripDashTurnTimeV35','tripDashGraphV35','tripDashWeatherV35','tripDashWindV35','tripDashWaveV35','tripDashTempV35','conditionsDetailsV35'])assert.match(html,new RegExp(`id="${id}"`));
  assert.match(page,/function tideTurns\(times,levels,nowIndex=0\)/);
  assert.match(page,/function renderDashboardGraph\(\)/);
  assert.match(page,/function syncDashboard\(\)/);
  assert.match(page,/conditionsLocationMountV35/);
  assert.match(css,/\.tripDashboardV35\{/);
  assert.match(css,/\.tripDashMiniV35\{/);
  assert.match(css,/\.conditionsDetailsV35\{/);
});

test('trip dashboard V36 collapses location controls and uses human-readable field verdicts',()=>{
  const html=text('index.html'),page=text('conditions-page-v34.js'),css=text('conditions-page-v34.css');
  assert.match(html,/id="conditionsLocationEditV36"/);
  assert.match(page,/function humanVerdict\(fit\)/);
  assert.match(page,/dashboardNowIndex/);
  assert.match(page,/tripDashTurnMarkV35/);
  assert.match(page,/t\.kind/);
  assert.match(css,/\.conditionsLocationV35\.is-selected:not\(\.is-editing\)/);
  assert.match(css,/\.tripDashTurnMarkV35\.high/);
  assert.match(css,/\.tripDashTurnMarkV35\.low/);
});

test('trip dashboard V37 exposes a slack-watch window without claiming catch probability',()=>{
  const html=text('index.html'),page=text('conditions-page-v34.js'),css=text('conditions-page-v34.css');
  assert.match(html,/id="tripDashSlackLabelV37"/);
  assert.match(html,/id="tripDashSlackSubV37"/);
  assert.match(page,/function slackWatchWindow\(times,velocities,nowIndex=0\)/);
  assert.match(page,/slack:v<=0\.6/);
  assert.match(page,/弱まり→止まり→動き出し/);
  assert.match(css,/\.tripDashSlackBandV37/);
  assert.match(css,/\.tripDashSlackCenterV37/);
  assert.doesNotMatch(page,/潮止まり.*釣れる/);
});
