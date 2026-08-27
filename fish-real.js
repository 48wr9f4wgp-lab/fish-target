(()=>{
  const BUILD=document.documentElement.dataset.build||'dev';
  const SPRITE=`./fish-real-sprite.webp?v=${BUILD}`;
  const ORDER=Object.freeze({
    'ブリ・ワラサ':0,'カンパチ':1,'サワラ':2,'シーバス':3,'ヒラメ':4,
    'マゴチ':5,'アジ':6,'メバル':7,'アオリイカ':8,'タチウオ':9,
    'クロダイ':10,'マダイ':11,'シロギス':12,'カワハギ':13,'ブラックバス':14,
    'ニジマス':15,'アユ':16,'コイ':17,'ヤマメ・イワナ':18
  });
  let ready=false,scheduled=false;
  const position=name=>{
    const i=ORDER[name];if(i===undefined)return null;
    const col=i%5,row=Math.floor(i/5);
    return {x:`${col*25}%`,y:`${row*(100/3)}%`};
  };
  function mount(host,name){
    const pos=position(name);if(!host||!pos)return;
    host.classList.add('realFishHost');
    let art=host.querySelector(':scope > .realFishSprite');
    if(!art){art=document.createElement('span');art.className='realFishSprite';art.setAttribute('aria-hidden','true');host.appendChild(art)}
    art.style.setProperty('--fish-x',pos.x);art.style.setProperty('--fish-y',pos.y);art.style.backgroundImage=`url("${SPRITE}")`;
    if(ready)host.classList.add('realFishMounted');
  }
  function sync(){
    scheduled=false;
    document.querySelectorAll('#grid .fish[data-fish]').forEach(card=>mount(card.querySelector('.art'),card.dataset.fish));
    const name=document.getElementById('rname')?.textContent?.trim();
    if(name)mount(document.getElementById('tart'),name);
  }
  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(sync)}
  const probe=new Image();
  probe.onload=()=>{ready=true;document.documentElement.classList.add('realFishReady');schedule()};
  probe.onerror=()=>{console.warn('real fish sprite unavailable; keeping SVG fallback')};
  probe.src=SPRITE;
  const start=()=>{
    sync();
    const observer=new MutationObserver(schedule);
    [document.getElementById('grid'),document.getElementById('result')].filter(Boolean).forEach(el=>observer.observe(el,{childList:true,subtree:true,characterData:true}));
    window.addEventListener('pageshow',schedule);
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.FISH_TARGET_REAL_FISH=Object.freeze({version:'V23-REAL1',sprite:SPRITE,species:Object.freeze(Object.keys(ORDER))});
})();
