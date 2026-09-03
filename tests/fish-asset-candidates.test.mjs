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

test('registry review date can advance without falsifying older per-candidate verification dates',()=>{
  const input=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
  input.reviewed_at='2026-09-01';
  input.records[0].verified_at='2026-08-30';
  assert.doesNotThrow(()=>validateCandidateRegistry(input));
  const future=structuredClone(input);
  future.records[0].verified_at='2026-09-02';
  assert.throws(()=>validateCandidateRegistry(future),/verified_at cannot be newer than registry review date/);
});

test('canonical オニカサゴ image candidate follows the resolved イズカサゴ taxon without asserting publication rights',()=>{
  const input=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
  const row=input.records.find(x=>x.species_name==='オニカサゴ');
  assert.equal(row?.status,'verified-candidate');
  assert.equal(row?.source_taxon,'Scorpaena neglecta');
  assert.equal(row?.license,'CC BY 4.0');
  assert.ok(row?.author);
  assert.ok(row?.attribution);
  assert.ok(!('publication_ready' in row));
  assert.ok(!('rights_status' in row));
});

test('candidate research is not loaded by runtime or release build',()=>{
  const pwa=read('pwa.js');
  const build=read('scripts/build.mjs');
  assert.ok(!pwa.includes('fish-asset-candidates.v1.json'));
  assert.ok(!build.includes('fish-asset-candidates.v1.json'));
});
