(()=>{
  const KEY='fish_target_v17_tackle';
  const POWER=['UL','L','ML','M','MH','H','XH'];
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=()=>{try{const raw=typeof storeGet==='function'?storeGet(KEY):localStorage.getItem(KEY);const x=raw?JSON.parse(raw):{};return {rods:Array.isArray(x.rods)?x.rods:[],reels:Array.isArray(x.reels)?x.reels:[]}}catch{return {rods:[],reels:[]}}};
  const write=x=>{const raw=JSON.stringify(x);if(typeof storeSet==='function')storeSet(KEY,raw);else try{localStorage.setItem(KEY,raw)}catch{}};
  const uid=()=>`${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;
  const nums=s=>(String(s||'').match(/\d+(?:\.\d+)?/g)||[]).map(Number);
  const range=s=>{const n=nums(s);return n.length?{min:n[0],max:n[1]??n[0]}:null};
  const powerRange=s=>{const tail=String(s||'').split('/').slice(1).join('/').trim().toUpperCase();if(!tail||/^\d/.test(tail))return null;const hits=POWER.filter(p=>new RegExp(`(^|[^A-Z])${p}([^A-Z]|$)`).test(tail));if(!hits.length)return null;const ranks=hits.map(p=>POWER.indexOf(p));return {min:Math.min(...ranks),max:Math.max(...ranks)}};
  const reelRange=s=>{const n=nums(s).filter(v=>v>=500&&v<=30000);return n.length?{min:n[0],max:n[1]??n[0]}:null};
  const lineSpec=s=>{const text=String(s||'');const type=/PE/i.test(text)?'PE':/ナイロン/.test(text)?'ナイロン':/フロロ/.test(text)?'フロロ':null;const n=nums(text);return {type,range:n.length?{min:n[0],max:n[1]??n[0]}:null}};
  const distance=(v,r)=>v<r.min?r.min-v:v>r.max?v-r.max:0;

  function rodFit(rod,p,r){
    const checks=[];
    const targetLen=/ft/i.test(p.rod||'')?range(p.rod?.match(/[^/]+/)?.[0]||p.rod):null;
    if(+rod.length&&targetLen){const d=distance(+rod.length,targetLen);checks.push(d===0?0:d<=1?1:2)}
    const targetPower=powerRange(p.rod);
    if(rod.power&&targetPower){const pr=POWER.indexOf(rod.power);const d=distance(pr,targetPower);checks.push(d===0?0:d<=1?1:2)}
    const castRange=range(r?.size||p.size);
    if(p.style!=='bait'&&+rod.maxLure&&castRange){checks.push(+rod.maxLure>=castRange.max?0:+rod.maxLure>=castRange.min?1:2)}
    const worst=checks.length?Math.max(...checks):1;
    return {level:worst,label:worst===0?'そのまま使いやすい':worst===1?'条件付きで候補':'推奨から外れ気味'};
  }

  function reelFit(reel,p){
    const checks=[];
    const target=reelRange(p.reel);
    if(+reel.size&&target){const d=distance(+reel.size,target);checks.push(d===0?0:d<=1000?1:2)}
    const spec=lineSpec(p.line);
    if(reel.lineType&&spec.type)checks.push(reel.lineType===spec.type?0:1);
    if(+reel.lineNo&&spec.range){const d=distance(+reel.lineNo,spec.range);checks.push(d===0?0:d<=0.5?1:2)}
    const worst=checks.length?Math.max(...checks):1;
    return {level:worst,label:worst===0?'そのまま使いやすい':worst===1?'条件付きで候補':'推奨から外れ気味'};
  }

  const best=(items,fn)=>items.map(x=>({...x,fit:fn(x)})).sort((a,b)=>a.fit.level-b.fit.level)[0]||null;

  function ensureUI(){
    document.title='FISH TARGET v17';
    const v=document.querySelector('.version');if(v)v.textContent='V17';
    const rb=document.querySelector('#result .toprow .brand');if(rb)rb.textContent='TARGET GAME PLAN · V17';
    if(!document.getElementById('myTackleHome')){
      const anchor=document.getElementById('myTargets')||document.querySelector('.filterPanel');
      if(anchor)anchor.insertAdjacentHTML('afterend',`<section class="myTackleHome" id="myTackleHome"><div class="head"><h2>MY TACKLE</h2><button class="tackleManage" id="tackleManage" type="button">登録・編集</button></div><div class="tackleSummary" id="tackleSummary"></div></section>`);
    }
    if(!document.getElementById('tackleFitCard')){
      const gear=document.getElementById('gear');
      if(gear)gear.insertAdjacentHTML('afterend',`<section class="card tackleFitCard" id="tackleFitCard"><div class="tackleFitHead"><div><span>MY TACKLE CHECK</span><strong>手持ちでいける？</strong></div><button id="tackleEditFromResult" type="button">編集</button></div><div id="tackleFitBody"></div></section>`);
    }
    if(!document.getElementById('tackleSheet')){
      document.body.insertAdjacentHTML('beforeend',`<div class="tackleBackdrop" id="tackleBackdrop" hidden></div><section class="tackleSheet" id="tackleSheet" aria-modal="true" role="dialog" hidden><div class="tackleSheetHead"><div><span>MY TACKLE</span><h2>手持ちを登録</h2></div><button id="tackleClose" aria-label="閉じる">×</button></div><div class="tackleSheetBody"><div class="tackleFormCard"><h3>ロッドを追加</h3><div class="tackleFormGrid"><label class="wide">名前<input id="rodName" placeholder="例：ショアジギロッド 96MH"></label><label>長さ ft<input id="rodLength" inputmode="decimal" placeholder="9.6"></label><label>パワー<select id="rodPower"><option value="">未指定</option>${POWER.map(p=>`<option>${p}</option>`).join('')}</select></label><label class="wide">ルアー上限 g<input id="rodMaxLure" inputmode="decimal" placeholder="60"></label></div><button class="tackleAdd" id="addRod" type="button">ロッドを追加</button></div><div class="tackleFormCard"><h3>リールを追加</h3><div class="tackleFormGrid"><label class="wide">名前<input id="reelName" placeholder="例：4000XG"></label><label>番手<input id="reelSize" inputmode="numeric" placeholder="4000"></label><label>ライン<select id="reelLineType"><option value="">未指定</option><option>PE</option><option>ナイロン</option><option>フロロ</option></select></label><label class="wide">ライン号数<input id="reelLineNo" inputmode="decimal" placeholder="1.5"></label></div><button class="tackleAdd" id="addReel" type="button">リールを追加</button></div><div class="tackleOwned" id="tackleOwned"></div></div></section>`);
    }
    document.getElementById('tackleManage')?.addEventListener('click',openSheet);
    document.getElementById('tackleEditFromResult')?.addEventListener('click',openSheet);
    document.getElementById('tackleClose')?.addEventListener('click',closeSheet);
    document.getElementById('tackleBackdrop')?.addEventListener('click',closeSheet);
    document.getElementById('addRod')?.addEventListener('click',addRod);
    document.getElementById('addReel')?.addEventListener('click',addReel);
  }

  function openSheet(){renderOwned();document.getElementById('tackleBackdrop').hidden=false;document.getElementById('tackleSheet').hidden=false;document.body.classList.add('tackleSheetOpen')}
  function closeSheet(){document.getElementById('tackleBackdrop').hidden=true;document.getElementById('tackleSheet').hidden=true;document.body.classList.remove('tackleSheetOpen')}
  const value=id=>document.getElementById(id)?.value.trim()||'';

  function addRod(){
    const name=value('rodName');if(!name){if(typeof toast==='function')toast('ロッド名を入れて');return}
    const db=read();db.rods.unshift({id:uid(),name,length:+value('rodLength')||null,power:value('rodPower'),maxLure:+value('rodMaxLure')||null});db.rods=db.rods.slice(0,12);write(db);
    ['rodName','rodLength','rodMaxLure'].forEach(id=>document.getElementById(id).value='');document.getElementById('rodPower').value='';refresh();if(typeof toast==='function')toast('ロッドを登録した')
  }
  function addReel(){
    const name=value('reelName');if(!name){if(typeof toast==='function')toast('リール名を入れて');return}
    const db=read();db.reels.unshift({id:uid(),name,size:+value('reelSize')||null,lineType:value('reelLineType'),lineNo:+value('reelLineNo')||null});db.reels=db.reels.slice(0,12);write(db);
    ['reelName','reelSize','reelLineNo'].forEach(id=>document.getElementById(id).value='');document.getElementById('reelLineType').value='';refresh();if(typeof toast==='function')toast('リールを登録した')
  }
  function remove(type,id){const db=read();db[type]=db[type].filter(x=>x.id!==id);write(db);refresh()}

  function renderOwned(){
    const box=document.getElementById('tackleOwned');if(!box)return;const db=read();
    const rows=[...db.rods.map(x=>({type:'rods',kind:'ROD',x,meta:[x.length?`${x.length}ft`:'',x.power,x.maxLure?`MAX ${x.maxLure}g`:''].filter(Boolean).join(' · ')})),...db.reels.map(x=>({type:'reels',kind:'REEL',x,meta:[x.size?`${x.size}番`:'',x.lineType&&x.lineNo?`${x.lineType} ${x.lineNo}号`:x.lineType||''].filter(Boolean).join(' · ')}))];
    box.innerHTML=rows.length?`<div class="ownedTitle">登録済み <span>${rows.length}点</span></div>${rows.map(r=>`<div class="ownedRow"><div><span>${r.kind}</span><b>${esc(r.x.name)}</b><small>${esc(r.meta||'スペック未指定')}</small></div><button data-type="${r.type}" data-id="${r.x.id}" aria-label="削除">削除</button></div>`).join('')}`:'<div class="tackleEmpty">まだ未登録。まず普段使うロッドとリールを1本ずつ入れれば判定できる。</div>';
    box.querySelectorAll('.ownedRow button').forEach(b=>b.onclick=()=>remove(b.dataset.type,b.dataset.id));
  }

  function renderHomeSummary(){
    const box=document.getElementById('tackleSummary');if(!box)return;const db=read();
    if(!db.rods.length&&!db.reels.length){box.innerHTML='<button class="tackleEmptyCta" id="tackleEmptyCta" type="button"><b>手持ちタックルを登録</b><span>魚を選んだ時に「そのまま使えるか」を自動判定 ›</span></button>';document.getElementById('tackleEmptyCta').onclick=openSheet;return}
    box.innerHTML=`<div class="tackleCount"><div><span>ROD</span><b>${db.rods.length}</b></div><div><span>REEL</span><b>${db.reels.length}</b></div><p>登録済みタックルから、魚ごとに近い組み合わせを自動表示。</p></div>`;
  }

  function renderFit(){
    const body=document.getElementById('tackleFitBody');if(!body||typeof cur==='undefined'||!cur)return;const db=read();const p=typeof basePlan==='function'?basePlan():cur;const r=typeof currentRotation==='function'?currentRotation(p):null;
    if(!db.rods.length&&!db.reels.length){body.innerHTML='<div class="fitEmpty"><b>MY TACKLE未登録</b><span>ロッドとリールを登録すると、このプランに使えるか照合する。</span><button id="fitEmptyAdd">登録する</button></div>';document.getElementById('fitEmptyAdd').onclick=openSheet;return}
    const rod=best(db.rods,x=>rodFit(x,p,r)),reel=best(db.reels,x=>reelFit(x,p));
    const item=(kind,x,target)=>x?`<div class="fitItem level${x.fit.level}"><div class="fitKind">${kind}</div><div><b>${esc(x.name)}</b><span>${esc(x.fit.label)}</span></div><small>推奨 ${esc(target)}</small></div>`:`<div class="fitItem level1"><div class="fitKind">${kind}</div><div><b>未登録</b><span>判定できません</span></div><small>推奨 ${esc(target)}</small></div>`;
    const worst=Math.max(rod?.fit.level??1,reel?.fit.level??1);const summary=worst===0?'手持ちで組みやすい':worst===1?'一部条件を確認':'買い足し候補あり';
    body.innerHTML=`<div class="fitSummary level${worst}"><span>判定</span><b>${summary}</b></div><div class="fitItems">${item('ROD',rod,p.rod||cur.rod)}${item('REEL',reel,p.reel||cur.reel)}</div><p class="fitNote">長さ・パワー・ルアー上限、リール番手・ライン号数の入力値から簡易照合。メーカー固有の許容値やドラグ性能までは未判定。</p>`;
  }

  function refresh(){renderOwned();renderHomeSummary();renderFit()}
  ensureUI();refresh();
  if(typeof renderResult==='function'){
    const prev=renderResult;
    renderResult=function(...args){const out=prev.apply(this,args);renderFit();return out};
  }
})();
