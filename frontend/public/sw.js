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
  const { request } = event;

  // Ne jamais intercepter les requêtes non-GET (POST/PUT/DELETE) ni les appels
  // cross-origin (API sur Render) : les laisser passer nativement au navigateur.
  // Nécessaire pour que les cookies de session (Set-Cookie) soient bien posés —
  // les navigateurs ignorent Set-Cookie sur une réponse fournie par un service worker.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(request).then((reponse) => reponse || fetch(request))
  );
});