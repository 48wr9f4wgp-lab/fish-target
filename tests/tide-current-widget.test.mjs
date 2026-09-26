import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const text=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('tide current widget is wired to 24h marine data',()=>{
  const html=text('index.html');
  const app=text('app.js');
  assert.match(html,/id="tideFlow"/);
  assert.match(html,/TIDE \+ CURRENT · 24H/);
  assert.match(app,/ocean_current_velocity,ocean_current_direction,sea_level_height_msl/);
  assert.match(app,/set\('forecast_hours','24'\)/);
  assert.match(app,/function renderTideFlow\(\)/);
  assert.match(app,/renderTideFlow\(\);const marineMsg/);
});

test('tide current widget keeps tide height and current concepts separate',()=>{
  const html=text('index.html');
  const app=text('app.js');
  assert.match(html,/海面高度と潮流を同じ時間軸で表示/);
  assert.match(app,/潮止まり候補/);
  assert.match(app,/弱まり傾向/);
  assert.match(app,/動き出し傾向/);
  assert.match(app,/tideFlowLows/);
});
