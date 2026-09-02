(()=>{
  const BUILD=document.documentElement.dataset.build||'dev';
  const MANIFEST=globalThis.FISH_TARGET_FISH_ASSET_MANIFEST;
  if(!MANIFEST)return;
  const PRIMARY=MANIFEST.bundledSheet||null;
  const cropCache=new Map();
  const imageCache=new Map();
  const loadCache=new Map();
  const observedHosts=new WeakSet();
  const lazyHosts=new WeakSet();
  let scheduled=false;
  let started=false;

  const assetFor=name=>MANIFEST.assetFor(name);
  const loadImage=url=>new Promise((resolve,reject)=>{
    const image=new Image();
    image.onload=()=>resolve(image);
    image.onerror=()=>reject(new Error(`fish image failed: ${url}`));
    image.src=url;
  });

  function validateImage(asset,image){
    if(asset.type==='sprite-sheet'){
      if(asset.file===PRIMARY&&(image.naturalWidth<1000||image.naturalHeight<700)){
        throw new Error(`fish sheet is unexpectedly small: ${image.naturalWidth}x${image.naturalHeight}`);
      }
      if(image.naturalWidth<asset.columns||image.naturalHeight<asset.rows){
        throw new Error(`fish sprite sheet grid is invalid: ${asset.file}`);
      }
      return;
    }
    if(asset.type==='file'){
      if(image.naturalWidth<2||image.naturalHeight<2)throw new Error(`fish image is unexpectedly small: ${asset.file}`);
      return;
    }
    throw new Error(`unsupported fish asset type: ${asset.type}`);
  }

  function ensureAsset(name){
    const asset=assetFor(name);
    if(!asset)return Promise.resolve(null);
    if(imageCache.has(asset.file))return Promise.resolve(imageCache.get(asset.file));
    if(loadCache.has(asset.file))return loadCache.get(asset.file);
    const task=loadImage(`./${asset.file}?v=${BUILD}`)
      .then(image=>{
        validateImage(asset,image);
        imageCache.set(asset.file,image);
        document.documentElement.classList.add('realFishReady','realFishV9');
        schedule();
        return image;
      })
      .catch(error=>{
        loadCache.delete(asset.file);
        console.warn(`real fish asset unavailable: ${asset.file}; keeping SVG fallback`,error);
        return null;
      });
    loadCache.set(asset.file,task);
    return task;
  }

  function cellFor(name){
    const asset=assetFor(name);
    if(!asset)return null;
    const image=imageCache.get(asset.file);
    if(!image)return null;
    if(asset.type==='file')return {asset,image,sx:0,sy:0,cellWidth:image.naturalWidth,cellHeight:image.naturalHeight};
    if(asset.type!=='sprite-sheet')return null;
    const position={
      index:asset.slot,
      row:Math.floor(asset.slot/asset.columns),
      col:asset.slot%asset.columns,
      columns:asset.columns,
      rows:asset.rows
    };
    const cellWidth=Math.floor(image.naturalWidth/position.columns);
    const cellHeight=Math.floor(image.naturalHeight/position.rows);
    return {asset,image,sx:position.col*cellWidth,sy:position.row*cellHeight,cellWidth,cellHeight};
  }

  function cropFor(name){
    const asset=assetFor(name);
    if(!asset)return null;
    const key=`${name}:${asset.file}:${asset.type==='sprite-sheet'?asset.slot:'file'}`;
    if(cropCache.has(key))return cropCache.get(key);
    const cell=cellFor(name);
    if(!cell)return null;
    const {image,sx,sy,cellWidth,cellHeight}=cell;
    if(asset.type==='file'){
      const direct={image,sx,sy,sw:cellWidth,sh:cellHeight};
      cropCache.set(key,direct);
      return direct;
    }
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
    cropCache.set(key,crop);
    return crop;
  }

  function render(canvas,host,name){
    const crop=cropFor(name);
    const asset=assetFor(name);
    if(!crop||!asset)return;
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
    host.dataset.fishAsset=asset.type==='file'?'direct-bundled-file':'direct-avif-grid';
  }

  const resizeObserver='ResizeObserver'in window?new ResizeObserver(schedule):null;
  const lazyObserver='IntersectionObserver'in window?new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    const host=entry.target;
    const name=host.dataset.realFishName||host.closest('.fish[data-fish]')?.dataset.fish;
    if(name)ensureAsset(name);
    lazyObserver.unobserve(host);
  }),{rootMargin:'220px 0px'}):null;

  function shouldLoadNow(host,name,asset){
    if(imageCache.has(asset.file))return true;
    const detail=host.id==='tart'||Boolean(host.closest('#result'));
    if(detail||asset.file===PRIMARY||!lazyObserver)return true;
    if(!lazyHosts.has(host)){
      lazyHosts.add(host);
      host.dataset.realFishName=name;
      lazyObserver.observe(host);
    }
    return false;
  }

  function mount(host,name){
    const asset=assetFor(name);
    if(!host||!asset)return;
    host.classList.add('realFishHost');
    if(!shouldLoadNow(host,name,asset))return;
    if(!imageCache.has(asset.file)){
      ensureAsset(name);
      return;
    }
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
    const primaryRecord=MANIFEST.bundledRecords.find(record=>record.asset?.type==='sprite-sheet'&&record.asset.file===PRIMARY);
    if(primaryRecord)ensureAsset(primaryRecord.species_name);
    sync();
    const observer=new MutationObserver(schedule);
    [document.getElementById('grid'),document.getElementById('result')]
      .filter(Boolean)
      .forEach(element=>observer.observe(element,{childList:true,subtree:true,characterData:true}));
    window.addEventListener('pageshow',schedule);
    window.addEventListener('orientationchange',schedule);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
  globalThis.FISH_TARGET_REAL_FISH=Object.freeze({
    version:'V23-REAL9',
    renderer:'manifest-bundled-sprite-or-file-with-svg-fallback',
    primary:PRIMARY,
    manifestVersion:MANIFEST.version,
    assetTypes:Object.freeze([...new Set(MANIFEST.bundledRecords.map(record=>record.asset?.type).filter(Boolean))]),
    species:Object.freeze(MANIFEST.bundledRecords.map(record=>record.species_name)),
    prefetch:async name=>Boolean(await ensureAsset(name))
  });
})();
