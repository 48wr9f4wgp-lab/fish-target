import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
const partsFor=v=>[1,2,3,4,5].map(i=>`target-method-data-v${v}-part${i}.js`);
const canonical=value=>String(value??'').trim().normalize('NFKC').toLowerCase();
const hash=value=>{let h=2166136261;for(const ch of canonical(value)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}return (h>>>0).toString(36)};
export const stableSpeciesId=name=>`species-${hash(name)}`;

export function loadSpeciesNames(){
  const context=vm.createContext({console});
  vm.runInContext(read('data.js'),context,{filename:'data.js'});
  for(const v of [1,2,3,4]){
    for(const file of partsFor(v))vm.runInContext(read(file),context,{filename:file});
    vm.runInContext(read(`target-method-data-v${v}.js`),context,{filename:`target-method-data-v${v}.js`});
  }
  const base=vm.runInContext('F.map(x=>x.name)',context);
  const expanded=context.FISH_TARGET_METHOD_EXPANSION_V4?.targets?.map(x=>x.name)||[];
  return [...base,...expanded];
}

export function loadRightsQueue(){
  const speciesNames=loadSpeciesNames();
  const authoring=JSON.parse(read('authoring/fish-assets.v1.json'));
  const bundled=new Set(authoring.assets.map(x=>x.species_name));
  const unique=[...new Set(speciesNames)];
  if(speciesNames.length!==60||unique.length!==60)throw new Error(`Expected 60 unique species, got ${speciesNames.length}/${unique.length}`);
  if(bundled.size!==19)throw new Error(`Expected 19 bundled species, got ${bundled.size}`);
  const missing=unique.filter(name=>!bundled.has(name));
  if(missing.length!==41)throw new Error(`Expected 41 rights-queue species, got ${missing.length}`);
  return Object.freeze(missing.map(species_name=>{
    const species_id=stableSpeciesId(species_name);
    return Object.freeze({
      queue_id:`fish-rights:${species_id}`,
      species_id,
      species_name,
      status:'needs-candidate',
      candidate_source_url:null,
      candidate_file_url:null,
      license:null,
      author:null,
      attribution:null,
      verified_at:null
    });
  }));
}

if(process.argv[1]&&new URL(`file://${process.argv[1]}`).href===import.meta.url){
  const queue=loadRightsQueue();
  console.log(JSON.stringify({count:queue.length,species:queue.map(x=>({species_id:x.species_id,species_name:x.species_name}))},null,2));
}
