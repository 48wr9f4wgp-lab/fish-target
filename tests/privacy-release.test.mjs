import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const text=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const dist=file=>readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8');
const config=JSON.parse(text('build.config.json'));

test('RC0 has no third-party executable/resource tags in the app shell',()=>{
  const html=dist('index.html');
  assert.doesNotMatch(html,/<script[^>]+src=["']https?:\/\//i);
  assert.doesNotMatch(html,/<link[^>]+href=["']https?:\/\//i);
  assert.doesNotMatch(html,/<img[^>]+src=["']https?:\/\//i);
});

test('analytics events remain local-only in RC0',()=>{
  const app=dist('app.js');
  const pwa=dist('pwa.js');
  assert.match(app,/fish_target_v9_events/);
  assert.match(app,/function track\(name,props=\{\}\).*storeSet/s);
  assert.doesNotMatch(app+pwa,/sendBeacon\s*\(/);
  assert.doesNotMatch(app+pwa,/google-analytics|googletagmanager|segment\.com|mixpanel|amplitude/i);
});

test('network-backed FIELD LIVE is preview-enabled while publication builds force it off',()=>{
  const app=dist('app.js');
  const html=dist('index.html');
  const build=text('scripts/build.mjs');
  assert.equal(config.features.fieldLive,true);
  assert.match(html,/data-field-live="on"/);
  assert.match(build,/const fieldLiveEnabled=config\.features\.fieldLive&&!publicationBuild/);
  assert.match(app,/if\(!FEATURES\.fieldLive\)/);
  assert.match(app,/fetchWeather=async\(\)=>\{\}/);
  assert.match(app,/searchSpot=async\(\)=>\{\}/);
});
