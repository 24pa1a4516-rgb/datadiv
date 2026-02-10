const CACHE_NAME = 'agriconnect-v1';
const ASSETS = [
    '/',
    '/homepage.html',
    '/css/style.css',
    '/icons/icon-512.png',
    '/lang.js'
];

// Install Event
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS);
        })
    );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
