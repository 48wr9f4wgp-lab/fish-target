import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const project=await readFile(new URL('../ios/FishTargetLocal/project.yml',import.meta.url),'utf8');
const packageFile=await readFile(new URL('../ios/FishTargetLocal/Packages/LlamaBinary/Package.swift',import.meta.url),'utf8');
const appModel=await readFile(new URL('../ios/FishTargetLocal/Sources/FishTargetLocalAppModel.swift',import.meta.url),'utf8');
const catalog=await readFile(new URL('../ios/FishTargetLocal/Sources/ModelCatalog.swift',import.meta.url),'utf8');
const webView=await readFile(new URL('../ios/FishTargetLocal/Sources/FishTargetWebView.swift',import.meta.url),'utf8');
const bootstrap=await readFile(new URL('../ios/FishTargetLocal/bootstrap.sh',import.meta.url),'utf8');

test('iOS host pins llama.cpp XCFramework by checksum',()=>{
  assert.match(packageFile,/llama-b11146-xcframework\.zip/);
  assert.match(packageFile,/1c306afe9fe68a90c4bdc74619d8558d6e0754f085deb105dd2d70293a9a964f/);
});

test('iOS host pins the intended LFM2.5 instruct quant',()=>{
  assert.match(catalog,/LFM2\.5-1\.2B-Instruct-Q4_K_M\.gguf/);
  assert.match(catalog,/b1b3de114215d9507409a662a501a631095a479a419584e8a2ded6304b19b4f5/);
  assert.match(catalog,/LiquidAI\/LFM2\.5-1\.2B-Instruct-GGUF/);
});

test('iOS host loads bundled web app and native model',()=>{
  assert.match(project,/path: WebApp/);
  assert.match(project,/type: folder/);
  assert.match(webView,/loadFileURL/);
  assert.match(appModel,/LlamaFieldCoachEngine/);
  assert.match(appModel,/FieldCoachController/);
});

test('bootstrap builds and syncs web assets before Xcode generation',()=>{
  assert.match(bootstrap,/npm run build/);
  assert.match(bootstrap,/cp -R "\$ROOT_DIR\/dist\/\."/);
  assert.match(bootstrap,/xcodegen generate/);
});
