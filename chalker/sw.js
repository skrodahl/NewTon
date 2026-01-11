/**
 * NewTon Chalker - Service Worker
 * Provides offline caching for PWA functionality
 */

const CACHE_NAME = 'chalker-v52';

// Files to cache for offline use
const CACHE_FILES = [
  './',
  './index.html',
  './js/db.js',
  './js/chalker.js',
  './styles/chalker.css',
  './fonts/Manrope-VariableFont_wght.ttf',
  './fonts/CascadiaCode-VariableFont_wght.ttf',
  './images/icon-192.png',
  './images/icon-512.png',
  './manifest.json'
];

// Install event - cache all files
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching app files');
        return cache.addAll(CACHE_FILES);
      })
      .then(() => {
        // Activate immediately without waiting
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        // Take control of all pages immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fall back to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});
