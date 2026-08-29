import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [css,pwa,config]=await Promise.all([
  readFile(new URL('../pwa.css',import.meta.url),'utf8'),
  readFile(new URL('../pwa.js',import.meta.url),'utf8'),
  readFile(new URL('../build.config.json',import.meta.url),'utf8').then(JSON.parse)
]);

test('startup boot gate hides the raw app until enhanced UI is ready',()=>{
  assert.match(css,/html:not\(\.ft-ready\) \.app\{visibility:hidden/);
  assert.match(css,/body::before\{content:'FISH TARGET'/);
  assert.match(css,/ftBootFailsafe/);
  assert.match(pwa,/document\.documentElement\.classList\.add\('ft-ready'\)/);
  assert.match(pwa,/await extensionCss/);
  assert.match(pwa,/await loadScript\('\.\/visual-v8\.js','visual-v8-js'\)/);
});

test('startup flash fix ships under a fresh build id',()=>{
  assert.match(config.version,/-BOOT1(?:-|$)/);
});
