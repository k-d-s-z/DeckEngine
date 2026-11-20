// Składa index.html ze źródeł w src/. Użycie: node build.mjs [--min]
//   --min  dodatkowo usuwa białe znaki z kodu aplikacji (wymaga esbuild; opcjonalne)
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const root = dirname(fileURLToPath(import.meta.url));
const src = (...p) => join(root, "src", ...p);
const text = (...p) => readFileSync(src(...p), "utf8");
const b64 = (...p) => readFileSync(src(...p)).toString("base64");

// Style: kolejność plików z src/styles/ORDER.txt, sklejone bez zmian.
const order = text("styles", "ORDER.txt").split("\n").filter(Boolean);
for (const f of readdirSync(src("styles")))
  if (f.endsWith(".css") && !order.includes(f.slice(0, -4))) throw new Error(`Plik ${f} nie jest w ORDER.txt`);
const css = order
  .map((n) => text("styles", n + ".css"))
  .join("")
  .replace("@@FONT_REGULAR@@", b64("fonts", "DEMono-Regular.woff"))
  .replace("@@FONT_BOLD@@", b64("fonts", "DEMono-Bold.woff"));

// Kod aplikacji + słownik angielski.
let app = text("app.js");
const marker = "/*@I18N_EN@*/{}";
const marker2 = "/*@I18N_EN@*/ {}"; // taki zapis daje prettier
const dict = JSON.stringify(JSON.parse(text("i18n", "en.json")));
if (app.includes(marker)) app = app.replace(marker, () => dict);
else if (app.includes(marker2)) app = app.replace(marker2, () => dict);
else throw new Error("Brak znacznika /*@I18N_EN@*/ w src/app.js");
if (process.argv.includes("--min")) {
  // Słownik jest już wstawiony – esbuild usuwa komentarze, więc minifikacja musi być po podmianie.
  const local = join(root, "node_modules", ".bin", "esbuild");
  app = execFileSync(existsSync(local) ? local : "esbuild", ["--minify-whitespace", "--loader=js"], {
    input: app,
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
}
app = app.replace(/\n+$/, "");

const html = text("template.html")
  .replace("@@STYLES@@", () => css)
  .replace("@@PDFJS_MAIN@@", b64("vendor", "pdfjs.main.js"))
  .replace("@@PDFJS_WORKER@@", b64("vendor", "pdfjs.worker.js"))
  .replace("@@APP@@", () => app);

writeFileSync(join(root, "index.html"), html);
console.log(`index.html: ${(html.length / 1024 / 1024).toFixed(2)} MB`);
