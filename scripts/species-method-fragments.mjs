import {access,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadAuthoring,validateAuthoring} from './species-method-authoring.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const FRAGMENT_MANIFEST_PATH=path.join(root,'authoring/species-method-fragment-manifest.v1.json');
const MANIFEST_VERSION='SPECIES-METHOD-FRAGMENT-MANIFEST-1';
const SAFE_FILE=/^authoring\/species-methods-[a-z0-9-]+\.v1\.json$/;
const SAFE_ID=/^[a-z0-9][a-z0-9-]*$/;
const clone=value=>JSON.parse(JSON.stringify(value));
const text=value=>String(value??'').trim();

async function exists(file){try{await access(file);return true}catch{return false}}

export async function loadFragmentManifest(){
  if(!(await exists(FRAGMENT_MANIFEST_PATH)))return {version:MANIFEST_VERSION,fragments:[]};
  const manifest=JSON.parse(await readFile(FRAGMENT_MANIFEST_PATH,'utf8'));
  const errors=[];
  if(!manifest||typeof manifest!=='object'||Array.isArray(manifest))errors.push('fragment manifest root must be an object');
  if(manifest?.version!==MANIFEST_VERSION)errors.push(`fragment manifest version must be ${MANIFEST_VERSION}`);
  if(!Array.isArray(manifest?.fragments))errors.push('fragment manifest fragments must be an array');
  const ids=new Set(),files=new Set();
  for(const [index,entry] of (Array.isArray(manifest?.fragments)?manifest.fragments:[]).entries()){
    const id=text(entry?.id),file=text(entry?.file),label=`fragments[${index}]`;
    if(!SAFE_ID.test(id))errors.push(`${label}.id must be lowercase kebab-case`);
    if(!SAFE_FILE.test(file))errors.push(`${label}.file must be an authoring/species-methods-*.v1.json path`);
    if(ids.has(id))errors.push(`duplicate fragment id: ${id}`);else if(id)ids.add(id);
    if(files.has(file))errors.push(`duplicate fragment file: ${file}`);else if(file)files.add(file);
  }
  if(errors.length)throw new Error(`Species/method fragment manifest invalid:\n- ${errors.join('\n- ')}`);
  return manifest;
}

export async function loadFragments(){
  const manifest=await loadFragmentManifest();
  const fragments=[];
  for(const entry of manifest.fragments){
    const file=path.join(root,entry.file);
    const data=JSON.parse(await readFile(file,'utf8'));
    const errors=validateAuthoring(data);
    if(errors.length)throw new Error(`Species/method fragment invalid (${entry.id}):\n- ${errors.join('\n- ')}`);
    fragments.push({id:entry.id,file:entry.file,data});
  }
  return fragments;
}

export function mergeAuthoring(base,fragments){
  const merged={version:'SPECIES-METHOD-AUTHORING-1',targets:clone(base.targets||[]),existing:[]};
  const existingMap=new Map();
  const addExisting=entry=>{
    const species=text(entry?.species);
    const target=existingMap.get(species)||{species,methods:[]};
    target.methods.push(...clone(entry?.methods||[]));
    existingMap.set(species,target);
  };
  for(const entry of base.existing||[])addExisting(entry);
  for(const fragment of fragments){
    merged.targets.push(...clone(fragment.data.targets||[]));
    for(const entry of fragment.data.existing||[])addExisting(entry);
  }
  merged.existing=[...existingMap.values()];
  const errors=validateAuthoring(merged);
  if(errors.length)throw new Error(`Combined species/method authoring invalid:\n- ${errors.join('\n- ')}`);
  return merged;
}

export async function loadCombinedAuthoring(){
  const base=await loadAuthoring();
  const fragments=await loadFragments();
  return mergeAuthoring(base,fragments);
}

async function main(){
  const fragments=await loadFragments();
  const combined=await loadCombinedAuthoring();
  const plans=combined.targets.reduce((n,target)=>n+1+(target.methods||[]).length,0)+combined.existing.reduce((n,entry)=>n+(entry.methods||[]).length,0);
  console.log(`SPECIES METHOD FRAGMENTS CHECK PASS ${JSON.stringify({fragments:fragments.length,authoredTargets:combined.targets.length,existingBlocks:combined.existing.length,authoredPlans:plans})}`);
}

if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url))await main();
