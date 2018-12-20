/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

/*Install the  service worker and Caches the resources using Cache API*/


const staticCacheName = 'restaurant-static-v114';
self.addEventListener('install', event => {
	event.waitUntil(
		caches.open(staticCacheName)
			.then(cache => {
				return cache.addAll([
					'/',
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
					'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
					'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js'
				]).catch(error => {
					console.log('Caches open failed: ' + error);
				});
			})
	);
});

// intercept all requests, return cached asset, idb data, or fetch from network
let i = 0;
self.addEventListener('fetch', event => {
	const request = event.request;
	const requestUrl = new URL(request.url);
	if (requestUrl.port === '1337') {
		if (event.request.method !== 'GET') {
			console.log('filtering out non-GET method');
			return;
		}

		console.log('fetch intercept', ++i, requestUrl.href);

		if (request.url.includes('reviews')) {
			let id = +requestUrl.searchParams.get('restaurant_id');
			event.respondWith(idbReviewResponse(request, id));
		} else {
			event.respondWith(idbRestaurantResponse(request));
		}
	}
	else {
		event.respondWith(cacheResponse(request));
	}
});


//  Get all records from objectStore
// if more than 1 record then return match
// if no match then fetch json, write to idb, & return response

let j = 0;
function idbRestaurantResponse(request, id) {
	return idbKeyVal.getAll('restaurants')
		.then(restaurants => {
			if (restaurants.length) {
				return restaurants;
			}
			return fetch(request)
				.then(response => response.json())
				.then(json => {
					json.forEach(restaurant => {
						console.log('fetch idb write', ++j, restaurant.id, restaurant.name);
						idbKeyVal.set('restaurants', restaurant);
					});
					return json;
				});
		})
		.then(response => new Response(JSON.stringify(response)))
		.catch(error => {
			return new Response(error, {
				status: 404,
				statusText: 'my bad request'
			});
		});
}

let k = 0;
function idbReviewResponse(request, id) {
	return idbKeyVal.getAllIdx('reviews', 'restaurant_id', id)
		.then(reviews => {
			if (reviews.length) {
				return reviews;
			}
			return fetch(request)
				.then(response => response.json())
				.then(json => {
					json.forEach(review => {
						console.log('fetch idb review write', ++k, review.id, review.name);
						idbKeyVal.set('reviews', review);
					});
					return json;
				});
		})
		.then(response => new Response(JSON.stringify(response)))
		.catch(error => {
			return new Response(error, {
				status: 404,
				statusText: 'my bad request'
			});
		});
}

function cacheResponse(request) {
	return caches.match(request, {
	}).then(response => {
		return response || fetch(request).then(fetchResponse => {
			return caches.open(staticCacheName).then(cache => {
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
			statusText: 'Not connected to the internet'
		});
	});
}


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








