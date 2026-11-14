// DeckEngine service worker: działanie offline.
// Przy zmianie plików aplikacji podnieś numer wersji poniżej.
const VER = "deckengine-v1";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VER).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VER).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    // Strona: najpierw sieć (świeża wersja), a przy braku odpowiedzi w 3 s lub offline – kopia z pamięci.
    const net = fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VER).then((c) => c.put("index.html", copy)); }
      return res;
    });
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    e.waitUntil(net.catch(() => null));
    e.respondWith(
      Promise.race([net.catch(() => null), timeout]).then(
        (res) => res || caches.match("index.html").then((hit) => hit || net)
      )
    );
    return;
  }

  // Pozostałe pliki: z pamięci, a jeśli ich nie ma – z sieci (i zapisz).
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VER).then((c) => c.put(req, copy)); }
      return res;
    }))
  );
});
