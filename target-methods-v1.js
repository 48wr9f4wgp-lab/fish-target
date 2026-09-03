(()=>{
  const expansion=globalThis.FISH_TARGET_METHOD_EXPANSION_V1;
  if(!expansion||typeof F==='undefined'||!Array.isArray(F))return;

  const clone=v=>JSON.parse(JSON.stringify(v));
  const originalCount=F.length;
  const existingNames=new Set(F.map(x=>x.name));

  // Add expanded targets first. Later expansion phases can attach additional
  // methods through `existing` to targets introduced by an earlier phase
  // (for example TARGET2 adding ちょい投げ to TARGET1's カレイ).
  for(const raw of expansion.targets||[]){
    if(existingNames.has(raw.name))continue;
    const methods=clone(raw.methods||[]);
    const first=methods.shift();
    if(!first)continue;
    const fish={...clone(raw),...first,methods,styles:[...new Set([first.style,...methods.map(x=>x.style)].filter(Boolean))]};
    fish._methodSource=first.source||null;
    delete fish.id;
    delete fish.source;
    F.push(fish);
    existingNames.add(fish.name);
  }

  // Apply alternate methods only after every expanded target exists in F.
  // This keeps staged expansions composable instead of silently dropping
  // methods aimed at targets added by a previous expansion phase.
  for(const [name,methods] of Object.entries(expansion.existing||{})){
    const fish=F.find(x=>x.name===name);
    if(!fish)continue;
    fish.methods=[...(Array.isArray(fish.methods)?fish.methods:[]),...clone(methods)];
    fish.styles=[...new Set([fish.style,...fish.methods.map(x=>x.style)].filter(Boolean))];
  }

  const methodsFor=fish=>{
    if(!fish)return[];
    const base={
      id:'default',
      method:fish.method,
      style:fish.style,
      why:fish.why,
      rod:fish.rod,reel:fish.reel,line:fish.line,leader:fish.leader,rig:fish.rig,
      bait:fish.bait,size:fish.size,color:fish.color,baitAction:fish.baitAction,
      range:fish.range,action:fish.action,time:fish.time,steps:fish.steps,places:fish.places,
      difficulty:fish.difficulty,mistakes:fish.mistakes,source:fish._methodSource||null
    };
    return [base,...(Array.isArray(fish.methods)?fish.methods:[])];
  };
  const selectedFor=fish=>{
    const list=methodsFor(fish);
    const wanted=typeof state!=='undefined'&&state?.methodKey?state.methodKey:'default';
    return list.find(x=>x.id===wanted)||list[0]||null;
  };

  const coreBasePlan=basePlan;
  basePlan=function(){
    const selected=selectedFor(cur);
    if(!selected||selected.id==='default')return coreBasePlan();
    const p={...cur,...selected};
    if(state.goal==='大物狙い'){
      if(typeof p.rod==='string'&&!p.rod.includes('強め優先'))p.rod+='（強め優先）';
      if(typeof p.leader==='string'&&!p.leader.includes('上限寄り'))p.leader+='（上限寄り）';
    }
    return p;
  };

  const coreChoice=choice;
  choice=function(id,vals,key){
    if(id==='places'&&cur){
      const selected=selectedFor(cur);
      const places=[...new Set(selected?.places||cur.places||[])];
      vals=['おすすめ',...places];
      if(!vals.includes(state.place))state.place='おすすめ';
    }
    return coreChoice(id,vals,key);
  };

  renderHome=function(){
    const q=$('q').value.trim().toLowerCase();
    $('clearSearch').classList.toggle('on',!!q);
    const a=F.filter(f=>{
      const methodNames=methodsFor(f).map(x=>x.method).join(' ');
      const core=(f.name+' '+f.tags.join(' ')+' '+(f.syn||[]).join(' ')+' '+methodNames).toLowerCase();
      const styles=f.styles||[f.style];
      const match=!q||core.includes(q);
      return (waterFilter==='all'||f.water===waterFilter)
        &&(styleFilter==='all'||styles.includes(styleFilter))
        &&(difficultyFilter==='all'||difficultyBucket(f)===difficultyFilter)
        &&match;
    });
    $('count').textContent=`${a.length}種`;
    $('grid').innerHTML=a.length?a.map(f=>`<button class="fish ${f.water==='fresh'?'fresh':''}" data-fish="${f.name}" data-i="${F.indexOf(f)}"><div class="art">${speciesArt(f)}</div><div class="info"><div class="tags">${f.tags.join(' ・ ')}</div><div class="name">${f.name}</div><span class="methodSmall">おすすめ：${f.method}${methodsFor(f).length>1?` +${methodsFor(f).length-1}釣法`:''}</span><div class="difficultyMini">${f.difficulty||''}</div></div></button>`).join(''):'<div class="empty">該当する魚がないで。検索語かフィルターを変えてみて。</div>';
    $('grid').querySelectorAll('.fish').forEach(b=>b.onclick=()=>openFish(F[+b.dataset.i]));
  };

  // app.js attached the search input directly to its original renderHome function.
  // Run the expansion-aware renderer after that listener so alternate method names
  // (for example ハゼクランク) are searchable without rewriting the stable core.
  const searchInput=$('q');
  if(searchInput&&!searchInput.dataset.targetMethodSearchBound){
    searchInput.dataset.targetMethodSearchBound='1';
    searchInput.addEventListener('input',()=>renderHome());
  }

  function ensurePicker(){
    const card=document.querySelector('#result .planCard');
    if(!card)return null;
    let box=document.getElementById('methodPickerV1');
    if(box)return box;
    box=document.createElement('div');
    box.id='methodPickerV1';
    box.className='methodPickerV1';
    const top=card.querySelector('.planTop');
    top?.insertAdjacentElement('afterend',box);
    return box;
  }

  function sourceLabel(method){
    if(!method?.source)return '既存基準';
    return method.source.confidence==='A'?'確認済':'要確認';
  }

  function renderPicker(){
    const box=ensurePicker();
    if(!box||!cur)return;
    const list=methodsFor(cur);
    const selected=selectedFor(cur);
    if(list.length<=1){box.hidden=true;return}
    box.hidden=false;
    box.innerHTML=`<div class="methodPickerHead"><div><span>釣法を選ぶ</span><b>${list.length}通り</b></div><small>岸・船・ルアー・エサを切替</small></div><div class="methodPickerRail">${list.map(x=>`<button type="button" class="${x.id===selected?.id?'on':''}" data-method-id="${x.id}"><b>${x.method}</b><small>${x.places?.join(' / ')||'場所は状況次第'} · ${sourceLabel(x)}</small></button>`).join('')}</div>`;
    box.querySelectorAll('[data-method-id]').forEach(btn=>btn.onclick=()=>{
      const id=btn.dataset.methodId;
      const next=methodsFor(cur).find(x=>x.id===id)||methodsFor(cur)[0];
      state.methodKey=next.id;
      state.rotation=0;
      state.rotationManual=false;
      if(state.place!=='おすすめ'&&Array.isArray(next.places)&&!next.places.includes(state.place))state.place='おすすめ';
      track('method_select',{fish:cur.name,method:next.method,method_id:next.id});
      renderResult();
    });
  }

  const coreRenderResult=renderResult;
  renderResult=function(...args){
    const out=coreRenderResult.apply(this,args);
    renderPicker();
    const p=basePlan();
    if(p?.difficulty&&$('difficultyBadge'))$('difficultyBadge').textContent=p.difficulty;
    if(Array.isArray(p?.mistakes)&&$('mistakes'))$('mistakes').innerHTML=p.mistakes.map(x=>`<li>${x}</li>`).join('');
    updateHeroStats();
    return out;
  };

  function updateHeroStats(){
    const stats=[...document.querySelectorAll('#home .heroStats span')];
    if(stats[0])stats[0].textContent=`${F.length}魚種`;
    const planCount=F.reduce((n,f)=>n+methodsFor(f).length,0);
    const methodStat=stats.find(x=>/釣法/.test(x.textContent||''));
    if(methodStat)methodStat.textContent=`${planCount}釣法プラン`;
  }

  const saveButton=$('save');
  if(saveButton)saveButton.onclick=()=>{
    if(!cur)return;
    const methodKey=selectedFor(cur)?.id||'default';
    let a=savedData(),x={fish:cur.name,...state,methodKey};
    a=a.filter(y=>!(y.fish===x.fish&&y.place===x.place&&y.season===x.season&&y.goal===x.goal&&(y.methodKey||'default')===methodKey));
    a.unshift(x);
    storeSet('fish_target_v9',JSON.stringify(a.slice(0,20)));
    track('plan_save',{fish:cur.name,method:basePlan()?.method,method_id:methodKey});
    toast('この釣法プランを保存した');
  };

  updateHeroStats();
  renderHome();

  globalThis.FISH_TARGET_METHOD_STATUS=Object.freeze({
    version:expansion.version,
    baseTargets:originalCount,
    targets:F.length,
    addedTargets:F.length-originalCount,
    plans:F.reduce((n,f)=>n+methodsFor(f).length,0),
    methodsFor,
    selectedFor
  });
})();
