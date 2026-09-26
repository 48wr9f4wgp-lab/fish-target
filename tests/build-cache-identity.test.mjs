import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,cp,readFile,appendFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

test('code-only updates change the SW cache even without a version bump',async()=>{
  const root=fileURLToPath(new URL('../',import.meta.url));
  const temp=await mkdtemp(path.join(tmpdir(),'fish-cache-audit-'));
  try{
    await cp(root,temp,{recursive:true,filter:source=>!['.git','node_modules','dist'].includes(path.basename(source))});
    const build=async()=>{
      const result=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:temp,encoding:'utf8'});
      assert.equal(result.status,0,result.stderr);
      return readFile(path.join(temp,'dist/sw.js'),'utf8');
    };
    const before=await build();
    assert.equal(await build(),before,'same source produces a deterministic worker');
    await appendFile(path.join(temp,'app.js'),'\n// code-only cache regression fixture\n');
    const after=await build();
    assert.notEqual(after.match(/const CACHE='([^']+)'/)[1],before.match(/const CACHE='([^']+)'/)[1]);
  }finally{await rm(temp,{recursive:true,force:true})}
});
