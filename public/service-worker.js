console.log("Hello from service worker!")

// static files 
const FILES_TO_CACHE = [
  "/",
  "/db.js",
  "/index.html",
  "/index.js",
  "/manifest.webmanifest",
  "/style.css",
  "/icons/bt_icon-72x72.png", 
  "/icons/bt_icon-96x96.png", 
  "/icons/bt_icon-128x128.png", 
  "/icons/bt_icon-144x144.png", 
  "/icons/bt_icon-152x152.png", 
  "/icons/bt_icon-192x192.png", 
  "/icons/bt_icon-384x384.png", 
  "/icons/bt_icon-512x512.png"
];

// static and data caches 
const CACHE_NAME = "static-cache-v2";
const DATA_CACHE_NAME = "data-cache-v1";

// install the static cache 
self.addEventListener("install", function(evt) {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("Your files were pre-cached successfully!");
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// remove any caches that arent the ones we care about 
self.addEventListener("activate", function(evt) {
  evt.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(key => {
          if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
            console.log("Removing old cache data", key);
            return caches.delete(key);
          }
        })
      );
    })
  );

  // take control of the service worker 
  self.clients.claim();
});

// **********************************************
// manage the cache
// **********************************************

// fetch. Only do this cache stuff if the URL includes /api/ 

self.addEventListener("fetch", function(evt) {
  
  if (evt.request.url.includes("/api/")) {
    evt.respondWith(
      caches.open(DATA_CACHE_NAME).then(cache => {
        return fetch(evt.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.
            if (response.status === 200) {
              cache.put(evt.request.url, response.clone());
            }

            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
              return cache.match(evt.request);
            
          });
      }).catch(err => {
        console.log(err)
      })
    );

    return;
  }

  // this block happens if the url does NOT include /api/, I think 

  evt.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(evt.request).then(response => {
        return response || fetch(evt.request);
      });
    })
  );
});
