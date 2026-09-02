(()=>{
  const LAST_KEY='fish_target_v16_last_plan';
  const RECENT_KEY='fish_target_v16_recent';
  const FAVORITES_KEY='fish_target_v16_favorites';
  const safeParse=(raw,fallback)=>{try{return raw?JSON.parse(raw):fallback}catch{return fallback}};
  const read=(key,fallback)=>safeParse(typeof storeGet==='function'?storeGet(key):null,fallback);
  const write=(key,value)=>{if(typeof storeSet==='function')storeSet(key,JSON.stringify(value))};
  const esc=value=>String(value??'').replace(/[&<>'\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','\"':'&quot;'}[c]));
  const fishFor=name=>typeof F!=='undefined'?F.find(f=>f.name===name):null;

  function ensureMarkup(){
    if(!document.getElementById('myTargets')){
      const quick=document.getElementById('quick');
      if(quick)quick.insertAdjacentHTML('afterend','<section class="myTargets" id="myTargets" hidden><div class="head"><h2>MY TARGETS</h2><span>すぐ再開</span></div><button class="resumePlan" id="resumePlan" type="button" hidden></button><div class="targetShelf" id="favoriteTargets"></div><div class="targetShelf" id="recentTargets"></div></section>');
    }
    if(!document.getElementById('favoriteBtn')){
      const facts=document.querySelector('#result .planFacts');
      if(facts)facts.insertAdjacentHTML('afterend','<button class="favoriteToggle" id="favoriteBtn" type="button" aria-pressed="false">お気に入りに追加</button>');
    }
  }

  function favorites(){return read(FAVORITES_KEY,[]).filter(name=>fishFor(name))}
  function recent(){return read(RECENT_KEY,[]).filter(x=>x&&fishFor(x.fish)).slice(0,4)}
  function lastPlan(){const x=read(LAST_KEY,null);return x&&fishFor(x.fish)?x:null}

  function snapshotCurrent(){
    if(typeof cur==='undefined'||!cur)return;
    try{
      const p=typeof basePlan==='function'?basePlan():cur;
      const r=typeof currentRotation==='function'?currentRotation(p):null;
      const snap={fish:cur.name,state:{...state},method:p.method||cur.method,cast:r?.name||p.bait||cur.bait||'基準',size:r?.size||p.size||cur.size||'',ts:Date.now()};
      write(LAST_KEY,snap);
      const next=[{fish:snap.fish,method:snap.method,cast:snap.cast,ts:snap.ts},...recent().filter(x=>x.fish!==snap.fish)].slice(0,4);
      write(RECENT_KEY,next);
      renderContinuity();
      renderFavoriteButton();
    }catch(err){console.warn('continuity snapshot failed',err)}
  }

  function resume(plan){
    const fish=fishFor(plan?.fish);
    if(!fish||typeof openFish!=='function')return;
    openFish(fish,plan.state||undefined);
    if(typeof track==='function')track('resume_plan',{fish:fish.name});
  }

  function openByName(name,source){
    const fish=fishFor(name);
    if(!fish||typeof openFish!=='function')return;
    openFish(fish);
    if(typeof track==='function')track('continuity_open',{fish:fish.name,source});
  }

  function renderContinuity(){
    const section=document.getElementById('myTargets');
    const resumeBox=document.getElementById('resumePlan');
    const favBox=document.getElementById('favoriteTargets');
    const recentBox=document.getElementById('recentTargets');
    if(!section||!resumeBox||!favBox||!recentBox)return;
    const last=lastPlan(), favs=favorites(), recents=recent();
    section.hidden=!(last||favs.length||recents.length);

    if(last){
      resumeBox.hidden=false;
      resumeBox.innerHTML=`<span class="resumeKicker"><span>前回のプラン</span><span>続きから ›</span></span><strong class="resumeFish">${esc(last.fish)}</strong><span class="resumeMethod">${esc(last.method||'基本プラン')}</span><span class="resumeCast"><span>FIRST CAST ${esc(last.cast||'-')}</span>${last.size?`<span>${esc(last.size)}</span>`:''}</span>`;
      resumeBox.onclick=()=>resume(last);
    }else{resumeBox.hidden=true;resumeBox.innerHTML='';resumeBox.onclick=null}

    if(favs.length){
      favBox.innerHTML=`<div class="targetShelfLabel"><span>お気に入り</span><span>${favs.length}件</span></div><div class="targetChips">${favs.map(name=>`<button class="targetChip favorite" data-fish="${esc(name)}">${esc(name)}</button>`).join('')}</div>`;
      favBox.querySelectorAll('button').forEach(b=>b.onclick=()=>openByName(b.dataset.fish,'favorite'));
    }else favBox.innerHTML='';

    const shown=recents.filter(x=>!favs.includes(x.fish));
    if(shown.length){
      recentBox.innerHTML=`<div class="targetShelfLabel"><span>最近見た</span><span>履歴</span></div><div class="targetChips">${shown.map(x=>`<button class="targetChip" data-fish="${esc(x.fish)}">${esc(x.fish)}</button>`).join('')}</div>`;
      recentBox.querySelectorAll('button').forEach(b=>b.onclick=()=>openByName(b.dataset.fish,'recent'));
    }else recentBox.innerHTML='';
  }

  function renderFavoriteButton(){
    const btn=document.getElementById('favoriteBtn');
    if(!btn||typeof cur==='undefined'||!cur)return;
    const on=favorites().includes(cur.name);
    btn.classList.toggle('on',on);
    btn.textContent=on?'お気に入り登録済み':'お気に入りに追加';
    btn.setAttribute('aria-pressed',String(on));
  }

  function toggleFavorite(){
    if(typeof cur==='undefined'||!cur)return;
    const list=favorites();
    const on=list.includes(cur.name);
    const next=on?list.filter(name=>name!==cur.name):[cur.name,...list].slice(0,8);
    write(FAVORITES_KEY,next);
    renderFavoriteButton();
    renderContinuity();
    if(typeof toast==='function')toast(on?'お気に入りから外した':'お気に入りに追加した');
    if(typeof track==='function')track('favorite_toggle',{fish:cur.name,on:!on});
  }

  ensureMarkup();
  const favBtn=document.getElementById('favoriteBtn');
  if(favBtn)favBtn.onclick=toggleFavorite;

  if(typeof renderResult==='function'){
    const originalRenderResult=renderResult;
    renderResult=function(...args){const out=originalRenderResult.apply(this,args);snapshotCurrent();return out};
  }

  renderContinuity();
  renderFavoriteButton();
})();
