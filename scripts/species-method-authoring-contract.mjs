import {readFile} from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
import {GENERATED_PATH,generateRuntimeSource,loadAuthoring,validateAuthoring} from './species-method-authoring.mjs';
import {loadCombinedAuthoring} from './species-method-fragments.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const text=value=>String(value??'').trim();
const canonical=value=>text(value).normalize('NFKC').toLowerCase();
const errors=[];
const baseData=await loadAuthoring();
const data=await loadCombinedAuthoring();
errors.push(...validateAuthoring(data));
const generated=await readFile(GENERATED_PATH,'utf8').catch(()=>null);
if(generated!==generateRuntimeSource(baseData))errors.push('base generated authoring payload is stale; run npm run authoring:generate');

const context=vm.createContext({console});
context.globalThis=context;
const files=['data.js'];
for(let version=1;version<=4;version++){
  for(let part=1;part<=5;part++)files.push(`target-method-data-v${version}-part${part}.js`);
  files.push(`target-method-data-v${version}.js`);
}
for(const file of files){
  const source=await readFile(path.join(root,file),'utf8');
  vm.runInContext(source,context,{filename:file});
}
const baseRows=vm.runInContext('F.map(x=>({name:x.name,syn:Array.isArray(x.syn)?x.syn:[]}))',context);
const expansion=context.FISH_TARGET_METHOD_EXPANSION_V1||{targets:[],existing:{}};
const currentNames=new Set();
const currentAliases=new Map();
const methodIds=new Map();
const addAlias=(alias,name)=>{
  const key=canonical(alias);if(!key)return;
  const owners=currentAliases.get(key)||new Set();owners.add(name);currentAliases.set(key,owners);
};
const idsFor=name=>{if(!methodIds.has(name))methodIds.set(name,new Set(['default']));return methodIds.get(name)};

for(const row of baseRows){currentNames.add(row.name);addAlias(row.name,row.name);for(const alias of row.syn)addAlias(alias,row.name);idsFor(row.name)}
for(const target of expansion.targets||[]){
  currentNames.add(target.name);addAlias(target.name,target.name);for(const alias of target.syn||[])addAlias(alias,target.name);
  const ids=idsFor(target.name);
  for(const method of (target.methods||[]).slice(1)){const id=text(method?.id);if(id)ids.add(id)}
}
for(const [name,methods] of Object.entries(expansion.existing||{})){
  const ids=idsFor(name);
  for(const method of methods||[]){const id=text(method?.id);if(id)ids.add(id)}
}

for(const target of data.targets||[]){
  if(currentNames.has(target.name))errors.push(`authoring target already exists: ${target.name}`);
  for(const alias of [target.name,...(target.aliases||[])]){
    const owners=currentAliases.get(canonical(alias));
    if(owners?.size)errors.push(`authoring alias already used by current target: ${alias} -> ${[...owners].join(', ')}`);
  }
}
for(const entry of data.existing||[]){
  if(!currentNames.has(entry.species)){errors.push(`authoring existing species not found: ${entry.species}`);continue}
  const ids=idsFor(entry.species);
  for(const method of entry.methods||[]){
    const id=text(method?.id);
    if(ids.has(id))errors.push(`authoring method id already exists for ${entry.species}: ${id}`);
  }
}

if(errors.length)throw new Error(`SPECIES METHOD AUTHORING CONTRACT FAIL\n- ${errors.join('\n- ')}`);
const authoredPlans=(data.targets||[]).reduce((sum,target)=>sum+1+(target.methods||[]).length,0)+(data.existing||[]).reduce((sum,entry)=>sum+(entry.methods||[]).length,0);
console.log(`SPECIES METHOD AUTHORING CONTRACT PASS ${JSON.stringify({currentTargets:currentNames.size,currentPlans:[...methodIds.values()].reduce((sum,ids)=>sum+ids.size,0),authoredTargets:data.targets.length,authoredExisting:data.existing.length,authoredPlans})}`);
