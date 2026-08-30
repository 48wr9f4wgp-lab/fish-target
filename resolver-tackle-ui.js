(()=>{
  const resolver=globalThis.FISH_TARGET_RESOLVER;
  if(!resolver?.evaluateOwnedTackle)return;
  const KEY='fish_target_v17_tackle';
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const read=()=>{try{const raw=typeof storeGet==='function'?storeGet(KEY):localStorage.getItem(KEY);const data=raw?JSON.parse(raw):{};return {rods:Array.isArray(data.rods)?data.rods:[],reels:Array.isArray(data.reels)?data.reels:[]}}catch{return {rods:[],reels:[]}}};
  const keyOf=candidate=>candidate?.item?.id||candidate?.item?.product_id||candidate?.item?.name||null;
  const publish=status=>{
    globalThis.FISH_TARGET_RESOLVER_TACKLE_UI_STATUS=Object.freeze(status);
    return globalThis.FISH_TARGET_RESOLVER_TACKLE_UI_STATUS;
  };
  const render=()=>{
    const body=document.getElementById('tackleFitBody');
    if(!body||typeof cur==='undefined'||!cur||typeof basePlan!=='function')return publish({version:'RESOLVER-TACKLE-UI-1',ready:false,source:'resolver',reason:'no-current-species'});
    const db=read();
    if(!db.rods.length&&!db.reels.length)return publish({version:'RESOLVER-TACKLE-UI-1',ready:false,source:'resolver',reason:'no-owned-tackle',species:cur.name});
    const plan=basePlan();
    const rotation=typeof currentRotation==='function'?currentRotation(plan):null;
    const methodId=typeof state!=='undefined'&&state?.methodKey?state.methodKey:'default';
    const fit=resolver.evaluateOwnedTackle(cur.name,methodId,db,{plan,rotation});
    if(!fit?.ready)return publish({version:'RESOLVER-TACKLE-UI-1',ready:false,source:'resolver',reason:fit?.reason||'resolver-unavailable',species:cur.name,method_id:methodId});
    const item=(kind,candidate,target)=>candidate?`<div class="fitItem level${candidate.fit.level}"><div class="fitKind">${kind}</div><div><b>${esc(candidate.item?.name)}</b><span>${esc(candidate.fit.label)}</span></div><small>推奨 ${esc(target)}</small></div>`:`<div class="fitItem level1"><div class="fitKind">${kind}</div><div><b>未登録</b><span>判定できません</span></div><small>推奨 ${esc(target)}</small></div>`;
    const worst=Math.max(fit.rod?.fit?.level??1,fit.reel?.fit?.level??1);
    const summary=worst===0?'手持ちで組みやすい':worst===1?'一部条件を確認':'買い足し候補あり';
    body.innerHTML=`<div class="fitSummary level${worst}" data-resolver-fit="1"><span>判定</span><b>${summary}</b></div><div class="fitItems">${item('ROD',fit.rod,plan.rod||cur.rod)}${item('REEL',fit.reel,plan.reel||cur.reel)}</div><p class="fitNote">入力済みの長さ・パワー・重量上限、番手・ライン規格・投げ釣り時の専用リール適性を簡易照合。商品糸巻量と実際に巻いているラインは分離し、cm/inch/エギ号数をgへ誤変換せず、lb表記は自動判定しない。</p><span data-resolver-render-marker hidden></span>`;
    body.dataset.fitSource='resolver';
    return publish({version:'RESOLVER-TACKLE-UI-1',ready:true,source:'resolver',species:cur.name,method_id:methodId,plan_id:fit.plan_id,rod:keyOf(fit.rod),reel:keyOf(fit.reel),worst});
  };
  if(typeof renderResult==='function'){
    const previous=renderResult;
    renderResult=function(...args){const out=previous.apply(this,args);render();return out};
  }
  const body=document.getElementById('tackleFitBody');
  if(body&&typeof MutationObserver!=='undefined'){
    const observer=new MutationObserver(()=>{
      if(body.querySelector('[data-resolver-render-marker]'))return;
      const db=read();
      if(!db.rods.length&&!db.reels.length)return;
      queueMicrotask(()=>{if(!body.querySelector('[data-resolver-render-marker]')&&typeof cur!=='undefined'&&cur&&typeof renderResult==='function')renderResult()});
    });
    observer.observe(body,{childList:true});
  }
  queueMicrotask(render);
  globalThis.FISH_TARGET_RESOLVER_TACKLE_UI=Object.freeze({version:'RESOLVER-TACKLE-UI-1',render});
})();
