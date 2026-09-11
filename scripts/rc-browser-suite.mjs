import {spawnSync} from 'node:child_process';

// The final RC contract must not depend on the author's branch prefix.
export const suite=Object.freeze([
  'startup-boot-browser-qa',
  'content-expansion-browser-qa',
  'result-ux-v20-browser-qa',
  'visual-v24-browser-qa',
  'visual-v25-browser-qa',
  'app-shell-v26-browser-qa',
  'pack-game-feel-v28-browser-qa',
  'tackle-auto-build-v29-browser-qa',
  'rc-storage-resilience-browser-qa',
  'publication-browser-qa'
]);
for(const name of suite){
  const result=spawnSync(process.execPath,[`scripts/${name}.mjs`],{stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status||1);
}
