import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {publicationReady} from '../scripts/fish-asset-authoring.mjs';
import {buildPromotionPlan} from '../scripts/fish-asset-promotion-plan.mjs';
import {loadRightsQueue} from '../scripts/fish-asset-rights-queue.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const candidates=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
const authoring=JSON.parse(read('authoring/fish-assets.v1.json'));
const queue=loadRightsQueue();

function receiptFor(name){
  const candidate=candidates.records.find(row=>row.species_name===name);
  const rights=queue.find(row=>row.species_name===name);
  return {
    species_id:rights.species_id,
    species_name:name,
    status:'verified-intake',
    source_taxon:candidate.source_taxon,
    source_page_url:candidate.source_url,
    source_file_url:'https://upload.wikimedia.org/example/source.jpg',
    source_author:candidate.author??null,
    source_license:candidate.license,
    attribution:candidate.attribution??null,
    source_sha256:'a'.repeat(64),
    output_file:`assets/fish/${rights.species_id}.avif`,
    output_sha256:'b'.repeat(64),
    output_license:candidate.license,
    transformations:['resize-long-edge:1200','encode:avif'],
    transformation_notice:'Source image resized and encoded as AVIF; no semantic content edits.',
    imported_at:'2026-08-30'
  };
}
const ledger=records=>({schema_version:'FISH-ASSET-INTAKE-RECEIPTS-1',records});

test('empty committed receipt ledger produces no promotion writes',()=>{
  const plan=buildPromotionPlan();
  assert.equal(plan.length,0);
});

test('verified receipt maps deterministically to a provenance-preserving authoring record',()=>{
  const plan=buildPromotionPlan({receiptLedger:ledger([receiptFor('サバ')]),authoringData:structuredClone(authoring),candidateRegistry:structuredClone(candidates)});
  assert.equal(plan.length,1);
  assert.equal(plan[0].species_name,'サバ');
  assert.equal(plan[0].execution_state,'planned-only');
  const record=plan[0].authoring_record;
  assert.equal(record.asset.file,`assets/fish/${plan[0].species_id}.avif`);
  assert.equal(record.provenance.source_sha256,'a'.repeat(64));
  assert.equal(record.provenance.output_sha256,'b'.repeat(64));
  assert.equal(record.license,receiptFor('サバ').source_license);
  assert.equal(publicationReady(record),true,'metadata is complete, while actual byte verification remains a later authoring gate');
  assert.ok(Object.isFrozen(record));
  assert.ok(Object.isFrozen(record.provenance.transformations));
});

test('promotion planner fails closed on taxonomy review or tampered receipt metadata',()=>{
  const bad=receiptFor('サバ');
  bad.source_license='CC0';
  assert.throws(()=>buildPromotionPlan({receiptLedger:ledger([bad]),authoringData:structuredClone(authoring),candidateRegistry:structuredClone(candidates)}),/source license mismatch/);
});

test('promotion planner has no network, file-write, or publication side effects',()=>{
  const source=read('scripts/fish-asset-promotion-plan.mjs');
  assert.ok(!source.includes('fetch('));
  assert.ok(!source.includes('writeFile'));
  assert.ok(!source.includes('exec('));
  assert.ok(!source.includes('update_ref'));
});
