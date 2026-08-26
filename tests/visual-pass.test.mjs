import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../visual-pass.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../visual-pass.css',import.meta.url),'utf8');
const species=[
  'ブリ・ワラサ','カンパチ','サワラ','シーバス','ヒラメ','マゴチ','アジ','メバル','アオリイカ','タチウオ',
  'クロダイ','マダイ','シロギス','カワハギ','ブラックバス','ニジマス','アユ','コイ','ヤマメ・イワナ'
];

test('visual pass explicitly themes all 19 target groups',()=>{
  for(const name of species)assert.ok(js.includes(`'${name}'`),`missing visual theme: ${name}`);
  assert.ok(js.includes("version:'V23-VISUAL1'"));
});

test('phone fish list uses readability-first one-column cards',()=>{
  assert.match(css,/@media\(max-width:699px\)/);
  assert.match(css,/#home \.grid\{grid-template-columns:1fr!important/);
  assert.match(css,/grid-template-columns:126px minmax\(0,1fr\)/);
});

test('visual pass preserves reduced-motion fallback',()=>{
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
