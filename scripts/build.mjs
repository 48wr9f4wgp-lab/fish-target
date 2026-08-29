import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {generateIcons} from './generate-icons.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
if(output!==path.join(root,'dist'))throw new Error('Unsafe build output');

const config=JSON.parse(await readFile(path.join(root,'build.config.json'),'utf8'));
if(!/^V\d+(?:[.-][A-Za-z0-9]+)*$/.test(config.version))throw new Error('Invalid build version');
if(typeof config.features?.fieldLive!=='boolean')throw new Error('Missing fieldLive feature flag');
const buildId=config.version.toLowerCase();

const catalogManifest=JSON.parse(await readFile(path.join(root,'catalog-batch-manifest.json'),'utf8'));
if(!catalogManifest||!Array.isArray(catalogManifest.batches))throw new Error('Invalid catalog batch manifest');
const batchIds=new Set(),batchFiles=[];
for(const batch of catalogManifest.batches){
  if(!batch?.id||batchIds.has(batch.id))throw new Error(`Invalid/duplicate catalog batch id: ${batch?.id||'missing'}`);
  batchIds.add(batch.id);
  if(!Array.isArray(batch.files)||!batch.files.length)throw new Error(`Catalog batch has no files: ${batch.id}`);
  for(const file of batch.files){if(!batchFiles.includes(file))batchFiles.push(file)}
}
const lazyRuntimeAssets=['catalog-providers.js','catalog-adapters.js',...batchFiles,'catalog-fixtures.js','catalog.js'];
const copiedAssets=[
  'style.css','quick-plan.css','field-mode.css','pwa.css',
  'continuity.css','target-methods-v1.css','tackle.css','fit-explain.css','simplify.css','visual-pass.css','visual-typography.css','fish-real.css','visual-v8.css','result-ux-v20.css','result-ux-v23.css','visual-v24.css',
  'data.js','products.js','app.js','field-mode.js','pwa.js',
  'continuity.js',
  'target-method-data-v1-part1.js','target-method-data-v1-part2.js','target-method-data-v1-part3.js','target-method-data-v1-part4.js','target-method-data-v1-part5.js','target-method-data-v1.js',
  'target-method-data-v2-part1.js','target-method-data-v2-part2.js','target-method-data-v2-part3.js','target-method-data-v2-part4.js','target-method-data-v2-part5.js','target-method-data-v2.js',
  'target-method-data-v3-part1.js','target-method-data-v3-part2.js','target-method-data-v3-part3.js','target-method-data-v3-part4.js','target-method-data-v3-part5.js','target-method-data-v3.js',
  'target-method-data-v4-part1.js','target-method-data-v4-part2.js','target-method-data-v4-part3.js','target-method-data-v4-part4.js','target-method-data-v4-part5.js','target-method-data-v4.js','target-methods-v1.js',
  'catalog-batch-manifest.json','catalog-loader.js',...lazyRuntimeAssets,'tackle.js','fit-explain.js','simplify.js','visual-pass.js','fish-real.js','visual-v8.js','result-ux-v20.js','result-ux-v21.js','result-ux-v23.js',
  'fish-real-v7.avif',
  'manifest.webmanifest','icon.svg'
];
const generatedAssets=['apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-512.png'];
const shellAssets=copiedAssets.filter(file=>!lazyRuntimeAssets.includes(file));
const shell=['./','./index.html',...shellAssets.map(file=>`./${file}`),...generatedAssets.map(file=>`./${file}`)];

await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await Promise.all(copiedAssets.map(file=>cp(path.join(root,file),path.join(output,file))));
await generateIcons(output);

const replaceBuildTokens=source=>source
  .replaceAll('__BUILD_VERSION__',config.version)
  .replaceAll('__BUILD_ID__',buildId)
  .replaceAll('__FIELD_LIVE_STATE__',config.features.fieldLive?'on':'off');

const html=replaceBuildTokens(await readFile(path.join(root,'index.html'),'utf8'));
await writeFile(path.join(output,'index.html'),html);

const worker=replaceBuildTokens(await readFile(path.join(root,'sw.js'),'utf8'))
  .replace('__SHELL_MANIFEST__',JSON.stringify(shell,null,2));
await writeFile(path.join(output,'sw.js'),worker);

console.log(`Built ${config.version} to ${path.relative(root,output)} (${copiedAssets.length+generatedAssets.length} assets; ${lazyRuntimeAssets.length} lazy runtime assets in ${catalogManifest.batches.length} batches)`);
