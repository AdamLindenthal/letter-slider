const CACHE_NAME = 'letter-slider-v6';

// Core assets — install fails if any of these are missing
const PRECACHE_REQUIRED = [
  './',
  './index.html',
  './manifest.json',
  './sounds.json',
  './css/main.css',
  './css/cards.css',
  './css/tray.css',
  './css/toast.css',
  './js/config.js',
  './js/words.js',
  './js/state.js',
  './js/main.js',
  './js/round.js',
  './js/render.js',
  './js/drag.js',
  './js/audio.js',
  './js/canvas.js',
  './js/debug.js',
  './js/animations/index.js',
  './js/animations/tank.js',
  './js/animations/grenade.js',
  './js/animations/shotgun.js',
  './js/animations/tnt.js',
  './js/animations/atomic.js',
  './js/animations/drone.js',
  './js/animations/helicopter.js',
  './js/animations/jet.js',
  './js/animations/bomber.js',
  './js/animations/artillery.js',
  './js/animations/spg.js',
  './assets/fonts/skolacek-ce.otf',
];

// Optional assets — cached if available, silently skipped otherwise
const PRECACHE_OPTIONAL = [
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/backgrounds/bg1.jpg',
  './assets/backgrounds/bg2.jpg',
  './assets/backgrounds/bg3.jpg',
  './assets/soundfx/tank/moving.mp3',
  './assets/soundfx/tank/aming.mp3',
  './assets/soundfx/tank/fire.mp3',
  './assets/soundfx/tank/impact.mp3',
  './assets/soundfx/daviddumaisaudio-grenade-explosion-14-190266.mp3',
  './assets/soundfx/freesound_community-hq-explosion-6288.mp3',
  './assets/soundfx/freesound_community-grende-with-falling-earth-90860.mp3',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await cache.addAll(PRECACHE_REQUIRED);
      await Promise.allSettled(
        PRECACHE_OPTIONAL.map(url => cache.add(url).catch(() => {}))
      );
    })
    // No self.skipWaiting() — user must tap "Aktualizovat" to apply
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.startsWith(self.location.origin)) {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if (cached) return cached;
        return fetch(event.request).then(response => {
          if (response.ok) {
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, response.clone()));
          }
          return response;
        });
      })
    );
  }
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
