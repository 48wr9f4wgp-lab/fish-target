(()=>{
  const KEY='fish_target_v17_tackle';
  const v20=()=>globalThis.FISH_TARGET_RESULT_UX_V20;
  const read=()=>{try{const raw=typeof storeGet==='function'?storeGet(KEY):localStorage.getItem(KEY);const x=raw?JSON.parse(raw):{};return {rods:Array.isArray(x.rods)?x.rods:[],reels:Array.isArray(x.reels)?x.reels:[]}}catch{return {rods:[],reels:[]}}};
  const score=rows=>{if(!rows.length)return 11;const max=Math.max(...rows.map(x=>x.level));return max*10+rows.reduce((n,x)=>n+x.level,0)};
  const pickBest=(items,fn)=>items.map(item=>({item,rows:fn(item)})).sort((a,b)=>score(a.rows)-score(b.rows))[0]||null;
  const uniq=xs=>[...new Set(xs.filter(Boolean))];

  function moveAnswerFirst(){
    const body=document.querySelector('#result .body'),plan=document.querySelector('#result .planCard'),first=document.querySelector('#result .firstCast');
    if(!body||!plan||!first)return;
    let title=first.previousElementSibling;
    if(!title?.matches('h2.sectionTitle'))title=document.querySelector('#result .ux23AnswerTitle');
    if(title){
      title.classList.add('ux23AnswerTitle');
      title.innerHTML='まず投げる・FIRST CAST<small>魚を選んだら、最初にここだけ見ればOK。</small>';
      body.insertBefore(title,plan);
    }
    body.insertBefore(first,plan);
    const kicker=document.getElementById('firstCastKicker');if(kicker)kicker.textContent='FIRST CAST · 最初の1投';
    const rotationLabel=document.querySelector('#result .rotationLabel');if(rotationLabel)rotationLabel.textContent='反応がなければ次へ';

    const gear=document.getElementById('gear'),fit=document.getElementById('tackleFitCard');
    const gearTitle=gear?.previousElementSibling?.matches('h2.sectionTitle')?gear.previousElementSibling:null;
    if(fit&&gearTitle&&fit.nextElementSibling!==gearTitle)body.insertBefore(fit,gearTitle);
  }

  function compactMethodChoice(){
    const plan=document.querySelector('#result .planCard'),top=plan?.querySelector('.planTop'),picker=document.getElementById('methodPickerV1');
    if(!plan||!top||!picker)return;
    const recommend=plan.querySelector('.recommend');if(recommend)recommend.textContent='釣り方';
    let change=document.getElementById('ux23MethodChange');
    if(!change){
      change=document.createElement('button');change.id='ux23MethodChange';change.type='button';change.className='ux23MethodChange';change.textContent='変更';top.appendChild(change);
      change.onclick=()=>{const open=picker.classList.toggle('ux23MethodOpen');change.textContent=open?'閉じる':'変更';change.setAttribute('aria-expanded',String(open))};
    }
    if(!picker.dataset.ux23Bound){
      picker.dataset.ux23Bound='1';
      picker.addEventListener('click',e=>{if(e.target.closest('button[data-method-id]'))requestAnimationFrame(()=>{picker.classList.remove('ux23MethodOpen');change.textContent='変更';change.setAttribute('aria-expanded','false')})});
    }
    picker.classList.remove('ux23MethodOpen');change.textContent='変更';change.setAttribute('aria-expanded','false');change.setAttribute('aria-controls','methodPickerV1');

    const place=document.getElementById('planPlace');
    if(place){const t=(place.textContent||'').trim();place.hidden=!t||t==='推奨ポイント'}
  }

  function unifyConditions(){
    const options=document.querySelector('#result .planOptions'),container=document.querySelector('#v19Conditions .v19GroupBody');
    if(!options||!container)return;
    const b=options.querySelector('summary b'),s=options.querySelector('summary small');if(b)b.textContent='基本条件';if(s)s.textContent='釣り場・季節・狙い';
    if(options.parentElement!==container)container.insertBefore(options,container.firstChild);
  }

  function syncFavorite(){
    const btn=document.getElementById('favoriteBtn');if(!btn)return;
    const on=btn.getAttribute('aria-pressed')==='true';const desired=on?'★ 魚をお気に入り済み':'☆ 魚をお気に入り';
    if(btn.textContent!==desired)btn.textContent=desired;
    if(!btn.dataset.ux23Observed){
      btn.dataset.ux23Observed='1';
      new MutationObserver(()=>requestAnimationFrame(syncFavorite)).observe(btn,{attributes:true,attributeFilter:['aria-pressed'],childList:true,subtree:true});
    }
  }

  function syncDock(){
    const dock=document.getElementById('resultDockV20');if(!dock)return;
    dock.classList.add('ux23Dock');
    const home=dock.querySelector('[data-action="home"]');if(home){home.hidden=true;home.setAttribute('aria-hidden','true')}
    const save=document.getElementById('save');if(save){save.textContent='保存';save.setAttribute('aria-label','このプランを保存')}
    const field=document.getElementById('fieldModeBtn');if(field){field.textContent='現場モード';field.setAttribute('aria-label','現場モードを開く')}
  }

  function syncTackleReason(){
    const api=v20(),badge=document.querySelector('.fitV20Details>summary em');
    if(!api||!badge||typeof cur==='undefined'||!cur)return;
    const db=read(),p=typeof basePlan==='function'?basePlan():cur,r=typeof currentRotation==='function'?currentRotation(p):null;
    const rod=pickBest(db.rods,x=>api.rodRows(x,p,r)),reel=pickBest(db.reels,x=>api.reelRows(x,p));
    const rows=[...(rod?.rows||[]),...(reel?.rows||[])];if(!rows.length)return;
    const bad=uniq(rows.filter(x=>x.level===2).map(x=>x.name)),warn=uniq(rows.filter(x=>x.level===1).map(x=>x.name));
    badge.textContent=bad.length?`見直し: ${bad.join('・')}${warn.length?` / 確認: ${warn.join('・')}`:''}`:warn.length?`確認: ${warn.join('・')}`:'すべてOK';
  }

  function apply(){
    moveAnswerFirst();compactMethodChoice();unifyConditions();syncFavorite();syncDock();syncTackleReason();
    document.body.classList.toggle('ux23ResultActive',document.getElementById('result')?.classList.contains('on'));
  }

  apply();
  if(typeof renderResult==='function'){const prev=renderResult;renderResult=function(...args){const out=prev.apply(this,args);apply();return out}}
  window.addEventListener('pageshow',apply);
  globalThis.FISH_TARGET_RESULT_UX_V23=Object.freeze({version:'V23R1',render:apply});
})();
