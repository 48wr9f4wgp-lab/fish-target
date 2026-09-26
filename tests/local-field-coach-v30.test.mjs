import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const coach=await readFile(new URL('../local-field-coach-v30.js',import.meta.url),'utf8');
const css=await readFile(new URL('../local-field-coach-v30.css',import.meta.url),'utf8');
const pwa=await readFile(new URL('../pwa.js',import.meta.url),'utf8');
const build=await readFile(new URL('../scripts/build.mjs',import.meta.url),'utf8');

test('local coach is native-only and never uses network APIs',()=>{
  assert.match(coach,/webkit\?\.messageHandlers/);
  assert.match(coach,/fishTargetLocalLLM/);
  assert.doesNotMatch(coach,/fetch\s*\(/);
  assert.doesNotMatch(coach,/XMLHttpRequest/);
});

test('local coach constrains the LLM to explanation only',()=>{
  for(const token of ['use_only_facts:true','do_not_calculate:true','do_not_select_products:true','do_not_invent_numbers:true'])assert.ok(coach.includes(token),token);
  assert.match(coach,/max_sentences:3/);
  assert.match(coach,/render_field_coach/);
});

test('local coach output is rendered as text, not injected html',()=>{
  assert.match(coach,/answer\.textContent=output/);
  assert.doesNotMatch(coach,/answer\.innerHTML/);
  assert.match(coach,/fallbackText/);
});

test('PWA and build include local coach assets',()=>{
  for(const asset of ['local-field-coach-v30.js','local-field-coach-v30.css'])assert.ok(build.includes("'"+asset+"'"),'build missing '+asset);
  assert.match(pwa,/local-field-coach-v30-css/);
  assert.match(pwa,/local-field-coach-v30-js/);
  assert.ok(css.includes('.localFieldCoachV30'));
});