import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../fish-real.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../fish-real.css',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const species=[
  'ブリ・ワラサ','カンパチ','サワラ','シーバス','ヒラメ','マゴチ','アジ','メバル','アオリイカ','タチウオ',
  'クロダイ','マダイ','シロギス','カワハギ','ブラックバス','ニジマス','アユ','コイ','ヤマメ・イワナ'
];
const hqParts=['fish-real-v7-q25-00.b64','fish-real-v7-q25-01.b64','fish-real-v7-q25-02.b64','fish-real-v7-q25-03.b64'];
const rows=[
  {parts:['fish-real-row0.b64'],sha:'f69d48fa0a99b3b2afeee8d06bc018705e36a20101b208719eb376162a5391c5'},
  {parts:['fish-real-row1.b64'],sha:'e27129230b4e52ff17be8420ec3e2a5215083fa02163bb9eda4479b04b4a577a'},
  {parts:['fish-real-row2a.b64','fish-real-row2b.b64'],sha:'ea9bb243b733249d0c7992103b0a3ddaa4ac74cecee1909a4881150ab4c17e32'},
  {parts:['fish-real-row3a.b64','fish-real-row3b.b64'],sha:'34a22a8e13eafc578a4b3604ca6c856436d40edd9ddb9e3baf4606c64f15f80f'}
];
const assembled=parts=>parts.map(name=>readFileSync(new URL(`../${name}`,import.meta.url),'utf8').trim()).join('');

test('REAL7 maps all 19 targets and prefers the chunked high-resolution AVIF grid',()=>{
  assert.match(js,/version:'V23-REAL7'/);
  assert.match(js,/renderer:'hq-avif-chunks-with-webp-fallback'/);
  for(const name of species)assert.ok(js.includes(`'${name}'`),`missing real fish mapping: ${name}`);
  for(const name of hqParts)assert.ok(js.includes(`'${name}'`),`missing HQ part: ${name}`);
  assert.match(js,/image\.naturalWidth<1000\|\|image\.naturalHeight<700/);
  assert.match(js,/source='avif-grid'/);
  assert.match(js,/naturalHeight\/4/);
  assert.match(js,/naturalWidth\/5/);
  assert.match(js,/devicePixelRatio/);
  assert.match(js,/imageSmoothingQuality='high'/);
  assert.match(js,/host\.dataset\.fishAsset=source/);
});

test('VISUAL7 HQ chunks reconstruct the verified 1200x768 AVIF byte-for-byte',()=>{
  const encoded=assembled(hqParts);
  const bytes=Buffer.from(encoded,'base64');
  assert.equal(encoded.length,37964,'HQ base64 length mismatch');
  assert.equal(bytes.length,28472,'HQ AVIF byte length mismatch');
  assert.equal(bytes.subarray(4,12).toString('ascii'),'ftypavif','HQ asset is not AVIF');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'446ac81286e0e107205957dbb87ed74de78a5d0e48102aed98b2f668e53c2559','HQ AVIF hash mismatch');
  for(const name of hqParts)assert.ok(build.includes(`'${name}'`),`${name} missing from build assets`);
  assert.equal(existsSync(new URL('../fish-real-v7.avif',import.meta.url)),false,'truncated binary AVIF must not ship');
});

test('verified WebP rows remain as fallback',()=>{
  assert.match(js,/loadFallbackRows/);
  for(const row of rows){
    const payload=assembled(row.parts);
    const bytes=Buffer.from(payload,'base64');
    assert.equal(bytes.subarray(0,4).toString('ascii'),'RIFF');
    assert.equal(bytes.subarray(8,12).toString('ascii'),'WEBP');
    assert.equal(bytes.readUInt32LE(4)+8,bytes.length,'RIFF size mismatch');
    assert.equal(createHash('sha256').update(bytes).digest('hex'),row.sha,'fish row hash mismatch');
  }
});

test('VISUAL7 preserves safe-frame SVG fallback and reduced-motion behavior',()=>{
  assert.match(css,/\.realFishCanvas\{/);
  assert.match(css,/width:100%/);
  assert.match(css,/#result \.tart \.realFishCanvas\{width:104%;height:104%\}/);
  assert.match(css,/\.realFishReady \.realFishMounted>\.speciesSvg\{opacity:0\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.realFishCanvas\{transition:none\}\}/);
});
