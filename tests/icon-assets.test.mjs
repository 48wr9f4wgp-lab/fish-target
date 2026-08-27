import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';

const root=file=>new URL(`../${file}`,import.meta.url);
const text=file=>readFileSync(root(file),'utf8');
const pngSize=file=>{
  const b=readFileSync(root(file));
  assert.equal(b.subarray(1,4).toString('ascii'),'PNG',`${file} must be PNG`);
  return [b.readUInt32BE(16),b.readUInt32BE(20)];
};

test('release icon assets have the required iOS/PWA dimensions',()=>{
  assert.deepEqual(pngSize('apple-touch-icon.png'),[180,180]);
  assert.deepEqual(pngSize('icon-192.png'),[192,192]);
  assert.deepEqual(pngSize('icon-512.png'),[512,512]);
  assert.deepEqual(pngSize('icon-maskable-512.png'),[512,512]);
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
