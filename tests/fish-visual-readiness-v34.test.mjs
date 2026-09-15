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
  assert.equal(report.master_assets_ready+report.master_assets_pending,4,'master readiness must account for all four pilot assets');
});

test('master pilot contract locks mobile frame, provenance, and human identity review',()=>{
  for(const row of MASTER_VISUAL_PILOT){
    assert.match(row.asset_path,/^fish-master-v34-[a-z0-9-]+\.avif$/);
    assert.deepEqual(row.frame,{width:1200,height:768,safe_margin_pct:8,mobile_review_width:390});
    assert.equal(row.provenance_required,'project-generated-original');
    assert.equal(row.human_identity_review_required,true);
    assert.match(row.composition,/single full-body subject/);
    assert.ok(row.identity_cues.length>=3,`${row.species} needs at least three diagnostic cues`);
    assert.ok(row.identity_cues.every(Boolean));
    assert.ok(row.must_avoid.includes('text'));
    assert.ok(row.must_avoid.includes('logo'));
    assert.ok(row.must_avoid.includes('watermark'));
    assert.ok(row.must_avoid.includes('human hand'));
  }
});

test('flatfish and cephalopod masters retain diagnostic anatomy instead of generic silhouettes',()=>{
  const hirame=MASTER_VISUAL_PILOT.find(row=>row.species==='ヒラメ');
  const aori=MASTER_VISUAL_PILOT.find(row=>row.species==='アオリイカ');
  assert.ok(hirame.identity_cues.some(cue=>/left side/.test(cue)),'Hirame contract must preserve left-eye anatomy');
  assert.ok(hirame.must_avoid.some(cue=>/right-eye/.test(cue)),'Hirame contract must reject opposite-eye flatfish anatomy');
  assert.ok(aori.identity_cues.some(cue=>/lateral fins/.test(cue)),'Aori contract must preserve mantle fin identity');
  assert.ok(aori.must_avoid.some(cue=>/octopus/.test(cue)),'Aori contract must reject octopus-like silhouette');
});

test('ambiguous Yamame-Iwana legacy sprite cannot count as publication-ready exact identity',()=>{
  const compound=authoring.assets.find(asset=>asset.species_name==='ヤマメ・イワナ');
  assert.ok(compound,'compound legacy target must remain visible for deliberate dual-subject replacement');
  assert.equal(publicationReady(compound),false);
  assert.notEqual(compound.rights_status,'verified');
});
