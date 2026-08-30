import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const AUTHORING_PATH=path.join(root,'authoring/species-methods.v1.json');
export const GENERATED_PATH=path.join(root,'species-method-authoring-generated.js');

const text=value=>String(value??'').trim();
const canonical=value=>text(value).normalize('NFKC').toLowerCase();
const METHOD_ID=/^[a-z0-9][a-z0-9_-]*$/;
const SPECIES_ID=/^[a-z0-9][a-z0-9-]{2,63}$/;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const HTTP=/^https?:\/\//i;
const STYLES=new Set(['bait','lure']);
const WATERS=new Set(['salt','fresh']);
const CONFIDENCE=new Set(['A','B','C']);
const SEASONS=['春','夏','秋','冬'];

const hasText=(value,label,errors)=>{if(!text(value))errors.push(`${label} is required`)};
const hasArray=(value,label,errors,min=1)=>{if(!Array.isArray(value)||value.length<min)errors.push(`${label} must contain at least ${min}`)};

function validateSource(source,label,errors){
  if(!source||typeof source!=='object'||Array.isArray(source)){errors.push(`${label}.source is required`);return}
  hasText(source.provider,`${label}.source.provider`,errors);
  hasText(source.url,`${label}.source.url`,errors);
  if(text(source.url)&&!HTTP.test(text(source.url)))errors.push(`${label}.source.url must be http(s)`);
  hasText(source.reviewed_at,`${label}.source.reviewed_at`,errors);
  if(text(source.reviewed_at)&&!DATE.test(text(source.reviewed_at)))errors.push(`${label}.source.reviewed_at must be YYYY-MM-DD`);
  hasText(source.evidence,`${label}.source.evidence`,errors);
  if(!CONFIDENCE.has(text(source.confidence)))errors.push(`${label}.source.confidence must be A, B, or C`);
}

function validateMethod(method,label,errors,{allowDefault=false}={}){
  if(!method||typeof method!=='object'||Array.isArray(method)){errors.push(`${label} must be an object`);return}
  const id=text(method.id);
  if(!allowDefault){
    if(!METHOD_ID.test(id))errors.push(`${label}.id must be a stable lowercase id`);
    if(id==='default')errors.push(`${label}.id must not be default`);
  }else if(id&&id!=='default')errors.push(`${label}.id must be omitted or default for a default method`);
  hasText(method.method,`${label}.method`,errors);
  if(!STYLES.has(text(method.style)))errors.push(`${label}.style must be bait or lure`);
  hasText(method.why,`${label}.why`,errors);
  const req=method.requirements;
  if(!req||typeof req!=='object'||Array.isArray(req))errors.push(`${label}.requirements is required`);
  else for(const key of ['rod','reel','line','leader','rig'])hasText(req[key],`${label}.requirements.${key}`,errors);
  const first=method.first_cast;
  if(!first||typeof first!=='object'||Array.isArray(first))errors.push(`${label}.first_cast is required`);
  else for(const key of ['bait','size','color','bait_action','range','action','time'])hasText(first[key],`${label}.first_cast.${key}`,errors);
  hasArray(method.steps,`${label}.steps`,errors,3);
  hasArray(method.places,`${label}.places`,errors,1);
  hasArray(method.mistakes,`${label}.mistakes`,errors,1);
  validateSource(method.source,label,errors);
}

export function validateAuthoring(data){
  const errors=[];
  if(!data||typeof data!=='object'||Array.isArray(data))return ['authoring root must be an object'];
  if(data.version!=='SPECIES-METHOD-AUTHORING-1')errors.push('version must be SPECIES-METHOD-AUTHORING-1');
  if(!Array.isArray(data.targets))errors.push('targets must be an array');
  if(!Array.isArray(data.existing))errors.push('existing must be an array');
  if(errors.length)return errors;

  const speciesIds=new Set(),names=new Set(),aliases=new Map();
  for(const [index,target] of data.targets.entries()){
    const label=`targets[${index}]`;
    if(!target||typeof target!=='object'||Array.isArray(target)){errors.push(`${label} must be an object`);continue}
    const speciesId=text(target.species_id),name=text(target.name);
    if(!SPECIES_ID.test(speciesId))errors.push(`${label}.species_id must be a stable lowercase slug`);
    if(speciesIds.has(speciesId))errors.push(`duplicate species_id: ${speciesId}`);else if(speciesId)speciesIds.add(speciesId);
    hasText(name,`${label}.name`,errors);
    if(names.has(name))errors.push(`duplicate species name: ${name}`);else if(name)names.add(name);
    if(!WATERS.has(text(target.water)))errors.push(`${label}.water must be salt or fresh`);
    hasText(target.shape,`${label}.shape`,errors);
    hasArray(target.tags,`${label}.tags`,errors,1);
    if(target.aliases!=null&&!Array.isArray(target.aliases))errors.push(`${label}.aliases must be an array`);
    hasText(target.difficulty,`${label}.difficulty`,errors);
    if(!target.season||typeof target.season!=='object'||Array.isArray(target.season))errors.push(`${label}.season is required`);
    else for(const season of SEASONS)hasText(target.season[season],`${label}.season.${season}`,errors);
    const targetAliases=[name,...(Array.isArray(target.aliases)?target.aliases:[])].map(text).filter(Boolean);
    for(const alias of targetAliases){
      const key=canonical(alias),owner=aliases.get(key);
      if(owner&&owner!==name)errors.push(`authoring alias collision: ${alias} (${owner} / ${name})`);else aliases.set(key,name);
    }
    validateMethod(target.default_method,`${label}.default_method`,errors,{allowDefault:true});
    if(target.methods!=null&&!Array.isArray(target.methods))errors.push(`${label}.methods must be an array`);
    const methodIds=new Set(['default']);
    for(const [mIndex,method] of (Array.isArray(target.methods)?target.methods:[]).entries()){
      validateMethod(method,`${label}.methods[${mIndex}]`,errors);
      const id=text(method?.id);if(id&&methodIds.has(id))errors.push(`duplicate method id for ${name}: ${id}`);else if(id)methodIds.add(id);
    }
  }

  const existingSpecies=new Set();
  for(const [index,entry] of data.existing.entries()){
    const label=`existing[${index}]`;
    if(!entry||typeof entry!=='object'||Array.isArray(entry)){errors.push(`${label} must be an object`);continue}
    const species=text(entry.species);hasText(species,`${label}.species`,errors);
    if(existingSpecies.has(species))errors.push(`duplicate existing species block: ${species}`);else if(species)existingSpecies.add(species);
    hasArray(entry.methods,`${label}.methods`,errors,1);
    const ids=new Set();
    for(const [mIndex,method] of (Array.isArray(entry.methods)?entry.methods:[]).entries()){
      validateMethod(method,`${label}.methods[${mIndex}]`,errors);
      const id=text(method?.id);if(id&&ids.has(id))errors.push(`duplicate authored method id for ${species}: ${id}`);else if(id)ids.add(id);
    }
  }
  return errors;
}

const flattenMethod=(method,id)=>({
  id,
  method:text(method.method),
  style:text(method.style),
  why:text(method.why),
  rod:text(method.requirements?.rod),
  reel:text(method.requirements?.reel),
  line:text(method.requirements?.line),
  leader:text(method.requirements?.leader),
  rig:text(method.requirements?.rig),
  bait:text(method.first_cast?.bait),
  size:text(method.first_cast?.size),
  color:text(method.first_cast?.color),
  baitAction:text(method.first_cast?.bait_action),
  range:text(method.first_cast?.range),
  action:text(method.first_cast?.action),
  time:text(method.first_cast?.time),
  steps:[...(method.steps||[])],
  places:[...(method.places||[])],
  ...(text(method.difficulty)?{difficulty:text(method.difficulty)}:{}),
  mistakes:[...(method.mistakes||[])],
  source:{...method.source}
});

export function toRuntimePayload(data){
  const targets=data.targets.map(target=>({
    species_id:text(target.species_id),
    name:text(target.name),
    water:text(target.water),
    shape:text(target.shape),
    tags:[...target.tags],
    syn:[...(target.aliases||[])],
    difficulty:text(target.difficulty),
    season:{...target.season},
    methods:[flattenMethod(target.default_method,'default'),...(target.methods||[]).map(method=>flattenMethod(method,text(method.id)))]
  }));
  const existing={};
  for(const entry of data.existing)existing[text(entry.species)]=entry.methods.map(method=>flattenMethod(method,text(method.id)));
  return {version:data.version,targets,existing};
}

export function generateRuntimeSource(data){
  const payload=toRuntimePayload(data);
  return `(()=>{const payload=${JSON.stringify(payload)};globalThis.FISH_TARGET_SPECIES_METHOD_AUTHORING=Object.freeze(payload)})();\n`;
}

export async function loadAuthoring(){return JSON.parse(await readFile(AUTHORING_PATH,'utf8'))}

async function main(){
  const data=await loadAuthoring();
  const errors=validateAuthoring(data);
  if(errors.length)throw new Error(`Species/method authoring invalid:\n- ${errors.join('\n- ')}`);
  const source=generateRuntimeSource(data);
  const check=process.argv.includes('--check');
  if(check){
    const current=await readFile(GENERATED_PATH,'utf8').catch(()=>null);
    if(current!==source)throw new Error('Generated authoring runtime is stale. Run npm run authoring:generate.');
  }else await writeFile(GENERATED_PATH,source);
  const payload=toRuntimePayload(data);
  console.log(`SPECIES METHOD AUTHORING ${check?'CHECK':'GENERATE'} PASS ${JSON.stringify({targets:payload.targets.length,existing:Object.keys(payload.existing).length,plans:payload.targets.reduce((n,x)=>n+x.methods.length,0)+Object.values(payload.existing).reduce((n,x)=>n+x.length,0)})}`);
}

if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url))await main();
