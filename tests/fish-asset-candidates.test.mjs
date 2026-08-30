import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateCandidateRegistry} from '../scripts/fish-asset-candidate-contract.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('research candidate registry covers the entire 41-species rights queue without publishing anything',()=>{
  const input=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
  const status=validateCandidateRegistry(input);
  assert.equal(status.count,41);
  assert.ok(status.verified>=30,'candidate research should materially cover the queue');
  assert.ok(status.review>0,'ambiguous angling labels must remain review-gated');
  const source=read('authoring/fish-asset-candidates.v1.json');
  assert.ok(!source.includes('publication_ready'));
  assert.ok(!source.includes('rights_status'));
});

test('candidate research is not loaded by runtime or release build',()=>{
  const pwa=read('pwa.js');
  const build=read('scripts/build.mjs');
  assert.ok(!pwa.includes('fish-asset-candidates.v1.json'));
  assert.ok(!build.includes('fish-asset-candidates.v1.json'));
});
