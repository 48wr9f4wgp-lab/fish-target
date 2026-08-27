import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../visual-v8.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../visual-v8.css',import.meta.url),'utf8');
const pwa=readFileSync(new URL('../pwa.js',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const config=JSON.parse(readFileSync(new URL('../build.config.json',import.meta.url),'utf8'));

test('VISUAL8 compresses guidance copy without changing fishing logic',()=>{
  assert.match(js,/迷ったら、まずはこれ。/);
  assert.match(js,/この4つで基本セット。/);
  assert.match(js,/迷ったら、この順でOK。/);
  assert.match(js,/FIRST CAST → タックル → 3ステップ/);
  assert.match(js,/version:'V23-VISUAL8'/);
});

test('VISUAL8 makes field mode primary and copy tertiary',()=>{
  assert.match(js,/v8PrimaryCta/);
  assert.match(js,/v8SecondaryCta/);
  assert.match(js,/v8TertiaryCta/);
  assert.match(js,/プランをコピー/);
  assert.match(css,/\.78fr 1\.22fr/);
  assert.match(css,/fieldModeLaunch\.v8PrimaryCta/);
});

test('VISUAL8 disclosure rows expose explicit open and close affordance',()=>{
  assert.match(js,/判定理由を見る/);
  assert.match(js,/○△×の内訳/);
  assert.match(js,/開く ›/);
  assert.match(js,/閉じる/);
  assert.match(css,/v19FitWhy>summary/);
});

test('VISUAL8 loads after previous visual layers and ships offline',()=>{
  assert.ok(pwa.indexOf("./visual-v8.js")>pwa.indexOf("./fish-real.js"));
  assert.match(pwa,/visual-v8\.css/);
  assert.match(build,/'visual-v8\.css'/);
  assert.match(build,/'visual-v8\.js'/);
  assert.equal(config.version,'V23-DEV2-DAIWA-VISUAL8');
  assert.equal(config.features.fieldLive,false);
});
