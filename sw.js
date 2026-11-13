/* DeckEngine – Service Worker
 * Cache aplikacji jest wyłącznie lokalnym cache przeglądarki.
 * Brak analityki, zewnętrznych endpointów i synchronizacji danych.
 */
const CACHE_PREFIX = "deckengine-shell-";
const CACHE_VERSION = "v1";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;

const APP_SHELL = [
  "./",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(APP_SHELL);
    // Nie wymuszamy skipWaiting: aktywna sesja nie zostanie nagle przełączona
    // na nową wersję podczas edycji lub importu danych.
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Nawigacja: najpierw świeża wersja z hostingu, a przy braku sieci
  // zapisana powłoka aplikacji. Obsługuje też wejście na adres z hashem.
  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put("./", response.clone());
        }
        return response;
      } catch {
        return (await caches.match("./")) ||
          new Response("Aplikacja nie jest jeszcze dostępna offline. Otwórz ją raz online, aby zapisać ją na urządzeniu.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          });
      }
    })());
    return;
  }

  // Cache-first tylko dla statycznej powłoki PWA (manifest i ikony).
  const path = url.pathname;
  const isShellAsset =
    path.endsWith("/manifest.webmanifest") ||
    /\/icons\/icon-(192|512|maskable-512)\.png$/.test(path);

  if (isShellAsset) {
    event.respondWith((async () => {
      const cached = await caches.match(request);
      if (cached) return cached;
      try {
        const response = await fetch(request);
        if (response && response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, response.clone());
        }
        return response;
      } catch {
        return new Response("", { status: 504 });
      }
    })());
  }
});
