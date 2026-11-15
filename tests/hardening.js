// Testy odporności importu: złośliwe/uszkodzone ZIP-y, manifest kopii, duże PDF-y. Uruchom: npm run test:hardening
const zlib = require("node:zlib");
const { serve, reporter, newPage, chromium } = require("./helpers");
const { png, zip, crc32, multiPagePdf } = require("./fixtures");

const toastTexts = async (page, ms = 2500) => {
  const seen = new Set();
  const end = Date.now() + ms;
  while (Date.now() < end) {
    for (const x of await page.locator(".toast").allInnerTexts()) seen.add(x.replace(/\s+/g, " ").trim());
    await page.waitForTimeout(150);
  }
  return [...seen].join(" | ");
};

(async () => {
  const t = reporter();
  const { server, url } = await serve();
  const browser = await chromium.launch();
  const base = url + "index.html";
  const P = png(40, 56, [100, 140, 60]);
  const manifestZip = (manifest, extra = []) =>
    zip([{ name: "manifest.json", data: Buffer.from(typeof manifest === "string" ? manifest : JSON.stringify(manifest)) }, ...extra]);

  // Stałe formatu kopii zapasowej (Ie i Re w src/app.js).
  const real = { format: "automa-deck-backup", version: 1 };
  const manifest = (games) => ({ format: real.format, version: real.version, games });

  async function freshGame(width = 1000) {
    const c = await newPage(browser, { width, height: 800 });
    await c.page.goto(base);
    await c.page.click(".game.new");
    await c.page.fill("dialog input", "H");
    await c.page.click('dialog button:has-text("Utwórz")');
    await c.page.waitForSelector("text=/Dodaj karty/");
    return c;
  }
  async function pick(page, label, files) {
    await page.click("text=/Dodaj karty/");
    await page.waitForTimeout(250);
    const [fc] = await Promise.all([page.waitForEvent("filechooser"), page.click(`text=${label}`)]);
    await fc.setFiles(files);
  }
  const zfile = (buf) => ({ name: "t.zip", mimeType: "application/zip", buffer: buf });
  const alive = async (page) => (await page.evaluate(() => 1 + 1).catch(() => 0)) === 2;

  // ------------------------------------------------------------------ ZIP: obrazy
  t.section("ZIP z obrazami: kontrola poprawna i przypadki złośliwe");
  {
    const c = await freshGame();
    const imgs = (m) => [0, 1, 2].map((i) => ({ name: `c${i}.png`, data: png(40, 56, [60 + i * 40, 90, 120]), method: m }));
    await pick(c.page, "Obrazy lub ZIP z obrazami", zfile(zip([...imgs(8).slice(0, 2), { ...imgs(0)[2] }])));
    await c.page.waitForSelector(".tile", { timeout: 20000 });
    t.ok("poprawny ZIP (deflate + stored) importuje 3 karty", (await c.page.locator(".tile").count()) === 3);
    await c.ctx.close();
  }
  const bad = [
    ["zip bomba (rozmiar zgodny z prawdą: 200 MB)", () => { const z = Buffer.alloc(200e6); return zip([{ name: "b.png", data: z }]); }, /nie udało|za duży|uszkodz/i],
    ["zip bomba (zaniżony rozmiar w nagłówku)", () => { const z = Buffer.alloc(200e6); return zip([{ name: "b.png", data: z, usize: 5000, crc: 0 }]); }, /nie udało|uszkodz/i],
    ["błędna suma CRC32", () => zip([{ name: "c.png", data: P, crc: 12345 }]), /nie udało|uszkodz/i],
    ["wpis zaszyfrowany", () => zip([{ name: "e.png", data: P, flags: 1 }]), /nie udało|zaszyfr/i],
    ["niezgodny rozmiar wpisu (stored)", () => zip([{ name: "s.png", data: P, method: 0, usize: P.length + 10 }]), /nie udało|uszkodz/i],
  ];
  for (const [name, make, re] of bad) {
    const c = await freshGame();
    const t0 = Date.now();
    await pick(c.page, "Obrazy lub ZIP z obrazami", zfile(make()));
    const txt = await toastTexts(c.page, 3500);
    t.ok(`${name}: odrzucony z komunikatem`, re.test(txt), txt);
    t.ok(`${name}: nic nie dodano`, (await c.page.locator(".tile").count()) === 0);
    t.ok(`${name}: aplikacja nadal reaguje (${Math.round((Date.now() - t0) / 100) / 10} s)`, (await alive(c.page)) && Date.now() - t0 < 20000);
    await c.ctx.close();
  }
  const structural = [
    ["ucięty plik ZIP", () => { const z = zip([{ name: "a.png", data: P }]); return z.subarray(0, z.length - 30); }],
    ["zduplikowane nazwy", () => zip([{ name: "a.png", data: P }, { name: "a.png", data: P }])],
    ["wpisy zachodzące na siebie", () => zip([{ name: "a.png", data: P }, { name: "b.png", data: P, offset: 0 }])],
    ["fałszywa liczba wpisów w katalogu", () => zip([{ name: "a.png", data: P }], { cdCount: 500 })],
  ];
  for (const [name, make] of structural) {
    const c = await freshGame();
    await pick(c.page, "Obrazy lub ZIP z obrazami", zfile(make()));
    const txt = await toastTexts(c.page, 2500);
    t.ok(`${name}: odrzucony`, /błąd|uszkodz|nie jest poprawny|zduplikow/i.test(txt) || (await c.page.locator(".tile").count()) === 0, txt);
    t.ok(`${name}: nic nie dodano`, (await c.page.locator(".tile").count()) === 0);
    await c.ctx.close();
  }

  // ------------------------------------------------------------------ manifest kopii zapasowej
  t.section("Kopia zapasowa: złośliwy manifest");
  const restore = async (buf) => {
    const c = await newPage(browser);
    await c.page.goto(base);
    const [fc] = await Promise.all([c.page.waitForEvent("filechooser"), c.page.click('button[title^="Wczytaj kopię"]')]);
    await fc.setFiles(zfile(buf));
    const txt = await toastTexts(c.page, 3000);
    const games = await c.page.locator(".game:not(.new)").count();
    await c.ctx.close();
    return { txt, games };
  };
  {
    const g = (n) => ({ id: "g" + n, name: "G" + n, cards: [] });
    let r = await restore(manifestZip(manifest(Array.from({ length: 201 }, (_, i) => g(i)))));
    t.ok("201 gier w manifeście: odrzucone", /zbyt wiele gier/i.test(r.txt) && r.games === 0, r.txt);
    r = await restore(manifestZip(manifest([{ id: "x", name: "X", cards: Array.from({ length: 3001 }, (_, i) => ({ id: "c" + i, file: "none.png" })) }])));
    t.ok("3001 kart w grze: odrzucone", /zbyt wiele kart/i.test(r.txt) && r.games === 0, r.txt);
    r = await restore(manifestZip("x".repeat(6e6)));
    t.ok("manifest > 5 MB: odrzucony", /za duży|uszkodz|nie udało|błąd/i.test(r.txt) && r.games === 0, r.txt);
    r = await restore(manifestZip("{ to nie jest json"));
    t.ok("uszkodzony JSON: czytelny komunikat", /manifest\.json jest uszkodzony/i.test(r.txt), r.txt);
    r = await restore(manifestZip({ format: "inny", version: 1, games: [] }));
    t.ok("obcy format: komunikat", /Nieznany format/i.test(r.txt), r.txt);
    r = await restore(zip([{ name: "a.png", data: P }]));
    t.ok("ZIP bez manifestu: komunikat", /manifest\.json/i.test(r.txt), r.txt);
    // poprawny manifest ze „złymi” polami – ma zostać oczyszczony, nie zepsuć importu
    r = await restore(
      manifestZip(
        manifest([{ id: "ok1", name: "N".repeat(500), notes: "n".repeat(50000), drawCount: 99, orientation: "<script>", createdAt: "abc", cards: [{ id: "c1", file: "k.png", name: "K", copies: 9999 }] }]),
        [{ name: "k.png", data: P }],
      ),
    );
    t.ok("pola spoza zakresu są oczyszczane, gra się importuje", r.games === 1, r.txt);
  }

  // ------------------------------------------------------------------ PDF
  t.section("PDF: limity, anulowanie, duże dokumenty");
  {
    const c = await freshGame();
    await pick(c.page, "PDF lub arkusz do pocięcia", { name: "duzy.pdf", mimeType: "application/pdf", buffer: multiPagePdf(1001) });
    const txt = await toastTexts(c.page, 5000);
    t.ok("PDF z 1001 stronami: twardy limit 1000", /limit 1000/.test(txt), txt);
    t.ok("brak okna importu po odrzuceniu", (await c.page.locator(".importer").count()) === 0);
    t.ok("aplikacja nadal reaguje", await alive(c.page));
    await c.ctx.close();
  }
  {
    const c = await freshGame();
    await pick(c.page, "PDF lub arkusz do pocięcia", { name: "160.pdf", mimeType: "application/pdf", buffer: multiPagePdf(160) });
    await c.page.waitForSelector("dialog[open]", { timeout: 20000 });
    t.ok("PDF 160 stron: pytanie o potwierdzenie", /Duży import/.test(await c.page.locator("dialog[open]").innerText()));
    await c.page.click('dialog[open] button:has-text("Kontynuuj")');
    await c.page.waitForSelector(".busy .btn", { timeout: 20000 });
    await c.page.waitForTimeout(1500);
    const t0 = Date.now();
    await c.page.click(".busy .btn");
    await c.page.waitForFunction(() => !document.querySelector(".busy"), null, { timeout: 15000 }).catch(() => {});
    const txt = await toastTexts(c.page, 1500);
    t.ok(`anulowanie w trakcie analizy 160 stron (${Math.round((Date.now() - t0) / 100) / 10} s)`, (await c.page.locator(".busy").count()) === 0 && /przerwany/i.test(txt), txt);
    t.ok("po anulowaniu nie ma okna importu", (await c.page.locator(".importer").count()) === 0);
    t.ok("aplikacja nadal reaguje", await alive(c.page));
    await c.ctx.close();
  }
  {
    const c = await freshGame();
    await pick(c.page, "PDF lub arkusz do pocięcia", { name: "zly.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4\nto nie jest prawdziwy pdf\n") });
    const txt = await toastTexts(c.page, 4000);
    t.ok("uszkodzony PDF: czytelny komunikat zamiast zawieszenia", /nie udało się otworzyć|nie znaleziono|błąd/i.test(txt), txt);
    t.ok("aplikacja nadal reaguje", await alive(c.page));
    await c.ctx.close();
  }

  await browser.close();
  server.close();
  process.exit(t.summary() ? 0 : 1);
})().catch((e) => {
  console.error(e);
  process.exit(2);
});
