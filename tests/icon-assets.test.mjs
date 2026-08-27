import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const root=file=>new URL(`../${file}`,import.meta.url);
const dist=file=>new URL(`../dist/${file}`,import.meta.url);
const text=file=>readFileSync(root(file),'utf8');

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

function inspectPng(file){
  const b=readFileSync(dist(file));
  assert.deepEqual([...b.subarray(0,8)],[137,80,78,71,13,10,26,10],`${file} PNG signature`);
  let offset=8;
  let width=0,height=0,idat=0,iend=false;
  while(offset<b.length){
    assert.ok(offset+12<=b.length,`${file} truncated chunk header`);
    const len=b.readUInt32BE(offset);
    const type=b.subarray(offset+4,offset+8).toString('ascii');
    const dataStart=offset+8, dataEnd=dataStart+len, crcPos=dataEnd;
    assert.ok(crcPos+4<=b.length,`${file} truncated ${type}`);
    const expected=b.readUInt32BE(crcPos);
    const actual=crc32(b.subarray(offset+4,dataEnd));
    assert.equal(actual,expected,`${file} bad CRC for ${type}`);
    if(type==='IHDR'){width=b.readUInt32BE(dataStart);height=b.readUInt32BE(dataStart+4)}
    if(type==='IDAT')idat+=len;
    if(type==='IEND'){iend=true;assert.equal(len,0);assert.equal(crcPos+4,b.length,`${file} data after IEND`)}
    offset=crcPos+4;
  }
  assert.ok(iend,`${file} must contain IEND`);
  assert.ok(idat>256,`${file} must contain non-trivial image data`);
  return {width,height,bytes:b.length,idat};
}

test('build generates complete release icon PNGs at required iOS/PWA dimensions',()=>{
  const icons={
    'apple-touch-icon.png':[180,180],
    'icon-192.png':[192,192],
    'icon-512.png':[512,512],
    'icon-maskable-512.png':[512,512]
  };
  for(const [file,size] of Object.entries(icons)){
    const info=inspectPng(file);
    assert.deepEqual([info.width,info.height],size);
  }
});

test('manifest and iOS title publish the FISH TARGET product name',()=>{
  const manifest=JSON.parse(text('manifest.webmanifest'));
  const html=text('index.html');
  assert.equal(manifest.name,'FISH TARGET');
  assert.equal(manifest.short_name,'FISH TARGET');
  assert.equal(manifest.orientation,'portrait-primary');
  assert.match(html,/name="apple-mobile-web-app-title"[^>]*content="FISH TARGET"|content="FISH TARGET"[^>]*name="apple-mobile-web-app-title"/);
  assert.match(html,/apple-touch-icon\.png/);
});

test('manifest exposes standard and maskable icon assets',()=>{
  const manifest=JSON.parse(text('manifest.webmanifest'));
  const bySrc=new Map(manifest.icons.map(icon=>[icon.src,icon]));
  assert.equal(bySrc.get('icon-192.png')?.sizes,'192x192');
  assert.equal(bySrc.get('icon-512.png')?.sizes,'512x512');
  assert.equal(bySrc.get('icon-maskable-512.png')?.purpose,'maskable');
});

test('browser SVG favicon uses the fish target identity rather than the old letter mark',()=>{
  const svg=text('icon.svg');
  assert.match(svg,/linearGradient id="aqua"/);
  assert.match(svg,/aria-label="FISH TARGET"/);
  assert.match(svg,/circle cx="350" cy="245"/);
});
