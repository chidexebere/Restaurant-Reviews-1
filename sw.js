
/*Instlall the  service worker and Caches the resources*/

const staticCacheName = 'restaurant-static-v1';

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName)
      .then(cache => {
        return cache.addAll([
          '/index.html',
          '/restaurant.html',
          '/css/styles.css',
          '/js/dbhelper.js',
          '/js/registerSW.js',
          '/js/main.js',
          '/js/restaurant_info.js',
          '/data/restaurants.json',
        ]).catch(error => {
          console.log('Caches open failed: ' + error);
        });
      })
  );
});


/* Update a service worker*/

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then (cacheNames => {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('restaurant-') &&
                        cacheName != staticCacheName;
                }).map (cacheName => {
                    return caches.delete(cacheName)
                })
        
            );
        })   
    );
});


/* Cache and return requests*/

self.addEventListener('fetch', event => {
    event.respondWith(
      caches.match(event.request)
      .then(response => {
        return response || fetch(event.request)
        .then(fetchResponse => { 
          return caches.open(staticCacheName)
          .then(cache => {           
            cache.put(event.request, fetchResponse.clone());            
            return fetchResponse;                                       
          });                                                           
        });                                                             
      }).catch(error => {
        if (event.request.url.includes('.jpg')) {
          return caches.match('/img/Offline_logo');
        }
        return new Response('Not connected to the internet', {
          status: 404,
          statusText: "Not connected to the internet"
        });
      })
    );
  });