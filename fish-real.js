(()=>{
  const BUILD=document.documentElement.dataset.build||'dev';
  const ROW_URLS=Object.freeze([0,1,2,3].map(row=>`./fish-real-row${row}.b64?v=${BUILD}`));
  const ORDER=Object.freeze({
    'ブリ・ワラサ':0,'カンパチ':1,'サワラ':2,'シーバス':3,'ヒラメ':4,
    'マゴチ':5,'アジ':6,'メバル':7,'アオリイカ':8,'タチウオ':9,
    'クロダイ':10,'マダイ':11,'シロギス':12,'カワハギ':13,'ブラックバス':14,
    'ニジマス':15,'アユ':16,'コイ':17,'ヤマメ・イワナ':18
  });
  let rows=null;
  let ready=false;
  let scheduled=false;
  let started=false;

  const slot=name=>{
    const index=ORDER[name];
    if(index===undefined)return null;
    return {row:Math.floor(index/5),x:`${(index%5)*25}%`};
  };

  const probe=dataUrl=>new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve();
    image.onerror=()=>reject(new Error('decoded WebP row failed image probe'));
    image.src=dataUrl;
  });

  async function loadRows(){
    try{
      const encoded=await Promise.all(ROW_URLS.map(async url=>{
        const response=await fetch(url);
        if(!response.ok)throw new Error(`fish row request failed: ${response.status}`);
        const text=(await response.text()).trim();
        if(!text.startsWith('UklG')||text.length<1000)throw new Error('fish row payload is invalid or truncated');
        return `data:image/webp;base64,${text}`;
      }));
      await Promise.all(encoded.map(probe));
      rows=encoded;
      ready=true;
      document.documentElement.classList.add('realFishReady');
      schedule();
    }catch(error){
      console.warn('real fish rows unavailable; keeping SVG fallback',error);
    }
  }

  function mount(host,name){
    const position=slot(name);
    if(!host||!position)return;
    host.classList.add('realFishHost');
    let art=host.querySelector(':scope > .realFishSprite');
    if(!art){
      art=document.createElement('span');
      art.className='realFishSprite';
      art.setAttribute('aria-hidden','true');
      host.appendChild(art);
    }
    art.style.setProperty('--fish-x',position.x);
    if(rows)art.style.backgroundImage=`url("${rows[position.row]}")`;
    if(ready)host.classList.add('realFishMounted');
  }

  function sync(){
    scheduled=false;
    document.querySelectorAll('#grid .fish[data-fish]').forEach(card=>mount(card.querySelector('.art'),card.dataset.fish));
    const name=document.getElementById('rname')?.textContent?.trim();
    if(name)mount(document.getElementById('tart'),name);
  }

  function schedule(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(sync);
  }

  function start(){
    if(started)return;
    started=true;
    sync();
    loadRows();
    const observer=new MutationObserver(schedule);
    [document.getElementById('grid'),document.getElementById('result')]
      .filter(Boolean)
      .forEach(element=>observer.observe(element,{childList:true,subtree:true,characterData:true}));
    window.addEventListener('pageshow',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.FISH_TARGET_REAL_FISH=Object.freeze({version:'V23-REAL2',rows:ROW_URLS,species:Object.freeze(Object.keys(ORDER))});
})();
