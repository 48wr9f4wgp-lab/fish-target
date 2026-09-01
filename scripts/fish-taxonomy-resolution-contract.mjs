import {readFileSync} from 'node:fs';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const EXPECTED=Object.freeze(['カレイ','オニカサゴ','タナゴ','ヒイカ','エソ','マルイカ']);
const KINDS=new Set(['generic-category','canonical-taxon']);
const STRATEGIES=new Set(['generic-category-svg','canonical-taxon-candidate-required']);
const isHttps=value=>{try{return new URL(value).protocol==='https:'}catch{return false}};

export function validateTaxonomyResolutions(input,{candidateRegistry=null}={}){
  if(!input||input.schema_version!=='FISH-TAXONOMY-RESOLUTIONS-1')throw new Error('taxonomy schema_version');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.reviewed_at||''))throw new Error('taxonomy reviewed_at');
  if(!Array.isArray(input.records)||input.records.length!==EXPECTED.length)throw new Error(`taxonomy records ${input.records?.length??0}/${EXPECTED.length}`);
  const seen=new Set();
  for(const row of input.records){
    if(!EXPECTED.includes(row?.species_name)||seen.has(row.species_name))throw new Error(`taxonomy unexpected/duplicate species ${row?.species_name||''}`);
    seen.add(row.species_name);
    if(!KINDS.has(row.resolution_kind))throw new Error(`${row.species_name}: invalid resolution_kind`);
    if(!STRATEGIES.has(row.visual_strategy))throw new Error(`${row.species_name}: invalid visual_strategy`);
    if(!isHttps(row.evidence_url))throw new Error(`${row.species_name}: HTTPS evidence required`);
    if(!row.rationale)throw new Error(`${row.species_name}: rationale required`);
    if('publication_ready' in row||'rights_status' in row||'license' in row)throw new Error(`${row.species_name}: taxonomy registry cannot assert rights/publication state`);
    if(row.resolution_kind==='generic-category'){
      if(row.canonical_taxon!==null||row.canonical_name!==null)throw new Error(`${row.species_name}: generic category cannot bind canonical taxon`);
      if(row.visual_strategy!=='generic-category-svg')throw new Error(`${row.species_name}: generic category must remain generic visual`);
    }else{
      if(!row.canonical_taxon||!row.canonical_name)throw new Error(`${row.species_name}: canonical taxon/name required`);
      if(row.visual_strategy!=='canonical-taxon-candidate-required')throw new Error(`${row.species_name}: canonical taxon still requires image candidate`);
    }
  }
  for(const name of EXPECTED)if(!seen.has(name))throw new Error(`taxonomy missing ${name}`);
  if(candidateRegistry){
    const candidates=new Map(candidateRegistry.records?.map(row=>[row.species_name,row])||[]);
    for(const name of EXPECTED){
      const candidate=candidates.get(name);
      if(!candidate)throw new Error(`${name}: candidate research row missing`);
      if(candidate.status==='verified-candidate')throw new Error(`${name}: taxonomy resolution must not auto-promote image candidate`);
    }
  }
  const generic=input.records.filter(x=>x.resolution_kind==='generic-category').length;
  const canonical=input.records.filter(x=>x.resolution_kind==='canonical-taxon').length;
  return Object.freeze({count:input.records.length,generic,canonical,unresolved:0});
}

if(process.argv[1]&&new URL(`file://${process.argv[1]}`).href===import.meta.url){
  const input=JSON.parse(read('authoring/fish-taxonomy-resolutions.v1.json'));
  const candidates=JSON.parse(read('authoring/fish-asset-candidates.v1.json'));
  console.log('FISH TAXONOMY RESOLUTION CONTRACT PASS',JSON.stringify(validateTaxonomyResolutions(input,{candidateRegistry:candidates})));
}
