import {readFileSync} from 'node:fs';
import {loadRightsQueue} from './fish-asset-rights-queue.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const ALLOWED_STATUS=new Set(['verified-candidate','taxonomy-review']);
const ALLOWED_LICENSE=new Set(['CC0','Public domain','CC BY 2.0','CC BY 2.5','CC BY 3.0','CC BY 4.0','CC BY-SA 2.5','CC BY-SA 3.0','CC BY-SA 4.0']);
const attributionRequired=license=>/^CC BY(?:-| )/.test(String(license||''));
const isHttps=value=>{try{return new URL(value).protocol==='https:'}catch{return false}};
const isIsoDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(String(value||''));

export function validateCandidateRegistry(input){
  if(!input||input.schema_version!=='FISH-ASSET-CANDIDATES-1')throw new Error('candidate schema_version');
  if(!isIsoDate(input.reviewed_at))throw new Error('candidate reviewed_at');
  if(!Array.isArray(input.records))throw new Error('candidate records');
  const queue=loadRightsQueue();
  const queueNames=new Set(queue.map(x=>x.species_name));
  const seen=new Set();
  for(const row of input.records){
    if(!row?.species_name||seen.has(row.species_name))throw new Error(`candidate duplicate/missing species ${row?.species_name||''}`);
    seen.add(row.species_name);
    if(!queueNames.has(row.species_name))throw new Error(`${row.species_name}: not in rights queue`);
    if(!ALLOWED_STATUS.has(row.status))throw new Error(`${row.species_name}: invalid status`);
    if(!isIsoDate(row.verified_at))throw new Error(`${row.species_name}: verified_at must be YYYY-MM-DD`);
    if(row.verified_at>input.reviewed_at)throw new Error(`${row.species_name}: verified_at cannot be newer than registry review date`);
    if(row.source_url!==null&&row.source_url!==undefined&&!isHttps(row.source_url))throw new Error(`${row.species_name}: source_url must be HTTPS`);
    if('publication_ready' in row||'rights_status' in row)throw new Error(`${row.species_name}: candidate registry cannot assert publication state`);
    if(row.status==='verified-candidate'){
      if(!row.source_taxon)throw new Error(`${row.species_name}: source_taxon required`);
      if(!row.source||!isHttps(row.source_url))throw new Error(`${row.species_name}: verified source required`);
      if(!ALLOWED_LICENSE.has(row.license))throw new Error(`${row.species_name}: unsupported candidate license ${row.license}`);
      if(attributionRequired(row.license)&&(!row.author||!row.attribution))throw new Error(`${row.species_name}: attribution metadata required`);
    }else if(!row.review_reason){
      throw new Error(`${row.species_name}: taxonomy review reason required`);
    }
  }
  if(seen.size!==queueNames.size)throw new Error(`candidate coverage ${seen.size}/${queueNames.size}`);
  for(const name of queueNames)if(!seen.has(name))throw new Error(`candidate missing ${name}`);
  return Object.freeze({count:seen.size,verified:input.records.filter(x=>x.status==='verified-candidate').length,review:input.records.filter(x=>x.status==='taxonomy-review').length});
}

if(process.argv[1]&&new URL(`file://${process.argv[1]}`).href===import.meta.url){
  const input=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
  console.log('FISH ASSET CANDIDATE CONTRACT PASS',JSON.stringify(validateCandidateRegistry(input)));
}
