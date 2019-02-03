/* Register service worker */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/sw.js")
    .then(reg => console.log("SW Registered!", reg))
    .catch(err => console.log("SW registration failed!", err));
}
