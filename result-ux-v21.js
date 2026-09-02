(()=>{
  const KEY='fish_target_v17_tackle';
  const CORE=new Set(['長さ','パワー','重量上限','番手','用途']);
  const api=()=>globalThis.FISH_TARGET_RESULT_UX_V20;
  const read=()=>{try{const raw=typeof storeGet==='function'?storeGet(KEY):localStorage.getItem(KEY);const x=raw?JSON.parse(raw):{};return {rods:Array.isArray(x.rods)?x.rods:[],reels:Array.isArray(x.reels)?x.reels:[]}}catch{return {rods:[],reels:[]}}};
  const score=rows=>{if(!rows.length)return 11;const max=Math.max(...rows.map(x=>x.level));return max*10+rows.reduce((n,x)=>n+x.level,0)};
  const pickBest=(items,fn)=>items.map(item=>({item,rows:fn(item)})).sort((a,b)=>score(a.rows)-score(b.rows))[0]||null;
  const knownDeviation=row=>row?.level===1&&CORE.has(row.name)&&!/未入力|不明|号数入力/.test(String(row.owned||''));
  const issue=row=>row?`${row.name}: ${row.owned} → 推奨 ${row.target}`:'主要条件は推奨範囲内';
  function decision(rows){
    const hard=rows.filter(x=>x.level===2),soft=rows.filter(x=>x.level===1),knownCore=soft.filter(knownDeviation);
    if(hard.length)return {level:2,title:'このセットは見直し推奨',sub:issue(hard[0])};
    if(knownCore.length>=2)return {level:2,title:'このセットは見直し推奨',sub:`${knownCore.slice(0,2).map(x=>x.name).join('・')}が推奨より不足`};
    if(soft.length)return {level:1,title:'条件付きで使える',sub:issue(soft[0])};
    return {level:0,title:'このセットでOK',sub:'主要条件は推奨範囲内'};
  }
  function applyChrome(){
    const brand=document.querySelector('#result .toprow .brand');if(brand)brand.textContent='FISH TARGET · GAME PLAN';
    const homeVersion=document.querySelector('#home .brandRow .version');if(homeVersion)homeVersion.hidden=true;
  }
  function applyDecision(){
    const v20=api(),summary=document.querySelector('.fitV20Summary');if(!v20||!summary||typeof cur==='undefined'||!cur)return;
    document.querySelectorAll('#tackleFitBody .fitSummary').forEach(el=>el.hidden=true);
    const db=read(),p=typeof basePlan==='function'?basePlan():cur,r=typeof currentRotation==='function'?currentRotation(p):null;
    const rod=pickBest(db.rods,x=>v20.rodRows(x,p,r)),reel=pickBest(db.reels,x=>v20.reelRows(x,p));
    const rows=[...(rod?.rows||[]),...(reel?.rows||[])];if(!rows.length)return;
    const d=decision(rows),mark=d.level===0?'○':d.level===1?'△':'×';
    summary.classList.remove('level0','level1','level2');summary.classList.add(`level${d.level}`);
    const icon=summary.querySelector(':scope > span'),title=summary.querySelector('b'),sub=summary.querySelector('small');
    if(icon)icon.textContent=mark;if(title)title.textContent=d.title;if(sub)sub.textContent=d.sub;
    const warns=rows.filter(x=>x.level===1).length,bads=rows.filter(x=>x.level===2).length;
    const badge=document.querySelector('.fitV20Details>summary em');
    if(badge)badge.textContent=bads&&warns?`見直し ${bads}・要確認 ${warns}`:bads?`見直し ${bads}件`:warns?`要確認 ${warns}件`:'すべてOK';
  }
  function apply(){applyChrome();applyDecision()}
  apply();
  if(typeof renderResult==='function'){const prev=renderResult;renderResult=function(...args){const out=prev.apply(this,args);apply();return out}}
  window.addEventListener('pageshow',apply);
  globalThis.FISH_TARGET_RESULT_UX_V21=Object.freeze({version:'V21',decision,render:apply});
})();
