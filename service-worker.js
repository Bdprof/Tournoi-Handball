const CACHE_NAME='tournoi-handball-v1';
const urlsToCache=['./','.  /index.html','https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache=>cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(cacheNames=>
      Promise.all(
        cacheNames.map(cacheName=>{
          if(cacheName!==CACHE_NAME)return caches.delete(cacheName)
        })
      )
    )
  );
});

self.addEventListener('fetch',event=>{
  event.respondWith(
    caches.match(event.request).then(response=>{
      if(response)return response;
      return fetch(event.request).then(response=>{
        if(!response||response.status!==200||response.type!=='basic')return response;
        const responseToCache=response.clone();
        caches.open(CACHE_NAME).then(cache=>cache.put(event.request,responseToCache));
        return response
      })
    }).catch(()=>caches.match('./index.html'))
  );
});
