(()=>{
  const BUILD=document.documentElement.dataset.build||'dev';
  const ROW_PARTS=Object.freeze([
    Object.freeze(['fish-real-row0.b64']),
    Object.freeze(['fish-real-row1.b64']),
    Object.freeze(['fish-real-row2a.b64','fish-real-row2b.b64']),
    Object.freeze(['fish-real-row3a.b64','fish-real-row3b.b64'])
  ]);
  const ORDER=Object.freeze({
    'ブリ・ワラサ':0,'カンパチ':1,'サワラ':2,'シーバス':3,'ヒラメ':4,
    'マゴチ':5,'アジ':6,'メバル':7,'アオリイカ':8,'タチウオ':9,
    'クロダイ':10,'マダイ':11,'シロギス':12,'カワハギ':13,'ブラックバス':14,
    'ニジマス':15,'アユ':16,'コイ':17,'ヤマメ・イワナ':18
  });
  const cropCache=new Map();
  const observedHosts=new WeakSet();
  let rows=null;
  let ready=false;
  let scheduled=false;
  let started=false;

  const slot=name=>{
    const index=ORDER[name];
    if(index===undefined)return null;
    return {index,row:Math.floor(index/5),col:index%5};
  };

  const loadImage=dataUrl=>new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error('decoded WebP row failed image probe'));
    image.src=dataUrl;
  });

  async function loadPart(file){
    const response=await fetch(`./${file}?v=${BUILD}`);
    if(!response.ok)throw new Error(`fish row request failed: ${file} ${response.status}`);
    const text=(await response.text()).trim();
    if(!text||text.length<1000)throw new Error(`fish row payload is invalid or truncated: ${file}`);
    return text;
  }

  async function loadRows(){
    try{
      const encoded=await Promise.all(ROW_PARTS.map(async parts=>{
        const text=(await Promise.all(parts.map(loadPart))).join('');
        if(!text.startsWith('UklG')||text.length<5000)throw new Error('assembled fish row payload is invalid or truncated');
        return `data:image/webp;base64,${text}`;
      }));
      rows=await Promise.all(encoded.map(loadImage));
      ready=true;
      document.documentElement.classList.add('realFishReady','realFishV6A');
      schedule();
    }catch(error){
      console.warn('real fish rows unavailable; keeping SVG fallback',error);
    }
  }

  function cropFor(name){
    if(cropCache.has(name))return cropCache.get(name);
    const position=slot(name);
    const image=position&&rows?.[position.row];
    if(!image)return null;
    const cellWidth=Math.floor(image.naturalWidth/5);
    const cellHeight=image.naturalHeight;
    const sx=position.col*cellWidth;
    const probe=document.createElement('canvas');
    probe.width=cellWidth;
    probe.height=cellHeight;
    const context=probe.getContext('2d',{willReadFrequently:true});
    if(!context)return null;
    context.drawImage(image,sx,0,cellWidth,cellHeight,0,0,cellWidth,cellHeight);
    const pixels=context.getImageData(0,0,cellWidth,cellHeight).data;
    let left=cellWidth,top=cellHeight,right=-1,bottom=-1;
    for(let y=0;y<cellHeight;y++){
      for(let x=0;x<cellWidth;x++){
        if(pixels[(y*cellWidth+x)*4+3]<24)continue;
        if(x<left)left=x;
        if(x>right)right=x;
        if(y<top)top=y;
        if(y>bottom)bottom=y;
      }
    }
    const pad=2;
    const crop=right>=left&&bottom>=top
      ? {image,sx:sx+Math.max(0,left-pad),sy:Math.max(0,top-pad),sw:Math.min(cellWidth-1,right+pad)-Math.max(0,left-pad)+1,sh:Math.min(cellHeight-1,bottom+pad)-Math.max(0,top-pad)+1}
      : {image,sx,sy:0,sw:cellWidth,sh:cellHeight};
    cropCache.set(name,crop);
    return crop;
  }

  function render(canvas,host,name){
    const crop=cropFor(name);
    if(!crop)return;
    const rect=canvas.getBoundingClientRect();
    if(rect.width<2||rect.height<2)return;
    const dpr=Math.min(Math.max(window.devicePixelRatio||1,1),3);
    const width=Math.max(1,Math.round(rect.width*dpr));
    const height=Math.max(1,Math.round(rect.height*dpr));
    if(canvas.width!==width)canvas.width=width;
    if(canvas.height!==height)canvas.height=height;
    const context=canvas.getContext('2d');
    if(!context)return;
    context.clearRect(0,0,width,height);
    context.imageSmoothingEnabled=true;
    context.imageSmoothingQuality='high';
    context.filter='contrast(1.07) saturate(1.08)';
    const detail=host.id==='tart'||Boolean(host.closest('#result'));
    const maxWidth=width*(detail?.92:.88);
    const maxHeight=height*(detail?.86:.80);
    const scale=Math.min(maxWidth/crop.sw,maxHeight/crop.sh);
    const drawWidth=crop.sw*scale;
    const drawHeight=crop.sh*scale;
    const dx=(width-drawWidth)/2;
    const dy=(height-drawHeight)/2;
    context.drawImage(crop.image,crop.sx,crop.sy,crop.sw,crop.sh,dx,dy,drawWidth,drawHeight);
    context.filter='none';
    host.classList.add('realFishMounted');
  }

  const resizeObserver='ResizeObserver' in window?new ResizeObserver(schedule):null;

  function mount(host,name){
    if(!host||!slot(name))return;
    host.classList.add('realFishHost');
    if(!ready)return;
    host.querySelectorAll(':scope > .realFishSprite').forEach(element=>element.remove());
    let canvas=host.querySelector(':scope > .realFishCanvas');
    if(!canvas){
      canvas=document.createElement('canvas');
      canvas.className='realFishCanvas';
      canvas.setAttribute('aria-hidden','true');
      host.appendChild(canvas);
    }
    if(canvas.dataset.fish!==name){
      canvas.dataset.fish=name;
      host.classList.remove('realFishMounted');
    }
    render(canvas,host,name);
    if(resizeObserver&&!observedHosts.has(host)){
      observedHosts.add(host);
      resizeObserver.observe(host);
    }
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
    window.addEventListener('orientationchange',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.FISH_TARGET_REAL_FISH=Object.freeze({version:'V23-REAL6A',renderer:'dpr-canvas-safe-fit',parts:ROW_PARTS,species:Object.freeze(Object.keys(ORDER))});
})();
