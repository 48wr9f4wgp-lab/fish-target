(function(){
  const baseShow=show;
  show=function(v){
    const fm=document.getElementById('fieldmode');
    if(fm)fm.classList.remove('on');
    if(v==='fieldmode'){
      ['home','result','saved'].forEach(x=>document.getElementById(x)?.classList.remove('on'));
      fm?.classList.add('on');
      document.querySelectorAll('.nav button').forEach(b=>b.classList.remove('on'));
      scrollTo({top:0,behavior:'smooth'});
      return;
    }
    baseShow(v);
  };

  function currentSetResult(){
    const auto=globalThis.FISH_TARGET_TACKLE_AUTO_BUILD;
    const live=auto?.getState?.()?.setResult;
    if(live)return live;
    const plan=auto?.currentPlan?.();
    const resolver=globalThis.FISH_TARGET_TACKLE_SET_RESOLVER;
    if(!plan||!resolver?.resolvePlan)return null;
    try{return resolver.resolvePlan(plan,auto?.readOwned?.()||{})}catch{return null}
  }

  function renderFieldMode(){
    if(!cur)return;
    const p=basePlan(),r=currentRotation(p),list=rotationFor(p),next=list.length>1?list[(state.rotation+1)%list.length]:null;
    const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=val??'—'};
    set('fmMethod',p.method);set('fmFish',cur.name);set('fmPlace',`${state.place==='おすすめ'?'推奨ポイント':state.place} · ${state.season} · ${p.time||'時間帯は状況次第'}`);
    set('fmBait',r.name);set('fmSize',dynamicSize(r.size));set('fmRange',r.range||p.range||'状況次第');set('fmColor',dynamicColor(r.color,p));set('fmAction',r.action||p.action||'基本操作');set('fmNext',next?`${next.name} · ${next.when||'反応が無ければ切替'}`:'同じ仕掛けでレンジと速度を変更');

    const decision=currentSetResult(),my=decision?.myBestSet;
    const currentLine=my?.reel?[my.reel.lineType,my.reel.lineNo?`${my.reel.lineNo}号`:null].filter(Boolean).join(' '):'';
    const gear=my?[
      ['ロッド',my.rod?.name||p.rod],
      ['リール',my.reel?.name||p.reel],
      ['ライン',currentLine||p.line],
      ['リーダー/ハリス',p.leader]
    ]:[['ロッド',p.rod],['リール',p.reel],['ライン',p.line],['リーダー/ハリス',p.leader]];
    document.getElementById('fmTackle').innerHTML=gear.map(x=>`<div><span>${x[0]}</span><b>${x[1]}</b></div>`).join('');
    document.getElementById('fmTackle')?.toggleAttribute('data-owned-set',Boolean(my));
    document.getElementById('fmSteps').innerHTML=(p.steps||[]).slice(0,3).map((x,i)=>`<div class="fmStep"><i>${i+1}</i><span>${x}</span></div>`).join('');

    const nextLabel=document.querySelector('.fmNext span');if(nextLabel)nextLabel.textContent='反応がなければ';
    const tackleTitle=document.getElementById('fmTackleTitle');if(tackleTitle)tackleTitle.textContent=my?'今回のセット':'必要なセット';
    const stepsTitle=document.getElementById('fmStepsTitle');if(stepsTitle)stepsTitle.textContent='現場の3手';
    const modeSmall=document.querySelector('.fieldModeHead small');if(modeSmall)modeSmall.textContent='次の一手だけ確認';

    const w=LIVE.weather,m=cur.water==='salt'?LIVE.marine:null;
    let status='基準',text=FEATURES.fieldLive?'現地データ未取得。魚種・季節・時刻の基準プラン。':'魚種・季節・時刻の基準プラン。';
    if(FEATURES.fieldLive&&w){const f=fieldStatus(+w.wind||0,+w.gust||0,+w.precipitation||0,m?.wave);status=f[0];text=`<strong>${LIVE.place?.name||'現在地'}：</strong>風 ${w.wind??'-'}m/s・突風 ${w.gust??'-'}m/s${m?.wave!=null?`・波 ${m.wave}m`:''}。FIRST CAST補正済み。`;}
    set('fmStatus',status);document.getElementById('fmCondition').innerHTML=text;
  }

  function openFieldMode(){if(!cur)return;renderFieldMode();show('fieldmode');track('field_mode_open',{fish:cur.name,method:basePlan().method})}
  document.getElementById('fieldModeBtn')?.addEventListener('click',openFieldMode);
  document.getElementById('fieldBack')?.addEventListener('click',()=>show('result'));
  document.getElementById('fmBackPlan')?.addEventListener('click',()=>show('result'));
})();