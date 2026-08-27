import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../fish-real.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../fish-real.css',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const species=['ブリ・ワラサ','カンパチ','サワラ','シーバス','ヒラメ','マゴチ','アジ','メバル','アオリイカ','タチウオ','クロダイ','マダイ','シロギス','カワハギ','ブラックバス','ニジマス','アユ','コイ','ヤマメ・イワナ'];

test('real fish layer maps all 19 targets and keeps SVG fallback',()=>{
  for(const name of species)assert.ok(js.includes(`'${name}'`),`missing real fish mapping: ${name}`);
  assert.match(js,/V23-REAL1/);
  assert.match(js,/keeping SVG fallback/);
  assert.match(css,/realFishMounted>\.speciesSvg/);
});

test('real fish sprite is shipped in the offline shell',()=>{
  assert.match(build,/fish-real-sprite\.webp/);
  assert.match(build,/fish-real\.js/);
  assert.match(build,/fish-real\.css/);
});
