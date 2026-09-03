import {writeFile} from 'node:fs/promises';
import path from 'node:path';
import zlib from 'node:zlib';

const clamp=v=>Math.max(0,Math.min(1,v));
const mix=(a,b,t)=>Math.round(a+(b-a)*clamp(t));
const rgbMix=(a,b,t)=>[mix(a[0],b[0],t),mix(a[1],b[1],t),mix(a[2],b[2],t),255];
const pointInPoly=(x,y,pts)=>{
  let inside=false;
  for(let i=0,j=pts.length-1;i<pts.length;j=i++){
    const [xi,yi]=pts[i], [xj,yj]=pts[j];
    if(((yi>y)!==(yj>y)) && x<((xj-xi)*(y-yi))/((yj-yi)||1e-9)+xi)inside=!inside;
  }
  return inside;
};

const crcTable=(()=>{
  const table=new Uint32Array(256);
  for(let n=0;n<256;n++){
    let c=n;
    for(let k=0;k<8;k++)c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1);
    table[n]=c>>>0;
  }
  return table;
})();
const crc32=buffer=>{
  let c=0xffffffff;
  for(const byte of buffer)c=crcTable[(c^byte)&0xff]^(c>>>8);
  return (c^0xffffffff)>>>0;
};
const chunk=(type,data=Buffer.alloc(0))=>{
  const name=Buffer.from(type,'ascii');
  const len=Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc=Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([len,name,data,crc]);
};
const png=(width,height,rgba)=>{
  const raw=Buffer.alloc((width*4+1)*height);
  for(let y=0;y<height;y++){
    const row=y*(width*4+1); raw[row]=0;
    rgba.copy(raw,row+1,y*width*4,(y+1)*width*4);
  }
  const ihdr=Buffer.alloc(13);
  ihdr.writeUInt32BE(width,0); ihdr.writeUInt32BE(height,4);
  ihdr[8]=8; ihdr[9]=6; ihdr[10]=0; ihdr[11]=0; ihdr[12]=0;
  return Buffer.concat([
    Buffer.from([137,80,78,71,13,10,26,10]),
    chunk('IHDR',ihdr),
    chunk('IDAT',zlib.deflateSync(raw,{level:9})),
    chunk('IEND')
  ]);
};

function sample(x,y,{maskable=false}={}){
  const bg1=[5,27,34], bg2=[8,43,55], cyan=[21,203,222], mint=[88,237,160], white=[248,251,251], lower=[220,235,239];
  const scale=maskable?0.80:0.94;
  x=(x-0.5)/scale+0.5; y=(y-0.5)/scale+0.5;
  const radial=Math.hypot(x-.5,y-.44);
  let c=rgbMix(bg1,bg2,0.45+0.55*(0.55-radial));

  const dx=x-.5, dy=y-.5, radius=Math.hypot(dx,dy);
  const ring=Math.abs(radius-.34)<.018 && !(Math.abs(dx)<.035 || Math.abs(dy)<.035);
  const spikes=
    pointInPoly(x,y,[[.5,.10],[.485,.19],[.515,.19]]) ||
    pointInPoly(x,y,[[.5,.90],[.485,.81],[.515,.81]]) ||
    pointInPoly(x,y,[[.10,.5],[.19,.485],[.19,.515]]) ||
    pointInPoly(x,y,[[.90,.5],[.81,.485],[.81,.515]]);
  if(ring||spikes)c=rgbMix(cyan,mint,x);

  const swoosh=((x-.50)/.20)**2+((y-.565)/.055)**2<1 && y>.52;
  if(swoosh)c=rgbMix(cyan,mint,(x-.30)/.40);

  const tail=pointInPoly(x,y,[[.30,.50],[.12,.36],[.17,.50],[.12,.64]]);
  if(tail)c=rgbMix(cyan,mint,(x-.10)/.30);

  const u=(x-.53)/.27;
  const half=Math.abs(u)<=1 ? .115*Math.sqrt(Math.max(0,1-u*u)) : 0;
  const body=(x>=.26&&x<=.80&&Math.abs(y-.495)<=half) || pointInPoly(x,y,[[.68,.40],[.82,.50],[.68,.59]]);
  if(body)c=rgbMix(white,lower,Math.max(0,(y-.47)/.13)*.65);

  if(pointInPoly(x,y,[[.42,.405],[.50,.33],[.55,.41]]))c=[248,251,251,255];
  if((x-.665)**2+(y-.47)**2<.015**2)c=[5,27,34,255];
  return c;
}

function render(size,{maskable=false}={}){
  const rgba=Buffer.alloc(size*size*4);
  const offsets=[.25,.75];
  for(let py=0;py<size;py++)for(let px=0;px<size;px++){
    const acc=[0,0,0,0];
    for(const oy of offsets)for(const ox of offsets){
      const c=sample((px+ox)/size,(py+oy)/size,{maskable});
      for(let i=0;i<4;i++)acc[i]+=c[i];
    }
    const pos=(py*size+px)*4;
    for(let i=0;i<4;i++)rgba[pos+i]=Math.round(acc[i]/4);
  }
  return png(size,size,rgba);
}

export async function generateIcons(output){
  const specs=[
    ['apple-touch-icon.png',180,false],
    ['icon-192.png',192,false],
    ['icon-512.png',512,false],
    ['icon-maskable-512.png',512,true]
  ];
  for(const [name,size,maskable] of specs)await writeFile(path.join(output,name),render(size,{maskable}));
}
