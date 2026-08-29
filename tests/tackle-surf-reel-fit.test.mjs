import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
const read=file=>readFileSync(new URL(`../${file}`,import.meta.url),'utf8');
function tackleLogic(){const context=vm.createContext({console});const source=read('tackle.js').split('  const best=')[0]+'\n})();';vm.runInContext(source,context,{filename:'tackle.js'});return context.FISH_TARGET_TACKLE_LOGIC}

test('explicit casting-reel plans prefer a known surf reel over a generic reel',()=>{const {reelFit}=tackleLogic();const plan={reel:'投げ専用リール',line:'PE 0.8〜1.2号'};const surf={size:null,reelSizeRaw:'35',applicationRaw:'投げ・遠投',dragTypeRaw:'ドラグなし',lineType:'PE',lineNo:1};const generic={size:4000,lineType:'PE',lineNo:1};assert.equal(reelFit(surf,plan).level,0);assert.equal(reelFit(generic,plan).level,1)});

test('ordinary spinning-size plans do not force dedicated surf classification',()=>{const {reelFit}=tackleLogic();const plan={reel:'3000〜5000番',line:'PE 0.8〜1.2号'};const surf={size:null,reelSizeRaw:'35',applicationRaw:'投げ・遠投',lineType:'PE',lineNo:1};const generic={size:4000,lineType:'PE',lineNo:1};assert.equal(reelFit(surf,plan).level,1);assert.equal(reelFit(generic,plan).level,0)});

test('drag type is evaluated only when the plan explicitly requires it',()=>{const {reelFit}=tackleLogic();const plan={reel:'投げ専用リール・ドラグあり',line:'PE 1.5〜3号'};const drag={applicationRaw:'投げ・遠投',dragTypeRaw:'ドラグあり',lineType:'PE',lineNo:2};const noDrag={applicationRaw:'投げ・遠投',dragTypeRaw:'ドラグなし',lineType:'PE',lineNo:2};assert.equal(reelFit(drag,plan).level,0);assert.equal(reelFit(noDrag,plan).level,2)});
