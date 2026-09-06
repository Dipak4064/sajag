// Network-only: never cache telemetry, radio messages, or stale simulator state.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => { event.respondWith(fetch(event.request)); });
