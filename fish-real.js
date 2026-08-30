(()=>{
  const BUILD=document.documentElement.dataset.build||'dev';
  const MANIFEST=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST;
  if(!MANIFEST)return;
  const ASSET=MANIFEST.bundledSheet||'fish-real-v7.avif';
  const cropCache=new Map();
  const observedHosts=new WeakSet();
  let sheet=null;
  let ready=false;
  let scheduled=false;
  let started=false;

  const slot=name=>{
    const asset=MANIFEST.assetFor(name);
    if(!asset||asset.type!=='sprite-sheet'||asset.file!==ASSET)return null;
    return {
      index:asset.slot,
      row:Math.floor(asset.slot/asset.columns),
      col:asset.slot%asset.columns,
      columns:asset.columns,
      rows:asset.rows
    };
  };

  const loadImage=url=>new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error(`fish image failed: ${url}`));
    image.src=url;
  });

  async function loadSource(){
    try{
      const image=await loadImage(`./${ASSET}?v=${BUILD}`);
      if(image.naturalWidth<1000||image.naturalHeight<700){
        throw new Error(`fish sheet is unexpectedly small: ${image.naturalWidth}x${image.naturalHeight}`);
      }
      sheet=image;
      ready=true;
      document.documentElement.classList.add('realFishReady','realFishV8');
      schedule();
    }catch(error){
      console.warn('real fish AVIF unavailable; keeping SVG fallback',error);
    }
  }

  function cellFor(name){
    const position=slot(name);
    if(!position||!sheet)return null;
    const cellWidth=Math.floor(sheet.naturalWidth/position.columns);
    const cellHeight=Math.floor(sheet.naturalHeight/position.rows);
    return {image:sheet,sx:position.col*cellWidth,sy:position.row*cellHeight,cellWidth,cellHeight};
  }

  function cropFor(name){
    if(cropCache.has(name))return cropCache.get(name);
    const cell=cellFor(name);
    if(!cell)return null;
    const {image,sx,sy,cellWidth,cellHeight}=cell;
    const probe=document.createElement('canvas');
    probe.width=cellWidth;
    probe.height=cellHeight;
    const context=probe.getContext('2d',{willReadFrequently:true});
    if(!context)return null;
    context.drawImage(image,sx,sy,cellWidth,cellHeight,0,0,cellWidth,cellHeight);
    const pixels=context.getImageData(0,0,cellWidth,cellHeight).data;
    let left=cellWidth,top=cellHeight,right=-1,bottom=-1;
    for(let y=0;y<cellHeight;y++){
      for(let x=0;x<cellWidth;x++){
        if(pixels[(y*cellWidth+x)*4+3]<18)continue;
        if(x<left)left=x;
        if(x>right)right=x;
        if(y<top)top=y;
        if(y>bottom)bottom=y;
      }
    }
    const pad=6;
    const crop=right>=left&&bottom>=top
      ? {
          image,
          sx:sx+Math.max(0,left-pad),
          sy:sy+Math.max(0,top-pad),
          sw:Math.min(cellWidth-1,right+pad)-Math.max(0,left-pad)+1,
          sh:Math.min(cellHeight-1,bottom+pad)-Math.max(0,top-pad)+1
        }
      : {image,sx,sy,sw:cellWidth,sh:cellHeight};
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
    const detail=host.id==='tart'||Boolean(host.closest('#result'));
    const maxWidth=width*(detail?.92:.90);
    const maxHeight=height*(detail?.86:.82);
    const scale=Math.min(maxWidth/crop.sw,maxHeight/crop.sh);
    const drawWidth=crop.sw*scale;
    const drawHeight=crop.sh*scale;
    const dx=(width-drawWidth)/2;
    const dy=(height-drawHeight)/2;
    context.drawImage(crop.image,crop.sx,crop.sy,crop.sw,crop.sh,dx,dy,drawWidth,drawHeight);
    host.classList.add('realFishMounted');
    host.dataset.fishAsset='direct-avif-grid';
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

  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(sync)}}

  function start(){
    if(started)return;
    started=true;
    sync();
    loadSource();
    const observer=new MutationObserver(schedule);
    [document.getElementById('grid'),document.getElementById('result')]
      .filter(Boolean)
      .forEach(element=>observer.observe(element,{childList:true,subtree:true,characterData:true}));
    window.addEventListener('pageshow',schedule);
    window.addEventListener('orientationchange',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.FISH_TARGET_REAL_FISH=Object.freeze({
    version:'V23-REAL8',
    renderer:'direct-avif-grid-with-svg-fallback',
    primary:ASSET,
    manifestVersion:MANIFEST.version,
    species:Object.freeze(MANIFEST.bundledRecords.map(record=>record.species_name))
  });
})();
