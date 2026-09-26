(()=>{
  if(document.documentElement.dataset.fieldLive!=='on')return;
  const $=selector=>document.querySelector(selector),byId=id=>document.getElementById(id);
  const page=byId('conditions'),liveMount=byId('conditionsLiveMount'),autoMount=byId('conditionsAutoMount'),locationMount=byId('conditionsLocationMountV35');
  if(!page||!liveMount||!autoMount||!locationMount)return;

  function moveWithHeading(node,mount){
    if(!node||!mount)return;
    const heading=node.previousElementSibling;
    if(heading?.matches('h2.sectionTitle'))mount.appendChild(heading);
    mount.appendChild(node);
  }
  moveWithHeading($('.fieldLive'),liveMount);
  moveWithHeading(byId('autoAdjust'),autoMount);

  const fieldLive=$('.fieldLive');
  for(const selector of ['.spotPresets','.spotSearch','.spotResults']){
    const node=fieldLive?.querySelector(selector);
    if(node)locationMount.appendChild(node);
  }

  const text=(id,fallback='-')=>byId(id)?.textContent?.trim()||fallback;
  const set=(id,value)=>{const el=byId(id);if(el)el.textContent=value};
  const target=()=>LIVE.conditionsFish||null;
  const fmtDate=value=>{const m=String(value||'').match(/-(\d\d)-(\d\d)/);return m?`${Number(m[1])}/${Number(m[2])}`:'--/--'};
  const fmtClock=value=>value?String(value).slice(11,16):'--:--';
  const fmtLevel=value=>{const n=Number(value);if(!Number.isFinite(n))return '-- cm';const cm=Math.round(n*100);return `${cm>0?'+':''}${cm} cm`};
  const localMs=value=>{const n=Date.parse(String(value||''));return Number.isFinite(n)?n:NaN};
  const compass=deg=>typeof compass8==='function'?compass8(deg):'-';

  function dashboardNowIndex(times){const targetTime=LIVE.marine?.time||LIVE.weather?.time;if(typeof nearestTimeIndex==='function'){const i=nearestTimeIndex(times,targetTime);if(i>=0)return i}const target=localMs(targetTime);if(!Number.isFinite(target))return 0;let best=0,delta=Infinity;times.forEach((t,i)=>{const d=Math.abs(localMs(t)-target);if(Number.isFinite(d)&&d<delta){delta=d;best=i}});return best}
  function dashboardWindow(){
    const h=LIVE.marineHourly||{},all=h.time||[],absoluteNow=dashboardNowIndex(all),maxStart=Math.max(0,all.length-24),start=Math.max(0,Math.min(absoluteNow-4,maxStart)),end=Math.min(all.length,start+24);
    return {h,start,end,now:Math.max(0,absoluteNow-start),times:all.slice(start,end),levels:(h.sea_level_height_msl||[]).slice(start,end)};
  }
  function tideTurns(times,levels,nowIndex=0){
    const out=[];
    for(let i=Math.max(1,nowIndex+1);i<Math.min(times.length,levels.length)-1;i++){
      const a=Number(levels[i-1]),b=Number(levels[i]),c=Number(levels[i+1]);
      if(![a,b,c].every(Number.isFinite))continue;
      if(b>=a&&b>c&&Math.max(Math.abs(b-a),Math.abs(b-c))>=0.015)out.push({i,type:'満潮候補',kind:'high',symbol:'満',time:times[i],level:b});
      else if(b<=a&&b<c&&Math.max(Math.abs(b-a),Math.abs(b-c))>=0.015)out.push({i,type:'干潮候補',kind:'low',symbol:'干',time:times[i],level:b});
    }
    return out;
  }

  function dashboardX(times,value,x0=18,x1=342){
    if(!times?.length||!value)return null;
    const a=localMs(times[0]),b=localMs(times[times.length-1]),v=localMs(value);
    if(![a,b,v].every(Number.isFinite)||b<=a)return null;
    return x0+(x1-x0)*((Math.max(a,Math.min(b,v))-a)/(b-a));
  }
  function dashboardY(values,index,y0=30,y1=132){
    const nums=(values||[]).map(Number),valid=nums.filter(Number.isFinite),v=nums[index];
    if(valid.length<2||!Number.isFinite(v))return null;
    let lo=Math.min(...valid),hi=Math.max(...valid);if(hi-lo<.001){lo-=.5;hi+=.5}
    return y1-(y1-y0)*((v-lo)/(hi-lo));
  }
  function dashboardPoints(values,x0=18,x1=342,y0=30,y1=132){
    const nums=(values||[]).map(Number),valid=nums.filter(Number.isFinite);
    if(valid.length<2)return '';
    let lo=Math.min(...valid),hi=Math.max(...valid);if(hi-lo<.001){lo-=.5;hi+=.5}
    return nums.map((v,i)=>{if(!Number.isFinite(v))return null;const x=x0+(x1-x0)*(i/Math.max(1,nums.length-1)),y=y1-(y1-y0)*((v-lo)/(hi-lo));return [x,y]}).filter(Boolean).map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ');
  }
  function dashboardMazume(times){
    if(!times?.length||!LIVE.solar?.length)return '';
    let out='';
    for(const w of LIVE.solar){
      for(const [a,b,label] of [[w.morningStart,w.morningEnd,'朝'],[w.eveningStart,w.eveningEnd,'夕']]){
        const x1=dashboardX(times,a),x2=dashboardX(times,b);
        if(x1==null||x2==null||x2<=x1)continue;
        out+=`<rect class="tripDashMazumeV35" x="${x1.toFixed(1)}" y="22" width="${(x2-x1).toFixed(1)}" height="116" rx="5"/><text class="tripDashMazumeLabelV35" x="${((x1+x2)/2).toFixed(1)}" y="34" text-anchor="middle">${label}</text>`;
      }
    }
    return out;
  }
  function renderDashboardGraph(){
    const box=byId('tripDashGraphV35'),win=dashboardWindow(),times=win.times,levels=win.levels,nowIdx=win.now;
    if(!box||times.length<2||levels.filter(v=>Number.isFinite(Number(v))).length<2){if(box)box.innerHTML='';return}
    const pts=dashboardPoints(levels),pairs=pts.split(' '),first=pairs[0]||'18,132',last=pairs[pairs.length-1]||'342,132',turns=tideTurns(times,levels,nowIdx).slice(0,3),nowX=18+324*(nowIdx/Math.max(1,times.length-1));
    const ticks=[0,6,12,18,23].filter(i=>i<times.length).map(i=>{const x=18+324*(i/Math.max(1,times.length-1));return `<text class="tripDashTickV35" x="${x.toFixed(1)}" y="158" text-anchor="${i===0?'start':i===times.length-1?'end':'middle'}">${fmtClock(times[i])}</text>`}).join('');
    const markers=turns.map(t=>{const x=18+324*(t.i/Math.max(1,times.length-1)),y=dashboardY(levels,t.i);return y==null?'':`<g class="tripDashTurnMarkV35 ${t.kind}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.5"/><text x="${x.toFixed(1)}" y="${Math.max(19,y-9).toFixed(1)}" text-anchor="middle">${t.symbol} ${fmtClock(t.time)}</text></g>`}).join('');
    const nowY=dashboardY(levels,nowIdx),current=Number(LIVE.marine?.current),flow=Number.isFinite(current)?`潮流 ${current.toFixed(1)} km/h`:'潮流 --';
    box.innerHTML=`<svg viewBox="0 0 360 168" aria-hidden="true">${dashboardMazume(times)}<line class="tripDashGridV35" x1="18" y1="82" x2="342" y2="82"/><polygon class="tripDashAreaV35" points="${pts} ${last.split(',')[0]},140 ${first.split(',')[0]},140"/><polyline class="tripDashCurveV35" points="${pts}"/><line class="tripDashNowLineV35" x1="${nowX.toFixed(1)}" y1="22" x2="${nowX.toFixed(1)}" y2="140"/><text class="tripDashNowLabelV35" x="${(nowX+4).toFixed(1)}" y="47">NOW</text>${nowY==null?'':`<circle class="tripDashNowDotV35" cx="${nowX.toFixed(1)}" cy="${nowY.toFixed(1)}" r="4.5"/>`}<text class="tripDashFlowV35" x="342" y="18" text-anchor="end">${flow}</text>${markers}${ticks}</svg>`;
    box.dataset.nowPercent=String(Math.round(100*nowIdx/Math.max(1,times.length-1)));
    box.setAttribute('aria-label',`24時間の潮位目安。過去約4時間とこれから約20時間。現在 ${fmtLevel(LIVE.marine?.level)}。${flow}。`);
  }

  function humanVerdict(fit){
    if(fit.includes('見合わせ'))return ['無理せず見合わせ','風・雨・波の条件が厳しい'];
    if(fit.includes('要注意'))return ['風・波に注意','軽い仕掛けより安全余裕を優先'];
    const now=localMs(LIVE.marine?.time||LIVE.weather?.time),bite=localMs(LIVE.tideDecision?.biteTime),slack=localMs(LIVE.tideDecision?.nextSlackTime);
    if(target()&&Number.isFinite(now)&&Number.isFinite(bite)&&bite>=now&&bite-now<=90*60000)return ['地合い接近',`候補 ${fmtClock(LIVE.tideDecision.biteTime)}`];
    if(Number.isFinite(now)&&Number.isFinite(slack)&&slack>=now&&slack-now<=90*60000)return ['潮止まり近い',`次の弱まり ${fmtClock(LIVE.tideDecision.nextSlackTime)}`];
    if(fit.includes('操作しやすい'))return ['今は狙いやすい','風・雨・波は極端ではない'];
    return ['まだ狙える',LIVE.tideDecision?.biteWindow&&LIVE.tideDecision.biteWindow!=='条件重なり待ち'?`条件重なり ${LIVE.tideDecision.biteWindow}`:'大きな悪条件は出ていない'];
  }
  function syncDashboard(){
    const dash=byId('tripDashboardV35'),fish=target(),place=LIVE?.place?.name||null,w=LIVE.weather||null,m=LIVE.marine||null,h=LIVE.marineHourly||{},loc=byId('conditionsLocationMountV35')?.closest('.conditionsLocationV35'),edit=byId('conditionsLocationEditV36');
    if(!dash)return;
    const hasData=Boolean(place&&w);
    dash.classList.toggle('is-empty',!hasData);
    byId('tripDashEmptyV35').hidden=hasData;
    set('tripDashPlaceV35',place||'釣行地を選択');
    set('tripDashScopeV35',fish?`${fish.name}補正`:'魚種未選択 · 汎用判断');
    set('tripDashDateV35',fmtDate(w?.time||h.time?.[0]));
    const solar=LIVE.solar?.[0];
    set('tripDashSunV35',solar?`☀ ${fmtClock(solar.sunrise)}　☾ ${fmtClock(solar.sunset)}`:'☀ --:--　☾ --:--');
    const fit=text('fieldFit','FIELD STATUS · 未取得').replace('FIELD STATUS · ','');
    set('tripDashStatusV35',fit);
    set('tripDashLevelV35',fmtLevel(m?.level));
    const trend=LIVE.tideDecision?.trend||text('tideFlowState','地点を選んで取得');
    set('tripDashTrendV35',trend);
    const win=dashboardWindow(),turn=tideTurns(win.times,win.levels,win.now)[0]||null,nowMs=localMs(m?.time||w?.time),turnMs=localMs(turn?.time),deltaMin=Number.isFinite(nowMs)&&Number.isFinite(turnMs)?Math.max(0,Math.round((turnMs-nowMs)/60000)):null;
    set('tripDashTurnLabelV35',turn?`次の${turn.type}`:'次の潮位変化');
    set('tripDashTurnTimeV35',turn?fmtClock(turn.time):'--:--');
    set('tripDashTurnEtaV35',turn?`${deltaMin!=null?(deltaMin<60?'あと'+deltaMin+'分':'あと約'+Math.round(deltaMin/60)+'時間'):'まもなく'} · ${fmtLevel(turn.level)}`:'24hモデルから算出');
    set('tripDashSlackV35',LIVE.tideDecision?.nextSlack||text('tideNextSlack','--'));
    set('tripDashBiteLabelV35',fish?'地合い候補':'釣行しやすい時間');
    set('tripDashBiteV35',LIVE.tideDecision?.biteWindow||text('tideBiteWindow','--'));
    set('tripDashWeatherV35',w?text('wxCode','--'):'--');
    set('tripDashRainV35',w?`雨${Number(w.precipitation??0).toFixed(1)}mm`:'--');
    const wind=Number(w?.wind),gust=Number(w?.gust);
    set('tripDashWindV35',Number.isFinite(wind)?`${wind.toFixed(1)}m/s`:'--');
    set('tripDashWindSubV35',w?`${compass(w.direction)} · 突風${Number.isFinite(gust)?gust.toFixed(1):'-'}`:'--');
    set('tripDashWaveV35',m?.wave!=null?`${Number(m.wave).toFixed(1)}m · ${m.wavePeriod!=null?Number(m.wavePeriod).toFixed(0)+'s':'--'}`:'--');
    set('tripDashWaveSubV35',m?.swell!=null?`うねり${Number(m.swell).toFixed(1)}m · ${m.swellPeriod!=null?Number(m.swellPeriod).toFixed(0)+'s':'--'}`:'海況モデル');
    set('tripDashTempV35',m?.sst!=null?`${Number(m.sst).toFixed(1)}℃`:'--');
    const n=typeof marineNowIndex==='function'?marineNowIndex(h.time||[]):0,temp=typeof seaTempTrend==='function'?seaTempTrend((h.sea_surface_temperature||[]).slice(n,n+24)):null;
    set('tripDashTempSubV35',temp?`${temp.label} · ${temp.delta>=0?'+':''}${temp.delta.toFixed(1)}℃/24h`:'24h推移');
    const verdict=humanVerdict(fit);set('tripDashVerdictV35',verdict[0]);set('tripDashVerdictSubV35',verdict[1]);
    if(loc){const changed=loc.dataset.place!==String(place||'');loc.classList.toggle('is-selected',hasData);if(changed){loc.dataset.place=String(place||'');loc.classList.remove('is-editing')}}
    set('conditionsLocationLabelV36',place?`釣行地 · ${place}`:'釣行地を選ぶ');
    if(edit){edit.hidden=!place;edit.textContent=loc?.classList.contains('is-editing')?'閉じる':'変更'}
    const refresh=byId('tripDashRefreshV35');if(refresh)refresh.disabled=!LIVE.place;
    renderDashboardGraph();
  }

  function sync(){
    const fish=target(),place=LIVE?.place?.name||'地点未取得',status=text('fieldFit','FIELD STATUS · 未取得').replace('FIELD STATUS · ','');
    const now=text('tideNow','地点を選んで取得'),slack=text('tideNextSlack','-'),bite=text('tideBiteWindow','-'),sst=text('seaTemp','-');
    set('conditionsFish',fish?.name||'魚種未選択');set('conditionsPlace',` · ${place}`);set('conditionsPageStatus',status);
    set('conditionsDecisionNow',now);set('conditionsDecisionSlack',slack);set('conditionsDecisionBite',bite);set('conditionsDecisionSst',sst);set('conditionsDecisionBiteLabel',fish?'地合い候補':'釣行しやすい時間');
    set('conditionsTeaserStatus',status);set('conditionsTeaserNow',now);set('conditionsTeaserSlack',slack);set('conditionsTeaserBite',bite);
    autoMount.hidden=!fish;
    const field=byId('conditionsFieldModeBtn'),choose=byId('conditionsChooseFishBtn');
    if(field){field.hidden=!fish;field.disabled=!fish}
    if(choose)choose.hidden=Boolean(fish);
    page.dataset.entry=fish?'fish':'global';
    syncDashboard();
  }

  let queued=false;
  const scheduleSync=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync()})};
  const observer=new MutationObserver(scheduleSync);
  observer.observe(liveMount,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['hidden','class']});

  function openGlobal(){LIVE.conditionsFish=null;sync();show('conditions');renderFieldLive();if(LIVE.place&&LIVE.weather&&!LIVE.marine)void fetchWeather(LIVE.place);track('conditions_page_open',{fish:null,place:LIVE?.place?.name||null,mode:'global'})}
  function openForFish(){if(typeof cur==='undefined'||!cur)return;LIVE.conditionsFish=cur;sync();show('conditions');renderFieldLive();track('conditions_page_open',{fish:cur.name,place:LIVE?.place?.name||null,mode:'fish'})}
  function restoreFish(name){LIVE.conditionsFish=name?F.find(f=>f.name===name)||null:null;sync();renderFieldLive()}

  byId('conditionsOpenBtn')?.addEventListener('click',openForFish);
  byId('conditionsBack')?.addEventListener('click',()=>show('result'));
  byId('conditionsChooseFishBtn')?.addEventListener('click',()=>show('home'));
  byId('conditionsPackBtn')?.addEventListener('click',()=>globalThis.FISH_TARGET_QUICK_PACK?.open?.());
  byId('conditionsFieldModeBtn')?.addEventListener('click',()=>{if(target())byId('fieldModeBtn')?.click()});
  byId('tripDashRefreshV35')?.addEventListener('click',()=>{if(LIVE.place)void fetchWeather(LIVE.place)});
  byId('conditionsLocationEditV36')?.addEventListener('click',()=>{const loc=byId('conditionsLocationMountV35')?.closest('.conditionsLocationV35');if(!loc)return;loc.classList.toggle('is-editing');const edit=byId('conditionsLocationEditV36');if(edit)edit.textContent=loc.classList.contains('is-editing')?'閉じる':'変更'});
  byId('conditionsDetailsV35')?.addEventListener('toggle',event=>{const em=event.currentTarget.querySelector('summary em');if(em)em.textContent=event.currentTarget.open?'閉じる':'開く'});

  globalThis.FISH_TARGET_CONDITIONS_PAGE=Object.freeze({version:'CONDITIONS-V35-DASHBOARD',sync,open:openGlobal,openGlobal,openForFish,restoreFish});
  sync();
})();