import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../fish-real.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../fish-real.css',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const species=[
  'ブリ・ワラサ','カンパチ','サワラ','シーバス','ヒラメ','マゴチ','アジ','メバル','アオリイカ','タチウオ',
  'クロダイ','マダイ','シロギス','カワハギ','ブラックバス','ニジマス','アユ','コイ','ヤマメ・イワナ'
];
const rows=[
  {parts:['fish-real-row0.b64'],sha:'f69d48fa0a99b3b2afeee8d06bc018705e36a20101b208719eb376162a5391c5'},
  {parts:['fish-real-row1.b64'],sha:'e27129230b4e52ff17be8420ec3e2a5215083fa02163bb9eda4479b04b4a577a'},
  {parts:['fish-real-row2a.b64','fish-real-row2b.b64'],sha:'ea9bb243b733249d0c7992103b0a3ddaa4ac74cecee1909a4881150ab4c17e32'},
  {parts:['fish-real-row3a.b64','fish-real-row3b.b64'],sha:'34a22a8e13eafc578a4b3604ca6c856436d40edd9ddb9e3baf4606c64f15f80f'}
];

const assembled=row=>row.parts.map(name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8').trim()).join('');

test('REAL3 maps all 19 targets and waits for decoded row images before replacing SVG',()=>{
  assert.match(js,/version:'V23-REAL3'/);
  for(const name of species)assert.ok(js.includes(`'${name}'`),`missing real fish mapping: ${name}`);
  assert.match(js,/await Promise\.all\(encoded\.map\(probe\)\)/);
  assert.match(js,/realFishReady/);
  assert.match(js,/keeping SVG fallback/);
});

test('real fish row payloads exactly match the verified local WebP assets',()=>{
  for(const row of rows){
    const payload=assembled(row);
    const bytes=Buffer.from(payload,'base64');
    assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');
    assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
    assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'RIFF size mismatch');
    assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha,'fish row hash mismatch');
    for(const name of row.parts)assert.ok(build.includes(`'${name}'`),`${name} missing from build assets`);
  }
  assert.ok(!build.includes("'fish-real-sprite.webp'"),'corrupt binary sprite must not ship');
  assert.ok(!build.includes("'fish-real-row2.b64'"),'known-bad unchunked row2 must not ship');
  assert.ok(!build.includes("'fish-real-row3.b64'"),'known-bad unchunked row3 must not ship');
});

test('row sprite CSS uses five equal horizontal cells',()=>{
  assert.match(css,/background-size:500% 100%/);
  assert.match(css,/\.realFishReady \.realFishMounted>\.speciesSvg\{opacity:0\}/);
});
