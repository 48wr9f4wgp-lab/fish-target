import {readFileSync} from 'node:fs';
import {loadRightsQueue} from './fish-asset-rights-queue.mjs';
import {validateCandidateRegistry} from './fish-asset-candidate-contract.mjs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

export function buildIntakePlan({speciesNames=null}={}){
  const input=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
  validateCandidateRegistry(input);
  const queueByName=new Map(loadRightsQueue().map(x=>[x.species_name,x]));
  const requested=speciesNames?new Set(speciesNames):null;
  const records=input.records.filter(row=>!requested||requested.has(row.species_name));
  if(requested){
    for(const name of requested)if(!queueByName.has(name))throw new Error(`Unknown rights-queue species: ${name}`);
  }
  const blocked=records.filter(row=>row.status!=='verified-candidate');
  if(requested&&blocked.length)throw new Error(`Taxonomy review blocks intake: ${blocked.map(x=>x.species_name).join(', ')}`);
  return Object.freeze(records
    .filter(row=>row.status==='verified-candidate')
    .map(row=>{
      const queue=queueByName.get(row.species_name);
      if(!queue)throw new Error(`Missing rights queue record: ${row.species_name}`);
      return Object.freeze({
        species_id:queue.species_id,
        species_name:row.species_name,
        source_taxon:row.source_taxon,
        source_page_url:row.source_url,
        target_file:`assets/fish/${queue.species_id}.avif`,
        author:row.author,
        license:row.license,
        attribution:row.attribution,
        verified_at:row.verified_at,
        execution_state:'planned-only'
      });
    }));
}

if(process.argv[1]&&new URL(`file://${process.argv[1]}`).href===import.meta.url){
  const names=process.argv.slice(2);
  const plan=buildIntakePlan({speciesNames:names.length?names:null});
  console.log(JSON.stringify({count:plan.length,plan},null,2));
}
