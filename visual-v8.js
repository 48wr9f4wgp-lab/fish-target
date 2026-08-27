(()=>{
  let scheduled=false;

  function updateCopy(){
    const result=document.getElementById('result');
    if(!result)return;
    const promise=result.querySelector('.quickPromise');
    if(promise)promise.textContent='まずは「FIRST CAST → タックル → 3ステップ」でOK';
    result.querySelectorAll('.sectionTitle').forEach(title=>{
      const raw=[...title.childNodes].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join('').trim();
      const small=title.querySelector('small');
      if(!small)return;
      if(raw.includes('まず投げるもの')||raw.includes('3秒プラン'))small.textContent='迷ったら、まずはこれ。';
      else if(raw==='必要なタックル'||raw==='必須タックル')small.textContent='この4つで基本セット。';
      else if(raw==='現場でやること 3つ'||raw==='現場では3ステップ')small.textContent='迷ったら、この順でOK。';
    });
  }

  function prioritizeActions(){
    const field=document.getElementById('fieldModeBtn');
    const save=document.getElementById('save');
    const copy=document.getElementById('copy');
    field?.classList.add('v8PrimaryCta');
    save?.classList.add('v8SecondaryCta');
    copy?.classList.add('v8TertiaryCta');
    if(copy)copy.textContent='プランをコピー';
  }

  function bindToggle(details,openLabel='閉じる',closedLabel='開く ›'){
    if(!details||details.dataset.v8Toggle==='1')return;
    details.dataset.v8Toggle='1';
    const label=details.querySelector(':scope > summary em');
    const sync=()=>{if(label)label.textContent=details.open?openLabel:closedLabel};
    details.addEventListener('toggle',sync);
    sync();
  }

  function enhanceGroups(){
    document.querySelectorAll('#result .v19Group').forEach(group=>bindToggle(group));
    const why=document.querySelector('#result .v19FitWhy');
    if(why){
      const summary=why.querySelector(':scope > summary');
      if(summary&&summary.dataset.v8!=='1'){
        summary.dataset.v8='1';
        summary.innerHTML='<span><b>判定理由を見る</b><small>○△×の内訳</small></span><em>開く ›</em>';
      }
      bindToggle(why);
    }
  }

  function apply(){
    scheduled=false;
    updateCopy();
    prioritizeActions();
    enhanceGroups();
  }
  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(apply);
  }

  if(typeof renderResult==='function'){
    const previous=renderResult;
    renderResult=function(...args){const out=previous.apply(this,args);schedule();return out};
  }

  const start=()=>{
    schedule();
    setTimeout(schedule,300);
    setTimeout(schedule,1200);
    window.addEventListener('pageshow',schedule);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.FISH_TARGET_VISUAL_V8=Object.freeze({version:'V23-VISUAL8',focus:'copy-cta-disclosure'});
})();
