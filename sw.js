// DeckEngine service worker: działanie offline.
// Przy zmianie plików aplikacji podnieś numer wersji poniżej (i APP_VER w index.html).
const PREFIX = "deckengine-";
const VER = PREFIX + "shell-v17";
// Pliki konieczne do działania offline – jeśli któregoś brakuje, instalacja się nie uda.
const CORE = ["./", "index.html", "manifest.webmanifest"];
// Ikony: zapisujemy, jeśli są; ich brak nie może blokować działania offline.
const OPTIONAL = ["icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(VER)
      .then((c) => c.addAll(CORE).then(() => Promise.allSettled(OPTIONAL.map((u) => c.add(u)))))
      .then(() => self.skipWaiting())
  );
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
    let servedStale = false;
    const net = fetch(req);
    // Kopię robimy od razu (zanim odpowiedź zacznie być czytana) i czekamy na jej zapis.
    const store = net
      .then(async (res) => {
        if (!res.ok) return;
        const copy = res.clone();
        const c = await caches.open(VER);
        const old = await c.match("index.html");
        await c.put("index.html", copy);
        // Użytkownik dostał starą kopię, a w sieci jest nowsza – powiadom stronę.
        const changed = old && (old.headers.get("etag") !== res.headers.get("etag") || old.headers.get("content-length") !== res.headers.get("content-length"));
        if (servedStale && changed) {
          const cs = await self.clients.matchAll({ type: "window" });
          cs.forEach((cl) => cl.postMessage({ type: "update" }));
        }
      })
      .catch(() => {});
    e.waitUntil(store);
    const timeout = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
    // Odpowiedź błędna (np. 500/503) traktujemy jak brak odpowiedzi – lepsza jest kopia z pamięci.
    const okNet = net.then((r) => (r.ok ? r : null)).catch(() => null);
    e.respondWith(
      Promise.race([okNet, timeout]).then(
        (res) => res || caches.match("index.html", { cacheName: VER }).then((hit) => { if (hit) servedStale = true; return hit || net.catch(() => Response.error()); })
      )
    );
    return;
  }

  // Pozostałe pliki: z pamięci, a jeśli ich nie ma – z sieci (i zapisz).
  e.respondWith(
    caches.open(VER).then((c) => c.match(req)).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok) {
        const copy = res.clone();
        e.waitUntil(caches.open(VER).then((c) => c.put(req, copy)));
      }
      return res;
    }))
  );
});
