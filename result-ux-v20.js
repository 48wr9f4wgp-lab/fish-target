(()=>{
  const KEY='fish_target_v17_tackle';
  const POWER=['UL','L','ML','M','MH','H','XH','XXH','XXXH'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const nums=s=>(String(s||'').match(/\d+(?:\.\d+)?/g)||[]).map(Number);
  const tokenValue=s=>{const t=String(s||'').trim();if(t.includes('/')){const [a,b]=t.split('/').map(Number);return b?a/b:NaN}return +t};
  const unitRange=(s,unit)=>{const text=String(s||''),n='(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)',between='(?:〜|～|~|-)';let m=text.match(new RegExp(`${n}\\s*${between}\\s*${n}\\s*${unit}`,'i'));if(m)return {min:tokenValue(m[1]),max:tokenValue(m[2])};m=text.match(new RegExp(`${n}\\s*${unit}`,'i'));if(m){const v=tokenValue(m[1]);return {min:v,max:v}}return null};
  const distance=(v,r)=>v<r.min?r.min-v:v>r.max?v-r.max:0;
  const round=v=>Math.round(v*10)/10;
  const read=()=>{try{const raw=typeof storeGet==='function'?storeGet(KEY):localStorage.getItem(KEY);const x=raw?JSON.parse(raw):{};return {rods:Array.isArray(x.rods)?x.rods:[],reels:Array.isArray(x.reels)?x.reels:[]}}catch{return {rods:[],reels:[]}}};
  const mark=l=>l===0?'○':l===1?'△':'×';
  const status=l=>l===0?'OK':l===1?'要確認':'非推奨';
  const score=rows=>{if(!rows.length)return 11;const max=Math.max(...rows.map(x=>x.level));return max*10+rows.reduce((n,x)=>n+x.level,0)};
  const worst=rows=>rows.length?Math.max(...rows.map(x=>x.level)):1;

  function lengthTarget(raw){
    const text=String(raw||'');
    const m=unitRange(text,'m\\b');
    if(m)return {min:m.min*3.28084,max:m.max*3.28084,display:m.min===m.max?`${m.min}m`:`${m.min}〜${m.max}m`};
    const ft=unitRange(text,'ft\\b');
    if(ft)return {min:ft.min,max:ft.max,display:ft.min===ft.max?`${ft.min}ft`:`${ft.min}〜${ft.max}ft`};
    return null;
  }
  function powerTarget(raw){
    const tail=String(raw||'').split('/').slice(1).join('/').trim().toUpperCase();
    if(!tail||/^\d/.test(tail))return null;
    const hits=POWER.filter(p=>new RegExp(`(^|[^A-Z])${p}([^A-Z]|$)`).test(tail));
    if(!hits.length)return null;
    const ranks=hits.map(p=>POWER.indexOf(p));return {min:Math.min(...ranks),max:Math.max(...ranks)};
  }
  function castTarget(p,r){
    if(p?.style==='bait')return null;
    const s=String(r?.size||p?.size||'');
    const g=unitRange(s,'g\\b');if(g)return g;
    const oz=unitRange(s,'oz\\b');return oz?{min:oz.min*28.3495,max:oz.max*28.3495}:null;
  }
  function rodRows(rod,p,r){
    if(!rod)return [];
    const out=[],len=lengthTarget(p?.rod);
    if(len){
      if(+rod.length){const d=distance(+rod.length,len),level=d===0?0:d<=1?1:2;out.push({name:'長さ',level,owned:`${round(+rod.length)}ft`,target:len.display,note:level===0?'推奨範囲内':level===1?'推奨長に近い。立ち位置・飛距離を確認':'推奨長との差が大きい'})}
      else out.push({name:'長さ',level:1,owned:'未入力',target:len.display,note:'長さ未入力'});
    }
    const pt=powerTarget(p?.rod);
    if(pt){
      const target=`${POWER[pt.min]}${pt.min===pt.max?'':`〜${POWER[pt.max]}`}`;
      if(rod.power&&POWER.includes(String(rod.power).toUpperCase())){const pr=POWER.indexOf(String(rod.power).toUpperCase()),d=distance(pr,pt),level=d===0?0:d<=1?1:2;out.push({name:'パワー',level,owned:String(rod.power).toUpperCase(),target,note:level===0?'推奨範囲内':level===1?'1段差。用途を確認':'推奨パワーとの差が大きい'})}
      else out.push({name:'パワー',level:1,owned:'未入力',target,note:'パワー未入力'});
    }
    const ct=castTarget(p,r);
    if(ct){
      if(+rod.maxLure){const level=+rod.maxLure>=ct.max?0:+rod.maxLure>=ct.min?1:2;out.push({name:'重量上限',level,owned:`MAX ${rod.maxLure}g`,target:ct.min===ct.max?`${round(ct.min)}g`:`${round(ct.min)}〜${round(ct.max)}g`,note:level===0?'FIRST CASTに対応':level===1?'軽い側のみ対応':'FIRST CAST下限にも届かない'})}
      else out.push({name:'重量上限',level:1,owned:'未入力',target:ct.min===ct.max?`${round(ct.min)}g`:`${round(ct.min)}〜${round(ct.max)}g`,note:'重量上限未入力'});
    }
    return out;
  }
  const castingIntent=p=>typeof FISH_TARGET_TACKLE_LOGIC?.castingPreferenceIntent==='function'&&FISH_TARGET_TACKLE_LOGIC.castingPreferenceIntent(p);
  const lineOptions=p=>typeof FISH_TARGET_TACKLE_LOGIC?.lineOptions==='function'?FISH_TARGET_TACKLE_LOGIC.lineOptions(p?.line):[];
  function reelRows(reel,p){
    if(!reel)return [];
    const out=[],casting=castingIntent(p),knownCasting=/投げ|遠投/.test(String(reel.applicationRaw||''));
    if(casting){const known=String(reel.applicationRaw||''),level=known?(knownCasting?0:2):1;out.push({name:'用途',level,owned:known||'不明',target:'投げ専用・遠投対応',note:level===0?'専用用途が一致':level===1?'用途情報が未登録':'投げ・遠投用途とは異なる'})}
    else {
      const rr=nums(p?.reel).filter(v=>v>=500&&v<=30000),target=rr.length?{min:rr[0],max:rr[1]??rr[0]}:null;
      if(target){if(+reel.size){const d=distance(+reel.size,target),level=d===0?0:d<=1000?1:2;out.push({name:'番手',level,owned:`${reel.size}番`,target:target.min===target.max?`${target.min}番`:`${target.min}〜${target.max}番`,note:level===0?'推奨範囲内':level===1?'1クラス差':'推奨番手との差が大きい'})}else out.push({name:'番手',level:1,owned:reel.reelSizeRaw?`SIZE ${reel.reelSizeRaw}`:'未入力',target:target.min===target.max?`${target.min}番`:`${target.min}〜${target.max}番`,note:'番手を直接比較できない'})}
    }
    const options=lineOptions(p);
    if(options.length){
      const allowed=[...new Set(options.map(x=>x.type))].join(' / '),matched=reel.lineType?options.find(x=>x.type===reel.lineType):null;
      if(reel.lineType)out.push({name:'ライン種',level:matched?0:1,owned:reel.lineType,target:allowed,note:matched?'推奨候補と一致':'推奨候補とは異なる'});
      else out.push({name:'ライン種',level:1,owned:'未入力',target:allowed,note:'今巻いているラインを登録'});
      if(matched?.unit==='号'){
        if(+reel.lineNo){const d=distance(+reel.lineNo,matched.range),level=d===0?0:d<=0.5?1:2;out.push({name:'ライン号数',level,owned:`${reel.lineNo}号`,target:matched.range.min===matched.range.max?`${matched.range.min}号`:`${matched.range.min}〜${matched.range.max}号`,note:level===0?'推奨範囲内':level===1?'近い号数。飛距離/強度を確認':'推奨号数との差が大きい'})}
        else out.push({name:'ライン号数',level:1,owned:'未入力',target:matched.range.min===matched.range.max?`${matched.range.min}号`:`${matched.range.min}〜${matched.range.max}号`,note:'号数未入力'});
      }else if(matched?.unit==='lb')out.push({name:'ライン強度',level:1,owned:'号数入力',target:`${matched.range.min}〜${matched.range.max}lb`,note:'lbは号数へ自動換算しない'});
    }
    return out;
  }
  const pickBest=(items,fn)=>items.map(item=>({item,rows:fn(item)})).sort((a,b)=>score(a.rows)-score(b.rows))[0]||null;
  const issueText=rows=>{
    const row=rows.find(x=>x.level===2)||rows.find(x=>x.level===1);
    if(!row)return '主要条件は推奨範囲内';
    if(row.name==='ライン種'&&row.owned==='未入力')return '今巻いているライン種類を登録';
    if(row.name==='ライン号数'&&row.owned==='未入力')return '今巻いているライン号数を登録';
    return `${row.name}: ${row.owned} → 推奨 ${row.target}`;
  };
  function decision(rows){
    const hard=rows.filter(x=>x.level===2),soft=rows.filter(x=>x.level===1);
    if(hard.length)return {level:2,title:'このセットは見直し推奨',sub:issueText(hard)};
    if(soft.length)return {level:1,title:'概ね使える',sub:issueText(soft)};
    return {level:0,title:'このセットでOK',sub:'主要条件は推奨範囲内'};
  }
  function itemMarkup(kind,candidate,targetLabel){
    if(!candidate)return `<div class="fitV20Item level1"><span class="fitV20Kind">${kind}</span><div><b>未登録</b><small>MY TACKLEへ登録すると判定</small></div><em>△ 要確認</em></div>`;
    const level=worst(candidate.rows),issue=issueText(candidate.rows);
    return `<div class="fitV20Item level${level}"><span class="fitV20Kind">${kind}</span><div><b>${esc(candidate.item.name||'名称未設定')}</b><small>${esc(level===0?targetLabel:issue)}</small></div><em>${mark(level)} ${status(level)}</em></div>`;
  }
  function detailRows(kind,candidate){
    if(!candidate?.rows?.length)return '';
    return `<div class="fitV20DetailGroup"><b>${kind}</b>${candidate.rows.map(x=>`<div class="fitV20Check level${x.level}"><span>${mark(x.level)}</span><div><b>${esc(x.name)}</b><small>${esc(x.owned)} → 推奨 ${esc(x.target)} · ${esc(x.note)}</small></div></div>`).join('')}</div>`;
  }
  function renderFit(){
    const card=document.getElementById('tackleFitCard'),body=document.getElementById('tackleFitBody');
    if(!card||!body||typeof cur==='undefined'||!cur)return;
    card.classList.add('fitV20Card');
    const title=card.querySelector('.tackleFitHead strong');if(title)title.textContent='このセットで行ける？';
    const edit=card.querySelector('#tackleEditFromResult');if(edit)edit.textContent='MY TACKLE編集';
    const db=read();
    if(!db.rods.length&&!db.reels.length){body.innerHTML='<button class="fitV20Empty" id="fitV20Empty" type="button"><b>手持ちを登録する</b><span>ロッドとリールを選ぶと、このプランで使えるか即判定 ›</span></button>';document.getElementById('fitV20Empty').onclick=()=>document.getElementById('tackleManage')?.click();return}
    const p=typeof basePlan==='function'?basePlan():cur,r=typeof currentRotation==='function'?currentRotation(p):null;
    const rod=pickBest(db.rods,x=>rodRows(x,p,r)),reel=pickBest(db.reels,x=>reelRows(x,p));
    const all=[...(rod?.rows||[]),...(reel?.rows||[])],d=decision(all),casting=castingIntent(p);
    const rodTarget=lengthTarget(p.rod)?.display||p.rod||cur.rod||'推奨ロッド';
    const reelTarget=casting?'投げ専用・遠投対応':p.reel||cur.reel||'推奨リール';
    const warns=all.filter(x=>x.level===1).length,bads=all.filter(x=>x.level===2).length,detailBadge=[bads?`×${bads}`:'',warns?`△${warns}`:''].filter(Boolean).join(' ')||'○';
    const legacySummary=d.level===0?'手持ちで組みやすい':'買い足し候補あり';
    body.innerHTML=`<div class="fitSummary" hidden><b>${legacySummary}</b></div><div class="fitV20Summary level${d.level}"><span>${mark(d.level)}</span><div><b>${esc(d.title)}</b><small>${esc(d.sub)}</small></div></div><div class="fitV20Items">${itemMarkup('ROD',rod,rodTarget)}${itemMarkup('REEL',reel,reelTarget)}</div><details class="fitV20Details"><summary><span>判定の詳細</span><em>${esc(detailBadge)}</em></summary><div class="fitV20DetailBody">${detailRows('ROD',rod)}${detailRows('REEL',reel)}<p>商品糸巻量と実際に巻いているラインは別扱い。cm / inch / エギ号数 / lbを無理に別単位へ変換しない。</p></div></details>`;
  }
  function ensureDock(){
    let dock=document.getElementById('resultDockV20');
    if(!dock){
      document.body.insertAdjacentHTML('beforeend','<div class="resultDockV20" id="resultDockV20" hidden><button data-action="home" type="button">魚一覧</button></div>');
      dock=document.getElementById('resultDockV20');
      dock.querySelector('[data-action="home"]').onclick=()=>typeof show==='function'&&show('home');
    }
    const staleSave=dock.querySelector('[data-action="save"]:not(#save)');if(staleSave)staleSave.remove();
    const save=document.getElementById('save');
    if(save&&save.parentElement!==dock){save.dataset.action='save';save.textContent='保存';dock.appendChild(save)}
    const field=document.getElementById('fieldModeBtn');
    if(field&&field.parentElement!==dock){field.classList.add('primary');field.dataset.action='field';field.textContent='現場モード';dock.appendChild(field)}
    return dock;
  }
  function compactSecondary(){
    const details=document.querySelector('#v19Details .v19GroupBody'),actions=document.querySelector('#result .actions');
    if(details&&actions&&!actions.closest('#v19Details')){actions.classList.add('v20SecondaryActions');details.appendChild(actions)}
  }
  function syncDock(){
    const dock=ensureDock();const on=document.getElementById('result')?.classList.contains('on');if(dock)dock.hidden=!on;document.body.classList.toggle('v20ResultActive',!!on);
  }
  function apply(){renderFit();compactSecondary();syncDock()}
  ensureDock();apply();
  const app=document.querySelector('.app');if(app)new MutationObserver(syncDock).observe(app,{subtree:true,attributes:true,attributeFilter:['class']});
  if(typeof renderResult==='function'){const prev=renderResult;renderResult=function(...args){const out=prev.apply(this,args);apply();return out}}
  window.addEventListener('pageshow',apply);
  globalThis.FISH_TARGET_RESULT_UX_V20=Object.freeze({version:'V20',lengthTarget,rodRows,reelRows,render:apply});
})();
