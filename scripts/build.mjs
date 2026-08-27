import {cp, mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'dist');
if(output!==path.join(root,'dist'))throw new Error('Unsafe build output');

const config=JSON.parse(await readFile(path.join(root,'build.config.json'),'utf8'));
if(!/^V\d+(?:[.-][A-Za-z0-9]+)*$/.test(config.version))throw new Error('Invalid build version');
if(typeof config.features?.fieldLive!=='boolean')throw new Error('Missing fieldLive feature flag');
const buildId=config.version.toLowerCase();

const assets=[
  'style.css','quick-plan.css','field-mode.css','pwa.css',
  'continuity.css','tackle.css','fit-explain.css','simplify.css','visual-pass.css','visual-typography.css',
  'data.js','products.js','app.js','field-mode.js','pwa.js',
  'continuity.js','catalog-providers.js','catalog-adapters.js','catalog-daiwa-poc.js','catalog-fixtures.js','catalog.js','tackle.js','fit-explain.js','simplify.js','visual-pass.js',
  'manifest.webmanifest','icon.svg','apple-touch-icon.png','icon-192.png','icon-512.png','icon-maskable-512.png'
];
const shell=['./','./index.html',...assets.map(file=>`./${file}`)];

await rm(output,{recursive:true,force:true});
await mkdir(output,{recursive:true});
await Promise.all(assets.map(file=>cp(path.join(root,file),path.join(output,file))));

const replaceBuildTokens=source=>source
  .replaceAll('__BUILD_VERSION__',config.version)
  .replaceAll('__BUILD_ID__',buildId)
  .replaceAll('__FIELD_LIVE_STATE__',config.features.fieldLive?'on':'off');

const html=replaceBuildTokens(await readFile(path.join(root,'index.html'),'utf8'));
await writeFile(path.join(output,'index.html'),html);

const worker=replaceBuildTokens(await readFile(path.join(root,'sw.js'),'utf8'))
  .replace('__SHELL_MANIFEST__',JSON.stringify(shell,null,2));
await writeFile(path.join(output,'sw.js'),worker);

console.log(`Built ${config.version} to ${path.relative(root,output)} (${assets.length} assets)`);
