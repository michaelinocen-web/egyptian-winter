// Offline cache for the Egypt itinerary. Bump VERSION when the app files change.
const VERSION = "egypt-journey-v5";
const PHOTOS = "egypt-photos-v1"; // Wikimedia photos, kept across app updates
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== PHOTOS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Photos: cache first (they never change), fill the cache as they're viewed or via "Save photos offline".
  if (url.hostname === "upload.wikimedia.org") {
    e.respondWith(caches.open(PHOTOS).then(c => c.match(req, { ignoreVary: true }).then(hit => hit || fetch(req).then(res => {
      if (res.ok) c.put(req, res.clone());
      return res;
    }))));
    return;
  }
  if (url.origin !== self.location.origin) return;
  // Network first for the page (so updates arrive), cache fallback when offline.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put("./index.html", copy)); return res; })
      .catch(() => caches.match("./index.html")));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
