import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import test from 'node:test';

const authoring=JSON.parse(readFileSync(new URL('../authoring/fish-assets.v1.json',import.meta.url),'utf8'));
const build=readFileSync(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const worker=readFileSync(new URL('../dist/sw.js',import.meta.url),'utf8');
const files=[...new Set(authoring.assets.map(record=>String(record?.asset?.file??'').trim()).filter(Boolean))];

test('fish asset files are derived from authoring instead of a build hardcode',()=>{
  assert.ok(files.length>0,'authoring must reference at least one bundled fish asset file');
  assert.match(build,/loadFishAssetAuthoring/);
  assert.match(build,/validateFishAssetAuthoring/);
  assert.match(build,/generateFishAssetRuntimeSource/);
  assert.match(build,/\.\.\.fishAssetFiles/);
  assert.doesNotMatch(build,/'fish-real-v7\.avif'/,'build must not hardcode the current fish asset filename');
});

test('every authored fish asset file ships to dist and the offline shell',()=>{
  for(const file of files){
    assert.equal(existsSync(new URL(`../dist/${file}`,import.meta.url)),true,`dist fish asset missing: ${file}`);
    assert.ok(worker.includes(JSON.stringify(`./${file}`)),`offline shell missing fish asset: ${file}`);
  }
});
