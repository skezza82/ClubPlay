// Minimal Service Worker to satisfy PWA requirements
self.addEventListener('install', (event) => {
    console.log('SW installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('SW activated');
});

self.addEventListener('fetch', (event) => {
    // Required for PWA to be considered "installable"
    event.respondWith(fetch(event.request));
});
