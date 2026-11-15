# DeckEngine – praca nad kodem

`index.html` jest **plikiem wynikowym**: nie edytuj go ręcznie. Źródła są w `src/`,
a `build.mjs` składa je w jeden samodzielny plik (działa offline, bez zależności w czasie działania).

## Struktura

| Ścieżka | Zawartość |
| --- | --- |
| `src/app.js` | cały kod aplikacji (sformatowany, nazwy zmiennych nadal krótkie) |
| `src/i18n/en.json` | tłumaczenia PL → EN (klucz to polski tekst używany w kodzie) |
| `src/styles/*.css` | style; kolejność sklejania w `src/styles/ORDER.txt` |
| `src/template.html` | szkielet HTML z znacznikami `@@…@@` |
| `src/vendor/` | PDF.js (główny plik i worker) |
| `src/fonts/`, `src/assets/` | czcionka monospace (DejaVu Sans Mono, podzbiór) i favicon |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA – kopiowane bez zmian |
| `tests/` | testy end-to-end (Playwright) |

## Polecenia

```
npm install            # raz: playwright, prettier, esbuild
npx playwright install chromium   # raz: przeglądarka do testów
npm run build          # src/ -> index.html
npm test               # build + testy e2e + testy odporności importu (ok. 4 min)
npm run test:hardening # tylko testy odporności importu (ZIP, kopia zapasowa, PDF)
npm run format         # prettier na src/app.js
npm run build:min      # wersja z usuniętymi białymi znakami (opcjonalnie)
```

## Zasady przy zmianach

- Nowy tekst w interfejsie: napisz go po polsku w `I18N_T("…")` i dodaj tłumaczenie do `src/i18n/en.json`.
- Nowy plik CSS: dodaj jego nazwę do `src/styles/ORDER.txt`.
- **Nie używaj krótkich, ogólnych nazw** (`T`, `e`, `t`) dla nowych zmiennych na najwyższym poziomie
  `src/app.js` – w pliku jest wiele takich nazw i łatwo o kolizję. Używaj dłuższych (`updateBar`, `hudRead`).
- Przy wydaniu zmień **obie** wartości: `APP_VER` w `src/app.js` i `VER` w `sw.js`
  (inaczej telefony mogą trzymać starą kopię powłoki).
- Przed wgraniem na GitHub Pages: `npm test`, potem commit `index.html` razem ze źródłami.

## Co sprawdzają testy

Biblioteka bez `localStorage`, okno „Nowa gra”, import obrazów i PDF (fokus w oknie), limity i anulowanie
importu, skróty klawiaturowe w grze, blokada orientacji, eksport i import kopii zapasowej, wersja EN,
Service Worker (cache tylko z prefiksem `deckengine-`, tryb offline, pasek „Dostępna nowa wersja”).

`tests/hardening.js` sprawdza import złośliwych i uszkodzonych plików (pliki generowane w locie): zip bomby
(z prawdziwym i zaniżonym rozmiarem), błędne CRC32, wpisy zaszyfrowane, ucięte/zduplikowane/nakładające się wpisy,
złośliwy manifest kopii (limity gier, kart, rozmiaru), PDF z 1001 stronami, anulowanie importu 160 stron
i uszkodzony PDF.

## Limity importu (w `src/app.js`)

| Limit | Wartość |
| --- | --- |
| Plik w ZIP po rozpakowaniu | 60 MB (`ZIP_ENTRY_MAX`), `manifest.json` 5 MB |
| Plik graficzny / obraz | 60 MB, 120 Mpx |
| Import obrazów/ZIP naraz | pytanie powyżej 300 plików lub 400 MB; twardo 3000 plików / 1,5 GB |
| Kopia zapasowa | do 200 gier, 3000 kart w grze, 20 000 kart łącznie, 2 GB po rozpakowaniu |
| PDF | pytanie powyżej 80 MB lub 150 stron; twardo 1000 stron (`IMPORT_MAX_PAGES`) |
| Czas | otwarcie PDF 60 s, render jednej strony 60 s |

Testy nie zastępują próby na prawdziwym telefonie (instalacja PWA, blokada orientacji, Wake Lock).
