import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const text=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('tide current widget is wired to 24h marine data',()=>{
  const html=text('index.html');
  const app=text('app.js');
  assert.match(html,/id="tideFlow"/);
  assert.match(html,/id="tideNow"/);
  assert.match(html,/id="tideNextSlack"/);
  assert.match(html,/id="tideBiteWindow"/);
  assert.match(html,/潮流 \+ タイドグラフ · 24H/);
  assert.match(app,/ocean_current_velocity,ocean_current_direction,sea_level_height_msl/);
  assert.match(app,/set\('forecast_hours','24'\)/);
  assert.match(app,/function renderTideFlow\(\)/);
  assert.match(app,/function tideLevelTrendLabel\(values\)/);
  assert.match(app,/function tideBiteCandidate\(p,times,vel\)/);
  assert.match(app,/class="biteBand"/);
  assert.match(app,/class="nowLine"/);
  assert.match(app,/NEXT SLACK|nextSlack/);
  assert.match(app,/潮位 上げ/);
  assert.match(app,/潮位 下げ/);
  assert.match(app,/target\?\.water==='fresh'/);
  assert.match(app,/function liveTarget\(\)/);
  assert.match(app,/renderTideFlow\(\);const marineMsg/);
});

test('tide current widget keeps tide height and current concepts separate',()=>{
  const html=text('index.html');
  const app=text('app.js');
  assert.match(html,/潮汐込み海面高度と潮流を同じ時間軸で表示/);
  assert.match(app,/潮止まり候補/);
  assert.match(app,/弱まり傾向/);
  assert.match(app,/動き出し傾向/);
  assert.match(app,/tideFlowLows/);
  assert.match(app,/満潮\/干潮とは別判定/);
  assert.match(app,/const liveCurrent=Number\(LIVE\.marine\?\.current\)/);
  assert.match(app,/地合い候補は魚の基本時間帯と気象・海況の重なりを使う目安/);
});
