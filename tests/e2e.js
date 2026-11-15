// Testy end-to-end (Playwright, Chromium). Uruchom: npm test
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const { serve, reporter, newPage, createGameWithImages, chromium } = require("./helpers");
const { png, gridPdf } = require("./fixtures");

const card = (i) => ({
  name: `c${String(i).padStart(3, "0")}.png`,
  mimeType: "image/png",
  buffer: png(60, 84, [40 + i * 10, 90, 120]),
});
const cards = (n) => Array.from({ length: n }, (_, i) => card(i));
const bodyText = (page) => page.evaluate(() => document.body.innerText);

(async () => {
  const t = reporter();
  const { server, state, url } = await serve();
  const browser = await chromium.launch();
  const base = url + "index.html";

  // ---------------------------------------------------------------- biblioteka
  t.section("Biblioteka i odporność na brak localStorage");
  {
    const { ctx, page, errors } = await newPage(browser);
    await page.addInitScript(() => {
      Storage.prototype.getItem = () => {
        throw new Error("blocked");
      };
      Storage.prototype.setItem = () => {
        throw new Error("blocked");
      };
    });
    await page.goto(base);
    await page.waitForSelector(".game.new", { timeout: 5000 }).catch(() => {});
    t.ok("biblioteka renderuje się, gdy localStorage rzuca wyjątki", (await page.locator(".game.new").count()) === 1);
    t.ok("brak błędów JS", errors.length === 0, errors.join("; "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- nowa gra + dialog
  t.section("Nowa gra, okno bez suwaków, import obrazów");
  {
    const { ctx, page, errors } = await newPage(browser);
    await page.goto(base);
    await page.click(".game.new");
    await page.waitForSelector("dialog[open]");
    const sz = await page.evaluate(() => {
      const d = document.querySelector("dialog[open]");
      return { sw: d.scrollWidth, cw: d.clientWidth, sh: d.scrollHeight, ch: d.clientHeight };
    });
    t.ok("okno „Nowa gra” mieści się bez przewijania", sz.sw <= sz.cw && sz.sh <= sz.ch, JSON.stringify(sz));
    await page.keyboard.press("Escape");
    await createGameWithImages(page, "Test", cards(5));
    t.ok("dodano 5 kart", (await page.locator(".tile").count()) === 5);
    await page.click("text=Graj");
    await page.waitForSelector(".draw-btn");
    t.ok(
      "wersja aplikacji w stopce biblioteki",
      /wersja \d{4}\.\d{2}\.\d{2}/.test(
        await (async () => {
          await page.goto(base + "#/");
          await page.waitForSelector(".foot");
          await page.waitForTimeout(400);
          return page.locator(".foot").innerText();
        })(),
      ),
    );
    t.ok("brak błędów JS", errors.length === 0, errors.join("; "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- import PDF
  t.section("Import PDF: fokus w oknie, dodawanie kart");
  {
    const { ctx, page, errors } = await newPage(browser, { width: 1000, height: 800 });
    await page.goto(base);
    await page.click(".game.new");
    await page.fill("dialog input", "PDF");
    await page.click('dialog button:has-text("Utwórz")');
    await page.waitForSelector("text=/Dodaj karty/");
    await page.click("text=/Dodaj karty/");
    const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click("text=PDF lub arkusz do pocięcia")]);
    await fc.setFiles({ name: "arkusz.pdf", mimeType: "application/pdf", buffer: gridPdf() });
    await page.waitForSelector(".imp-body", { timeout: 30000 });
    await page.waitForTimeout(2500);
    t.ok("fokus trafia do okna importu", await page.evaluate(() => !!document.activeElement.closest(".importer")));
    let inside = true;
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      if (!(await page.evaluate(() => !!document.activeElement.closest(".importer")))) inside = false;
    }
    t.ok("Tab ×40 nie wychodzi poza okno importu", inside);
    await page.click(".modal .btn.primary");
    await page.waitForSelector(".tile", { timeout: 60000 });
    const n = await page.locator(".tile").count();
    t.ok(`z arkusza powstały karty (${n})`, n >= 6);
    t.ok("okno importu zniknęło", (await page.locator(".importer").count()) === 0);
    t.ok("brak błędów JS", errors.length === 0, errors.join("; "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- limity importu
  t.section("Limity importu: pytanie przy dużej liczbie plików, anulowanie");
  {
    const { ctx, page } = await newPage(browser);
    await page.goto(base);
    await page.click(".game.new");
    await page.fill("dialog input", "Duzo");
    await page.click('dialog button:has-text("Utwórz")');
    await page.waitForSelector("text=/Dodaj karty/");
    const many = Array.from({ length: 305 }, (_, i) => ({
      name: `c${i}.png`,
      mimeType: "image/png",
      buffer: png(8, 8),
    }));
    const pick = async () => {
      await page.click("text=/Dodaj karty/");
      await page.waitForTimeout(300);
      const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click("text=Obrazy lub ZIP z obrazami")]);
      await fc.setFiles(many);
    };
    await pick();
    await page.waitForSelector("dialog[open]", { timeout: 10000 });
    t.ok("pojawia się pytanie „Duży import”", /Duży import/.test(await page.locator("dialog[open]").innerText()));
    await page.click('dialog[open] button:has-text("Anuluj")');
    await page.waitForTimeout(600);
    t.ok(
      "po Anuluj nie ma okna postępu ani dialogu",
      (await page.locator(".busy").count()) === 0 && (await page.locator("dialog[open]").count()) === 0,
    );
    t.ok("nic nie dodano", (await page.locator(".tile").count()) === 0);
    await pick();
    await page.waitForSelector("dialog[open]");
    await page.click('dialog[open] button:has-text("Kontynuuj")');
    await page.waitForSelector(".busy .btn");
    await page.click(".busy .btn");
    await page.waitForTimeout(1500);
    t.ok("anulowanie w trakcie kończy import", (await page.locator(".busy").count()) === 0);
    t.ok(
      "komunikat „Import przerwany.”",
      (await page.locator(".toast").allInnerTexts()).some((x) => /przerwany/i.test(x)),
    );
    await ctx.close();
  }

  // ---------------------------------------------------------------- skróty klawiaturowe
  t.section("Gra: skróty klawiaturowe");
  {
    const { ctx, page } = await newPage(browser, { width: 1000, height: 800 });
    await page.goto(base);
    await createGameWithImages(page, "Skroty", cards(5));
    await page.click("text=Graj");
    await page.waitForSelector(".draw-btn");
    const inDeck = () => page.locator(".draw-btn .badge").innerText().then(Number);
    t.ok("start: 5 kart w talii", (await inDeck()) === 5);
    await page.keyboard.press("Space");
    await page.waitForTimeout(300);
    t.ok("spacja (fokus na body) dobiera kartę", (await inDeck()) === 4);
    const sc = await page.evaluate(() => {
      const m = getComputedStyle(document.querySelector(".gcard-img")).transform;
      return m === "none" ? 1 : parseFloat(m.slice(7));
    });
    t.ok(
      "karta jest przycięta domyślnie o 1% z każdej strony (skala ~1,02)",
      Math.abs(sc - 1 / 0.98) < 0.002,
      String(sc),
    );
    await page.focus('button[aria-label*="Tasuj"]');
    await page.keyboard.press("Enter");
    await page.waitForTimeout(400);
    t.ok(
      "Enter na przycisku „Tasuj” otwiera okno, ale nie dobiera karty",
      (await page.locator("dialog[open]").count()) === 1 && (await inDeck()) === 4,
    );
    await ctx.close();
  }

  // ---------------------------------------------------------------- orientacja
  t.section("Orientacja ekranu");
  {
    const { ctx, page, errors } = await newPage(browser, { hasTouch: true, isMobile: true });
    await page.addInitScript(() => {
      window.__locks = [];
      window.__unlocks = 0;
      screen.orientation.lock = async (x) => {
        window.__locks.push(x);
        if (window.__failLock) throw new Error("nope");
      };
      screen.orientation.unlock = () => window.__unlocks++;
    });
    await page.goto(base);
    await createGameWithImages(page, "Orient", cards(3));
    await page.locator(".seg-btn").nth(2).scrollIntoViewIfNeeded();
    await page.click('.seg-btn:has-text("Poziomo")');
    t.ok("zaznaczono „Poziomo”", (await page.locator(".seg-btn.on").innerText()).toLowerCase().includes("poziomo"));
    await page.click("text=Graj");
    await page.waitForSelector(".draw-btn");
    await page.waitForTimeout(400);
    t.ok(
      "wejście do gry blokuje orientację na landscape",
      (await page.evaluate(() => window.__locks)).includes("landscape"),
    );
    t.ok("brak podpowiedzi, gdy blokada się udała", (await page.locator(".orient-hint").count()) === 0);
    const playHash = await page.evaluate(() => location.hash);
    await page.evaluate(() => (location.hash = "#/"));
    await page.waitForTimeout(500);
    t.ok("wyjście z gry zwalnia blokadę", (await page.evaluate(() => window.__unlocks)) >= 1);
    await page.evaluate(() => (window.__failLock = true));
    await page.evaluate((h) => (location.hash = h), playHash);
    await page.waitForSelector(".draw-btn");
    await page.waitForTimeout(400);
    t.ok("gdy blokada się nie uda, jest podpowiedź o obrocie", (await page.locator(".orient-hint").count()) === 1);
    await page.setViewportSize({ width: 800, height: 390 });
    await page.waitForTimeout(500);
    t.ok("po obróceniu telefonu podpowiedź znika", (await page.locator(".orient-hint").count()) === 0);
    t.ok("brak błędów JS", errors.length === 0, errors.join("; "));
    await ctx.close();
  }

  // ---------------------------------------------------------------- kopia zapasowa + EN
  t.section("Kopia zapasowa (eksport → import) i wersja angielska");
  {
    const a = await newPage(browser, { acceptDownloads: true });
    await a.page.goto(base);
    await createGameWithImages(a.page, "Kopia", cards(4));
    await a.page.locator(".seg-btn").nth(1).scrollIntoViewIfNeeded();
    await a.page.click('.seg-btn:has-text("Pionowo")');
    await a.page.waitForTimeout(300);
    await a.page.goto(base + "#/");
    await a.page.waitForSelector(".game:not(.new)");
    const [dl] = await Promise.all([
      a.page.waitForEvent("download"),
      a.page.click('button[title^="Zapisz wszystkie"]'),
    ]);
    const zip = path.join(os.tmpdir(), `deckengine-test-${Date.now()}.zip`);
    await dl.saveAs(zip);
    t.ok("eksport tworzy plik ZIP", fs.statSync(zip).size > 100);
    await a.ctx.close();

    const b = await newPage(browser);
    await b.page.goto(base);
    const [fc] = await Promise.all([
      b.page.waitForEvent("filechooser"),
      b.page.click('button[title^="Wczytaj kopię"]'),
    ]);
    await fc.setFiles(zip);
    await b.page.waitForSelector(".game:not(.new)", { timeout: 20000 });
    t.ok("import kopii odtwarza grę w czystej przeglądarce", (await b.page.locator(".game:not(.new)").count()) === 1);
    await b.page.click(".game-edit");
    await b.page.waitForSelector(".seg-btn");
    t.ok(
      "ustawienie orientacji przeżyło eksport/import",
      (await b.page.locator(".seg-btn.on").innerText()).toLowerCase().includes("pionowo"),
    );
    t.ok("4 karty po imporcie", (await b.page.locator(".tile").count()) === 4);
    // wersja angielska
    await b.page.evaluate(() => localStorage.setItem("lang", "en"));
    await b.page.goto(base + "#/");
    await b.page.reload();
    await b.page.waitForSelector(".game.new");
    let txt = await bodyText(b.page);
    t.ok("EN: biblioteka bez „[object”/„undefined”", !/\[object|undefined|NaN/.test(txt));
    t.ok("EN: napisy po angielsku", /New game/i.test(txt) && /backup/i.test(txt));
    await b.page.click(".game-main");
    await b.page.waitForSelector(".draw-btn");
    txt = await bodyText(b.page);
    t.ok("EN: ekran gry bez błędów tłumaczeń", !/\[object|undefined|NaN/.test(txt) && /DECK/.test(txt));
    t.ok("brak błędów JS", b.errors.length === 0, b.errors.join("; "));
    await b.ctx.close();
    fs.rmSync(zip, { force: true });
  }

  // ---------------------------------------------------------------- Service Worker
  t.section("Service Worker: cache, offline, powiadomienie o nowej wersji");
  {
    const { ctx, page } = await newPage(browser, { width: 1000, height: 800 });
    const ready = (pg) => pg.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 20000 });
    // Czy wszystkie pliki z manifestu i powłoki istnieją (brak ikon to częsta przyczyna problemów z instalacją PWA).
    {
      const man = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "manifest.webmanifest"), "utf8"));
      const missing = man.icons.map((i) => i.src).filter((f) => !fs.existsSync(path.join(__dirname, "..", f)));
      t.ok("wszystkie ikony z manifestu istnieją", missing.length === 0, "brakuje: " + missing.join(", "));
    }
    const bad = [];
    page.on("response", (r) => r.status() >= 400 && bad.push(r.status() + " " + new URL(r.url()).pathname));
    // Cache "obcej aplikacji" i stary cache DeckEngine tworzymy PRZED instalacją Service Workera
    // (ten sam origin, ale strona bez rejestracji – obraz).
    await page.goto(url + "icons/icon-192.png");
    await page.evaluate(async () => {
      await caches.open("other-app-v1");
      await caches.open("deckengine-old");
    });
    await page.goto(url);
    await page.waitForSelector(".game.new");
    const ctl = await ready(page).then(
      () => true,
      () => false,
    );
    t.ok("Service Worker przejmuje stronę", ctl, "odpowiedzi >= 400: " + (bad.join(", ") || "brak"));
    await page
      .waitForFunction(async () => !(await caches.keys()).includes("deckengine-old"), null, { timeout: 20000 })
      .catch(() => {});
    const keys = await page.evaluate(() => caches.keys());
    t.ok("stary cache DeckEngine usunięty", !keys.includes("deckengine-old"), keys.join(","));
    t.ok("cache innej aplikacji nietknięty", keys.includes("other-app-v1"), keys.join(","));
    const shellKey = keys.find((k) => k.startsWith("deckengine-shell-"));
    const shell = shellKey
      ? await page.evaluate(
          async (k) => (await (await caches.open(k)).keys()).map((r) => new URL(r.url).pathname),
          shellKey,
        )
      : [];
    t.ok(
      "powłoka aplikacji zapisana w cache",
      ["/", "/index.html", "/manifest.webmanifest"].every((p) => shell.includes(p)),
      shell.join(","),
    );
    await ctx.setOffline(true);
    await page.reload();
    await page.waitForSelector(".game.new", { timeout: 8000 }).catch(() => {});
    t.ok("aplikacja działa offline", (await page.locator(".game.new").count()) === 1);
    await ctx.setOffline(false);
    t.ok("brak paska aktualizacji przy pierwszym uruchomieniu", (await page.locator(".upd-bar").count()) === 0);

    // nowa wersja na serwerze + wolna sieć (>3 s): start ze starej kopii, potem komunikat
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "deckengine-site-"));
    fs.cpSync(path.join(__dirname, ".."), tmp, {
      recursive: true,
      filter: (s) => !/^(node_modules|\.git|tests)([\\/]|$)/.test(path.relative(path.join(__dirname, ".."), s)),
    });
    const second = await serve(tmp);
    const { ctx: c2, page: p2 } = await newPage(browser, { width: 1000, height: 800 });
    await p2.goto(second.url);
    await p2.waitForSelector(".game.new");
    await ready(p2);
    fs.appendFileSync(path.join(tmp, "index.html"), "\n<!-- nowa wersja -->\n");
    second.state.delay = 4500;
    await p2.reload();
    await p2.waitForTimeout(800);
    t.ok("start ze starej kopii nie pokazuje paska od razu", (await p2.locator(".upd-bar").count()) === 0);
    await p2.waitForTimeout(6500);
    t.ok("po dotarciu nowej wersji pojawia się pasek „Odśwież”", (await p2.locator(".upd-bar").count()) === 1);
    second.state.delay = 0;
    await p2.click(".upd-bar .btn");
    await p2.waitForTimeout(1500);
    t.ok("po kliknięciu „Odśwież” pasek znika", (await p2.locator(".upd-bar").count()) === 0);
    await c2.close();
    second.server.close();
    fs.rmSync(tmp, { recursive: true, force: true });
    await ctx.close();
  }

  await browser.close();
  server.close();
  process.exit(t.summary() ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
