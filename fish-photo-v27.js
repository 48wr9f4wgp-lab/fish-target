(()=>{
  const PARAMS=new URLSearchParams(location.search);
  const REMOTE_ENABLED=location.protocol==='https:'||PARAMS.get('fishPhotoRemote')==='on';
  const EAGER=PARAMS.get('fishPhotoEager')==='on';
  const QA_AUTOLOAD=PARAMS.get('fishPhotoQaAutoLoad')==='on'&&location.hostname==='127.0.0.1';
  const LOCAL=new Set(globalThis.FISH_TARGET_REAL_FISH?.species||[]);
  const pending=new Map();
  const cacheKey=name=>`ft-fish-photo-v27r3:${name}`;
  const titleAlias=Object.freeze({
    'ブリ・ワラサ':'ブリ','ヤマメ・イワナ':'ヤマメ','グレ':'メジナ','シーバス':'スズキ','ブラックバス':'オオクチバス',
    'サバ':'マサバ','イワシ':'マイワシ','ハゼ':'マハゼ','エソ':'マエソ','テナガエビ':'テナガエビ','ウミタナゴ':'ウミタナゴ','コノシロ':'コノシロ','ウグイ':'ウグイ','マブナ':'ギンブナ'
  });
  const allowed=/^(CC0|Public domain|CC BY(?:-[A-Z]+)?(?: \d(?:\.\d)?)?|CC BY-SA(?: \d(?:\.\d)?)?)$/i;
  const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim();
  const candidates=name=>[titleAlias[name],name,String(name).split(/[・／/]/)[0]].filter((v,i,a)=>v&&a.indexOf(v)===i);
  async function json(url){
    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),6500);
    try{const r=await fetch(url,{mode:'cors',credentials:'omit',signal:ctl.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json()}finally{clearTimeout(timer)}
  }
  function licensedValue(info,source,article){
    if(!info)return null;
    const ext=info.extmetadata||{};
    const license=clean(ext.LicenseShortName?.value||ext.UsageTerms?.value);
    if(!allowed.test(license))return null;
    const value={url:info.thumburl||info.url,license,artist:clean(ext.Artist?.value||ext.Credit?.value),source,article};
    return value.url?value:null;
  }
  async function imageInfo(api,file,source,article){
    const url=`${api}?action=query&format=json&origin=*&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=720&titles=${encodeURIComponent(`File:${file}`)}`;
    const meta=await json(url);
    const info=Object.values(meta?.query?.pages||{})[0]?.imageinfo?.[0];
    return licensedValue(info,source,article);
  }
  async function resolveTitle(title){
    const wp=`https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}`;
    const page=await json(wp);
    const p=Object.values(page?.query?.pages||{})[0];
    const file=p?.pageimage;
    if(!file)return null;
    try{
      const local=await imageInfo('https://ja.wikipedia.org/w/api.php',file,'Wikipedia / Wikimedia',title);
      if(local)return local;
    }catch{}
    try{
      return await imageInfo('https://commons.wikimedia.org/w/api.php',file,'Wikimedia Commons',title);
    }catch{return null}
  }
  async function resolve(name){
    try{
      const stored=localStorage.getItem(cacheKey(name));
      if(stored){const v=JSON.parse(stored);if(v?.url&&v?.license&&allowed.test(v.license))return v}
    }catch{}
    for(const title of candidates(name)){
      try{
        const value=await resolveTitle(title);
        if(!value)continue;
        try{localStorage.setItem(cacheKey(name),JSON.stringify(value))}catch{}
        return value;
      }catch{}
    }
    throw new Error(`no licensed photo: ${name}`);
  }
  function clearHost(host){
    if(!host)return;
    host.querySelectorAll(':scope>.fishPhotoV27,:scope>.fishPhotoCreditV27').forEach(el=>el.remove());
    host.classList.remove('fishPhotoMountedV27');
    if(host.dataset.fishAsset==='wikimedia-licensed-photo')delete host.dataset.fishAsset;
    delete host.dataset.fishPhotoName;
  }
  function creditText(v){return [v.source,v.license,v.artist].filter(Boolean).join(' · ')}
  function commitPhoto(host,name,v,img){
    if(host.dataset.fishPhotoName!==name)return;
    host.querySelectorAll(':scope>.fishPhotoV27,:scope>.fishPhotoCreditV27').forEach(el=>el.remove());
    host.appendChild(img);
    const credit=document.createElement('span');credit.className='fishPhotoCreditV27';credit.textContent=creditText(v);credit.title=`${credit.textContent}${v.article?` · ${v.article}`:''}`;host.appendChild(credit);
    host.classList.add('fishPhotoMountedV27');host.dataset.fishAsset='wikimedia-licensed-photo';
  }
  function mount(host,name){
    if(!REMOTE_ENABLED||!navigator.onLine||!host||!name)return;
    if(LOCAL.has(name)){if(host.dataset.fishPhotoName)clearHost(host);return}
    if(host.dataset.fishPhotoName===name&&host.classList.contains('fishPhotoMountedV27'))return;
    if(host.dataset.fishPhotoName&&host.dataset.fishPhotoName!==name)clearHost(host);
    host.dataset.fishPhotoName=name;
    let task=pending.get(name);
    if(!task){task=resolve(name).catch(()=>null);pending.set(name,task)}
    task.then(v=>{
      if(!v||!host.isConnected||host.dataset.fishPhotoName!==name)return;
      const img=document.createElement('img');
      img.className='fishPhotoV27';img.alt=`${name}の実写`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';
      if(QA_AUTOLOAD){img.src=v.url;queueMicrotask(()=>commitPhoto(host,name,v,img));return}
      img.addEventListener('load',()=>commitPhoto(host,name,v,img),{once:true});
      img.addEventListener('error',()=>{
        pending.delete(name);
        try{localStorage.removeItem(cacheKey(name))}catch{}
        if(host.dataset.fishPhotoName===name)delete host.dataset.fishPhotoName;
      },{once:true});
      img.src=v.url;
    });
  }
  const seen=new WeakSet();
  const io=!EAGER&&'IntersectionObserver'in window?new IntersectionObserver(entries=>entries.forEach(e=>{
    if(!e.isIntersecting)return;
    const host=e.target;const name=host.closest('.fish[data-fish]')?.dataset.fish;
    if(name)mount(host,name);
    io.unobserve(host);
  }),{rootMargin:'220px 0px'}):null;
  function watchGrid(host){
    if(!host||seen.has(host))return;
    seen.add(host);
    const name=host.closest('.fish[data-fish]')?.dataset.fish;
    if(EAGER||!io)mount(host,name);else io.observe(host);
  }
  function sync(){
    if(!REMOTE_ENABLED)return;
    document.querySelectorAll('#grid .fish[data-fish] .art').forEach(watchGrid);
    const detail=document.getElementById('tart');
    const name=document.getElementById('rname')?.textContent?.trim();
    if(detail&&name)mount(detail,name);
  }
  let scheduled=false;
  const schedule=()=>{if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;sync()})};
  const observer=new MutationObserver(schedule);
  function start(){
    if(!REMOTE_ENABLED)return;
    sync();
    ['grid','result'].map(id=>document.getElementById(id)).filter(Boolean).forEach(el=>observer.observe(el,{childList:true,subtree:true,characterData:true}));
    window.addEventListener('pageshow',schedule);window.addEventListener('online',schedule);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.FISH_TARGET_PHOTO_V27=Object.freeze({version:'V27R3',provider:'Wikimedia',policy:'licensed-photo-only-with-svg-offline-fallback',enabled:REMOTE_ENABLED,eager:EAGER,qaAutoLoad:QA_AUTOLOAD,localSpecies:Object.freeze([...LOCAL]),aliases:titleAlias});
})();
