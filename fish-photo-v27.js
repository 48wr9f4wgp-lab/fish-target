(()=>{
  const LOCAL=new Set(globalThis.FISH_TARGET_REAL_FISH?.species||[]);
  const pending=new Map();
  const mounted=new WeakSet();
  const cacheKey=name=>`ft-fish-photo-v27:${name}`;
  const titleAlias=Object.freeze({
    'ブリ・ワラサ':'ブリ','ヤマメ・イワナ':'ヤマメ','グレ':'メジナ','シーバス':'スズキ','ブラックバス':'オオクチバス'
  });
  const allowed=/^(CC0|Public domain|CC BY(?:-[A-Z]+)?(?: \d(?:\.\d)?)?|CC BY-SA(?: \d(?:\.\d)?)?)$/i;
  const clean=s=>String(s||'').replace(/<[^>]*>/g,'').replace(/&nbsp;/g,' ').trim();
  async function json(url){
    const ctl=new AbortController();
    const timer=setTimeout(()=>ctl.abort(),6500);
    try{const r=await fetch(url,{mode:'cors',credentials:'omit',signal:ctl.signal});if(!r.ok)throw new Error(`HTTP ${r.status}`);return await r.json()}finally{clearTimeout(timer)}
  }
  async function resolve(name){
    try{
      const stored=localStorage.getItem(cacheKey(name));
      if(stored){const v=JSON.parse(stored);if(v?.url&&v?.license)return v}
    }catch{}
    const title=titleAlias[name]||name;
    const wp=`https://ja.wikipedia.org/w/api.php?action=query&format=json&origin=*&redirects=1&prop=pageimages&piprop=name&titles=${encodeURIComponent(title)}`;
    const page=await json(wp);
    const p=Object.values(page?.query?.pages||{})[0];
    const file=p?.pageimage;
    if(!file)throw new Error('no page image');
    const commons=`https://commons.wikimedia.org/w/api.php?action=query&format=json&origin=*&prop=imageinfo&iiprop=url%7Cextmetadata&iiurlwidth=720&titles=${encodeURIComponent(`File:${file}`)}`;
    const meta=await json(commons);
    const info=Object.values(meta?.query?.pages||{})[0]?.imageinfo?.[0];
    const ext=info?.extmetadata||{};
    const license=clean(ext.LicenseShortName?.value||ext.UsageTerms?.value);
    if(!allowed.test(license))throw new Error(`license rejected: ${license||'unknown'}`);
    const value={url:info.thumburl||info.url,license,artist:clean(ext.Artist?.value||ext.Credit?.value),source:'Wikimedia Commons'};
    if(!value.url)throw new Error('no image url');
    try{localStorage.setItem(cacheKey(name),JSON.stringify(value))}catch{}
    return value;
  }
  function creditText(v){return [v.source,v.license,v.artist].filter(Boolean).join(' · ')}
  function mount(host,name){
    if(!host||!name||LOCAL.has(name)||mounted.has(host))return;
    mounted.add(host);
    let task=pending.get(name);
    if(!task){task=resolve(name).catch(()=>null);pending.set(name,task)}
    task.then(v=>{
      if(!v||!host.isConnected)return;
      const img=document.createElement('img');
      img.className='fishPhotoV27';img.alt=`${name}の実写`;img.loading='lazy';img.decoding='async';img.referrerPolicy='no-referrer';img.src=v.url;
      img.addEventListener('load',()=>{
        host.querySelectorAll(':scope>.fishPhotoV27,:scope>.fishPhotoCreditV27').forEach(el=>el.remove());
        host.appendChild(img);
        const credit=document.createElement('span');credit.className='fishPhotoCreditV27';credit.textContent=creditText(v);credit.title=credit.textContent;host.appendChild(credit);
        host.classList.add('fishPhotoMountedV27');host.dataset.fishAsset='wikimedia-licensed-photo';
      },{once:true});
    });
  }
  const seen=new WeakSet();
  const io='IntersectionObserver'in window?new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)return;const h=e.target;const n=h.closest('.fish[data-fish]')?.dataset.fish||document.getElementById('rname')?.textContent?.trim();mount(h,n);io.unobserve(h)}),{rootMargin:'220px 0px'}):null;
  function watch(host){if(!host||seen.has(host))return;seen.add(host);if(io)io.observe(host);else{const n=host.closest('.fish[data-fish]')?.dataset.fish||document.getElementById('rname')?.textContent?.trim();mount(host,n)}}
  function sync(){document.querySelectorAll('#grid .fish[data-fish] .art').forEach(watch);watch(document.getElementById('tart'))}
  const observer=new MutationObserver(()=>requestAnimationFrame(sync));
  function start(){sync();['grid','result'].map(id=>document.getElementById(id)).filter(Boolean).forEach(el=>observer.observe(el,{childList:true,subtree:true,characterData:true}));window.addEventListener('pageshow',sync)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.FISH_TARGET_PHOTO_V27=Object.freeze({version:'V27',provider:'Wikimedia Commons',policy:'licensed-photo-only-with-svg-offline-fallback',localSpecies:Object.freeze([...LOCAL])});
})();
