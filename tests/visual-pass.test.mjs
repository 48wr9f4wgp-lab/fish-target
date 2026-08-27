import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../visual-pass.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../visual-pass.css',import.meta.url),'utf8');
const typeCss=readFileSync(new URL('../visual-typography.css',import.meta.url),'utf8');
const species=[
  'ブリ・ワラサ','カンパチ','サワラ','シーバス','ヒラメ','マゴチ','アジ','メバル','アオリイカ','タチウオ',
  'クロダイ','マダイ','シロギス','カワハギ','ブラックバス','ニジマス','アユ','コイ','ヤマメ・イワナ'
];

test('visual pass explicitly themes all 19 target groups',()=>{
  for(const name of species)assert.ok(js.includes(`'${name}'`),`missing visual theme: ${name}`);
  assert.ok(js.includes("version:'V23-VISUAL2'"));
  assert.match(js,/dimensionalizeSvg/);
  assert.match(js,/linearGradient/);
});

test('VISUAL2 uses clearer hero and section copy',()=>{
  assert.match(js,/この魚、/);
  assert.match(js,/どう釣る？/);
  assert.match(js,/魚を選ぶだけで、釣り方・最初の1投・手持ちタックルの適合まで一気にわかる。/);
  assert.match(js,/人気の魚から選ぶ/);
  assert.match(js,/釣りたい魚を選ぶ/);
  assert.match(js,/必要なタックル/);
  assert.match(js,/現場でやること 3つ/);
});

test('phone fish list uses readability-first one-column cards',()=>{
  assert.match(css,/@media\(max-width:699px\)/);
  assert.match(css,/#home \.grid\{grid-template-columns:1fr!important/);
  assert.match(typeCss,/grid-template-columns:138px minmax\(0,1fr\)/);
});

test('typography pass raises mobile hierarchy and keeps readable body copy',()=>{
  assert.match(typeCss,/\.hero h1\{font-size:38px/);
  assert.match(typeCss,/\.hero>p\{font-size:14px/);
  assert.match(typeCss,/#home \.head h2\{font-size:23px/);
  assert.match(typeCss,/#home \.visualFishCard \.name\{font-size:21px/);
});

test('visual pass preserves reduced-motion fallback',()=>{
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(typeCss,/@media\(prefers-reduced-motion:reduce\)/);
});
