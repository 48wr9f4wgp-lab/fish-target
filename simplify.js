(()=>{
  const once=(el,key)=>{if(!el||el.dataset[key])return false;el.dataset[key]='1';return true};
  function updateHeroCopy(){
    const hero=document.querySelector('.hero > p');
    if(hero)hero.textContent='魚を選ぶだけで、釣法・FIRST CAST・手持ちタックル判定まで。';
  }

  function compactHome(){
    const body=document.querySelector('#home .body');
    const grid=document.getElementById('grid');
    const fishHead=grid?.previousElementSibling?.classList.contains('head')?grid.previousElementSibling:[...body?.querySelectorAll('.head')||[]].find(x=>x.querySelector('h2')?.textContent.includes('魚を選ぶ'));
    const popularHead=[...body?.querySelectorAll('.head')||[]].find(x=>x.querySelector('h2')?.textContent.includes('人気ターゲット'));
    const myTargets=document.getElementById('myTargets');
    if(body&&myTargets&&popularHead&&myTargets!==popularHead.previousElementSibling)body.insertBefore(myTargets,popularHead);

    const tackle=document.getElementById('myTackleHome');
    if(tackle)tackle.classList.add('v19HomeTackleHidden');

    const filter=document.querySelector('#home .filterPanel');
    if(body&&fishHead&&filter&&!document.getElementById('v19Utilities')){
      const utilities=document.createElement('div');
      utilities.id='v19Utilities';utilities.className='v19Utilities';
      const filters=document.createElement('details');filters.id='v19FilterDetails';filters.className='v19FilterDetails';
      filters.innerHTML='<summary><span>絞り込み</span><small>水域・釣り方・難易度</small></summary>';
      filter.parentNode.insertBefore(utilities,filter);
      utilities.appendChild(filters);filters.appendChild(filter);
      const tackleBtn=document.createElement('button');tackleBtn.type='button';tackleBtn.className='v19TackleShortcut';tackleBtn.innerHTML='<span>MY TACKLE</span><small>手持ちを編集</small>';
      tackleBtn.onclick=()=>document.getElementById('tackleManage')?.click();
      utilities.appendChild(tackleBtn);
      body.insertBefore(utilities,fishHead);
    }
  }

  function moveWithHeading(el,container){
    if(!el||!container)return;
    const prev=el.previousElementSibling;
    if(prev?.matches('h2.sectionTitle'))container.appendChild(prev);
    container.appendChild(el);
  }

  function makeGroup(id,title,sub,after){
    let d=document.getElementById(id);
    if(d)return d;
    d=document.createElement('details');d.id=id;d.className='v19Group';
    d.innerHTML=`<summary><span><b>${title}</b><small>${sub}</small></span><em>開く</em></summary><div class="v19GroupBody"></div>`;
    after?.insertAdjacentElement('afterend',d);
    d.addEventListener('toggle',()=>{const em=d.querySelector('summary em');if(em)em.textContent=d.open?'閉じる':'開く'});
    return d;
  }

  function collapseFitDetails(){
    const fb=document.getElementById('fitBreakdown');
    if(!fb||fb.dataset.v19==='1')return;
    fb.dataset.v19='1';
    const head=fb.querySelector('.fitBreakdownHead');
    const rows=fb.querySelector('.fitRows');
    const decision=fb.querySelector('.buyDecision');
    if(!rows)return;
    const d=document.createElement('details');d.className='v19FitWhy';
    d.innerHTML='<summary><span>判定理由を見る</span><em>○△×</em></summary>';
    if(head)d.appendChild(head);d.appendChild(rows);
    if(decision)fb.insertBefore(d,decision);else fb.appendChild(d);
  }

  function compactResult(){
    const body=document.querySelector('#result .body');
    const fieldBtn=document.getElementById('fieldModeBtn');
    const actions=document.querySelector('#result .actions');
    if(body&&fieldBtn&&actions&&fieldBtn.nextElementSibling!==actions)actions.parentNode.insertBefore(fieldBtn,actions);

    const divider=document.querySelector('#result .detailDivider');if(divider)divider.classList.add('v19Retired');
    const autoCard=document.querySelector('#result .autoCard');
    if(autoCard){autoCard.classList.add('v19Retired');const h=autoCard.previousElementSibling;if(h?.matches('h2.sectionTitle'))h.classList.add('v19Retired')}

    if(body&&fieldBtn){
      const conditions=makeGroup('v19Conditions','今日の条件を反映','天候・海況・手動条件でプランを補正',actions||fieldBtn);
      const cbody=conditions?.querySelector('.v19GroupBody');
      const fieldLive=document.querySelector('#result .fieldLive');
      const autoAdjust=document.getElementById('autoAdjust');
      const refine=document.getElementById('refine');
      if(fieldLive&&!fieldLive.closest('#v19Conditions'))moveWithHeading(fieldLive,cbody);
      if(autoAdjust&&!autoAdjust.closest('#v19Conditions'))moveWithHeading(autoAdjust,cbody);
      if(refine&&!refine.closest('#v19Conditions'))cbody.appendChild(refine);
      let state=document.getElementById('v19ConditionState');
      if(!state){state=document.createElement('span');state.id='v19ConditionState';state.className='v19ConditionState';conditions.querySelector('summary span')?.appendChild(state)}
      const fit=document.getElementById('fieldFit');
      const sync=()=>{if(state)state.textContent=fit?.textContent?.replace('FIELD STATUS · ','')||'未取得'};
      sync();
      if(fit&&!fit.dataset.v19Observed){fit.dataset.v19Observed='1';new MutationObserver(sync).observe(fit,{childList:true,characterData:true,subtree:true})}

      const details=makeGroup('v19Details','詳細を見る','仕掛け・根拠・製品・持ち物・注意点',conditions);
      const dbody=details?.querySelector('.v19GroupBody');
      const evidence=document.getElementById('evidence');if(evidence&&!evidence.closest('#v19Details'))moveWithHeading(evidence,dbody);
      const products=document.getElementById('productsSection');if(products&&!products.closest('#v19Details'))dbody.appendChild(products);
      const shopping=document.querySelector('#result .shoppingCard');if(shopping&&!shopping.closest('#v19Details'))moveWithHeading(shopping,dbody);
      const rig=document.querySelector('#result .rigCard');if(rig&&!rig.closest('#v19Details'))moveWithHeading(rig,dbody);
      const mistakes=document.getElementById('mistakes')?.closest('section.card');if(mistakes&&!mistakes.closest('#v19Details'))moveWithHeading(mistakes,dbody);
      const disclaimer=document.querySelector('#result .disclaimer');if(disclaimer&&!disclaimer.closest('#v19Details'))dbody.appendChild(disclaimer);
    }
    collapseFitDetails();
  }

  function apply(){updateHeroCopy();compactHome();compactResult()}
  apply();
  if(typeof renderResult==='function'){
    const prev=renderResult;
    renderResult=function(...args){const out=prev.apply(this,args);apply();return out};
  }
  window.addEventListener('pageshow',apply);
})();
