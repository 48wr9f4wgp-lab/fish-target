import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';

const js=readFileSync(new URL('../fish-real.js',import.meta.url),'utf8');
const manifest=readFileSync(new URL('../fish-asset-manifest.js',import.meta.url),'utf8');
const authoring=JSON.parse(readFileSync(new URL('../authoring/fish-assets.v1.json',import.meta.url),'utf8'));
const css=readFileSync(new URL('../fish-real.css',import.meta.url),'utf8');
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const assetName='fish-real-v7.avif';
const species=[
  'ブリ・ワラサ','カンパチ','サワラ','シーバス','ヒラメ','マゴチ','アジ','メバル','アオリイカ','タチウオ',
  'クロダイ','マダイ','シロギス','カワハギ','ブラックバス','ニジマス','アユ','コイ','ヤマメ・イワナ'
];

test('REAL8 maps all 19 targets through generated fish asset authoring and loads the direct AVIF grid',()=>{
  assert.match(js,/version:'V23-REAL8'/);
  assert.match(js,/renderer:'direct-avif-grid-with-svg-fallback'/);
  assert.match(js,/FISH_TARGET_FISH_ASSET_MANIFEST/);
  assert.match(js,/const ASSET=MANIFEST\.bundledSheet\|\|'fish-real-v7\.avif'/);
  assert.match(manifest,/FISH_TARGET_FISH_ASSET_AUTHORING/);
  assert.match(manifest,/const SHEET=authoring\.bundled_sheet/);
  assert.equal(authoring.bundled_sheet,assetName);
  assert.equal(authoring.assets.length,19);
  assert.deepEqual(authoring.assets.map(record=>record.species_name),species);
  assert.match(js,/image\.naturalWidth<1000\|\|image\.naturalHeight<700/);
  assert.match(js,/naturalHeight\/position\.rows/);
  assert.match(js,/naturalWidth\/position\.columns/);
  assert.match(js,/devicePixelRatio/);
  assert.match(js,/imageSmoothingQuality='high'/);
  assert.match(js,/host\.dataset\.fishAsset='direct-avif-grid'/);
});

test('verified 1200x768 AVIF ships as a direct binary asset',()=>{
  const assetUrl=new URL(`../${assetName}`,import.meta.url);
  assert.equal(existsSync(assetUrl),true,'direct AVIF asset missing');
  const bytes=readFileSync(assetUrl);
  assert.equal(bytes.length,28472,'AVIF byte length mismatch');
  assert.equal(bytes.subarray(4,12).toString('ascii'),'ftypavif','asset is not AVIF');
  assert.equal(createHash('sha256').update(bytes).digest('hex'),'446ac81286e0e107205957dbb87ed74de78a5d0e48102aed98b2f668e53c2559','AVIF hash mismatch');
  assert.ok(build.includes(`'${assetName}'`),`${assetName} missing from build assets`);
});

test('release fish path contains no runtime Base64 reconstruction',()=>{
  assert.doesNotMatch(js,/\.b64|data:image|base64|loadTextPart|HQ_PARTS|ROW_PARTS/);
  assert.doesNotMatch(build,/\.b64/);
  assert.match(js,/keeping SVG fallback/);
});

test('REAL8 preserves safe-frame SVG fallback and reduced-motion behavior',()=>{
  assert.match(css,/\.realFishCanvas\{/);
  assert.match(css,/width:100%/);
  assert.match(css,/#result \.tart \.realFishCanvas\{width:104%;height:104%\}/);
  assert.match(css,/\.realFishReady \.realFishMounted>\.speciesSvg\{opacity:0\}/);
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)\{\.realFishCanvas\{transition:none\}\}/);
});
