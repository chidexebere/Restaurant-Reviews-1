/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */


/**
 * Common database helper functions.
 * 
 */

class DBHelper {

	/**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
	static get DATABASE_URL() {
		const port = 1337; // Change this to your server port
		return `http://localhost:${port}`;
	}



	// GET
	// http://localhost:1337/reviews/?restaurant_id=<restaurant_id>
	static fetchRestaurantReviewsById(id, callback) {
		fetch(DBHelper.DATABASE_URL + `/reviews/?restaurant_id=${id}`)
			.then(response => response.json())
			.then(data => callback(null, data))
			.catch(err => callback(err, null));
	}

	// POST
	// http://localhost:1337/reviews/
	static createRestaurantReview(restaurant_id, name, rating, comments, callback) {
		const url = DBHelper.DATABASE_URL + '/reviews/';
		const headers = { 'Content-Type': 'application/form-data' };
		const method = 'POST';
		const data = {
			restaurant_id: restaurant_id,
			name: name,
			rating: +rating,
			comments: comments
		};
		const body = JSON.stringify(data);
		// const body = data;

		fetch(url, {
			headers: headers,
			method: method,
			body: body
		})
			.then(response => response.json())
			.then(data => callback(null, data))
			.catch(err => {
				// We are offline...
				// Save review to local IDB
				DBHelper.createIDBReview(data)
					.then(review_key => {
						// Get review_key and save it with review to offline queue
						console.log('returned review_key', review_key);
						DBHelper.addRequestToQueue(url, headers, method, data, review_key)
							.then(offline_key => console.log('returned offline_key', offline_key));
					});
				callback(err, null);
			});
	}


	static updateIDBRestaurant(restaurant) {
		return idbKeyVal.set('restaurants', restaurant);
	}

	static createIDBReview(review) {
		return idbKeyVal.setReturnId('reviews', review)
			.then(id => {
				console.log('Saved to IDB: reviews', review);
				return id;
			});
	}

	static addRequestToQueue(url, headers, method, data, review_key) {
		const request = {
			url: url,
			headers: headers,
			method: method,
			data: data,
			review_key: review_key
		};
		return idbKeyVal.setReturnId('offline', request)
			.then(id => {
				console.log('Saved to IDB: offline', request);
				return id;
			});
	}

	static processQueue() {
		// Open offline queue & return cursor
		dbPromise.then(db => {
			if (!db) return;
			const tx = db.transaction(['offline'], 'readwrite');
			const store = tx.objectStore('offline');
			return store.openCursor();
		})
			.then(function nextRequest(cursor) {
				if (!cursor) {
					console.log('cursor done.');
					return;
				}
				console.log('cursor', cursor.value.data.name, cursor.value.data);

				const offline_key = cursor.key;
				const url = cursor.value.url;
				const headers = cursor.value.headers;
				const method = cursor.value.method;
				const data = cursor.value.data;
				const review_key = cursor.value.review_key;
				const body = JSON.stringify(data);

				// update server with HTTP POST request & get updated record back        
				fetch(url, {
					headers: headers,
					method: method,
					body: body
				})
					.then(response => response.json())
					.then(data => {
						// data is the returned record
						console.log('Received updated record from DB Server', data);

						// 1. Delete http request record from offline store
						dbPromise.then(db => {
							const tx = db.transaction(['offline'], 'readwrite');
							tx.objectStore('offline').delete(offline_key);
							return tx.complete;
						})
							.then(() => {
								// test if this is a review or favorite update
								if (review_key === undefined) {
									console.log('Favorite posted to server.');
								} else {
									// 2. Add new review record to reviews store
									// 3. Delete old review record from reviews store 
									dbPromise.then(db => {
										const tx = db.transaction(['reviews'], 'readwrite');
										return tx.objectStore('reviews').put(data)
											.then(() => tx.objectStore('reviews').delete(review_key))
											.then(() => {
												console.log('tx complete reached.');
												return tx.complete;
											})
											.catch(err => {
												tx.abort();
												console.log('transaction error: tx aborted', err);
											});
									})
										.then(() => console.log('review transaction success!'))
										.catch(err => console.log('reviews store error', err));
								}
							})
							.then(() => console.log('offline rec delete success!'))
							.catch(err => console.log('offline store error', err));

					}).catch(err => {
						console.log('fetch error. we are offline.');
						console.log(err);
						return;
					});
				return cursor.continue().then(nextRequest);
			})
			.then(() => console.log('Done cursoring'))
			.catch(err => console.log('Error opening cursor', err));
	}

	// GET
	// http://localhost:1337/restaurants/


	static fetchRestaurants(callback) {
		fetch(DBHelper.DATABASE_URL + '/restaurants')
			.then(response => {
				if (!response.ok) {
					throw Error(`Request failed. Returned status of ${response.statusText}`);
				}
				const restaurants = response.json();
				return restaurants;
			})
			.then(restaurants => callback(null, restaurants))
			.catch(err => callback(err, null));


	}



	// GET
	// http://localhost:1337/restaurants/

	/**
   * Fetch a restaurant by its ID.
   */
	static fetchRestaurantById(id, callback) {
		// fetch all restaurants with proper error handling.
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				const restaurant = restaurants.find(r => r.id == id);
				if (restaurant) { // Got the restaurant
					callback(null, restaurant);
				} else { // Restaurant does not exist in the database
					callback('Restaurant does not exist', null);
				}
			}
		});
	}

	// GET
	// http://localhost:1337/restaurants/
	/**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
	static fetchRestaurantByCuisine(cuisine, callback) {
		// Fetch all restaurants  with proper error handling
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given cuisine type
				const results = restaurants.filter(r => r.cuisine_type == cuisine);
				callback(null, results);
			}
		});
	}

	// GET
	// http://localhost:1337/restaurants/
	/**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
	static fetchRestaurantByNeighborhood(neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Filter restaurants to have only given neighborhood
				const results = restaurants.filter(r => r.neighborhood == neighborhood);
				callback(null, results);
			}
		});
	}

	/**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
	static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				let results = restaurants;
				if (cuisine != 'all') { // filter by cuisine
					results = results.filter(r => r.cuisine_type == cuisine);
				}
				if (neighborhood != 'all') { // filter by neighborhood
					results = results.filter(r => r.neighborhood == neighborhood);
				}
				callback(null, results);
			}
		});
	}

	/**
   * Fetch all neighborhoods with proper error handling.
   */
	static fetchNeighborhoods(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all neighborhoods from all restaurants
				const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood);
				// Remove duplicates from neighborhoods
				const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i);
				callback(null, uniqueNeighborhoods);
			}
		});
	}

	/**
   * Fetch all cuisines with proper error handling.
   */
	static fetchCuisines(callback) {
		// Fetch all restaurants
		DBHelper.fetchRestaurants((error, restaurants) => {
			if (error) {
				callback(error, null);
			} else {
				// Get all cuisines from all restaurants
				const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type);
				// Remove duplicates from cuisines
				const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i);
				callback(null, uniqueCuisines);
			}
		});
	}

	/**
   * Restaurant page URL.
   */
	static urlForRestaurant(restaurant) {
		return (`./restaurant.html?id=${restaurant.id}`);
	}

	/**
   * Restaurant image URL.
   */
	static imageUrlForRestaurant(restaurant) {
		const imageID = restaurant.id;

		const imagePath = `./img/${imageID}`;
		return {
			smallWEBP1x: `${imagePath}-300_1x.webp`,
			smallJPEG1x: `${imagePath}-300_1x.jpg`,
			smallWEBP2x: `${imagePath}-600_2x.webp`,
			smallJPEG2x: `${imagePath}-600_2x.jpg`,
			largeWEBP1x: `${imagePath}-400_1x.webp`,
			largeJPEG1x: `${imagePath}-400_1x.jpg`,
			largeWEBP2x: `${imagePath}-800_2x.webp`,
			largeJPEG2x: `${imagePath}-800_2x.jpg`,

		};
	}



	/**
   * Map marker for a restaurant.
   */
	static mapMarkerForRestaurant(restaurant, map) {
		// https://leafletjs.com/reference-1.3.0.html#marker  
		const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
			{
				title: restaurant.name,
				alt: restaurant.name,
				url: DBHelper.urlForRestaurant(restaurant)
			});
		marker.addTo(newMap);
		return marker;
	}
	/* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}

// export default DBHelper;
window.DBHelper = DBHelper;
