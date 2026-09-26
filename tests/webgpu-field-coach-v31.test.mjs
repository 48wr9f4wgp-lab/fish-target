import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const coach=await readFile(new URL('../webgpu-field-coach-v31.js',import.meta.url),'utf8');
const pwa=await readFile(new URL('../pwa.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');
const sw=await readFile(new URL('../sw.js',import.meta.url),'utf8');

test('webgpu coach uses Safari-compatible Transformers.js v4.3 WebGPU path',()=>{
  assert.match(coach,/@huggingface\/transformers@4\.3\.0/);
  assert.match(coach,/onnx-community\/LFM2\.5-350M-ONNX/);
  assert.match(coach,/device:'webgpu'/);
  assert.match(coach,/dtype:'q4f16'/);
  assert.match(coach,/navigator\.gpu/);
});

test('webgpu coach remains explanation-only and guards invented numbers',()=>{
  assert.match(coach,/計算、適合判定、安全判定、商品選択をしない/);
  assert.match(coach,/invented-number/);
  assert.match(coach,/fallbackText/);
  assert.doesNotMatch(coach,/localStorage\.(?:setItem|removeItem|clear)/);
});

test('model and wasm caching is explicitly enabled',()=>{
  assert.match(coach,/env\.useBrowserCache=true/);
  assert.match(coach,/env\.useWasmCache=true/);
  assert.match(coach,/fish-target-transformers-v31/);
  assert.match(sw,/cdn\.jsdelivr\.net/);
});

test('PWA/build include WebGPU coach assets',()=>{
  for(const asset of ['webgpu-field-coach-v31.js','webgpu-field-coach-v31.css'])assert.ok(build.includes("'"+asset+"'"),'build missing '+asset);
  assert.match(pwa,/webgpu-field-coach-v31-css/);
  assert.match(pwa,/webgpu-field-coach-v31-js/);
});
