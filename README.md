# DeckEngine

**Language / Język:** [🇬🇧 English](#-english) | [🇵🇱 Polski](#-polski)

---

## 🇬🇧 English

**DeckEngine** is a web application – a tool designed primarily for board games featuring an automa mode. It builds your deck before a session and manages it during gameplay. Its flagship feature is intelligent, automated card extraction directly from PDF files, allowing you to instantly turn print-ready materials into a ready-to-play deck.

### 🚀 Launch the App

**Run the application directly in your browser:**
👉 [https://k-d-s-z.github.io/DeckEngine/](https://k-d-s-z.github.io/DeckEngine/)

### ✨ Key Features

* Built for solo games with automa modes, Print & Play games, and prototypes
* Works completely offline and sends no data over the internet (fonts and PDF engine are bundled)
* Automatically slices cards from PDFs and supports image files and ZIP archives
* Shuffles and draws cards during gameplay, with a counter for the draw pile and the discard pile
* Lets you choose how many cards to draw at once (1–6) and browse the discard pile
* Cards can be rotated, and screen orientation can be set per game (auto / portrait / landscape)
* Saves your games locally on your device, with backup export and import
* Installable as an app (PWA) on phones and desktops
* Available in Polish and English

### 📲 Install and offline use

Open the app in your browser and use *Install app* / *Add to Home screen*. After the first load, DeckEngine works without any connection. When a new version is published, the app shows an update bar – tap it to refresh. The current version is shown at the bottom of the game library.

### 🔒 Privacy and safety

* Your decks never leave your device – they are stored in the browser's local storage on your device
* Imported ZIP and PDF files are validated: size, page and entry limits, CRC checks, and protection against ZIP bombs and malformed archives
* Importing a large PDF can be cancelled at any time

### 💡 Why DeckEngine?

If you play solo or design your own games, DeckEngine simplifies one of the most time-consuming stages: deck preparation and management. Instead of spending time manually cutting and shuffling cards, you can focus right away on the game itself.

### 🛠️ For developers

The published app is a single `index.html` built from the sources in `src/`. See [`DEV.md`](DEV.md) for the project structure and rules.

```bash
npm run build          # build index.html from src/
npm run build:min      # minified build
npm test               # build + end-to-end and hardening tests (Playwright)
```

When releasing, bump both `APP_VER` in `src/app.js` and `VER` in `sw.js`.

---

## 🇵🇱 Polski

**DeckEngine** to aplikacja webowa – narzędzie stworzone przede wszystkim z myślą o grach planszowych wykorzystujących tryb automy. Tworzy talię przed partią i obsługuje ją w trakcie rozgrywki. Flagową funkcją jest inteligentne, automatyczne wycinanie kart bezpośrednio z plików PDF, co pozwala błyskawicznie zamienić materiały do druku w gotową do użycia talię.

### 🚀 Uruchom aplikację

**Uruchom aplikację bezpośrednio w przeglądarce:**
👉 [https://k-d-s-z.github.io/DeckEngine/](https://k-d-s-z.github.io/DeckEngine/)

### ✨ Najważniejsze cechy

* Stworzone do gier solo z trybem automy, gier Print & Play oraz prototypów
* Działa w pełni offline i nie wysyła żadnych danych do internetu (czcionki i silnik PDF są wbudowane)
* Automatycznie wycina karty z PDF-ów oraz obsługuje pliki graficzne i archiwa ZIP
* Tasuje i losuje karty w trakcie rozgrywki, z licznikiem talii i stosu odrzuconych
* Umożliwia wybór liczby dobieranych naraz kart (1–6) oraz przeglądanie stosu odrzuconych
* Karty można obracać, a orientację ekranu ustawić osobno dla każdej gry (auto / pion / poziom)
* Zapisuje gry lokalnie na Twoim urządzeniu, z eksportem i importem kopii zapasowej
* Można ją zainstalować jak aplikację (PWA) na telefonie i komputerze
* Dostępna po polsku i po angielsku

### 📲 Instalacja i praca offline

Otwórz aplikację w przeglądarce i wybierz *Zainstaluj aplikację* / *Dodaj do ekranu głównego*. Po pierwszym wczytaniu DeckEngine działa bez połączenia z internetem. Gdy pojawi się nowa wersja, aplikacja pokaże pasek aktualizacji – dotknij go, aby odświeżyć. Aktualną wersję widać na dole biblioteki gier.

### 🔒 Prywatność i bezpieczeństwo

* Twoje talie nie opuszczają urządzenia – są zapisane w lokalnej pamięci przeglądarki na Twoim urządzeniu
* Importowane pliki ZIP i PDF są sprawdzane: limity rozmiaru, stron i wpisów, kontrola CRC oraz ochrona przed bombami ZIP i uszkodzonymi archiwami
* Import dużego PDF-a można w każdej chwili anulować

### 💡 Dlaczego DeckEngine?

Jeśli grasz solo lub projektujesz własne gry, DeckEngine uprości jeden z najbardziej czasochłonnych etapów: przygotowanie i obsługę talii. Zamiast tracić czas na ręczne wycinanie i tasowanie kart, możesz od razu skupić się na samej grze.

### 🛠️ Dla developerów

Publikowana aplikacja to pojedynczy plik `index.html` budowany ze źródeł w `src/`. Strukturę projektu i zasady opisuje [`DEV.md`](DEV.md).

```bash
npm run build          # zbuduj index.html ze źródeł w src/
npm run build:min      # wersja zminifikowana
npm test               # build + testy e2e i odpornościowe (Playwright)
```

Przy wydawaniu nowej wersji podbij zarówno `APP_VER` w `src/app.js`, jak i `VER` w `sw.js`.

---

*Created by* [*k-d-s-z*](https://github.com/k-d-s-z)
