import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const root=file=>readFileSync(new URL(`../${file}`,import.meta.url));
const text=file=>root(file).toString('utf8');
const dist=file=>readFileSync(new URL(`../dist/${file}`,import.meta.url),'utf8');
const config=JSON.parse(text('build.config.json'));

function pngDimensions(file){
  const png=root(file);
  assert.equal(png.subarray(1,4).toString(),'PNG',`${file}: PNG signature`);
  return {width:png.readUInt32BE(16),height:png.readUInt32BE(20)};
}

test('FIELD LIVE is feature-flagged off from first HTML paint',()=>{
  const html=dist('index.html');
  const style=dist('style.css');
  const app=dist('app.js');
  const fieldMode=dist('field-mode.js');
  assert.equal(config.features.fieldLive,false);
  assert.match(html,/data-field-live="off"/);
  assert.match(html,/data-feature="field-live">FIELD LIVE/);
  assert.match(html,/data-feature="field-live">LIVE AUTO ADJUST/);
  assert.match(style,/data-field-live="off"[^\n]+data-feature="field-live"[^\n]+display:none/);
  assert.match(app,/if\(!FEATURES\.fieldLive\)/);
  assert.match(app,/fetchWeather=async\(\)=>\{\}/);
  assert.match(fieldMode,/FEATURES\.fieldLive\?['"]FIELD LIVE未取得/);
  assert.match(fieldMode,/if\(FEATURES\.fieldLive&&w\)/);
});

test('manual/AUTO remains in the core FIRST CAST UI when live features are off',()=>{
  const html=dist('index.html');
  assert.equal((html.match(/id="autoReset"/g)||[]).length,1);
  assert.ok(html.indexOf('id="autoReset"')<html.indexOf('data-feature="field-live">FIELD LIVE'));
});

test('PWA PNG icons and maskable manifest entry are complete',()=>{
  assert.deepEqual(pngDimensions('apple-touch-icon.png'),{width:180,height:180});
  assert.deepEqual(pngDimensions('icon-192.png'),{width:192,height:192});
  assert.deepEqual(pngDimensions('icon-512.png'),{width:512,height:512});
  assert.deepEqual(pngDimensions('icon-maskable-512.png'),{width:512,height:512});
  const manifest=JSON.parse(dist('manifest.webmanifest'));
  assert.ok(manifest.icons.some(icon=>icon.src==='icon-192.png'&&icon.sizes==='192x192'));
  assert.ok(manifest.icons.some(icon=>icon.src==='icon-512.png'&&icon.sizes==='512x512'));
  assert.ok(manifest.icons.some(icon=>icon.src==='icon-maskable-512.png'&&icon.purpose==='maskable'));
  assert.match(dist('index.html'),new RegExp(`apple-touch-icon\\.png\\?v=${config.version.toLowerCase()}`));
});

test('current deployment policy names GitHub Pages only',()=>{
  const currentDocs=text('README.md')+'\n'+text('docs/DEPLOYMENT_POLICY.md');
  assert.doesNotMatch(currentDocs,/Vercel/i);
  assert.match(currentDocs,/GitHub Pages/);
});
