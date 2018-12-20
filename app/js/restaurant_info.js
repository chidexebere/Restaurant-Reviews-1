/* eslint-disable no-useless-escape */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

let restaurant;
let newMap;
let focusedElementBeforeModal;
const modal = document.getElementById('modal');
const modalOverlay = document.querySelector('.modal-overlay');


/**
 * Initialize map as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', (event) => {
	initMap();
});

/**
 * Initialize leaflet map
 */
window.initMap = () => {
	fetchRestaurantFromURL((error, restaurant) => {
		if (error) { // Got an error!
			console.error(error);
		} else {
			self.newMap = L.map('map', {
				center: [restaurant.latlng.lat, restaurant.latlng.lng],
				zoom: 16,
				scrollWheelZoom: false
			});
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.jpg70?access_token={mapboxToken}', {
				mapboxToken: 'pk.eyJ1IjoiY2hpZGV4ZWJlcmUiLCJhIjoiY2ptaHlmYXB0M2E2dTN2bnRoNHR5bW5tbiJ9.EdvWn4ZvzZwPnNXnH4jrcg',
				maxZoom: 18,
				attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
					'<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
					'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
				id: 'mapbox.streets'
			}).addTo(newMap);
			fillBreadcrumb();
			DBHelper.mapMarkerForRestaurant(self.restaurant, self.newMap);
		}
	});
};


window.addEventListener('load', function () {
	DBHelper.processQueue();
});

/* window.initMap = () => {
  fetchRestaurantFromURL((error, restaurant) => {
    if (error) { // Got an error!
      console.error(error);
    } else {
      self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 16,
        center: restaurant.latlng,
        scrollwheel: false
      });
      fillBreadcrumb();
      DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);
    }
  });
} */

/**
 * Get current restaurant from page URL.
 */
const fetchRestaurantFromURL = (callback) => {
	if (self.restaurant) { // restaurant already fetched!
		callback(null, self.restaurant);
		return;
	}
	const id = getParameterByName('id');
	if (!id) { // no id found in URL
		error = 'No restaurant id in URL';
		callback(error, null);
	}
	else {
		DBHelper.fetchRestaurantById(id, (error, restaurant) => {
			self.restaurant = restaurant;
			if (!restaurant) {
				console.error(error);
				return;
			}
			fillRestaurantHTML();
			callback(null, restaurant);
		});
	}
};

/**
 * Create restaurant HTML and add it to the webpage
 */
const fillRestaurantHTML = (restaurant = self.restaurant) => {
	const name = document.getElementById('restaurant-name');
	name.innerHTML = restaurant.name;

	const address = document.getElementById('restaurant-address');
	address.innerHTML = restaurant.address;


	const imageList = DBHelper.imageUrlForRestaurant(restaurant);
	const image = document.getElementById('restaurant-img');
	image.className = 'restaurant-img';
	image.srcset = `${imageList.smallWEBP1x} 300w, ${imageList.smallWEBP2x} 600w, ${imageList.largeWEBP1x} 400w, ${imageList.largeWEBP2x} 800w`;
	image.srcset = `${imageList.smallJPEG1x} 300w, ${imageList.smallJPEG2x} 600w, ${imageList.largeJPEG1x} 400w, ${imageList.largeJPEG2x} 800w`;
	image.src = imageList.smallJPEG1x;
	image.alt = `${restaurant.name} Restaurant`;
	image.title = `${restaurant.name} Restaurant`;

	image.sizes = '(min-width: 800px) 30vw, (min-width: 500px) and (max-width: 699px) 20vw, 10vw';

	const cuisine = document.getElementById('restaurant-cuisine');
	cuisine.innerHTML = restaurant.cuisine_type;

	// fill operating hours
	if (restaurant.operating_hours) {
		fillRestaurantHoursHTML();
	}


	// fill reviews
	DBHelper.fetchRestaurantReviewsById(restaurant.id, fillReviewsHTML);
};


/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
const fillRestaurantHoursHTML = (operatingHours = self.restaurant.operating_hours) => {
	const hours = document.getElementById('restaurant-hours');
	for (let key in operatingHours) {
		const row = document.createElement('tr');

		const day = document.createElement('td');
		day.innerHTML = key;
		row.appendChild(day);

		const time = document.createElement('td');
		time.innerHTML = operatingHours[key];
		row.appendChild(time);

		hours.appendChild(row);
	}
};

/**
 * Create all reviews HTML and add them to the webpage.
 */

const fillReviewsHTML = (error, reviews) => {
	self.restaurant.reviews = reviews;

	if (error) {
		console.log('Error retrieving reviews', error);
	}
	const header = document.getElementById('reviews-header');
	header.innerHTML = '';

	const title = document.createElement('h2');
	title.innerHTML = 'Reviews';
	header.appendChild(title);

	const addReview = document.createElement('button');
	addReview.id = 'review-add-btn';
	addReview.innerHTML = '+ add a review';
	addReview.setAttribute('aria-label', 'add review');
	addReview.title = 'Add Review';
	addReview.addEventListener('click', openModal);
	header.appendChild(addReview);

	const container = document.getElementById('reviews-container');
	if (!reviews) {
		const noReviews = document.createElement('p');
		noReviews.innerHTML = 'No reviews yet!';
		container.appendChild(noReviews);
		return;
	}
	const ul = document.getElementById('reviews-list');
	ul.innerHTML = '';
	reviews.reverse();
	reviews.forEach(review => {
		ul.appendChild(createReviewHTML(review));
	});
	container.appendChild(ul);
};


/**
 * Create review HTML and add it to the webpage.
 */
const createReviewHTML = (review) => {
	const li = document.createElement('li');
	const name = document.createElement('p');
	name.classList.add('reviewerName');
	name.innerHTML = review.name;
	li.appendChild(name);

	const createdAt = document.createElement('p');
	createdAt.classList.add('createdAt');
	const createdDate = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Pending';
	createdAt.innerHTML = `Added:${createdDate}`;
	li.appendChild(createdAt);

	// if (review.updatedAt > review.createdAt) 

	const updatedAt = document.createElement('p');
	const updatedDate = review.updatedAt ? new Date(review.updatedAt).toLocaleDateString() : 'Pending';
	updatedAt.innerHTML = `Updated:${updatedDate}`;
	updatedAt.classList.add('updatedAt');
	li.appendChild(updatedAt);


	const rating = document.createElement('p');
	rating.classList.add('rating');
	rating.innerHTML = `Rating: ${review.rating}`;
	rating.dataset.rating = review.rating;
	li.appendChild(rating);

	const comments = document.createElement('p');
	comments.classList.add('comments');
	comments.innerHTML = review.comments;
	li.appendChild(comments);

	return li;
};


/**
 * Add restaurant name to the breadcrumb navigation menu
 */
const fillBreadcrumb = (restaurant = self.restaurant) => {
	const breadcrumb = document.getElementById('breadcrumb');
	const li = document.createElement('li');
	li.innerHTML = restaurant.name;
	breadcrumb.appendChild(li);
};

/**
 * Get a parameter by name from page URL.
 */
const getParameterByName = (name, url) => {
	if (!url)
		url = window.location.href;
	name = name.replace(/[[\]]/g, '\\$&');
	const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
		results = regex.exec(url);
	if (!results)
		return null;
	if (!results[2])
		return '';
	return decodeURIComponent(results[2].replace(/\+/g, ' '));
};



// Adapted from modal dialog sample code in Udacity Web Accessibility course 891
//  https://github.com/udacity/ud891/blob/gh-pages/lesson2-focus/07-modals-and-keyboard-traps/solution/modal.js
const openModal = () => {
	// Save current focus
	focusedElementBeforeModal = document.activeElement;

	// Listen for and trap the keyboard
	modal.addEventListener('keydown', trapTabKey);

	// Listen for indicators to close the modal
	modalOverlay.addEventListener('click', closeModal);
	// Close btn
	const closeBtn = document.querySelector('.close-btn');
	closeBtn.addEventListener('click', closeModal);

	// submit form
	const form = document.getElementById('review_form');
	form.addEventListener('submit', saveAddReview, false);

	// Find all focusable children
	let focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';
	let focusableElements = modal.querySelectorAll(focusableElementsString);
	// Convert NodeList to Array
	focusableElements = Array.prototype.slice.call(focusableElements);

	let firstTabStop = focusableElements[0];
	let lastTabStop = focusableElements[focusableElements.length - 1];

	// Show the modal and overlay
	modal.classList.add('show');
	modalOverlay.classList.add('show');

	// Focus first child
	// firstTabStop.focus();
	const reviewName = document.getElementById('reviewName');
	setTimeout(() => {
		reviewName.focus();
	}, 200);

	function trapTabKey(e) {
		// Check for TAB key press
		if (e.keyCode === 9) {

			// SHIFT + TAB
			if (e.shiftKey) {
				if (document.activeElement === firstTabStop) {
					e.preventDefault();
					lastTabStop.focus();
				}

				// TAB
			} else {
				if (document.activeElement === lastTabStop) {
					e.preventDefault();
					firstTabStop.focus();
				}
			}
		}

		// ESCAPE
		if (e.keyCode === 27) {
			closeModal();
		}
	}
};

const saveAddReview = (e) => {
	e.preventDefault();
	const form = e.target;

	if (form.checkValidity()) {
		console.log('is valid');

		const restaurant_id = self.restaurant.id;
		const name = document.querySelector('#reviewName').value;
		const rating = document.querySelector('input[name=rate]:checked').value;
		const comments = document.querySelector('#reviewComments').value;

		// attempt save to database server
		DBHelper.createRestaurantReview(restaurant_id, name, rating, comments, (error, review) => {
			console.log('got callback');
			form.reset();
			if (error) {
				console.log('We are offline. Review has been saved to the queue.');
				// window.location.href = `/restaurant.html?id=${self.restaurant.id}&isOffline=true`;
				showOffline();
			} else {
				console.log('Received updated record from DB Server', review);
				DBHelper.createIDBReview(review); // write record to local IDB store
				// window.location.href = `/restaurant.html?id=${self.restaurant.id}`;
			}
			idbKeyVal.getAllIdx('reviews', 'restaurant_id', restaurant_id)
				.then(reviews => {
					// console.log(reviews);
					fillReviewsHTML(null, reviews);
					closeModal();
					document.getElementById('review-add-btn').focus();
				});
		});
	}
};

const closeModal = () => {
	// Hide the modal and overlay
	modal.classList.remove('show');
	modalOverlay.classList.remove('show');

	const form = document.getElementById('review_form');
	form.reset();
	// Set focus back to element that had it before the modal was opened
	focusedElementBeforeModal.focus();
};

const setFocus = (evt) => {
	const rateRadios = document.getElementsByName('rate');
	const rateRadiosArr = Array.from(rateRadios);
	const anyChecked = rateRadiosArr.some(radio => { return radio.checked === true; });
	// console.log('anyChecked', anyChecked);
	if (!anyChecked) {
		const star1 = document.getElementById('star1');
		star1.focus();
		// star1.checked = true;
	}
};

const navRadioGroup = (evt) => {
	// console.log('key', evt.key, 'code', evt.code, 'which', evt.which);
	// console.log(evt);

	const star1 = document.getElementById('star1');
	const star2 = document.getElementById('star2');
	const star3 = document.getElementById('star3');
	const star4 = document.getElementById('star4');
	const star5 = document.getElementById('star5');

	if (['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(evt.key)) {
		evt.preventDefault();
		// console.log('attempting return');
		if (evt.key === 'ArrowRight' || evt.key === 'ArrowDown') {
			switch (evt.target.id) {
				case 'star1':
					star2.focus();
					star2.checked = true;
					break;
				case 'star2':
					star3.focus();
					star3.checked = true;
					break;
				case 'star3':
					star4.focus();
					star4.checked = true;
					break;
				case 'star4':
					star5.focus();
					star5.checked = true;
					break;
				case 'star5':
					star1.focus();
					star1.checked = true;
					break;
			}
		} else if (evt.key === 'ArrowLeft' || evt.key === 'ArrowUp') {
			switch (evt.target.id) {
				case 'star1':
					star5.focus();
					star5.checked = true;
					break;
				case 'star2':
					star1.focus();
					star1.checked = true;
					break;
				case 'star3':
					star2.focus();
					star2.checked = true;
					break;
				case 'star4':
					star3.focus();
					star3.checked = true;
					break;
				case 'star5':
					star4.focus();
					star4.checked = true;
					break;
			}
		}
	}
};
