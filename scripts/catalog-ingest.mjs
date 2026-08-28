import {mkdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';

const CATEGORIES=new Set(['rod','reel']);
const STATUSES=new Set(['current','discontinued','legacy','unknown']);
const LICENSES=new Set(['synthetic','internal','permitted','licensed','restricted','unknown']);
const NUMERIC_SPECS=new Set(['length_ft','length_m','pieces','weight_g','lure_min_g','lure_max_g','jig_max_g','line_pe_min','line_pe_max','reel_size','gear_ratio','retrieve_cm','max_drag_kg']);
const text=v=>String(v??'').trim();
const canonical=v=>text(v).normalize('NFKC').toLowerCase();
const finite=v=>v===null||v===undefined||v===''?null:Number.isFinite(Number(v))?Number(v):null;
const clone=v=>JSON.parse(JSON.stringify(v));

function rowKey(row){return [row.maker,row.category,row.series,row.generation,row.model].map(canonical).join('|')}

function normalizeRow(input,index=0){
  if(!input||typeof input!=='object'||Array.isArray(input))throw new Error(`row ${index}: object required`);
  if('productionEnabled' in input)throw new Error(`row ${index}: productionEnabled is provider policy, not catalog data`);
  const maker=text(input.maker).toUpperCase();
  const category=text(input.category);
  const series=text(input.series);
  const generation=text(input.generation)||'unknown';
  const model=text(input.model);
  const display_name=text(input.display_name)||`${series} ${model}`.trim();
  const status=text(input.status)||'unknown';
  if(!maker)throw new Error(`row ${index}: maker required`);
  if(!CATEGORIES.has(category))throw new Error(`row ${index}: unsupported category ${category||'missing'}`);
  if(!series)throw new Error(`row ${index}: series required`);
  if(!model)throw new Error(`row ${index}: model required`);
  if(!STATUSES.has(status))throw new Error(`row ${index}: invalid status ${status}`);

  const specs={};
  for(const [key,value] of Object.entries(input.specs||{})){
    if(NUMERIC_SPECS.has(key)){
      if(value===null||value===undefined||value===''){specs[key]=null;continue}
      const n=finite(value);
      if(n===null||n<0)throw new Error(`row ${index}: invalid numeric spec ${key}`);
      specs[key]=n;
    }else specs[key]=typeof value==='string'?value.trim():clone(value);
  }
  if(finite(specs.lure_min_g)!==null&&finite(specs.lure_max_g)!==null&&specs.lure_min_g>specs.lure_max_g)throw new Error(`row ${index}: lure range reversed`);
  if(finite(specs.line_pe_min)!==null&&finite(specs.line_pe_max)!==null&&specs.line_pe_min>specs.line_pe_max)throw new Error(`row ${index}: PE range reversed`);

  const source=input.source;
  if(!source||typeof source!=='object'||Array.isArray(source))throw new Error(`row ${index}: source required`);
  if('productionEnabled' in source)throw new Error(`row ${index}: productionEnabled is provider policy, not source data`);
  const license_status=text(source.license_status);
  if(!LICENSES.has(license_status))throw new Error(`row ${index}: invalid license_status ${license_status||'missing'}`);
  const source_provider=text(source.source_provider);
  const source_type=text(source.source_type);
  if(!source_type)throw new Error(`row ${index}: source_type required`);
  if(source_type!=='synthetic'&&!source_provider)throw new Error(`row ${index}: source_provider required`);
  const source_url=source.source_url==null?null:text(source.source_url);
  if(source_url&&!/^https:\/\//i.test(source_url))throw new Error(`row ${index}: source_url must use https`);
  const normalizedSource={source_type,source_provider:source_provider||'unknown',source_url,retrieved_at:text(source.retrieved_at)||null,last_verified:text(source.last_verified)||null,license_status};

  const identifiers={};
  const jan=text(input.identifiers?.jan);
  if(jan){
    if(!/^\d{13}$/.test(jan))throw new Error(`row ${index}: JAN must be exactly 13 digits`);
    identifiers.jan=jan;
  }
  return {maker,category,series,generation,model,display_name,status,specs,source:normalizedSource,identifiers};
}

export function prepareRows(input,{expectedMaker=null,requireOfficial=false}={}){
  const list=Array.isArray(input)?input:Array.isArray(input?.rows)?input.rows:null;
  if(!list)throw new Error('input must be an array or {rows:[...]}');
  const rows=list.map((row,index)=>normalizeRow(row,index));
  const seenKeys=new Map(),seenJan=new Map();
  for(let i=0;i<rows.length;i++){
    const row=rows[i];
    if(expectedMaker&&row.maker!==String(expectedMaker).toUpperCase())throw new Error(`row ${i}: expected maker ${expectedMaker}, got ${row.maker}`);
    if(requireOfficial&&row.source.source_type!=='manufacturer_official')throw new Error(`row ${i}: manufacturer_official source required`);
    const key=rowKey(row);
    if(seenKeys.has(key))throw new Error(`row ${i}: duplicate product key with row ${seenKeys.get(key)}`);
    seenKeys.set(key,i);
    const jan=row.identifiers.jan;
    if(jan){if(seenJan.has(jan))throw new Error(`row ${i}: duplicate JAN with row ${seenJan.get(jan)}`);seenJan.set(jan,i)}
  }
  rows.sort((a,b)=>[a.maker,a.category,a.series,a.generation,a.model].map(canonical).join('|').localeCompare([b.maker,b.category,b.series,b.generation,b.model].map(canonical).join('|'),'en'));
  return rows;
}

const frozenRowsSource=rows=>`Object.freeze(${JSON.stringify(rows)}.map(row=>Object.freeze({...row,specs:Object.freeze({...row.specs}),source:Object.freeze({...row.source}),identifiers:Object.freeze({...row.identifiers})})))`;

export function renderModule(rows,globalName){
  if(!/^FISH_TARGET_[A-Z0-9_]+_ROWS$/.test(globalName))throw new Error('globalName must match FISH_TARGET_*_ROWS');
  return `(()=>{\n  globalThis.${globalName}=${frozenRowsSource(rows)};\n})();\n`;
}

export function renderBatchModule(rows,batchId){
  if(!/^[a-z0-9][a-z0-9-]*$/.test(batchId))throw new Error('batchId must be lowercase kebab-case');
  return `(()=>{\n  const batch=Object.freeze({id:${JSON.stringify(batchId)},rows:${frozenRowsSource(rows)}});\n  const registry=globalThis.FISH_TARGET_CATALOG_BATCH_ROWS||(globalThis.FISH_TARGET_CATALOG_BATCH_ROWS=[]);\n  if(registry.some(x=>x?.id===batch.id))throw new Error('Duplicate catalog batch id: '+batch.id);\n  registry.push(batch);\n})();\n`;
}

function argsOf(argv){
  const result={};
  for(let i=0;i<argv.length;i++){
    const token=argv[i];
    if(token==='--require-official'){result.requireOfficial=true;continue}
    if(!token.startsWith('--'))throw new Error(`unexpected argument ${token}`);
    const key=token.slice(2),value=argv[++i];
    if(value===undefined||value.startsWith('--'))throw new Error(`missing value for --${key}`);
    result[key]=value;
  }
  return result;
}

export async function runCli(argv=process.argv.slice(2)){
  const args=argsOf(argv);
  if(!args.input||!args.output||(!args.global&&!args['batch-id']))throw new Error('usage: node scripts/catalog-ingest.mjs --input batch.json --output catalog-batch.js (--global FISH_TARGET_VENDOR_ROWS | --batch-id maker-series-id) [--expected-maker DAIWA] [--require-official]');
  if(args.global&&args['batch-id'])throw new Error('choose either --global or --batch-id');
  const inputPath=path.resolve(args.input),outputPath=path.resolve(args.output);
  const parsed=JSON.parse(await readFile(inputPath,'utf8'));
  const rows=prepareRows(parsed,{expectedMaker:args['expected-maker']||null,requireOfficial:Boolean(args.requireOfficial)});
  await mkdir(path.dirname(outputPath),{recursive:true});
  const moduleSource=args['batch-id']?renderBatchModule(rows,args['batch-id']):renderModule(rows,args.global);
  await writeFile(outputPath,moduleSource);
  const summary={rows:rows.length,makers:[...new Set(rows.map(r=>r.maker))],categories:Object.fromEntries([...CATEGORIES].map(category=>[category,rows.filter(r=>r.category===category).length])),jans:rows.filter(r=>r.identifiers.jan).length,official:rows.filter(r=>r.source.source_type==='manufacturer_official').length,batch_id:args['batch-id']||null,output:outputPath};
  console.log(JSON.stringify(summary));
  return summary;
}

if(import.meta.url===pathToFileURL(process.argv[1]||'').href){runCli().catch(error=>{console.error(error.message);process.exitCode=1})}
