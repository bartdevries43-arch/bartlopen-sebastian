/* Eenvoudige offline-cache voor Run Coach. Verhoog CACHE bij elke update. */
const CACHE = "bartlopen-sebastian-interval-uitleg-1";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=7-duidelijkebadges",
  "./app.js?v=interval-uitleg-1",
  "./coach.jpg",
  "./coach-logo.png",
  "./bartlopen-runcoach.png",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./manifest.json",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then((hit) =>
      hit || fetch(e.request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      }).catch(() => caches.match("./index.html"))
    )
  );
});
