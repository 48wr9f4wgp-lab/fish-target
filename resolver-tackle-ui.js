(()=>{
  const resolver=globalThis.FISH_TARGET_RESOLVER;
  const v20=globalThis.FISH_TARGET_RESULT_UX_V20;
  if(!resolver?.evaluateOwnedTackle||!v20?.rodRows||!v20?.reelRows)return;
  const KEY='fish_target_v17_tackle';
  const CORE=new Set(['長さ','パワー','重量上限','番手','用途']);
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const read=()=>{try{const raw=typeof storeGet==='function'?storeGet(KEY):localStorage.getItem(KEY);const data=raw?JSON.parse(raw):{};return {rods:Array.isArray(data.rods)?data.rods:[],reels:Array.isArray(data.reels)?data.reels:[]}}catch{return {rods:[],reels:[]}}};
  const mark=level=>level===0?'○':level===1?'△':'×';
  const status=level=>level===0?'OK':level===1?'要確認':'非推奨';
  const worst=rows=>rows.length?Math.max(...rows.map(row=>row.level)):1;
  const uniq=values=>[...new Set(values.filter(Boolean))];
  const issueText=rows=>{
    const row=rows.find(x=>x.level===2)||rows.find(x=>x.level===1);
    if(!row)return '主要条件は推奨範囲内';
    if(row.name==='ライン種'&&row.owned==='未入力')return '今巻いているライン種類を登録';
    if(row.name==='ライン号数'&&row.owned==='未入力')return '今巻いているライン号数を登録';
    return `${row.name}: ${row.owned} → 推奨 ${row.target}`;
  };
  const knownDeviation=row=>row?.level===1&&CORE.has(row.name)&&!/未入力|不明|号数入力/.test(String(row.owned||''));
  const decision=rows=>{
    const hard=rows.filter(x=>x.level===2),soft=rows.filter(x=>x.level===1),knownCore=soft.filter(knownDeviation);
    if(hard.length)return {level:2,title:'このセットは見直し推奨',sub:issueText(hard)};
    if(knownCore.length>=2)return {level:2,title:'このセットは見直し推奨',sub:`${knownCore.slice(0,2).map(x=>x.name).join('・')}が推奨より不足`};
    if(soft.length)return {level:1,title:'条件付きで使える',sub:issueText(soft)};
    return {level:0,title:'このセットでOK',sub:'主要条件は推奨範囲内'};
  };
  const itemMarkup=(kind,candidate,targetLabel)=>{
    if(!candidate)return `<div class="fitV20Item level1"><span class="fitV20Kind">${kind}</span><div><b>未登録</b><small>MY TACKLEへ登録すると判定</small></div><em>△ 要確認</em></div>`;
    const level=worst(candidate.rows),issue=issueText(candidate.rows);
    return `<div class="fitV20Item level${level}"><span class="fitV20Kind">${kind}</span><div><b>${esc(candidate.item.name||'名称未設定')}</b><small>${esc(level===0?targetLabel:issue)}</small></div><em>${mark(level)} ${status(level)}</em></div>`;
  };
  const detailRows=(kind,candidate)=>{
    if(!candidate?.rows?.length)return '';
    return `<div class="fitV20DetailGroup"><b>${kind}</b>${candidate.rows.map(x=>`<div class="fitV20Check level${x.level}"><span>${mark(x.level)}</span><div><b>${esc(x.name)}</b><small>${esc(x.owned)} → 推奨 ${esc(x.target)} · ${esc(x.note)}</small></div></div>`).join('')}</div>`;
  };
  const keyOf=candidate=>candidate?.item?.id||candidate?.item?.product_id||candidate?.item?.name||null;
  const publish=statusValue=>{
    globalThis.FISH_TARGET_RESOLVER_TACKLE_UI_STATUS=Object.freeze(statusValue);
    return globalThis.FISH_TARGET_RESOLVER_TACKLE_UI_STATUS;
  };
  const render=()=>{
    const body=document.getElementById('tackleFitBody');
    if(!body||typeof cur==='undefined'||!cur||typeof basePlan!=='function')return publish({version:'RESOLVER-TACKLE-UI-2',ready:false,source:'resolver',reason:'no-current-species'});
    const db=read();
    if(!db.rods.length&&!db.reels.length)return publish({version:'RESOLVER-TACKLE-UI-2',ready:false,source:'resolver',reason:'no-owned-tackle',species:cur.name});
    const plan=basePlan();
    const rotation=typeof currentRotation==='function'?currentRotation(plan):null;
    const methodId=typeof state!=='undefined'&&state?.methodKey?state.methodKey:'default';
    const fit=resolver.evaluateOwnedTackle(cur.name,methodId,db,{plan,rotation});
    if(!fit?.ready)return publish({version:'RESOLVER-TACKLE-UI-2',ready:false,source:'resolver',reason:fit?.reason||'resolver-unavailable',species:cur.name,method_id:methodId});
    const rod=fit.rod?.item?{item:fit.rod.item,rows:v20.rodRows(fit.rod.item,plan,rotation)}:null;
    const reel=fit.reel?.item?{item:fit.reel.item,rows:v20.reelRows(fit.reel.item,plan)}:null;
    const rows=[...(rod?.rows||[]),...(reel?.rows||[])];
    const d=decision(rows);
    const casting=typeof FISH_TARGET_TACKLE_LOGIC?.castingPreferenceIntent==='function'&&FISH_TARGET_TACKLE_LOGIC.castingPreferenceIntent(plan);
    const rodTarget=v20.lengthTarget(plan.rod)?.display||plan.rod||cur.rod||'推奨ロッド';
    const reelTarget=casting?'投げ専用・遠投対応':plan.reel||cur.reel||'推奨リール';
    const bad=uniq(rows.filter(x=>x.level===2).map(x=>x.name)),warn=uniq(rows.filter(x=>x.level===1).map(x=>x.name));
    const detailBadge=bad.length?`見直し: ${bad.join('・')}${warn.length?` / 確認: ${warn.join('・')}`:''}`:warn.length?`確認: ${warn.join('・')}`:'すべてOK';
    const legacySummary=d.level===0?'手持ちで組みやすい':'買い足し候補あり';
    body.innerHTML=`<div class="fitSummary" hidden><b>${legacySummary}</b></div><div class="fitV20Summary level${d.level}" data-resolver-fit="1"><span>${mark(d.level)}</span><div><b>${esc(d.title)}</b><small>${esc(d.sub)}</small></div></div><div class="fitV20Items">${itemMarkup('ROD',rod,rodTarget)}${itemMarkup('REEL',reel,reelTarget)}</div><details class="fitV20Details"><summary><span>判定の詳細</span><em>${esc(detailBadge)}</em></summary><div class="fitV20DetailBody">${detailRows('ROD',rod)}${detailRows('REEL',reel)}<p>商品糸巻量と実際に巻いているラインは別扱い。cm / inch / エギ号数 / lbを無理に別単位へ変換しない。</p></div></details><span data-resolver-render-marker hidden></span>`;
    body.dataset.fitSource='resolver';
    return publish({version:'RESOLVER-TACKLE-UI-2',ready:true,source:'resolver',species:cur.name,method_id:methodId,plan_id:fit.plan_id,rod:keyOf(fit.rod),reel:keyOf(fit.reel),decision_level:d.level});
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
      if(!db.rods.length&&!db.reels.length||typeof cur==='undefined'||!cur)return;
      queueMicrotask(()=>{if(!body.querySelector('[data-resolver-render-marker]'))render()});
    });
    observer.observe(body,{childList:true});
  }
  queueMicrotask(render);
  globalThis.FISH_TARGET_RESOLVER_TACKLE_UI=Object.freeze({version:'RESOLVER-TACKLE-UI-2',render});
})();
