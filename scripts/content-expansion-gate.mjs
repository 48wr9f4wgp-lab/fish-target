import {spawnSync} from 'node:child_process';

const npm=process.platform==='win32'?'npm.cmd':'npm';
const commands=[
  [process.execPath,['scripts/content-expansion-readiness.mjs','--check'],'content readiness'],
  [process.execPath,['scripts/catalog-contract-qa.mjs'],'catalog contract'],
  [npm,['test'],'full node/build regression']
];

for(const [command,args,label] of commands){
  console.log(`CONTENT GATE · ${label}`);
  const result=spawnSync(command,args,{stdio:'inherit',env:process.env});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(`${label} failed with exit ${result.status}`);
}
console.log('CONTENT EXPANSION GATE PASS');
