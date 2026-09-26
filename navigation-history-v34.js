(()=>{
  const KEY='fishTargetNavigationV34';
  const views=['home','result','saved','fieldmode'];
  const planKeys=['place','season','goal','wind','tide','clarity','rotation','rotationManual','refined','methodKey'];
  let applying=false,current=null,queued=false,restoreToken=0;
  const clone=value=>JSON.parse(JSON.stringify(value));
  const modal=()=>!document.getElementById('tackleSheet')?.hidden?'tackle':!document.getElementById('packStandaloneV30')?.hidden?'pack':null;
  const key=row=>`${row.view}/${row.fish||''}/${row.modal||''}`;
  const snapshot=()=>({
    view:document.querySelector('.view.on')?.id||'home',modal:modal(),
    fish:cur?.name||null,from,
    plan:Object.fromEntries(planKeys.filter(k=>Object.hasOwn(state,k)).map(k=>[k,state[k]])),
    home:{query:document.getElementById('q').value,water:waterFilter,style:styleFilter,difficulty:difficultyFilter},
    scroll:window.scrollY
  });
  // Fish context only distinguishes result/field entries, never the home tab.
  const routeKey=row=>key({...row,fish:['result','fieldmode'].includes(row.view)?row.fish:null});
  function write(row,push=false){
    const entry={...row,version:1};
    if(!push&&JSON.stringify(entry)===JSON.stringify(current))return;
    history[push?'pushState':'replaceState']({...history.state,[KEY]:entry},'');
    current=entry;
  }
  function valid(row){
    return row?.version===1&&views.includes(row.view)&&Number.isInteger(row.index)&&row.index>=0
      &&[null,'tackle','pack'].includes(row.modal)&&row.home&&typeof row.home.query==='string'
      &&row.plan&&typeof row.plan==='object'&&planKeys.every(k=>!Object.hasOwn(row.plan,k)||(['rotationManual','refined'].includes(k)?typeof row.plan[k]==='boolean':k==='rotation'?Number.isInteger(row.plan[k])&&row.plan[k]>=0&&row.plan[k]<100:typeof row.plan[k]==='string'&&row.plan[k].length<200))&&(!['result','fieldmode'].includes(row.view)||F.some(f=>f.name===row.fish));
  }
  function sync(){
    queued=false;if(applying||!current)return;
    const next=snapshot(),same=routeKey(next)===routeKey(current);
    if(same){write({...next,index:current.index,parent:current.parent});return}
    // Existing close/back handlers update the UI synchronously. Consume their
    // matching history entry instead of appending a duplicate destination.
    if(current.index>0&&current.parent===routeKey(next)){
      applying=true;history.back();return;
    }
    write({...next,index:current.index+1,parent:routeKey(current)},true);
  }
  const schedule=()=>{if(queued||applying)return;queued=true;queueMicrotask(sync)};
  function remember(){
    if(applying||!current)return;
    const now=snapshot();
    if(routeKey(now)===routeKey(current))write({...now,index:current.index,parent:current.parent});
  }
  async function restore(row){
    const token=++restoreToken;
    applying=true;
    const before=snapshot();
    globalThis.FISH_TARGET_MODAL_FOCUS?.dismiss();
    const safe=valid(row)?row:{...snapshot(),view:'home',modal:null,index:0,parent:null,version:1};
    const sameBase=before.view===safe.view&&before.fish===safe.fish&&JSON.stringify(before.plan)===JSON.stringify(safe.plan)&&JSON.stringify(before.home)===JSON.stringify(safe.home);
    if(!sameBase){
      document.getElementById('q').value=safe.home.query.slice(0,200);
      waterFilter=['all','salt','fresh'].includes(safe.home.water)?safe.home.water:'all';
      styleFilter=['all','lure','bait'].includes(safe.home.style)?safe.home.style:'all';
      difficultyFilter=['all','easy','mid','advanced'].includes(safe.home.difficulty)?safe.home.difficulty:'all';
      renderFilters();renderHome();
      const fish=F.find(f=>f.name===safe.fish);
      if(fish&&['result','fieldmode'].includes(safe.view)){
        const plan=Object.fromEntries(planKeys.filter(k=>Object.hasOwn(safe.plan,k)).map(k=>[k,safe.plan[k]]));
        openFish(fish,plan);from=safe.from==='saved'?'saved':'home';
      }
      show(safe.view);
    }
    // Let existing MY SET rendering derive from current owned gear, not history.
    if(safe.view==='fieldmode')await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    if(token!==restoreToken)return;
    if(safe.view==='fieldmode')document.getElementById('fieldModeBtn').click();
    if(safe.modal==='tackle')document.getElementById('tackleManage').click();
    if(safe.modal==='pack')globalThis.FISH_TARGET_QUICK_PACK.open();
    scrollTo({top:safe.view==='home'?Math.max(0,Number(safe.scroll)||0):0,behavior:'instant'});
    write({...snapshot(),index:safe.index,parent:safe.parent});
    applying=false;
  }
  document.addEventListener('click',remember,true);
  document.addEventListener('input',schedule);
  document.addEventListener('change',schedule);
  document.addEventListener('click',schedule);
  window.addEventListener('pagehide',remember);
  window.addEventListener('popstate',event=>{void restore(event.state?.[KEY])});
  const observer=new MutationObserver(schedule);
  for(const id of [...views,'tackleSheet','packStandaloneV30']){
    const el=document.getElementById(id);if(el)observer.observe(el,{attributes:true,attributeFilter:['class','hidden']});
  }
  history.scrollRestoration='manual';
  const initial=history.state?.[KEY];
  if(valid(initial))void restore(clone(initial));
  else write({...snapshot(),index:0,parent:null});
  globalThis.FISH_TARGET_NAVIGATION=Object.freeze({version:'NAVIGATION-V34',getState:()=>clone(current),isRestoring:()=>applying});
})();
