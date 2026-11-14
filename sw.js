// DeckEngine service worker: działanie offline.
// Przy zmianie plików aplikacji podnieś numer wersji poniżej.
const PREFIX = "deckengine-";
const VER = PREFIX + "shell-v2";
const SHELL = ["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VER).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      // Kasujemy tylko stare cache DeckEngine – nie ruszamy cache innych aplikacji z tego samego originu.
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== VER).map((k) => caches.delete(k))))
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
    const net = fetch(req);
    // Kopię robimy od razu (zanim odpowiedź zacznie być czytana) i czekamy na jej zapis.
    const store = net
      .then((res) => {
        if (!res.ok) return;
        const copy = res.clone();
        return caches.open(VER).then((c) => c.put("index.html", copy));
      })
      .catch(() => {});
    e.waitUntil(store);
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
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
      if (res.ok) {
        const copy = res.clone();
        e.waitUntil(caches.open(VER).then((c) => c.put(req, copy)));
      }
      return res;
    }))
  );
});
