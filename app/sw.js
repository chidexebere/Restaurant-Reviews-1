/*Import IDB Promised*/

import idb from 'idb';

/*Install the  service worker and Caches the resources using Cache API*/

const staticCacheName = 'restaurant-static-v52';
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(staticCacheName)
			.then(cache => {
				return cache.addAll([
					'/index.html',
					'/css/styles.css',
					'/js/index.min.js',
					'/js/restaurant.min.js',
					'/restaurant.html?id=1',
					'/restaurant.html?id=2',
					'/restaurant.html?id=3',
					'/restaurant.html?id=4',
					'/restaurant.html?id=5',
					'/restaurant.html?id=6',
					'/restaurant.html?id=7',
					'/restaurant.html?id=8',
					'/restaurant.html?id=9',
					'/restaurant.html?id=10',
					'/img/icons/offline.png',
				]).catch(error => {
					console.log('Caches open failed: ' + error);
				});
			})
	);
});


/* Update a service worker*/

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.filter(cacheName => {
					return cacheName.startsWith('restaurant-static-') && cacheName !== staticCacheName;
				}).map(cacheName => {
					return caches.delete(cacheName);
				})

			);
		})
	);
});



/* Create Database and Objectstore */

const dbPromise = idb.open('restaurant-db', 1, upgradeDB => {
	switch (upgradeDB.oldVersion) {
		case 0:
			upgradeDB.createObjectStore('restaurants');
	}
});


/* IndexedDB KeyVal Store */
// Define idbKeyVal methods 

const idbKeyVal = {
	get(key) {
		return dbPromise.then(db => {
			return db.transaction('restaurants')
				.objectStore('restaurants').get(key);
		});
	},

	set(key, val) {
		return dbPromise.then(db => {
			const tx = db.transaction('restaurants', 'readwrite');
			tx.objectStore('restaurants').put(val, key);
			return tx.complete;
		});
	}
};



/* Fetch Resources from Cache and IDB or from the Network (server) */

self.addEventListener('fetch', event => {
	const request = event.request;
	const requestUrl = new URL(request.url);

	if (requestUrl.port === '1337') {
		event.respondWith(idbResponse(request));
	}
	else {
		event.respondWith(cacheResponse(request));
	}
});


// IDB response 

function idbResponse(request) {
	return idbKeyVal.get('restaurants')
		.then(restaurants => {
			return (restaurants || fetch(request)
				.then(response => response.json())
				.then(json => {
					idbKeyVal.set('restaurants', json);
					return json;
				})
			);
		})
		.then(response => new Response(JSON.stringify(response)))
		.catch(error => {
			return new Response(error, {
				status: 404,
				statusText: 'Bad request'
			});
		});

}

// Cache Response 

function cacheResponse(request) {
	return caches.match(request)
		.then(response => {
			return response || fetch(request)
				.then(fetchResponse => {
					return caches.open(staticCacheName)
						.then(cache => {
							if (!fetchResponse.url.includes('browser-sync')) {
								cache.put(request, fetchResponse.clone());
							}
							return fetchResponse;
						});
				});
		}).catch(error => {
			if (request.url.includes('.jpg')) {
				return caches.match('/img/icons/offline.png');
			}
			return new Response(error, {
				status: 404,
				statusText: 'Not internet connection'
			});
		});

}








