const CACHE='fish-target-shell-v15';
const SHELL=[
  './',
  './index.html',
  './style.css',
  './quick-plan.css',
  './field-mode.css',
  './pwa.css',
  './data.js',
  './products.js',
  './app.js',
  './field-mode.js',
  './pwa.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET')return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin)return;

  event.respondWith((async()=>{
    try{
      const fresh=await fetch(request);
      if(fresh && fresh.ok){
        const cache=await caches.open(CACHE);
        cache.put(request,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(err){
      const cached=await caches.match(request);
      if(cached)return cached;
      if(request.mode==='navigate'){
        const appShell=await caches.match('./index.html');
        if(appShell)return appShell;
      }
      throw err;
    }
  })());
});
