import {createHash} from 'node:crypto';
import {access,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export const AUTHORING_PATH=path.join(root,'authoring/fish-assets.v1.json');
export const GENERATED_PATH=path.join(root,'fish-asset-authoring-generated.js');

const text=value=>String(value??'').trim();
const HTTPS=/^https:\/\//i;
const DATE=/^\d{4}-\d{2}-\d{2}$/;
const SHA256=/^[a-f0-9]{64}$/;
const SAFE_FILE=/^(?!\/)(?!.*(?:^|\/)\.\.(?:\/|$))[^?#]+$/;
const EXTERNAL_LICENSE=/^(?:CC0|Public domain|CC BY(?:-[A-Z]+)?(?: \d(?:\.\d)?)?|CC BY-SA(?: \d(?:\.\d)?)?)$/i;
const PROJECT_LICENSE='Project original';
const PROJECT_SOURCE='project-generated-original';
const RIGHTS=new Set(['unverified','verified','restricted']);
const TYPES=new Set(['sprite-sheet','file']);

const required=(value,label,errors)=>{if(!text(value))errors.push(`${label} is required`)};
const nullableText=(value,label,errors)=>{if(value!==null&&value!==undefined&&typeof value!=='string')errors.push(`${label} must be string or null`)};

function attributionRequired(license){return /^CC BY(?:-| |$)/i.test(text(license))}
function isProjectGenerated(record){return text(record?.source)===PROJECT_SOURCE}
function externalProvenanceComplete(p){
  return Boolean(
    p&&typeof p==='object'&&!Array.isArray(p)&&
    HTTPS.test(text(p.source_file_url))&&
    SHA256.test(text(p.source_sha256))&&
    SHA256.test(text(p.output_sha256))&&
    Array.isArray(p.transformations)&&p.transformations.length>0&&p.transformations.every(item=>text(item))&&
    text(p.transformation_notice)
  );
}
function generatedProvenanceComplete(p){
  return Boolean(
    p&&typeof p==='object'&&!Array.isArray(p)&&
    text(p.generator)&&
    text(p.model)&&
    SHA256.test(text(p.prompt_sha256))&&
    SHA256.test(text(p.output_sha256))&&
    DATE.test(text(p.generated_at))&&
    Array.isArray(p.transformations)&&p.transformations.length>0&&p.transformations.every(item=>text(item))&&
    text(p.transformation_notice)
  );
}
function provenanceComplete(record){
  if(text(record?.asset?.type)!=='file')return true;
  return isProjectGenerated(record)?generatedProvenanceComplete(record?.provenance):externalProvenanceComplete(record?.provenance);
}

export function publicationReady(record){
  if(text(record?.rights_status)!=='verified')return false;
  if(!DATE.test(text(record?.verified_at)))return false;
  if(isProjectGenerated(record)){
    if(text(record?.asset?.type)!=='file')return false;
    if(text(record?.license)!==PROJECT_LICENSE)return false;
    if(record?.source_url!=null&&text(record.source_url))return false;
    return generatedProvenanceComplete(record?.provenance);
  }
  if(!EXTERNAL_LICENSE.test(text(record?.license)))return false;
  if(!HTTPS.test(text(record?.source_url)))return false;
  if(attributionRequired(record.license)&&(!text(record.author)||!text(record.attribution)))return false;
  if(!provenanceComplete(record))return false;
  return true;
}

function validateAsset(asset,label,errors){
  if(!asset||typeof asset!=='object'||Array.isArray(asset)){errors.push(`${label}.asset is required`);return}
  if(!TYPES.has(text(asset.type)))errors.push(`${label}.asset.type must be sprite-sheet or file`);
  required(asset.file,`${label}.asset.file`,errors);
  if(text(asset.file)&&!SAFE_FILE.test(text(asset.file)))errors.push(`${label}.asset.file must be a safe relative path`);
  if(text(asset.type)==='sprite-sheet'){
    for(const key of ['slot','columns','rows'])if(!Number.isInteger(asset[key])||asset[key]<0||(key!=='slot'&&asset[key]===0))errors.push(`${label}.asset.${key} must be a valid integer`);
    if(Number.isInteger(asset.slot)&&Number.isInteger(asset.columns)&&Number.isInteger(asset.rows)&&asset.columns>0&&asset.rows>0&&asset.slot>=asset.columns*asset.rows)errors.push(`${label}.asset.slot exceeds sheet capacity`);
  }
}

function validateExternalProvenance(provenance,label,errors){
  if(!provenance||typeof provenance!=='object'||Array.isArray(provenance)){errors.push(`${label}.provenance is required for verified file assets`);return}
  required(provenance.source_file_url,`${label}.provenance.source_file_url`,errors);
  if(text(provenance.source_file_url)&&!HTTPS.test(text(provenance.source_file_url)))errors.push(`${label}.provenance.source_file_url must use https`);
  if(!SHA256.test(text(provenance.source_sha256)))errors.push(`${label}.provenance.source_sha256 must be lowercase SHA-256`);
  if(!SHA256.test(text(provenance.output_sha256)))errors.push(`${label}.provenance.output_sha256 must be lowercase SHA-256`);
  if(!Array.isArray(provenance.transformations)||!provenance.transformations.length||provenance.transformations.some(item=>!text(item)))errors.push(`${label}.provenance.transformations must be a non-empty string array`);
  required(provenance.transformation_notice,`${label}.provenance.transformation_notice`,errors);
}

function validateGeneratedProvenance(provenance,label,errors){
  if(!provenance||typeof provenance!=='object'||Array.isArray(provenance)){errors.push(`${label}.provenance is required for verified project-generated file assets`);return}
  required(provenance.generator,`${label}.provenance.generator`,errors);
  required(provenance.model,`${label}.provenance.model`,errors);
  if(!SHA256.test(text(provenance.prompt_sha256)))errors.push(`${label}.provenance.prompt_sha256 must be lowercase SHA-256`);
  if(!SHA256.test(text(provenance.output_sha256)))errors.push(`${label}.provenance.output_sha256 must be lowercase SHA-256`);
  if(!DATE.test(text(provenance.generated_at)))errors.push(`${label}.provenance.generated_at must be YYYY-MM-DD`);
  if(!Array.isArray(provenance.transformations)||!provenance.transformations.length||provenance.transformations.some(item=>!text(item)))errors.push(`${label}.provenance.transformations must be a non-empty string array`);
  required(provenance.transformation_notice,`${label}.provenance.transformation_notice`,errors);
}

function validateProvenance(record,label,errors){
  if(isProjectGenerated(record))validateGeneratedProvenance(record?.provenance,label,errors);
  else validateExternalProvenance(record?.provenance,label,errors);
}

function validateRecord(record,label,errors){
  if(!record||typeof record!=='object'||Array.isArray(record)){errors.push(`${label} must be an object`);return}
  required(record.species_name,`${label}.species_name`,errors);
  validateAsset(record.asset,label,errors);
  required(record.source,`${label}.source`,errors);
  for(const key of ['source_url','author','license','attribution','verified_at'])nullableText(record[key],`${label}.${key}`,errors);
  if(record.source_url!=null&&text(record.source_url)&&!HTTPS.test(text(record.source_url)))errors.push(`${label}.source_url must use https`);
  if(record.verified_at!=null&&text(record.verified_at)&&!DATE.test(text(record.verified_at)))errors.push(`${label}.verified_at must be YYYY-MM-DD`);
  if(!RIGHTS.has(text(record.rights_status)))errors.push(`${label}.rights_status must be unverified, verified, or restricted`);

  if(isProjectGenerated(record)){
    if(text(record.asset?.type)!=='file')errors.push(`${label} project-generated original must use a direct file asset`);
    if(text(record.license)!==PROJECT_LICENSE)errors.push(`${label}.license must be ${PROJECT_LICENSE} for project-generated original`);
    if(record.source_url!=null&&text(record.source_url))errors.push(`${label}.source_url must be null for project-generated original`);
  }else if(text(record.license)===PROJECT_LICENSE){
    errors.push(`${label}.license ${PROJECT_LICENSE} is reserved for ${PROJECT_SOURCE}`);
  }

  if(record.provenance!=null)validateProvenance(record,label,errors);
  if(text(record.rights_status)==='verified'&&text(record.asset?.type)==='file'&&record.provenance==null)validateProvenance(record,label,errors);
  if(text(record.rights_status)==='verified'&&!publicationReady(record))errors.push(`${label} verified rights are incomplete or not publication-safe`);
}

export function validateAuthoring(data){
  const errors=[];
  if(!data||typeof data!=='object'||Array.isArray(data))return ['authoring root must be an object'];
  if(data.version!=='FISH-ASSET-AUTHORING-1')errors.push('version must be FISH-ASSET-AUTHORING-1');
  if(data.policy!=='bundled-first-license-gated-remote-fallback')errors.push('unexpected fish asset policy');
  required(data.bundled_sheet,'bundled_sheet',errors);
  if(!Array.isArray(data.assets))errors.push('assets must be an array');
  if(errors.length)return errors;
  const names=new Set(),slots=new Set();
  for(const [index,record] of data.assets.entries()){
    const label=`assets[${index}]`;
    validateRecord(record,label,errors);
    const name=text(record?.species_name);
    if(name&&names.has(name))errors.push(`duplicate fish asset species: ${name}`);else if(name)names.add(name);
    const asset=record?.asset;
    if(asset?.type==='sprite-sheet'){
      const key=`${text(asset.file)}:${asset.slot}`;
      if(slots.has(key))errors.push(`duplicate fish asset slot: ${key}`);else slots.add(key);
    }
  }
  return errors;
}

const cloneProvenance=provenance=>{
  if(!provenance)return null;
  const out={};
  for(const key of ['source_file_url','source_sha256','generator','model','prompt_sha256','output_sha256','generated_at']){
    if(provenance[key]!=null)out[key]=text(provenance[key]);
  }
  if(Array.isArray(provenance.transformations))out.transformations=provenance.transformations.map(text);
  if(provenance.transformation_notice!=null)out.transformation_notice=text(provenance.transformation_notice);
  return out;
};

const cloneRecord=record=>({
  species_name:text(record.species_name),
  asset:{...record.asset,file:text(record.asset.file)},
  source:text(record.source),
  source_url:record.source_url==null?null:text(record.source_url),
  author:record.author==null?null:text(record.author),
  license:record.license==null?null:text(record.license),
  attribution:record.attribution==null?null:text(record.attribution),
  verified_at:record.verified_at==null?null:text(record.verified_at),
  rights_status:text(record.rights_status),
  ...(record.provenance?{provenance:cloneProvenance(record.provenance)}:{}),
  publication_ready:publicationReady(record)
});

export function toRuntimePayload(data){return {version:data.version,policy:data.policy,bundled_sheet:text(data.bundled_sheet),assets:data.assets.map(cloneRecord)}}
export function generateRuntimeSource(data){return `(()=>{globalThis.FISH_TARGET_FISH_ASSET_AUTHORING=Object.freeze(${JSON.stringify(toRuntimePayload(data))})})();\n`}
export async function loadAuthoring(){return JSON.parse(await readFile(AUTHORING_PATH,'utf8'))}

export async function verifyAssetFiles(data){
  for(const record of data.assets){
    const file=text(record.asset?.file);
    if(!file)continue;
    const target=path.join(root,file);
    await access(target).catch(()=>{throw new Error(`Fish asset file missing: ${file}`)});
    if(text(record.rights_status)==='verified'&&text(record.asset?.type)==='file'){
      const expected=text(record.provenance?.output_sha256);
      if(!SHA256.test(expected))throw new Error(`Fish asset output hash missing: ${record.species_name}`);
      const actual=createHash('sha256').update(await readFile(target)).digest('hex');
      if(actual!==expected)throw new Error(`Fish asset output hash mismatch: ${record.species_name}`);
    }
  }
}

async function main(){
  const data=await loadAuthoring();
  const errors=validateAuthoring(data);
  if(errors.length)throw new Error(`Fish asset authoring invalid:\n- ${errors.join('\n- ')}`);
  await verifyAssetFiles(data);
  const source=generateRuntimeSource(data);
  const check=process.argv.includes('--check');
  if(check){
    const current=await readFile(GENERATED_PATH,'utf8').catch(()=>null);
    if(current!==source)throw new Error('Generated fish asset runtime is stale. Run npm run fish-assets:generate.');
  }else await writeFile(GENERATED_PATH,source);
  const payload=toRuntimePayload(data);
  console.log(`FISH ASSET AUTHORING ${check?'CHECK':'GENERATE'} PASS ${JSON.stringify({assets:payload.assets.length,publicationReady:payload.assets.filter(record=>record.publication_ready).length})}`);
}

if(path.resolve(process.argv[1]||'')===fileURLToPath(import.meta.url))await main();