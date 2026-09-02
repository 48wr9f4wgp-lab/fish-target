import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {validateIntakeReceipts} from '../scripts/fish-asset-intake-receipt-contract.mjs';
import {loadRightsQueue} from '../scripts/fish-asset-rights-queue.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const candidates=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
const queue=loadRightsQueue();

function receiptFor(name){
  const candidate=candidates.records.find(row=>row.species_name===name);
  const rights=queue.find(row=>row.species_name===name);
  return {
    species_id:rights?.species_id||'species-missing',
    species_name:name,
    status:'verified-intake',
    source_taxon:candidate?.source_taxon||null,
    source_page_url:candidate?.source_url||null,
    source_file_url:'https://upload.wikimedia.org/example/source.jpg',
    source_author:candidate?.author??null,
    source_license:candidate?.license??null,
    attribution:candidate?.attribution??null,
    source_sha256:'a'.repeat(64),
    output_file:`assets/fish/${rights?.species_id||'species-missing'}.avif`,
    output_sha256:'b'.repeat(64),
    output_license:candidate?.license??null,
    transformations:['download-original','resize-long-edge:1200','encode:avif'],
    transformation_notice:'Source image resized and encoded as AVIF; no semantic content edits.',
    imported_at:'2026-08-30'
  };
}

const ledger=records=>({schema_version:'FISH-ASSET-INTAKE-RECEIPTS-1',records});

test('committed intake receipt ledger starts empty and valid',()=>{
  const input=JSON.parse(read('authoring/fish-asset-intake-receipts.v1.json'));
  assert.deepEqual(validateIntakeReceipts(input),{count:0,verified:0});
});

test('verified candidate can produce a traceable hash-locked intake receipt',()=>{
  const row=receiptFor('サバ');
  assert.deepEqual(validateIntakeReceipts(ledger([row])),{count:1,verified:1});
  assert.match(row.output_file,/^assets\/fish\/species-[a-z0-9]+\.avif$/);
});

test('receipt gate fails closed on taxonomy review, hash drift, license drift, and output drift',()=>{
  assert.throws(()=>validateIntakeReceipts(ledger([receiptFor('エソ')])),/verified candidate required/);

  const badHash=receiptFor('サバ');
  badHash.source_sha256='ABC';
  assert.throws(()=>validateIntakeReceipts(ledger([badHash])),/source_sha256/);

  const badLicense=receiptFor('サバ');
  badLicense.output_license='CC0';
  assert.throws(()=>validateIntakeReceipts(ledger([badLicense])),/output license/);

  const badOutput=receiptFor('サバ');
  badOutput.output_file='assets/fish/wrong.avif';
  assert.throws(()=>validateIntakeReceipts(ledger([badOutput])),/output_file/);
});

test('receipt validator has no network, binary-write, or publication side effects',()=>{
  const source=read('scripts/fish-asset-intake-receipt-contract.mjs');
  assert.ok(!source.includes('fetch('));
  assert.ok(!source.includes('writeFile'));
  assert.ok(!source.includes('exec('));
  assert.ok(!source.includes('publication_ready:'));
});
