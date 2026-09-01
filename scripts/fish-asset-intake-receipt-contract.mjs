import {readFileSync} from 'node:fs';
import {loadRightsQueue} from './fish-asset-rights-queue.mjs';
import {validateCandidateRegistry} from './fish-asset-candidate-contract.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const HTTPS=/^https:\/\//i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const SHA256=/^[a-f0-9]{64}$/;
const text=value=>String(value??'').trim();
const isHttps=value=>HTTPS.test(text(value));
const required=(value,label)=>{if(!text(value))throw new Error(`${label} is required`)};

export function validateIntakeReceipts(input,{candidateRegistry=null}={}){
  if(!input||input.schema_version!=='FISH-ASSET-INTAKE-RECEIPTS-1')throw new Error('intake receipt schema_version');
  if(!Array.isArray(input.records))throw new Error('intake receipt records');

  const candidates=candidateRegistry||JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
  validateCandidateRegistry(candidates);
  const candidateByName=new Map(candidates.records.map(row=>[row.species_name,row]));
  const queueByName=new Map(loadRightsQueue().map(row=>[row.species_name,row]));
  const seenSpecies=new Set(),seenOutput=new Set();

  for(const [index,row] of input.records.entries()){
    const label=`records[${index}]`;
    if(!row||typeof row!=='object'||Array.isArray(row))throw new Error(`${label} must be an object`);
    required(row.species_name,`${label}.species_name`);
    required(row.species_id,`${label}.species_id`);
    if(row.status!=='verified-intake')throw new Error(`${label}.status must be verified-intake`);
    if('publication_ready' in row||'rights_status' in row)throw new Error(`${label} cannot assert publication state`);

    const queue=queueByName.get(row.species_name);
    if(!queue)throw new Error(`${row.species_name}: not in rights queue`);
    if(row.species_id!==queue.species_id)throw new Error(`${row.species_name}: species_id mismatch`);
    const candidate=candidateByName.get(row.species_name);
    if(!candidate||candidate.status!=='verified-candidate')throw new Error(`${row.species_name}: verified candidate required before intake`);

    if(row.source_taxon!==candidate.source_taxon)throw new Error(`${row.species_name}: source_taxon mismatch`);
    if(row.source_page_url!==candidate.source_url)throw new Error(`${row.species_name}: source page mismatch`);
    if(row.source_license!==candidate.license)throw new Error(`${row.species_name}: source license mismatch`);
    if((row.source_author??null)!==(candidate.author??null))throw new Error(`${row.species_name}: source author mismatch`);
    if((row.attribution??null)!==(candidate.attribution??null))throw new Error(`${row.species_name}: attribution mismatch`);
    if(row.output_license!==row.source_license)throw new Error(`${row.species_name}: output license must conservatively preserve source license`);

    if(!isHttps(row.source_file_url))throw new Error(`${row.species_name}: source_file_url must use HTTPS`);
    if(!SHA256.test(text(row.source_sha256)))throw new Error(`${row.species_name}: source_sha256 must be lowercase SHA-256`);
    if(!SHA256.test(text(row.output_sha256)))throw new Error(`${row.species_name}: output_sha256 must be lowercase SHA-256`);
    const expectedOutput=`assets/fish/${row.species_id}.avif`;
    if(row.output_file!==expectedOutput)throw new Error(`${row.species_name}: output_file must be ${expectedOutput}`);
    if(!DATE.test(text(row.imported_at)))throw new Error(`${row.species_name}: imported_at must be YYYY-MM-DD`);
    if(!Array.isArray(row.transformations)||!row.transformations.length||row.transformations.some(item=>!text(item)))throw new Error(`${row.species_name}: transformations must be a non-empty string array`);
    required(row.transformation_notice,`${row.species_name}.transformation_notice`);

    if(seenSpecies.has(row.species_id))throw new Error(`${row.species_name}: duplicate receipt species_id`);
    if(seenOutput.has(row.output_file))throw new Error(`${row.species_name}: duplicate receipt output_file`);
    seenSpecies.add(row.species_id);
    seenOutput.add(row.output_file);
  }

  return Object.freeze({count:input.records.length,verified:input.records.filter(row=>row.status==='verified-intake').length});
}

if(process.argv[1]&&new URL(`file://${process.argv[1]}`).href===import.meta.url){
  const input=JSON.parse(read('authoring/fish-asset-intake-receipts.v1.json'));
  console.log('FISH ASSET INTAKE RECEIPT CONTRACT PASS',JSON.stringify(validateIntakeReceipts(input)));
}
