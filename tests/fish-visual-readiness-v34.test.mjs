import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {collectVisualReadiness,MASTER_VISUAL_PILOT} from '../scripts/fish-visual-readiness-v34.mjs';
import {publicationReady} from '../scripts/fish-asset-authoring.mjs';

const authoring=JSON.parse(readFileSync(new URL('../authoring/fish-assets.v1.json',import.meta.url),'utf8'));

test('visual readiness measures publication safety separately from bundled presence',async()=>{
  const report=await collectVisualReadiness();
  assert.equal(report.targets,63);
  assert.ok(report.bundled>=19,'legacy bundled baseline must not disappear silently');
  assert.ok(report.publication_ready<=report.bundled);
  assert.equal(report.publication_blocked_bundled,report.bundled-report.publication_ready);
  assert.equal(report.safe_fallback_needed,report.targets-report.publication_ready);
  assert.ok(report.verified_candidates>0,'verified research candidates must be visible in readiness metrics');
  assert.ok(report.taxonomy_review>0,'taxonomy-review targets must remain visible instead of being guessed');
});

test('four-shape master pilot stays explicit before 63-target visual expansion',async()=>{
  assert.deepEqual(MASTER_VISUAL_PILOT.map(row=>row.species),['ブリ・ワラサ','ニジマス','ヒラメ','アオリイカ']);
  const report=await collectVisualReadiness();
  assert.deepEqual(report.master_pilot.map(row=>row.archetype),['saltwater-fish','freshwater-fish','flatfish','cephalopod']);
  assert.ok(report.master_pilot.every(row=>row.bundled),'pilot targets must have an offline baseline while master art is reviewed');
  assert.ok(report.master_pilot.every(row=>['publication-ready','verified-candidate','taxonomy-review','legacy-unverified','no-candidate'].includes(row.state)));
});

test('ambiguous Yamame-Iwana legacy sprite cannot count as publication-ready exact identity',()=>{
  const compound=authoring.assets.find(asset=>asset.species_name==='ヤマメ・イワナ');
  assert.ok(compound,'compound legacy target must remain visible for deliberate dual-subject replacement');
  assert.equal(publicationReady(compound),false);
  assert.notEqual(compound.rights_status,'verified');
});
