import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../fish-real.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../fish-real.css',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const species=[
  'ブリ・ワラサ','カンパチ','サワラ','シーバス','ヒラメ','マゴチ','アジ','メバル','アオリイカ','タチウオ',
  'クロダイ','マダイ','シロギス','カワハギ','ブラックバス','ニジマス','アユ','コイ','ヤマメ・イワナ'
];

test('REAL2 maps all 19 targets and waits for decoded row images before replacing SVG',()=>{
  assert.match(js,/version:'V23-REAL2'/);
  for(const name of species)assert.ok(js.includes(`'${name}'`),`missing real fish mapping: ${name}`);
  assert.match(js,/await Promise\.all\(encoded\.map\(probe\)\)/);
  assert.match(js,/realFishReady/);
  assert.match(js,/keeping SVG fallback/);
});

test('real fish rows use text-safe base64 payloads and are present in the offline shell',()=>{
  for(let row=0;row<4;row++){
    const name=`fish-real-row${row}.b64`;
    const payload=readFileSync(new URL(`../${name}`,import.meta.url),'utf8').trim();
    assert.ok(payload.startsWith('UklG'),`${name} is not WebP base64`);
    assert.ok(payload.length>5000,`${name} looks truncated`);
    assert.ok(build.includes(`'${name}'`),`${name} missing from build assets`);
  }
  assert.ok(!build.includes("'fish-real-sprite.webp'"),'corrupt binary sprite must not ship');
});

test('row sprite CSS uses five equal horizontal cells',()=>{
  assert.match(css,/background-size:500% 100%/);
  assert.match(css,/\.realFishReady \.realFishMounted>\.speciesSvg\{opacity:0\}/);
});
