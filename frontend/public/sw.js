// Service worker minimal V1 : cache des assets statiques pour un fonctionnement
// en connectivité faible. La synchronisation de saisie hors-ligne est reportée
// à une phase ultérieure (voir échange sur l'architecture technique).

const CACHE_NAME = "moyennepro-v1";
const ASSETS_A_CACHER = ["/", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_A_CACHER))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((reponse) => reponse || fetch(event.request))
  );
});
