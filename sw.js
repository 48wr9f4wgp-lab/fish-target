const CACHE='fish-target-shell-__BUILD_ID__';
const SHELL=__SHELL_MANIFEST__;

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
      const freshRequest=new Request(request,{cache:'reload'});
      const fresh=await fetch(freshRequest);
      if(fresh && fresh.ok){
        const cache=await caches.open(CACHE);
        cache.put(request,fresh.clone()).catch(()=>{});
      }
      return fresh;
    }catch(err){
      const cache=await caches.open(CACHE);
      const cached=await cache.match(request,{ignoreSearch:true});
      if(cached)return cached;
      if(request.mode==='navigate'){
        const appShell=await cache.match('./index.html');
        if(appShell)return appShell;
      }
      throw err;
    }
  })());
});
